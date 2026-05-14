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
import { Ionicons } from '@expo/vector-icons';

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
import {
  calculateLeaveDays,
  formatDateRange,
  isBeforeToday,
  isValidIsoDate,
} from '../../../core/utils/formatters';

import { useAuthContext } from '../../auth/context/AuthContext';
import { leaveService } from '../services/leaveService';
import type { Leave, RequestStatus } from '../types/leaveTypes';

type LeaveViewMode = 'APPROVALS' | 'MINE';
type LeaveFilter = 'ALL' | 'PENDING';

export const LeaveScreen = () => {
  const { user } = useAuthContext();

  const [viewMode, setViewMode] = useState<LeaveViewMode>(
    user?.role === 'ROLE_TEAM_LEADER' ? 'APPROVALS' : 'MINE'
  );

  const [activeFilter, setActiveFilter] = useState<LeaveFilter>('ALL');
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isGeneralManager = isGM(user?.role);
  const isLead = isTeamLead(user?.role);

  const shouldLoadSubordinates =
    isGeneralManager || (isLead && viewMode === 'APPROVALS');

  const canCreateLeave =
    canCreateOwnRequest(user?.role) &&
    !isGeneralManager &&
    viewMode === 'MINE' &&
    user?.managerId != null;

  const loadLeaves = async () => {
    try {
      const response = shouldLoadSubordinates
        ? await leaveService.getSubordinates()
        : await leaveService.getMine();

      setLeaves(response.data || []);
    } catch (error) {
      Alert.alert(
        'Hata',
        getApiErrorMessage(error, 'İzin talepleri alınamadı.')
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setActiveFilter('ALL');
    loadLeaves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, viewMode]);

  const pendingCount = useMemo(() => {
    return leaves.filter((leave) => leave.status === 'PENDING').length;
  }, [leaves]);

  const approvedCount = useMemo(() => {
    return leaves.filter((leave) => leave.status === 'APPROVED').length;
  }, [leaves]);

  const rejectedCount = useMemo(() => {
    return leaves.filter((leave) => leave.status === 'REJECTED').length;
  }, [leaves]);

  const displayedLeaves = useMemo(() => {
    if (activeFilter === 'PENDING') {
      return leaves.filter((leave) => leave.status === 'PENDING');
    }

    return leaves;
  }, [activeFilter, leaves]);

  const selectedCanAct = selectedLeave
    ? canApproveRequest({
        role: user?.role,
        currentUserId: user?.id,
        employeeId: selectedLeave.employeeId,
        status: selectedLeave.status,
      })
    : false;


  const headerTitle = shouldLoadSubordinates
    ? 'İzin Talepleri'
    : 'İzin Taleplerim';

  const headerDescription = shouldLoadSubordinates
    ? 'Bağlı çalışanlarınızın izin taleplerini buradan takip edebilirsiniz.'
    : 'Geçmiş ve bekleyen izin taleplerinizi buradan takip edebilirsiniz.';

  const togglePendingFilter = () => {
    setActiveFilter((current) => (current === 'PENDING' ? 'ALL' : 'PENDING'));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadLeaves();
  };

  const handleCreatePress = () => {
    if (!canCreateLeave) {
      Alert.alert(
        'Yetkisiz işlem',
        'Talep oluşturmak için uygun rol ve yönetici ataması gerekir.'
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

      if (!response.success) {
        Alert.alert('Hata', response.message || 'İzin durumu güncellenemedi.');
        return;
      }

      setSelectedLeave(null);
      await loadLeaves();
    } catch (error) {
      Alert.alert(
        'Hata',
        getApiErrorMessage(error, 'İzin durumu güncellenemedi.')
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <AppHeader />
        <LoadingView text="İzinler yükleniyor..." />
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
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <View style={styles.titleTextArea}>
              <Text style={styles.title}>{headerTitle}</Text>
            </View>

            <Pressable
              onPress={togglePendingFilter}
              hitSlop={8}
              style={({ pressed }) => [
                styles.pendingChip,
                activeFilter === 'PENDING' && styles.pendingChipActive,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.pendingChipText,
                  activeFilter === 'PENDING' && styles.pendingChipTextActive,
                ]}
              >
                {activeFilter === 'PENDING'
                  ? 'Tümü'
                  : `${pendingCount} Bekleyen`}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.description}>{headerDescription}</Text>

          {activeFilter === 'PENDING' && (
            <View style={styles.filterInfo}>
              <Ionicons
                name="filter-outline"
                size={16}
                color={colors.primary}
              />

              <Text style={styles.filterInfoText}>
                Sadece bekleyen izin talepleri gösteriliyor.
              </Text>
            </View>
          )}
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
          <MiniStatCard
            label="Bekleyen"
            value={pendingCount}
            valueColor={colors.warning}
          />

          <MiniStatCard
            label="Onaylanan"
            value={approvedCount}
            valueColor={colors.success}
          />

          <MiniStatCard
            label="Reddedilen"
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
              !canCreateLeave && styles.disabledCreateButton,
            ]}
          >
            <Ionicons name="add" size={28} color={colors.onPrimary} />
            <Text style={styles.primaryButtonText}>Yeni İzin Talebi</Text>
          </Pressable>
        )}

        {displayedLeaves.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title={
              activeFilter === 'PENDING'
                ? 'Bekleyen izin talebi bulunamadı'
                : 'İzin talebi bulunamadı'
            }
            description={
              activeFilter === 'PENDING'
                ? 'Beklemede olan izin talebi bulunmuyor.'
                : shouldLoadSubordinates
                  ? 'Bağlı çalışanlarınıza ait izin talebi bulunmuyor.'
                  : 'Yeni izin talebi oluşturarak süreci başlatabilirsiniz.'
            }
          />
        ) : (
          <View style={styles.listArea}>
            {displayedLeaves.map((leave) => (
              <LeaveCard
                key={leave.id}
                leave={leave}
                showEmployee={shouldLoadSubordinates}
                onPress={() => setSelectedLeave(leave)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <CreateLeaveModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={async () => {
          setIsCreateModalOpen(false);
          await loadLeaves();
        }}
      />

      <ApprovalModal
        visible={!!selectedLeave}
        type="LEAVE"
        item={selectedLeave}
        canAct={selectedCanAct}
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

const MiniStatCard = ({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: number;
  valueColor: string;
}) => {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
};

const LeaveCard = ({
  leave,
  showEmployee,
  onPress,
}: {
  leave: Leave;
  showEmployee: boolean;
  onPress: () => void;
}) => {
  const days = calculateLeaveDays(leave.startDate, leave.endDate);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.leaveCard,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.cardStatusArea}>
        <StatusBadge status={leave.status} />
      </View>

      <View style={styles.cardMainRow}>
        <View style={styles.leaveIconBox}>
          <Ionicons
            name="calendar-outline"
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

          {showEmployee && (
            <Text style={styles.employeeText} numberOfLines={1}>
              Talep sahibi: {leave.employeeFullName}
            </Text>
          )}

          <View style={styles.cardDivider} />

          <View style={styles.durationRow}>
            <Text style={styles.durationLabel}>
              Süre:{' '}
              <Text style={styles.durationValue}>
                {days} Gün
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
      const response = await leaveService.create({
        description: description.trim(),
        startDate,
        endDate,
      });

      if (!response.success) {
        Alert.alert('Hata', response.message || 'İzin talebi oluşturulamadı.');
        return;
      }

      resetForm();
      onSuccess();
    } catch (error) {
      Alert.alert(
        'Hata',
        getApiErrorMessage(error, 'İzin talebi oluşturulamadı.')
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
            <Text style={styles.modalTitle}>Yeni İzin Talebi</Text>

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
            Örnek format: 2026-05-20
          </Text>

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
  titleSection: {
    gap: 10,
    marginBottom: 20,
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
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: 1.2,
    fontWeight: '900',
  },
  title: {
    marginTop: 2,
    color: colors.onSurface,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  description: {
    color: colors.onSurfaceVariant,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '500',
  },
  pendingChip: {
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingChipActive: {
    backgroundColor: colors.primaryContainer,
  },
  pendingChipText: {
    color: colors.onPrimaryFixed,
    fontSize: 13,
    fontWeight: '900',
  },
  pendingChipTextActive: {
    color: colors.onPrimary,
  },
  filterInfo: {
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterInfoText: {
    flex: 1,
    color: colors.primary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
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
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    minHeight: 78,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(195,198,215,0.28)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  statLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '800',
  },
  statValue: {
    marginTop: 5,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
  },
  primaryButton: {
    height: 64,
    borderRadius: 14,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 14,
    marginBottom: 22,
  },
  disabledCreateButton: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  listArea: {
    gap: 16,
  },
  leaveCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 215, 0.3)',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
  },
  cardStatusArea: {
    position: 'absolute',
    top: 18,
    right: 18,
    zIndex: 2,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  leaveIconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(219, 225, 255, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveContent: {
    flex: 1,
    paddingRight: 104,
  },
  leaveTitle: {
    color: colors.onSurface,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
  },
  leaveDate: {
    marginTop: 5,
    color: colors.onSurfaceVariant,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  employeeText: {
    marginTop: 5,
    color: colors.secondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  cardDivider: {
    marginTop: 16,
    height: 1,
    backgroundColor: 'rgba(195, 198, 215, 0.35)',
  },
  durationRow: {
    paddingTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  durationLabel: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '800',
  },
  durationValue: {
    color: colors.onSurface,
    fontWeight: '900',
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
});