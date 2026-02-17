import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { PaymentMethod, TrustTransactionType } from '@prisma/client';
import { BillingService } from './billing.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Controller('billing')
@UseGuards(SessionAuthGuard, PermissionGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('time-entries')
  @RequirePermissions('billing:write')
  createTimeEntry(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTimeEntryDto) {
    return this.billingService.createTimeEntry({ user, ...dto });
  }

  @Post('expenses')
  @RequirePermissions('billing:write')
  createExpense(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateExpenseDto) {
    return this.billingService.createExpense({ user, ...dto });
  }

  @Post('invoices')
  @RequirePermissions('billing:write')
  createInvoice(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateInvoiceDto) {
    return this.billingService.createInvoice({ user, ...dto });
  }

  @Get('invoices')
  @RequirePermissions('billing:read')
  listInvoices(@CurrentUser() user: AuthenticatedUser, @Query('matterId') matterId?: string) {
    return this.billingService.listInvoices(user, matterId);
  }

  @Post('invoices/:id/checkout')
  @RequirePermissions('billing:write')
  createCheckout(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.billingService.createCheckoutLink(user, id);
  }

  @Post('invoices/:id/payments')
  @RequirePermissions('billing:write')
  recordPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { amount: number; method: PaymentMethod; stripePaymentIntentId?: string; reference?: string },
  ) {
    return this.billingService.recordPayment({
      user,
      invoiceId: id,
      amount: body.amount,
      method: body.method,
      stripePaymentIntentId: body.stripePaymentIntentId,
      reference: body.reference,
    });
  }

  @Post('trust/transactions')
  @RequirePermissions('billing:write')
  trustTransaction(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { matterId: string; trustAccountId: string; type: TrustTransactionType; amount: number; description?: string },
  ) {
    return this.billingService.trustTransaction({
      user,
      matterId: body.matterId,
      trustAccountId: body.trustAccountId,
      type: body.type,
      amount: body.amount,
      description: body.description,
    });
  }

  @Get('trust/report')
  @RequirePermissions('billing:read')
  trustReport(@CurrentUser() user: AuthenticatedUser, @Query('trustAccountId') trustAccountId?: string) {
    return this.billingService.trustReport(user, trustAccountId);
  }

  @Get('trust/summary')
  @RequirePermissions('billing:read')
  trustSummary(@CurrentUser() user: AuthenticatedUser, @Query('trustAccountId') trustAccountId?: string) {
    return this.billingService.trustSummary(user, trustAccountId);
  }

  @Get('trust/reconciliation')
  @RequirePermissions('billing:read')
  trustReconciliation(@CurrentUser() user: AuthenticatedUser, @Query('trustAccountId') trustAccountId?: string) {
    return this.billingService.trustReconciliation(user, trustAccountId);
  }

  @Post('trust/transfer')
  @RequirePermissions('billing:write')
  trustTransfer(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { trustAccountId: string; fromMatterId: string; toMatterId: string; amount: number; description?: string },
  ) {
    return this.billingService.transferTrust({
      user,
      trustAccountId: body.trustAccountId,
      fromMatterId: body.fromMatterId,
      toMatterId: body.toMatterId,
      amount: body.amount,
      description: body.description,
    });
  }
}
