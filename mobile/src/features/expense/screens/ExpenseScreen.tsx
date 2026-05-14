import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '../../../core/theme/colors';
import { AppHeader } from '../../../shared/components/AppHeader';
import { LoadingView } from '../../../components/common/LoadingView';
import { EmptyState } from '../../../components/common/EmptyState';
import { ApprovalModal } from '../../../components/common/ApprovalModal';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { getApiErrorMessage } from '../../../core/api/apiError';
import {
  canApproveRequest,
  canCreateOwnRequest,
  isGM,
  isTeamLead,
} from '../../../core/utils/permissions';
import { formatCurrency, formatDate } from '../../../core/utils/formatters';

import { useAuthContext } from '../../auth/context/AuthContext';
import { expenseService } from '../services/expenseService';
import type { Expense, RequestStatus } from '../types/expenseTypes';

type ExpenseViewMode = 'APPROVALS' | 'MINE';

const getStatusPriority = (status: RequestStatus) => {
  switch (status) {
    case 'PENDING':
      return 0;
    case 'APPROVED':
      return 1;
    case 'REJECTED':
      return 2;
    default:
      return 3;
  }
};

const sortExpenses = (items: Expense[]) => {
  return [...items].sort((first, second) => {
    const statusDiff =
      getStatusPriority(first.status) - getStatusPriority(second.status);

    if (statusDiff !== 0) {
      return statusDiff;
    }

    const firstDate = new Date(first.createdDate).getTime();
    const secondDate = new Date(second.createdDate).getTime();

    return secondDate - firstDate;
  });
};

export const ExpenseScreen = () => {
  const { user } = useAuthContext();

  const [viewMode, setViewMode] = useState<ExpenseViewMode>(
    user?.role === 'ROLE_TEAM_LEADER' ? 'APPROVALS' : 'MINE'
  );

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const isGeneralManager = isGM(user?.role);
  const isLead = isTeamLead(user?.role);

  const shouldLoadSubordinates =
    isGeneralManager || (isLead && viewMode === 'APPROVALS');

  const canCreateExpense =
    canCreateOwnRequest(user?.role) &&
    !isGeneralManager &&
    viewMode === 'MINE' &&
    user?.managerId != null;

  const loadExpenses = async () => {
    try {
      const response = shouldLoadSubordinates
        ? await expenseService.getSubordinates()
        : await expenseService.getMine();

      setExpenses(response.data || []);
    } catch (error) {
      Alert.alert(
        'Hata',
        getApiErrorMessage(error, 'Harcama talepleri alınamadı.')
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, viewMode]);

  const sortedExpenses = useMemo(() => {
    return sortExpenses(expenses);
  }, [expenses]);

  const pendingCount = useMemo(() => {
    return expenses.filter((expense) => expense.status === 'PENDING').length;
  }, [expenses]);

  const approvedCount = useMemo(() => {
    return expenses.filter((expense) => expense.status === 'APPROVED').length;
  }, [expenses]);

  const rejectedCount = useMemo(() => {
    return expenses.filter((expense) => expense.status === 'REJECTED').length;
  }, [expenses]);

  const selectedCanAct = selectedExpense
    ? canApproveRequest({
        role: user?.role,
        currentUserId: user?.id,
        employeeId: selectedExpense.employeeId,
        status: selectedExpense.status,
      })
    : false;

  const headerTitle = shouldLoadSubordinates
    ? 'Harcama Talepleri'
    : 'Harcama Taleplerim';

  const headerDescription = shouldLoadSubordinates
    ? `Toplam ${expenses.length} bağlı personel talebi`
    : `Toplam ${expenses.length} harcama talebiniz var`;

  const handleRefresh = () => {
    setRefreshing(true);
    loadExpenses();
  };

  const handleCreatePress = () => {
    if (!canCreateExpense) {
      Alert.alert(
        'Yetkisiz işlem',
        'Talep oluşturmak için uygun rol ve yönetici ataması gerekir.'
      );
      return;
    }

    setIsCreateModalOpen(true);
  };

  const handleStatusUpdate = async (
    expenseId: number,
    status: Exclude<RequestStatus, 'PENDING'>
  ) => {
    setActionLoading(true);

    try {
      const response = await expenseService.updateStatus(expenseId, status);

      if (!response.success) {
        Alert.alert('Hata', response.message || 'Harcama durumu güncellenemedi.');
        return;
      }

      setSelectedExpense(null);
      await loadExpenses();
    } catch (error) {
      Alert.alert(
        'Hata',
        getApiErrorMessage(error, 'Harcama durumu güncellenemedi.')
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <AppHeader />
        <LoadingView text="Harcamalar yükleniyor..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <AppHeader />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.headerSection}>
          <Text style={styles.title}>{headerTitle}</Text>
          <Text style={styles.subtitle}>{headerDescription}</Text>
        </View>

        {isLead && (
          <View style={styles.segment}>
            <Pressable
              onPress={() => setViewMode('APPROVALS')}
              style={[
                styles.segmentButton,
                viewMode === 'APPROVALS' && styles.segmentButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  viewMode === 'APPROVALS' && styles.segmentTextActive,
                ]}
              >
                Onay Talepleri
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setViewMode('MINE')}
              style={[
                styles.segmentButton,
                viewMode === 'MINE' && styles.segmentButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  viewMode === 'MINE' && styles.segmentTextActive,
                ]}
              >
                Benim Taleplerim
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.statsRow}>
          <StatCard
            title="Bekleyen"
            value={pendingCount}
            valueColor={colors.warning}
          />

          <StatCard
            title="Onaylanan"
            value={approvedCount}
            valueColor={colors.success}
          />

          <StatCard
            title="Reddedilen"
            value={rejectedCount}
            valueColor={colors.error}
          />
        </View>

        {!isGeneralManager && viewMode === 'MINE' && (
          <Pressable
            onPress={handleCreatePress}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
              !canCreateExpense && styles.disabledCreateButton,
            ]}
          >
            <Ionicons name="add" size={28} color={colors.onPrimary} />
            <Text style={styles.primaryButtonText}>Yeni Harcama Talebi</Text>
          </Pressable>
        )}

        {sortedExpenses.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="Harcama talebi bulunamadı"
            description={
              shouldLoadSubordinates
                ? 'Bağlı çalışanlarınıza ait harcama talebi bulunmuyor.'
                : 'Yeni harcama talebi oluşturarak süreci başlatabilirsiniz.'
            }
          />
        ) : (
          <View style={styles.listArea}>
            {sortedExpenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                showEmployee={shouldLoadSubordinates}
                onPress={() => setSelectedExpense(expense)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {!isGeneralManager && viewMode === 'MINE' && (
        <Pressable
          onPress={handleCreatePress}
          style={({ pressed }) => [
            styles.fab,
            pressed && styles.pressed,
            !canCreateExpense && styles.disabledFab,
          ]}
        >
          <MaterialCommunityIcons
            name="receipt-text-plus-outline"
            size={28}
            color={colors.onPrimary}
          />
        </Pressable>
      )}

      <CreateExpenseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={async () => {
          setIsCreateModalOpen(false);
          await loadExpenses();
        }}
      />

      <ApprovalModal
        visible={!!selectedExpense}
        type="EXPENSE"
        item={selectedExpense}
        canAct={selectedCanAct}
        loading={actionLoading}
        onClose={() => setSelectedExpense(null)}
        onApprove={() =>
          selectedExpense && handleStatusUpdate(selectedExpense.id, 'APPROVED')
        }
        onReject={() =>
          selectedExpense && handleStatusUpdate(selectedExpense.id, 'REJECTED')
        }
      />
    </SafeAreaView>
  );
};

const StatCard = ({
  title,
  value,
  valueColor,
}: {
  title: string;
  value: number;
  valueColor: string;
}) => {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
};

const ExpenseCard = ({
  expense,
  showEmployee,
  onPress,
}: {
  expense: Expense;
  showEmployee: boolean;
  onPress: () => void;
}) => {
  const isPending = expense.status === 'PENDING';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.expenseCard,
        isPending && styles.pendingExpenseCard,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.expenseIconBox, isPending && styles.pendingIconBox]}>
        <Ionicons
          name={isPending ? 'time-outline' : 'receipt-outline'}
          size={27}
          color={isPending ? colors.warning : colors.primary}
        />
      </View>

      <View style={styles.expenseContent}>
        <View style={styles.expenseTopRow}>
          <Text style={styles.expenseTitle} numberOfLines={1}>
            {expense.description || 'Harcama Talebi'}
          </Text>

          <Text style={styles.amountText}>{formatCurrency(expense.amount)}</Text>
        </View>

        <View style={styles.expenseBottomRow}>
          <View style={styles.expenseMetaArea}>
            <Text style={styles.dateText}>{formatDate(expense.createdDate)}</Text>

            {showEmployee && (
              <Text style={styles.employeeText} numberOfLines={1}>
                {expense.employeeFullName}
              </Text>
            )}
          </View>

          <StatusBadge status={expense.status} />
        </View>
      </View>
    </Pressable>
  );
};

const CreateExpenseModal = ({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setDescription('');
    setAmount('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    const parsedAmount = Number(amount.replace(',', '.'));

    if (!description.trim()) {
      Alert.alert('Eksik bilgi', 'Açıklama alanı zorunludur.');
      return;
    }

    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Hatalı tutar', 'Tutar 0’dan büyük olmalıdır.');
      return;
    }

    setLoading(true);

    try {
      const response = await expenseService.create({
        description: description.trim(),
        amount: parsedAmount,
      });

      if (!response.success) {
        Alert.alert('Hata', response.message || 'Harcama talebi oluşturulamadı.');
        return;
      }

      resetForm();
      onSuccess();
    } catch (error) {
      Alert.alert(
        'Hata',
        getApiErrorMessage(error, 'Harcama talebi oluşturulamadı.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Yeni Harcama Talebi</Text>

            <Pressable onPress={handleClose}>
              <Ionicons
                name="close"
                size={24}
                color={colors.onSurfaceVariant}
              />
            </Pressable>
          </View>

          <Text style={styles.inputLabel}>Açıklama</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Örn: Müşteri yemeği"
            placeholderTextColor={colors.outline}
            style={styles.modalInput}
          />

          <Text style={styles.inputLabel}>Tutar</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={colors.outline}
            keyboardType="decimal-pad"
            style={styles.modalInput}
          />

          <Pressable
            disabled={loading}
            onPress={handleCreate}
            style={[
              styles.modalPrimaryButton,
              loading && styles.disabledButton,
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.modalPrimaryButtonText}>Talebi Oluştur</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 120,
  },
  headerSection: {
    marginBottom: 20,
  },
  title: {
    color: colors.onSurface,
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 4,
    color: colors.onSurfaceVariant,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  segmentButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: colors.surfaceContainerLowest,
  },
  segmentText: {
    color: colors.onSurfaceVariant,
    fontWeight: '800',
  },
  segmentTextActive: {
    color: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  statCard: {
    flex: 1,
    minHeight: 94,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(195,198,215,0.32)',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  statTitle: {
    color: colors.onSecondaryContainer,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  statValue: {
    marginTop: 8,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '900',
  },
  primaryButton: {
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  disabledCreateButton: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '900',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  listArea: {
    gap: 14,
  },
  expenseCard: {
    minHeight: 112,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(195,198,215,0.32)',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  pendingExpenseCard: {
    borderColor: 'rgba(245,158,11,0.42)',
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
  },
  expenseIconBox: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: 'rgba(0,74,198,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingIconBox: {
    backgroundColor: 'rgba(245,158,11,0.14)',
  },
  expenseContent: {
    flex: 1,
    minWidth: 0,
  },
  expenseTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  expenseTitle: {
    flex: 1,
    color: colors.onSurface,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '900',
  },
  amountText: {
    color: colors.onSurface,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '900',
  },
  expenseBottomRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  expenseMetaArea: {
    flex: 1,
  },
  dateText: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  employeeText: {
    marginTop: 3,
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 100,
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  disabledFab: {
    opacity: 0.55,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(25,27,35,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalTitle: {
    color: colors.onSurface,
    fontSize: 22,
    fontWeight: '900',
  },
  inputLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  modalInput: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.onSurface,
  },
  modalPrimaryButton: {
    marginTop: 8,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.7,
  },
});