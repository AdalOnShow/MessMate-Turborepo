import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return {
      message: 'Hello! Messmate Server is running successfully.',
      date: new Date().toISOString(),
    };
  }
}
