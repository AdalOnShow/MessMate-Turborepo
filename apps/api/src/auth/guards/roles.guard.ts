import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { prisma } from '@repo/database';

type AuthenticatedRequest = {
  user?: { id: string; email: string; name: string };
  params: Record<string, string>;
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('Not authenticated');
    }

    const messId = request.params.messId;

    if (!messId) {
      throw new ForbiddenException('Mess ID is required');
    }

    const membership = await prisma.mess_members.findFirst({
      where: {
        user_id: user.id,
        mess_id: messId,
        removed_at: null,
        deleted_at: null,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this mess');
    }

    if (!requiredRoles.includes(membership.mess_role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
