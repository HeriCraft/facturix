/**
 * Facturix Pure Financial Calculator
 * Pure business calculation functions with zero external dependencies.
 * Handles IEEE-754 precision issues, bounds checking, and decimal rounding.
 */

import { ComputedTotals, InvoiceItem } from './types';

/**
 * Rounds a number to exactly two decimal places for currency representation,
 * avoiding IEEE-754 precision artifacts (e.g., 0.1 + 0.2 = 0.30000000000000004).
 */
export function roundToCurrency(amount: number): number {
  if (!Number.isFinite(amount) || Number.isNaN(amount)) {
    return 0;
  }
  // Using exponential rounding for maximum numerical stability
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Normalizes a rate input that could be entered as a percentage (e.g. 20 for 20%)
 * or as a decimal ratio (e.g. 0.20). Returns a decimal between 0 and 1 (or higher if valid surcharge).
 */
export function normalizeRate(rate?: number): number {
  if (!rate || !Number.isFinite(rate) || rate < 0) {
    return 0;
  }
  // If rate is greater than 1, treat as percentage (e.g., 20 -> 0.20)
  return rate > 1 ? rate / 100 : rate;
}

/**
 * Calculates the line total for a single item (quantity * unitPrice),
 * enforcing non-negative values and rounding to two decimal places.
 */
export function calculateLineTotal(item: Pick<InvoiceItem, 'quantity' | 'unitPrice'>): number {
  if (!item) return 0;
  const quantity = Number.isFinite(item.quantity) ? Math.max(0, item.quantity) : 0;
  const unitPrice = Number.isFinite(item.unitPrice) ? Math.max(0, item.unitPrice) : 0;

  return roundToCurrency(quantity * unitPrice);
}

/**
 * Calculates the subtotal for a collection of invoice items.
 */
export function calculateSubtotal(items: readonly InvoiceItem[]): number {
  if (!Array.isArray(items) || items.length === 0) {
    return 0;
  }

  const rawSum = items.reduce((acc, item) => acc + calculateLineTotal(item), 0);
  return roundToCurrency(rawSum);
}

/**
 * Calculates the tax amount based on subtotal and a tax rate (e.g. 0.20 or 20 for 20%).
 */
export function calculateTaxAmount(subtotal: number, taxRate?: number): number {
  const safeSubtotal = Number.isFinite(subtotal) ? Math.max(0, subtotal) : 0;
  const rate = normalizeRate(taxRate);
  return roundToCurrency(safeSubtotal * rate);
}

/**
 * Calculates discount amount based on subtotal and a discount rate (e.g. 0.10 or 10 for 10%).
 */
export function calculateDiscountAmount(subtotal: number, discountRate?: number): number {
  const safeSubtotal = Number.isFinite(subtotal) ? Math.max(0, subtotal) : 0;
  const rate = normalizeRate(discountRate);
  return roundToCurrency(safeSubtotal * rate);
}

/**
 * Calculates the grand total: (subtotal - discount) + tax.
 * Grand total is clamped to never fall below zero.
 */
export function calculateGrandTotal(
  subtotal: number,
  taxAmount: number,
  discountAmount = 0
): number {
  const safeSubtotal = Number.isFinite(subtotal) ? Math.max(0, subtotal) : 0;
  const safeTax = Number.isFinite(taxAmount) ? Math.max(0, taxAmount) : 0;
  const safeDiscount = Number.isFinite(discountAmount) ? Math.max(0, discountAmount) : 0;

  const total = safeSubtotal - safeDiscount + safeTax;
  return roundToCurrency(Math.max(0, total));
}

/**
 * Convenience orchestrator that computes all financial figures at once for an invoice or draft.
 */
export function computeInvoiceTotals(
  items: readonly InvoiceItem[],
  taxRate = 0,
  discountRate = 0
): ComputedTotals {
  const subtotal = calculateSubtotal(items);
  const discountAmount = calculateDiscountAmount(subtotal, discountRate);
  // Tax is typically calculated on the discounted subtotal or subtotal
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = calculateTaxAmount(taxableBase, taxRate);
  const grandTotal = calculateGrandTotal(subtotal, taxAmount, discountAmount);

  return {
    subtotal,
    taxAmount,
    discountAmount,
    grandTotal,
  };
}
