import type { Request } from 'express';
import { CookieStateStore, OAUTH_STATE_COOKIE } from './oauth-state.store';

function fakeReq(cookie?: string) {
  const res = { cookie: jest.fn(), clearCookie: jest.fn() };
  const req = { headers: cookie ? { cookie } : {}, res } as unknown as Request;
  return { req, res };
}

describe('CookieStateStore', () => {
  const store = new CookieStateStore();

  it('stores a random state in an httpOnly cookie', () => {
    const { req, res } = fakeReq();
    let state: string | undefined;
    store.store(req, (_e, s) => (state = s));
    expect(state).toMatch(/^[A-Za-z0-9_-]{20,}$/);
    expect(res.cookie).toHaveBeenCalledWith(
      OAUTH_STATE_COOKIE,
      state,
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('accepts the matching state and clears the cookie', () => {
    const { req, res } = fakeReq(`x=1; ${OAUTH_STATE_COOKIE}=abc123`);
    const cb = jest.fn();
    store.verify(req, 'abc123', cb);
    expect(cb).toHaveBeenCalledWith(null, true);
    expect(res.clearCookie).toHaveBeenCalled();
  });

  it.each([
    ['a different state', `${OAUTH_STATE_COOKIE}=abc123`, 'zzz999'],
    ['no cookie (login CSRF)', undefined, 'abc123'],
    ['no state', `${OAUTH_STATE_COOKIE}=abc123`, undefined],
  ])('rejects %s', (_label, cookie, provided) => {
    const { req } = fakeReq(cookie);
    const cb = jest.fn();
    store.verify(req, provided, cb);
    expect(cb).toHaveBeenCalledWith(null, false, expect.anything());
  });
});
