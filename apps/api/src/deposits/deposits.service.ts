import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, prisma } from '@repo/database';
import type {
  CreateDepositDto,
  DepositListResponse,
  DepositWithRelations,
  UpdateDepositDto,
} from '@repo/shared';

const userSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
} as const;

const memberUserSelect = {
  id: true,
  user: {
    select: {
      name: true,
      email: true,
      avatar: true,
    },
  },
} as const;

const depositInclude = {
  creator: { select: userSelect },
  member: { select: memberUserSelect },
} satisfies Prisma.depositsInclude;

type DepositRow = Prisma.depositsGetPayload<{
  include: typeof depositInclude;
}>;

function toDepositWithRelations(row: DepositRow): DepositWithRelations {
  return {
    id: row.id,
    mess_id: row.mess_id,
    month_id: row.month_id,
    member_id: row.member_id,
    amount: Number(row.amount),
    deposit_date: row.deposit_date.toISOString(),
    created_by: row.created_by,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    member: {
      id: row.member.id,
      name: row.member.user.name,
      email: row.member.user.email,
      avatar: row.member.user.avatar,
    },
    creator: {
      id: row.creator.id,
      name: row.creator.name,
      email: row.creator.email,
      avatar: row.creator.avatar,
    },
  };
}

@Injectable()
export class DepositsService {
  private readonly logger = new Logger(DepositsService.name);

  private async requireManager(messId: string, actorId: string) {
    const membership = await prisma.mess_members.findFirst({
      where: {
        mess_id: messId,
        user_id: actorId,
        mess_role: 'MANAGER',
        removed_at: null,
        deleted_at: null,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Only managers can manage deposits');
    }
  }

  private async findActiveMonth(messId: string, monthId?: string) {
    const month = await prisma.months.findFirst({
      where: {
        id: monthId,
        mess_id: messId,
        month_status: 'ACTIVE',
        deleted_at: null,
      },
    });

    if (!month) {
      throw new NotFoundException('Active month not found');
    }

    return month;
  }

  private async resolveMember(messId: string, memberId: string) {
    const member = await prisma.mess_members.findFirst({
      where: {
        id: memberId,
        mess_id: messId,
        removed_at: null,
        deleted_at: null,
      },
    });

    if (!member) {
      throw new BadRequestException(
        'Selected member is not an active member of this mess',
      );
    }

    return member;
  }

  async createDeposit(
    messId: string,
    monthId: string,
    actorId: string,
    data: CreateDepositDto,
  ): Promise<DepositWithRelations> {
    await this.requireManager(messId, actorId);
    const month = await this.findActiveMonth(messId, monthId);
    await this.resolveMember(messId, data.member_id);

    const created = await prisma.$transaction(async (tx) => {
      const deposit = await tx.deposits.create({
        data: {
          mess_id: messId,
          month_id: month.id,
          member_id: data.member_id,
          amount: data.amount,
          deposit_date: new Date(data.deposit_date),
          created_by: actorId,
        },
        include: depositInclude,
      });

      await tx.activity_logs.create({
        data: {
          mess_id: messId,
          month_id: month.id,
          actor_id: actorId,
          action: 'DEPOSIT_ADDED',
          entity_type: 'deposits',
          entity_id: deposit.id,
        },
      });

      return deposit;
    });

    this.logger.log(
      `✅ Deposit created: ${created.id} - ${Number(created.amount)}`,
    );
    return toDepositWithRelations(created);
  }

  async listDeposits(
    messId: string,
    monthId: string,
    actorId: string,
  ): Promise<DepositListResponse> {
    const membership = await prisma.mess_members.findFirst({
      where: {
        mess_id: messId,
        user_id: actorId,
        removed_at: null,
        deleted_at: null,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You must be an active member to view deposits',
      );
    }

    await this.findActiveMonth(messId, monthId);

    const rows = await prisma.deposits.findMany({
      where: { mess_id: messId, month_id: monthId, deleted_at: null },
      include: depositInclude,
      orderBy: { deposit_date: 'desc' },
    });

    const items = rows.map(toDepositWithRelations);

    const total =
      Math.round(items.reduce((sum, d) => sum + d.amount, 0) * 100) / 100;

    return {
      items,
      total,
      count: items.length,
    };
  }

  async updateDeposit(
    messId: string,
    depositId: string,
    actorId: string,
    data: UpdateDepositDto,
  ): Promise<DepositWithRelations> {
    await this.requireManager(messId, actorId);

    const existing = await prisma.deposits.findFirst({
      where: { id: depositId, mess_id: messId, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException('Deposit not found');
    }

    if (data.member_id && data.member_id !== existing.member_id) {
      await this.resolveMember(messId, data.member_id);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const deposit = await tx.deposits.update({
        where: { id: depositId },
        data: {
          member_id: data.member_id ?? existing.member_id,
          amount: data.amount ?? existing.amount,
          deposit_date: data.deposit_date
            ? new Date(data.deposit_date)
            : existing.deposit_date,
          updated_at: new Date(),
        },
        include: depositInclude,
      });

      await tx.activity_logs.create({
        data: {
          mess_id: messId,
          month_id: existing.month_id,
          actor_id: actorId,
          action: 'DEPOSIT_UPDATED',
          entity_type: 'deposits',
          entity_id: deposit.id,
        },
      });

      return deposit;
    });

    this.logger.log(`✏️ Deposit updated: ${updated.id}`);
    return toDepositWithRelations(updated);
  }

  async deleteDeposit(
    messId: string,
    depositId: string,
    actorId: string,
  ): Promise<{ id: string }> {
    await this.requireManager(messId, actorId);

    const existing = await prisma.deposits.findFirst({
      where: { id: depositId, mess_id: messId, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException('Deposit not found');
    }

    await prisma.deposits.update({
      where: { id: depositId },
      data: { deleted_at: new Date() },
    });

    this.logger.log(`🗑 Deposit deleted: ${depositId}`);
    return { id: depositId };
  }
}
