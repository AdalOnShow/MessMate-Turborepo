import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { createMonthSchema, formatZodError } from '@repo/shared';
import { AuthUser } from '../auth/auth.service';
import { MonthsService } from './months.service';

type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateUuid(value: string, fieldName: string): string {
  if (!uuidRegex.test(value)) {
    throw new BadRequestException({
      message: 'Validation failed',
      details: { [fieldName]: `Invalid ${fieldName} format` },
    });
  }
  return value;
}

@Controller('months')
@UseGuards(AuthGuard('jwt'))
export class MonthsController {
  private readonly logger = new Logger(MonthsController.name);

  constructor(private readonly monthsService: MonthsService) {}

  @Get(':messId/active')
  async getActiveMonth(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
  ): Promise<{
    success: true;
    message: string;
    data: import('@repo/shared').MonthResponse | null;
  }> {
    validateUuid(messId, 'messId');

    const userId = req.user!.id;
    this.logger.log(`📮 GET /months/${messId}/active - user: ${userId}`);

    const data = await this.monthsService.getActiveMonth(messId);

    return {
      success: true,
      message: 'Request completed successfully',
      data,
    };
  }

  @Post(':messId')
  async createMonth(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Body() body: unknown,
  ): Promise<{
    success: true;
    message: string;
    data: import('@repo/shared').MonthResponse;
  }> {
    validateUuid(messId, 'messId');

    const parsed = createMonthSchema.safeParse(body ?? {});
    if (!parsed.success) {
      const fieldErrors = formatZodError(parsed.error);
      throw new BadRequestException({
        message: 'Validation failed',
        details: fieldErrors,
      });
    }

    const actorId = req.user!.id;
    this.logger.log(`📮 POST /months/${messId} - actor: ${actorId}`);

    const data = await this.monthsService.createMonth(
      messId,
      actorId,
      parsed.data.title,
    );

    return {
      success: true,
      message: 'Month created successfully',
      data,
    };
  }

  @Get(':messId/history')
  async getMonthHistory(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
  ): Promise<{
    success: true;
    message: string;
    data: import('@repo/shared').MonthResponse[];
  }> {
    validateUuid(messId, 'messId');

    const userId = req.user!.id;
    this.logger.log(`📮 GET /months/${messId}/history - user: ${userId}`);

    const data = await this.monthsService.getMonthHistory(messId);

    return {
      success: true,
      message: 'Request completed successfully',
      data,
    };
  }

  @Get(':messId/:monthId/summary')
  async getMonthSummary(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Param('monthId') monthId: string,
  ): Promise<{
    success: true;
    message: string;
    data: import('@repo/shared').MonthSummaryResponse;
  }> {
    validateUuid(messId, 'messId');
    validateUuid(monthId, 'monthId');

    const userId = req.user!.id;
    this.logger.log(
      `📮 GET /months/${messId}/${monthId}/summary - user: ${userId}`,
    );

    const data = await this.monthsService.getMonthSummary(messId, monthId);

    return {
      success: true,
      message: 'Request completed successfully',
      data,
    };
  }
}
