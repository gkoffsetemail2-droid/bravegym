import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  Clock,
  Dumbbell,
  ExternalLink,
  Flame,
  Instagram,
  KeyRound,
  MapPin,
  MessageCircle,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useBrave } from '../context/BraveContext';
import { BRAND_MEDIA } from '../data/brandMedia';
import { PTAppointment, YogaAppointment } from '../types';
import {
  EXTERNAL_LINKS,
  formatDisplayDate,
  STUDIO_HOURS_12H,
  STUDIO_HOURS_24H,
  STUDIO_HOURS_STATUS,
} from '../utils/dateUtils';
import { getMembershipTheme } from '../utils/membershipTheme';
import { BraveLogo, SafeImage } from './BraveLogo';
import { PTRescheduleModal } from './PTRescheduleModal';
import { YogaRescheduleModal } from './YogaRescheduleModal';

interface UnifiedUpcomingItem {
  id: string;
  kind: 'Group Class' | 'Personal Training' | 'Yoga Appointment' | 'Sauna Appointment' | 'Locker';
  title: string;
  date: string;
  time: string;
  subtitle: string;
  location: string;
  status: string;
  ptRaw?: PTAppointment;
  yogaRaw?: YogaAppointment;
}

export const DashboardPage: React.FC = () => {
  const {
    store,
    currentUser,
    setActivePage,
    getMemberPTCreditsRemaining,
    cancelClassBooking,
    cancelPT,
    cancelYoga,
    cancelSauna,
    cancelLocker,
  } = useBrave();

  const [selectedItem, setSelectedItem] = useState<UnifiedUpcomingItem | null>(null);
  const [rescheduleAppt, setRescheduleAppt] = useState<PTAppointment | null>(null);
  const [rescheduleYogaAppt, setRescheduleYogaAppt] = useState<YogaAppointment | null>(null);
  const [actionMsg, setActionMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!currentUser) return null;

  const ptRemaining = getMemberPTCreditsRemaining(currentUser);
  const isExpired = currentUser.status === 'Expired';
  const memberTheme = getMembershipTheme(currentUser.category, currentUser.status);

  const upcomingClasses = useMemo(
    () =>
      store.classBookings.filter(
        (b) => b.memberId === currentUser.id && b.status === 'Upcoming'
      ),
    [store.classBookings, currentUser.id]
  );

  const upcomingPT = useMemo(
    () =>
      store.ptAppointments.filter(
        (a) => a.memberId === currentUser.id && a.status === 'Upcoming'
      ),
    [store.ptAppointments, currentUser.id]
  );

  const upcomingYoga = useMemo(
    () =>
      store.yogaAppointments
        .filter((y) => y.memberId === currentUser.id && y.status === 'Upcoming')
        .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)),
    [store.yogaAppointments, currentUser.id]
  );

  const upcomingSauna = useMemo(
    () =>
      store.saunaBookings
        .filter((b) => b.memberId === currentUser.id && b.status === 'Upcoming')
        .sort((a, b) => `${a.date} ${a.timeSlot}`.localeCompare(`${b.date} ${b.timeSlot}`)),
    [store.saunaBookings, currentUser.id]
  );

  const pastSaunaCount = useMemo(
    () =>
      store.saunaBookings.filter(
        (b) => b.memberId === currentUser.id && b.status !== 'Upcoming'
      ).length,
    [store.saunaBookings, currentUser.id]
  );

  const upcomingLockers = useMemo(
    () =>
      store.lockerBookings
        .filter((b) => b.memberId === currentUser.id && b.status === 'Upcoming')
        .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)),
    [store.lockerBookings, currentUser.id]
  );

  const operationalLockersCount = useMemo(
    () => store.lockers.filter((l) => l.status === 'operational').length,
    [store.lockers]
  );

  const unifiedUpcoming = useMemo<UnifiedUpcomingItem[]>(() => {
    const items: UnifiedUpcomingItem[] = [];
    upcomingClasses.forEach((b) =>
      items.push({
        id: b.id,
        kind: 'Group Class',
        title: b.classTitle,
        date: b.date,
        time: b.time,
        subtitle: b.coach,
        location: b.location,
        status: b.status,
      })
    );
    upcomingPT.forEach((a) =>
      items.push({
        id: a.id,
        kind: 'Personal Training',
        title: `PT with Coach ${a.trainerName}`,
        date: a.date,
        time: a.startTime,
        subtitle: `${a.durationMin} min · ${a.packageType}`,
        location: 'Private Training Zone',
        status: a.status,
        ptRaw: a,
      })
    );
    upcomingYoga.forEach((y) =>
      items.push({
        id: y.id,
        kind: 'Yoga Appointment',
        title: y.style,
        date: y.date,
        time: y.startTime,
        subtitle: `${y.durationMin} min · ${y.instructor}`,
        location: y.location,
        status: y.status,
        yogaRaw: y,
      })
    );
    upcomingSauna.forEach((s) =>
      items.push({
        id: s.id,
        kind: 'Sauna Appointment',
        title: 'Complimentary Sauna Access',
        date: s.date,
        time: s.timeSlot,
        subtitle: `${store.saunaConfig.slotDurationMin} min · Thermal Recovery Suite`,
        location: 'Thermal Recovery Suite',
        status: s.status,
      })
    );
    upcomingLockers.forEach((l) =>
      items.push({
        id: l.id,
        kind: 'Locker',
        title: `Locker #${l.lockerNumber}`,
        date: l.date,
        time: `${l.startTime}–${l.endTime}`,
        subtitle: 'Free Online Reservation',
        location: Number(l.lockerNumber) <= 12 ? 'North Wing' : 'South Wing',
        status: l.status,
      })
    );

    return items.sort((a, b) => {
      const aKey = `${a.date} ${a.time}`;
      const bKey = `${b.date} ${b.time}`;
      return aKey.localeCompare(bKey);
    });
  }, [
    upcomingClasses,
    upcomingPT,
    upcomingYoga,
    upcomingSauna,
    upcomingLockers,
    store.saunaConfig.slotDurationMin,
  ]);

  const totalUpcomingCount = unifiedUpcoming.length;

  const handleCancelSelected = () => {
    if (!selectedItem) return;
    let res;
    if (selectedItem.kind === 'Group Class') res = cancelClassBooking(selectedItem.id);
    else if (selectedItem.kind === 'Personal Training') res = cancelPT(selectedItem.id);
    else if (selectedItem.kind === 'Yoga Appointment') res = cancelYoga(selectedItem.id);
    else if (selectedItem.kind === 'Sauna Appointment') res = cancelSauna(selectedItem.id);
    else res = cancelLocker(selectedItem.id);

    setActionMsg({ ok: res.ok, text: res.message });
    if (res.ok) setSelectedItem(null);
  };

  return (
    <div className="space-y-8">
      {/* Greeting Header + Digital Membership Card */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        <div className="xl:col-span-7 rounded-xl border border-[#252823]/10 bg-white p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6F8569]">
              Member Sanctuary · Brave Gym &amp; Fitness
            </p>
            <h1 className="mt-2 font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#123F2D] uppercase [text-wrap:balance]">
              WELCOME BACK, {currentUser.name}
            </h1>
            <p className="mt-2 text-base text-[#252823]/75">
              Let&apos;s make today stronger.
            </p>
            <div className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-lg border border-[#252823]/10 bg-[#F8F7F3] px-3.5 py-2 text-xs text-[#123F2D] tabular-nums">
              <Clock className="w-3.5 h-3.5 text-[#6F8569] shrink-0" />
              <span className="font-semibold">
                Daily Studio Hours: {STUDIO_HOURS_24H}
              </span>
              <span className="text-[#252823]/35" aria-hidden="true">
                ·
              </span>
              <span>{STUDIO_HOURS_12H}</span>
              <span className="text-[#252823]/35" aria-hidden="true">
                ·
              </span>
              <span className="font-semibold text-[#6F8569]">{STUDIO_HOURS_STATUS}</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#252823]/10">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6F8569] mb-3">
              Quick Actions
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isExpired}
                onClick={() => setActivePage('classes')}
                className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-xs font-semibold tracking-wider uppercase hover:bg-[#0B2E21] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Dumbbell className="w-4 h-4 shrink-0" />
                  <span>BOOK A CLASS</span>
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              <button
                type="button"
                disabled={isExpired}
                onClick={() => setActivePage('pt-schedule')}
                className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-xs font-semibold tracking-wider uppercase hover:bg-[#0B2E21] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 shrink-0" />
                  <span>BOOK PERSONAL TRAINER</span>
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              <button
                type="button"
                disabled={isExpired}
                onClick={() => setActivePage('yoga')}
                className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-lg border border-[#2C4A3E]/25 bg-[#E8F0E8]/65 text-[#245B3B] text-xs font-semibold tracking-wider uppercase hover:bg-[#D0E3D2] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>BOOK YOGA APPOINTMENT</span>
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              <button
                type="button"
                disabled={isExpired}
                onClick={() => setActivePage('sauna')}
                className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-lg border border-[#8C5227]/30 bg-[#FBF6EF] text-[#5C3A21] text-xs font-semibold tracking-wider uppercase hover:bg-[#F3E5D3] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Flame className="w-4 h-4 shrink-0" />
                  <span>BOOK SAUNA</span>
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              <button
                type="button"
                disabled={isExpired}
                onClick={() => setActivePage('lockers')}
                className="sm:col-span-2 flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-[#123F2D]/20 bg-[#EAE2D5]/50 text-[#123F2D] text-xs font-semibold tracking-wider uppercase hover:bg-[#EAE2D5] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <KeyRound className="w-4 h-4 shrink-0" />
                  <span>BOOK LOCKER (FREE ONLINE)</span>
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* Digital Membership Card */}
        <div
          className={`xl:col-span-5 rounded-xl border ${memberTheme.borderClass} ${memberTheme.cardBgClass} p-6 sm:p-8 flex flex-col justify-between shadow-sm`}
        >
          <div className="flex items-start justify-between gap-4">
            <BraveLogo variant="dark" compact />
            <div className="text-right">
              <div
                className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${memberTheme.secondaryTextClass}`}
              >
                Membership Status
              </div>
              <div className="mt-1.5 flex justify-end">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase ${memberTheme.badgeClass}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${memberTheme.dotClass}`} />
                  {memberTheme.badgeLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="my-8 space-y-1">
            <div
              className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${memberTheme.secondaryTextClass}`}
            >
              Cardholder
            </div>
            <div
              className={`font-display text-2xl font-bold tracking-tight ${memberTheme.accentTextClass}`}
            >
              {currentUser.name}
            </div>
            <div
              className={`font-mono text-sm font-semibold tracking-widest pt-1 ${memberTheme.accentTextClass}`}
            >
              {currentUser.membershipId}
            </div>
          </div>

          <div
            className={`pt-4 border-t ${memberTheme.dividerClass} grid grid-cols-2 gap-4 text-xs`}
          >
            <div>
              <div
                className={`uppercase tracking-wider text-[10px] font-semibold ${memberTheme.secondaryTextClass}`}
              >
                Category
              </div>
              <div className={`font-semibold mt-0.5 ${memberTheme.accentTextClass}`}>
                {currentUser.category} Member
              </div>
            </div>
            <div className="text-right">
              <div
                className={`uppercase tracking-wider text-[10px] font-semibold ${memberTheme.secondaryTextClass}`}
              >
                Expiration Date
              </div>
              <div
                className={`font-semibold tabular-nums mt-0.5 ${memberTheme.accentTextClass}`}
              >
                {currentUser.expirationDate}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 Dashboard Metrics */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          {
            label: 'Upcoming Appointments',
            value: totalUpcomingCount,
            page: 'bookings' as const,
          },
          {
            label: 'PT Sessions Remaining',
            value: ptRemaining,
            page: 'pt-schedule' as const,
          },
          {
            label: 'Yoga Appointments',
            value: upcomingYoga.length,
            page: 'yoga' as const,
          },
          {
            label: 'Sauna Appointments',
            value: upcomingSauna.length,
            page: 'sauna' as const,
          },
          {
            label: 'Classes Booked',
            value: upcomingClasses.length,
            page: 'classes' as const,
          },
          {
            label: 'Locker Reservations',
            value: upcomingLockers.length,
            page: 'lockers' as const,
          },
        ].map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={() => setActivePage(stat.page)}
            className="text-left rounded-xl border border-[#252823]/10 bg-white p-5 hover:border-[#123F2D]/35 transition-colors cursor-pointer"
          >
            <div className="font-display text-3xl font-bold tabular-nums text-[#123F2D]">
              {stat.value}
            </div>
            <div className="mt-1.5 text-xs font-medium text-[#252823]/70">{stat.label}</div>
          </button>
        ))}
      </section>

      {/* Appointment Categories: Personal Training (PT), Sauna, Yoga & Locker */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6F8569]">
              Member Appointment Categories
            </p>
            <h2 className="mt-0.5 font-display text-xl sm:text-2xl font-bold tracking-tight text-[#123F2D]">
              Personal Training, Sauna, Yoga &amp; Locker Booking
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setActivePage('bookings')}
            className="text-xs font-semibold text-[#123F2D] hover:underline cursor-pointer"
          >
            Manage All Appointments
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* 1. Personal Training (PT) — Premium Black, White, Silver & Subtle Red */}
          <article className="rounded-xl border border-[#272A2E] bg-[#111312] text-white overflow-hidden flex flex-col justify-between shadow-sm">
            <div>
              <div className="relative aspect-[16/10] overflow-hidden bg-[#1D2024]">
                <SafeImage
                  src={BRAND_MEDIA.ptCoaching}
                  alt="Brave Gym 1-on-1 Personal Training session"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111312] via-[#111312]/25 to-transparent" />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#C93B3B] text-white text-[10px] font-bold uppercase tracking-wider">
                  Personal Training (PT)
                </span>
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-white/90 text-[#111312] text-[10px] font-bold uppercase tracking-wider tabular-nums">
                  {ptRemaining} Credits Left
                </span>
              </div>

              <div className="p-5 space-y-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">
                    1-on-1 Strength Coaching
                  </div>
                  <h3 className="mt-0.5 font-display text-lg font-bold text-white">
                    Personal Training Session
                  </h3>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/5 p-3.5 space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#D1D5DB]">
                    <span>Duration</span>
                    <span className="font-semibold text-white">
                      {store.policyConfig.ptDefaultDurationMin} min
                    </span>
                  </div>
                  <div className="flex justify-between text-[#D1D5DB]">
                    <span>Next Session</span>
                    <span className="font-semibold text-white tabular-nums">
                      {upcomingPT[0]
                        ? `${formatDisplayDate(upcomingPT[0].date)} · ${upcomingPT[0].startTime}`
                        : 'No session scheduled'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[#D1D5DB]">
                    <span>Status</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        upcomingPT[0]
                          ? 'bg-[#C93B3B]/20 text-[#FCA5A5]'
                          : 'bg-white/10 text-[#D1D5DB]'
                      }`}
                    >
                      {upcomingPT[0] ? upcomingPT[0].status : 'Open'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 flex items-center gap-2.5">
              <button
                type="button"
                disabled={isExpired}
                onClick={() => setActivePage('pt-schedule')}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white text-[#111312] text-xs font-bold uppercase tracking-wider hover:bg-[#E5E7EB] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <span>Schedule PT</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C93B3B]" />
              </button>
              <button
                type="button"
                onClick={() => setActivePage('trainers')}
                className="px-3.5 py-2.5 rounded-lg border border-white/20 text-[#E5E7EB] text-xs font-semibold hover:bg-white/10 transition-colors cursor-pointer"
              >
                Coaches
              </button>
            </div>
          </article>

          {/* 2. Sauna Appointment — Warm Cedar Wood Tones & Uploaded Wooden Sauna Cover */}
          <article className="rounded-xl border border-[#C8A882]/45 bg-[#FBF6EF] text-[#4A2E19] overflow-hidden flex flex-col justify-between shadow-sm">
            <div>
              <div className="relative aspect-[16/10] overflow-hidden bg-[#4A2E19]">
                <SafeImage
                  src={BRAND_MEDIA.saunaCover}
                  alt="Brave Gym members relaxing inside wooden sauna"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#4A2E19]/75 via-transparent to-transparent" />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#8C5227] text-white text-[10px] font-bold uppercase tracking-wider">
                  Sauna Appointment
                </span>
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-[#FBF6EF]/95 text-[#5C3A21] text-[10px] font-bold uppercase tracking-wider">
                  Complimentary
                </span>
              </div>

              <div className="p-5 space-y-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8C5227]">
                    Thermal Recovery Suite
                  </div>
                  <h3 className="mt-0.5 font-display text-lg font-bold text-[#4A2E19]">
                    Cedar Sauna Session
                  </h3>
                </div>

                <div className="rounded-lg border border-[#C8A882]/35 bg-white/80 p-3.5 space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#5C3A21]/80">
                    <span>Duration</span>
                    <span className="font-semibold text-[#4A2E19]">
                      {store.saunaConfig.slotDurationMin} min
                    </span>
                  </div>
                  <div className="flex justify-between text-[#5C3A21]/80">
                    <span>Next Booking</span>
                    <span className="font-semibold text-[#4A2E19] tabular-nums">
                      {upcomingSauna[0]
                        ? `${formatDisplayDate(upcomingSauna[0].date)} · ${upcomingSauna[0].timeSlot}`
                        : 'Select open slot'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[#5C3A21]/80">
                    <span>Status &amp; History</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        upcomingSauna[0]
                          ? 'bg-[#D0E3D2] text-[#245B3B]'
                          : 'bg-[#F8DFC0] text-[#8C5227]'
                      }`}
                    >
                      {upcomingSauna[0]
                        ? `${upcomingSauna[0].status} · ${pastSaunaCount} Past`
                        : `${pastSaunaCount} Past Sessions`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 flex items-center gap-2.5">
              <button
                type="button"
                disabled={isExpired}
                onClick={() => setActivePage('sauna')}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#8C5227] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#6E3F1C] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <span>Book Sauna</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </article>

          {/* 3. Yoga Appointment — Calming Wellness Tones & Uploaded Yoga Cover + Secondary Banner */}
          <article className="rounded-xl border border-[#2C4A3E]/20 bg-[#F4F7F4] text-[#264538] overflow-hidden flex flex-col justify-between shadow-sm">
            <div>
              <div className="relative aspect-[16/10] overflow-hidden bg-[#DCE7DF]">
                <SafeImage
                  src={BRAND_MEDIA.yogaCover}
                  alt="Brave Gym Yoga and Pilates ring flow inside studio"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#264538]/75 via-transparent to-transparent" />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#264538] text-white text-[10px] font-bold uppercase tracking-wider">
                  Yoga Appointment
                </span>
                <div className="absolute bottom-2.5 right-2.5 w-14 h-10 rounded-md overflow-hidden border border-white/80 shadow-sm">
                  <SafeImage
                    src={BRAND_MEDIA.yogaBanner}
                    alt="Mat yoga movement preview"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5B7567]">
                    Mind &amp; Flow Studio
                  </div>
                  <h3 className="mt-0.5 font-display text-lg font-bold text-[#264538]">
                    Yoga &amp; Mat Flow
                  </h3>
                </div>

                <div className="rounded-lg border border-[#2C4A3E]/15 bg-white/85 p-3.5 space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#264538]/75">
                    <span>Duration</span>
                    <span className="font-semibold text-[#264538]">50–60 min</span>
                  </div>
                  <div className="flex justify-between text-[#264538]/75">
                    <span>Next Session</span>
                    <span className="font-semibold text-[#264538] tabular-nums text-right">
                      {upcomingYoga[0]
                        ? `${formatDisplayDate(upcomingYoga[0].date)} · ${upcomingYoga[0].startTime}`
                        : 'No session booked'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[#264538]/75">
                    <span>Booking Status</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        upcomingYoga[0]
                          ? 'bg-[#D0E3D2] text-[#245B3B]'
                          : 'bg-[#E3EDE7] text-[#264538]'
                      }`}
                    >
                      {upcomingYoga[0] ? upcomingYoga[0].status : `${store.yogaTemplates.length} Styles`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 flex items-center gap-2.5">
              <button
                type="button"
                disabled={isExpired}
                onClick={() => setActivePage('yoga')}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#264538] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#1C352A] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <span>Book Yoga Session</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </article>

          {/* 4. Locker Appointment — BRAVE Black, Silver, White & Subtle Red + Uploaded Locker Cover */}
          <article className="rounded-xl border border-[#D1D5DB] bg-white text-[#111312] overflow-hidden flex flex-col justify-between shadow-sm">
            <div>
              <div className="relative aspect-[16/10] overflow-hidden bg-[#1D2024]">
                <SafeImage
                  src={BRAND_MEDIA.lockerCover}
                  alt="Brave Gym Locker Room"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111312]/80 via-transparent to-transparent" />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#111312] text-white text-[10px] font-bold uppercase tracking-wider">
                  Locker Appointment
                </span>
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-white/95 text-[#111312] text-[10px] font-bold uppercase tracking-wider">
                  Free Online
                </span>
              </div>

              <div className="p-5 space-y-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                    North &amp; South Wing
                  </div>
                  <h3 className="mt-0.5 font-display text-lg font-bold text-[#111312]">
                    Personal Locker Access
                  </h3>
                </div>

                <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3.5 space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#4B5563]">
                    <span>My Locker</span>
                    <span className="font-mono font-bold text-[#111312]">
                      {upcomingLockers[0]
                        ? `#${upcomingLockers[0].lockerNumber}`
                        : `${operationalLockersCount} Operational`}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#4B5563]">
                    <span>Next Window</span>
                    <span className="font-semibold text-[#111312] tabular-nums text-right">
                      {upcomingLockers[0]
                        ? `${formatDisplayDate(upcomingLockers[0].date)} · ${upcomingLockers[0].startTime}`
                        : 'Select time window'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[#4B5563]">
                    <span>Booking Status</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        upcomingLockers[0]
                          ? 'bg-[#111312] text-white'
                          : 'bg-[#FBE7E7] text-[#AC4242]'
                      }`}
                    >
                      {upcomingLockers[0] ? upcomingLockers[0].status : 'Not Assigned'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 flex items-center gap-2.5">
              <button
                type="button"
                disabled={isExpired}
                onClick={() => setActivePage('lockers')}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#111312] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#272A2E] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <span>{upcomingLockers[0] ? 'Manage Locker' : 'Book Locker'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#E5E7EB]" />
              </button>
            </div>
          </article>
        </div>
      </section>

      {actionMsg && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            actionMsg.ok
              ? 'border-[#123F2D]/25 bg-[#EAE2D5]/55 text-[#123F2D]'
              : 'border-[#9E2A2B]/30 bg-[#FCEEEE] text-[#7A1E1F]'
          }`}
        >
          {actionMsg.text}
        </div>
      )}

      {/* MY UPCOMING APPOINTMENTS */}
      <section className="rounded-xl border border-[#252823]/10 bg-white overflow-hidden">
        <div className="px-6 py-5 border-b border-[#252823]/10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight text-[#123F2D] uppercase">
              MY UPCOMING APPOINTMENTS
            </h2>
            <p className="text-xs text-[#252823]/65 mt-0.5">
              Chronological schedule across classes, personal training, sauna, and lockers. Click any card for details.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActivePage('pt-schedule')}
              className="text-xs font-semibold text-[#123F2D] hover:underline cursor-pointer"
            >
              Open PT Calendar
            </button>
            <span className="text-[#252823]/20">|</span>
            <button
              type="button"
              onClick={() => setActivePage('bookings')}
              className="text-xs font-semibold text-[#123F2D] hover:underline cursor-pointer"
            >
              View All Bookings
            </button>
          </div>
        </div>

        {unifiedUpcoming.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-medium text-[#252823]/75">
              You have no upcoming appointments scheduled yet.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-1">
              <button
                type="button"
                disabled={isExpired}
                onClick={() => setActivePage('classes')}
                className="px-4 py-2 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-xs font-semibold hover:bg-[#0B2E21] disabled:opacity-45 cursor-pointer"
              >
                Browse Group Classes
              </button>
              <button
                type="button"
                disabled={isExpired}
                onClick={() => setActivePage('pt-schedule')}
                className="px-4 py-2 rounded-lg border border-[#123F2D]/25 text-[#123F2D] text-xs font-semibold hover:bg-[#EAE2D5]/50 disabled:opacity-45 cursor-pointer"
              >
                Schedule Personal Training
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#252823]/10">
            {unifiedUpcoming.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedItem(item)}
                className="w-full text-left px-6 py-4 hover:bg-[#F8F7F3] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#6F8569] font-medium">
                    <span className="font-mono text-[#252823]/60">{item.id}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#123F2D] font-semibold">{item.kind}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.location}</span>
                  </div>
                  <div className="font-display text-base font-bold text-[#252823] truncate">
                    {item.title}
                  </div>
                  <div className="text-xs text-[#252823]/70">{item.subtitle}</div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="sm:text-right">
                    <div className="text-sm font-semibold text-[#123F2D] tabular-nums">
                      {formatDisplayDate(item.date)}
                    </div>
                    <div className="text-xs text-[#252823]/70 tabular-nums">{item.time}</div>
                  </div>
                  <span className="text-xs font-semibold text-[#123F2D] underline underline-offset-4">
                    Details
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* About Brave Team & Studio Facilities */}
      <section className="space-y-6">
        <div className="rounded-xl border border-[#252823]/10 bg-white overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 min-h-[260px] overflow-hidden bg-[#EAE2D5]">
            <SafeImage
              src={BRAND_MEDIA.teamCommunity}
              alt="Brave Gym & Fitness coaches and community inside the studio"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6F8569]">
                About Brave Gym &amp; Fitness
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#123F2D] [text-wrap:balance]">
                A training floor built around community, coaching, and real progress.
              </h2>
              <p className="mt-3 text-sm text-[#252823]/75 leading-relaxed">
                From attentive 1-on-1 personal training to energizing small-group classes, our coaches know every member by name and build sessions around safe mechanics, strength longevity, and recovery.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#252823]/10">
              <button
                type="button"
                onClick={() => setActivePage('trainers')}
                className="px-4 py-2.5 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-xs font-semibold hover:bg-[#0B2E21] transition-colors cursor-pointer"
              >
                Meet Our Coaches
              </button>
              <button
                type="button"
                onClick={() => setActivePage('classes')}
                className="px-4 py-2.5 rounded-lg border border-[#123F2D]/25 text-[#123F2D] text-xs font-semibold hover:bg-[#EAE2D5]/60 transition-colors cursor-pointer"
              >
                Explore Class Schedule
              </button>
            </div>
          </div>
        </div>

        {/* Facilities & Member Spaces */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              title: 'Strength & Power Racks',
              kicker: 'Main Conditioning Floor',
              desc: 'Competition barbells, squat racks, Insight cable towers, and full dumbbell runs.',
              img: BRAND_MEDIA.squatRackFloor,
              actionLabel: 'Book Personal Trainer',
              page: 'trainers' as const,
            },
            {
              title: 'Group Studio & Core Flow',
              kicker: 'Studio Classes',
              desc: 'Sunlit mat and functional floor hosting Yoga, Mat Pilates, S&C, and Circuit Training.',
              img: BRAND_MEDIA.groupCoreClass,
              actionLabel: 'View Group Classes',
              page: 'classes' as const,
            },
            {
              title: 'Cardio & Recovery Lounge',
              kicker: 'Club Amenities',
              desc: 'Plant-lined treadmill deck, warm oak lounge seating, complimentary sauna, and free online lockers.',
              img: BRAND_MEDIA.cardioZone,
              actionLabel: 'Reserve Sauna & Lockers',
              page: 'sauna' as const,
            },
          ].map((zone) => (
            <article
              key={zone.title}
              className="group rounded-xl border border-[#252823]/10 bg-white overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[4/3] overflow-hidden bg-[#EAE2D5]">
                  <SafeImage
                    src={zone.img}
                    alt={zone.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6F8569]">
                    {zone.kicker}
                  </div>
                  <h3 className="mt-1 font-display text-lg font-bold text-[#123F2D]">
                    {zone.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-[#252823]/70 leading-relaxed">{zone.desc}</p>
                </div>
              </div>
              <div className="px-5 pb-5">
                <button
                  type="button"
                  onClick={() => setActivePage(zone.page)}
                  className="text-xs font-semibold text-[#123F2D] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{zone.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* External Club Links with Club Entrance Visual */}
      <section className="rounded-xl border border-[#252823]/10 bg-[#EAE2D5]/55 overflow-hidden grid grid-cols-1 md:grid-cols-12 items-center">
        <div className="md:col-span-3 h-40 md:h-full min-h-[140px] bg-[#0B2E21]">
          <SafeImage
            src={BRAND_MEDIA.clubExterior}
            alt="Brave Gym & Fitness entrance facade"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="md:col-span-9 px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-bold text-[#123F2D]">
              Connect with Brave Gym &amp; Fitness
            </h3>
            <p className="text-xs text-[#252823]/75 mt-0.5 tabular-nums">
              Daily Studio Hours: {STUDIO_HOURS_24H} ({STUDIO_HOURS_12H} · {STUDIO_HOURS_STATUS}) · Concierge support via WhatsApp &amp; direct club directions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={EXTERNAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[#252823]/10 text-xs font-semibold text-[#123F2D] hover:border-[#123F2D] transition-colors"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>Instagram</span>
            </a>
            <a
              href={EXTERNAL_LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[#252823]/10 text-xs font-semibold text-[#123F2D] hover:border-[#123F2D] transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Contact via WhatsApp</span>
            </a>
            <a
              href={EXTERNAL_LINKS.maps}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#123F2D] text-xs font-semibold text-[#F8F7F3] hover:bg-[#0B2E21] transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Directions to Brave Gym</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </a>
          </div>
        </div>
      </section>

      {/* Appointment Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl border border-[#252823]/15 max-w-md w-full overflow-hidden shadow-xl">
            <div className="px-6 py-4 bg-[#123F2D] text-[#F8F7F3] flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-[#EAE2D5]/80">
                  {selectedItem.kind}
                </div>
                <h3 className="font-display text-lg font-bold">{selectedItem.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                aria-label="Close appointment details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-[#252823]/10">
                <span className="text-[#252823]/60">Booking ID</span>
                <span className="font-mono font-semibold">{selectedItem.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#252823]/10">
                <span className="text-[#252823]/60 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Date
                </span>
                <span className="font-semibold tabular-nums">
                  {formatDisplayDate(selectedItem.date)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#252823]/10">
                <span className="text-[#252823]/60 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Time
                </span>
                <span className="font-semibold tabular-nums">{selectedItem.time}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#252823]/10">
                <span className="text-[#252823]/60">Location</span>
                <span className="font-medium">{selectedItem.location}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#252823]/60">Details</span>
                <span className="font-medium text-right">{selectedItem.subtitle}</span>
              </div>
            </div>

            <div className="px-6 py-4 bg-[#F8F7F3] border-t border-[#252823]/10 flex flex-wrap items-center justify-end gap-2">
              {selectedItem.ptRaw && (
                <button
                  type="button"
                  onClick={() => {
                    const appt = selectedItem.ptRaw!;
                    setSelectedItem(null);
                    setRescheduleAppt(appt);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-xs font-semibold hover:bg-[#0B2E21] cursor-pointer"
                >
                  RESCHEDULE
                </button>
              )}
              {selectedItem.yogaRaw && (
                <button
                  type="button"
                  onClick={() => {
                    const appt = selectedItem.yogaRaw!;
                    setSelectedItem(null);
                    setRescheduleYogaAppt(appt);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#264538] text-white text-xs font-semibold hover:bg-[#1C352A] cursor-pointer"
                >
                  RESCHEDULE
                </button>
              )}
              <button
                type="button"
                onClick={handleCancelSelected}
                className="px-4 py-2 rounded-lg border border-[#9E2A2B]/30 text-[#9E2A2B] bg-[#FCEEEE] text-xs font-semibold hover:bg-[#f8dede] cursor-pointer"
              >
                Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {rescheduleAppt && (
        <PTRescheduleModal
          appointment={rescheduleAppt}
          onClose={() => setRescheduleAppt(null)}
          onSuccess={(updated) =>
            setActionMsg({
              ok: true,
              text: `Rescheduled ${updated.id} to ${updated.date} at ${updated.startTime} with Coach ${updated.trainerName}.`,
            })
          }
        />
      )}

      {rescheduleYogaAppt && (
        <YogaRescheduleModal
          appointment={rescheduleYogaAppt}
          onClose={() => setRescheduleYogaAppt(null)}
          onSuccess={(updated) =>
            setActionMsg({
              ok: true,
              text: `Rescheduled ${updated.style} to ${updated.date} at ${updated.startTime}.`,
            })
          }
        />
      )}
    </div>
  );
};
