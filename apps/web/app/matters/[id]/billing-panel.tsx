import { Dispatch, SetStateAction } from 'react';
import { PAYMENT_METHOD_OPTIONS, TRUST_TRANSACTION_TYPE_OPTIONS, TrustAccountOption } from './types';

type BillingPanelProps = {
  dashboard: any;
  billingStatusMessage: string | null;
  timeEntryDescription: string;
  setTimeEntryDescription: Dispatch<SetStateAction<string>>;
  timeEntryStartAt: string;
  setTimeEntryStartAt: Dispatch<SetStateAction<string>>;
  timeEntryEndAt: string;
  setTimeEntryEndAt: Dispatch<SetStateAction<string>>;
  timeEntryRate: string;
  setTimeEntryRate: Dispatch<SetStateAction<string>>;
  expenseDescription: string;
  setExpenseDescription: Dispatch<SetStateAction<string>>;
  expenseAmount: string;
  setExpenseAmount: Dispatch<SetStateAction<string>>;
  expenseIncurredAt: string;
  setExpenseIncurredAt: Dispatch<SetStateAction<string>>;
  invoiceLineDescription: string;
  setInvoiceLineDescription: Dispatch<SetStateAction<string>>;
  invoiceLineQuantity: string;
  setInvoiceLineQuantity: Dispatch<SetStateAction<string>>;
  invoiceLineUnitPrice: string;
  setInvoiceLineUnitPrice: Dispatch<SetStateAction<string>>;
  invoiceDueAt: string;
  setInvoiceDueAt: Dispatch<SetStateAction<string>>;
  trustAccountId: string;
  setTrustAccountId: Dispatch<SetStateAction<string>>;
  trustTransactionType: (typeof TRUST_TRANSACTION_TYPE_OPTIONS)[number];
  setTrustTransactionType: Dispatch<SetStateAction<(typeof TRUST_TRANSACTION_TYPE_OPTIONS)[number]>>;
  trustTransactionAmount: string;
  setTrustTransactionAmount: Dispatch<SetStateAction<string>>;
  trustTransactionDescription: string;
  setTrustTransactionDescription: Dispatch<SetStateAction<string>>;
  trustAccountOptions: TrustAccountOption[];
  invoicePaymentAmountById: Record<string, string>;
  setInvoicePaymentAmountById: Dispatch<SetStateAction<Record<string, string>>>;
  invoicePaymentReferenceById: Record<string, string>;
  setInvoicePaymentReferenceById: Dispatch<SetStateAction<Record<string, string>>>;
  invoicePaymentMethodById: Record<string, (typeof PAYMENT_METHOD_OPTIONS)[number]>;
  setInvoicePaymentMethodById: Dispatch<SetStateAction<Record<string, (typeof PAYMENT_METHOD_OPTIONS)[number]>>>;
  createMatterTimeEntry: () => Promise<void>;
  createMatterExpense: () => Promise<void>;
  createMatterInvoice: () => Promise<void>;
  createMatterTrustTransaction: () => Promise<void>;
  createInvoiceCheckoutLink: (invoiceId: string) => Promise<void>;
  recordInvoicePayment: (invoiceId: string) => Promise<void>;
};

export function BillingPanel({
  dashboard,
  billingStatusMessage,
  timeEntryDescription,
  setTimeEntryDescription,
  timeEntryStartAt,
  setTimeEntryStartAt,
  timeEntryEndAt,
  setTimeEntryEndAt,
  timeEntryRate,
  setTimeEntryRate,
  expenseDescription,
  setExpenseDescription,
  expenseAmount,
  setExpenseAmount,
  expenseIncurredAt,
  setExpenseIncurredAt,
  invoiceLineDescription,
  setInvoiceLineDescription,
  invoiceLineQuantity,
  setInvoiceLineQuantity,
  invoiceLineUnitPrice,
  setInvoiceLineUnitPrice,
  invoiceDueAt,
  setInvoiceDueAt,
  trustAccountId,
  setTrustAccountId,
  trustTransactionType,
  setTrustTransactionType,
  trustTransactionAmount,
  setTrustTransactionAmount,
  trustTransactionDescription,
  setTrustTransactionDescription,
  trustAccountOptions,
  invoicePaymentAmountById,
  setInvoicePaymentAmountById,
  invoicePaymentReferenceById,
  setInvoicePaymentReferenceById,
  invoicePaymentMethodById,
  setInvoicePaymentMethodById,
  createMatterTimeEntry,
  createMatterExpense,
  createMatterInvoice,
  createMatterTrustTransaction,
  createInvoiceCheckoutLink,
  recordInvoicePayment,
}: BillingPanelProps) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Billing</h3>
      <div className="notice" style={{ marginBottom: 10 }}>
        Attorney approval remains required before sending billing artifacts or trust disbursements.
      </div>
      {billingStatusMessage ? <p style={{ color: 'var(--lic-text-muted)' }}>{billingStatusMessage}</p> : null}

      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 12 }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <label htmlFor="billing-time-description">Time Description</label>
          <input
            id="billing-time-description"
            className="input"
            aria-label="Billing Time Description"
            placeholder="Prepare inspection memo"
            value={timeEntryDescription}
            onChange={(event) => setTimeEntryDescription(event.target.value)}
          />
          <label htmlFor="billing-time-start">Time Start</label>
          <input
            id="billing-time-start"
            className="input"
            aria-label="Billing Time Start"
            type="datetime-local"
            value={timeEntryStartAt}
            onChange={(event) => setTimeEntryStartAt(event.target.value)}
          />
          <label htmlFor="billing-time-end">Time End</label>
          <input
            id="billing-time-end"
            className="input"
            aria-label="Billing Time End"
            type="datetime-local"
            value={timeEntryEndAt}
            onChange={(event) => setTimeEntryEndAt(event.target.value)}
          />
          <label htmlFor="billing-time-rate">Rate (USD/hr)</label>
          <input
            id="billing-time-rate"
            className="input"
            aria-label="Billing Time Rate"
            type="number"
            min={0}
            step="0.01"
            value={timeEntryRate}
            onChange={(event) => setTimeEntryRate(event.target.value)}
          />
          <button className="button secondary" type="button" aria-label="Create Time Entry" onClick={createMatterTimeEntry}>
            Create Time Entry
          </button>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <label htmlFor="billing-expense-description">Expense Description</label>
          <input
            id="billing-expense-description"
            className="input"
            aria-label="Billing Expense Description"
            placeholder="Court filing fee"
            value={expenseDescription}
            onChange={(event) => setExpenseDescription(event.target.value)}
          />
          <label htmlFor="billing-expense-amount">Amount (USD)</label>
          <input
            id="billing-expense-amount"
            className="input"
            aria-label="Billing Expense Amount"
            type="number"
            min={0}
            step="0.01"
            value={expenseAmount}
            onChange={(event) => setExpenseAmount(event.target.value)}
          />
          <label htmlFor="billing-expense-incurred">Incurred At</label>
          <input
            id="billing-expense-incurred"
            className="input"
            aria-label="Billing Expense Incurred At"
            type="datetime-local"
            value={expenseIncurredAt}
            onChange={(event) => setExpenseIncurredAt(event.target.value)}
          />
          <button className="button secondary" type="button" aria-label="Create Expense" onClick={createMatterExpense}>
            Create Expense
          </button>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <label htmlFor="billing-invoice-description">Invoice Line Description</label>
          <input
            id="billing-invoice-description"
            className="input"
            aria-label="Billing Invoice Line Description"
            value={invoiceLineDescription}
            onChange={(event) => setInvoiceLineDescription(event.target.value)}
          />
          <label htmlFor="billing-invoice-quantity">Quantity</label>
          <input
            id="billing-invoice-quantity"
            className="input"
            aria-label="Billing Invoice Quantity"
            type="number"
            min={0}
            step="0.01"
            value={invoiceLineQuantity}
            onChange={(event) => setInvoiceLineQuantity(event.target.value)}
          />
          <label htmlFor="billing-invoice-unit-price">Unit Price (USD)</label>
          <input
            id="billing-invoice-unit-price"
            className="input"
            aria-label="Billing Invoice Unit Price"
            type="number"
            min={0}
            step="0.01"
            value={invoiceLineUnitPrice}
            onChange={(event) => setInvoiceLineUnitPrice(event.target.value)}
          />
          <label htmlFor="billing-invoice-due-at">Due At (optional)</label>
          <input
            id="billing-invoice-due-at"
            className="input"
            aria-label="Billing Invoice Due At"
            type="datetime-local"
            value={invoiceDueAt}
            onChange={(event) => setInvoiceDueAt(event.target.value)}
          />
          <button className="button secondary" type="button" aria-label="Create Invoice" onClick={createMatterInvoice}>
            Create Invoice
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 180px 140px 1fr auto', marginBottom: 12 }}>
        <select
          className="input"
          aria-label="Billing Trust Account"
          value={trustAccountId}
          onChange={(event) => setTrustAccountId(event.target.value)}
        >
          <option value="">Select Trust Account</option>
          {trustAccountOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          className="input"
          aria-label="Billing Trust Transaction Type"
          value={trustTransactionType}
          onChange={(event) => setTrustTransactionType(event.target.value as (typeof TRUST_TRANSACTION_TYPE_OPTIONS)[number])}
        >
          {TRUST_TRANSACTION_TYPE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <input
          className="input"
          aria-label="Billing Trust Transaction Amount"
          type="number"
          min={0}
          step="0.01"
          value={trustTransactionAmount}
          onChange={(event) => setTrustTransactionAmount(event.target.value)}
        />
        <input
          className="input"
          aria-label="Billing Trust Transaction Description"
          placeholder="Retainer deposit"
          value={trustTransactionDescription}
          onChange={(event) => setTrustTransactionDescription(event.target.value)}
        />
        <button className="button secondary" type="button" aria-label="Create Trust Transaction" onClick={createMatterTrustTransaction}>
          Post Trust
        </button>
      </div>

      <h4 style={{ marginTop: 0 }}>Invoices</h4>
      <table className="table" style={{ marginBottom: 12 }}>
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Status</th>
            <th>Total</th>
            <th>Balance</th>
            <th>Payments</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(dashboard.invoices || []).map((invoice: any) => (
            <tr key={invoice.id}>
              <td>{invoice.invoiceNumber}</td>
              <td>{invoice.status}</td>
              <td>${Number(invoice.total || 0).toFixed(2)}</td>
              <td>${Number(invoice.balanceDue || 0).toFixed(2)}</td>
              <td>{invoice.payments?.length || 0}</td>
              <td>
                <div style={{ display: 'grid', gap: 8 }}>
                  <button
                    className="button secondary"
                    type="button"
                    aria-label={`Create Checkout Link ${invoice.id}`}
                    onClick={() => createInvoiceCheckoutLink(invoice.id)}
                  >
                    Create Checkout Link
                  </button>
                  <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '120px 110px 1fr auto' }}>
                    <input
                      className="input"
                      aria-label={`Invoice Payment Amount ${invoice.id}`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={invoicePaymentAmountById[invoice.id] || ''}
                      onChange={(event) =>
                        setInvoicePaymentAmountById((current) => ({
                          ...current,
                          [invoice.id]: event.target.value,
                        }))
                      }
                    />
                    <select
                      className="input"
                      aria-label={`Invoice Payment Method ${invoice.id}`}
                      value={invoicePaymentMethodById[invoice.id] || 'MANUAL'}
                      onChange={(event) =>
                        setInvoicePaymentMethodById((current) => ({
                          ...current,
                          [invoice.id]: event.target.value as (typeof PAYMENT_METHOD_OPTIONS)[number],
                        }))
                      }
                    >
                      {PAYMENT_METHOD_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <input
                      className="input"
                      aria-label={`Invoice Payment Reference ${invoice.id}`}
                      placeholder="Reference"
                      value={invoicePaymentReferenceById[invoice.id] || ''}
                      onChange={(event) =>
                        setInvoicePaymentReferenceById((current) => ({
                          ...current,
                          [invoice.id]: event.target.value,
                        }))
                      }
                    />
                    <button
                      className="button secondary"
                      type="button"
                      aria-label={`Record Payment ${invoice.id}`}
                      onClick={() => recordInvoicePayment(invoice.id)}
                    >
                      Record Payment
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          ))}
          {(dashboard.invoices || []).length === 0 ? (
            <tr>
              <td colSpan={6}>No invoices for this matter yet.</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <h4 style={{ marginTop: 0 }}>Time Entries</h4>
          <table className="table">
            <thead>
              <tr>
                <th>Started</th>
                <th>Duration</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(dashboard.timeEntries || []).map((row: any) => (
                <tr key={row.id}>
                  <td>{new Date(row.startedAt).toLocaleString()}</td>
                  <td>{row.durationMinutes}m</td>
                  <td>${Number(row.amount || 0).toFixed(2)}</td>
                </tr>
              ))}
              {(dashboard.timeEntries || []).length === 0 ? (
                <tr>
                  <td colSpan={3}>No time entries for this matter yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div>
          <h4 style={{ marginTop: 0 }}>Expenses</h4>
          <table className="table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Incurred</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(dashboard.expenses || []).map((row: any) => (
                <tr key={row.id}>
                  <td>{row.description}</td>
                  <td>{new Date(row.incurredAt).toLocaleDateString()}</td>
                  <td>${Number(row.amount || 0).toFixed(2)}</td>
                </tr>
              ))}
              {(dashboard.expenses || []).length === 0 ? (
                <tr>
                  <td colSpan={3}>No expenses for this matter yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div>
          <h4 style={{ marginTop: 0 }}>Trust Ledger</h4>
          <table className="table">
            <thead>
              <tr>
                <th>Trust Account</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {(dashboard.trustLedgers || []).map((row: any) => (
                <tr key={row.id}>
                  <td>{row.trustAccount?.name || row.trustAccountId}</td>
                  <td>${Number(row.balance || 0).toFixed(2)}</td>
                </tr>
              ))}
              {(dashboard.trustLedgers || []).length === 0 ? (
                <tr>
                  <td colSpan={2}>No trust ledger rows for this matter yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div>
          <h4 style={{ marginTop: 0 }}>Trust Transactions</h4>
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Amount</th>
                <th>Occurred</th>
              </tr>
            </thead>
            <tbody>
              {(dashboard.trustTransactions || []).map((row: any) => (
                <tr key={row.id}>
                  <td>{row.type}</td>
                  <td>${Number(row.amount || 0).toFixed(2)}</td>
                  <td>{new Date(row.occurredAt).toLocaleString()}</td>
                </tr>
              ))}
              {(dashboard.trustTransactions || []).length === 0 ? (
                <tr>
                  <td colSpan={3}>No trust transactions for this matter yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
