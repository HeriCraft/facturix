/**
 * Facturix Invoice Manager Hook
 * Application layer hook orchestrating invoice state, CRUD workflows,
 * status toggles, filtering, and real-time metric computations.
 * UI components consume this hook and contain ZERO financial calculations.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CreateInvoiceDTO,
  FinancialMetrics,
  Invoice,
  InvoiceFilter,
  UpdateInvoiceDTO,
} from '../domain/types';
import { computeInvoiceTotals, roundToCurrency } from '../domain/calculator';
import { generateDocumentNumber } from '../domain/formatters';
import { IStorageService, storageService } from '../services/storageService';

export interface UseInvoiceManagerResult {
  invoices: Invoice[];
  filteredInvoices: Invoice[];
  filter: InvoiceFilter;
  metrics: FinancialMetrics;
  isLoading: boolean;
  error: string | null;
  setFilter: (filter: InvoiceFilter) => void;
  createInvoice: (dto: CreateInvoiceDTO) => Promise<Invoice>;
  updateInvoice: (dto: UpdateInvoiceDTO) => Promise<Invoice>;
  toggleInvoiceStatus: (id: string) => Promise<Invoice>;
  deleteInvoice: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useInvoiceManager(
  storage: IStorageService = storageService
): UseInvoiceManagerResult {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<InvoiceFilter>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Loads persisted invoices from storage.
   */
  const loadInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loaded = await storage.getInvoices();
      // Sort newest first by creation date or issue date
      const sorted = [...loaded].sort(
        (a, b) => new Date(b.createdAt || b.issueDate).getTime() - new Date(a.createdAt || a.issueDate).getTime()
      );
      setInvoices(sorted);
    } catch (err) {
      const msg = (err as Error).message || 'Failed to load invoices';
      setError(msg);
      console.error('[useInvoiceManager] Error loading invoices:', err);
    } finally {
      setIsLoading(false);
    }
  }, [storage]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  /**
   * Real-time computed financial metrics across all documents.
   */
  const metrics: FinancialMetrics = useMemo(() => {
    let totalBilled = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let invoiceCount = 0;
    let quoteCount = 0;

    for (const inv of invoices) {
      if (inv.type === 'INVOICE') {
        invoiceCount += 1;
        totalBilled += inv.grandTotal;
        if (inv.status === 'PAID') {
          totalPaid += inv.grandTotal;
        } else {
          totalPending += inv.grandTotal;
        }
      } else if (inv.type === 'QUOTE') {
        quoteCount += 1;
      }
    }

    return {
      totalBilled: roundToCurrency(totalBilled),
      totalPaid: roundToCurrency(totalPaid),
      totalPending: roundToCurrency(totalPending),
      invoiceCount,
      quoteCount,
    };
  }, [invoices]);

  /**
   * Filtered invoices according to the active filter chip.
   */
  const filteredInvoices = useMemo(() => {
    if (filter === 'ALL') {
      return invoices;
    }
    if (filter === 'PAID') {
      return invoices.filter((inv) => inv.type === 'INVOICE' && inv.status === 'PAID');
    }
    if (filter === 'PENDING') {
      return invoices.filter((inv) => inv.type === 'INVOICE' && inv.status === 'PENDING');
    }
    if (filter === 'QUOTE') {
      return invoices.filter((inv) => inv.type === 'QUOTE');
    }
    return invoices;
  }, [invoices, filter]);

  /**
   * Creates and persists a new invoice or quote.
   */
  const createInvoice = useCallback(
    async (dto: CreateInvoiceDTO): Promise<Invoice> => {
      try {
        setError(null);
        const nowIso = new Date().toISOString();
        const existingOfType = invoices.filter((i) => i.type === dto.type);
        const sequence = existingOfType.length + 1;
        const documentNumber = dto.documentNumber || generateDocumentNumber(dto.type, sequence);

        const totals = computeInvoiceTotals(dto.items, dto.taxRate || 0, dto.discountRate || 0);

        const newInvoice: Invoice = {
          id: `doc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
          documentNumber,
          type: dto.type,
          status: dto.status || 'PENDING',
          issueDate: dto.issueDate,
          dueDate: dto.dueDate,
          client: dto.client,
          items: dto.items,
          subtotal: totals.subtotal,
          taxRate: dto.taxRate || 0,
          taxAmount: totals.taxAmount,
          discountRate: dto.discountRate || 0,
          discountAmount: totals.discountAmount,
          grandTotal: totals.grandTotal,
          notes: dto.notes,
          paymentTerms: dto.paymentTerms,
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        const updatedList = [newInvoice, ...invoices];
        setInvoices(updatedList);
        await storage.saveInvoices(updatedList);
        return newInvoice;
      } catch (err) {
        const msg = (err as Error).message || 'Failed to create invoice';
        setError(msg);
        throw err;
      }
    },
    [invoices, storage]
  );

  /**
   * Updates an existing invoice, recalculating financial figures if items/rates changed.
   */
  const updateInvoice = useCallback(
    async (dto: UpdateInvoiceDTO): Promise<Invoice> => {
      try {
        setError(null);
        const index = invoices.findIndex((i) => i.id === dto.id);
        if (index === -1) {
          throw new Error(`Invoice with id ${dto.id} not found.`);
        }

        const existing = invoices[index];
        const items = dto.items ?? existing.items;
        const taxRate = dto.taxRate ?? existing.taxRate;
        const discountRate = dto.discountRate ?? existing.discountRate;

        const totals = computeInvoiceTotals(items, taxRate, discountRate);

        const updated: Invoice = {
          ...existing,
          ...dto,
          client: dto.client ? { ...existing.client, ...dto.client } : existing.client,
          items,
          subtotal: totals.subtotal,
          taxRate,
          taxAmount: totals.taxAmount,
          discountRate,
          discountAmount: totals.discountAmount,
          grandTotal: totals.grandTotal,
          updatedAt: new Date().toISOString(),
        };

        const updatedList = [...invoices];
        updatedList[index] = updated;
        setInvoices(updatedList);
        await storage.saveInvoices(updatedList);
        return updated;
      } catch (err) {
        const msg = (err as Error).message || 'Failed to update invoice';
        setError(msg);
        throw err;
      }
    },
    [invoices, storage]
  );

  /**
   * Toggles an invoice status between PAID and PENDING.
   */
  const toggleInvoiceStatus = useCallback(
    async (id: string): Promise<Invoice> => {
      const target = invoices.find((i) => i.id === id);
      if (!target) {
        throw new Error(`Invoice with id ${id} not found.`);
      }

      const nextStatus = target.status === 'PAID' ? 'PENDING' : 'PAID';
      return updateInvoice({ id, status: nextStatus });
    },
    [invoices, updateInvoice]
  );

  /**
   * Deletes an invoice by ID.
   */
  const deleteInvoice = useCallback(
    async (id: string): Promise<void> => {
      try {
        setError(null);
        const updatedList = invoices.filter((i) => i.id !== id);
        setInvoices(updatedList);
        await storage.saveInvoices(updatedList);
      } catch (err) {
        const msg = (err as Error).message || 'Failed to delete invoice';
        setError(msg);
        throw err;
      }
    },
    [invoices, storage]
  );

  return {
    invoices,
    filteredInvoices,
    filter,
    metrics,
    isLoading,
    error,
    setFilter,
    createInvoice,
    updateInvoice,
    toggleInvoiceStatus,
    deleteInvoice,
    refresh: loadInvoices,
  };
}
