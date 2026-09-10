/**
 * Unit tests for Facturix PDF Service
 * Verifies high-fidelity A4 HTML generation, tabular layout, and XSS sanitization.
 */

import { escapeHtml, generateInvoiceHtml } from '../src/services/pdfService';
import { CompanyProfile, Invoice } from '../src/domain/types';

describe('PDF Service Template Generator', () => {
  const sampleCompany: CompanyProfile = {
    name: 'DevCraft Studio',
    phone: '+33 1 23 45 67 89',
    email: 'billing@devcraft.io',
    address: '15 Rue de la Paix, 75002 Paris',
    currency: 'EUR',
    taxNumber: 'FR 99 888777666',
    defaultPaymentTerms: 'Net 30 days',
  };

  const sampleInvoice: Invoice = {
    id: 'inv_101',
    documentNumber: 'INV-2026-0089',
    type: 'INVOICE',
    status: 'PAID',
    issueDate: '2026-09-10',
    dueDate: '2026-10-10',
    client: {
      name: 'Global Corp',
      email: 'ap@globalcorp.com',
      phone: '+1 555-4321',
      address: '500 5th Avenue, New York, NY',
    },
    items: [
      { id: '1', description: 'Architecture Review', quantity: 2, unitPrice: 500 },
      { id: '2', description: 'React Native Implementation', quantity: 1, unitPrice: 1200 },
    ],
    subtotal: 2200,
    taxRate: 0.2,
    taxAmount: 440,
    discountRate: 0.05,
    discountAmount: 110,
    grandTotal: 2530,
    notes: 'Direct wire transfer accepted.',
    paymentTerms: 'Payment due within 30 days.',
    createdAt: '2026-09-10T10:00:00.000Z',
    updatedAt: '2026-09-10T10:00:00.000Z',
  };

  describe('escapeHtml', () => {
    it('sanitizes dangerous HTML and XSS payload characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
      expect(escapeHtml("John's & Jane's")).toBe('John&#039;s &amp; Jane&#039;s');
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });
  });

  describe('generateInvoiceHtml', () => {
    it('produces valid A4 HTML document structure', () => {
      const html = generateInvoiceHtml(sampleInvoice, sampleCompany);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('size: A4;');
      expect(html).toContain('INV-2026-0089');
      expect(html).toContain('INVOICE');
    });

    it('renders company metadata and client summary card', () => {
      const html = generateInvoiceHtml(sampleInvoice, sampleCompany);

      expect(html).toContain('DevCraft Studio');
      expect(html).toContain('billing@devcraft.io');
      expect(html).toContain('FR 99 888777666');
      expect(html).toContain('Global Corp');
      expect(html).toContain('ap@globalcorp.com');
      expect(html).toContain('500 5th Avenue, New York, NY');
    });

    it('renders item rows with zebra striping class for alternating rows', () => {
      const html = generateInvoiceHtml(sampleInvoice, sampleCompany);

      expect(html).toContain('Architecture Review');
      expect(html).toContain('React Native Implementation');
      expect(html).toContain('even-row');
    });

    it('renders subtotal, discount, tax, and grand total', () => {
      const html = generateInvoiceHtml(sampleInvoice, sampleCompany);

      expect(html).toContain('Subtotal');
      expect(html).toContain('Discount');
      expect(html).toContain('Tax / VAT');
      expect(html).toContain('Grand Total');
    });

    it('adapts header title for quotations', () => {
      const quote: Invoice = {
        ...sampleInvoice,
        type: 'QUOTE',
        documentNumber: 'QUO-2026-0012',
      };
      const html = generateInvoiceHtml(quote, sampleCompany);

      expect(html).toContain('QUOTATION');
      expect(html).toContain('QUO-2026-0012');
    });

    it('includes offline privacy guarantee footer', () => {
      const html = generateInvoiceHtml(sampleInvoice, sampleCompany);

      expect(html).toContain('Facturix');
      expect(html).toContain('100% Offline &amp; Privacy-First');
      expect(html).toContain('Zero data leaves your device');
    });

    it('escapes user input in rendered invoice to prevent HTML injection', () => {
      const injectionInvoice: Invoice = {
        ...sampleInvoice,
        client: {
          name: '<img src=x onerror=alert(1)>',
        },
        items: [
          {
            id: '1',
            description: '<b style="color:red">Sneaky</b>',
            quantity: 1,
            unitPrice: 10,
          },
        ],
      };
      const html = generateInvoiceHtml(injectionInvoice, sampleCompany);

      expect(html).not.toContain('<img src=x onerror=alert(1)>');
      expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
      expect(html).not.toContain('<b style="color:red">Sneaky</b>');
      expect(html).toContain('&lt;b style=&quot;color:red&quot;&gt;Sneaky&lt;/b&gt;');
    });
  });
});
