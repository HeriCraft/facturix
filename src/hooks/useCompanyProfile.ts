/**
 * Facturix Company Profile Hook
 * Manages local business profile retrieval, state synchronization, and storage persistence.
 */

import { useCallback, useEffect, useState } from 'react';
import { CompanyProfile } from '../domain/types';
import { IStorageService, storageService } from '../services/storageService';

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  name: 'My Enterprise',
  phone: '+1 (555) 234-5678',
  email: 'billing@myenterprise.com',
  address: '100 Innovation Blvd, Tech Park',
  currency: 'EUR',
  defaultPaymentTerms: 'Payment due within 30 days of invoice date.',
  taxNumber: 'FR 84 987654321',
};

export interface UseCompanyProfileResult {
  profile: CompanyProfile;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  updateProfile: (updated: CompanyProfile) => Promise<void>;
  reload: () => Promise<void>;
}

export function useCompanyProfile(
  storage: IStorageService = storageService
): UseCompanyProfileResult {
  const [profile, setProfile] = useState<CompanyProfile>(DEFAULT_COMPANY_PROFILE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const saved = await storage.getCompanyProfile();
      if (saved) {
        setProfile(saved);
      }
    } catch (err) {
      const msg = (err as Error).message || 'Failed to load company profile';
      setError(msg);
      console.error('[useCompanyProfile] Error loading profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, [storage]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateProfile = useCallback(
    async (updated: CompanyProfile) => {
      try {
        setIsSaving(true);
        setError(null);
        await storage.saveCompanyProfile(updated);
        setProfile(updated);
      } catch (err) {
        const msg = (err as Error).message || 'Failed to update company profile';
        setError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [storage]
  );

  return {
    profile,
    isLoading,
    isSaving,
    error,
    updateProfile,
    reload: loadProfile,
  };
}
