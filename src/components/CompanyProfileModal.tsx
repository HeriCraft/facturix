/**
 * Facturix CompanyProfileModal Component
 * Presentational modal for editing company business info and currency preferences.
 */

import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CompanyProfile } from '../domain/types';
import { Button } from './Button';

export interface CompanyProfileModalProps {
  visible: boolean;
  initialProfile: CompanyProfile;
  onSave: (updated: CompanyProfile) => void;
  onClose: () => void;
}

const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CAD', 'CHF', 'MAD'];

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({
  visible,
  initialProfile,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(initialProfile.name);
  const [email, setEmail] = useState(initialProfile.email || '');
  const [phone, setPhone] = useState(initialProfile.phone || '');
  const [address, setAddress] = useState(initialProfile.address || '');
  const [taxNumber, setTaxNumber] = useState(initialProfile.taxNumber || '');
  const [currency, setCurrency] = useState(initialProfile.currency || 'EUR');
  const [paymentTerms, setPaymentTerms] = useState(
    initialProfile.defaultPaymentTerms || 'Payment due within 30 days of receipt.'
  );

  const handleSave = () => {
    onSave({
      name: name.trim() || 'My Business',
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      taxNumber: taxNumber.trim(),
      currency,
      defaultPaymentTerms: paymentTerms.trim(),
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Company Profile</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>
              Configure your business metadata for invoices and quotes. Data stays 100% on your device.
            </Text>

            {/* Business Name */}
            <Text style={styles.label}>Company / Freelancer Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Acme Studio"
              placeholderTextColor="#94a3b8"
            />

            {/* Currency Selector */}
            <Text style={styles.label}>Default Currency</Text>
            <View style={styles.currencyRow}>
              {SUPPORTED_CURRENCIES.map((curr) => {
                const isSelected = curr === currency;
                return (
                  <Pressable
                    key={curr}
                    onPress={() => setCurrency(curr)}
                    style={[
                      styles.currencyPill,
                      isSelected && styles.currencyPillSelected,
                    ]}>
                    <Text
                      style={[
                        styles.currencyPillText,
                        isSelected && styles.currencyPillTextSelected,
                      ]}>
                      {curr}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Email & Phone */}
            <View style={styles.twoColumnRow}>
              <View style={styles.column}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="contact@domain.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Physical Address */}
            <Text style={styles.label}>Business Address</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={address}
              onChangeText={setAddress}
              placeholder="123 Market St, Suite 400, City, Country"
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={2}
            />

            {/* Tax Number */}
            <Text style={styles.label}>Tax / VAT / SIRET ID</Text>
            <TextInput
              style={styles.input}
              value={taxNumber}
              onChangeText={setTaxNumber}
              placeholder="e.g. VAT # 12345678"
              placeholderTextColor="#94a3b8"
            />

            {/* Default Terms */}
            <Text style={styles.label}>Default Payment Terms</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={paymentTerms}
              onChangeText={setPaymentTerms}
              placeholder="Payment due upon receipt..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={2}
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="Cancel"
              variant="outline"
              size="md"
              onPress={onClose}
              style={styles.footerBtn}
            />
            <Button
              title="Save Profile"
              variant="primary"
              size="md"
              onPress={handleSave}
              style={styles.footerBtn}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748b',
    padding: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 18,
  },
  body: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
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
    marginBottom: 14,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
  },
  currencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  currencyPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  currencyPillSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  currencyPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  currencyPillTextSelected: {
    color: '#ffffff',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerBtn: {
    flex: 1,
  },
});
