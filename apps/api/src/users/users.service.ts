import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@repo/database';
import {
  updateProfileSchema,
  changePasswordSchema,
  formatZodError,
  ErrorCode,
  ValidationMessage,
} from '@repo/shared';
import { CloudinaryService } from '../common/services/cloudinary.service';
import type { MulterFile } from '../common/upload/multer.types';

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  manager_created: boolean;
  email_verified: boolean;
};

export type UserSearchResult = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  manager_created: boolean;
  email_verified: boolean;
};

/** "sharif@gmail.com" -> "sh****@gmail.com" */
function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return '****';
  const local = email.slice(0, at);
  return `${local.slice(0, Math.min(2, local.length))}****${email.slice(at)}`;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly configService: ConfigService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        manager_created: true,
        email_verified: true,
      },
    });

    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        code: ErrorCode.USER_NOT_FOUND,
      });
    }

    return user;
  }

  async updateProfile(userId: string, data: unknown): Promise<UserProfile> {
    const parsed = updateProfileSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors = formatZodError(parsed.error);
      throw new BadRequestException({
        message: 'Validation failed',
        details: fieldErrors,
      });
    }

    const updateData: {
      name?: string;
      phone?: string | null;
      updated_at: Date;
    } = {
      updated_at: new Date(),
    };

    if (parsed.data.name !== undefined) {
      updateData.name = parsed.data.name;
    }

    if (parsed.data.phone !== undefined) {
      updateData.phone = parsed.data.phone ?? null;
    }

    const user = await prisma.users.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        manager_created: true,
        email_verified: true,
      },
    });

    return user;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    currentSessionId?: string,
  ): Promise<{ success: true }> {
    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
    });
    if (!parsed.success) {
      const fieldErrors = formatZodError(parsed.error);
      throw new BadRequestException({
        message: 'Validation failed',
        details: fieldErrors,
      });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        code: ErrorCode.USER_NOT_FOUND,
      });
    }

    if (!user.password) {
      throw new BadRequestException({
        message: 'Password sign-in is not enabled',
        code: ErrorCode.PASSWORD_NOT_SET,
      });
    }

    const matches = await bcrypt.compare(
      parsed.data.currentPassword,
      user.password,
    );
    if (!matches) {
      // 400, not 401: the web client treats a 401 as an expired session.
      throw new BadRequestException({
        message: 'Current password is incorrect',
        code: ErrorCode.CURRENT_PASSWORD_INCORRECT,
        details: {
          currentPassword: ValidationMessage.CURRENT_PASSWORD_INCORRECT,
        },
      });
    }

    const saltRounds = Number(
      this.configService.get('BCRYPT_SALT_ROUNDS') ?? 10,
    );
    const password = await bcrypt.hash(parsed.data.newPassword, saltRounds);

    // A changed password signs out every other device, so whoever knew the
    // old one loses access. The device making the change stays signed in.
    await prisma.$transaction([
      prisma.users.update({
        where: { id: user.id },
        data: { password, updated_at: new Date() },
      }),
      prisma.user_sessions.updateMany({
        where: {
          user_id: user.id,
          revoked_at: null,
          ...(currentSessionId ? { id: { not: currentSessionId } } : {}),
        },
        data: { revoked_at: new Date() },
      }),
    ]);

    return { success: true };
  }

  async uploadAvatar(userId: string, file: MulterFile): Promise<UserProfile> {
    if (!file?.buffer) {
      throw new BadRequestException({
        message: 'No file provided',
        code: ErrorCode.FILE_REQUIRED,
      });
    }

    // Upload new avatar to Cloudinary first
    const result = await this.cloudinaryService.uploadAvatar(
      file.buffer,
      userId,
    );

    // Atomically update DB and get old avatar URL
    const user = await prisma.$transaction(async (tx) => {
      // Lock the user row and get current avatar
      const current = await tx.users.findUnique({
        where: { id: userId },
        select: { avatar: true },
      });

      // Update with new avatar
      const updated = await tx.users.update({
        where: { id: userId },
        data: { avatar: result.secure_url, updated_at: new Date() },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          manager_created: true,
          email_verified: true,
        },
      });

      return { user: updated, oldAvatar: current?.avatar };
    });

    // Delete old Cloudinary asset after transaction commits
    if (user.oldAvatar) {
      const publicId = this.cloudinaryService.extractPublicId(user.oldAvatar);
      if (publicId) {
        await this.cloudinaryService.deleteByPublicId(publicId);
      }
    }

    return user.user;
  }

  /**
   * Finds people a manager can invite.
   *
   * This used to let any signed-in user list everyone's name and email by
   * typing two letters. Now only managers may search, the query needs 3+
   * characters, and emails are masked unless the manager typed the exact
   * address. Invites are sent by user id, so the full email is not needed.
   */
  async searchUsers(
    actorId: string,
    query: string,
  ): Promise<UserSearchResult[]> {
    const q = query.trim().replace(/\s+/g, ' ').slice(0, 100);
    if (q.length < 3) {
      return [];
    }

    const isManager = await prisma.mess_members.findFirst({
      where: {
        user_id: actorId,
        mess_role: 'MANAGER',
        removed_at: null,
        deleted_at: null,
      },
      select: { id: true },
    });
    if (!isManager) {
      throw new ForbiddenException({
        message: 'Only managers can search for people to invite',
        code: ErrorCode.MANAGER_ONLY,
      });
    }

    const users = await prisma.users.findMany({
      where: {
        deleted_at: null,
        id: { not: actorId },
        OR: [
          // Every word must appear in the name, so "Rahim Uddin" still
          // matches with extra spaces or the words in another order.
          {
            AND: q
              .split(/\s+/)
              .filter(Boolean)
              .map((word) => ({
                name: { contains: word, mode: 'insensitive' as const },
              })),
          },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        manager_created: true,
        email_verified: true,
      },
      take: 10,
      orderBy: { name: 'asc' },
    });

    const exact = q.toLowerCase();
    return users.map((u) => ({
      ...u,
      email: u.email.toLowerCase() === exact ? u.email : maskEmail(u.email),
    }));
  }

  async createMemberAccount(
    data: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      messId: string;
    },
    managerId: string,
  ): Promise<UserProfile> {
    const membership = await prisma.mess_members.findFirst({
      where: {
        mess_id: data.messId,
        user_id: managerId,
        removed_at: null,
        deleted_at: null,
      },
      select: { mess_role: true },
    });

    if (!membership || membership.mess_role !== 'MANAGER') {
      throw new ForbiddenException({
        message: 'Only managers can create member accounts',
        code: ErrorCode.MANAGER_ONLY,
      });
    }

    const existing = await prisma.users.findFirst({
      where: { email: data.email.trim().toLowerCase(), deleted_at: null },
    });

    if (existing) {
      throw new BadRequestException({
        message: 'An account with this email already exists',
        code: ErrorCode.EMAIL_IN_USE,
      });
    }

    const saltRounds = Number(
      this.configService.get('BCRYPT_SALT_ROUNDS') ?? 10,
    );
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.users.create({
        data: {
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          password: hashedPassword,
          phone: data.phone?.trim() || null,
          manager_created: true,
          email_verified: false,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          manager_created: true,
          email_verified: true,
        },
      });

      const member = await tx.mess_members.create({
        data: {
          mess_id: data.messId,
          user_id: newUser.id,
          mess_role: 'MEMBER',
        },
      });

      await tx.activity_logs.create({
        data: {
          mess_id: data.messId,
          actor_id: managerId,
          action: 'MEMBER_ADDED',
          entity_type: 'mess_members',
          entity_id: member.id,
        },
      });

      return newUser;
    });

    return user;
  }

  async deleteAvatar(userId: string): Promise<UserProfile> {
    const existing = await prisma.users.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    if (existing?.avatar) {
      const publicId = this.cloudinaryService.extractPublicId(existing.avatar);
      if (publicId) {
        await this.cloudinaryService.deleteByPublicId(publicId);
      }
    }

    const user = await prisma.users.update({
      where: { id: userId },
      data: { avatar: null, updated_at: new Date() },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        manager_created: true,
        email_verified: true,
      },
    });

    return user;
  }
}
