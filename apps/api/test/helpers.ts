import type { HttpException } from '@nestjs/common';

/** Asserts a promise rejects with `type` (and, if given, the error `code`). */
export async function rejectsWith(
  p: Promise<unknown>,
  type: abstract new (...args: never[]) => HttpException,
  code?: string,
) {
  const err: unknown = await p.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(type);
  if (code) {
    expect((err as HttpException).getResponse()).toMatchObject({ code });
  }
}

export const daysAgo = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000);
