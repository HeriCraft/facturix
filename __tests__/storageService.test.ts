/**
 * Unit tests for Facturix Storage Service Adapter
 * Mocked storage lifecycle tests verifying serialization, key resolution, and corrupted JSON handling.
 */

import { STORAGE_KEYS, StorageService } from '../src/services/storageService';
import { CompanyProfile, Invoice } from '../src/domain/types';

describe('StorageService Adapter', () => {
  let mockStorage: {
    getItem: jest.Mock;
    setItem: jest.Mock;
    multiRemove: jest.Mock;
  };
  let service: StorageService;

  const sampleInvoice: Invoice = {
    id: 'inv_1',
    documentNumber: 'INV-2026-0001',
    type: 'INVOICE',
    status: 'PAID',
    issueDate: '2026-09-10',
    dueDate: '2026-10-10',
    client: { name: 'Acme Corp' },
    items: [{ id: 'item_1', description: 'Consulting', quantity: 2, unitPrice: 100 }],
    subtotal: 200,
    taxRate: 0.2,
    taxAmount: 40,
    grandTotal: 240,
    createdAt: '2026-09-10T10:00:00.000Z',
    updatedAt: '2026-09-10T10:00:00.000Z',
  };

  const sampleProfile: CompanyProfile = {
    name: 'Tech Ventures Ltd',
    phone: '+1 555-0199',
    email: 'finance@techventures.io',
    address: '42 Silicon Way',
    currency: 'USD',
    defaultPaymentTerms: 'Net 30',
  };

  beforeEach(() => {
    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      multiRemove: jest.fn(),
    };
    // Injected storage engine
    service = new StorageService(mockStorage as any);
  });

  describe('Invoices Persistence', () => {
    it('returns empty array when storage is empty', async () => {
      mockStorage.getItem.mockResolvedValueOnce(null);

      const result = await service.getInvoices();
      expect(result).toEqual([]);
      expect(mockStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.INVOICES);
    });

    it('parses and returns valid stored invoices', async () => {
      mockStorage.getItem.mockResolvedValueOnce(JSON.stringify([sampleInvoice]));

      const result = await service.getInvoices();
      expect(result).toHaveLength(1);
      expect(result[0].documentNumber).toBe('INV-2026-0001');
    });

    it('gracefully recovers from corrupted JSON without throwing', async () => {
      mockStorage.getItem.mockResolvedValueOnce('{ corrupt: json ... [');

      const result = await service.getInvoices();
      expect(result).toEqual([]);
    });

    it('filters out malformed items from corrupted arrays', async () => {
      const dirtyArray = [
        sampleInvoice,
        { broken: true }, // missing id, documentNumber, items, grandTotal
        null,
      ];
      mockStorage.getItem.mockResolvedValueOnce(JSON.stringify(dirtyArray));

      const result = await service.getInvoices();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('inv_1');
    });

    it('serializes and persists invoices', async () => {
      await service.saveInvoices([sampleInvoice]);

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.INVOICES,
        JSON.stringify([sampleInvoice])
      );
    });

    it('throws descriptive error if storage write fails', async () => {
      mockStorage.setItem.mockRejectedValueOnce(new Error('Disk full'));

      await expect(service.saveInvoices([sampleInvoice])).rejects.toThrow(
        /Failed to persist invoices/
      );
    });
  });

  describe('Company Profile Persistence', () => {
    it('returns null if profile is not stored', async () => {
      mockStorage.getItem.mockResolvedValueOnce(null);

      const result = await service.getCompanyProfile();
      expect(result).toBeNull();
      expect(mockStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.PROFILE);
    });

    it('retrieves and validates stored company profile', async () => {
      mockStorage.getItem.mockResolvedValueOnce(JSON.stringify(sampleProfile));

      const result = await service.getCompanyProfile();
      expect(result).toEqual(sampleProfile);
    });

    it('returns null on corrupted profile JSON', async () => {
      mockStorage.getItem.mockResolvedValueOnce('invalid json @@');

      const result = await service.getCompanyProfile();
      expect(result).toBeNull();
    });

    it('serializes and saves company profile', async () => {
      await service.saveCompanyProfile(sampleProfile);

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.PROFILE,
        JSON.stringify(sampleProfile)
      );
    });

    it('rejects invalid profile missing required name or currency', async () => {
      await expect(
        service.saveCompanyProfile({ phone: '123' } as unknown as CompanyProfile)
      ).rejects.toThrow(/name and currency are required/);
    });
  });

  describe('clearAll', () => {
    it('removes invoices and profile storage keys', async () => {
      await service.clearAll();

      expect(mockStorage.multiRemove).toHaveBeenCalledWith([
        STORAGE_KEYS.INVOICES,
        STORAGE_KEYS.PROFILE,
      ]);
    });
  });
});
