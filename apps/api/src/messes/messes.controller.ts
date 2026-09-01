import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import {
  createMessSchema,
  updateMessSchema,
  createMealTypeSchema,
  updateMealTypeSchema,
  addMemberSchema,
  updateMemberRoleSchema,
  formatZodError,
  type MemberFilters,
} from '@repo/shared';
import { AuthUser } from '../auth/auth.service';
import { MembershipGuard } from '../auth/guards/membership.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MessesService } from './messes.service';

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

@Controller('messes')
@UseGuards(AuthGuard('jwt'))
export class MessesController {
  private readonly logger = new Logger(MessesController.name);

  constructor(private readonly messesService: MessesService) {}

  @Post()
  async createMess(
    @Req() req: AuthenticatedRequest,
    @Body() body: unknown,
  ): Promise<{
    success: true;
    message: string;
    data: import('@repo/shared').MessResponse;
  }> {
    const parsed = createMessSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = formatZodError(parsed.error);
      throw new BadRequestException({
        message: 'Validation failed',
        details: fieldErrors,
      });
    }

    const userId = req.user!.id;
    this.logger.log(`📮 POST /messes - user: ${userId}`);

    const data = await this.messesService.createMess(userId, parsed.data);

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
    message: string;
    data: import('@repo/shared').MessResponse | null;
  }> {
    const userId = req.user!.id;
    this.logger.log(`📮 GET /messes/me - user: ${userId}`);

    const data = await this.messesService.getMyMess(userId);

    return {
      success: true,
      message: 'Request completed successfully',
      data,
    };
  }

  @Get(':messId/members')
  @UseGuards(MembershipGuard)
  async getMembers(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Query('search') search?: string,
    @Query('role') role?: 'MANAGER' | 'MEMBER',
    @Query('status') status?: 'ACTIVE' | 'REMOVED',
  ): Promise<{
    success: true;
    message: string;
    data: import('@repo/shared').MessMemberWithUser[];
  }> {
    validateUuid(messId, 'messId');

    const userId = req.user!.id;
    this.logger.log(`📮 GET /messes/${messId}/members - user: ${userId}`);

    const filters: MemberFilters = {};
    if (search) filters.search = search;
    if (role) filters.role = role;
    if (status) filters.status = status;

    const data = await this.messesService.getMembers(messId, filters);

    return {
      success: true,
      message: 'Request completed successfully',
      data,
    };
  }

  @Get(':messId/members/calculations')
  @UseGuards(MembershipGuard)
  async getMemberCalculations(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
  ): Promise<{
    success: true;
    message: string;
    data: import('@repo/shared').MemberCalculationList;
  }> {
    validateUuid(messId, 'messId');

    const userId = req.user!.id;
    this.logger.log(
      `📮 GET /messes/${messId}/members/calculations - user: ${userId}`,
    );

    const data = await this.messesService.getMemberCalculations(messId);

    return {
      success: true,
      message: 'Member calculations retrieved successfully',
      data,
    };
  }

  @Get(':messId/dashboard')
  @UseGuards(MembershipGuard)
  async getDashboard(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
  ): Promise<{
    success: true;
    message: string;
    data: import('@repo/shared').MessDashboard;
  }> {
    validateUuid(messId, 'messId');

    const userId = req.user!.id;
    this.logger.log(`📮 GET /messes/${messId}/dashboard - user: ${userId}`);

    const data = await this.messesService.getDashboard(messId);

    return {
      success: true,
      message: 'Dashboard data retrieved successfully',
      data,
    };
  }

  @Get(':messId/activities')
  @UseGuards(MembershipGuard)
  async getRecentActivities(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
  ): Promise<{
    success: true;
    message: string;
    data: import('@repo/shared').ActivityLog[];
  }> {
    validateUuid(messId, 'messId');

    const userId = req.user!.id;
    this.logger.log(`📮 GET /messes/${messId}/activities - user: ${userId}`);

    const data = await this.messesService.getRecentActivities(messId, 10);

    return {
      success: true,
      message: 'Recent activities retrieved successfully',
      data,
    };
  }

  @Post(':messId/members')
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  async addMember(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Body() body: unknown,
  ): Promise<{
    success: true;
    message: string;
    data: import('@repo/shared').MessMemberWithUser;
  }> {
    validateUuid(messId, 'messId');

    const parsed = addMemberSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = formatZodError(parsed.error);
      throw new BadRequestException({
        message: 'Validation failed',
        details: fieldErrors,
      });
    }

    const actorId = req.user!.id;
    this.logger.log(`📮 POST /messes/${messId}/members - actor: ${actorId}`);

    const data = await this.messesService.addMember(
      messId,
      actorId,
      parsed.data.userId,
    );

    return {
      success: true,
      message: 'Member added successfully',
      data,
    };
  }

  @Delete(':messId/members/:userId')
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  async removeMember(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Param('userId') userId: string,
  ): Promise<{
    success: true;
    message: string;
  }> {
    validateUuid(messId, 'messId');
    validateUuid(userId, 'userId');

    const actorId = req.user!.id;
    this.logger.log(
      `📮 DELETE /messes/${messId}/members/${userId} - actor: ${actorId}`,
    );

    await this.messesService.removeMember(messId, actorId, userId);

    return {
      success: true,
      message: 'Member removed successfully',
    };
  }

  @Patch(':messId/members/:userId/role')
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  async updateMemberRole(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Param('userId') userId: string,
    @Body() body: unknown,
  ): Promise<{
    success: true;
    message: string;
    data: import('@repo/shared').MessMemberWithUser;
  }> {
    validateUuid(messId, 'messId');
    validateUuid(userId, 'userId');

    const parsed = updateMemberRoleSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = formatZodError(parsed.error);
      throw new BadRequestException({
        message: 'Validation failed',
        details: fieldErrors,
      });
    }

    const actorId = req.user!.id;
    this.logger.log(
      `📮 PATCH /messes/${messId}/members/${userId}/role - actor: ${actorId}`,
    );

    const data = await this.messesService.updateMemberRole(
      messId,
      actorId,
      userId,
      parsed.data.role,
    );

    return {
      success: true,
      message: 'Member role updated successfully',
      data,
    };
  }

  @Get(':messId/meal-types')
  @UseGuards(MembershipGuard)
  async getMealTypes(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
  ): Promise<{
    success: true;
    message: string;
    data: {
      id: string;
      mess_id: string;
      name: string;
      value: number;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    }[];
  }> {
    validateUuid(messId, 'messId');

    const userId = req.user!.id;
    this.logger.log(`📮 GET /messes/${messId}/meal-types - user: ${userId}`);

    const data = await this.messesService.getMealTypes(messId);

    return {
      success: true,
      message: 'Meal types retrieved successfully',
      data,
    };
  }

  @Post(':messId/meal-types')
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  async createMealType(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Body() body: unknown,
  ): Promise<{
    success: true;
    message: string;
    data: import('@repo/shared').MealTypeResponse;
  }> {
    validateUuid(messId, 'messId');

    const parsed = createMealTypeSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = formatZodError(parsed.error);
      throw new BadRequestException({
        message: 'Validation failed',
        details: fieldErrors,
      });
    }

    const actorId = req.user!.id;
    this.logger.log(`📮 POST /messes/${messId}/meal-types - actor: ${actorId}`);

    const data = await this.messesService.createMealType(
      messId,
      actorId,
      parsed.data,
    );

    return {
      success: true,
      message: 'Meal type created successfully',
      data,
    };
  }

  @Delete(':messId/meal-types/:mealTypeId')
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  async deleteMealType(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Param('mealTypeId') mealTypeId: string,
  ): Promise<{
    success: true;
    message: string;
  }> {
    validateUuid(messId, 'messId');
    validateUuid(mealTypeId, 'mealTypeId');

    const actorId = req.user!.id;
    this.logger.log(
      `📮 DELETE /messes/${messId}/meal-types/${mealTypeId} - actor: ${actorId}`,
    );

    await this.messesService.deleteMealType(messId, mealTypeId, actorId);

    return {
      success: true,
      message: 'Meal type deleted successfully',
    };
  }

  @Patch(':messId')
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  async updateMess(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Body() body: unknown,
  ): Promise<{
    success: true;
    message: string;
    data: import('@repo/shared').MessResponse;
  }> {
    validateUuid(messId, 'messId');

    const parsed = updateMessSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = formatZodError(parsed.error);
      throw new BadRequestException({
        message: 'Validation failed',
        details: fieldErrors,
      });
    }

    if (Object.keys(parsed.data).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const actorId = req.user!.id;
    this.logger.log(`📮 PATCH /messes/${messId} - actor: ${actorId}`);

    const data = await this.messesService.updateMess(
      messId,
      actorId,
      parsed.data,
    );

    return {
      success: true,
      message: 'Mess updated successfully',
      data,
    };
  }

  @Patch(':messId/meal-types/:mealTypeId')
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  async updateMealType(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Param('mealTypeId') mealTypeId: string,
    @Body() body: unknown,
  ): Promise<{
    success: true;
    message: string;
    data: import('@repo/shared').MealTypeResponse;
  }> {
    validateUuid(messId, 'messId');
    validateUuid(mealTypeId, 'mealTypeId');

    const parsed = updateMealTypeSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = formatZodError(parsed.error);
      throw new BadRequestException({
        message: 'Validation failed',
        details: fieldErrors,
      });
    }

    if (Object.keys(parsed.data).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const actorId = req.user!.id;
    this.logger.log(
      `📮 PATCH /messes/${messId}/meal-types/${mealTypeId} - actor: ${actorId}`,
    );

    const data = await this.messesService.updateMealType(
      messId,
      mealTypeId,
      actorId,
      parsed.data,
    );

    return {
      success: true,
      message: 'Meal type updated successfully',
      data,
    };
  }
}
