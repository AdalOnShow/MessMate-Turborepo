import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { REQUEST_ID_HEADER } from './common/request-id/request-id.middleware';

const expressApp = express();
// One shared start-up promise: requests that arrive together on a cold
// start used to each build their own Nest app.
let serverPromise: Promise<express.Express> | null = null;

function resolveCorsOrigin(): string[] {
  const raw = process.env.CORS_ORIGIN;
  if (!raw) throw new Error('CORS_ORIGIN environment variable is required');

  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const valid = origins.every((origin) => {
    try {
      const parsed = new URL(origin);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  });

  if (!valid) throw new Error(`Invalid CORS_ORIGIN: ${raw}`);
  return origins;
}

const corsOptions = {
  origin: resolveCorsOrigin(),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', REQUEST_ID_HEADER],
  exposedHeaders: [REQUEST_ID_HEADER],
};

/** Shared by the local server and the Vercel handler; keep them identical. */
function configureApp(app: INestApplication) {
  const http = app.getHttpAdapter().getInstance() as express.Express;
  http.disable('x-powered-by');
  // Behind Render/Vercel's proxy: trust one hop so req.ip is the real client
  // IP (from X-Forwarded-For) instead of the proxy's, for the IP throttle
  // fallback.
  http.set('trust proxy', 1);
  // Basic security headers for a JSON API (what helmet would set that
  // matters here), without another dependency.
  http.use((_req: express.Request, res: express.Response, next: () => void) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains',
      );
    }
    next();
  });
  app.enableCors(corsOptions);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
}

function createServer(): Promise<express.Express> {
  serverPromise ??= (async () => {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
      { logger: false },
    );
    configureApp(app);
    await app.init();
    return expressApp;
  })().catch((error: unknown) => {
    // Let the next request try again instead of failing forever.
    serverPromise = null;
    throw error;
  });
  return serverPromise;
}

const isVercel = process.env.VERCEL === '1';

if (!isVercel) {
  async function bootstrap() {
    const isDev = process.env.NODE_ENV !== 'production';
    const app = await NestFactory.create(AppModule, {
      logger: isDev ? ['log', 'error', 'warn', 'debug', 'verbose'] : false,
    });

    app.enableShutdownHooks();
    configureApp(app);

    if (isDev) {
      app.useGlobalInterceptors(new LoggingInterceptor());
    }
    const port = process.env.PORT ?? 4000;
    await app.listen(port);

    if (isDev) {
      const logger = new Logger('Bootstrap');
      logger.log(`🚀 Server running on http://localhost:${port}`);
      logger.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    }
  }

  void bootstrap().catch((error: unknown) => {
    if (process.env.NODE_ENV !== 'production') {
      const logger = new Logger('Bootstrap');
      logger.error(
        `❌ Fatal bootstrap error: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
      );
    }
    process.exit(1);
  });
}

export default async (req: express.Request, res: express.Response) => {
  const server = await createServer();
  server(req, res);
};
