/**
 * Facturix Storage Service
 * Infrastructure adapter over AsyncStorage with robust error boundaries,
 * defensive schema validation, and corrupted data recovery.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CompanyProfile, Invoice } from '../domain/types';

export const STORAGE_KEYS = {
  INVOICES: '@facturix:invoices:v1',
  PROFILE: '@facturix:company_profile:v1',
} as const;

export interface IStorageService {
  getInvoices(): Promise<Invoice[]>;
  saveInvoices(invoices: readonly Invoice[]): Promise<void>;
  getCompanyProfile(): Promise<CompanyProfile | null>;
  saveCompanyProfile(profile: CompanyProfile): Promise<void>;
  clearAll(): Promise<void>;
}

/**
 * Validates whether an unknown object conforms to the minimal shape of an Invoice.
 */
function isValidInvoice(item: unknown): item is Invoice {
  if (!item || typeof item !== 'object') return false;
  const candidate = item as Partial<Invoice>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.documentNumber === 'string' &&
    (candidate.type === 'INVOICE' || candidate.type === 'QUOTE') &&
    (candidate.status === 'PAID' || candidate.status === 'PENDING') &&
    Array.isArray(candidate.items) &&
    typeof candidate.grandTotal === 'number'
  );
}

/**
 * Validates whether an unknown object conforms to CompanyProfile.
 */
function isValidCompanyProfile(item: unknown): item is CompanyProfile {
  if (!item || typeof item !== 'object') return false;
  const candidate = item as Partial<CompanyProfile>;
  return typeof candidate.name === 'string' && typeof candidate.currency === 'string';
}

export class StorageService implements IStorageService {
  private storage: typeof AsyncStorage;

  constructor(storageEngine: typeof AsyncStorage = AsyncStorage) {
    this.storage = storageEngine;
  }

  /**
   * Retrieves all invoices.
   * If storage is empty, corrupted, or parsing fails, safely returns an empty array.
   */
  async getInvoices(): Promise<Invoice[]> {
    try {
      const rawData = await this.storage.getItem(STORAGE_KEYS.INVOICES);
      if (!rawData) {
        return [];
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawData);
      } catch (parseError) {
        console.warn('[StorageService] Corrupted invoice JSON detected. Resetting to empty list.', parseError);
        return [];
      }

      if (!Array.isArray(parsed)) {
        console.warn('[StorageService] Expected array for invoices but received:', typeof parsed);
        return [];
      }

      // Filter out invalid items to ensure type safety & resilience against dirty state
      const sanitized = parsed.filter(isValidInvoice);
      return sanitized;
    } catch (error) {
      console.error('[StorageService] Error reading invoices from storage:', error);
      return [];
    }
  }

  /**
   * Persists the list of invoices.
   */
  async saveInvoices(invoices: readonly Invoice[]): Promise<void> {
    try {
      const validInvoices = Array.isArray(invoices) ? invoices.filter(isValidInvoice) : [];
      const payload = JSON.stringify(validInvoices);
      await this.storage.setItem(STORAGE_KEYS.INVOICES, payload);
    } catch (error) {
      console.error('[StorageService] Failed to save invoices to storage:', error);
      throw new Error(`[StorageService] Failed to persist invoices: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves the company profile.
   * Returns null if not yet configured.
   */
  async getCompanyProfile(): Promise<CompanyProfile | null> {
    try {
      const rawData = await this.storage.getItem(STORAGE_KEYS.PROFILE);
      if (!rawData) {
        return null;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawData);
      } catch (parseError) {
        console.warn('[StorageService] Corrupted profile JSON detected.', parseError);
        return null;
      }

      if (!isValidCompanyProfile(parsed)) {
        console.warn('[StorageService] Invalid company profile format in storage.');
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('[StorageService] Error reading company profile:', error);
      return null;
    }
  }

  /**
   * Persists company profile.
   */
  async saveCompanyProfile(profile: CompanyProfile): Promise<void> {
    try {
      if (!isValidCompanyProfile(profile)) {
        throw new Error('Invalid company profile: name and currency are required.');
      }
      const payload = JSON.stringify(profile);
      await this.storage.setItem(STORAGE_KEYS.PROFILE, payload);
    } catch (error) {
      console.error('[StorageService] Failed to save company profile:', error);
      throw new Error(`[StorageService] Failed to persist profile: ${(error as Error).message}`);
    }
  }

  /**
   * Clears all Facturix-related keys from local storage.
   */
  async clearAll(): Promise<void> {
    try {
      const engine = this.storage as any;
      if (typeof engine.removeMany === 'function') {
        await engine.removeMany([STORAGE_KEYS.INVOICES, STORAGE_KEYS.PROFILE]);
      } else if (typeof engine.multiRemove === 'function') {
        await engine.multiRemove([STORAGE_KEYS.INVOICES, STORAGE_KEYS.PROFILE]);
      } else {
        await Promise.all([
          this.storage.removeItem(STORAGE_KEYS.INVOICES),
          this.storage.removeItem(STORAGE_KEYS.PROFILE),
        ]);
      }
    } catch (error) {
      console.error('[StorageService] Error clearing storage:', error);
      throw new Error(`[StorageService] Failed to clear storage: ${(error as Error).message}`);
    }
  }
}

/**
 * Singleton instance for standard app usage
 */
export const storageService = new StorageService();
