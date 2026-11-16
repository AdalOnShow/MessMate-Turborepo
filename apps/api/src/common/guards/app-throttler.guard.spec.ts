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
});
