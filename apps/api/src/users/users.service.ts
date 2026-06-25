import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@repo/database';
import type { UpdateProfileRequest } from '@repo/shared';
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

  async updateProfile(
    userId: string,
    data: UpdateProfileRequest,
  ): Promise<UserProfile> {
    const updateData: {
      name?: string;
      phone?: string | null;
      updated_at: Date;
    } = {
      updated_at: new Date(),
    };

    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name) throw new BadRequestException('Name cannot be empty');
      updateData.name = name;
    }

    if (data.phone !== undefined) {
      updateData.phone = data.phone?.trim() || null;
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

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const saltRounds = Number(
      this.configService.get('BCRYPT_SALT_ROUNDS') ?? 10,
    );
    const password = await bcrypt.hash(newPassword, saltRounds);

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

    // Get current avatar URL so we can delete the old one from Cloudinary
    const existing = await prisma.users.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    // Upload new avatar to Cloudinary
    const result = await this.cloudinaryService.uploadAvatar(
      file.buffer,
      userId,
    );

    // Delete old Cloudinary asset if it exists
    if (existing?.avatar) {
      const publicId = this.cloudinaryService.extractPublicId(existing.avatar);
      if (publicId) {
        await this.cloudinaryService.deleteByPublicId(publicId);
      }
    }

    const user = await prisma.users.update({
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

    return user;
  }

  async searchUsers(query: string): Promise<UserProfile[]> {
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
        phone: true,
        avatar: true,
        manager_created: true,
        email_verified: true,
      },
      take: 20,
      orderBy: { name: 'asc' },
    });

    return users;
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
