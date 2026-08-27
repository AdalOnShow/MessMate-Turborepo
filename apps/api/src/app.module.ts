import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BazaarModule } from './bazaar/bazaar.module';
import { ApiResponseMiddleware } from './common/api-response/api-response.middleware';
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
        ttl: 60000,
        limit: 10,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiResponseMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
