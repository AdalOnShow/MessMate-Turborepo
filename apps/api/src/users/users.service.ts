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
  constructor(private readonly configService: ConfigService) {}

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
}
