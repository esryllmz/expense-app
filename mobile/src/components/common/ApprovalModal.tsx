import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../core/theme/colors';
import {
  calculateLeaveDays,
  formatCurrency,
  formatDate,
  formatDateRange,
  getStatusLabel,
} from '../../core/utils/formatters';
import type { Expense } from '../../features/expenses/types/expenseTypes';
import type { Leave } from '../../features/leaves/types/leaveTypes';

type ApprovalType = 'EXPENSE' | 'LEAVE';
type ApprovalItem = Expense | Leave;

interface ApprovalModalProps {
  visible: boolean;
  type: ApprovalType;
  item: ApprovalItem | null;
  canAct: boolean;
  loading: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

const isExpense = (item: ApprovalItem): item is Expense => {
  return 'amount' in item;
};

export const ApprovalModal = ({
  visible,
  type,
  item,
  canAct,
  loading,
  onClose,
  onApprove,
  onReject,
}: ApprovalModalProps) => {
  if (!item) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {type === 'EXPENSE' ? 'Harcama Detayı' : 'İzin Detayı'}
            </Text>

            <Pressable onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={24} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <DetailRow label="Talep Sahibi" value={item.employeeFullName || '-'} />
          <DetailRow label="Açıklama" value={item.description || '-'} />

          {isExpense(item) ? (
            <>
              <DetailRow label="Tutar" value={formatCurrency(item.amount)} />
              <DetailRow label="Tarih" value={formatDate(item.createdDate)} />
            </>
          ) : (
            <>
              <DetailRow
                label="Tarih"
                value={formatDateRange(item.startDate, item.endDate)}
              />
              <DetailRow
                label="Süre"
                value={`${calculateLeaveDays(item.startDate, item.endDate)} Gün`}
              />
            </>
          )}

          <DetailRow label="Durum" value={getStatusLabel(item.status)} />

          {canAct && (
            <View style={styles.actionRow}>
              <Pressable
                disabled={loading}
                onPress={onReject}
                style={[styles.rejectButton, loading && styles.disabledButton]}
              >
                <Text style={styles.rejectText}>Reddet</Text>
              </Pressable>

              <Pressable
                disabled={loading}
                onPress={onApprove}
                style={[styles.approveButton, loading && styles.disabledButton]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.approveText}>Onayla</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(25,27,35,0.35)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    color: colors.onSurface,
    fontSize: 22,
    fontWeight: '900',
  },
  detailRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195,198,215,0.35)',
  },
  detailLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  detailValue: {
    marginTop: 4,
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: '700',
  },
  actionRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectText: {
    color: colors.onErrorContainer,
    fontWeight: '900',
  },
  approveButton: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveText: {
    color: colors.onPrimary,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.7,
  },
});
