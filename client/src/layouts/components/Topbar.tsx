import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  LogOut,
  Receipt,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ApprovalModal } from '../../components/common/ApprovalModal';
import type { RootState } from '../../core/store/store';
import {
  formatCurrency,
  formatDate,
  getRoleLabel,
} from '../../core/utils/formatters';
import { canApproveRequest, canManageRequests } from '../../core/utils/permissions';
import { useAuth } from '../../features/auth/hooks/useAuth';
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

const POLLING_INTERVAL_MS = 30_000;

const isExpenseNotification = (
  notification: NotificationItem
): notification is Extract<NotificationItem, { type: 'EXPENSE' }> => {
  return notification.type === 'EXPENSE';
};

const isExpenseItem = (item: Expense | Leave): item is Expense => {
  return 'amount' in item;
};

export const Topbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedApproval, setSelectedApproval] =
    useState<SelectedApproval | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const { logout } = useAuth();

  const user = useSelector((state: RootState) => state.auth.user);
  const manageable = canManageRequests(user?.role);

  const handleLogout = async () => {
    await logout();
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Genel Bakış';
      case '/expenses':
        return 'Masraflar';
      case '/leaves':
        return 'İzinler';
      case '/settings':
        return 'Ayarlar';
      case '/admin':
        return 'Yönetici Paneli';
      default:
        return 'CapitalFlow';
    }
  };

  const mapExpenseToNotification = useCallback(
    (expense: Expense): NotificationItem => {
      return {
        id: `expense-${expense.id}`,
        type: 'EXPENSE',
        title: manageable
          ? 'Masraf onayı bekliyor'
          : 'Masraf talebiniz beklemede',
        description: expense.description,
        owner: expense.employeeFullName,
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
        description: leave.description,
        owner: leave.employeeFullName,
        meta: `${formatDate(leave.startDate)} - ${formatDate(leave.endDate)}`,
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

  const loadNotifications = useCallback(async () => {
    if (!user?.id || !user?.role) {
      setNotifications([]);
      return;
    }

    setNotificationLoading(true);

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
      setNotificationLoading(false);
    }
  }, [
    manageable,
    mapExpenseToNotification,
    mapLeaveToNotification,
    user?.id,
    user?.role,
  ]);

  useEffect(() => {
    loadNotifications();

    const intervalId = window.setInterval(
      loadNotifications,
      POLLING_INTERVAL_MS
    );

    return () => window.clearInterval(intervalId);
  }, [loadNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(target)
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCanAct = useMemo(() => {
    if (!selectedApproval) return false;

    return canApproveRequest({
      role: user?.role,
      currentUserId: user?.id,
      employeeId: selectedApproval.item.employeeId,
      status: selectedApproval.item.status,
    });
  }, [selectedApproval, user?.id, user?.role]);

  const handleNotificationClick = (notification: NotificationItem) => {
    setIsNotificationOpen(false);

    setSelectedApproval({
      type: notification.type,
      item: notification.item,
    });
  };

  const handleApprovalAction = async (
    status: Exclude<RequestStatus, 'PENDING'>
  ) => {
    if (!selectedApproval) return;

    setApprovalLoading(true);

    try {
      if (selectedApproval.type === 'EXPENSE' && isExpenseItem(selectedApproval.item)) {
        await expenseService.updateStatus(selectedApproval.item.id, { status });
      }

      if (selectedApproval.type === 'LEAVE' && !isExpenseItem(selectedApproval.item)) {
        await leaveService.updateStatus(selectedApproval.item.id, { status });
      }

      setSelectedApproval(null);
      await loadNotifications();
    } catch {
      // apiClient toast gösteriyor.
    } finally {
      setApprovalLoading(false);
    }
  };

  const notificationCount = notifications.length;

  const avatarName =
    user?.firstName && user?.lastName
      ? `${user.firstName}+${user.lastName}`
      : 'Kullanıcı';

  const emptyNotificationText = useMemo(() => {
    if (manageable) {
      return 'Onay bekleyen bağlı personel talebi bulunmuyor.';
    }

    return 'Bekleyen talebiniz bulunmuyor.';
  }, [manageable]);

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md shrink-0 sticky top-0 w-full z-30 border-b border-outline-variant/10 flex items-center justify-between px-8 h-16">
        <span className="text-lg font-black text-on-surface tracking-tight">
          {getPageTitle()}
        </span>

        <div className="flex items-center gap-6">
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => {
                setIsNotificationOpen((current) => !current);
                loadNotifications();
              }}
              className="text-on-surface-variant hover:text-primary transition-all relative p-2 rounded-lg hover:bg-surface-container-high"
              aria-label="Bildirimler"
            >
              <Bell size={22} />

              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-error text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 mt-3 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-xl border border-outline-variant/10 overflow-hidden animate-in fade-in zoom-in duration-150">
                <div className="px-5 py-4 border-b border-outline-variant/10 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-on-surface">
                      Bildirimler
                    </p>

                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {manageable
                        ? 'Bağlı personelinizden gelen bekleyen talepler'
                        : 'Size ait bekleyen talepler'}
                    </p>
                  </div>

                  {notificationCount > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-error/10 text-error text-xs font-black">
                      {notificationCount}
                    </span>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notificationLoading && (
                    <div className="px-5 py-8 text-center text-sm text-on-surface-variant">
                      Bildirimler yükleniyor...
                    </div>
                  )}

                  {!notificationLoading && notificationCount === 0 && (
                    <div className="px-5 py-8 text-center">
                      <div className="w-11 h-11 mx-auto rounded-2xl bg-success/10 text-success flex items-center justify-center mb-3">
                        <CheckCircle2 size={22} />
                      </div>

                      <p className="text-sm font-bold text-on-surface">
                        Her şey güncel
                      </p>

                      <p className="text-xs text-on-surface-variant mt-1">
                        {emptyNotificationText}
                      </p>
                    </div>
                  )}

                  {!notificationLoading &&
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        className="w-full px-5 py-4 flex gap-3 text-left hover:bg-surface-container-low transition-colors border-b border-outline-variant/10 last:border-b-0"
                      >
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                            isExpenseNotification(notification)
                              ? 'bg-primary/10 text-primary'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {isExpenseNotification(notification) ? (
                            <Receipt size={19} />
                          ) : (
                            <CalendarDays size={19} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-black text-on-surface">
                              {notification.title}
                            </p>

                            <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5 shrink-0">
                              Beklemede
                            </span>
                          </div>

                          <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                            {notification.description}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-on-surface-variant">
                            <span className="font-bold">
                              {notification.owner}
                            </span>

                            <span>{notification.meta}</span>

                            <span>{notification.dateLabel}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-surface-container-low transition-all focus:outline-none group"
            >
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-on-surface">
                  {user?.firstName
                    ? `${user.firstName} ${user.lastName}`
                    : 'Kullanıcı'}
                </span>

                <span className="text-[10px] text-on-surface-variant font-medium">
                  {getRoleLabel(user?.role)}
                </span>
              </div>

              <div className="w-10 h-10 rounded-xl overflow-hidden border border-outline-variant/30 group-hover:border-primary/50 transition-colors shadow-sm">
                <img
                  src={`https://ui-avatars.com/api/?name=${avatarName}&background=004ac6&color=fff&bold=true`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-outline-variant/10 py-3 animate-in fade-in zoom-in duration-150">
                <div className="px-5 py-3 border-b border-outline-variant/10 mb-2">
                  <p className="text-sm font-black text-on-surface truncate">
                    {user?.firstName} {user?.lastName}
                  </p>

                  <p className="text-xs text-on-surface-variant truncate">
                    {user?.email}
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-error hover:bg-error/5 transition-colors font-bold"
                >
                  <LogOut size={18} />
                  Güvenli Çıkış
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <ApprovalModal
        isOpen={!!selectedApproval}
        type={selectedApproval?.type || 'EXPENSE'}
        item={selectedApproval?.item || null}
        canAct={selectedCanAct}
        loading={approvalLoading}
        onClose={() => setSelectedApproval(null)}
        onApprove={() => handleApprovalAction('APPROVED')}
        onReject={() => handleApprovalAction('REJECTED')}
      />
    </>
  );
};