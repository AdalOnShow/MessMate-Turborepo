import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import type { ChangePasswordRequest, UpdateProfileRequest } from '@repo/shared';
import { AuthUser } from '../auth/auth.service';
import { UsersService } from './users.service';
import { avatarUploadOptions } from '../common/upload/avatar-upload.options';
import type { MulterFile } from '../common/upload/multer.types';

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

  @Get('search')
  searchUsers(@Query('q') query: string) {
    return this.usersService.searchUsers(query ?? '');
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

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar', avatarUploadOptions))
  uploadAvatar(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: MulterFile,
  ) {
    return this.usersService.uploadAvatar(req.user!.id, file);
  }

  @Delete('me/avatar')
  deleteAvatar(@Req() req: AuthenticatedRequest) {
    return this.usersService.deleteAvatar(req.user!.id);
  }

  @Post('create-member')
  createMember(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      messId: string;
    },
  ) {
    return this.usersService.createMemberAccount(body, req.user!.id);
  }
}
