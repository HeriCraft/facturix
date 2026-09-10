/**
 * Unit tests for Facturix Presentational Components
 * Verifies rendering, variants, interactions, and accessibility.
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Badge } from '../src/components/Badge';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { CurrencyInput } from '../src/components/CurrencyInput';
import { MetricBox } from '../src/components/MetricBox';
import { SegmentedControl } from '../src/components/SegmentedControl';
import { InvoiceCard } from '../src/components/InvoiceCard';
import { Invoice } from '../src/domain/types';

describe('Presentational Components', () => {
  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  });

  describe('Badge', () => {
    it('renders label and status variants', async () => {
      const { getByText } = await render(<Badge label="PAID" variant="paid" />);
      expect(getByText('PAID')).toBeTruthy();
    });

    it('supports small and medium sizes', async () => {
      const { getByText } = await render(<Badge label="PENDING" variant="pending" size="sm" />);
      expect(getByText('PENDING')).toBeTruthy();
    });
  });

  describe('Button', () => {
    it('renders button title and handles press events', async () => {
      const onPressMock = jest.fn();
      const { getByText } = await render(
        <Button title="Create Invoice" onPress={onPressMock} variant="primary" />
      );

      const button = getByText('Create Invoice');
      await fireEvent.press(button);
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('does not trigger onPress when disabled', async () => {
      const onPressMock = jest.fn();
      const { getByText } = await render(
        <Button title="Disabled" onPress={onPressMock} disabled />
      );

      await fireEvent.press(getByText('Disabled'));
      expect(onPressMock).not.toHaveBeenCalled();
    });

    it('displays activity indicator when loading', async () => {
      const { queryByText } = await render(
        <Button title="Save" onPress={jest.fn()} loading />
      );

      expect(queryByText('Save')).toBeNull();
    });
  });

  describe('Card', () => {
    it('renders children with elevated or outlined styling', async () => {
      const { getByText } = await render(
        <Card variant="elevated">
          <Badge label="Inside Card" />
        </Card>
      );
      expect(getByText('Inside Card')).toBeTruthy();
    });
  });

  describe('CurrencyInput', () => {
    it('renders with label, currency prefix, and triggers onChangeValue with numeric values', async () => {
      const onChangeValueMock = jest.fn();
      const { getByPlaceholderText, getByText } = await render(
        <CurrencyInput
          label="Price"
          currencySymbol="EUR"
          value={150}
          onChangeValue={onChangeValueMock}
          placeholder="0.00"
        />
      );

      expect(getByText('Price')).toBeTruthy();
      expect(getByText('EUR')).toBeTruthy();

      const input = getByPlaceholderText('0.00');
      await fireEvent.changeText(input, '250.50');
      expect(onChangeValueMock).toHaveBeenCalledWith(250.5);
    });

    it('sanitizes input and allows only integers when allowDecimals is false', async () => {
      const onChangeValueMock = jest.fn();
      const { getByPlaceholderText } = await render(
        <CurrencyInput
          value={1}
          onChangeValue={onChangeValueMock}
          allowDecimals={false}
          placeholder="Qty"
        />
      );

      const input = getByPlaceholderText('Qty');
      await fireEvent.changeText(input, '12.5abc');
      expect(onChangeValueMock).toHaveBeenCalledWith(125);
    });
  });

  describe('MetricBox', () => {
    it('renders label, formatted amount, and accent', async () => {
      const { getByText } = await render(
        <MetricBox
          label="Billed"
          formattedAmount="€ 12,500.00"
          subtext="15 invoices"
          accent="blue"
        />
      );

      expect(getByText('Billed')).toBeTruthy();
      expect(getByText('€ 12,500.00')).toBeTruthy();
      expect(getByText('15 invoices')).toBeTruthy();
    });
  });

  describe('SegmentedControl', () => {
    it('renders options and fires onSelect on press', async () => {
      const onSelectMock = jest.fn();
      const options = [
        { key: 'ALL', label: 'All', count: 5 },
        { key: 'PAID', label: 'Paid', count: 2 },
      ] as const;

      const { getByText } = await render(
        <SegmentedControl options={options} selectedKey="ALL" onSelect={onSelectMock} />
      );

      expect(getByText('All')).toBeTruthy();
      expect(getByText('Paid')).toBeTruthy();

      await fireEvent.press(getByText('Paid'));
      expect(onSelectMock).toHaveBeenCalledWith('PAID');
    });
  });

  describe('InvoiceCard', () => {
    const sampleInvoice: Invoice = {
      id: 'inv_1',
      documentNumber: 'INV-2026-0001',
      type: 'INVOICE',
      status: 'PENDING',
      issueDate: '2026-09-10',
      dueDate: '2026-10-10',
      client: { name: 'Acme Corp' },
      items: [{ id: '1', description: 'Consulting', quantity: 2, unitPrice: 100 }],
      subtotal: 200,
      taxRate: 0.2,
      taxAmount: 40,
      grandTotal: 240,
      createdAt: '2026-09-10T10:00:00.000Z',
      updatedAt: '2026-09-10T10:00:00.000Z',
    };

    it('renders document metadata and handles status toggle & share callbacks', async () => {
      const onToggleMock = jest.fn();
      const onShareMock = jest.fn();
      const onDeleteMock = jest.fn();

      const { getByText } = await render(
        <InvoiceCard
          invoice={sampleInvoice}
          currency="EUR"
          onToggleStatus={onToggleMock}
          onShare={onShareMock}
          onDelete={onDeleteMock}
        />
      );

      expect(getByText('INV-2026-0001')).toBeTruthy();
      expect(getByText('Acme Corp')).toBeTruthy();

      // Quick action: Toggle status
      const markPaidBtn = getByText('Mark as Paid');
      await fireEvent.press(markPaidBtn);
      expect(onToggleMock).toHaveBeenCalledTimes(1);

      // Quick action: Share PDF
      const shareBtn = getByText('Share PDF');
      await fireEvent.press(shareBtn);
      expect(onShareMock).toHaveBeenCalledTimes(1);

      // Quick action: Delete
      const deleteBtn = getByText('Delete');
      await fireEvent.press(deleteBtn);
      expect(onDeleteMock).toHaveBeenCalledTimes(1);
    });
  });
});
