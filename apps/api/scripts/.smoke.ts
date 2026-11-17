/* Temporary smoke test against the dev DB through the real HTTP API. Deleted after use. */
import { resolve } from 'node:path';
import { config } from 'dotenv';
config({ path: resolve(__dirname, '../../../.env') });
import { prisma } from '@repo/database';

const API = 'http://localhost:4100';
const results: [string, boolean, string][] = [];
const check = (name: string, ok: boolean, info = '') => {
  results.push([name, ok, info]);
};

async function call(
  method: string,
  path: string,
  token?: string,
  body?: unknown,
) {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    /* empty */
  }
  return { status: res.status, json };
}

async function signin(email: string, password = 'MessMate@2026') {
  const r = await call('POST', '/auth/signin', undefined, { email, password });
  return { status: r.status, token: r.json?.data?.accessToken as string };
}

async function main() {
  // 1. Case-insensitive sign-in
  const mgr = await signin('DEMO.Manager@MessMate.demo');
  check(
    'signin with mixed-case email → 200',
    mgr.status === 200,
    `${mgr.status}`,
  );
  const T = mgr.token;

  // 2. Signup validation
  const bad = await call('POST', '/auth/signup', undefined, {
    name: 'A',
    email: 'bad',
    password: '1',
  });
  check(
    'signup with bad body → 400 VALIDATION_FAILED',
    bad.status === 400 && bad.json?.code === 'VALIDATION_FAILED',
    `${bad.status} ${bad.json?.code}`,
  );

  const mess = await prisma.messes.findUniqueOrThrow({
    where: { slug: 'green-villa-bachelor-mess' },
  });
  const M = mess.id;
  const userId = async (email: string) =>
    (await prisma.users.findUniqueOrThrow({ where: { email } })).id;
  const tanvir = await userId('demo.manager@messmate.demo');
  const rakib = await userId('rakib@messmate.demo');

  // 3. Last manager cannot demote themselves
  const d1 = await call('PATCH', `/messes/${M}/members/${rakib}/role`, T, {
    role: 'MEMBER',
  });
  check('demote co-manager (2 → 1) → 200', d1.status === 200, `${d1.status}`);
  const d2 = await call('PATCH', `/messes/${M}/members/${tanvir}/role`, T, {
    role: 'MEMBER',
  });
  check(
    'last manager demoting self → 400',
    d2.status === 400,
    `${d2.status} ${d2.json?.message}`,
  );
  const p1 = await call('PATCH', `/messes/${M}/members/${rakib}/role`, T, {
    role: 'MANAGER',
  });
  const p2 = await call('PATCH', `/messes/${M}/members/${rakib}/role`, T, {
    role: 'MANAGER',
  });
  check(
    're-promote co-manager → 200, repeat is a no-op 200',
    p1.status === 200 && p2.status === 200,
    `${p1.status}/${p2.status}`,
  );

  // 4. Closed (October) month is frozen
  const oct = await prisma.months.findFirstOrThrow({
    where: { mess_id: M, month_status: 'ARCHIVED' },
  });
  const nov = await prisma.months.findFirstOrThrow({
    where: { mess_id: M, month_status: 'ACTIVE' },
  });
  const octDeposit = await prisma.deposits.findFirstOrThrow({
    where: { month_id: oct.id, deleted_at: null },
  });
  const ed = await call('PATCH', `/deposits/${M}/${octDeposit.id}`, T, {
    amount: 1,
  });
  check(
    'edit October deposit → 409 MONTH_ALREADY_CLOSED',
    ed.status === 409 && ed.json?.code === 'MONTH_ALREADY_CLOSED',
    `${ed.status} ${ed.json?.code}`,
  );
  const octExpense = await prisma.expenses.findFirstOrThrow({
    where: { month_id: oct.id, type: 'SHARED' },
  });
  const de = await call('DELETE', `/expenses/${M}/${octExpense.id}`, T);
  check('delete October expense → 409', de.status === 409, `${de.status}`);

  // 5. Expense delete works (EXPENSE_DELETED enum value was missing in the DB)
  const memberIds = (
    await prisma.mess_members.findMany({
      where: { mess_id: M, removed_at: null },
      select: { id: true },
    })
  ).map((m) => m.id);
  const ce = await call('POST', `/expenses/${M}/${nov.id}`, T, {
    type: 'SHARED',
    title: 'Smoke test',
    amount: 100,
    expense_date: new Date().toISOString(),
    member_ids: memberIds,
  });
  const dl = await call('DELETE', `/expenses/${M}/${ce.json?.data?.id}`, T);
  check(
    'create + delete a November shared expense → 201/200',
    ce.status === 201 && dl.status === 200,
    `${ce.status}/${dl.status} ${dl.json?.message ?? ''}`,
  );

  // 6. Double approval of one bazaar → exactly one expense
  const member = await signin('demo.member@messmate.demo');
  const sub = await call('POST', `/bazaar/${M}/${nov.id}`, member.token, {
    items: [{ name: 'Smoke rice', amount: 1234 }],
    expense_date: new Date().toISOString(),
  });
  const sid = sub.json?.data?.id;
  const before = await prisma.expenses.count({
    where: { month_id: nov.id, type: 'BAZAAR' },
  });
  const [a1, a2, a3] = await Promise.all([
    call('POST', `/bazaar/${M}/${sid}/approve`, T),
    call('POST', `/bazaar/${M}/${sid}/approve`, T),
    call('POST', `/bazaar/${M}/${sid}/approve`, T),
  ]);
  const after = await prisma.expenses.count({
    where: { month_id: nov.id, type: 'BAZAAR' },
  });
  const statuses = [a1.status, a2.status, a3.status].sort();
  check(
    '3 parallel approvals → one 200, others 4xx, one expense',
    statuses.filter((s) => s === 200).length === 1 && after - before === 1,
    `${statuses.join(',')} expenses +${after - before}`,
  );

  // 7. Bazaar delete is logged (BAZAAR_DELETED)
  const sub2 = await call('POST', `/bazaar/${M}/${nov.id}`, member.token, {
    items: [{ name: 'Smoke onions', amount: 300 }],
    expense_date: new Date().toISOString(),
  });
  const del = await call(
    'DELETE',
    `/bazaar/${M}/${sub2.json?.data?.id}`,
    member.token,
  );
  const delLog = await prisma.activity_logs.count({
    where: { entity_id: sub2.json?.data?.id, action: 'BAZAAR_DELETED' },
  });
  check(
    'submitter deletes own pending bazaar → 200 + BAZAAR_DELETED log',
    del.status === 200 && delLog === 1,
    `${del.status} logs=${delLog}`,
  );

  // 8. One mess per user (ADR-003): createMess and accepting an invite
  const email = `smoke.${Date.now()}@messmate.demo`;
  const su = await call('POST', '/auth/signup', undefined, {
    name: 'Smoke User',
    email: email.toUpperCase(),
    password: 'smoke-pass-123',
  });
  const stored = await prisma.users.findFirst({ where: { email } });
  check(
    'signup stores the email in lower case',
    su.status === 201 && !!stored,
    `${su.status}`,
  );
  const S = su.json?.data?.accessToken;
  const own = await call('POST', '/messes', S, {
    name: 'Green Villa Bachelor Mess',
  });
  check(
    'create a mess with a taken name → 201 with a numbered slug',
    own.status === 201 && /-2$/.test(own.json?.data?.slug ?? ''),
    `${own.status} ${own.json?.data?.slug}`,
  );
  const second = await call('POST', '/messes', S, { name: 'Another' });
  check(
    'create a second mess → 409 ALREADY_IN_MESS',
    second.status === 409 && second.json?.code === 'ALREADY_IN_MESS',
    `${second.status} ${second.json?.code}`,
  );
  const inv = await call('POST', '/invites', T, { email });
  const acc = await call('POST', `/invites/${inv.json?.data?.id}/accept`, S);
  check(
    'accept invite while in another mess → 409 ALREADY_IN_MESS',
    acc.status === 409 && acc.json?.code === 'ALREADY_IN_MESS',
    `invite ${inv.status}, accept ${acc.status} ${acc.json?.code}`,
  );

  // 9. Direct add route is gone
  const add = await call('POST', `/messes/${M}/members`, T, {
    userId: stored?.id,
  });
  check('POST /messes/:id/members → 404', add.status === 404, `${add.status}`);

  // 10. Closing November rejects its pending bazaar
  const pend = await call('POST', `/bazaar/${M}/${nov.id}`, member.token, {
    items: [{ name: 'Smoke eggs', amount: 300 }],
    expense_date: new Date().toISOString(),
  });
  const close = await call('POST', `/months/${M}`, T, { title: 'Smoke Month' });
  const pendAfter = await prisma.bazaar_submissions.findUnique({
    where: { id: pend.json?.data?.id },
  });
  const anyPending = await prisma.bazaar_submissions.count({
    where: { month_id: nov.id, status: 'PENDING', deleted_at: null },
  });
  check(
    'closing the month rejects its pending bazaar',
    close.status === 201 &&
      pendAfter?.status === 'REJECTED' &&
      anyPending === 0,
    `${close.status} → ${pendAfter?.status}, still pending=${anyPending}`,
  );
  const lateApprove = await call(
    'POST',
    `/bazaar/${M}/${pend.json?.data?.id}/approve`,
    T,
  );
  check(
    'approving a bazaar of the closed month → 409',
    lateApprove.status === 409,
    `${lateApprove.status} ${lateApprove.json?.code}`,
  );

  // Clean up the smoke user's own mess and account (seed --reset handles the rest).
  if (stored) {
    const ownMess = await prisma.messes.findFirst({
      where: { created_by: stored.id },
    });
    await prisma.$transaction(async (tx) => {
      await tx.join_requests.deleteMany({ where: { user_id: stored.id } });
      await tx.user_sessions.deleteMany({ where: { user_id: stored.id } });
      if (ownMess) {
        await tx.activity_logs.deleteMany({ where: { mess_id: ownMess.id } });
        await tx.messes.delete({ where: { id: ownMess.id } });
      }
      await tx.users.delete({ where: { id: stored.id } });
    });
  }

  for (const [name, ok, info] of results)
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  (${info})`);
  console.log(
    `\n${results.filter((r) => r[1]).length}/${results.length} passed`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
