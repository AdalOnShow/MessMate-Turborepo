import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { isApiResponse } from '@repo/shared';

@Injectable()
export class ApiResponseMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const originalJson = res.json.bind(res) as unknown as Response['json'];

    res.json = ((body?: unknown) => {
      if (isApiResponse(body)) {
        return originalJson(body);
      }

      return originalJson({
        success: true,
        message: 'Request completed successfully',
        data: body,
      });
    }) as Response['json'];

    next();
  }
}
