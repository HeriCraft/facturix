/**
 * Facturix Dashboard Screen
 * Financial metric summary bar, filter segmented control, scrollable invoice list,
 * status toggling, PDF sharing, and FAB for document creation.
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Invoice, InvoiceFilter } from '../domain/types';
import { formatCurrency } from '../domain/formatters';
import { useInvoiceManager } from '../hooks/useInvoiceManager';
import { useCompanyProfile } from '../hooks/useCompanyProfile';
import { shareService } from '../services/shareService';
import { MetricBox } from '../components/MetricBox';
import { SegmentedControl, SegmentOption } from '../components/SegmentedControl';
import { InvoiceCard } from '../components/InvoiceCard';
import { Button } from '../components/Button';
import { CompanyProfileModal } from '../components/CompanyProfileModal';

export interface DashboardScreenProps {
  onNavigateToCreate?: () => void;
  onNavigateToEdit?: (invoice: Invoice) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToCreate,
  onNavigateToEdit,
}) => {
  const {
    filteredInvoices,
    filter,
    metrics,
    isLoading,
    setFilter,
    toggleInvoiceStatus,
    deleteInvoice,
    refresh,
  } = useInvoiceManager();

  const { profile, updateProfile } = useCompanyProfile();
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [isSharingId, setIsSharingId] = useState<string | null>(null);

  const filterOptions: readonly SegmentOption<InvoiceFilter>[] = [
    { key: 'ALL', label: 'All', count: metrics.invoiceCount + metrics.quoteCount },
    { key: 'PAID', label: 'Paid' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'QUOTE', label: 'Quotes', count: metrics.quoteCount },
  ];

  const handleToggleStatus = async (invoice: Invoice) => {
    try {
      await toggleInvoiceStatus(invoice.id);
    } catch (err) {
      Alert.alert('Error', (err as Error).message || 'Failed to toggle status.');
    }
  };

  const handleDelete = (invoice: Invoice) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete ${invoice.documentNumber}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInvoice(invoice.id);
            } catch (err) {
              Alert.alert('Error', (err as Error).message || 'Failed to delete.');
            }
          },
        },
      ]
    );
  };

  const handleShare = async (invoice: Invoice) => {
    try {
      setIsSharingId(invoice.id);
      const result = await shareService.sharePdf(invoice, profile);
      if (!result.shared && Platform.OS === 'web') {
        Alert.alert('PDF Generated', `Document prepared at: ${result.uri}`);
      }
    } catch (err) {
      Alert.alert('Sharing Error', (err as Error).message || 'Failed to share document.');
    } finally {
      setIsSharingId(null);
    }
  };

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Top Brand Bar */}
      <View style={styles.topBrandBar}>
        <View style={styles.brandTitleRow}>
          <Image
            source={require('../../assets/images/facturix-logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
            accessible={true}
            accessibilityLabel="Facturix Logo"
          />
          <View>
            <Text style={styles.appName}>FACTURIX</Text>
            <View style={styles.offlineBadgeContainer}>
              <View style={styles.offlineDot} />
              <Text style={styles.offlineText}>100% Offline & Private</Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => setProfileModalVisible(true)}
          style={({ pressed }) => [
            styles.profileButton,
            pressed && styles.profileButtonPressed,
          ]}>
          <Text style={styles.profileButtonLabel}>Settings</Text>
        </Pressable>
      </View>

      {/* Financial Metrics Summary Bar */}
      <View style={styles.metricsContainer}>
        <MetricBox
          label="Total Billed"
          formattedAmount={formatCurrency(metrics.totalBilled, profile.currency)}
          subtext={`${metrics.invoiceCount} invoices`}
          accent="blue"
          style={styles.metricItem}
        />
        <MetricBox
          label="Pending Collection"
          formattedAmount={formatCurrency(metrics.totalPending, profile.currency)}
          accent="amber"
          style={styles.metricItem}
        />
        <MetricBox
          label="Collected / Paid"
          formattedAmount={formatCurrency(metrics.totalPaid, profile.currency)}
          accent="mint"
          style={styles.metricItem}
        />
      </View>

      {/* Filter Segmented Control */}
      <View style={styles.filterContainer}>
        <SegmentedControl<InvoiceFilter>
          options={filterOptions}
          selectedKey={filter}
          onSelect={setFilter}
        />
      </View>

      <Text style={styles.sectionHeading}>Recent Documents</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No documents found</Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'ALL'
          ? 'Start generating invoices and quotes with zero cloud storage and full privacy.'
          : `No documents matching "${filter}".`}
      </Text>
      {onNavigateToCreate ? (
        <Button
          title="+ Create First Document"
          onPress={onNavigateToCreate}
          variant="primary"
          size="md"
          style={styles.emptyButton}
        />
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading Facturix...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredInvoices}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onRefresh={refresh}
          refreshing={isLoading}
          renderItem={({ item }) => (
            <InvoiceCard
              invoice={item}
              currency={profile.currency}
              onPress={() => onNavigateToEdit?.(item)}
              onToggleStatus={() => handleToggleStatus(item)}
              onShare={() => handleShare(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
        />
      )}

      {/* Accessible Floating Action Button */}
      {onNavigateToCreate ? (
        <View style={styles.fabContainer}>
          <Pressable
            onPress={onNavigateToCreate}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Create New Document"
            style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
            <Text style={styles.fabIcon}>+</Text>
            <Text style={styles.fabText}>New Document</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Settings Modal */}
      <CompanyProfileModal
        visible={profileModalVisible}
        initialProfile={profile}
        onSave={updateProfile}
        onClose={() => setProfileModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  listHeader: {
    paddingTop: 12,
    marginBottom: 8,
  },
  topBrandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogo: {
    width: 38,
    height: 38,
    borderRadius: 9,
    marginRight: 10,
  },
  appName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.03,
  },
  offlineBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  offlineText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
  profileButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  profileButtonPressed: {
    backgroundColor: '#f1f5f9',
  },
  profileButtonLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
  },
  filterContainer: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#64748b',
    letterSpacing: 0.05,
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyButton: {
    minWidth: 180,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 9999,
  },
  fabPressed: {
    backgroundColor: '#1d4ed8',
    transform: [{ scale: 0.98 }],
  },
  fabIcon: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginRight: 8,
    lineHeight: 20,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.01,
  },
});
