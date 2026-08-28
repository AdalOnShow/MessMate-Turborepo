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
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import {
  createDepositSchema,
  formatZodError,
  updateDepositSchema,
  type DepositListResponse,
  type DepositWithRelations,
} from '@repo/shared';
import { AuthUser } from '../auth/auth.service';
import { MembershipGuard } from '../auth/guards/membership.guard';
import { DepositsService } from './deposits.service';

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

@Controller('deposits')
@UseGuards(AuthGuard('jwt'))
export class DepositsController {
  private readonly logger = new Logger(DepositsController.name);

  constructor(private readonly depositsService: DepositsService) {}

  @Get(':messId/:monthId')
  @UseGuards(MembershipGuard)
  async listDeposits(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Param('monthId') monthId: string,
  ): Promise<{
    success: true;
    message: string;
    data: DepositListResponse;
  }> {
    validateUuid(messId, 'messId');
    validateUuid(monthId, 'monthId');

    const actorId = req.user!.id;
    this.logger.log(
      `📄 GET /deposits/${messId}/${monthId} - actor: ${actorId}`,
    );

    const data = await this.depositsService.listDeposits(
      messId,
      monthId,
      actorId,
    );
    return { success: true, message: 'Deposits fetched', data };
  }

  @Post(':messId/:monthId')
  async createDeposit(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Param('monthId') monthId: string,
    @Body() body: unknown,
  ): Promise<{
    success: true;
    message: string;
    data: DepositWithRelations;
  }> {
    validateUuid(messId, 'messId');
    validateUuid(monthId, 'monthId');

    const parsed = createDepositSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = formatZodError(parsed.error);
      throw new BadRequestException({
        message: 'Validation failed',
        details: fieldErrors,
      });
    }

    const actorId = req.user!.id;
    this.logger.log(
      `➕ POST /deposits/${messId}/${monthId} - actor: ${actorId}`,
    );

    const data = await this.depositsService.createDeposit(
      messId,
      monthId,
      actorId,
      parsed.data,
    );
    return { success: true, message: 'Deposit created', data };
  }

  @Patch(':messId/:depositId')
  async updateDeposit(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Param('depositId') depositId: string,
    @Body() body: unknown,
  ): Promise<{
    success: true;
    message: string;
    data: DepositWithRelations;
  }> {
    validateUuid(messId, 'messId');
    validateUuid(depositId, 'depositId');

    const parsed = updateDepositSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = formatZodError(parsed.error);
      throw new BadRequestException({
        message: 'Validation failed',
        details: fieldErrors,
      });
    }

    const actorId = req.user!.id;
    this.logger.log(
      `✏️ PATCH /deposits/${messId}/${depositId} - actor: ${actorId}`,
    );

    const data = await this.depositsService.updateDeposit(
      messId,
      depositId,
      actorId,
      parsed.data,
    );
    return { success: true, message: 'Deposit updated', data };
  }

  @Delete(':messId/:depositId')
  async deleteDeposit(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Param('depositId') depositId: string,
  ): Promise<{
    success: true;
    message: string;
    data: { id: string };
  }> {
    validateUuid(messId, 'messId');
    validateUuid(depositId, 'depositId');

    const actorId = req.user!.id;
    this.logger.log(
      `🗑 DELETE /deposits/${messId}/${depositId} - actor: ${actorId}`,
    );

    const data = await this.depositsService.deleteDeposit(
      messId,
      depositId,
      actorId,
    );
    return { success: true, message: 'Deposit deleted', data };
  }
}
