import { cookies } from "next/headers";

/** Must match the API (auth.service.ts ACCESS_TOKEN_TTL_SECONDS / SESSION_TTL_SECONDS). */
const ACCESS_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60; // 30 days, renewed on each rotation

// Google sign-in sets these cookies from the API (api.example.com), so in
// production they carry the shared parent domain (COOKIE_DOMAIN=.example.com).
// The web app must write them with the same domain, or a refresh would create
// a second host-only cookie next to the API's and requests could send the
// stale one.
const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

const base = {
  ...(cookieDomain ? { domain: cookieDomain } : {}),
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  // Lax, not strict: strict cookies are not sent when the user arrives from
  // another site (Google sign-in redirect, a link shared in WhatsApp), so
  // those visits were treated as signed out.
  sameSite: "lax" as const,
  path: "/",
};

/** Stores the tokens. The refresh cookie must have a max-age: a session
 *  cookie is deleted whenever a home-screen app or the browser is closed. */
export async function setAuthCookies(
  accessToken: string,
  refreshToken?: string | null,
) {
  const store = await cookies();
  store.set("access_token", accessToken, {
    ...base,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
  if (refreshToken) {
    store.set("refresh_token", refreshToken, {
      ...base,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  }
}

export async function clearAuthCookies() {
  const store = await cookies();
  store.set("access_token", "", { ...base, maxAge: 0 });
  store.set("refresh_token", "", { ...base, maxAge: 0 });
}

/** Reads the refresh token out of an API response's Set-Cookie headers. */
export function extractRefreshCookie(headers: Headers): string | null {
  for (const line of headers.getSetCookie()) {
    const match = /^refresh_token=([^;]*)/.exec(line);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }
  return null;
}
