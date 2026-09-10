/**
 * Facturix Pure Domain Types
 * 100% offline, immutable domain definitions with zero external dependencies.
 */

export type InvoiceStatus = 'PAID' | 'PENDING';

export type DocumentType = 'INVOICE' | 'QUOTE';

export type InvoiceFilter = 'ALL' | 'PAID' | 'PENDING' | 'QUOTE';

export interface InvoiceItem {
  readonly id: string;
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

export interface ClientDetails {
  readonly name: string;
  readonly email?: string;
  readonly phone?: string;
  readonly address?: string;
}

export interface CompanyProfile {
  readonly name: string;
  readonly phone: string;
  readonly email?: string;
  readonly address?: string;
  readonly currency: string; // e.g. 'EUR', 'USD', 'MAD', 'GBP', 'CAD', 'CHF'
  readonly defaultPaymentTerms?: string;
  readonly taxNumber?: string; // VAT ID / SIRET / Tax Registration
}

export interface Invoice {
  readonly id: string;
  readonly documentNumber: string;
  readonly type: DocumentType;
  readonly status: InvoiceStatus;
  readonly issueDate: string; // ISO format: YYYY-MM-DD
  readonly dueDate: string; // ISO format: YYYY-MM-DD
  readonly client: ClientDetails;
  readonly items: readonly InvoiceItem[];
  readonly subtotal: number;
  readonly taxRate: number; // e.g., 0.20 for 20%
  readonly taxAmount: number;
  readonly discountRate?: number; // e.g., 0.05 for 5%
  readonly discountAmount?: number;
  readonly grandTotal: number;
  readonly notes?: string;
  readonly paymentTerms?: string;
  readonly createdAt: string; // ISO 8601 string
  readonly updatedAt: string; // ISO 8601 string
}

export interface CreateInvoiceDTO {
  readonly type: DocumentType;
  readonly status?: InvoiceStatus;
  readonly documentNumber?: string;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly client: ClientDetails;
  readonly items: readonly InvoiceItem[];
  readonly taxRate?: number;
  readonly discountRate?: number;
  readonly notes?: string;
  readonly paymentTerms?: string;
}

export interface UpdateInvoiceDTO extends Partial<CreateInvoiceDTO> {
  readonly id: string;
  readonly status?: InvoiceStatus;
}

export interface FinancialMetrics {
  readonly totalBilled: number;
  readonly totalPaid: number;
  readonly totalPending: number;
  readonly invoiceCount: number;
  readonly quoteCount: number;
}

export interface ComputedTotals {
  readonly subtotal: number;
  readonly taxAmount: number;
  readonly discountAmount: number;
  readonly grandTotal: number;
}
