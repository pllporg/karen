import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateContactRelationshipDto } from './dto/create-contact-relationship.dto';

@Controller('contacts')
@UseGuards(SessionAuthGuard, PermissionGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @RequirePermissions('contacts:read')
  list(@CurrentUser() user: AuthenticatedUser, @Query('search') search?: string, @Query('tag') tag?: string) {
    return this.contactsService.list(user.organizationId, search, tag);
  }

  @Post()
  @RequirePermissions('contacts:write')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateContactDto) {
    return this.contactsService.create({
      organizationId: user.organizationId,
      actorUserId: user.id,
      ...dto,
    });
  }

  @Get(':id/graph')
  @RequirePermissions('contacts:read')
  graph(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.contactsService.graph(user.organizationId, id);
  }

  @Post('relationships')
  @RequirePermissions('contacts:write')
  createRelationship(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateContactRelationshipDto) {
    return this.contactsService.createRelationship({
      organizationId: user.organizationId,
      actorUserId: user.id,
      ...dto,
    });
  }

  @Get('dedupe/suggestions')
  @RequirePermissions('contacts:read')
  dedupe(@CurrentUser() user: AuthenticatedUser) {
    return this.contactsService.dedupeSuggestions(user.organizationId);
  }

  @Post('dedupe/merge')
  @RequirePermissions('contacts:write')
  merge(@CurrentUser() user: AuthenticatedUser, @Body() body: { primaryId: string; duplicateId: string }) {
    return this.contactsService.mergeContacts({
      organizationId: user.organizationId,
      actorUserId: user.id,
      primaryId: body.primaryId,
      duplicateId: body.duplicateId,
    });
  }

  @Post('dedupe/decisions')
  @RequirePermissions('contacts:write')
  dedupeDecision(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { primaryId: string; duplicateId: string; decision: 'OPEN' | 'IGNORE' | 'DEFER' },
  ) {
    return this.contactsService.setDedupeDecision({
      organizationId: user.organizationId,
      actorUserId: user.id,
      primaryId: body.primaryId,
      duplicateId: body.duplicateId,
      decision: body.decision,
    });
  }
}
