import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { AuthUser } from '../auth/auth.service';
import { MessesService } from './messes.service';

type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

@Controller('messes')
@UseGuards(AuthGuard('jwt'))
export class MessesController {
  private readonly logger = new Logger(MessesController.name);

  constructor(private readonly messesService: MessesService) {}

  @Post()
  async createMess(
    @Req() req: AuthenticatedRequest,
    @Body() body: { name: string; description?: string },
  ): Promise<{
    success: true;
    message: string;
    data: import('@repo/shared').MessResponse;
  }> {
    const userId = req.user!.id;
    this.logger.log(`📮 POST /messes - user: ${userId}`);

    const data = await this.messesService.createMess(userId, {
      name: body.name,
      description: body.description,
    });

    this.logger.log(`✅ Mess created response: ${data.id}`);
    return {
      success: true,
      message: 'Mess created successfully',
      data,
    };
  }

  @Get('me')
  async getMyMess(@Req() req: AuthenticatedRequest): Promise<{
    success: true;
    data: import('@repo/shared').MessResponse | null;
  }> {
    const userId = req.user!.id;
    this.logger.log(`📮 GET /messes/me - user: ${userId}`);

    const data = await this.messesService.getMyMess(userId);

    return {
      success: true,
      data,
    };
  }
}
