/**
 * Facturix InvoiceCard Component
 * Elevated list item displaying document metadata, client summary,
 * instant status pill toggle, and quick share action.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Invoice } from '../domain/types';
import { formatCurrency, formatDate } from '../domain/formatters';
import { Badge } from './Badge';
import { Card } from './Card';

export interface InvoiceCardProps {
  invoice: Invoice;
  currency?: string;
  onPress?: () => void;
  onToggleStatus?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({
  invoice,
  currency = 'EUR',
  onPress,
  onToggleStatus,
  onShare,
  onDelete,
}) => {
  const isInvoice = invoice.type === 'INVOICE';

  return (
    <Card style={styles.card}>
      <Pressable
        onPress={onPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`View document ${invoice.documentNumber} for ${invoice.client.name}`}
        style={({ pressed }) => [pressed && styles.pressed]}>
        {/* Top Header: Doc Number, Type Badge, and Status */}
        <View style={styles.topRow}>
          <View style={styles.identifierGroup}>
            <Text style={styles.docNumber}>{invoice.documentNumber}</Text>
            <Badge
              label={invoice.type}
              variant={isInvoice ? 'invoice' : 'quote'}
              size="sm"
              style={styles.typeBadge}
            />
          </View>

          {isInvoice ? (
            <Pressable
              onPress={onToggleStatus}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Status is ${invoice.status}. Tap to toggle.`}>
              <Badge
                label={invoice.status}
                variant={invoice.status === 'PAID' ? 'paid' : 'pending'}
                size="sm"
              />
            </Pressable>
          ) : null}
        </View>

        {/* Client & Date Info */}
        <View style={styles.middleRow}>
          <View style={styles.clientContainer}>
            <Text style={styles.clientLabel}>Client</Text>
            <Text style={styles.clientName} numberOfLines={1}>
              {invoice.client.name}
            </Text>
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Total</Text>
            <Text style={styles.amountValue}>
              {formatCurrency(invoice.grandTotal, currency)}
            </Text>
          </View>
        </View>

        {/* Dates Bar */}
        <View style={styles.bottomRow}>
          <Text style={styles.dateText}>
            Issued: <Text style={styles.dateHighlight}>{formatDate(invoice.issueDate, 'short')}</Text>
          </Text>
          <Text style={styles.dateDivider}>•</Text>
          <Text style={styles.dateText}>
            Due: <Text style={styles.dateHighlight}>{formatDate(invoice.dueDate, 'short')}</Text>
          </Text>
          <Text style={styles.itemCountText}>
            ({invoice.items.length} {invoice.items.length === 1 ? 'item' : 'items'})
          </Text>
        </View>
      </Pressable>

      {/* Quick Actions Bar */}
      <View style={styles.actionsBar}>
        {onToggleStatus && isInvoice ? (
          <Pressable
            onPress={onToggleStatus}
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}>
            <Text style={styles.actionButtonText}>
              Mark as {invoice.status === 'PAID' ? 'Pending' : 'Paid'}
            </Text>
          </Pressable>
        ) : null}

        {onShare ? (
          <Pressable
            onPress={onShare}
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}>
            <Text style={[styles.actionButtonText, styles.actionShareText]}>Share PDF</Text>
          </Pressable>
        ) : null}

        {onDelete ? (
          <Pressable
            onPress={onDelete}
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}>
            <Text style={[styles.actionButtonText, styles.actionDeleteText]}>Delete</Text>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    padding: 16,
  },
  pressed: {
    opacity: 0.85,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  identifierGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: 'monospace',
    marginRight: 8,
  },
  typeBadge: {
    marginRight: 6,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  clientContainer: {
    flex: 1,
    marginRight: 12,
  },
  clientLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#94a3b8',
    letterSpacing: 0.04,
    marginBottom: 2,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#94a3b8',
    letterSpacing: 0.04,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    fontVariant: ['tabular-nums'],
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
  },
  dateHighlight: {
    fontWeight: '600',
    color: '#334155',
  },
  dateDivider: {
    marginHorizontal: 6,
    color: '#cbd5e1',
  },
  itemCountText: {
    marginLeft: 'auto',
    fontSize: 11,
    color: '#94a3b8',
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 6,
  },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionButtonPressed: {
    backgroundColor: '#e2e8f0',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  actionShareText: {
    color: '#2563eb',
  },
  actionDeleteText: {
    color: '#ef4444',
  },
});
