import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BazaarModule } from './bazaar/bazaar.module';
import { ApiResponseMiddleware } from './common/api-response/api-response.middleware';
import { AppThrottlerGuard } from './common/guards/app-throttler.guard';
import { RequestIdMiddleware } from './common/request-id/request-id.middleware';
import { DepositsModule } from './deposits/deposits.module';
import { ExpensesModule } from './expenses/expenses.module';
import { InvitesModule } from './invites/invites.module';
import { MealsModule } from './meals/meals.module';
import { MessesModule } from './messes/messes.module';
import { MonthsModule } from './months/months.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    ThrottlerModule.forRoot([
      {
        // Per signed-in user (see AppThrottlerGuard). One dashboard load is
        // 6-8 requests, so this leaves room for normal use while still
        // stopping abuse. Auth routes set their own stricter limits.
        ttl: 60000,
        limit: 120,
      },
    ]),
    AuthModule,
    UsersModule,
    MessesModule,
    InvitesModule,
    MonthsModule,
    MealsModule,
    BazaarModule,
    ExpensesModule,
    DepositsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, ApiResponseMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
