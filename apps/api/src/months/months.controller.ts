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
import {
  createMonthSchema,
  formatZodError,
  type MonthClosePreviewResponse,
} from '@repo/shared';
import { AuthUser } from '../auth/auth.service';
import { MembershipGuard } from '../auth/guards/membership.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
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
  @UseGuards(MembershipGuard)
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
      parsed.data.carryForward,
    );

    return {
      success: true,
      message: 'Month created successfully',
      data,
    };
  }

  /** Each member's final balance if the active month closed now. */
  @Get(':messId/close-preview')
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  async getClosePreview(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
  ): Promise<{
    success: true;
    message: string;
    data: MonthClosePreviewResponse;
  }> {
    validateUuid(messId, 'messId');
    this.logger.log(
      `📮 GET /months/${messId}/close-preview - user: ${req.user!.id}`,
    );

    const data = await this.monthsService.getClosePreview(messId);

    return {
      success: true,
      message: 'Request completed successfully',
      data,
    };
  }

  @Get(':messId/history')
  @UseGuards(MembershipGuard)
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
  @UseGuards(MembershipGuard)
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
