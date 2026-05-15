import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../core/theme/colors';
import { ApprovalModal } from '../../components/common/ApprovalModal';
import { getApiErrorMessage } from '../../core/api/apiError';
import {
  canApproveRequest,
  canManageRequests,
} from '../../core/utils/permissions';
import {
  formatCurrency,
  formatDate,
  formatDateRange,
} from '../../core/utils/formatters';
import { useAuthContext } from '../../features/auth/context/AuthContext';
import { expenseService } from '../../features/expense/services/expenseService';
import type {
  Expense,
  RequestStatus,
} from '../../features/expense/types/expenseTypes';
import { leaveService } from '../../features/leave/services/leaveService';
import type { Leave } from '../../features/leave/types/leaveTypes';

type ApprovalType = 'EXPENSE' | 'LEAVE';

type NotificationItem =
  | {
      id: string;
      type: 'EXPENSE';
      title: string;
      description: string;
      owner: string;
      meta: string;
      dateLabel: string;
      dateValue: string | null;
      item: Expense;
    }
  | {
      id: string;
      type: 'LEAVE';
      title: string;
      description: string;
      owner: string;
      meta: string;
      dateLabel: string;
      dateValue: string | null;
      item: Leave;
    };

interface SelectedApproval {
  type: ApprovalType;
  item: Expense | Leave;
}

interface AppHeaderProps {
  showNotification?: boolean;
  showHelp?: boolean;
  onNotificationPress?: () => void;
}

const POLLING_INTERVAL_MS = 30_000;

const isExpenseNotification = (
  notification: NotificationItem
): notification is Extract<NotificationItem, { type: 'EXPENSE' }> => {
  return notification.type === 'EXPENSE';
};

export const AppHeader = ({
  showNotification = true,
  showHelp = false,
  onNotificationPress,
}: AppHeaderProps) => {
  const { user } = useAuthContext();

  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationRefreshing, setNotificationRefreshing] = useState(false);
  const [selectedApproval, setSelectedApproval] =
    useState<SelectedApproval | null>(null);
  const [approvalLoading, setApprovalLoading] = useState(false);

  const manageable = canManageRequests(user?.role);

  const handleHelpPress = () => {
    Alert.alert(
      'Yardım',
      'Şifre veya hesap işlemleriyle ilgili destek için sistem yöneticinizle iletişime geçebilirsiniz.'
    );
  };

  const mapExpenseToNotification = useCallback(
    (expense: Expense): NotificationItem => {
      return {
        id: `expense-${expense.id}`,
        type: 'EXPENSE',
        title: manageable
          ? 'Harcama onayı bekliyor'
          : 'Harcama talebiniz beklemede',
        description: expense.description || 'Harcama Talebi',
        owner: expense.employeeFullName || '-',
        meta: formatCurrency(expense.amount),
        dateLabel: formatDate(expense.createdDate),
        dateValue: expense.createdDate,
        item: expense,
      };
    },
    [manageable]
  );

  const mapLeaveToNotification = useCallback(
    (leave: Leave): NotificationItem => {
      return {
        id: `leave-${leave.id}`,
        type: 'LEAVE',
        title: manageable
          ? 'İzin onayı bekliyor'
          : 'İzin talebiniz beklemede',
        description: leave.description || 'İzin Talebi',
        owner: leave.employeeFullName || '-',
        meta: formatDateRange(leave.startDate, leave.endDate),
        dateLabel: formatDate(leave.startDate),
        dateValue: leave.startDate,
        item: leave,
      };
    },
    [manageable]
  );

  const sortNotifications = (items: NotificationItem[]) => {
    return [...items].sort((first, second) => {
      const firstTime = first.dateValue
        ? new Date(first.dateValue).getTime()
        : 0;
      const secondTime = second.dateValue
        ? new Date(second.dateValue).getTime()
        : 0;

      return secondTime - firstTime;
    });
  };

  const loadNotifications = useCallback(
    async (silent = false) => {
      if (!showNotification || !user?.id || !user?.role) {
        setNotifications([]);
        return;
      }

      if (!silent) {
        setNotificationLoading(true);
      }

      try {
        const [expenseResponse, leaveResponse] = await Promise.all([
          manageable ? expenseService.getSubordinates() : expenseService.getMine(),
          manageable ? leaveService.getSubordinates() : leaveService.getMine(),
        ]);

        const pendingExpenses = (expenseResponse.data || [])
          .filter((expense) => expense.status === 'PENDING')
          .filter((expense) => !manageable || expense.employeeId !== user.id)
          .map(mapExpenseToNotification);

        const pendingLeaves = (leaveResponse.data || [])
          .filter((leave) => leave.status === 'PENDING')
          .filter((leave) => !manageable || leave.employeeId !== user.id)
          .map(mapLeaveToNotification);

        setNotifications(
          sortNotifications([...pendingExpenses, ...pendingLeaves])
        );
      } catch {
        setNotifications([]);
      } finally {
        if (!silent) {
          setNotificationLoading(false);
        }

        setNotificationRefreshing(false);
      }
    },
    [
      manageable,
      mapExpenseToNotification,
      mapLeaveToNotification,
      showNotification,
      user?.id,
      user?.role,
    ]
  );

  useEffect(() => {
    if (!showNotification) {
      setNotifications([]);
      return;
    }

    loadNotifications(true);

    const intervalId = setInterval(() => {
      loadNotifications(true);
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [loadNotifications, showNotification]);

  const selectedCanAct = useMemo(() => {
    if (!selectedApproval) return false;

    return canApproveRequest({
      role: user?.role,
      currentUserId: user?.id,
      employeeId: selectedApproval.item.employeeId,
      status: selectedApproval.item.status,
    });
  }, [selectedApproval, user?.id, user?.role]);

  const handleNotificationButtonPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
      return;
    }

    setIsNotificationModalOpen(true);
    loadNotifications();
  };

  const handleRefreshNotifications = () => {
    setNotificationRefreshing(true);
    loadNotifications(true);
  };

  const handleNotificationPress = (notification: NotificationItem) => {
    setIsNotificationModalOpen(false);

    setSelectedApproval({
      type: notification.type,
      item: notification.item,
    });
  };

  const handleStatusUpdate = async (
    status: Exclude<RequestStatus, 'PENDING'>
  ) => {
    if (!selectedApproval) return;

    setApprovalLoading(true);

    try {
      const response =
        selectedApproval.type === 'EXPENSE'
          ? await expenseService.updateStatus(selectedApproval.item.id, status)
          : await leaveService.updateStatus(selectedApproval.item.id, status);

      if (!response.success) {
        Alert.alert(
          'Hata',
          response.message || 'Talep durumu güncellenemedi.'
        );
        return;
      }

      setSelectedApproval(null);
      await loadNotifications(true);

      Alert.alert(
        'Başarılı',
        status === 'APPROVED'
          ? 'Talep başarıyla onaylandı.'
          : 'Talep başarıyla reddedildi.'
      );
    } catch (error) {
      Alert.alert(
        'Hata',
        getApiErrorMessage(error, 'Talep durumu güncellenemedi.')
      );
    } finally {
      setApprovalLoading(false);
    }
  };

  const notificationCount = notifications.length;

  const emptyNotificationText = useMemo(() => {
    if (manageable) {
      return 'Onay bekleyen bağlı personel talebi bulunmuyor.';
    }

    return 'Bekleyen talebiniz bulunmuyor.';
  }, [manageable]);

  return (
    <>
      <View style={styles.header}>
        <View style={styles.brandArea}>
          <MaterialCommunityIcons
            name="wallet-outline"
            size={28}
            color={colors.primary}
          />

          <Text style={styles.brandText}>CapitalFlow</Text>
        </View>

        <View style={styles.actions}>
          {showNotification && (
            <Pressable
              style={styles.iconButton}
              onPress={handleNotificationButtonPress}
              hitSlop={8}
            >
              <Ionicons
                name="notifications-outline"
                size={23}
                color={colors.onSurfaceVariant}
              />

              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Text>
                </View>
              )}
            </Pressable>
          )}

          {showHelp && (
            <Pressable
              style={styles.iconButton}
              onPress={handleHelpPress}
              hitSlop={8}
            >
              <Ionicons
                name="help-circle-outline"
                size={24}
                color={colors.onSurfaceVariant}
              />
            </Pressable>
          )}
        </View>
      </View>

      <Modal
        visible={isNotificationModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsNotificationModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalDismissArea}
            onPress={() => setIsNotificationModalOpen(false)}
          />

          <View style={styles.notificationPanel}>
            <View style={styles.panelHeader}>
              <View style={styles.panelTitleArea}>
                <Text style={styles.panelTitle}>Bildirimler</Text>

                <Text style={styles.panelSubtitle}>
                  {manageable
                    ? 'Bağlı personelinizden gelen bekleyen talepler'
                    : 'Size ait bekleyen talepler'}
                </Text>
              </View>

              <Pressable
                onPress={() => setIsNotificationModalOpen(false)}
                style={styles.closeButton}
                hitSlop={8}
              >
                <Ionicons
                  name="close"
                  size={23}
                  color={colors.onSurfaceVariant}
                />
              </Pressable>
            </View>

            <ScrollView
              style={styles.notificationList}
              contentContainerStyle={[
                styles.notificationListContent,
                notifications.length === 0 && styles.emptyContent,
              ]}
              refreshControl={
                <RefreshControl
                  refreshing={notificationRefreshing}
                  onRefresh={handleRefreshNotifications}
                  tintColor={colors.primary}
                />
              }
            >
              {notificationLoading ? (
                <View style={styles.loadingArea}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.loadingText}>
                    Bildirimler yükleniyor...
                  </Text>
                </View>
              ) : notifications.length === 0 ? (
                <View style={styles.emptyArea}>
                  <View style={styles.emptyIconBox}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={34}
                      color={colors.success}
                    />
                  </View>

                  <Text style={styles.emptyTitle}>Her şey güncel</Text>

                  <Text style={styles.emptyDescription}>
                    {emptyNotificationText}
                  </Text>
                </View>
              ) : (
                notifications.map((notification) => (
                  <Pressable
                    key={notification.id}
                    onPress={() => handleNotificationPress(notification)}
                    style={({ pressed }) => [
                      styles.notificationItem,
                      pressed && styles.notificationItemPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.notificationIconBox,
                        isExpenseNotification(notification)
                          ? styles.expenseIconBox
                          : styles.leaveIconBox,
                      ]}
                    >
                      <Ionicons
                        name={
                          isExpenseNotification(notification)
                            ? 'receipt-outline'
                            : 'calendar-outline'
                        }
                        size={23}
                        color={
                          isExpenseNotification(notification)
                            ? colors.primary
                            : colors.warning
                        }
                      />
                    </View>

                    <View style={styles.notificationContent}>
                      <View style={styles.notificationTopRow}>
                        <Text
                          style={styles.notificationTitle}
                          numberOfLines={1}
                        >
                          {notification.title}
                        </Text>

                        <View style={styles.pendingBadge}>
                          <Text style={styles.pendingBadgeText}>
                            Beklemede
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={styles.notificationDescription}
                        numberOfLines={2}
                      >
                        {notification.description}
                      </Text>

                      <View style={styles.notificationMetaRow}>
                        <Text style={styles.notificationOwner} numberOfLines={1}>
                          {notification.owner}
                        </Text>

                        <Text style={styles.notificationMeta} numberOfLines={1}>
                          {notification.meta}
                        </Text>

                        <Text style={styles.notificationDate} numberOfLines={1}>
                          {notification.dateLabel}
                        </Text>
                      </View>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.outlineVariant}
                    />
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ApprovalModal
        visible={!!selectedApproval}
        type={selectedApproval?.type || 'EXPENSE'}
        item={selectedApproval?.item || null}
        canAct={selectedCanAct}
        loading={approvalLoading}
        onClose={() => setSelectedApproval(null)}
        onApprove={() => handleStatusUpdate('APPROVED')}
        onReject={() => handleStatusUpdate('REJECTED')}
      />
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    minHeight: 84,
    paddingTop:
      Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 18,
    paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  brandText: {
    color: colors.primary,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 3,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    paddingHorizontal: 4,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  notificationBadgeText: {
    color: colors.onError,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(25,27,35,0.36)',
    justifyContent: 'flex-start',
  },
  modalDismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  notificationPanel: {
    marginTop:
      Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 72 : 72,
    marginHorizontal: 16,
    maxHeight: '72%',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  panelHeader: {
    minHeight: 76,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195,198,215,0.28)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelTitleArea: {
    flex: 1,
    paddingRight: 12,
  },
  panelTitle: {
    color: colors.onSurface,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
  },
  panelSubtitle: {
    marginTop: 3,
    color: colors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationList: {
    maxHeight: 480,
  },
  notificationListContent: {
    paddingVertical: 8,
  },
  emptyContent: {
    flexGrow: 1,
  },
  loadingArea: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyArea: {
    paddingHorizontal: 28,
    paddingVertical: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconBox: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(16,185,129,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: colors.onSurface,
    fontSize: 18,
    fontWeight: '900',
  },
  emptyDescription: {
    marginTop: 6,
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    fontWeight: '600',
  },
  notificationItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195,198,215,0.18)',
  },
  notificationItemPressed: {
    backgroundColor: colors.surfaceContainerLow,
  },
  notificationIconBox: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseIconBox: {
    backgroundColor: 'rgba(0,74,198,0.10)',
  },
  leaveIconBox: {
    backgroundColor: 'rgba(245,158,11,0.14)',
  },
  notificationContent: {
    flex: 1,
    minWidth: 0,
  },
  notificationTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationTitle: {
    flex: 1,
    color: colors.onSurface,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '900',
  },
  pendingBadge: {
    borderRadius: 999,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pendingBadgeText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '900',
  },
  notificationDescription: {
    marginTop: 4,
    color: colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  notificationMetaRow: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  notificationOwner: {
    maxWidth: 120,
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '900',
  },
  notificationMeta: {
    maxWidth: 130,
    color: colors.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '700',
  },
  notificationDate: {
    color: colors.outline,
    fontSize: 11,
    fontWeight: '700',
  },
});