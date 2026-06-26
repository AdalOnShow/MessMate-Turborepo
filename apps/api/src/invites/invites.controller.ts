import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { AuthUser } from '../auth/auth.service';
import { InvitesService } from './invites.service';

type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

@Controller('invites')
@UseGuards(AuthGuard('jwt'))
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post()
  async inviteUser(
    @Req() req: AuthenticatedRequest,
    @Body('email') email: string,
  ) {
    return this.invitesService.inviteUserForActor(req.user!.id, email);
  }

  @Get('pending')
  async getPendingInvites(@Req() req: AuthenticatedRequest) {
    return this.invitesService.getPendingInvites(req.user!.id);
  }

  @Post(':id/accept')
  async acceptInvite(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.invitesService.acceptInvite(id, req.user!.id);
  }

  @Post(':id/reject')
  async rejectInvite(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.invitesService.rejectInvite(id, req.user!.id);
  }
}
