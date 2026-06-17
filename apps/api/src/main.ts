import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import serverlessExpress from '@vendia/serverless-express';
import express from 'express';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

let cachedServer: any;

async function createServer() {
  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    {
      logger: false,
    },
  );

  app.enableCors({
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new ApiExceptionFilter());
  await app.init();
  return serverlessExpress({ app: expressApp });
}

const handler = async (req: any, res: any) => {
  if (!cachedServer) {
    cachedServer = await createServer();
  }
  return cachedServer(req, res);
};

const isVercel = process.env.VERCEL === '1';

if (!isVercel) {
  async function bootstrap() {
    const isDev = process.env.NODE_ENV !== 'production';
    const app = await NestFactory.create(AppModule, {
      logger: isDev ? ['log', 'error', 'warn', 'debug', 'verbose'] : false,
    });

    app.enableShutdownHooks();

    app.enableCors({
      origin: process.env.CORS_ORIGIN,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    if (isDev) {
      app.useGlobalInterceptors(new LoggingInterceptor());
    }

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    app.useGlobalFilters(new ApiExceptionFilter());

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

export default handler;
