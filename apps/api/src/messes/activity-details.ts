import { prisma, type Prisma } from '@repo/database';
import type {
  ActivityAction,
  ActivityCategory,
  ActivityDetails,
  ActivityLog,
} from '@repo/shared';

/** Which actions each filter chip of the activity page shows. */
export const CATEGORY_ACTIONS: Record<ActivityCategory, ActivityAction[]> = {
  meals: [
    'MEAL_ADDED',
    'MEAL_UPDATED',
    'MEAL_DELETED',
    'DEFAULT_MEALS_UPDATED',
  ],
  expenses: ['EXPENSE_ADDED', 'EXPENSE_UPDATED', 'EXPENSE_DELETED'],
  deposits: ['DEPOSIT_ADDED', 'DEPOSIT_UPDATED', 'DEPOSIT_DELETED'],
  bazaar: [
    'BAZAAR_SUBMITTED',
    'BAZAAR_UPDATED',
    'BAZAAR_APPROVED',
    'BAZAAR_REJECTED',
    'BAZAAR_DELETED',
  ],
  members: [
    'MEMBER_ADDED',
    'MEMBER_REMOVED',
    'MANAGER_ASSIGNED',
    'MANAGER_REMOVED',
    'MEMBER_BALANCE_CREATED',
  ],
  months: ['MONTH_OPENED', 'MONTH_CLOSED'],
};

export const activityInclude = {
  actor: { select: { id: true, name: true, avatar: true } },
} satisfies Prisma.activity_logsInclude;

type LogRow = Prisma.activity_logsGetPayload<{
  include: typeof activityInclude;
}>;

const money = (n: unknown) => Math.round(Number(n ?? 0) * 100) / 100;
const iso = (d: Date) => d.toISOString();

function idsOf(rows: LogRow[], type: string): string[] {
  return [
    ...new Set(
      rows
        .filter((r) => r.entity_type === type && r.entity_id)
        .map((r) => r.entity_id!),
    ),
  ];
}

/** Drops undefined fields; null when nothing is known. */
function clean(d: ActivityDetails): ActivityDetails | null {
  const out = Object.fromEntries(
    Object.entries(d).filter(([, v]) => v !== undefined && v !== ''),
  ) as ActivityDetails;
  return Object.keys(out).length ? out : null;
}

/**
 * Turns activity rows into API items with a short description of what each
 * was about, looked up from the records they point to: one query per record
 * type on the page, all scoped to the mess. A snapshot saved with the row
 * (`details`, for records deleted outright) is used as is.
 */
export async function describeActivities(
  messId: string,
  rows: LogRow[],
): Promise<ActivityLog[]> {
  const ids = (type: string) => idsOf(rows, type);
  const none = Promise.resolve([] as never[]);
  const pick = <T>(list: string[], query: () => Promise<T[]>) =>
    list.length ? query() : (none as Promise<T[]>);

  const expenseIds = ids('expenses');
  const depositIds = ids('deposits');
  const bazaarIds = ids('bazaar_submissions');
  const mealIds = ids('meal_entries');
  const memberIds = ids('mess_members');
  const inviteIds = ids('join_requests');
  const monthIds = ids('months');
  const mealTypeIds = ids('meal_types');

  const [expenses, deposits, bazaars, meals, members, invites, months, types] =
    await Promise.all([
      pick(expenseIds, () =>
        prisma.expenses.findMany({
          where: { id: { in: expenseIds }, mess_id: messId },
          select: { id: true, title: true, amount: true, expense_date: true },
        }),
      ),
      pick(depositIds, () =>
        prisma.deposits.findMany({
          where: { id: { in: depositIds }, mess_id: messId },
          select: {
            id: true,
            amount: true,
            deposit_date: true,
            member: { select: { user: { select: { name: true } } } },
          },
        }),
      ),
      pick(bazaarIds, () =>
        prisma.bazaar_submissions.findMany({
          where: { id: { in: bazaarIds }, mess_id: messId },
          select: {
            id: true,
            description: true,
            total_amount: true,
            expense_date: true,
            submitter: { select: { name: true } },
          },
        }),
      ),
      pick(mealIds, () =>
        prisma.meal_entries.findMany({
          where: { id: { in: mealIds }, month: { mess_id: messId } },
          select: {
            id: true,
            date: true,
            total_meal: true,
            member: { select: { user: { select: { name: true } } } },
          },
        }),
      ),
      pick(memberIds, () =>
        prisma.mess_members.findMany({
          where: { id: { in: memberIds }, mess_id: messId },
          select: { id: true, user: { select: { name: true } } },
        }),
      ),
      pick(inviteIds, () =>
        prisma.join_requests.findMany({
          where: { id: { in: inviteIds }, mess_id: messId },
          select: { id: true, user: { select: { name: true } } },
        }),
      ),
      pick(monthIds, () =>
        prisma.months.findMany({
          where: { id: { in: monthIds }, mess_id: messId },
          select: { id: true, title: true },
        }),
      ),
      pick(mealTypeIds, () =>
        prisma.meal_types.findMany({
          where: { id: { in: mealTypeIds }, mess_id: messId },
          select: { id: true, name: true },
        }),
      ),
    ]);

  const byId = new Map<string, ActivityDetails>();
  for (const e of expenses) {
    byId.set(e.id, {
      title: e.title,
      amount: money(e.amount),
      date: iso(e.expense_date),
    });
  }
  for (const d of deposits) {
    byId.set(d.id, {
      member: d.member.user.name,
      amount: money(d.amount),
      date: iso(d.deposit_date),
    });
  }
  for (const b of bazaars) {
    byId.set(b.id, {
      title: b.description ?? undefined,
      member: b.submitter.name,
      amount: money(b.total_amount),
      date: iso(b.expense_date),
    });
  }
  for (const m of meals) {
    byId.set(m.id, {
      member: m.member.user.name,
      date: iso(m.date),
      meals: Number(m.total_meal),
    });
  }
  for (const m of members) byId.set(m.id, { member: m.user.name });
  for (const i of invites) byId.set(i.id, { member: i.user.name });
  for (const m of months) byId.set(m.id, { title: m.title });
  for (const t of types) byId.set(t.id, { title: t.name });

  return rows.map((row) => {
    const snapshot =
      row.details && typeof row.details === 'object'
        ? (row.details as ActivityDetails)
        : undefined;
    const looked = row.entity_id ? byId.get(row.entity_id) : undefined;
    return {
      id: row.id,
      action: row.action,
      created_at: iso(row.created_at),
      actor: row.actor,
      details: clean({ ...looked, ...snapshot }),
    };
  });
}
