/**
 * Unit tests for Facturix Screen Components and Modals
 */

import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { CompanyProfileModal } from '../src/components/CompanyProfileModal';
import { InvoiceEditorScreen } from '../src/screens/InvoiceEditorScreen';
import { DEFAULT_COMPANY_PROFILE } from '../src/hooks/useCompanyProfile';

jest.mock('../src/services/storageService', () => ({
  storageService: {
    getCompanyProfile: jest.fn().mockResolvedValue({
      name: 'My Enterprise',
      phone: '+1 (555) 234-5678',
      email: 'billing@myenterprise.com',
      address: '100 Innovation Blvd, Tech Park',
      currency: 'EUR',
      defaultPaymentTerms: 'Payment due within 30 days of invoice date.',
      taxNumber: 'FR 84 987654321',
    }),
    saveCompanyProfile: jest.fn().mockResolvedValue(undefined),
    getAllInvoices: jest.fn().mockResolvedValue([]),
    saveInvoice: jest.fn().mockResolvedValue(undefined),
    deleteInvoice: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('Screen and Modal Components', () => {
  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  });

  describe('CompanyProfileModal', () => {
    it('renders initial profile fields and allows saving changes', async () => {
      const onSaveMock = jest.fn();
      const onCloseMock = jest.fn();

      const { getByPlaceholderText, getByText } = await render(
        <CompanyProfileModal
          visible={true}
          initialProfile={DEFAULT_COMPANY_PROFILE}
          onSave={onSaveMock}
          onClose={onCloseMock}
        />
      );

      expect(getByText('Company Profile')).toBeTruthy();

      const nameInput = getByPlaceholderText('e.g. Acme Studio');
      await fireEvent.changeText(nameInput, 'Renamed Studio');

      // Select USD currency
      await fireEvent.press(getByText('USD'));

      // Save
      await fireEvent.press(getByText('Save Profile'));

      expect(onSaveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Renamed Studio',
          currency: 'USD',
        })
      );
      expect(onCloseMock).toHaveBeenCalled();
    });

    it('cancels without saving', async () => {
      const onSaveMock = jest.fn();
      const onCloseMock = jest.fn();

      const { getByText } = await render(
        <CompanyProfileModal
          visible={true}
          initialProfile={DEFAULT_COMPANY_PROFILE}
          onSave={onSaveMock}
          onClose={onCloseMock}
        />
      );

      await fireEvent.press(getByText('Cancel'));
      expect(onSaveMock).not.toHaveBeenCalled();
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  describe('InvoiceEditorScreen', () => {
    it('renders editor form with client details and line items', async () => {
      const onSaveMock = jest.fn().mockResolvedValue({ id: '1' });
      const onCloseMock = jest.fn();

      const { getByText } = await render(
        <InvoiceEditorScreen onSave={onSaveMock} onClose={onCloseMock} />
      );

      await waitFor(() => {
        expect(getByText('New Document')).toBeTruthy();
      });

      expect(getByText('Client Details')).toBeTruthy();
      expect(getByText('Line Items')).toBeTruthy();
      expect(getByText('Summary')).toBeTruthy();

      // Add new item
      await fireEvent.press(getByText('+ Add Item'));
      expect(getByText('2 items')).toBeTruthy();
    });

    it('validates client name before saving', async () => {
      const onSaveMock = jest.fn().mockResolvedValue({ id: '1' });
      const onCloseMock = jest.fn();

      const { getByText } = await render(
        <InvoiceEditorScreen onSave={onSaveMock} onClose={onCloseMock} />
      );

      await waitFor(() => {
        expect(getByText('Save')).toBeTruthy();
      });

      // Attempt to save with empty client name
      await fireEvent.press(getByText('Save'));
      expect(onSaveMock).not.toHaveBeenCalled();
    });
  });
});
