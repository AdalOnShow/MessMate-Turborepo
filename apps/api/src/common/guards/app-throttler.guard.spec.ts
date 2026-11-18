import { trackerFor } from './app-throttler.guard';

describe('trackerFor', () => {
  const ip = '10.0.0.1'; // every request comes from the web server's IP

  it('counts sign-in attempts per email, not per shared IP', () => {
    const a = trackerFor({ ip, body: { email: 'A@x.com ' } });
    const a2 = trackerFor({ ip, body: { email: 'a@x.com' } });
    const b = trackerFor({ ip, body: { email: 'b@x.com' } });
    expect(a).toBe(a2);
    expect(a).not.toBe(b);
  });

  it('counts signed-in requests per token', () => {
    const t1 = trackerFor({ ip, headers: { authorization: 'Bearer one' } });
    const t2 = trackerFor({ ip, headers: { authorization: 'Bearer two' } });
    expect(t1).not.toBe(t2);
  });

  it('counts refresh per refresh cookie', () => {
    const r1 = trackerFor({
      ip,
      headers: { cookie: 'x=1; refresh_token=aaa' },
    });
    const r2 = trackerFor({ ip, headers: { cookie: 'refresh_token=bbb' } });
    expect(r1).toMatch(/^session:/);
    expect(r1).not.toBe(r2);
  });

  it('falls back to IP', () => {
    expect(trackerFor({ ip })).toBe(`ip:${ip}`);
  });

  it('ignores a forged Bearer header on sign-in (per-email bucket)', () => {
    const plain = trackerFor({
      ip,
      path: '/auth/signin',
      body: { email: 'victim@x.com' },
    });
    const forged1 = trackerFor({
      ip,
      path: '/auth/signin',
      headers: { authorization: 'Bearer random-1' },
      body: { email: 'victim@x.com' },
    });
    const forged2 = trackerFor({
      ip,
      path: '/auth/signin/',
      headers: { authorization: 'Bearer random-2' },
      body: { email: 'Victim@x.com' },
    });
    expect(plain).toMatch(/^email:/);
    expect(forged1).toBe(plain);
    expect(forged2).toBe(plain);
  });

  it('ignores a forged Bearer header on sign-up', () => {
    const t = trackerFor({
      ip,
      path: '/auth/signup',
      headers: { authorization: 'Bearer x' },
      body: { email: 'a@x.com' },
    });
    expect(t).toMatch(/^email:/);
  });

  it('uses the refresh cookie on refresh even with a Bearer header', () => {
    const t = trackerFor({
      ip,
      path: '/auth/refresh',
      headers: { authorization: 'Bearer x', cookie: 'refresh_token=abc' },
    });
    expect(t).toMatch(/^session:/);
  });
});
