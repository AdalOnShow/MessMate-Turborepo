import { Module } from '@nestjs/common';
import { MessesController } from './messes.controller';
import { MessesService } from './messes.service';

@Module({
  controllers: [MessesController],
  providers: [MessesService],
  exports: [MessesService],
})
export class MessesModule {}
