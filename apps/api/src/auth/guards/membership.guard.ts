import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { prisma } from '@repo/database';

type AuthenticatedRequest = {
  user?: { id: string; email: string; name: string };
  params: Record<string, string>;
};

@Injectable()
export class MembershipGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    return true;
  }
}
