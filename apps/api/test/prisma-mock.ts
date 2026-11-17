/**
 * In-memory stand-in for the `@repo/database` package, so specs never touch
 * a real database.
 *
 * Every `prisma.<model>.<method>` is a `jest.fn()` created on first access;
 * set return values per test with `prismaMock.users.findUnique.mockResolvedValue(...)`.
 * `$transaction(fn)` runs `fn` with the same mock (so `tx.x` === `prisma.x`),
 * and `$transaction([...])` resolves the array like Prisma does.
 *
 * Usage, at the top of a spec:
 *   jest.mock('@repo/database', () => jest.requireActual('<path>/test/prisma-mock').databaseModule);
 *   import { prismaMock, resetPrismaMock } from '<path>/test/prisma-mock';
 *   beforeEach(resetPrismaMock);
 */

type ModelMock = Record<string, jest.Mock>;

const models = new Map<string, ModelMock>();

function modelMock(): ModelMock {
  return new Proxy({} as ModelMock, {
    get(target, method) {
      if (typeof method !== 'string' || method === 'then') return undefined;
      target[method] ??= jest.fn();
      return target[method];
    },
  });
}

const transaction = jest.fn();

function installTransaction() {
  transaction.mockReset();
  transaction.mockImplementation((arg: unknown) =>
    typeof arg === 'function'
      ? (arg as (tx: unknown) => unknown)(prismaMock)
      : Promise.all(arg as unknown[]),
  );
}

export type PrismaMock = Record<string, ModelMock> & {
  $transaction: jest.Mock;
};

export const prismaMock = new Proxy({} as PrismaMock, {
  get(_target, key) {
    if (key === '$transaction') return transaction;
    if (typeof key !== 'string' || key === 'then') return undefined;
    let model = models.get(key);
    if (!model) {
      model = modelMock();
      models.set(key, model);
    }
    return model;
  },
});

/** Drops every stubbed return value. Call in `beforeEach`. */
export function resetPrismaMock() {
  models.clear();
  installTransaction();
}

installTransaction();

/** Mirrors Prisma's error class closely enough for `instanceof` checks. */
class PrismaClientKnownRequestError extends Error {
  code: string;
  meta?: unknown;
  constructor(message: string, opts: { code: string; meta?: unknown }) {
    super(message);
    this.name = 'PrismaClientKnownRequestError';
    this.code = opts.code;
    this.meta = opts.meta;
  }
}

export const databaseModule = {
  prisma: prismaMock,
  Prisma: { PrismaClientKnownRequestError },
};
