import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@repo/database';
import {
  updateProfileSchema,
  changePasswordSchema,
  formatZodError,
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
      throw new NotFoundException('User not found');
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
      throw new NotFoundException('User not found');
    }

    if (!user.password) {
      throw new BadRequestException('Password sign-in is not enabled');
    }

    const matches = await bcrypt.compare(
      parsed.data.currentPassword,
      user.password,
    );
    if (!matches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const saltRounds = Number(
      this.configService.get('BCRYPT_SALT_ROUNDS') ?? 10,
    );
    const password = await bcrypt.hash(parsed.data.newPassword, saltRounds);

    await prisma.users.update({
      where: { id: user.id },
      data: { password, updated_at: new Date() },
    });

    return { success: true };
  }

  async uploadAvatar(userId: string, file: MulterFile): Promise<UserProfile> {
    if (!file?.buffer) {
      throw new BadRequestException('No file provided');
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

  async searchUsers(query: string): Promise<UserSearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const users = await prisma.users.findMany({
      where: {
        deleted_at: null,
        OR: [
          { name: { contains: query.trim(), mode: 'insensitive' } },
          { email: { contains: query.trim(), mode: 'insensitive' } },
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
      take: 20,
      orderBy: { name: 'asc' },
    });

    return users;
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
      throw new ForbiddenException('Only managers can create member accounts');
    }

    const existing = await prisma.users.findFirst({
      where: { email: data.email.trim().toLowerCase(), deleted_at: null },
    });

    if (existing) {
      throw new BadRequestException(
        'An account with this email already exists',
      );
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

      await tx.mess_members.create({
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
          entity_id: newUser.id,
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
