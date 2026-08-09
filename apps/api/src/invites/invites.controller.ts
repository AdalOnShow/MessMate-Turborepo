import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { inviteUserSchema, formatZodError } from '@repo/shared';
import { AuthUser } from '../auth/auth.service';
import { InvitesService } from './invites.service';

type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateUuid(value: string, fieldName: string): string {
  if (!uuidRegex.test(value)) {
    throw new BadRequestException({
      message: 'Validation failed',
      details: { [fieldName]: `Invalid ${fieldName} format` },
    });
  }
  return value;
}

@Controller('invites')
@UseGuards(AuthGuard('jwt'))
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async inviteUser(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parsed = inviteUserSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = formatZodError(parsed.error);
      throw new BadRequestException({
        message: 'Validation failed',
        details: fieldErrors,
      });
    }

    return this.invitesService.inviteUserForActor(
      req.user!.id,
      parsed.data.email,
    );
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
    validateUuid(id, 'id');
    return this.invitesService.acceptInvite(id, req.user!.id);
  }

  @Post(':id/reject')
  async rejectInvite(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    validateUuid(id, 'id');
    return this.invitesService.rejectInvite(id, req.user!.id);
  }
}
