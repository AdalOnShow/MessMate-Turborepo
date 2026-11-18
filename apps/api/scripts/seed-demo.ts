/**
 * Seeds a realistic demo mess: 8 members, a closed October 2026 and an
 * active November 2026 with meals, bazaar, shared/individual expenses,
 * deposits, month summaries, carry forward and activity logs.
 *
 * Month-close numbers come from the same `computeMemberSummaries` the API
 * uses, so the archived month matches what the app itself would produce.
 *
 *   pnpm --filter api seed:demo -- --dry-run   # print totals, write nothing
 *   pnpm --filter api seed:demo                # seed (refuses if it exists)
 *   pnpm --filter api seed:demo -- --reset     # delete demo data, re-seed
 *
 * Only rows belonging to the demo mess and the @messmate.demo users are
 * ever touched.
 */
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import * as bcrypt from 'bcryptjs';
import { type Prisma, prisma } from '@repo/database';
import { computeMemberSummaries } from '../src/months/month-summary';

config({ path: resolve(__dirname, '../../../.env') });

const DRY_RUN = process.argv.includes('--dry-run');
const RESET = process.argv.includes('--reset');

const MESS_SLUG = 'green-villa-bachelor-mess';
const EMAIL_DOMAIN = '@messmate.demo';
// Never commit the demo password: it would be a known password for every
// seeded account. Pass it in: DEMO_PASSWORD=... pnpm seed:demo
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? '';
if (DEMO_PASSWORD.length < 8) {
  console.error('Set DEMO_PASSWORD (at least 8 characters) to seed demo data.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Deterministic randomness, so every run produces the same mess.
// ---------------------------------------------------------------------------
let seed = 20261001;
function rand(): number {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
const chance = (p: number) => rand() < p;
const between = (min: number, max: number) =>
  Math.round(min + rand() * (max - min));
const roundTo = (n: number, step: number) => Math.round(n / step) * step;

/** Date at a Bangladesh (UTC+6) local time, stored as UTC. */
function bd(y: number, m: number, d: number, hour = 0, min = 0): Date {
  return new Date(Date.UTC(y, m - 1, d, hour - 6, min));
}
/** Meal-entry dates are stored as UTC midnight, like the web app sends. */
const day = (y: number, m: number, d: number) =>
  new Date(Date.UTC(y, m - 1, d));

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------
type Person = {
  key: string;
  name: string;
  email: string;
  phone: string;
  role: 'MANAGER' | 'MEMBER';
  /** Days (by month) the member was away and ate no meals. */
  away: Record<number, [number, number][]>;
  /** How often they skip lunch (office/campus). */
  lunchSkip: number;
  deposits: Record<number, [number, number][]>; // month -> [day, amount]
};

const people: Person[] = [
  {
    key: 'tanvir',
    name: 'Tanvir Ahmed',
    email: `demo.manager${EMAIL_DOMAIN}`,
    phone: '01711000001',
    role: 'MANAGER',
    away: {},
    lunchSkip: 0.15,
    deposits: {
      10: [
        [1, 4000],
        [15, 3000],
      ],
      11: [
        [2, 3000],
        [12, 2500],
      ],
    },
  },
  {
    key: 'rakib',
    name: 'Rakib Hasan',
    email: `rakib${EMAIL_DOMAIN}`,
    phone: '01711000002',
    role: 'MANAGER',
    away: { 11: [[13, 14]] },
    lunchSkip: 0.5,
    deposits: {
      10: [
        [2, 3500],
        [16, 3500],
      ],
      11: [[3, 3000]],
    },
  },
  {
    key: 'sabbir',
    name: 'Sabbir Rahman',
    email: `demo.member${EMAIL_DOMAIN}`,
    phone: '01711000003',
    role: 'MEMBER',
    away: {},
    lunchSkip: 0.1,
    deposits: {
      10: [
        [1, 3000],
        [18, 2500],
      ],
      11: [[4, 3500]],
    },
  },
  {
    key: 'arif',
    name: 'Arif Hossain',
    email: `arif${EMAIL_DOMAIN}`,
    phone: '01711000004',
    role: 'MEMBER',
    away: { 10: [[24, 26]] },
    lunchSkip: 0.6,
    deposits: {
      10: [
        [3, 5000],
        [20, 2000],
      ],
      11: [[1, 4000]],
    },
  },
  {
    key: 'nayeem',
    name: 'Nayeem Islam',
    email: `nayeem${EMAIL_DOMAIN}`,
    phone: '01711000005',
    role: 'MEMBER',
    away: {},
    lunchSkip: 0.2,
    deposits: {
      10: [
        [2, 3000],
        [14, 3000],
      ],
      11: [
        [5, 2000],
        [14, 2000],
      ],
    },
  },
  {
    key: 'fahim',
    name: 'Fahim Chowdhury',
    email: `fahim${EMAIL_DOMAIN}`,
    phone: '01711000006',
    role: 'MEMBER',
    away: { 10: [[3, 5]] },
    lunchSkip: 0.35,
    deposits: {
      10: [
        [4, 4500],
        [22, 3000],
      ],
      11: [[6, 3000]],
    },
  },
  {
    key: 'mehedi',
    name: 'Mehedi Hasan',
    email: `mehedi${EMAIL_DOMAIN}`,
    phone: '01711000007',
    role: 'MEMBER',
    away: { 11: [[6, 9]] },
    lunchSkip: 0.45,
    deposits: {
      10: [
        [5, 3000],
        [19, 2000],
      ],
      11: [[2, 2500]],
    },
  },
  {
    key: 'shuvo',
    name: 'Shuvo Das',
    email: `shuvo${EMAIL_DOMAIN}`,
    phone: '01711000008',
    role: 'MEMBER',
    // Home for Durga Puja.
    away: { 10: [[18, 22]] },
    lunchSkip: 0.25,
    deposits: {
      10: [
        [1, 2500],
        [25, 2500],
      ],
      11: [[3, 3000]],
    },
  },
];

// ---------------------------------------------------------------------------
// Bazaar item catalogue (BDT, Dhaka prices)
// ---------------------------------------------------------------------------
const STAPLES: [string, number, number][] = [
  ['Potatoes 5kg', 250, 300],
  ['Onions 3kg', 330, 390],
  ['Green chilli 500g', 60, 90],
  ['Garlic & ginger', 180, 240],
  ['Eggs (2 dozen)', 290, 330],
];
const PROTEINS: [string, number, number][] = [
  ['Broiler chicken 4kg', 760, 840],
  ['Rui fish 3kg', 960, 1140],
  ['Pangas fish 3kg', 540, 600],
  ['Tilapia 2.5kg', 560, 640],
  ['Beef 2kg', 1500, 1580],
  ['Sonali chicken 3kg', 960, 1080],
];
const VEGETABLES: [string, number, number][] = [
  ['Mixed vegetables', 250, 420],
  ['Brinjal & pumpkin', 140, 200],
  ['Spinach & lal shak', 80, 120],
  ['Tomatoes 2kg', 160, 220],
  ['Cauliflower & cabbage', 150, 220],
];
const PANTRY: [string, number, number][] = [
  ['Masoor dal 3kg', 330, 390],
  ['Soybean oil 5L', 840, 880],
  ['Spices (turmeric, chilli, cumin)', 220, 320],
  ['Salt & sugar', 120, 160],
];

function pick<T>(list: T[], n: number): T[] {
  const copy = [...list];
  const out: T[] = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]!);
  }
  return out;
}

function makeBazaarItems(withRice: boolean) {
  const lines: [string, number, number][] = [
    ...pick(PROTEINS, between(1, 2)),
    ...pick(VEGETABLES, between(2, 3)),
    ...pick(STAPLES, between(1, 3)),
  ];
  if (chance(0.35)) lines.push(...pick(PANTRY, 1));
  if (withRice) lines.unshift(['Miniket rice 25kg', 1850, 1950]);
  return lines.map(([name, min, max]) => ({
    name,
    amount: roundTo(between(min, max), 10),
  }));
}

// ---------------------------------------------------------------------------
// Build everything in memory
// ---------------------------------------------------------------------------
async function build() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const users = people.map((p) => ({
    ...p,
    userId: randomUUID(),
    memberId: randomUUID(),
  }));
  const byKey = Object.fromEntries(users.map((u) => [u.key, u]));
  const manager = byKey.tanvir!;
  const coManager = byKey.rakib!;

  const messId = randomUUID();
  const octId = randomUUID();
  const novId = randomUUID();
  const lunchId = randomUUID();
  const dinnerId = randomUUID();

  const messCreated = bd(2026, 9, 26, 21, 10);

  const userRows: Prisma.usersCreateManyInput[] = users.map((u, i) => ({
    id: u.userId,
    name: u.name,
    email: u.email,
    password: passwordHash,
    phone: u.phone,
    email_verified: true,
    manager_created: u.key !== 'tanvir',
    created_at: bd(2026, 9, 26, 20, 30 + i),
    updated_at: bd(2026, 9, 26, 20, 30 + i),
  }));

  const memberRows: Prisma.mess_membersCreateManyInput[] = users.map(
    (u, i) => ({
      id: u.memberId,
      mess_id: messId,
      user_id: u.userId,
      mess_role: u.role,
      joined_at: bd(2026, 9, 26, 21, 10 + i),
      created_at: bd(2026, 9, 26, 21, 10 + i),
      updated_at: bd(2026, 9, 26, 21, 10 + i),
    }),
  );

  const logs: Prisma.activity_logsCreateManyInput[] = [];
  const log = (
    action: Prisma.activity_logsCreateManyInput['action'],
    at: Date,
    actor: string,
    entityType: string,
    entityId: string,
    monthId?: string,
  ) =>
    logs.push({
      mess_id: messId,
      month_id: monthId ?? null,
      actor_id: actor,
      action,
      entity_type: entityType,
      entity_id: entityId,
      created_at: at,
    });

  users.forEach((u, i) => {
    const at = bd(2026, 9, 26, 21, 10 + i);
    if (u.key === 'tanvir')
      log('MANAGER_ASSIGNED', at, manager.userId, 'mess_members', u.memberId);
    else log('MEMBER_ADDED', at, manager.userId, 'mess_members', u.memberId);
  });
  log(
    'MANAGER_ASSIGNED',
    bd(2026, 9, 26, 21, 30),
    manager.userId,
    'mess_members',
    coManager.memberId,
  );

  const octClosedAt = bd(2026, 11, 1, 9, 15);
  const monthRows: Prisma.monthsCreateManyInput[] = [
    {
      id: octId,
      mess_id: messId,
      title: 'October 2026',
      month_status: 'ARCHIVED',
      started_at: bd(2026, 10, 1, 8, 0),
      ended_at: octClosedAt,
      created_by: manager.userId,
      created_at: bd(2026, 10, 1, 8, 0),
      updated_at: octClosedAt,
    },
    {
      id: novId,
      mess_id: messId,
      title: 'November 2026',
      month_status: 'ACTIVE',
      started_at: octClosedAt,
      created_by: manager.userId,
      created_at: octClosedAt,
      updated_at: octClosedAt,
    },
  ];
  log(
    'MONTH_OPENED',
    bd(2026, 10, 1, 8, 0),
    manager.userId,
    'months',
    octId,
    octId,
  );

  const meals: Prisma.meal_entriesCreateManyInput[] = [];
  const bazaars: Prisma.bazaar_submissionsCreateManyInput[] = [];
  const expenses: Prisma.expensesCreateManyInput[] = [];
  const allocations: Prisma.expense_membersCreateManyInput[] = [];
  const deposits: Prisma.depositsCreateManyInput[] = [];

  const months = [
    { month: 10, id: octId, lastDay: 31 },
    { month: 11, id: novId, lastDay: 15 },
  ];

  for (const { month, id: monthId, lastDay } of months) {
    // ---- Meals: one entry per member per day, entered by a manager at night.
    for (let d = 1; d <= lastDay; d++) {
      const enteredBy = d % 3 === 0 ? coManager : manager;
      // Like the app: one activity per saved day, with the day's counts.
      const savedAt = bd(2026, month, d, 22, between(0, 50));
      let dayMembers = 0;
      let dayMeals = 0;
      for (const u of users) {
        const away = (u.away[month] ?? []).some(([a, b]) => d >= a && d <= b);
        if (away) continue;
        const lunch = chance(u.lunchSkip) ? 0 : 1;
        const guest = chance(0.04) ? 1 : 0; // a friend over for dinner
        const dinner = chance(0.04) ? 0 : 1 + guest;
        if (lunch + dinner === 0) continue;
        const id = randomUUID();
        const at = savedAt;
        meals.push({
          id,
          month_id: monthId,
          member_id: u.memberId,
          date: day(2026, month, d),
          meals: { [lunchId]: lunch, [dinnerId]: dinner },
          total_meal: lunch + dinner,
          created_by: enteredBy.userId,
          created_at: at,
          updated_at: at,
        });
        dayMembers += 1;
        dayMeals += lunch + dinner;
      }
      if (dayMembers > 0) {
        logs.push({
          mess_id: messId,
          month_id: monthId,
          actor_id: enteredBy.userId,
          action: 'MEAL_ADDED',
          entity_type: 'meal_day',
          entity_id: null,
          details: {
            date: day(2026, month, d).toISOString(),
            members: dayMembers,
            meals: dayMeals,
          },
          created_at: savedAt,
        });
      }
    }

    // ---- Bazaar: members take turns shopping every ~2 days.
    let turn = month === 10 ? 0 : 3;
    for (let d = 1; d <= lastDay; d += between(2, 3)) {
      const shopper = users[turn++ % users.length]!;
      const items = makeBazaarItems(d === 1 || d === 16);
      const total = items.reduce((s, it) => s + it.amount, 0);
      const submittedAt = bd(2026, month, d, 11, between(0, 40));
      const id = randomUUID();
      const isLatest = month === 11 && d + 3 > lastDay;
      const approver = d % 2 === 0 ? coManager : manager;
      const approvedAt = bd(2026, month, d, 20, between(0, 50));

      bazaars.push({
        id,
        mess_id: messId,
        month_id: monthId,
        submitted_by: shopper.userId,
        status: isLatest ? 'PENDING' : 'APPROVED',
        description:
          d === 1 || d === 16
            ? 'Big bazaar incl. rice for two weeks'
            : 'Kawran Bazar run',
        items,
        total_amount: total,
        expense_date: day(2026, month, d),
        approved_by: isLatest ? null : approver.userId,
        approved_at: isLatest ? null : approvedAt,
        created_at: submittedAt,
        updated_at: isLatest ? submittedAt : approvedAt,
      });
      log(
        'BAZAAR_SUBMITTED',
        submittedAt,
        shopper.userId,
        'bazaar_submissions',
        id,
        monthId,
      );

      if (!isLatest) {
        const expenseId = randomUUID();
        expenses.push({
          id: expenseId,
          mess_id: messId,
          month_id: monthId,
          type: 'BAZAAR',
          title: `Bazaar - ${day(2026, month, d).toISOString().split('T')[0]}`,
          amount: total,
          created_by: approver.userId,
          expense_date: day(2026, month, d),
          created_at: approvedAt,
          updated_at: approvedAt,
        });
        log(
          'BAZAAR_APPROVED',
          approvedAt,
          approver.userId,
          'bazaar_submissions',
          id,
          monthId,
        );
      }
    }

    // ---- Deposits
    for (const u of users) {
      for (const [d, amount] of u.deposits[month] ?? []) {
        if (d > lastDay) continue;
        const id = randomUUID();
        const at = bd(2026, month, d, 21, between(0, 50));
        deposits.push({
          id,
          mess_id: messId,
          month_id: monthId,
          member_id: u.memberId,
          amount,
          deposit_date: day(2026, month, d),
          created_by: manager.userId,
          created_at: at,
          updated_at: at,
        });
        log('DEPOSIT_ADDED', at, manager.userId, 'deposits', id, monthId);
      }
    }
  }

  // A duplicate bazaar a manager rejected.
  {
    const id = randomUUID();
    const at = bd(2026, 11, 7, 12, 5);
    const items = [
      { name: 'Broiler chicken 4kg', amount: 800 },
      { name: 'Mixed vegetables', amount: 310 },
    ];
    bazaars.push({
      id,
      mess_id: messId,
      month_id: novId,
      submitted_by: byKey.nayeem!.userId,
      status: 'REJECTED',
      description: 'Submitted twice by mistake',
      items,
      total_amount: 1110,
      expense_date: day(2026, 11, 7),
      approved_by: manager.userId,
      approved_at: bd(2026, 11, 7, 19, 30),
      created_at: at,
      updated_at: bd(2026, 11, 7, 19, 30),
    });
    log(
      'BAZAAR_SUBMITTED',
      at,
      byKey.nayeem!.userId,
      'bazaar_submissions',
      id,
      novId,
    );
    log(
      'BAZAAR_REJECTED',
      bd(2026, 11, 7, 19, 30),
      manager.userId,
      'bazaar_submissions',
      id,
      novId,
    );
  }

  // ---- Shared and individual expenses (same split as ExpensesService).
  const split = (amount: number, n: number) => {
    const per = Math.round((amount / n) * 100) / 100;
    const out = new Array<number>(n).fill(per);
    const diff = Math.round((amount - per * n) * 100) / 100;
    if (Math.round(diff * 100) !== 0)
      out[n - 1] = Math.round((per + diff) * 100) / 100;
    return out;
  };
  const addExpense = (
    monthId: string,
    type: 'SHARED' | 'INDIVIDUAL',
    title: string,
    amount: number,
    date: [number, number],
    memberKeys: string[],
  ) => {
    const id = randomUUID();
    const at = bd(2026, date[0], date[1], 20, between(0, 50));
    expenses.push({
      id,
      mess_id: messId,
      month_id: monthId,
      type,
      title,
      amount,
      created_by: manager.userId,
      expense_date: day(2026, date[0], date[1]),
      created_at: at,
      updated_at: at,
    });
    const shares =
      type === 'INDIVIDUAL' ? [amount] : split(amount, memberKeys.length);
    memberKeys.forEach((k, i) =>
      allocations.push({
        id: randomUUID(),
        expense_id: id,
        member_id: byKey[k]!.memberId,
        allocated_amount: shares[i]!,
        created_at: at,
      }),
    );
    log('EXPENSE_ADDED', at, manager.userId, 'expenses', id, monthId);
  };

  const everyone = users.map((u) => u.key);
  addExpense(
    octId,
    'SHARED',
    'Cook (Bua) salary - October',
    6000,
    [10, 5],
    everyone,
  );
  addExpense(
    octId,
    'SHARED',
    'Internet bill (40 Mbps)',
    1200,
    [10, 7],
    everyone,
  );
  addExpense(
    octId,
    'SHARED',
    'Gas bill (double burner)',
    1080,
    [10, 10],
    everyone,
  );
  addExpense(
    octId,
    'SHARED',
    'Electricity bill - September',
    2350,
    [10, 12],
    everyone,
  );
  addExpense(octId, 'SHARED', 'Water filter service', 600, [10, 21], everyone);
  addExpense(
    octId,
    'INDIVIDUAL',
    'Extra beef for guests',
    450,
    [10, 27],
    ['nayeem'],
  );
  addExpense(
    octId,
    'INDIVIDUAL',
    'Medicine from mess fund',
    320,
    [10, 12],
    ['arif'],
  );
  addExpense(
    novId,
    'SHARED',
    'Cook (Bua) salary - November',
    6000,
    [11, 5],
    everyone,
  );
  addExpense(
    novId,
    'SHARED',
    'Internet bill (40 Mbps)',
    1200,
    [11, 7],
    everyone,
  );
  addExpense(
    novId,
    'SHARED',
    'Electricity bill - October',
    2180,
    [11, 11],
    everyone,
  );
  addExpense(novId, 'INDIVIDUAL', 'Broken glass jug', 250, [11, 9], ['mehedi']);

  // ---- Close October with the API's own maths, then carry forward.
  const octSummary = computeMemberSummaries(octId, {
    activeMemberIds: users.map((u) => u.memberId),
    mealEntries: meals
      .filter((m) => m.month_id === octId)
      .map((m) => ({
        member_id: m.member_id,
        total_meal: m.total_meal as number,
      })),
    expenses: expenses
      .filter((x) => x.month_id === octId)
      .map((x) => ({
        type: x.type,
        amount: x.amount as number,
        members: allocations
          .filter((a) => a.expense_id === x.id)
          .map((a) => ({
            member_id: a.member_id,
            allocated_amount: a.allocated_amount as number,
          })),
      })),
    deposits: deposits
      .filter((d) => d.month_id === octId)
      .map((d) => ({
        member_id: d.member_id,
        amount: d.amount as number,
      })),
  });
  const summaries: Prisma.member_month_summariesCreateManyInput[] =
    octSummary.rows.map((r) => ({
      ...r,
      created_at: octClosedAt,
    }));
  const carries: Prisma.carry_forward_balancesCreateManyInput[] =
    octSummary.rows
      .filter((r) => r.final_balance !== 0)
      .map((r) => ({
        source_month_id: octId,
        target_month_id: novId,
        member_id: r.member_id,
        amount: Math.abs(r.final_balance),
        carry_forward_type:
          r.final_balance > 0 ? 'PREVIOUS_BALANCE' : 'PREVIOUS_DUE',
        created_at: octClosedAt,
      }));
  log('MONTH_CLOSED', octClosedAt, manager.userId, 'months', octId, octId);
  log('MONTH_OPENED', octClosedAt, manager.userId, 'months', novId, novId);

  return {
    users,
    mealRate: octSummary.mealRate,
    rows: {
      users: userRows,
      mess: {
        id: messId,
        name: 'Green Villa Bachelor Mess',
        slug: MESS_SLUG,
        description:
          'Eight working professionals and students sharing a flat in Mirpur-10, Dhaka.',
        created_by: manager.userId,
        created_at: messCreated,
        updated_at: messCreated,
      } satisfies Prisma.messesCreateManyInput,
      members: memberRows,
      mealTypes: [
        {
          id: lunchId,
          mess_id: messId,
          name: 'Lunch',
          value: 1,
          created_at: messCreated,
          updated_at: messCreated,
        },
        {
          id: dinnerId,
          mess_id: messId,
          name: 'Dinner',
          value: 1,
          created_at: messCreated,
          updated_at: messCreated,
        },
      ] satisfies Prisma.meal_typesCreateManyInput[],
      months: monthRows,
      meals,
      bazaars,
      expenses,
      allocations,
      deposits,
      summaries,
      carries,
      logs,
    },
  };
}

// ---------------------------------------------------------------------------
// Reset (demo rows only)
// ---------------------------------------------------------------------------
async function reset(tx: Prisma.TransactionClient) {
  const mess = await tx.messes.findUnique({
    where: { slug: MESS_SLUG },
    select: { id: true },
  });
  if (mess) {
    const monthIds = (
      await tx.months.findMany({
        where: { mess_id: mess.id },
        select: { id: true },
      })
    ).map((m) => m.id);
    await tx.activity_logs.deleteMany({ where: { mess_id: mess.id } });
    await tx.carry_forward_balances.deleteMany({
      where: {
        OR: [
          { source_month_id: { in: monthIds } },
          { target_month_id: { in: monthIds } },
        ],
      },
    });
    await tx.member_month_summaries.deleteMany({
      where: { month_id: { in: monthIds } },
    });
    await tx.expenses.deleteMany({ where: { mess_id: mess.id } }); // allocations cascade
    await tx.deposits.deleteMany({ where: { mess_id: mess.id } });
    await tx.bazaar_submissions.deleteMany({ where: { mess_id: mess.id } });
    await tx.meal_entries.deleteMany({ where: { month_id: { in: monthIds } } });
    await tx.months.deleteMany({ where: { mess_id: mess.id } });
    await tx.messes.delete({ where: { id: mess.id } }); // members, meal types, join requests cascade
  }
  const { count } = await tx.users.deleteMany({
    where: { email: { endsWith: EMAIL_DOMAIN } },
  });
  console.log(
    `Reset: removed ${mess ? 'demo mess' : 'no mess'} and ${count} demo users`,
  );
}

// ---------------------------------------------------------------------------
async function main() {
  const { users, mealRate, rows } = await build();

  const bazaarTotal = rows.expenses
    .filter((x) => x.type === 'BAZAAR' && x.month_id === rows.months[0]!.id)
    .reduce((s, x) => s + Number(x.amount), 0);

  console.log(`Mess:        ${rows.mess.name}`);
  console.log(`Members:     ${rows.members.length}`);
  console.log(`Meal rows:   ${rows.meals.length}`);
  console.log(`Bazaars:     ${rows.bazaars.length}`);
  console.log(`Expenses:    ${rows.expenses.length}`);
  console.log(`Deposits:    ${rows.deposits.length}`);
  console.log(`Logs:        ${rows.logs.length}`);
  console.log(
    `Oct bazaar:  ৳${bazaarTotal.toFixed(2)}  meal rate ৳${mealRate.toFixed(2)}`,
  );
  console.table(
    rows.summaries.map((s) => ({
      member: users.find((u) => u.memberId === s.member_id)!.name,
      meals: s.total_meals,
      meal_cost: s.meal_cost,
      shared: s.shared_cost,
      individual: s.individual_cost,
      deposit: s.deposit_amount,
      balance: s.final_balance,
    })),
  );

  if (DRY_RUN) {
    console.log('Dry run: nothing written.');
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      if (RESET) {
        await reset(tx);
      } else {
        const existing = await tx.messes.findUnique({
          where: { slug: MESS_SLUG },
        });
        const demoUsers = await tx.users.count({
          where: { email: { endsWith: EMAIL_DOMAIN } },
        });
        if (existing || demoUsers > 0) {
          throw new Error(
            'Demo data already exists. Re-run with --reset to replace it.',
          );
        }
      }

      await tx.users.createMany({ data: rows.users });
      await tx.messes.create({ data: rows.mess });
      await tx.mess_members.createMany({ data: rows.members });
      await tx.meal_types.createMany({ data: rows.mealTypes });
      await tx.months.createMany({ data: rows.months });
      await tx.meal_entries.createMany({ data: rows.meals });
      await tx.bazaar_submissions.createMany({ data: rows.bazaars });
      await tx.expenses.createMany({ data: rows.expenses });
      await tx.expense_members.createMany({ data: rows.allocations });
      await tx.deposits.createMany({ data: rows.deposits });
      await tx.member_month_summaries.createMany({ data: rows.summaries });
      await tx.carry_forward_balances.createMany({ data: rows.carries });
      await tx.activity_logs.createMany({ data: rows.logs });
    },
    { timeout: 120_000, maxWait: 20_000 },
  );

  console.log(
    '\nSeeded. Demo logins (password for all: ' + DEMO_PASSWORD + '):',
  );
  console.log(`  Manager: ${people[0]!.email}`);
  console.log(`  Member:  ${people[2]!.email}`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
