import { randomUUID } from 'node:crypto';
import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'X-Request-Id';

// Accept a caller-supplied id only if it looks like an id, so arbitrary
// header content never ends up in logs or response bodies.
const SAFE_ID = /^[A-Za-z0-9_-]{8,64}$/;

export type RequestWithId = Request & { requestId?: string };

export function resolveRequestId(req: RequestWithId): string {
  if (req.requestId) return req.requestId;
  const incoming = req.headers['x-request-id'];
  const candidate = Array.isArray(incoming) ? incoming[0] : incoming;
  const id = candidate && SAFE_ID.test(candidate) ? candidate : randomUUID();
  req.requestId = id;
  return id;
}

/**
 * Gives every request an id (reusing the web app's `X-Request-Id` when sent)
 * and echoes it back, so a user-visible reference code can be matched to
 * server logs.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: NextFunction) {
    res.setHeader(REQUEST_ID_HEADER, resolveRequestId(req));
    next();
  }
}
