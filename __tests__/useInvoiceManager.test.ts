/**
 * Unit tests for Facturix useInvoiceManager Hook
 * Tests state mutations: add, update, status toggles, deletion, filtering, and financial metrics.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useInvoiceManager } from '../src/hooks/useInvoiceManager';
import { IStorageService } from '../src/services/storageService';
import { CreateInvoiceDTO, Invoice } from '../src/domain/types';

describe('useInvoiceManager Hook', () => {
  let mockStorage: IStorageService;
  let storedInvoices: Invoice[];

  const initialInvoices: Invoice[] = [
    {
      id: 'inv_1',
      documentNumber: 'INV-2026-0001',
      type: 'INVOICE',
      status: 'PAID',
      issueDate: '2026-09-01',
      dueDate: '2026-10-01',
      client: { name: 'Alpha Corp' },
      items: [{ id: '1', description: 'Consulting', quantity: 2, unitPrice: 500 }],
      subtotal: 1000,
      taxRate: 0.2,
      taxAmount: 200,
      grandTotal: 1200,
      createdAt: '2026-09-01T09:00:00.000Z',
      updatedAt: '2026-09-01T09:00:00.000Z',
    },
    {
      id: 'inv_2',
      documentNumber: 'INV-2026-0002',
      type: 'INVOICE',
      status: 'PENDING',
      issueDate: '2026-09-05',
      dueDate: '2026-10-05',
      client: { name: 'Beta Ltd' },
      items: [{ id: '2', description: 'Design Sprint', quantity: 1, unitPrice: 800 }],
      subtotal: 800,
      taxRate: 0.2,
      taxAmount: 160,
      grandTotal: 960,
      createdAt: '2026-09-05T09:00:00.000Z',
      updatedAt: '2026-09-05T09:00:00.000Z',
    },
    {
      id: 'quo_1',
      documentNumber: 'QUO-2026-0001',
      type: 'QUOTE',
      status: 'PENDING',
      issueDate: '2026-09-08',
      dueDate: '2026-10-08',
      client: { name: 'Gamma LLC' },
      items: [{ id: '3', description: 'Audit', quantity: 1, unitPrice: 2000 }],
      subtotal: 2000,
      taxRate: 0,
      taxAmount: 0,
      grandTotal: 2000,
      createdAt: '2026-09-08T09:00:00.000Z',
      updatedAt: '2026-09-08T09:00:00.000Z',
    },
  ];

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    jest.clearAllMocks();
    storedInvoices = [...initialInvoices];
    mockStorage = {
      getInvoices: jest.fn().mockImplementation(async () => [...storedInvoices]),
      saveInvoices: jest.fn().mockImplementation(async (invs) => {
        storedInvoices = [...invs];
      }),
      getCompanyProfile: jest.fn().mockResolvedValue(null),
      saveCompanyProfile: jest.fn().mockResolvedValue(undefined),
      clearAll: jest.fn().mockResolvedValue(undefined),
    };
  });

  const waitForHookLoaded = async (result: { current: any }) => {
    await waitFor(() => {
      expect(result.current).toBeDefined();
      expect(result.current?.isLoading).toBe(false);
    });
  };

  it('loads invoices and computes initial financial metrics', async () => {
    const { result } = await renderHook(() => useInvoiceManager(mockStorage));
    await waitForHookLoaded(result);

    expect(result.current.invoices).toHaveLength(3);
    // Invoices count = 2 (inv_1, inv_2), Quotes count = 1 (quo_1)
    // Total billed = 1200 + 960 = 2160
    // Total paid = 1200
    // Total pending = 960
    expect(result.current.metrics.invoiceCount).toBe(2);
    expect(result.current.metrics.quoteCount).toBe(1);
    expect(result.current.metrics.totalBilled).toBe(2160);
    expect(result.current.metrics.totalPaid).toBe(1200);
    expect(result.current.metrics.totalPending).toBe(960);
  });

  it('creates and persists a new invoice', async () => {
    const { result } = await renderHook(() => useInvoiceManager(mockStorage));
    await waitForHookLoaded(result);

    const draft: CreateInvoiceDTO = {
      type: 'INVOICE',
      issueDate: '2026-09-10',
      dueDate: '2026-10-10',
      client: { name: 'Delta Co' },
      items: [{ id: '1', description: 'Backend API', quantity: 2, unitPrice: 300 }],
      taxRate: 0.2,
    };

    let created: Invoice | undefined;
    await act(async () => {
      created = await result.current.createInvoice(draft);
    });

    expect(created).toBeDefined();
    expect(created?.subtotal).toBe(600);
    expect(created?.taxAmount).toBe(120);
    expect(created?.grandTotal).toBe(720);
    expect(created?.documentNumber).toMatch(/^INV-/);

    expect(result.current.invoices).toHaveLength(4);
    expect(mockStorage.saveInvoices).toHaveBeenCalled();

    // Check updated metrics: total billed was 2160 + 720 = 2880
    expect(result.current.metrics.totalBilled).toBe(2880);
    expect(result.current.metrics.totalPending).toBe(960 + 720);
  });

  it('toggles invoice status between PAID and PENDING', async () => {
    const { result } = await renderHook(() => useInvoiceManager(mockStorage));
    await waitForHookLoaded(result);

    // Initially inv_2 is PENDING ($960)
    expect(result.current.invoices.find((i: Invoice) => i.id === 'inv_2')?.status).toBe('PENDING');

    await act(async () => {
      await result.current.toggleInvoiceStatus('inv_2');
    });

    expect(result.current.invoices.find((i: Invoice) => i.id === 'inv_2')?.status).toBe('PAID');
    // Total paid should now include inv_2: 1200 + 960 = 2160
    expect(result.current.metrics.totalPaid).toBe(2160);
    expect(result.current.metrics.totalPending).toBe(0);

    // Toggle back
    await act(async () => {
      await result.current.toggleInvoiceStatus('inv_2');
    });

    expect(result.current.invoices.find((i: Invoice) => i.id === 'inv_2')?.status).toBe('PENDING');
  });

  it('deletes an invoice by id', async () => {
    const { result } = await renderHook(() => useInvoiceManager(mockStorage));
    await waitForHookLoaded(result);

    await act(async () => {
      await result.current.deleteInvoice('inv_1');
    });

    expect(result.current.invoices).toHaveLength(2);
    expect(result.current.invoices.find((i: Invoice) => i.id === 'inv_1')).toBeUndefined();
    expect(mockStorage.saveInvoices).toHaveBeenCalled();
  });

  it('filters invoices by status (ALL, PAID, PENDING, QUOTE)', async () => {
    const { result } = await renderHook(() => useInvoiceManager(mockStorage));
    await waitForHookLoaded(result);

    // Default ALL
    expect(result.current.filteredInvoices).toHaveLength(3);

    // Filter PAID
    await act(async () => {
      result.current.setFilter('PAID');
    });
    await waitFor(() => {
      expect(result.current.filteredInvoices).toHaveLength(1);
      expect(result.current.filteredInvoices[0].id).toBe('inv_1');
    });

    // Filter PENDING
    await act(async () => {
      result.current.setFilter('PENDING');
    });
    await waitFor(() => {
      expect(result.current.filteredInvoices).toHaveLength(1);
      expect(result.current.filteredInvoices[0].id).toBe('inv_2');
    });

    // Filter QUOTE
    await act(async () => {
      result.current.setFilter('QUOTE');
    });
    await waitFor(() => {
      expect(result.current.filteredInvoices).toHaveLength(1);
      expect(result.current.filteredInvoices[0].id).toBe('quo_1');
    });
  });

  it('updates an existing invoice and recalculates totals', async () => {
    const { result } = await renderHook(() => useInvoiceManager(mockStorage));
    await waitForHookLoaded(result);

    await act(async () => {
      await result.current.updateInvoice({
        id: 'inv_1',
        items: [{ id: '1', description: 'Consulting Extended', quantity: 3, unitPrice: 500 }],
      });
    });

    const updated = result.current.invoices.find((i: Invoice) => i.id === 'inv_1');
    expect(updated?.subtotal).toBe(1500);
    expect(updated?.taxAmount).toBe(300); // 20% of 1500
    expect(updated?.grandTotal).toBe(1800);
  });
});
