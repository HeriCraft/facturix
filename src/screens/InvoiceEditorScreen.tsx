/**
 * Facturix InvoiceEditorScreen
 * Feature screen for composing and editing Invoices and Quotes.
 * Encapsulates client details, dynamic item rows, live arithmetic, and one-click PDF sharing.
 */

import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CreateInvoiceDTO,
  DocumentType,
  Invoice,
  InvoiceItem,
  InvoiceStatus,
} from '../domain/types';
import { computeInvoiceTotals } from '../domain/calculator';
import {
  formatCurrency,
  getDefaultDueDate,
  getTodayIsoDate,
} from '../domain/formatters';
import { useCompanyProfile } from '../hooks/useCompanyProfile';
import { shareService } from '../services/shareService';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { CurrencyInput } from '../components/CurrencyInput';
import { SegmentedControl, SegmentOption } from '../components/SegmentedControl';

export interface InvoiceEditorScreenProps {
  existingInvoice?: Invoice;
  onSave: (invoice: CreateInvoiceDTO) => Promise<Invoice>;
  onClose: () => void;
}

const DOCUMENT_TYPE_OPTIONS: readonly SegmentOption<DocumentType>[] = [
  { key: 'INVOICE', label: 'Invoice' },
  { key: 'QUOTE', label: 'Quote' },
];

export const InvoiceEditorScreen: React.FC<InvoiceEditorScreenProps> = ({
  existingInvoice,
  onSave,
  onClose,
}) => {
  const { profile } = useCompanyProfile();
  const currency = profile.currency || 'EUR';

  // Header & Type State
  const [docType, setDocType] = useState<DocumentType>(existingInvoice?.type || 'INVOICE');
  const [status, setStatus] = useState<InvoiceStatus>(existingInvoice?.status || 'PENDING');
  const [issueDate, setIssueDate] = useState<string>(
    existingInvoice?.issueDate || getTodayIsoDate()
  );
  const [dueDate, setDueDate] = useState<string>(
    existingInvoice?.dueDate || getDefaultDueDate(30)
  );

  // Client Details State
  const [clientName, setClientName] = useState(existingInvoice?.client.name || '');
  const [clientEmail, setClientEmail] = useState(existingInvoice?.client.email || '');
  const [clientPhone, setClientPhone] = useState(existingInvoice?.client.phone || '');
  const [clientAddress, setClientAddress] = useState(existingInvoice?.client.address || '');

  // Line Items State
  const [items, setItems] = useState<InvoiceItem[]>(
    existingInvoice?.items
      ? [...existingInvoice.items]
      : [{ id: `item_1`, description: '', quantity: 1, unitPrice: 0 }]
  );

  // Financial Parameters
  const [taxPercent, setTaxPercent] = useState<number>(
    existingInvoice ? Math.round((existingInvoice.taxRate || 0) * 100) : 20
  );
  const [discountPercent, setDiscountPercent] = useState<number>(
    existingInvoice ? Math.round((existingInvoice.discountRate || 0) * 100) : 0
  );

  // Notes & Terms
  const [notes, setNotes] = useState(existingInvoice?.notes || '');
  const [paymentTerms, setPaymentTerms] = useState(
    existingInvoice?.paymentTerms ||
      profile.defaultPaymentTerms ||
      'Payment due within 30 days of receipt.'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Live running totals computed via pure domain function
  const totals = useMemo(() => {
    return computeInvoiceTotals(items, taxPercent / 100, discountPercent / 100);
  }, [items, taxPercent, discountPercent]);

  // Dynamic Item List Operations
  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      Alert.alert('Notice', 'A document must contain at least one line item.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (
    index: number,
    field: keyof Omit<InvoiceItem, 'id'>,
    value: string | number
  ) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value,
      };
      return copy;
    });
  };

  const validate = (): boolean => {
    if (!clientName.trim()) {
      Alert.alert('Validation Error', 'Please enter a Client Name.');
      return false;
    }
    const hasValidItem = items.some((item) => item.description.trim().length > 0);
    if (!hasValidItem) {
      Alert.alert('Validation Error', 'Please provide a description for at least one item.');
      return false;
    }
    return true;
  };

  const buildDto = (): CreateInvoiceDTO => {
    return {
      type: docType,
      status,
      issueDate,
      dueDate,
      client: {
        name: clientName.trim(),
        email: clientEmail.trim() || undefined,
        phone: clientPhone.trim() || undefined,
        address: clientAddress.trim() || undefined,
      },
      items: items.map((i) => ({
        id: i.id,
        description: i.description.trim() || 'Item',
        quantity: Math.max(1, i.quantity || 1),
        unitPrice: Math.max(0, i.unitPrice || 0),
      })),
      taxRate: taxPercent / 100,
      discountRate: discountPercent / 100,
      notes: notes.trim() || undefined,
      paymentTerms: paymentTerms.trim() || undefined,
    };
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await onSave(buildDto());
      onClose();
    } catch (err) {
      Alert.alert('Error', (err as Error).message || 'Failed to save document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateAndShare = async () => {
    if (!validate()) return;

    try {
      setIsSharing(true);
      const savedDoc = await onSave(buildDto());
      await shareService.sharePdf(savedDoc, profile);
      onClose();
    } catch (err) {
      Alert.alert('Sharing Error', (err as Error).message || 'Failed to share document.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}>
        {/* Top Header */}
        <View style={styles.navBar}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.backButton}>
            <Text style={styles.backButtonText}>Cancel</Text>
          </Pressable>
          <Text style={styles.navTitle}>
            {existingInvoice ? `Edit ${existingInvoice.documentNumber}` : 'New Document'}
          </Text>
          <Pressable onPress={handleSave} hitSlop={10} disabled={isSubmitting || isSharing}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#2563eb" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Document Type Selector */}
          <SegmentedControl<DocumentType>
            options={DOCUMENT_TYPE_OPTIONS}
            selectedKey={docType}
            onSelect={setDocType}
            style={styles.typeSelector}
          />

          {/* Dates & Reference Section */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Document Details</Text>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Issue Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={issueDate}
                  onChangeText={setIssueDate}
                  placeholder="2026-09-10"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Due Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="2026-10-10"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            {docType === 'INVOICE' ? (
              <View style={styles.statusToggleContainer}>
                <Text style={styles.fieldLabel}>Initial Status</Text>
                <View style={styles.statusButtonsRow}>
                  <Pressable
                    onPress={() => setStatus('PENDING')}
                    style={[
                      styles.statusPill,
                      status === 'PENDING' && styles.statusPillActivePending,
                    ]}>
                    <Text
                      style={[
                        styles.statusPillText,
                        status === 'PENDING' && styles.statusPillTextActivePending,
                      ]}>
                      PENDING
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setStatus('PAID')}
                    style={[
                      styles.statusPill,
                      status === 'PAID' && styles.statusPillActivePaid,
                    ]}>
                    <Text
                      style={[
                        styles.statusPillText,
                        status === 'PAID' && styles.statusPillTextActivePaid,
                      ]}>
                      PAID
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </Card>

          {/* Customer Details Section */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Client Details</Text>
            <Text style={styles.fieldLabel}>Client / Business Name *</Text>
            <TextInput
              style={styles.input}
              value={clientName}
              onChangeText={setClientName}
              placeholder="e.g. Acme Corporation"
              placeholderTextColor="#94a3b8"
            />

            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Client Email</Text>
                <TextInput
                  style={styles.input}
                  value={clientEmail}
                  onChangeText={setClientEmail}
                  placeholder="client@acme.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Client Phone</Text>
                <TextInput
                  style={styles.input}
                  value={clientPhone}
                  onChangeText={setClientPhone}
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Billing Address</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={clientAddress}
              onChangeText={setClientAddress}
              placeholder="Full address (Street, City, Zip, Country)"
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={2}
            />
          </Card>

          {/* Line Items Manager */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Line Items</Text>
              <Text style={styles.itemCountHeader}>{items.length} items</Text>
            </View>

            {items.map((item, index) => {
              const lineTotal = item.quantity * item.unitPrice;
              return (
                <View key={item.id} style={styles.itemRowContainer}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemNumber}>#{index + 1}</Text>
                    <Text style={styles.lineTotalAmount}>
                      {formatCurrency(lineTotal, currency)}
                    </Text>
                    {items.length > 1 ? (
                      <Pressable
                        onPress={() => handleRemoveItem(index)}
                        hitSlop={8}
                        style={styles.deleteItemBtn}>
                        <Text style={styles.deleteItemText}>✕</Text>
                      </Pressable>
                    ) : null}
                  </View>

                  <Text style={styles.fieldLabel}>Description</Text>
                  <TextInput
                    style={styles.input}
                    value={item.description}
                    onChangeText={(val) => handleUpdateItem(index, 'description', val)}
                    placeholder="e.g. Mobile App Engineering"
                    placeholderTextColor="#94a3b8"
                  />

                  <View style={styles.twoColRow}>
                    <View style={styles.col}>
                      <CurrencyInput
                        label="Quantity"
                        value={item.quantity}
                        onChangeValue={(val) => handleUpdateItem(index, 'quantity', val)}
                        allowDecimals={false}
                        placeholder="1"
                      />
                    </View>
                    <View style={styles.col}>
                      <CurrencyInput
                        label="Unit Price"
                        currencySymbol={currency}
                        value={item.unitPrice}
                        onChangeValue={(val) => handleUpdateItem(index, 'unitPrice', val)}
                        allowDecimals={true}
                        placeholder="0.00"
                      />
                    </View>
                  </View>
                </View>
              );
            })}

            <Button
              title="+ Add Item"
              variant="outline"
              size="sm"
              onPress={handleAddItem}
              style={styles.addItemButton}
            />
          </Card>

          {/* Tax & Discount Inputs */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Taxes & Discounts</Text>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <CurrencyInput
                  label="Tax / VAT Rate (%)"
                  value={taxPercent}
                  onChangeValue={setTaxPercent}
                  allowDecimals={false}
                  placeholder="20"
                />
              </View>
              <View style={styles.col}>
                <CurrencyInput
                  label="Discount Rate (%)"
                  value={discountPercent}
                  onChangeValue={setDiscountPercent}
                  allowDecimals={false}
                  placeholder="0"
                />
              </View>
            </View>
          </Card>

          {/* Live Summary Card */}
          <Card variant="flat" style={styles.summaryCard}>
            <Text style={styles.summaryCardTitle}>Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(totals.subtotal, currency)}
              </Text>
            </View>

            {totals.discountAmount > 0 ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount ({discountPercent}%)</Text>
                <Text style={[styles.summaryValue, styles.discountText]}>
                  -{formatCurrency(totals.discountAmount, currency)}
                </Text>
              </View>
            ) : null}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax ({taxPercent}%)</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(totals.taxAmount, currency)}
              </Text>
            </View>

            <View style={[styles.summaryRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(totals.grandTotal, currency)}
              </Text>
            </View>
          </Card>

          {/* Notes & Payment Terms */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Terms & Notes</Text>
            <Text style={styles.fieldLabel}>Payment Terms</Text>
            <TextInput
              style={styles.input}
              value={paymentTerms}
              onChangeText={setPaymentTerms}
              placeholder="Payment due within 30 days..."
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.fieldLabel}>Special Notes</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Thank you for your business..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={2}
            />
          </Card>

          {/* One-Click Generate & Share CTA */}
          <View style={styles.ctaContainer}>
            <Button
              title="Generate & Share PDF"
              variant="primary"
              size="lg"
              loading={isSharing}
              disabled={isSubmitting || isSharing}
              onPress={handleGenerateAndShare}
              fullWidth
              style={styles.shareCta}
            />

            <Button
              title="Save Document"
              variant="secondary"
              size="md"
              loading={isSubmitting}
              disabled={isSubmitting || isSharing}
              onPress={handleSave}
              fullWidth
              style={styles.saveCta}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardContainer: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backButtonText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '600',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563eb',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  typeSelector: {
    marginBottom: 16,
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
    letterSpacing: -0.01,
  },
  itemCountHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.04,
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 12,
  },
  multiline: {
    minHeight: 56,
    textAlignVertical: 'top',
  },
  statusToggleContainer: {
    marginTop: 4,
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  statusPillActivePending: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
  },
  statusPillActivePaid: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  statusPillTextActivePending: {
    color: '#b45309',
  },
  statusPillTextActivePaid: {
    color: '#047857',
  },
  itemRowContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
  },
  lineTotalAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    fontVariant: ['tabular-nums'],
    marginLeft: 'auto',
    marginRight: 12,
  },
  deleteItemBtn: {
    padding: 4,
  },
  deleteItemText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '700',
  },
  addItemButton: {
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    padding: 16,
    marginBottom: 16,
  },
  summaryCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.05,
    color: '#94a3b8',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
  },
  discountText: {
    color: '#10b981',
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
  },
  ctaContainer: {
    gap: 10,
    marginTop: 8,
  },
  shareCta: {
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveCta: {},
});
