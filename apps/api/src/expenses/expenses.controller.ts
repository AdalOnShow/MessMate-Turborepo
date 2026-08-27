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
  createExpenseSchema,
  formatZodError,
  updateExpenseSchema,
  type ExpenseListResponse,
  type ExpenseWithRelations,
} from '@repo/shared';
import { AuthUser } from '../auth/auth.service';
import { MembershipGuard } from '../auth/guards/membership.guard';
import { ExpensesService } from './expenses.service';

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

@Controller('expenses')
@UseGuards(AuthGuard('jwt'))
export class ExpensesController {
  private readonly logger = new Logger(ExpensesController.name);

  constructor(private readonly expensesService: ExpensesService) {}

  @Get(':messId/:monthId')
  @UseGuards(MembershipGuard)
  async listExpenses(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Param('monthId') monthId: string,
  ): Promise<{
    success: true;
    message: string;
    data: ExpenseListResponse;
  }> {
    validateUuid(messId, 'messId');
    validateUuid(monthId, 'monthId');

    const actorId = req.user!.id;
    this.logger.log(
      `📄 GET /expenses/${messId}/${monthId} - actor: ${actorId}`,
    );

    const data = await this.expensesService.listExpenses(
      messId,
      monthId,
      actorId,
    );
    return { success: true, message: 'Expenses fetched', data };
  }

  @Post(':messId/:monthId')
  async createExpense(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Param('monthId') monthId: string,
    @Body() body: unknown,
  ): Promise<{
    success: true;
    message: string;
    data: ExpenseWithRelations;
  }> {
    validateUuid(messId, 'messId');
    validateUuid(monthId, 'monthId');

    const parsed = createExpenseSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = formatZodError(parsed.error);
      throw new BadRequestException({
        message: 'Validation failed',
        details: fieldErrors,
      });
    }

    const actorId = req.user!.id;
    this.logger.log(
      `➕ POST /expenses/${messId}/${monthId} - actor: ${actorId}`,
    );

    const data = await this.expensesService.createExpense(
      messId,
      monthId,
      actorId,
      parsed.data,
    );
    return { success: true, message: 'Expense created', data };
  }

  @Patch(':messId/:expenseId')
  async updateExpense(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Param('expenseId') expenseId: string,
    @Body() body: unknown,
  ): Promise<{
    success: true;
    message: string;
    data: ExpenseWithRelations;
  }> {
    validateUuid(messId, 'messId');
    validateUuid(expenseId, 'expenseId');

    const parsed = updateExpenseSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = formatZodError(parsed.error);
      throw new BadRequestException({
        message: 'Validation failed',
        details: fieldErrors,
      });
    }

    const actorId = req.user!.id;
    this.logger.log(
      `✏️ PATCH /expenses/${messId}/${expenseId} - actor: ${actorId}`,
    );

    const data = await this.expensesService.updateExpense(
      messId,
      expenseId,
      actorId,
      parsed.data,
    );
    return { success: true, message: 'Expense updated', data };
  }

  @Delete(':messId/:expenseId')
  async deleteExpense(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Param('expenseId') expenseId: string,
  ): Promise<{
    success: true;
    message: string;
    data: { id: string };
  }> {
    validateUuid(messId, 'messId');
    validateUuid(expenseId, 'expenseId');

    const actorId = req.user!.id;
    this.logger.log(
      `🗑 DELETE /expenses/${messId}/${expenseId} - actor: ${actorId}`,
    );

    const data = await this.expensesService.deleteExpense(
      messId,
      expenseId,
      actorId,
    );
    return { success: true, message: 'Expense deleted', data };
  }
}
