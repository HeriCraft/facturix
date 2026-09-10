/**
 * Facturix Pure Domain Formatters
 * Pure functions for localized currency, safe date presentation, and document numbering.
 * Zero external dependencies.
 */

import { DocumentType } from './types';

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CAD: 'CA$',
  CHF: 'CHF',
  MAD: 'MAD',
  JPY: '¥',
  AUD: 'AU$',
};

/**
 * Formats a monetary amount into a clean, localized string.
 * Gracefully handles environment limitations and unknown currencies.
 */
export function formatCurrency(
  amount: number,
  currency = 'EUR',
  locale = 'en-US'
): string {
  const numericAmount = Number.isFinite(amount) ? amount : 0;
  const upperCurrency = (currency || 'EUR').trim().toUpperCase();

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: upperCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    // Fallback if the currency code is a custom symbol or Intl throws
    const symbol = CURRENCY_SYMBOLS[upperCurrency] || currency || '$';
    const formattedNumber = numericAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${symbol} ${formattedNumber}`;
  }
}

/**
 * Safely parses and formats an ISO date string (e.g. "2026-09-10") to human-readable presentation.
 * Returns a fallback dash '—' if the string is invalid or empty, avoiding crashes.
 */
export function formatDate(
  isoDateString?: string | null,
  style: 'short' | 'medium' | 'long' = 'medium',
  locale = 'en-US'
): string {
  if (!isoDateString || typeof isoDateString !== 'string') {
    return '—';
  }

  const timestamp = Date.parse(isoDateString);
  if (Number.isNaN(timestamp)) {
    return '—';
  }

  const date = new Date(timestamp);

  const dateStyleOptions: Record<'short' | 'medium' | 'long', Intl.DateTimeFormatOptions> = {
    short: { year: 'numeric', month: '2-digit', day: '2-digit' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
  };

  try {
    return new Intl.DateTimeFormat(locale, dateStyleOptions[style]).format(date);
  } catch {
    // Fallback format YYYY-MM-DD
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

/**
 * Generates standard sequential document identifiers like `INV-2026-0001` or `QUO-2026-0042`.
 */
export function generateDocumentNumber(
  type: DocumentType,
  sequenceNumber: number,
  year: number = new Date().getFullYear()
): string {
  const prefix = type === 'QUOTE' ? 'QUO' : 'INV';
  const paddedIndex = String(Math.max(1, sequenceNumber)).padStart(4, '0');
  return `${prefix}-${year}-${paddedIndex}`;
}

/**
 * Returns today's date formatted as an ISO date string (YYYY-MM-DD).
 */
export function getTodayIsoDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates a due date (e.g. today + 30 days) formatted as YYYY-MM-DD.
 */
export function getDefaultDueDate(daysFromToday = 30): string {
  const target = new Date();
  target.setDate(target.getDate() + daysFromToday);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
