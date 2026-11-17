import { ErrorCode } from '@repo/shared';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { type Prisma, prisma } from '@repo/database';
import type {
  CarryForwardOptions,
  MonthClosePreviewResponse,
  MonthResponse,
  MonthSummaryResponse,
} from '@repo/shared';
import {
  computeMemberSummaries,
  roundMoney,
  type SummaryInputs,
} from './month-summary';
import { CacheService } from '../common/cache/cache.service';

type CarryForwardSource = { member_id: string; final_balance: number };

@Injectable()
export class MonthsService {
  private readonly logger = new Logger(MonthsService.name);

  constructor(private readonly cache: CacheService = new CacheService()) {}

  getActiveMonth(messId: string): Promise<MonthResponse | null> {
    return this.cache.remember(messId, 'live', 'active-month', () =>
      this.loadActiveMonth(messId),
    );
  }

  private async loadActiveMonth(messId: string): Promise<MonthResponse | null> {
    const month = await prisma.months.findFirst({
      where: {
        mess_id: messId,
        month_status: 'ACTIVE',
        deleted_at: null,
      },
    });

    if (!month) return null;

    return this.mapMonthResponse(month);
  }

  async createMonth(
    messId: string,
    actorId: string,
    title?: string,
    carryForward?: CarryForwardOptions,
  ): Promise<MonthResponse> {
    const membership = await prisma.mess_members.findFirst({
      where: {
        mess_id: messId,
        user_id: actorId,
        mess_role: 'MANAGER',
        removed_at: null,
        deleted_at: null,
      },
      select: { id: true },
    });

    if (!membership) {
      throw new ForbiddenException({
        message: 'Only managers can create months',
        code: ErrorCode.MANAGER_ONLY,
      });
    }

    const activeMonth = await prisma.months.findFirst({
      where: {
        mess_id: messId,
        month_status: 'ACTIVE',
        deleted_at: null,
      },
    });

    const now = new Date();

    // Starting a month closes the current one, which cannot be undone. A
    // repeated request right after a month was opened is almost certainly a
    // double submit (slow response, second click), so refuse it.
    if (
      activeMonth &&
      now.getTime() - activeMonth.started_at.getTime() < 60_000
    ) {
      throw new ConflictException({
        message: `"${activeMonth.title}" was started less than a minute ago. Refresh the page to see it.`,
        code: ErrorCode.MONTH_ALREADY_ACTIVE,
      });
    }

    const monthTitle = await this.uniqueMonthTitle(
      messId,
      title?.trim() ||
        now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    );

    // Close, summaries, new month, carry forward and logs succeed or fail
    // together (ADR-008). Without this a failure after the close would leave
    // the mess with no active month and balances that never carried over.
    const month = await prisma.$transaction(
      async (tx) => {
        let carryRows: CarryForwardSource[] = [];
        if (activeMonth) {
          carryRows = await this.closeMonthTx(
            tx,
            messId,
            activeMonth.id,
            actorId,
          );
        }

        const created = await tx.months.create({
          data: {
            mess_id: messId,
            title: monthTitle,
            month_status: 'ACTIVE',
            started_at: now,
            created_by: actorId,
          },
        });

        if (activeMonth) {
          await this.generateCarryForward(
            tx,
            activeMonth.id,
            created.id,
            this.selectCarryRows(carryRows, carryForward),
          );
        }

        await tx.activity_logs.create({
          data: {
            mess_id: messId,
            month_id: created.id,
            actor_id: actorId,
            action: 'MONTH_OPENED',
            entity_type: 'months',
            entity_id: created.id,
          },
        });

        return created;
      },
      { timeout: 20_000, maxWait: 10_000 },
    );

    this.logger.log(`✅ Month created: ${month.id} (${monthTitle})`);

    return this.mapMonthResponse(month);
  }

  /**
   * Archives the month and writes every member's summary. Runs inside the
   * caller's transaction. The status-guarded update comes first and acts as
   * a lock: the data is read only after the claim, so an entry saved while
   * the month was closing cannot be left out of the bill.
   *
   * Returns the balances of members still in the mess, for carry forward.
   */
  private async closeMonthTx(
    tx: Prisma.TransactionClient,
    messId: string,
    monthId: string,
    actorId: string,
  ): Promise<CarryForwardSource[]> {
    const closedAt = new Date();
    const claimed = await tx.months.updateMany({
      where: {
        id: monthId,
        mess_id: messId,
        month_status: 'ACTIVE',
        deleted_at: null,
      },
      data: {
        month_status: 'ARCHIVED',
        ended_at: closedAt,
        updated_at: closedAt,
      },
    });

    if (claimed.count === 0) {
      throw new ConflictException({
        message: 'This month has already been closed',
        code: ErrorCode.MONTH_ALREADY_CLOSED,
      });
    }

    // Bazaar still waiting for approval can't be billed any more: reject it
    // with the month, so it can never add an expense to a closed month.
    const pendingBazaar = await tx.bazaar_submissions.findMany({
      where: { month_id: monthId, status: 'PENDING', deleted_at: null },
      select: { id: true },
    });
    if (pendingBazaar.length > 0) {
      await tx.bazaar_submissions.updateMany({
        where: {
          id: { in: pendingBazaar.map((b) => b.id) },
          status: 'PENDING',
        },
        data: {
          status: 'REJECTED',
          approved_by: actorId,
          approved_at: closedAt,
          updated_at: closedAt,
        },
      });
      await tx.activity_logs.createMany({
        data: pendingBazaar.map((b) => ({
          mess_id: messId,
          month_id: monthId,
          actor_id: actorId,
          action: 'BAZAAR_REJECTED' as const,
          entity_type: 'bazaar_submissions',
          entity_id: b.id,
          created_at: closedAt,
        })),
      });
    }

    const inputs = await this.loadSummaryInputs(tx, messId, monthId);
    const activeMemberIds = inputs.activeMemberIds;
    const { rows } = computeMemberSummaries(monthId, inputs);

    if (rows.length > 0) {
      await tx.member_month_summaries.createMany({ data: rows });
    }

    await tx.activity_logs.create({
      data: {
        mess_id: messId,
        month_id: monthId,
        actor_id: actorId,
        action: 'MONTH_CLOSED',
        entity_type: 'months',
        entity_id: monthId,
      },
    });

    this.logger.log(`✅ Month closed: ${monthId}`);

    // Removed members keep their summary (what they owe or are owed) but
    // are not carried into a month they are no longer part of.
    const stillActive = new Set(activeMemberIds);
    return rows
      .filter((r) => stillActive.has(r.member_id))
      .map((r) => ({ member_id: r.member_id, final_balance: r.final_balance }));
  }

  /**
   * Everything the month-close maths needs. Used by the real close (inside
   * its transaction) and by the preview, so both always agree.
   */
  private async loadSummaryInputs(
    db: Prisma.TransactionClient,
    messId: string,
    monthId: string,
  ): Promise<SummaryInputs & { activeMemberIds: string[] }> {
    // Sequential on purpose: inside an interactive transaction the queries
    // share one connection anyway.
    const activeMembers = await db.mess_members.findMany({
      where: { mess_id: messId, removed_at: null, deleted_at: null },
      select: { id: true },
    });
    const mealEntries = await db.meal_entries.findMany({
      where: { month_id: monthId, deleted_at: null },
      select: { member_id: true, total_meal: true },
    });
    const expenses = await db.expenses.findMany({
      where: { month_id: monthId, mess_id: messId },
      select: {
        type: true,
        amount: true,
        members: { select: { member_id: true, allocated_amount: true } },
      },
    });
    // Soft-deleted deposits must not be credited to anyone.
    const deposits = await db.deposits.findMany({
      where: { month_id: monthId, mess_id: messId, deleted_at: null },
      select: { member_id: true, amount: true },
    });
    const carries = await db.carry_forward_balances.findMany({
      where: { target_month_id: monthId },
      select: { member_id: true, amount: true, carry_forward_type: true },
    });

    return {
      activeMemberIds: activeMembers.map((m) => m.id),
      mealEntries,
      expenses,
      deposits,
      carries,
    };
  }

  /**
   * Shows managers each member's final balance before they close the month,
   * so they can choose what to carry. Nothing is saved. Pending bazaar is not
   * counted: closing rejects it.
   */
  async getClosePreview(messId: string): Promise<MonthClosePreviewResponse> {
    const month = await prisma.months.findFirst({
      where: { mess_id: messId, month_status: 'ACTIVE', deleted_at: null },
      select: { id: true, title: true },
    });
    if (!month) {
      throw new NotFoundException({
        message: 'No active month to close',
        code: ErrorCode.NO_ACTIVE_MONTH,
      });
    }

    const inputs = await this.loadSummaryInputs(prisma, messId, month.id);
    const pendingBazaarCount = await prisma.bazaar_submissions.count({
      where: { month_id: month.id, status: 'PENDING', deleted_at: null },
    });
    const { mealRate, rows } = computeMemberSummaries(month.id, inputs);
    const active = new Set(inputs.activeMemberIds);

    const members = await prisma.mess_members.findMany({
      where: { id: { in: [...active] } },
      select: {
        id: true,
        user: { select: { id: true, name: true, avatar: true } },
      },
    });
    const userByMember = new Map(members.map((m) => [m.id, m.user]));

    return {
      month_id: month.id,
      title: month.title,
      meal_rate: roundMoney(mealRate),
      pending_bazaar_count: pendingBazaarCount,
      members: rows
        .filter((r) => active.has(r.member_id) && userByMember.has(r.member_id))
        .map((r) => ({
          member_id: r.member_id,
          user: userByMember.get(r.member_id)!,
          final_bill: r.final_bill,
          deposit_amount: r.deposit_amount,
          final_balance: r.final_balance,
        }))
        .sort((a, b) => a.user.name.localeCompare(b.user.name)),
    };
  }

  /**
   * Applies the manager's carry choices. The month summary always keeps the
   * real final balance; this only decides what moves into the new month.
   */
  private selectCarryRows(
    rows: CarryForwardSource[],
    options?: CarryForwardOptions,
  ): CarryForwardSource[] {
    if (!options) return rows;
    if (!options.enabled) return [];
    const excluded = new Set(options.excludeMemberIds);
    return rows.filter((r) => !excluded.has(r.member_id));
  }

  private async generateCarryForward(
    tx: Prisma.TransactionClient,
    sourceMonthId: string,
    targetMonthId: string,
    balances: CarryForwardSource[],
  ): Promise<void> {
    const rows = balances
      .filter(({ final_balance }) => final_balance !== 0)
      .map(({ member_id, final_balance }) => ({
        source_month_id: sourceMonthId,
        target_month_id: targetMonthId,
        member_id,
        amount: Math.abs(final_balance),
        carry_forward_type:
          final_balance > 0
            ? ('PREVIOUS_BALANCE' as const)
            : ('PREVIOUS_DUE' as const),
      }));

    if (rows.length > 0) {
      await tx.carry_forward_balances.createMany({ data: rows });
    }
  }

  /**
   * Month titles are how people pick a month in lists and report selectors,
   * so two months in one mess must never share a title. A clash gets a
   * numeric suffix: "November 2026", "November 2026 (2)", ...
   */
  private async uniqueMonthTitle(
    messId: string,
    baseTitle: string,
  ): Promise<string> {
    const existing = await prisma.months.findMany({
      where: {
        mess_id: messId,
        deleted_at: null,
        title: { startsWith: baseTitle },
      },
      select: { title: true },
    });
    const taken = new Set(existing.map((m) => m.title));

    if (!taken.has(baseTitle)) return baseTitle;

    let n = 2;
    while (taken.has(`${baseTitle} (${n})`)) n += 1;
    return `${baseTitle} (${n})`;
  }

  getMonthHistory(messId: string): Promise<MonthResponse[]> {
    return this.cache.remember(messId, 'live', 'month-history', () =>
      this.loadMonthHistory(messId),
    );
  }

  private async loadMonthHistory(messId: string): Promise<MonthResponse[]> {
    const months = await prisma.months.findMany({
      where: {
        mess_id: messId,
        deleted_at: null,
      },
      orderBy: { started_at: 'desc' },
    });

    return months.map((m) => this.mapMonthResponse(m));
  }

  /**
   * A closed month's report never changes, so it is cached for days (only
   * renamed or removed members clear it); an active month's report is
   * cleared by the next write.
   */
  getMonthSummary(
    messId: string,
    monthId: string,
  ): Promise<MonthSummaryResponse> {
    return this.cache.rememberMonth(
      messId,
      `month-summary:${monthId}`,
      async () => {
        const value = await this.loadMonthSummary(messId, monthId);
        return { value, closed: value.month.month_status !== 'ACTIVE' };
      },
    );
  }

  private async loadMonthSummary(
    messId: string,
    monthId: string,
  ): Promise<MonthSummaryResponse> {
    const month = await prisma.months.findFirst({
      where: {
        id: monthId,
        mess_id: messId,
        deleted_at: null,
      },
    });

    if (!month) {
      throw new NotFoundException({
        message: 'Month not found',
        code: ErrorCode.MONTH_NOT_FOUND,
      });
    }

    const [summaries, mealAgg, expenseGroups, depositAgg, carries, closeLog] =
      await Promise.all([
        prisma.member_month_summaries.findMany({
          where: { month_id: monthId },
          include: {
            member: {
              select: {
                removed_at: true,
                deleted_at: true,
                user: {
                  select: { id: true, name: true, email: true, avatar: true },
                },
              },
            },
          },
        }),
        prisma.meal_entries.aggregate({
          where: { month_id: monthId, deleted_at: null },
          _sum: { total_meal: true },
        }),
        prisma.expenses.groupBy({
          by: ['type'],
          where: { month_id: monthId, mess_id: messId },
          _sum: { amount: true },
        }),
        prisma.deposits.aggregate({
          where: { month_id: monthId, mess_id: messId, deleted_at: null },
          _sum: { amount: true },
        }),
        prisma.carry_forward_balances.findMany({
          where: { target_month_id: monthId },
          select: { member_id: true, amount: true, carry_forward_type: true },
        }),
        prisma.activity_logs.findFirst({
          where: { month_id: monthId, action: 'MONTH_CLOSED' },
          orderBy: { created_at: 'desc' },
          select: { actor: { select: { id: true, name: true } } },
        }),
      ]);

    const expenseByType = (type: string) =>
      Number(expenseGroups.find((g) => g.type === type)?._sum.amount ?? 0);
    const bazaarCost = expenseByType('BAZAAR');
    const sharedCost = expenseByType('SHARED');
    const individualCost = expenseByType('INDIVIDUAL');
    const totalMeals = Number(mealAgg._sum.total_meal ?? 0);

    const carriedIn = new Map<string, number>();
    let carriedInBalance = 0;
    let carriedInDue = 0;
    for (const c of carries) {
      const amount = Number(c.amount);
      const signed =
        c.carry_forward_type === 'PREVIOUS_BALANCE' ? amount : -amount;
      if (signed > 0) carriedInBalance += amount;
      else carriedInDue += amount;
      carriedIn.set(c.member_id, (carriedIn.get(c.member_id) ?? 0) + signed);
    }

    const memberSummaries = summaries
      .map((s) => ({
        id: s.id,
        member_id: s.member_id,
        user: s.member.user,
        total_meals: s.total_meals,
        meal_cost: Number(s.meal_cost),
        shared_cost: Number(s.shared_cost),
        individual_cost: Number(s.individual_cost),
        deposit_amount: Number(s.deposit_amount),
        final_bill: Number(s.final_bill),
        final_balance: Number(s.final_balance),
        carried_in: roundMoney(carriedIn.get(s.member_id) ?? 0),
        removed: s.member.removed_at !== null || s.member.deleted_at !== null,
      }))
      .sort((a, b) => a.user.name.localeCompare(b.user.name));

    let totalDue = 0;
    let totalCredit = 0;
    for (const m of memberSummaries) {
      if (m.final_balance < 0) totalDue += -m.final_balance;
      else totalCredit += m.final_balance;
    }

    return {
      month: this.mapMonthResponse(month),
      totals: {
        member_count: memberSummaries.length,
        total_meals: totalMeals,
        meal_rate: roundMoney(totalMeals > 0 ? bazaarCost / totalMeals : 0),
        bazaar_cost: roundMoney(bazaarCost),
        shared_cost: roundMoney(sharedCost),
        individual_cost: roundMoney(individualCost),
        total_expense: roundMoney(bazaarCost + sharedCost + individualCost),
        total_deposits: roundMoney(Number(depositAgg._sum.amount ?? 0)),
        carried_in_balance: roundMoney(carriedInBalance),
        carried_in_due: roundMoney(carriedInDue),
        total_due: roundMoney(totalDue),
        total_credit: roundMoney(totalCredit),
        closed_by: closeLog?.actor ?? null,
      },
      member_summaries: memberSummaries,
    };
  }

  private mapMonthResponse(
    month: Prisma.monthsGetPayload<object>,
  ): MonthResponse {
    return {
      id: month.id,
      mess_id: month.mess_id,
      title: month.title,
      month_status: month.month_status,
      started_at: month.started_at.toISOString(),
      ended_at: month.ended_at?.toISOString() ?? null,
      created_by: month.created_by,
      created_at: month.created_at.toISOString(),
      updated_at: month.updated_at.toISOString(),
    };
  }
}
