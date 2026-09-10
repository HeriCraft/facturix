/**
 * Facturix Atomic MetricBox Component
 * KPI summary widget for dashboard financial metrics.
 */

import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

export type MetricAccent = 'blue' | 'amber' | 'mint' | 'slate';

export interface MetricBoxProps {
  label: string;
  formattedAmount: string;
  subtext?: string;
  accent?: MetricAccent;
  style?: ViewStyle;
}

export const MetricBox: React.FC<MetricBoxProps> = ({
  label,
  formattedAmount,
  subtext,
  accent = 'blue',
  style,
}) => {
  return (
    <View style={[styles.container, ACCENT_STYLES[accent], style]}>
      <View style={styles.header}>
        <View style={[styles.accentDot, DOT_STYLES[accent]]} />
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
        {formattedAmount}
      </Text>
      {subtext ? (
        <Text style={styles.subtext} numberOfLines={1}>
          {subtext}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flex: 1,
    minWidth: 140,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  accentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.05,
    color: '#64748b',
    flex: 1,
  },
  amount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.02,
    fontVariant: ['tabular-nums'],
    marginBottom: 4,
  },
  subtext: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },

  // Accents
  accent_blue: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  dot_blue: {
    backgroundColor: '#2563eb',
  },

  accent_amber: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  dot_amber: {
    backgroundColor: '#f59e0b',
  },

  accent_mint: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  dot_mint: {
    backgroundColor: '#10b981',
  },

  accent_slate: {
    borderLeftWidth: 4,
    borderLeftColor: '#64748b',
  },
  dot_slate: {
    backgroundColor: '#64748b',
  },
});

const ACCENT_STYLES: Record<MetricAccent, ViewStyle> = {
  blue: styles.accent_blue,
  amber: styles.accent_amber,
  mint: styles.accent_mint,
  slate: styles.accent_slate,
};

const DOT_STYLES: Record<MetricAccent, ViewStyle> = {
  blue: styles.dot_blue,
  amber: styles.dot_amber,
  mint: styles.dot_mint,
  slate: styles.dot_slate,
};

