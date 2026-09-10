/**
 * Unit tests for Facturix Share Service
 * Mocked expo-print and expo-sharing orchestration tests.
 */

import { ShareService } from '../src/services/shareService';
import { Invoice } from '../src/domain/types';

describe('ShareService Adapter', () => {
  let mockPrintEngine: {
    printToFileAsync: jest.Mock;
  };
  let mockSharingEngine: {
    isAvailableAsync: jest.Mock;
    shareAsync: jest.Mock;
  };
  let service: ShareService;

  const sampleInvoice: Invoice = {
    id: 'inv_1',
    documentNumber: 'INV-2026-0001',
    type: 'INVOICE',
    status: 'PAID',
    issueDate: '2026-09-10',
    dueDate: '2026-10-10',
    client: { name: 'Acme Corp' },
    items: [{ id: '1', description: 'Web dev', quantity: 1, unitPrice: 500 }],
    subtotal: 500,
    taxRate: 0.2,
    taxAmount: 100,
    grandTotal: 600,
    createdAt: '2026-09-10T10:00:00.000Z',
    updatedAt: '2026-09-10T10:00:00.000Z',
  };

  beforeEach(() => {
    mockPrintEngine = {
      printToFileAsync: jest.fn().mockResolvedValue({
        uri: 'file:///data/user/0/cache/facturix_INV-2026-0001.pdf',
        numberOfPages: 1,
      }),
    };
    mockSharingEngine = {
      isAvailableAsync: jest.fn().mockResolvedValue(true),
      shareAsync: jest.fn().mockResolvedValue(undefined),
    };

    service = new ShareService(mockPrintEngine as any, mockSharingEngine as any);
  });

  describe('generatePdfFile', () => {
    it('calls printToFileAsync with rendered HTML and returns file URI', async () => {
      const uri = await service.generatePdfFile(sampleInvoice);

      expect(mockPrintEngine.printToFileAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('INV-2026-0001'),
          base64: false,
        })
      );
      expect(uri).toBe('file:///data/user/0/cache/facturix_INV-2026-0001.pdf');
    });

    it('throws descriptive error if print compiler fails', async () => {
      mockPrintEngine.printToFileAsync.mockRejectedValueOnce(
        new Error('Out of memory in WebView')
      );

      await expect(service.generatePdfFile(sampleInvoice)).rejects.toThrow(
        /PDF generation failed/
      );
    });
  });

  describe('sharePdf', () => {
    it('generates PDF and presents sharing sheet when available', async () => {
      const result = await service.sharePdf(sampleInvoice);

      expect(mockSharingEngine.isAvailableAsync).toHaveBeenCalled();
      expect(mockSharingEngine.shareAsync).toHaveBeenCalledWith(
        'file:///data/user/0/cache/facturix_INV-2026-0001.pdf',
        expect.objectContaining({
          mimeType: 'application/pdf',
          dialogTitle: 'Share INV-2026-0001',
        })
      );
      expect(result).toEqual({
        uri: 'file:///data/user/0/cache/facturix_INV-2026-0001.pdf',
        shared: true,
      });
    });

    it('handles environments where native sharing is unavailable (e.g. desktop web)', async () => {
      mockSharingEngine.isAvailableAsync.mockResolvedValueOnce(false);

      const result = await service.sharePdf(sampleInvoice);

      expect(mockSharingEngine.shareAsync).not.toHaveBeenCalled();
      expect(result).toEqual({
        uri: 'file:///data/user/0/cache/facturix_INV-2026-0001.pdf',
        shared: false,
      });
    });

    it('throws descriptive error if sharing sheet rejects', async () => {
      mockSharingEngine.shareAsync.mockRejectedValueOnce(new Error('Permission denied'));

      await expect(service.sharePdf(sampleInvoice)).rejects.toThrow(
        /Share dialog failed/
      );
    });
  });
});
