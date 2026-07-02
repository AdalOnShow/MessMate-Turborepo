import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { AuthUser } from '../auth/auth.service';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MessesService } from './messes.service';
import type {
  AddMemberInput,
  MemberFilters,
  UpdateMemberRoleInput,
  UpdateDefaultMealsDto,
} from '@repo/shared';

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

  @Post(':messId/members')
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  async addMember(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Body() body: AddMemberInput,
  ): Promise<{
    success: true;
    message: string;
    data: import('@repo/shared').MessMemberWithUser;
  }> {
    const actorId = req.user!.id;
    this.logger.log(`📮 POST /messes/${messId}/members - actor: ${actorId}`);

    const data = await this.messesService.addMember(
      messId,
      actorId,
      body.userId,
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
    @Body() body: UpdateMemberRoleInput,
  ): Promise<{
    success: true;
    message: string;
    data: import('@repo/shared').MessMemberWithUser;
  }> {
    const actorId = req.user!.id;
    this.logger.log(
      `📮 PATCH /messes/${messId}/members/${userId}/role - actor: ${actorId}`,
    );

    const data = await this.messesService.updateMemberRole(
      messId,
      actorId,
      userId,
      body.role,
    );

    return {
      success: true,
      message: 'Member role updated successfully',
      data,
    };
  }

  @Get(':messId/default-meals')
  async getDefaultMeals(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
  ): Promise<{
    success: true;
    message: string;
    data: import('@repo/shared').DefaultMealResponse[];
  }> {
    const userId = req.user!.id;
    this.logger.log(`📮 GET /messes/${messId}/default-meals - user: ${userId}`);

    const data = await this.messesService.getDefaultMeals(messId);

    return {
      success: true,
      message: 'Default meals retrieved successfully',
      data,
    };
  }

  @Put(':messId/default-meals')
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  async updateDefaultMeals(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Body() body: UpdateDefaultMealsDto,
  ): Promise<{
    success: true;
    message: string;
    data: import('@repo/shared').DefaultMealResponse[];
  }> {
    const actorId = req.user!.id;
    this.logger.log(
      `📮 PUT /messes/${messId}/default-meals - actor: ${actorId}`,
    );

    const data = await this.messesService.updateDefaultMeals(
      messId,
      actorId,
      body,
    );

    return {
      success: true,
      message: 'Default meals updated successfully',
      data,
    };
  }

  @Get(':messId/meal-types')
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
    const userId = req.user!.id;
    this.logger.log(`📮 GET /messes/${messId}/meal-types - user: ${userId}`);

    const data = await this.messesService.getMealTypes(messId);

    return {
      success: true,
      message: 'Meal types retrieved successfully',
      data,
    };
  }
}
