import React, { useMemo } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useBrave } from '../context/BraveContext';

export const NotificationsPage: React.FC = () => {
  const {
    store,
    currentUser,
    setActivePage,
    markNotificationRead,
    markAllNotificationsRead,
    unreadNotificationCount,
  } = useBrave();

  if (!currentUser) return null;

  const memberNotifications = useMemo(
    () =>
      store.notifications
        .filter((n) => n.memberId === currentUser.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [store.notifications, currentUser.id]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6F8569]">
            Activity Alerts
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#123F2D]">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-[#252823]/70">
            Real-time log of your bookings, reschedules, cancellations, and PT payment updates.
          </p>
        </div>

        {unreadNotificationCount > 0 && (
          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#123F2D]/25 bg-white text-xs font-semibold text-[#123F2D] hover:bg-[#EAE2D5]/50 cursor-pointer self-start"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read ({unreadNotificationCount})</span>
          </button>
        )}
      </div>

      <div className="rounded-xl border border-[#252823]/10 bg-white overflow-hidden">
        {memberNotifications.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Bell className="w-8 h-8 text-[#6F8569] mx-auto" />
            <p className="text-sm text-[#252823]/70">No notifications yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#252823]/10">
            {memberNotifications.map((n) => (
              <div
                key={n.id}
                className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  !n.read ? 'bg-[#EAE2D5]/35' : 'bg-white'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-[#6F8569]">
                    <span className="uppercase tracking-wider font-semibold">{n.type}</span>
                    <span>·</span>
                    <span className="tabular-nums">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                    {!n.read && (
                      <>
                        <span>·</span>
                        <span className="font-bold text-[#123F2D]">Unread</span>
                      </>
                    )}
                  </div>
                  <div className="font-display text-base font-bold text-[#123F2D]">
                    {n.title}
                  </div>
                  <p className="text-sm text-[#252823]/80">{n.message}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markNotificationRead(n.id)}
                      className="px-3 py-1.5 rounded-lg border border-[#252823]/15 text-xs font-semibold text-[#252823] hover:bg-white cursor-pointer"
                    >
                      Mark Read
                    </button>
                  )}
                  {n.linkPage && (
                    <button
                      type="button"
                      onClick={() => {
                        markNotificationRead(n.id);
                        setActivePage(n.linkPage!);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-xs font-semibold hover:bg-[#0B2E21] cursor-pointer"
                    >
                      Open
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
