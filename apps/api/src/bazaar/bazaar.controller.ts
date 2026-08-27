import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import {
  createBazaarSchema,
  formatZodError,
  updateBazaarSchema,
  type BazaarSubmissionWithRelations,
  type BazaarHistory,
} from '@repo/shared';
import { AuthUser } from '../auth/auth.service';
import { MembershipGuard } from '../auth/guards/membership.guard';
import { BazaarService } from './bazaar.service';

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

@Controller('bazaar')
@UseGuards(AuthGuard('jwt'))
export class BazaarController {
  private readonly logger = new Logger(BazaarController.name);

  constructor(private readonly bazaarService: BazaarService) {}

  @Post(':messId/:monthId')
  async submitBazaar(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Param('monthId') monthId: string,
    @Body() body: unknown,
  ): Promise<{
    success: true;
    message: string;
    data: BazaarSubmissionWithRelations;
  }> {
    validateUuid(messId, 'messId');
    validateUuid(monthId, 'monthId');

    const parsed = createBazaarSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = formatZodError(parsed.error);
      throw new BadRequestException({
        message: 'Validation failed',
        details: fieldErrors,
      });
    }

    const actorId = req.user!.id;
    this.logger.log(`📮 POST /bazaar/${messId}/${monthId} - actor: ${actorId}`);

    const data = await this.bazaarService.submitBazaar(
      messId,
      monthId,
      actorId,
      parsed.data,
    );

    return {
      success: true,
      message: 'Bazaar submitted successfully',
      data,
    };
  }

  @Get(':messId/:monthId')
  @UseGuards(MembershipGuard)
  async getBazaarHistory(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Param('monthId') monthId: string,
  ): Promise<{
    success: true;
    message: string;
    data: BazaarHistory;
  }> {
    validateUuid(messId, 'messId');
    validateUuid(monthId, 'monthId');

    const userId = req.user!.id;
    this.logger.log(`📮 GET /bazaar/${messId}/${monthId} - user: ${userId}`);

    const data = await this.bazaarService.getBazaarHistory(messId, monthId);

    return {
      success: true,
      message: 'Request completed successfully',
      data,
    };
  }

  @Patch(':messId/:submissionId')
  async updateBazaar(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Param('submissionId') submissionId: string,
    @Body() body: unknown,
  ): Promise<{
    success: true;
    message: string;
    data: BazaarSubmissionWithRelations;
  }> {
    validateUuid(messId, 'messId');
    validateUuid(submissionId, 'submissionId');

    const parsed = updateBazaarSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = formatZodError(parsed.error);
      throw new BadRequestException({
        message: 'Validation failed',
        details: fieldErrors,
      });
    }

    const actorId = req.user!.id;
    this.logger.log(
      `📮 PATCH /bazaar/${messId}/${submissionId} - actor: ${actorId}`,
    );

    const data = await this.bazaarService.updateBazaar(
      messId,
      submissionId,
      actorId,
      parsed.data,
    );

    return {
      success: true,
      message: 'Bazaar updated successfully',
      data,
    };
  }

  @Delete(':messId/:submissionId')
  async deleteBazaar(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Param('submissionId') submissionId: string,
  ): Promise<{
    success: true;
    message: string;
  }> {
    validateUuid(messId, 'messId');
    validateUuid(submissionId, 'submissionId');

    const actorId = req.user!.id;
    this.logger.log(
      `📮 DELETE /bazaar/${messId}/${submissionId} - actor: ${actorId}`,
    );

    await this.bazaarService.deleteBazaar(messId, submissionId, actorId);

    return {
      success: true,
      message: 'Bazaar deleted successfully',
    };
  }

  @Post(':messId/:submissionId/approve')
  async approveBazaar(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Param('submissionId') submissionId: string,
  ): Promise<{
    success: true;
    message: string;
    data: BazaarSubmissionWithRelations;
  }> {
    validateUuid(messId, 'messId');
    validateUuid(submissionId, 'submissionId');

    const actorId = req.user!.id;
    this.logger.log(
      `📮 POST /bazaar/${messId}/${submissionId}/approve - actor: ${actorId}`,
    );

    const data = await this.bazaarService.approveBazaar(
      messId,
      submissionId,
      actorId,
    );

    return {
      success: true,
      message: 'Bazaar approved successfully',
      data,
    };
  }

  @Post(':messId/:submissionId/reject')
  async rejectBazaar(
    @Req() req: AuthenticatedRequest,
    @Param('messId') messId: string,
    @Param('submissionId') submissionId: string,
  ): Promise<{
    success: true;
    message: string;
    data: BazaarSubmissionWithRelations;
  }> {
    validateUuid(messId, 'messId');
    validateUuid(submissionId, 'submissionId');

    const actorId = req.user!.id;
    this.logger.log(
      `📮 POST /bazaar/${messId}/${submissionId}/reject - actor: ${actorId}`,
    );

    const data = await this.bazaarService.rejectBazaar(
      messId,
      submissionId,
      actorId,
    );

    return {
      success: true,
      message: 'Bazaar rejected successfully',
      data,
    };
  }
}
