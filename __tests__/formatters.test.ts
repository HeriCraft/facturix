/**
 * Unit tests for Facturix Domain Formatters
 * Verifies localized currency, safe date presentation, and document numbering.
 */

import {
  formatCurrency,
  formatDate,
  generateDocumentNumber,
  getDefaultDueDate,
  getTodayIsoDate,
} from '../src/domain/formatters';

describe('Formatters Domain Logic', () => {
  describe('formatCurrency', () => {
    it('formats currency numbers with two decimal places', () => {
      const formatted = formatCurrency(1250.5, 'EUR', 'en-US');
      // Should include symbol or code and proper decimals
      expect(formatted).toMatch(/1,250\.50/);
    });

    it('handles USD currency code', () => {
      const formatted = formatCurrency(99.99, 'USD', 'en-US');
      expect(formatted).toMatch(/\$99\.99/);
    });

    it('handles custom or unsupported currency gracefully', () => {
      const formatted = formatCurrency(500, 'MAD', 'en-US');
      expect(formatted).toContain('500.00');
    });

    it('handles zero, negative, and invalid values without throwing', () => {
      expect(formatCurrency(0, 'EUR')).toBeDefined();
      expect(formatCurrency(-50.25, 'EUR')).toBeDefined();
      expect(formatCurrency(NaN, 'EUR')).toBeDefined();
    });

    it('falls back to manual string formatting if Intl.NumberFormat throws', () => {
      const originalNumberFormat = Intl.NumberFormat;
      (Intl as any).NumberFormat = jest.fn().mockImplementation(() => {
        throw new Error('Intl not supported');
      });

      const formatted = formatCurrency(1234.56, 'USD');
      expect(formatted).toBe('$ 1,234.56');

      Intl.NumberFormat = originalNumberFormat;
    });
  });

  describe('formatDate', () => {
    it('formats valid ISO date strings in medium style by default', () => {
      const formatted = formatDate('2026-09-10T12:00:00.000Z', 'medium', 'en-US');
      expect(formatted).toMatch(/Sep 10, 2026/);
    });

    it('formats short style dates', () => {
      const formatted = formatDate('2026-09-10T12:00:00.000Z', 'short', 'en-US');
      expect(formatted).toMatch(/09\/10\/2026/);
    });

    it('returns fallback dash for invalid date strings', () => {
      expect(formatDate('not-a-date')).toBe('—');
      expect(formatDate('')).toBe('—');
      expect(formatDate(null)).toBe('—');
      expect(formatDate(undefined)).toBe('—');
    });

    it('falls back to YYYY-MM-DD if Intl.DateTimeFormat throws', () => {
      const originalDateTimeFormat = Intl.DateTimeFormat;
      (Intl as any).DateTimeFormat = jest.fn().mockImplementation(() => {
        throw new Error('Intl not supported');
      });

      const formatted = formatDate('2026-09-10T00:00:00.000Z');
      expect(formatted).toBe('2026-09-10');

      Intl.DateTimeFormat = originalDateTimeFormat;
    });
  });

  describe('generateDocumentNumber', () => {
    it('generates sequential invoice identifier with 4-digit padding', () => {
      expect(generateDocumentNumber('INVOICE', 1, 2026)).toBe('INV-2026-0001');
      expect(generateDocumentNumber('INVOICE', 42, 2026)).toBe('INV-2026-0042');
      expect(generateDocumentNumber('INVOICE', 1234, 2026)).toBe('INV-2026-1234');
    });

    it('generates sequential quotation identifier', () => {
      expect(generateDocumentNumber('QUOTE', 7, 2026)).toBe('QUO-2026-0007');
    });

    it('defaults to current year when year argument is omitted', () => {
      const currentYear = new Date().getFullYear();
      expect(generateDocumentNumber('INVOICE', 5)).toBe(`INV-${currentYear}-0005`);
    });
  });

  describe('Date Helpers', () => {
    it('returns valid ISO date format for today', () => {
      const today = getTodayIsoDate();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('calculates due date in the future with proper format', () => {
      const dueDate = getDefaultDueDate(30);
      expect(dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      // Due date timestamp should be greater than or equal to today
      expect(new Date(dueDate).getTime()).toBeGreaterThanOrEqual(new Date(getTodayIsoDate()).getTime());
    });
  });
});
