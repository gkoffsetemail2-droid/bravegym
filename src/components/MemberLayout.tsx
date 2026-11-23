import React, { useState } from 'react';
import {
  Bell,
  Calendar,
  CalendarCheck,
  CreditCard,
  Dumbbell,
  Flame,
  Home,
  Instagram,
  KeyRound,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Package,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import { useBrave } from '../context/BraveContext';
import { PageId } from '../types';
import { EXTERNAL_LINKS, STUDIO_HOURS_12H, STUDIO_HOURS_STATUS } from '../utils/dateUtils';
import { getMembershipTheme } from '../utils/membershipTheme';
import { BraveLogo } from './BraveLogo';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'classes', label: 'Classes', icon: Dumbbell },
  { id: 'trainers', label: 'Personal Trainer', icon: Users },
  { id: 'pt-schedule', label: 'PT Appointments', icon: Calendar },
  { id: 'yoga', label: 'Yoga Appointments', icon: Sparkles },
  { id: 'sauna', label: 'Sauna Appointments', icon: Flame },
  { id: 'lockers', label: 'Locker Appointments', icon: KeyRound },
  { id: 'bookings', label: 'My Bookings', icon: CalendarCheck },
  { id: 'packages', label: 'PT Packages', icon: Package },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'My Profile', icon: User },
];

export const MemberLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    currentUser,
    activePage,
    setActivePage,
    logout,
    unreadNotificationCount,
  } = useBrave();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!currentUser) return null;

  const memberTheme = getMembershipTheme(currentUser.category, currentUser.status);

  const handleNavigate = (page: PageId) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  const currentNavLabel = NAV_ITEMS.find((n) => n.id === activePage)?.label ?? 'Dashboard';

  return (
    <div className="min-h-screen bg-[#F8F7F3] text-[#252823] flex flex-col lg:flex-row">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[264px] lg:shrink-0 lg:sticky lg:top-0 lg:h-screen bg-[#0B2E21] text-[#F8F7F3] border-r border-[#123F2D]">
        <div className="px-6 py-6 border-b border-white/10">
          <button
            type="button"
            onClick={() => handleNavigate('dashboard')}
            className="text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[#EAE2D5] rounded"
          >
            <BraveLogo variant="light" compact />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Member navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#123F2D] text-[#F8F7F3] ring-1 ring-[#EAE2D5]/25'
                    : 'text-[#EAE2D5]/80 hover:bg-[#123F2D]/60 hover:text-[#F8F7F3]'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.id === 'notifications' && unreadNotificationCount > 0 && (
                  <span className="tabular-nums text-[11px] font-semibold bg-[#EAE2D5] text-[#0B2E21] px-2 py-0.5 rounded-md">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* External Links & Member Footer */}
        <div className="px-4 py-4 border-t border-white/10 space-y-3">
          <div className="text-[11px] text-[#EAE2D5]/80 tabular-nums flex items-center justify-between gap-2 pb-2 border-b border-white/10">
            <span className="font-semibold text-[#F8F7F3]">{STUDIO_HOURS_STATUS}</span>
            <span>{STUDIO_HOURS_12H}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-[#EAE2D5]/75">
            <a
              href={EXTERNAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#F8F7F3] inline-flex items-center gap-1 transition-colors"
              title="Instagram"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>IG</span>
            </a>
            <a
              href={EXTERNAL_LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#F8F7F3] inline-flex items-center gap-1 transition-colors"
              title="Contact via WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
            <a
              href={EXTERNAL_LINKS.maps}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#F8F7F3] inline-flex items-center gap-1 transition-colors"
              title="Directions to Brave Gym"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Directions</span>
            </a>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#F8F7F3] truncate">{currentUser.name}</div>
              <div className="text-[11px] font-mono text-[#EAE2D5]/70 truncate">
                {currentUser.membershipId}
              </div>
              <span
                className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${memberTheme.badgeClass}`}
              >
                {memberTheme.badgeLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-[#F8F7F3] transition-colors cursor-pointer shrink-0"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Compact Header */}
      <header className="lg:hidden sticky top-0 z-30 bg-[#0B2E21] text-[#F8F7F3] px-4 py-3 flex items-center justify-between border-b border-[#123F2D]">
        <button
          type="button"
          onClick={() => handleNavigate('dashboard')}
          className="cursor-pointer"
        >
          <BraveLogo variant="light" compact />
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleNavigate('notifications')}
            className="relative p-2 rounded-lg text-[#EAE2D5] hover:bg-[#123F2D] cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#EAE2D5] text-[#0B2E21] text-[10px] font-bold flex items-center justify-center tabular-nums">
                {unreadNotificationCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="p-2 rounded-lg text-[#F8F7F3] hover:bg-[#123F2D] cursor-pointer"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 flex">
          <div className="w-72 max-w-[85vw] bg-[#0B2E21] text-[#F8F7F3] h-full flex flex-col p-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <BraveLogo variant="light" compact />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-[#123F2D] cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-3 space-y-1 flex-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
                      isActive
                        ? 'bg-[#123F2D] text-[#F8F7F3]'
                        : 'text-[#EAE2D5]/80 hover:bg-[#123F2D]/60'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </span>
                    {item.id === 'notifications' && unreadNotificationCount > 0 && (
                      <span className="tabular-nums text-[11px] font-semibold bg-[#EAE2D5] text-[#0B2E21] px-2 py-0.5 rounded">
                        {unreadNotificationCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex items-center gap-4 text-xs text-[#EAE2D5]/80">
                <a href={EXTERNAL_LINKS.instagram} target="_blank" rel="noopener noreferrer">
                  Instagram
                </a>
                <a href={EXTERNAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
                <a href={EXTERNAL_LINKS.maps} target="_blank" rel="noopener noreferrer">
                  Directions
                </a>
              </div>
              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 text-sm font-medium text-[#F8F7F3] cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Desktop Top Contextual Bar */}
        <div className="hidden lg:flex items-center justify-between gap-8 px-8 py-4 bg-[#F8F7F3] border-b border-[#252823]/10">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-[#6F8569] font-medium">Brave Member Portal</span>
            <span className="text-[#252823]/30">/</span>
            <span className="font-semibold text-[#123F2D]">{currentNavLabel}</span>
          </div>

          <div className="flex items-center gap-5 text-xs text-[#252823]/75">
            <span className="hidden xl:inline tabular-nums text-[#6F8569] font-medium">
              {STUDIO_HOURS_STATUS}: {STUDIO_HOURS_12H}
            </span>
            <span className="hidden xl:inline" aria-hidden="true">
              ·
            </span>
            <span className="tabular-nums">
              PT Credits:{' '}
              <strong className="text-[#123F2D] font-semibold">
                {Math.max(0, currentUser.ptCreditsTotal - currentUser.ptCreditsUsed)}
              </strong>{' '}
              remaining
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-2">
              <span>Status:</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase ${memberTheme.badgeClass}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${memberTheme.dotClass}`} />
                {memberTheme.badgeLabel}
              </span>
            </span>
            <button
              type="button"
              onClick={() => handleNavigate('pt-schedule')}
              className="px-4 py-2 rounded-lg bg-[#123F2D] text-[#F8F7F3] font-semibold hover:bg-[#0B2E21] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              My PT Schedule
            </button>
          </div>
        </div>

        {/* Expired Member Notice Banner */}
        {currentUser.status === 'Expired' && (
          <div className="bg-[#FBE7E7] border-b border-[#AC4242]/20 px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-[#AC4242]">
            <span>
              <strong>Membership Expired ({currentUser.expirationDate}):</strong> Booking classes, personal training, sauna, and lockers is currently paused. Contact Brave Gym via WhatsApp or visit the front desk to reactivate.
            </span>
            <a
              href={EXTERNAL_LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-4 whitespace-nowrap"
            >
              Renew via WhatsApp
            </a>
          </div>
        )}

        {/* Pending Renewal Notice Banner */}
        {currentUser.status === 'Pending Renewal' && (
          <div className="bg-[#FFF1DF] border-b border-[#B87527]/20 px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-[#B87527]">
            <span>
              <strong>Renewal Pending ({currentUser.expirationDate}):</strong> Your membership renewal is awaiting confirmation. Complete payment or contact the Brave Gym desk to keep uninterrupted access.
            </span>
            <a
              href={EXTERNAL_LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-4 whitespace-nowrap"
            >
              Confirm Renewal via WhatsApp
            </a>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-10 max-w-[1320px] w-full mx-auto">
          {children}
        </main>

        {/* Mobile Compact Bottom Quick Bar (<= 10% viewport height) */}
        <nav
          className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t border-[#252823]/10 grid grid-cols-5 h-14"
          aria-label="Quick navigation"
        >
          {[
            { id: 'dashboard' as PageId, label: 'Home', icon: Home },
            { id: 'classes' as PageId, label: 'Classes', icon: Dumbbell },
            { id: 'pt-schedule' as PageId, label: 'PT Cal', icon: Calendar },
            { id: 'bookings' as PageId, label: 'Bookings', icon: CalendarCheck },
            { id: 'profile' as PageId, label: 'Profile', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activePage === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleNavigate(tab.id)}
                className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium cursor-pointer ${
                  active ? 'text-[#123F2D] font-semibold' : 'text-[#252823]/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
