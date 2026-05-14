import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { colors } from '../../../core/theme/colors';
import { AppHeader } from '../../../shared/components/AppHeader';
import { apiClient } from '../../../core/api/apiClient';
import type { ApiResponse } from '../../../core/types/ApiResponse';
import { useAuthContext } from '../../auth/context/AuthContext';
import {
  formatCurrency,
  formatDate,
  getStatusLabel,
} from '../../../core/utils/formatters';
import type { MainTabParamList } from '../../../app/navigation/AppNavigator';

type DashboardNavigation = BottomTabNavigationProp<MainTabParamList>;

type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface Expense {
  id: number;
  description: string;
  amount: number;
  status: RequestStatus;
  employeeFullName: string;
  employeeId: number;
  createdDate: string;
}

interface Leave {
  id: number;
  description: string;
  startDate: string;
  endDate: string;
  status: RequestStatus;
  employeeFullName: string;
  employeeId: number;
}

export const DashboardScreen = () => {
  const navigation = useNavigation<DashboardNavigation>();
  const { user, signOut } = useAuthContext();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isManager =
    user?.role === 'ROLE_GM' || user?.role === 'ROLE_TEAM_LEADER';

  const loadDashboard = async () => {
    try {
      const expenseEndpoint = isManager ? '/expenses/subordinates' : '/expenses/me';
      const leaveEndpoint = isManager ? '/leaves/subordinates' : '/leaves/me';

      const [expenseResponse, leaveResponse] = await Promise.all([
        apiClient.get<ApiResponse<Expense[]>>(expenseEndpoint),
        apiClient.get<ApiResponse<Leave[]>>(leaveEndpoint),
      ]);

      setExpenses(expenseResponse.data.data || []);
      setLeaves(leaveResponse.data.data || []);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'Dashboard verileri alınamadı. Backend bağlantısını kontrol edin.';

      Alert.alert('Hata', message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const totalSpend = useMemo(() => {
    return expenses.reduce((sum, expense) => {
      return sum + Number(expense.amount || 0);
    }, 0);
  }, [expenses]);

  const approvedSpend = useMemo(() => {
    return expenses
      .filter((expense) => expense.status === 'APPROVED')
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  }, [expenses]);

  const pendingApprovalCount = useMemo(() => {
    const pendingExpenses = expenses.filter((expense) => expense.status === 'PENDING');
    const pendingLeaves = leaves.filter((leave) => leave.status === 'PENDING');

    return pendingExpenses.length + pendingLeaves.length;
  }, [expenses, leaves]);

  const recentExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => {
        const first = new Date(a.createdDate).getTime();
        const second = new Date(b.createdDate).getTime();

        return second - first;
      })
      .slice(0, 3);
  }, [expenses]);

  const chartData = useMemo(() => {
    return buildWeekdayChartData(expenses);
  }, [expenses]);

  const spendChangeLabel = useMemo(() => {
    if (approvedSpend <= 0 || totalSpend <= 0) {
      return '+0%';
    }

    const ratio = Math.round((approvedSpend / totalSpend) * 100);

    return `${ratio}%`;
  }, [approvedSpend, totalSpend]);

  const secondaryMetricLabel = isManager ? 'Bekleyen Talepler' : 'İzin Talepleri';
  const secondaryMetricCount = isManager ? pendingApprovalCount : leaves.length;
  const secondaryMetricSubText = isManager ? 'requests' : 'records';

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Backend hata verse bile local oturumu kapatıyoruz.
    } finally {
      await signOut();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerRoot}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Dashboard verileri yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <AppHeader showSearch showNotification />

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
        <View style={styles.totalSpendCard}>
          <View style={styles.totalSpendContent}>
            <Text style={styles.totalSpendLabel}>
              {isManager ? 'Team Spend (MTD)' : 'Total Spend (MTD)'}
            </Text>

            <View style={styles.totalSpendRow}>
              <Text style={styles.totalSpendValue}>
                {formatCurrency(totalSpend)}
              </Text>

              <View style={styles.changeBadge}>
                <Text style={styles.changeBadgeText}>{spendChangeLabel}</Text>
              </View>
            </View>
          </View>

          <MaterialCommunityIcons
            name="trending-up"
            size={118}
            color="rgba(255,255,255,0.12)"
            style={styles.trendingIcon}
          />
        </View>

        <SummaryActionCard
          icon="clipboard-clock-outline"
          iconBg="#FFE2D6"
          iconColor={colors.tertiary}
          title="Pending Approvals"
          value={String(pendingApprovalCount).padStart(2, '0')}
          suffix="requests"
          onPress={() => navigation.navigate(isManager ? 'Leaves' : 'Expenses')}
        />

        <SummaryActionCard
          icon="credit-card-outline"
          iconBg={colors.secondaryFixed}
          iconColor={colors.secondary}
          title={secondaryMetricLabel}
          value={String(secondaryMetricCount).padStart(2, '0')}
          suffix={secondaryMetricSubText}
          onPress={() => navigation.navigate(isManager ? 'Leaves' : 'Leaves')}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT EXPENSES</Text>

          <Pressable onPress={() => navigation.navigate('Expenses')}>
            <Text style={styles.viewAllText}>View All</Text>
          </Pressable>
        </View>

        <View style={styles.recentList}>
          {recentExpenses.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons
                name="receipt-text-outline"
                size={34}
                color={colors.primary}
              />
              <Text style={styles.emptyTitle}>Harcama kaydı bulunamadı</Text>
              <Text style={styles.emptyText}>
                {isManager
                  ? 'Bağlı çalışanlarınıza ait harcama talebi bulunmuyor.'
                  : 'Yeni harcama talebi oluşturarak süreci başlatabilirsiniz.'}
              </Text>
            </View>
          ) : (
            recentExpenses.map((expense) => (
              <RecentExpenseItem
                key={expense.id}
                expense={expense}
                isManager={isManager}
              />
            ))
          )}
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>BUDGET UTILIZATION</Text>

          <View style={styles.chartArea}>
            {chartData.map((item) => (
              <View key={item.label} style={styles.chartColumn}>
                <View style={styles.chartTrack}>
                  <View
                    style={[
                      styles.chartFill,
                      {
                        height: `${item.percent}%`,
                      },
                    ]}
                  />
                </View>

                <Text style={styles.chartLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.legendArea}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendText}>Spent</Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: colors.surfaceContainerHigh },
                ]}
              />
              <Text style={styles.legendText}>Budget</Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const SummaryActionCard = ({
  icon,
  iconBg,
  iconColor,
  title,
  value,
  suffix,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  value: string;
  suffix: string;
  onPress: () => void;
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.summaryCard,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.summaryLeft}>
        <View style={[styles.summaryIconBox, { backgroundColor: iconBg }]}>
          <MaterialCommunityIcons name={icon} size={28} color={iconColor} />
        </View>

        <View>
          <Text style={styles.summaryTitle}>{title}</Text>

          <View style={styles.summaryValueRow}>
            <Text style={styles.summaryValue}>{value}</Text>
            <Text style={styles.summarySuffix}>{suffix}</Text>
          </View>
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={24}
        color={colors.outline}
      />
    </Pressable>
  );
};

const RecentExpenseItem = ({
  expense,
  isManager,
}: {
  expense: Expense;
  isManager: boolean;
}) => {
  const config = getExpenseVisualConfig(expense.description);

  return (
    <View style={styles.expenseItem}>
      <View style={[styles.expenseIconBox, { backgroundColor: config.iconBg }]}>
        <Ionicons name={config.icon} size={23} color={config.iconColor} />
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

            {isManager && (
              <Text style={styles.employeeText} numberOfLines={1}>
                {expense.employeeFullName}
              </Text>
            )}
          </View>

          <StatusChip status={expense.status} />
        </View>
      </View>
    </View>
  );
};

const StatusChip = ({ status }: { status: RequestStatus }) => {
  const config = getStatusConfig(status);

  return (
    <View style={[styles.statusChip, { backgroundColor: config.bg }]}>
      <Text style={[styles.statusChipText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
};

const getStatusConfig = (status: RequestStatus) => {
  switch (status) {
    case 'APPROVED':
      return {
        label: 'APPROVED',
        bg: '#D1FAE5',
        color: '#047857',
      };
    case 'REJECTED':
      return {
        label: 'REJECTED',
        bg: colors.errorContainer,
        color: colors.onErrorContainer,
      };
    case 'PENDING':
    default:
      return {
        label: 'PENDING',
        bg: '#FEF3C7',
        color: '#B45309',
      };
  }
};

const getExpenseVisualConfig = (description: string) => {
  const text = description.toLocaleLowerCase('tr-TR');

  if (text.includes('yemek') || text.includes('restoran') || text.includes('cafe')) {
    return {
      icon: 'restaurant-outline' as const,
      iconBg: colors.surfaceContainerLow,
      iconColor: colors.onSurfaceVariant,
    };
  }

  if (text.includes('konaklama') || text.includes('uçak') || text.includes('seyahat')) {
    return {
      icon: 'airplane-outline' as const,
      iconBg: colors.surfaceContainerLow,
      iconColor: colors.onSurfaceVariant,
    };
  }

  if (text.includes('amazon') || text.includes('web') || text.includes('cloud')) {
    return {
      icon: 'briefcase-outline' as const,
      iconBg: colors.surfaceContainerLow,
      iconColor: colors.onSurfaceVariant,
    };
  }

  return {
    icon: 'receipt-outline' as const,
    iconBg: colors.surfaceContainerLow,
    iconColor: colors.onSurfaceVariant,
  };
};

const buildWeekdayChartData = (expenses: Expense[]) => {
  const weekdays = [
    { key: 1, label: 'M', total: 0 },
    { key: 2, label: 'T', total: 0 },
    { key: 3, label: 'W', total: 0 },
    { key: 4, label: 'T', total: 0 },
    { key: 5, label: 'F', total: 0 },
  ];

  expenses.forEach((expense) => {
    const date = new Date(expense.createdDate);

    if (Number.isNaN(date.getTime())) {
      return;
    }

    const day = date.getDay();

    const target = weekdays.find((item) => item.key === day);

    if (target) {
      target.total += Number(expense.amount || 0);
    }
  });

  const maxTotal = Math.max(...weekdays.map((item) => item.total), 1);

  return weekdays.map((item) => ({
    label: item.label,
    total: item.total,
    percent: Math.max(12, Math.round((item.total / maxTotal) * 100)),
  }));
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  centerRoot: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.onSurfaceVariant,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 128,
  },
  totalSpendCard: {
    minHeight: 148,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    padding: 28,
    overflow: 'hidden',
    justifyContent: 'center',
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 5,
  },
  totalSpendContent: {
    zIndex: 2,
  },
  totalSpendLabel: {
    color: 'rgba(255,255,255,0.90)',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  totalSpendRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  totalSpendValue: {
    color: colors.onPrimary,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '900',
  },
  changeBadge: {
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  changeBadgeText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: '900',
  },
  trendingIcon: {
    position: 'absolute',
    right: -26,
    bottom: -28,
    transform: [{ rotate: '10deg' }],
  },
  summaryCard: {
    marginTop: 22,
    minHeight: 126,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(195,198,215,0.35)',
    paddingHorizontal: 28,
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  summaryIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    color: colors.onSurfaceVariant,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
  },
  summaryValueRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  summaryValue: {
    color: colors.onSurface,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  summarySuffix: {
    color: colors.onSurfaceVariant,
    fontSize: 16,
  },
  sectionHeader: {
    marginTop: 32,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  viewAllText: {
    color: colors.primary,
    fontSize: 16,
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
    gap: 16,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  expenseIconBox: {
    width: 50,
    height: 50,
    borderRadius: 10,
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
    gap: 12,
  },
  expenseTitle: {
    flex: 1,
    color: colors.onSurface,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
  },
  expenseAmount: {
    color: colors.onSurface,
    fontSize: 16,
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
    fontSize: 14,
    fontWeight: '500',
  },
  employeeText: {
    marginTop: 3,
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  statusChip: {
    minHeight: 24,
    borderRadius: 999,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '900',
  },
  chartCard: {
    marginTop: 34,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(195,198,215,0.35)',
    padding: 28,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  chartTitle: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 26,
  },
  chartArea: {
    height: 220,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  chartColumn: {
    alignItems: 'center',
    gap: 10,
  },
  chartTrack: {
    width: 40,
    height: 190,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerHigh,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartFill: {
    width: '100%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: colors.primary,
  },
  chartLabel: {
    color: colors.onSurface,
    fontSize: 14,
    fontWeight: '700',
  },
  legendArea: {
    marginTop: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  legendText: {
    color: colors.onSurfaceVariant,
    fontSize: 15,
  },
  emptyCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(195,198,215,0.24)',
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
  logoutButton: {
    marginTop: 28,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: colors.errorContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    color: colors.error,
    fontWeight: '900',
    fontSize: 15,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
});