/**
 * Unit tests for Facturix Financial Calculator
 * 100% domain coverage: itemized totals, decimal arithmetic precision, edge cases, bounds.
 */

import {
  calculateDiscountAmount,
  calculateGrandTotal,
  calculateLineTotal,
  calculateSubtotal,
  calculateTaxAmount,
  computeInvoiceTotals,
  normalizeRate,
  roundToCurrency,
} from '../src/domain/calculator';
import { InvoiceItem } from '../src/domain/types';

describe('Calculator Domain Logic', () => {
  describe('roundToCurrency', () => {
    it('rounds standard decimal numbers to 2 decimal places', () => {
      expect(roundToCurrency(10.556)).toBe(10.56);
      expect(roundToCurrency(10.554)).toBe(10.55);
      expect(roundToCurrency(10.5)).toBe(10.5);
      expect(roundToCurrency(10)).toBe(10);
    });

    it('mitigates IEEE-754 binary floating point precision artifacts', () => {
      // In vanilla JS, 0.1 + 0.2 is 0.30000000000000004
      expect(0.1 + 0.2).not.toBe(0.3);
      expect(roundToCurrency(0.1 + 0.2)).toBe(0.3);

      // In vanilla JS, 19.99 * 3 = 59.970000000000006
      expect(roundToCurrency(19.99 * 3)).toBe(59.97);
    });

    it('returns 0 for NaN, Infinity, and non-finite inputs', () => {
      expect(roundToCurrency(NaN)).toBe(0);
      expect(roundToCurrency(Infinity)).toBe(0);
      expect(roundToCurrency(-Infinity)).toBe(0);
    });
  });

  describe('normalizeRate', () => {
    it('handles rates entered as percentages (e.g., 20 -> 0.20)', () => {
      expect(normalizeRate(20)).toBe(0.2);
      expect(normalizeRate(5.5)).toBe(0.055);
      expect(normalizeRate(100)).toBe(1);
    });

    it('handles rates entered as decimals (e.g., 0.20 -> 0.20)', () => {
      expect(normalizeRate(0.2)).toBe(0.2);
      expect(normalizeRate(0.05)).toBe(0.05);
      expect(normalizeRate(1)).toBe(1);
    });

    it('returns 0 for negative, zero, undefined, or invalid rates', () => {
      expect(normalizeRate(0)).toBe(0);
      expect(normalizeRate(-5)).toBe(0);
      expect(normalizeRate(undefined)).toBe(0);
      expect(normalizeRate(NaN)).toBe(0);
    });
  });

  describe('calculateLineTotal', () => {
    it('multiplies quantity by unit price and rounds accurately', () => {
      const item: InvoiceItem = {
        id: '1',
        description: 'Design consultation',
        quantity: 3,
        unitPrice: 150.5,
      };
      expect(calculateLineTotal(item)).toBe(451.5);
    });

    it('handles decimal quantities (e.g. hours worked)', () => {
      const item = { quantity: 2.5, unitPrice: 80 };
      expect(calculateLineTotal(item)).toBe(200);
    });

    it('clamps negative quantities and prices to zero', () => {
      expect(calculateLineTotal({ quantity: -2, unitPrice: 100 })).toBe(0);
      expect(calculateLineTotal({ quantity: 2, unitPrice: -50 })).toBe(0);
    });

    it('handles zero or null/undefined items safely', () => {
      expect(calculateLineTotal({ quantity: 0, unitPrice: 100 })).toBe(0);
      expect(calculateLineTotal({ quantity: 5, unitPrice: 0 })).toBe(0);
      expect(calculateLineTotal(null as unknown as InvoiceItem)).toBe(0);
    });
  });

  describe('calculateSubtotal', () => {
    it('returns 0 for an empty items array', () => {
      expect(calculateSubtotal([])).toBe(0);
      expect(calculateSubtotal(null as unknown as InvoiceItem[])).toBe(0);
    });

    it('sums multiple line items with precision', () => {
      const items: InvoiceItem[] = [
        { id: '1', description: 'Item 1', quantity: 2, unitPrice: 19.99 },
        { id: '2', description: 'Item 2', quantity: 1, unitPrice: 5.5 },
        { id: '3', description: 'Item 3', quantity: 10, unitPrice: 0.1 },
      ];
      // 2 * 19.99 = 39.98
      // 1 * 5.50 = 5.50
      // 10 * 0.10 = 1.00
      // Sum = 46.48
      expect(calculateSubtotal(items)).toBe(46.48);
    });

    it('handles large sums without losing precision', () => {
      const items: InvoiceItem[] = [
        { id: '1', description: 'Enterprise license', quantity: 1000, unitPrice: 9999.99 },
      ];
      expect(calculateSubtotal(items)).toBe(9999990);
    });
  });

  describe('calculateTaxAmount', () => {
    it('computes tax with decimal rate (0.20)', () => {
      expect(calculateTaxAmount(100, 0.2)).toBe(20);
      expect(calculateTaxAmount(45.5, 0.2)).toBe(9.1);
    });

    it('computes tax with percentage rate (20)', () => {
      expect(calculateTaxAmount(100, 20)).toBe(20);
    });

    it('returns 0 for zero or undefined tax rate', () => {
      expect(calculateTaxAmount(100, 0)).toBe(0);
      expect(calculateTaxAmount(100, undefined)).toBe(0);
    });

    it('returns 0 for negative subtotal or tax', () => {
      expect(calculateTaxAmount(-100, 0.2)).toBe(0);
    });
  });

  describe('calculateDiscountAmount', () => {
    it('computes discount from subtotal', () => {
      expect(calculateDiscountAmount(200, 0.1)).toBe(20);
      expect(calculateDiscountAmount(200, 10)).toBe(20);
    });

    it('returns 0 for zero discount', () => {
      expect(calculateDiscountAmount(200, 0)).toBe(0);
      expect(calculateDiscountAmount(200, undefined)).toBe(0);
    });
  });

  describe('calculateGrandTotal', () => {
    it('computes (subtotal - discount) + tax', () => {
      // Subtotal 100, Tax 20, Discount 10 -> Grand total 110
      expect(calculateGrandTotal(100, 20, 10)).toBe(110);
    });

    it('clamps to zero if discount exceeds subtotal + tax', () => {
      expect(calculateGrandTotal(50, 0, 100)).toBe(0);
    });

    it('handles zero discount cleanly', () => {
      expect(calculateGrandTotal(100, 15)).toBe(115);
    });
  });

  describe('computeInvoiceTotals', () => {
    it('calculates full financial breakdown for invoice items', () => {
      const items: InvoiceItem[] = [
        { id: '1', description: 'Frontend Refactor', quantity: 10, unitPrice: 100 },
        { id: '2', description: 'Unit Tests', quantity: 5, unitPrice: 80 },
      ];
      // Subtotal = 1000 + 400 = 1400
      // Discount 10% = 140
      // Taxable base = 1400 - 140 = 1260
      // Tax 20% on 1260 = 252
      // Grand Total = 1400 - 140 + 252 = 1512
      const result = computeInvoiceTotals(items, 0.2, 0.1);

      expect(result.subtotal).toBe(1400);
      expect(result.discountAmount).toBe(140);
      expect(result.taxAmount).toBe(252);
      expect(result.grandTotal).toBe(1512);
    });

    it('handles zero items and zero tax rates', () => {
      const result = computeInvoiceTotals([], 0, 0);
      expect(result).toEqual({
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        grandTotal: 0,
      });
    });
  });
});
