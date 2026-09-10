/**
 * Facturix Main Application Route
 * Renders the primary DashboardScreen with seamless InvoiceEditor modal orchestration.
 */

import React, { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { CreateInvoiceDTO, Invoice } from '@/domain/types';
import { useInvoiceManager } from '@/hooks/useInvoiceManager';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { InvoiceEditorScreen } from '@/screens/InvoiceEditorScreen';

export default function IndexRoute() {
  const { createInvoice, updateInvoice } = useInvoiceManager();
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | undefined>(undefined);

  const handleOpenCreate = () => {
    setEditingInvoice(undefined);
    setEditorVisible(true);
  };

  const handleOpenEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setEditorVisible(true);
  };

  const handleCloseEditor = () => {
    setEditorVisible(false);
    setEditingInvoice(undefined);
  };

  const handleSaveInvoice = async (dto: CreateInvoiceDTO): Promise<Invoice> => {
    if (editingInvoice) {
      return await updateInvoice({
        ...dto,
        id: editingInvoice.id,
      });
    } else {
      return await createInvoice(dto);
    }
  };

  return (
    <View style={styles.container}>
      <DashboardScreen
        onNavigateToCreate={handleOpenCreate}
        onNavigateToEdit={handleOpenEdit}
      />

      <Modal
        visible={editorVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseEditor}>
        <InvoiceEditorScreen
          existingInvoice={editingInvoice}
          onSave={handleSaveInvoice}
          onClose={handleCloseEditor}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});
