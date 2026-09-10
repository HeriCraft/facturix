/**
 * Facturix Atomic Status Badge Component
 * High-contrast, unambiguous indicators for financial status and document types.
 */

import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

export type BadgeVariant = 'paid' | 'pending' | 'invoice' | 'quote' | 'neutral';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  style,
}) => {
  return (
    <View
      style={[
        styles.base,
        styles[variant],
        size === 'sm' ? styles.size_sm : styles.size_md,
        style,
      ]}>
      <Text
        style={[
          styles.text,
          styles[`text_${variant}` as keyof typeof styles],
          size === 'sm' ? styles.textSize_sm : styles.textSize_md,
        ]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  size_sm: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  size_md: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  text: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.04,
  },
  textSize_sm: {
    fontSize: 10,
    lineHeight: 13,
  },
  textSize_md: {
    fontSize: 11,
    lineHeight: 15,
  },

  // Variants
  paid: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  text_paid: {
    color: '#047857',
  },

  pending: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
  },
  text_pending: {
    color: '#b45309',
  },

  invoice: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  text_invoice: {
    color: '#1d4ed8',
  },

  quote: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  text_quote: {
    color: '#475569',
  },

  neutral: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  text_neutral: {
    color: '#64748b',
  },
});
