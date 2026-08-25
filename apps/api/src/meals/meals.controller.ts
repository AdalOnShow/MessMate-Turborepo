import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import {
  bulkMealEntriesSchema,
  formatZodError,
  type DailyMealReport,
  type MemberMealReport,
  type MonthMealSummary,
} from '@repo/shared';
import { AuthUser } from '../auth/auth.service';
import { MealsService } from './meals.service';

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

@Controller('meals')
@UseGuards(AuthGuard('jwt'))
export class MealsController {
  private readonly logger = new Logger(MealsController.name);

  constructor(private readonly mealsService: MealsService) {}

  @Post(':messId/:monthId')
  async bulkSaveMealEntries(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Param('monthId') monthId: string,
    @Body() body: unknown,
  ): Promise<{
    success: true;
    message: string;
    data: import('@repo/shared').MealEntryWithMember[];
  }> {
    validateUuid(messId, 'messId');
    validateUuid(monthId, 'monthId');

    const parsed = bulkMealEntriesSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = formatZodError(parsed.error);
      throw new BadRequestException({
        message: 'Validation failed',
        details: fieldErrors,
      });
    }

    const actorId = req.user!.id;
    this.logger.log(
      `📮 POST /meals/${messId}/${monthId} - actor: ${actorId}`,
    );

    const data = await this.mealsService.bulkSaveMealEntries(
      messId,
      monthId,
      actorId,
      parsed.data,
    );

    return {
      success: true,
      message: 'Meal entries saved successfully',
      data,
    };
  }

  @Get(':messId/:monthId')
  async getMealEntries(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Param('monthId') monthId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    success: true;
    message: string;
    data: import('@repo/shared').MealEntryWithMember[];
  }> {
    validateUuid(messId, 'messId');
    validateUuid(monthId, 'monthId');

    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    const userId = req.user!.id;
    this.logger.log(
      `📮 GET /meals/${messId}/${monthId}?startDate=${startDate}&endDate=${endDate} - user: ${userId}`,
    );

    const data = await this.mealsService.getMealEntries(
      messId,
      monthId,
      startDate,
      endDate,
    );

    return {
      success: true,
      message: 'Request completed successfully',
      data,
    };
  }

  @Delete(':messId/:entryId')
  async deleteMealEntry(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Param('entryId') entryId: string,
  ): Promise<{
    success: true;
    message: string;
  }> {
    validateUuid(messId, 'messId');
    validateUuid(entryId, 'entryId');

    const actorId = req.user!.id;
    this.logger.log(
      `📮 DELETE /meals/${messId}/${entryId} - actor: ${actorId}`,
    );

    await this.mealsService.deleteMealEntry(messId, entryId, actorId);

    return {
      success: true,
      message: 'Meal entry deleted successfully',
    };
  }

  @Get(':messId/:monthId/daily')
  async getDailyMealReport(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Param('monthId') monthId: string,
    @Query('date') date?: string,
  ): Promise<{
    success: true;
    message: string;
    data: DailyMealReport;
  }> {
    validateUuid(messId, 'messId');
    validateUuid(monthId, 'monthId');

    if (!date) {
      throw new BadRequestException('date query parameter is required');
    }

    const userId = req.user!.id;
    this.logger.log(
      `📮 GET /meals/${messId}/${monthId}/daily?date=${date} - user: ${userId}`,
    );

    const data = await this.mealsService.getDailyMealReport(
      messId,
      monthId,
      date,
    );

    return {
      success: true,
      message: 'Request completed successfully',
      data,
    };
  }

  @Get(':messId/:monthId/member/:memberId')
  async getMemberMealReport(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Param('monthId') monthId: string,
    @Param('memberId') memberId: string,
  ): Promise<{
    success: true;
    message: string;
    data: MemberMealReport;
  }> {
    validateUuid(messId, 'messId');
    validateUuid(monthId, 'monthId');
    validateUuid(memberId, 'memberId');

    const userId = req.user!.id;
    this.logger.log(
      `📮 GET /meals/${messId}/${monthId}/member/${memberId} - user: ${userId}`,
    );

    const data = await this.mealsService.getMemberMealReport(
      messId,
      monthId,
      memberId,
    );

    return {
      success: true,
      message: 'Request completed successfully',
      data,
    };
  }

  @Get(':messId/:monthId/summary')
  async getMonthMealSummary(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Param('monthId') monthId: string,
  ): Promise<{
    success: true;
    message: string;
    data: MonthMealSummary;
  }> {
    validateUuid(messId, 'messId');
    validateUuid(monthId, 'monthId');

    const userId = req.user!.id;
    this.logger.log(
      `📮 GET /meals/${messId}/${monthId}/summary - user: ${userId}`,
    );

    const data = await this.mealsService.getMonthMealSummary(
      messId,
      monthId,
    );

    return {
      success: true,
      message: 'Request completed successfully',
      data,
    };
  }
}
