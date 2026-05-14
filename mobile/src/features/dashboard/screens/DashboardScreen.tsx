import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { colors } from '../../../core/theme/colors';
import { AppHeader } from '../../../shared/components/AppHeader';
import { LoadingView } from '../../../components/common/LoadingView';
import { EmptyState } from '../../../components/common/EmptyState';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { getApiErrorMessage } from '../../../core/api/apiError';
import { canManageRequests } from '../../../core/utils/permissions';
import { formatCurrency, formatDate } from '../../../core/utils/formatters';

import { useAuthContext } from '../../auth/context/AuthContext';
import { expenseService } from '../../expense/services/expenseService';
import type { Expense } from '../../expense/types/expenseTypes';
import { leaveService } from '../../leave/services/leaveService';
import type { Leave } from '../../leave/types/leaveTypes';
import type { MainTabParamList } from '../../../app/navigation/AppNavigator';

type DashboardNavigation = BottomTabNavigationProp<MainTabParamList>;

export const DashboardScreen = () => {
  const navigation = useNavigation<DashboardNavigation>();
  const { user } = useAuthContext();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const canSeeManagedRequests = canManageRequests(user?.role);

  const loadDashboard = async () => {
    try {
      const [expenseResponse, leaveResponse] = await Promise.all([
        canSeeManagedRequests
          ? expenseService.getSubordinates()
          : expenseService.getMine(),

        canSeeManagedRequests
          ? leaveService.getSubordinates()
          : leaveService.getMine(),
      ]);

      setExpenses(expenseResponse.data || []);
      setLeaves(leaveResponse.data || []);
    } catch (error) {
      Alert.alert(
        'Hata',
        getApiErrorMessage(error, 'Dashboard verileri alınamadı.')
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const approvedSpendTotal = useMemo(() => {
    return expenses
      .filter((expense) => expense.status === 'APPROVED')
      .reduce((sum, expense) => {
        return sum + Number(expense.amount || 0);
      }, 0);
  }, [expenses]);

  const pendingExpenseCount = useMemo(() => {
    return expenses.filter((expense) => expense.status === 'PENDING').length;
  }, [expenses]);

  const pendingLeaveCount = useMemo(() => {
    return leaves.filter((leave) => leave.status === 'PENDING').length;
  }, [leaves]);

  const approvedExpenseCount = useMemo(() => {
    return expenses.filter((expense) => expense.status === 'APPROVED').length;
  }, [expenses]);

  const recentExpenses = useMemo(() => {
    return [...expenses]
      .sort((first, second) => {
        const firstDate = new Date(first.createdDate).getTime();
        const secondDate = new Date(second.createdDate).getTime();

        return secondDate - firstDate;
      })
      .slice(0, 4);
  }, [expenses]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <AppHeader />
        <LoadingView text="Dashboard verileri yükleniyor..." />
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
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <Text style={styles.heroLabel}>
              {canSeeManagedRequests
                ? 'Onaylanan Harcama Tutarı'
                : 'Onaylanan Harcamam'}
            </Text>

            <Text style={styles.heroValue}>
              {formatCurrency(approvedSpendTotal)}
            </Text>

            <Text style={styles.heroDescription}>
              {canSeeManagedRequests
                ? 'Yetkiniz dahilindeki onaylanmış harcama taleplerinin toplamı'
                : 'Size ait onaylanmış harcama taleplerinin toplamı'}
            </Text>
          </View>

          <MaterialCommunityIcons
            name="chart-line"
            size={112}
            color="rgba(255,255,255,0.14)"
            style={styles.heroIcon}
          />
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard
            icon="receipt-clock-outline"
            iconBg="#FEF3C7"
            iconColor="#B45309"
            title="Bekleyen Harcama"
            value={pendingExpenseCount}
            suffix="talep"
          />

          <MetricCard
            icon="calendar-clock"
            iconBg={colors.primaryFixed}
            iconColor={colors.primary}
            title="Bekleyen İzin"
            value={pendingLeaveCount}
            suffix="talep"
          />

          <MetricCard
            icon="check-circle-outline"
            iconBg="#D1FAE5"
            iconColor="#047857"
            title="Onaylanan Harcama"
            value={approvedExpenseCount}
            suffix="talep"
          />
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleArea}>
            <Text style={styles.sectionTitle}>Son Harcamalar</Text>

            <Text style={styles.sectionSubtitle}>
              {canSeeManagedRequests
                ? 'Yetkiniz dahilindeki son harcama talepleri'
                : 'Size ait son harcama talepleri'}
            </Text>
          </View>

          <Pressable
            onPress={() => navigation.navigate('Expenses')}
            hitSlop={8}
          >
            <Text style={styles.viewAllText}>Tümünü Gör</Text>
          </Pressable>
        </View>

        <View style={styles.recentList}>
          {recentExpenses.length === 0 ? (
            <EmptyState
              icon="receipt-outline"
              title="Harcama kaydı bulunamadı"
              description={
                canSeeManagedRequests
                  ? 'Yetkiniz dahilindeki harcama talebi bulunmuyor.'
                  : 'Yeni harcama talebi oluşturarak süreci başlatabilirsiniz.'
              }
            />
          ) : (
            recentExpenses.map((expense) => (
              <RecentExpenseItem
                key={expense.id}
                expense={expense}
                showEmployee={canSeeManagedRequests}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const MetricCard = ({
  icon,
  iconBg,
  iconColor,
  title,
  value,
  suffix,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  value: number;
  suffix: string;
}) => {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIconBox, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
      </View>

      <Text style={styles.metricTitle} numberOfLines={2}>
        {title}
      </Text>

      <View style={styles.metricValueRow}>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricSuffix}>{suffix}</Text>
      </View>
    </View>
  );
};

const RecentExpenseItem = ({
  expense,
  showEmployee,
}: {
  expense: Expense;
  showEmployee: boolean;
}) => {
  return (
    <View style={styles.expenseItem}>
      <View style={styles.expenseIconBox}>
        <Ionicons name="receipt-outline" size={23} color={colors.primary} />
      </View>

      <View style={styles.expenseItemContent}>
        <View style={styles.expenseTopRow}>
          <Text style={styles.expenseTitle} numberOfLines={1}>
            {expense.description || 'Harcama Talebi'}
          </Text>

          <Text style={styles.expenseAmount}>
            {formatCurrency(expense.amount)}
          </Text>
        </View>

        <View style={styles.expenseBottomRow}>
          <View style={styles.expenseMetaArea}>
            <Text style={styles.expenseDate}>
              {formatDate(expense.createdDate)}
            </Text>

            {showEmployee && (
              <Text style={styles.employeeText} numberOfLines={1}>
                {expense.employeeFullName}
              </Text>
            )}
          </View>

          <StatusBadge status={expense.status} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 120,
  },
  heroCard: {
    minHeight: 148,
    borderRadius: 20,
    backgroundColor: colors.primaryContainer,
    padding: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  heroContent: {
    zIndex: 2,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.90)',
    fontSize: 15,
    fontWeight: '800',
  },
  heroValue: {
    marginTop: 8,
    color: colors.onPrimary,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '900',
  },
  heroDescription: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  heroIcon: {
    position: 'absolute',
    right: -20,
    bottom: -28,
    transform: [{ rotate: '8deg' }],
  },
  metricsGrid: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minHeight: 132,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(195,198,215,0.35)',
    padding: 14,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  metricIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricTitle: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    minHeight: 32,
  },
  metricValueRow: {
    marginTop: 8,
  },
  metricValue: {
    color: colors.onSurface,
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '900',
  },
  metricSuffix: {
    marginTop: 1,
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: 30,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitleArea: {
    flex: 1,
  },
  sectionTitle: {
    color: colors.onSurface,
    fontSize: 17,
    fontWeight: '900',
  },
  sectionSubtitle: {
    marginTop: 3,
    color: colors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  viewAllText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  recentList: {
    gap: 14,
  },
  expenseItem: {
    minHeight: 102,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(195,198,215,0.24)',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  expenseIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseItemContent: {
    flex: 1,
    minWidth: 0,
  },
  expenseTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  expenseTitle: {
    flex: 1,
    color: colors.onSurface,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
  },
  expenseAmount: {
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
  expenseDate: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '600',
  },
  employeeText: {
    marginTop: 3,
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
});