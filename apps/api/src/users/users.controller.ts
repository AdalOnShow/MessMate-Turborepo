import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import type { ChangePasswordRequest, UpdateProfileRequest } from '@repo/shared';
import { AuthUser } from '../auth/auth.service';
import { UsersService } from './users.service';

type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@Req() req: AuthenticatedRequest) {
    return this.usersService.getProfile(req.user!.id);
  }

  @Patch('me')
  updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdateProfileRequest,
  ) {
    return this.usersService.updateProfile(req.user!.id, body);
  }

  @Patch('me/password')
  changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() body: ChangePasswordRequest,
  ) {
    return this.usersService.changePassword(
      req.user!.id,
      body.currentPassword,
      body.newPassword,
    );
  }
}
