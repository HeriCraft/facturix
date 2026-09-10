/**
 * Facturix Standalone Document Editor Route
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useInvoiceManager } from '@/hooks/useInvoiceManager';
import { InvoiceEditorScreen } from '@/screens/InvoiceEditorScreen';
import { CreateInvoiceDTO } from '@/domain/types';

export default function EditorRoute() {
  const router = useRouter();
  const { createInvoice } = useInvoiceManager();

  const handleSave = async (dto: CreateInvoiceDTO) => {
    const saved = await createInvoice(dto);
    router.back();
    return saved;
  };

  return (
    <View style={styles.container}>
      <InvoiceEditorScreen
        onSave={handleSave}
        onClose={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
