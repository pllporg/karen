'use client';

import { useApiQuery, type UseApiQueryResult } from './use-api-query';

export interface Invoice {
  id: string;
  matterId: string;
  matterName: string;
  amount: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';
  dueDate: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paidAt: string;
}

export interface BillingSummary {
  totalOutstanding: number;
  totalPaid: number;
  invoices: Invoice[];
  recentPayments: Payment[];
}

export function useBillingData(): UseApiQueryResult<BillingSummary> {
  return useApiQuery<BillingSummary>({
    key: 'billing:summary',
    endpoint: '/billing/trust/summary',
  });
}
