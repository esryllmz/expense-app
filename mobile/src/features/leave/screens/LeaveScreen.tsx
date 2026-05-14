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
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../core/theme/colors';
import { useAuthContext } from '../../auth/context/AuthContext';
import { AppHeader } from '../../../shared/components/AppHeader';
import { leaveService } from '../services/leaveService';
import type { Leave, RequestStatus } from '../types/leaveTypes';
import {
  calculateLeaveDays,
  formatDateRange,
  getStatusLabel,
  isBeforeToday,
  isValidIsoDate,
} from '../../../core/utils/formatters';

export const LeaveScreen = () => {
  const { user } = useAuthContext();

  const isManager =
    user?.role === 'ROLE_GM' || user?.role === 'ROLE_TEAM_LEADER';

  const canCreateLeave =
    user?.role === 'ROLE_EMPLOYEE' && user?.managerId != null;

  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadLeaves = async () => {
    try {
      const response = isManager
        ? await leaveService.getSubordinateLeaves()
        : await leaveService.getMyLeaves();

      setLeaves(response.data || []);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'İzin talepleri alınamadı. Backend bağlantısını kontrol edin.';

      Alert.alert('Hata', message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const pendingCount = useMemo(() => {
    return leaves.filter((leave) => leave.status === 'PENDING').length;
  }, [leaves]);

  const remainingDays = useMemo(() => {
    const approvedUsedDays = leaves
      .filter((leave) => leave.status === 'APPROVED')
      .reduce(
        (sum, leave) => sum + calculateLeaveDays(leave.startDate, leave.endDate),
        0
      );

    return Math.max(0, 14 - approvedUsedDays);
  }, [leaves]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadLeaves();
  };

  const handleCreatePress = () => {
    if (isManager) {
      Alert.alert(
        'Yetkisiz işlem',
        'Yöneticiler bu ekrandan kendi adına izin talebi oluşturamaz.'
      );
      return;
    }

    if (!canCreateLeave) {
      Alert.alert(
        'Yönetici ataması gerekli',
        'İzin talebi oluşturabilmek için önce bir yöneticiniz atanmalıdır.'
      );
      return;
    }

    setIsCreateModalOpen(true);
  };

  const handleStatusUpdate = async (
    leaveId: number,
    status: Exclude<RequestStatus, 'PENDING'>
  ) => {
    setActionLoading(true);

    try {
      const response = await leaveService.updateStatus(leaveId, status);

      if (response.success) {
        setSelectedLeave(null);
        await loadLeaves();
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message || 'İzin durumu güncellenemedi.';

      Alert.alert('Hata', message);
    } finally {
      setActionLoading(false);
    }
  };

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
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <View style={styles.titleTextArea}>
              <Text style={styles.overline}>
                {isManager ? 'YÖNETİM' : 'PERSONEL'}
              </Text>

              <Text style={styles.title}>
                {isManager ? 'İzin Talepleri' : 'İzin Taleplerim'}
              </Text>
            </View>

            <View style={styles.remainingChip}>
              <Text style={styles.remainingText}>
                {isManager
                  ? `${pendingCount} Bekleyen`
                  : `${remainingDays} Kalan Gün`}
              </Text>
            </View>
          </View>

          <Text style={styles.description}>
            {isManager
              ? 'Bağlı çalışanlarınızın geçmiş ve bekleyen izin taleplerini buradan takip edebilirsiniz.'
              : 'Geçmiş ve bekleyen izin taleplerinizi buradan takip edebilirsiniz.'}
          </Text>
        </View>

        {!isManager && (
          <Pressable
            onPress={handleCreatePress}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
              !canCreateLeave && styles.disabledCreateButton,
            ]}
          >
            <Ionicons name="add" size={28} color={colors.onPrimary} />
            <Text style={styles.primaryButtonText}>Yeni İzin Talebi</Text>
          </Pressable>
        )}

        {loading ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>İzinler yükleniyor...</Text>
          </View>
        ) : leaves.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={32} color={colors.primary} />
            <Text style={styles.emptyTitle}>İzin talebi bulunamadı</Text>
            <Text style={styles.emptyText}>
              {isManager
                ? 'Bağlı çalışanlarınıza ait izin talebi bulunmuyor.'
                : 'Yeni izin talebi oluşturarak süreci başlatabilirsiniz.'}
            </Text>
          </View>
        ) : (
          <View style={styles.listArea}>
            {leaves.map((leave) => (
              <LeaveCard
                key={leave.id}
                leave={leave}
                isManager={isManager}
                onPress={() => setSelectedLeave(leave)}
              />
            ))}
          </View>
        )}

        <PolicyCard />
      </ScrollView>

      <CreateLeaveModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={async () => {
          setIsCreateModalOpen(false);
          await loadLeaves();
        }}
      />

      <LeaveDetailModal
        leave={selectedLeave}
        isManager={isManager}
        loading={actionLoading}
        onClose={() => setSelectedLeave(null)}
        onApprove={() =>
          selectedLeave && handleStatusUpdate(selectedLeave.id, 'APPROVED')
        }
        onReject={() =>
          selectedLeave && handleStatusUpdate(selectedLeave.id, 'REJECTED')
        }
      />
    </SafeAreaView>
  );
};

const LeaveCard = ({
  leave,
  isManager,
  onPress,
}: {
  leave: Leave;
  isManager: boolean;
  onPress: () => void;
}) => {
  const days = calculateLeaveDays(leave.startDate, leave.endDate);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.leaveCard,
        pressed && styles.cardPressed,
        leave.status === 'APPROVED' && styles.approvedCard,
      ]}
    >
      <View style={styles.cardStatusArea}>
        <StatusBadge status={leave.status} />
      </View>

      <View style={styles.cardMainRow}>
        <View style={styles.leaveIconBox}>
          <Ionicons
            name={getLeaveIcon(leave.status)}
            size={28}
            color={colors.primary}
          />
        </View>

        <View style={styles.leaveContent}>
          <Text style={styles.leaveTitle} numberOfLines={1}>
            {leave.description || 'İzin Talebi'}
          </Text>

          <Text style={styles.leaveDate}>
            {formatDateRange(leave.startDate, leave.endDate)}
          </Text>

          {isManager && (
            <Text style={styles.employeeText} numberOfLines={1}>
              Talep sahibi: {leave.employeeFullName}
            </Text>
          )}

          <View style={styles.cardDivider} />

          <View style={styles.durationRow}>
            <Text style={styles.durationLabel}>
              Süre:{' '}
              <Text style={styles.durationValue}>
                {days} İş Günü
              </Text>
            </Text>

            <Ionicons
              name="chevron-forward"
              size={22}
              color={colors.outlineVariant}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const StatusBadge = ({ status }: { status: RequestStatus }) => {
  const config = getStatusConfig(status);

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon} size={14} color={config.color} />
      <Text style={[styles.statusText, { color: config.color }]}>
        {getStatusLabel(status)}
      </Text>
    </View>
  );
};

const PolicyCard = () => {
  return (
    <View style={styles.policyCard}>
      <View style={styles.policyIcon}>
        <Ionicons
          name="information-circle-outline"
          size={28}
          color={colors.primaryContainer}
        />
      </View>

      <View style={styles.policyTextArea}>
        <Text style={styles.policyTitle}>İzin Politikası Hatırlatması</Text>

        <Text style={styles.policyText}>
          Yıllık izin taleplerinin en az 2 hafta öncesinden sisteme girilmesi
          gerekmektedir. Onay süreci yönetici bazlı 3 iş günü sürer.
        </Text>
      </View>
    </View>
  );
};

const CreateLeaveModal = ({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setDescription('');
    setStartDate('');
    setEndDate('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    if (!description.trim() || !startDate || !endDate) {
      Alert.alert('Eksik bilgi', 'Açıklama, başlangıç ve bitiş tarihi zorunludur.');
      return;
    }

    if (!isValidIsoDate(startDate) || !isValidIsoDate(endDate)) {
      Alert.alert('Hatalı tarih formatı', 'Tarihleri YYYY-MM-DD formatında girin.');
      return;
    }

    if (isBeforeToday(startDate)) {
      Alert.alert('Hatalı tarih', 'Geçmiş bir tarih için izin talebi oluşturulamaz.');
      return;
    }

    if (endDate < startDate) {
      Alert.alert('Hatalı tarih', 'Bitiş tarihi başlangıç tarihinden önce olamaz.');
      return;
    }

    setLoading(true);

    try {
      const response = await leaveService.createLeave({
        description: description.trim(),
        startDate,
        endDate,
      });

      if (response.success) {
        resetForm();
        onSuccess();
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message || 'İzin talebi oluşturulamadı.';

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
            <Text style={styles.modalTitle}>Yeni İzin Talebi</Text>

            <Pressable onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <Text style={styles.inputLabel}>Açıklama</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Örn: Yıllık izin"
            placeholderTextColor={colors.outline}
            style={styles.modalInput}
          />

          <Text style={styles.inputLabel}>Başlangıç Tarihi</Text>
          <TextInput
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.outline}
            style={styles.modalInput}
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.inputLabel}>Bitiş Tarihi</Text>
          <TextInput
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.outline}
            style={styles.modalInput}
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.helperText}>
            Tarihleri örnek formatta girin: 2026-05-20
          </Text>

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

const LeaveDetailModal = ({
  leave,
  isManager,
  loading,
  onClose,
  onApprove,
  onReject,
}: {
  leave: Leave | null;
  isManager: boolean;
  loading: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) => {
  if (!leave) return null;

  const canAct = isManager && leave.status === 'PENDING';

  return (
    <Modal visible={!!leave} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>İzin Detayı</Text>

            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <DetailRow label="Talep Sahibi" value={leave.employeeFullName || '-'} />
          <DetailRow label="Açıklama" value={leave.description || '-'} />
          <DetailRow
            label="Tarih"
            value={formatDateRange(leave.startDate, leave.endDate)}
          />
          <DetailRow
            label="Süre"
            value={`${calculateLeaveDays(leave.startDate, leave.endDate)} İş Günü`}
          />
          <DetailRow label="Durum" value={getStatusLabel(leave.status)} />

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
        bg: '#D1FAE5',
        color: '#047857',
        icon: 'checkmark-circle-outline' as const,
      };
    case 'REJECTED':
      return {
        bg: colors.errorContainer,
        color: colors.onErrorContainer,
        icon: 'close-circle-outline' as const,
      };
    case 'PENDING':
    default:
      return {
        bg: '#FFE2D6',
        color: '#7D2D00',
        icon: 'ellipsis-horizontal-circle-outline' as const,
      };
  }
};

const getLeaveIcon = (status: RequestStatus) => {
  switch (status) {
    case 'APPROVED':
      return 'calendar-outline' as const;
    case 'REJECTED':
      return 'airplane-outline' as const;
    case 'PENDING':
    default:
      return 'calendar-clear-outline' as const;
  }
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
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 120,
  },
  titleSection: {
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleTextArea: {
    flex: 1,
  },
  overline: {
    color: colors.secondary,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 1.4,
    fontWeight: '800',
  },
  title: {
    marginTop: 3,
    color: colors.onSurface,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  remainingChip: {
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 999,
  },
  remainingText: {
    color: colors.onPrimaryFixed,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  description: {
    color: colors.onSurfaceVariant,
    fontSize: 16,
    lineHeight: 24,
  },
  primaryButton: {
    marginTop: 32,
    height: 74,
    borderRadius: 14,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 14,
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 5,
  },
  disabledCreateButton: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    letterSpacing: 0.8,
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
    marginTop: 32,
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
    marginTop: 32,
    gap: 20,
  },
  leaveCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 215, 0.3)',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  approvedCard: {
    opacity: 0.96,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
  },
  cardStatusArea: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 2,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 18,
  },
  leaveIconBox: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: 'rgba(219, 225, 255, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveContent: {
    flex: 1,
    paddingRight: 108,
  },
  leaveTitle: {
    color: colors.onSurface,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
  },
  leaveDate: {
    marginTop: 6,
    color: colors.onSurfaceVariant,
    fontSize: 16,
    lineHeight: 22,
  },
  employeeText: {
    marginTop: 5,
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  cardDivider: {
    marginTop: 18,
    height: 1,
    backgroundColor: 'rgba(195, 198, 215, 0.35)',
  },
  durationRow: {
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  durationLabel: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '700',
  },
  durationValue: {
    color: colors.onSurface,
    fontWeight: '900',
  },
  statusBadge: {
    minHeight: 32,
    borderRadius: 999,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '800',
  },
  policyCard: {
    marginTop: 34,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    padding: 28,
    flexDirection: 'row',
    gap: 18,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2,
  },
  policyIcon: {
    paddingTop: 2,
  },
  policyTextArea: {
    flex: 1,
    gap: 10,
  },
  policyTitle: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  policyText: {
    color: colors.onSecondaryFixedVariant,
    fontSize: 16,
    lineHeight: 24,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(25, 27, 35, 0.35)',
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
  helperText: {
    color: colors.outline,
    fontSize: 12,
    fontWeight: '600',
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