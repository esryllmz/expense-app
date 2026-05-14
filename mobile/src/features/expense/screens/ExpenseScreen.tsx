import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../core/theme/colors';
import { AppHeader } from '../../../shared/components/AppHeader';
import { useAuthContext } from '../../auth/context/AuthContext';
import { expenseService } from '../services/expenseService';
import type { Expense, RequestStatus } from '../types/expenseTypes';
import {
  formatCurrency,
  formatDate,
  getStatusLabel,
} from '../../../core/utils/formatters';

export const ExpenseScreen = () => {
  const { user } = useAuthContext();

  const isManager =
    user?.role === 'ROLE_GM' || user?.role === 'ROLE_TEAM_LEADER';

  const canCreateExpense =
    user?.role === 'ROLE_EMPLOYEE' && user?.managerId != null;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadExpenses = async () => {
    try {
      const response = isManager
        ? await expenseService.getSubordinateExpenses()
        : await expenseService.getMyExpenses();

      setExpenses(response.data || []);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'Harcama talepleri alınamadı. Backend bağlantısını kontrol edin.';

      Alert.alert('Hata', message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const pendingAmount = useMemo(() => {
    return expenses
      .filter((expense) => expense.status === 'PENDING')
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  }, [expenses]);

  const approvedAmount = useMemo(() => {
    return expenses
      .filter((expense) => expense.status === 'APPROVED')
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  }, [expenses]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadExpenses();
  };

  const handleCreatePress = () => {
    if (isManager) {
      Alert.alert(
        'Yetkisiz işlem',
        'Yöneticiler bu ekrandan kendi adına harcama talebi oluşturamaz.'
      );
      return;
    }

    if (!canCreateExpense) {
      Alert.alert(
        'Yönetici ataması gerekli',
        'Harcama talebi oluşturabilmek için önce bir yöneticiniz atanmalıdır.'
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

      if (response.success) {
        setSelectedExpense(null);
        await loadExpenses();
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'Harcama durumu güncellenemedi.';

      Alert.alert('Hata', message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <AppHeader showSearch />

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
          <Text style={styles.title}>
            {isManager ? 'Harcama Talepleri' : 'Harcama Taleplerim'}
          </Text>

          <Text style={styles.subtitle}>
            {isManager
              ? `Toplam ${expenses.length} bağlı personel talebi`
              : `Bu ay toplam ${expenses.length} talep`}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="Onay Bekleyen"
            value={formatCurrency(pendingAmount)}
            valueColor={colors.primary}
          />

          <StatCard
            title="Onaylanan"
            value={formatCurrency(approvedAmount)}
            valueColor={colors.tertiary}
          />
        </View>

        {!isManager && (
          <Pressable
            onPress={handleCreatePress}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
              !canCreateExpense && styles.disabledCreateButton,
            ]}
          >
            <Ionicons name="add" size={30} color={colors.onPrimary} />
            <Text style={styles.primaryButtonText}>Yeni Harcama</Text>
          </Pressable>
        )}

        {loading ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Harcamalar yükleniyor...</Text>
          </View>
        ) : expenses.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="receipt-text-outline"
              size={36}
              color={colors.primary}
            />
            <Text style={styles.emptyTitle}>Harcama talebi bulunamadı</Text>
            <Text style={styles.emptyText}>
              {isManager
                ? 'Bağlı çalışanlarınıza ait harcama talebi bulunmuyor.'
                : 'Yeni harcama talebi oluşturarak süreci başlatabilirsiniz.'}
            </Text>
          </View>
        ) : (
          <View style={styles.listArea}>
            {expenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                isManager={isManager}
                onPress={() => setSelectedExpense(expense)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {!isManager && (
        <Pressable
          onPress={handleCreatePress}
          style={({ pressed }) => [
            styles.fab,
            pressed && styles.pressed,
            !canCreateExpense && styles.disabledFab,
          ]}
        >
          <MaterialCommunityIcons
            name="receipt-text-outline"
            size={30}
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

      <ExpenseDetailModal
        expense={selectedExpense}
        isManager={isManager}
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
  value: string;
  valueColor: string;
}) => {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color: valueColor }]}>
        {value}
      </Text>
    </View>
  );
};

const ExpenseCard = ({
  expense,
  isManager,
  onPress,
}: {
  expense: Expense;
  isManager: boolean;
  onPress: () => void;
}) => {
  const config = getExpenseVisualConfig(expense);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.expenseCard,
        pressed && styles.cardPressed,
        expense.status === 'REJECTED' && styles.rejectedCard,
      ]}
    >
      <View style={[styles.expenseIconBox, { backgroundColor: config.iconBg }]}>
        <Ionicons
          name={config.icon}
          size={30}
          color={config.iconColor}
        />
      </View>

      <View style={styles.expenseContent}>
        <View style={styles.expenseTopRow}>
          <Text style={styles.expenseTitle} numberOfLines={1}>
            {expense.description || 'Harcama Talebi'}
          </Text>

          <Text style={styles.amountText}>
            {formatCurrency(expense.amount)}
          </Text>
        </View>

        <View style={styles.expenseBottomRow}>
          <View style={styles.expenseMetaArea}>
            <Text style={styles.dateText}>
              {formatDate(expense.createdDate)}
            </Text>

            {isManager && (
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

const StatusBadge = ({ status }: { status: RequestStatus }) => {
  const config = getStatusConfig(status);

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
      <Text style={[styles.statusText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
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
      const response = await expenseService.createExpense({
        description: description.trim(),
        amount: parsedAmount,
      });

      if (response.success) {
        setDescription('');
        setAmount('');
        onSuccess();
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'Harcama talebi oluşturulamadı.';

      Alert.alert('Hata', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Yeni Harcama</Text>

            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.onSurfaceVariant} />
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
            style={[styles.modalPrimaryButton, loading && styles.disabledButton]}
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

const ExpenseDetailModal = ({
  expense,
  isManager,
  loading,
  onClose,
  onApprove,
  onReject,
}: {
  expense: Expense | null;
  isManager: boolean;
  loading: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) => {
  if (!expense) return null;

  const canAct = isManager && expense.status === 'PENDING';

  return (
    <Modal visible={!!expense} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Harcama Detayı</Text>

            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <DetailRow label="Talep Sahibi" value={expense.employeeFullName || '-'} />
          <DetailRow label="Açıklama" value={expense.description || '-'} />
          <DetailRow label="Tutar" value={formatCurrency(expense.amount)} />
          <DetailRow label="Tarih" value={formatDate(expense.createdDate)} />
          <DetailRow label="Durum" value={getStatusLabel(expense.status)} />

          {canAct && (
            <View style={styles.actionRow}>
              <Pressable
                disabled={loading}
                onPress={onReject}
                style={[styles.rejectButton, loading && styles.disabledButton]}
              >
                <Text style={styles.rejectButtonText}>Reddet</Text>
              </Pressable>

              <Pressable
                disabled={loading}
                onPress={onApprove}
                style={[styles.approveButton, loading && styles.disabledButton]}
              >
                <Text style={styles.approveButtonText}>Onayla</Text>
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

const getStatusConfig = (status: RequestStatus) => {
  switch (status) {
    case 'APPROVED':
      return {
        label: 'ONAYLANDI',
        bg: '#D1FAE5',
        color: '#047857',
      };
    case 'REJECTED':
      return {
        label: 'REDDEDİLDİ',
        bg: colors.errorContainer,
        color: colors.onErrorContainer,
      };
    case 'PENDING':
    default:
      return {
        label: 'BEKLEMEDE',
        bg: colors.surfaceContainerHigh,
        color: colors.onSurfaceVariant,
      };
  }
};

const getExpenseVisualConfig = (expense: Expense) => {
  const text = expense.description.toLocaleLowerCase('tr-TR');

  if (text.includes('yemek') || text.includes('restoran')) {
    return {
      icon: 'restaurant-outline' as const,
      iconBg: 'rgba(148,55,0,0.10)',
      iconColor: colors.tertiary,
    };
  }

  if (text.includes('taksi') || text.includes('yol') || text.includes('ulaşım')) {
    return {
      icon: 'car-outline' as const,
      iconBg: 'rgba(88,99,119,0.12)',
      iconColor: colors.secondary,
    };
  }

  if (text.includes('internet') || text.includes('fatura')) {
    return {
      icon: 'wifi-outline' as const,
      iconBg: 'rgba(148,55,0,0.10)',
      iconColor: colors.tertiary,
    };
  }

  if (text.includes('konaklama') || text.includes('uçak') || text.includes('seyahat')) {
    return {
      icon: 'airplane-outline' as const,
      iconBg: 'rgba(0,74,198,0.10)',
      iconColor: colors.primary,
    };
  }

  if (text.includes('ofis') || text.includes('malzeme')) {
    return {
      icon: 'receipt-outline' as const,
      iconBg: 'rgba(186,26,26,0.10)',
      iconColor: colors.error,
    };
  }

  return {
    icon: 'receipt-outline' as const,
    iconBg: 'rgba(0,74,198,0.10)',
    iconColor: colors.primary,
  };
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background ?? colors.surface,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 42,
    paddingBottom: 120,
  },
  headerSection: {
    marginBottom: 34,
  },
  title: {
    color: colors.onSurface,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 6,
    color: colors.onSurfaceVariant,
    fontSize: 18,
    lineHeight: 26,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 28,
    marginBottom: 42,
  },
  statCard: {
    flex: 1,
    minHeight: 142,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLowest,
    padding: 26,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(195,198,215,0.32)',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  statTitle: {
    color: colors.onSecondaryContainer,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 31,
    lineHeight: 38,
    fontWeight: '900',
  },
  primaryButton: {
    height: 84,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 18,
    marginBottom: 68,
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 6,
  },
  disabledCreateButton: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  loadingArea: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.onSurfaceVariant,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 215, 0.3)',
  },
  emptyTitle: {
    color: colors.onSurface,
    fontSize: 18,
    fontWeight: '900',
  },
  emptyText: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 21,
  },
  listArea: {
    gap: 28,
  },
  expenseCard: {
    minHeight: 134,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(195,198,215,0.32)',
    padding: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 26,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  rejectedCard: {
    opacity: 0.9,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
  },
  expenseIconBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseContent: {
    flex: 1,
    minWidth: 0,
  },
  expenseTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  expenseTitle: {
    flex: 1,
    color: colors.onSurface,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  amountText: {
    color: colors.onSurface,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
  },
  expenseBottomRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  expenseMetaArea: {
    flex: 1,
  },
  dateText: {
    color: colors.onSurfaceVariant,
    fontSize: 17,
    lineHeight: 23,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  employeeText: {
    marginTop: 3,
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  fab: {
    position: 'absolute',
    right: 28,
    bottom: 104,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
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
  rejectButtonText: {
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
  approveButtonText: {
    color: colors.onPrimary,
    fontWeight: '900',
  },
});