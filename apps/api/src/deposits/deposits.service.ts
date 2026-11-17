import { ErrorCode } from '@repo/shared';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, prisma } from '@repo/database';
import type {
  CreateDepositDto,
  DepositListResponse,
  DepositMemberSummary,
  DepositSummaryResponse,
  DepositWithRelations,
  UpdateDepositDto,
} from '@repo/shared';

const userSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
} as const;

const memberUserSelect = {
  id: true,
  user: {
    select: {
      name: true,
      email: true,
      avatar: true,
    },
  },
} as const;

const depositInclude = {
  creator: { select: userSelect },
  member: { select: memberUserSelect },
} satisfies Prisma.depositsInclude;

type DepositRow = Prisma.depositsGetPayload<{
  include: typeof depositInclude;
}>;

function toDepositWithRelations(row: DepositRow): DepositWithRelations {
  return {
    id: row.id,
    mess_id: row.mess_id,
    month_id: row.month_id,
    member_id: row.member_id,
    amount: Number(row.amount),
    deposit_date: row.deposit_date.toISOString(),
    created_by: row.created_by,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    member: {
      id: row.member.id,
      name: row.member.user.name,
      email: row.member.user.email,
      avatar: row.member.user.avatar,
    },
    creator: {
      id: row.creator.id,
      name: row.creator.name,
      email: row.creator.email,
      avatar: row.creator.avatar,
    },
  };
}

@Injectable()
export class DepositsService {
  private readonly logger = new Logger(DepositsService.name);

  private async requireManager(messId: string, actorId: string) {
    const membership = await prisma.mess_members.findFirst({
      where: {
        mess_id: messId,
        user_id: actorId,
        mess_role: 'MANAGER',
        removed_at: null,
        deleted_at: null,
      },
    });

    if (!membership) {
      throw new ForbiddenException({
        message: 'Only managers can manage deposits',
        code: ErrorCode.MANAGER_ONLY,
      });
    }
  }

  private async findActiveMonth(messId: string, monthId?: string) {
    const month = await prisma.months.findFirst({
      where: {
        id: monthId,
        mess_id: messId,
        month_status: 'ACTIVE',
        deleted_at: null,
      },
    });

    if (!month) {
      throw new NotFoundException({
        message: 'Active month not found',
        code: ErrorCode.NO_ACTIVE_MONTH,
      });
    }

    return month;
  }

  private async resolveMember(messId: string, memberId: string) {
    const member = await prisma.mess_members.findFirst({
      where: {
        id: memberId,
        mess_id: messId,
        removed_at: null,
        deleted_at: null,
      },
    });

    if (!member) {
      throw new BadRequestException({
        message: 'Selected member is not an active member of this mess',
        code: ErrorCode.MEMBER_NOT_ACTIVE,
      });
    }

    return member;
  }

  async createDeposit(
    messId: string,
    monthId: string,
    actorId: string,
    data: CreateDepositDto,
  ): Promise<DepositWithRelations> {
    await this.requireManager(messId, actorId);
    const month = await this.findActiveMonth(messId, monthId);
    await this.resolveMember(messId, data.member_id);

    const created = await prisma.$transaction(async (tx) => {
      const deposit = await tx.deposits.create({
        data: {
          mess_id: messId,
          month_id: month.id,
          member_id: data.member_id,
          amount: data.amount,
          deposit_date: new Date(data.deposit_date),
          created_by: actorId,
        },
        include: depositInclude,
      });

      await tx.activity_logs.create({
        data: {
          mess_id: messId,
          month_id: month.id,
          actor_id: actorId,
          action: 'DEPOSIT_ADDED',
          entity_type: 'deposits',
          entity_id: deposit.id,
        },
      });

      return deposit;
    });

    this.logger.log(
      `✅ Deposit created: ${created.id} - ${Number(created.amount)}`,
    );
    return toDepositWithRelations(created);
  }

  async listDeposits(
    messId: string,
    monthId: string,
    actorId: string,
  ): Promise<DepositListResponse> {
    const membership = await prisma.mess_members.findFirst({
      where: {
        mess_id: messId,
        user_id: actorId,
        removed_at: null,
        deleted_at: null,
      },
    });

    if (!membership) {
      throw new ForbiddenException({
        message: 'You must be an active member to view deposits',
        code: ErrorCode.NOT_MESS_MEMBER,
      });
    }

    await this.findActiveMonth(messId, monthId);

    const rows = await prisma.deposits.findMany({
      where: { mess_id: messId, month_id: monthId, deleted_at: null },
      include: depositInclude,
      orderBy: { deposit_date: 'desc' },
    });

    const items = rows.map(toDepositWithRelations);

    const total =
      Math.round(items.reduce((sum, d) => sum + d.amount, 0) * 100) / 100;

    return {
      items,
      total,
      count: items.length,
    };
  }

  async getDepositSummary(
    messId: string,
    monthId: string,
    actorId: string,
  ): Promise<DepositSummaryResponse> {
    const membership = await prisma.mess_members.findFirst({
      where: {
        mess_id: messId,
        user_id: actorId,
        removed_at: null,
        deleted_at: null,
      },
    });

    if (!membership) {
      throw new ForbiddenException({
        message: 'You must be an active member to view deposit reports',
        code: ErrorCode.NOT_MESS_MEMBER,
      });
    }

    await this.findActiveMonth(messId, monthId);

    const rows = await prisma.deposits.findMany({
      where: { mess_id: messId, month_id: monthId, deleted_at: null },
      include: depositInclude,
      orderBy: { deposit_date: 'desc' },
    });

    const round = (n: number) => Math.round(n * 100) / 100;

    let total = 0;
    const memberMap = new Map<string, DepositMemberSummary>();

    for (const row of rows) {
      const amount = Number(row.amount);
      total = round(total + amount);

      const current =
        memberMap.get(row.member_id) ??
        this.emptyMemberSummary(row.member_id, row.member);
      current.amount = round(current.amount + amount);
      current.count += 1;
      memberMap.set(row.member_id, current);
    }

    return {
      total,
      count: rows.length,
      per_member: Array.from(memberMap.values()).sort((a, b) =>
        a.user.name.localeCompare(b.user.name),
      ),
    };
  }

  private emptyMemberSummary(
    memberId: string,
    member: {
      id: string;
      user: { name: string; email: string; avatar: string | null };
    },
  ): DepositMemberSummary {
    return {
      member_id: memberId,
      user: {
        id: member.id,
        name: member.user.name,
        email: member.user.email,
        avatar: member.user.avatar,
      },
      amount: 0,
      count: 0,
    };
  }

  async updateDeposit(
    messId: string,
    depositId: string,
    actorId: string,
    data: UpdateDepositDto,
  ): Promise<DepositWithRelations> {
    await this.requireManager(messId, actorId);

    const existing = await prisma.deposits.findFirst({
      where: { id: depositId, mess_id: messId, deleted_at: null },
      include: { month: { select: { month_status: true } } },
    });

    if (!existing) {
      throw new NotFoundException({
        message: 'Deposit not found',
        code: ErrorCode.DEPOSIT_NOT_FOUND,
      });
    }

    // A closed month is already billed (member summaries, carry forward);
    // changing it would make those numbers wrong.
    if (existing.month.month_status !== 'ACTIVE') {
      throw new ConflictException({
        message: 'This month is closed. Its deposits can no longer be changed.',
        code: ErrorCode.MONTH_ALREADY_CLOSED,
      });
    }

    if (data.member_id && data.member_id !== existing.member_id) {
      await this.resolveMember(messId, data.member_id);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const deposit = await tx.deposits.update({
        where: { id: depositId },
        data: {
          member_id: data.member_id ?? existing.member_id,
          amount: data.amount ?? existing.amount,
          deposit_date: data.deposit_date
            ? new Date(data.deposit_date)
            : existing.deposit_date,
          updated_at: new Date(),
        },
        include: depositInclude,
      });

      await tx.activity_logs.create({
        data: {
          mess_id: messId,
          month_id: existing.month_id,
          actor_id: actorId,
          action: 'DEPOSIT_UPDATED',
          entity_type: 'deposits',
          entity_id: deposit.id,
        },
      });

      return deposit;
    });

    this.logger.log(`✏️ Deposit updated: ${updated.id}`);
    return toDepositWithRelations(updated);
  }

  async deleteDeposit(
    messId: string,
    depositId: string,
    actorId: string,
  ): Promise<{ id: string }> {
    await this.requireManager(messId, actorId);

    const existing = await prisma.deposits.findFirst({
      where: { id: depositId, mess_id: messId, deleted_at: null },
      include: { month: { select: { month_status: true } } },
    });

    if (!existing) {
      throw new NotFoundException({
        message: 'Deposit not found',
        code: ErrorCode.DEPOSIT_NOT_FOUND,
      });
    }

    // A closed month is already billed (member summaries, carry forward);
    // changing it would make those numbers wrong.
    if (existing.month.month_status !== 'ACTIVE') {
      throw new ConflictException({
        message: 'This month is closed. Its deposits can no longer be changed.',
        code: ErrorCode.MONTH_ALREADY_CLOSED,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.deposits.update({
        where: { id: depositId },
        data: { deleted_at: new Date() },
      });

      await tx.activity_logs.create({
        data: {
          mess_id: messId,
          month_id: existing.month_id,
          actor_id: actorId,
          action: 'DEPOSIT_DELETED',
          entity_type: 'deposits',
          entity_id: depositId,
        },
      });
    });

    this.logger.log(`🗑 Deposit deleted: ${depositId}`);
    return { id: depositId };
  }
}
