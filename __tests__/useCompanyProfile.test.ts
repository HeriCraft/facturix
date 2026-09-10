/**
 * Unit tests for Facturix useCompanyProfile Hook
 * Tests profile retrieval, defaults, and persistence.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native';
import { DEFAULT_COMPANY_PROFILE, useCompanyProfile } from '../src/hooks/useCompanyProfile';
import { IStorageService } from '../src/services/storageService';
import { CompanyProfile } from '../src/domain/types';

describe('useCompanyProfile Hook', () => {
  let mockStorage: IStorageService;
  let storedProfile: CompanyProfile | null;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    jest.clearAllMocks();
    storedProfile = null;
    mockStorage = {
      getInvoices: jest.fn().mockResolvedValue([]),
      saveInvoices: jest.fn().mockResolvedValue(undefined),
      getCompanyProfile: jest.fn().mockImplementation(async () => storedProfile),
      saveCompanyProfile: jest.fn().mockImplementation(async (prof) => {
        storedProfile = prof;
      }),
      clearAll: jest.fn().mockResolvedValue(undefined),
    };
  });

  const waitForHookLoaded = async (result: { current: any }) => {
    await waitFor(() => {
      expect(result.current).toBeDefined();
      expect(result.current?.isLoading).toBe(false);
    });
  };

  it('initializes with default company profile if none exists in storage', async () => {
    const { result } = await renderHook(() => useCompanyProfile(mockStorage));
    await waitForHookLoaded(result);

    expect(result.current.profile).toEqual(DEFAULT_COMPANY_PROFILE);
    expect(mockStorage.getCompanyProfile).toHaveBeenCalled();
  });

  it('loads saved profile from storage', async () => {
    storedProfile = {
      name: 'Custom Studio',
      phone: '+1 800 555 1234',
      email: 'hi@custom.com',
      address: '10 Main St',
      currency: 'USD',
      defaultPaymentTerms: 'Due upon receipt',
    };

    const { result } = await renderHook(() => useCompanyProfile(mockStorage));
    await waitForHookLoaded(result);

    expect(result.current.profile.name).toBe('Custom Studio');
    expect(result.current.profile.currency).toBe('USD');
  });

  it('persists profile updates to storage', async () => {
    const { result } = await renderHook(() => useCompanyProfile(mockStorage));
    await waitForHookLoaded(result);

    const updated: CompanyProfile = {
      name: 'Updated Enterprise',
      phone: '+44 20 7946 0999',
      currency: 'GBP',
    };

    await act(async () => {
      await result.current.updateProfile(updated);
    });

    expect(result.current.profile.name).toBe('Updated Enterprise');
    expect(mockStorage.saveCompanyProfile).toHaveBeenCalledWith(updated);
    expect(storedProfile).toEqual(updated);
  });

  it('handles loading errors gracefully', async () => {
    mockStorage.getCompanyProfile = jest.fn().mockRejectedValue(new Error('Storage failure'));

    const { result } = await renderHook(() => useCompanyProfile(mockStorage));
    await waitForHookLoaded(result);

    expect(result.current.error).toContain('Storage failure');
    expect(result.current.profile).toEqual(DEFAULT_COMPANY_PROFILE);
  });
});
