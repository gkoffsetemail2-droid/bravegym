import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  KeyRound,
  Lock,
  RefreshCw,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useBrave } from '../context/BraveContext';
import { BRAND_MEDIA } from '../data/brandMedia';
import { Locker, LockerBooking } from '../types';
import {
  addDaysISO,
  formatDisplayDate,
  getTodayISO,
  STUDIO_CLOSE_HOUR,
  STUDIO_HOURS_12H,
  STUDIO_HOURS_24H,
  STUDIO_HOURS_STATUS,
  STUDIO_OPEN_HOUR,
  timeToMinutes,
} from '../utils/dateUtils';
import { SafeImage } from './BraveLogo';

export const LockersPage: React.FC = () => {
  const {
    store,
    currentUser,
    isLockerAvailableForWindow,
    bookLocker,
    changeLocker,
    cancelLocker,
  } = useBrave();

  const todayISO = getTodayISO();
  const [date, setDate] = useState<string>(addDaysISO(todayISO, 1));
  const [startTime, setStartTime] = useState<string>('09:30');
  const [endTime, setEndTime] = useState<string>('11:30');
  const [wingFilter, setWingFilter] = useState<'All' | 'North Wing' | 'South Wing'>('All');

  // Confirmation modal target & Change Locker mode
  const [confirmLockerObj, setConfirmLockerObj] = useState<Locker | null>(null);
  const [changingBooking, setChangingBooking] = useState<LockerBooking | null>(null);
  const [confirmed, setConfirmed] = useState<LockerBooking | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  if (!currentUser) return null;

  const isExpired = currentUser.status === 'Expired';
  const validTimeRange = timeToMinutes(endTime) > timeToMinutes(startTime);

  const timeOptions = useMemo(() => {
    const opts: string[] = [];
    for (let h = STUDIO_OPEN_HOUR; h <= STUDIO_CLOSE_HOUR; h++) {
      opts.push(`${String(h).padStart(2, '0')}:00`);
      if (h < STUDIO_CLOSE_HOUR) opts.push(`${String(h).padStart(2, '0')}:30`);
    }
    return opts;
  }, []);

  const memberLockerBookings = useMemo(
    () =>
      store.lockerBookings
        .filter((b) => b.memberId === currentUser.id)
        .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`)),
    [store.lockerBookings, currentUser.id]
  );

  const upcomingMemberLockers = useMemo(
    () =>
      memberLockerBookings
        .filter((b) => b.status === 'Upcoming')
        .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)),
    [memberLockerBookings]
  );

  const pastMemberLockers = useMemo(
    () => memberLockerBookings.filter((b) => b.status !== 'Upcoming'),
    [memberLockerBookings]
  );

  // Classify each locker for the active date/time window
  const getLockerWindowState = (
    locker: Locker
  ): {
    status: 'My Locker' | 'Available' | 'Reserved' | 'Occupied';
    booking?: LockerBooking;
  } => {
    if (locker.status === 'maintenance') {
      return { status: 'Occupied' };
    }

    const reqStart = timeToMinutes(startTime);
    const reqEnd = timeToMinutes(endTime);

    const overlapping = store.lockerBookings.find((b) => {
      if (
        changingBooking &&
        b.id === changingBooking.id
      ) {
        return false;
      }
      if (b.lockerNumber !== locker.number || b.date !== date || b.status !== 'Upcoming') {
        return false;
      }
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      return reqStart < bEnd && bStart < reqEnd;
    });

    if (overlapping) {
      if (overlapping.memberId === currentUser.id) {
        return { status: 'My Locker', booking: overlapping };
      }
      return { status: 'Reserved', booking: overlapping };
    }

    if (
      validTimeRange &&
      isLockerAvailableForWindow(locker.number, date, startTime, endTime, changingBooking?.id)
    ) {
      return { status: 'Available' };
    }

    return { status: 'Occupied' };
  };

  const summaryCounts = useMemo(() => {
    let available = 0;
    let myLocker = 0;
    let reserved = 0;
    let occupied = 0;
    store.lockers.forEach((l) => {
      const state = getLockerWindowState(l).status;
      if (state === 'Available') available++;
      else if (state === 'My Locker') myLocker++;
      else if (state === 'Reserved') reserved++;
      else occupied++;
    });
    return { available, myLocker, reserved, occupied };
  }, [store.lockers, store.lockerBookings, date, startTime, endTime, currentUser.id, changingBooking]);

  const handleOpenChangeMode = (booking: LockerBooking) => {
    setFeedback(null);
    setChangingBooking(booking);
    setDate(booking.date);
    setStartTime(booking.startTime);
    setEndTime(booking.endTime);
  };

  const handleConfirmModalSubmit = () => {
    if (!confirmLockerObj) return;
    setFeedback(null);

    if (changingBooking) {
      const res = changeLocker(
        changingBooking.id,
        confirmLockerObj.number,
        date,
        startTime,
        endTime
      );
      setFeedback({ ok: res.ok, text: res.message });
      if (res.ok && res.data) {
        setConfirmed(res.data);
        setChangingBooking(null);
        setConfirmLockerObj(null);
      }
      return;
    }

    const res = bookLocker(confirmLockerObj.number, date, startTime, endTime);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok && res.data) {
      setConfirmed(res.data);
      setConfirmLockerObj(null);
    }
  };

  const handleCancel = (id: string) => {
    setFeedback(null);
    const res = cancelLocker(id);
    setFeedback({ ok: res.ok, text: res.message });
    if (confirmed?.id === id) setConfirmed(null);
    if (changingBooking?.id === id) setChangingBooking(null);
  };

  const northLockers = store.lockers.filter((l) => l.zone === 'North Wing');
  const southLockers = store.lockers.filter((l) => l.zone === 'South Wing');

  const renderLockerGrid = (list: Locker[], title: string) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4B5563]">
          {title}
        </h3>
        <span className="text-[11px] text-[#6B7280] tabular-nums">{list.length} Lockers</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {list.map((locker) => {
          const state = getLockerWindowState(locker);
          const isAvailable = state.status === 'Available' && !isExpired && validTimeRange;
          const isMyLocker = state.status === 'My Locker';
          const isReserved = state.status === 'Reserved';
          const isOccupied = state.status === 'Occupied';

          return (
            <button
              key={locker.number}
              type="button"
              disabled={!isAvailable}
              onClick={() => isAvailable && setConfirmLockerObj(locker)}
              className={`rounded-xl border p-3.5 text-left transition-all flex flex-col justify-between gap-2.5 ${
                isMyLocker
                  ? 'border-[#111312] bg-[#111312] text-white cursor-default shadow-sm'
                  : isOccupied
                  ? 'border-[#C93B3B]/30 bg-[#FBE7E7]/80 text-[#AC4242] cursor-not-allowed'
                  : isReserved
                  ? 'border-[#D1D5DB] bg-[#ECEEF1] text-[#4B5563] cursor-not-allowed'
                  : isExpired || !validTimeRange
                  ? 'border-[#E5E7EB] bg-[#F9FAFB] text-[#9CA3AF] cursor-not-allowed'
                  : 'border-[#D1D5DB] bg-white text-[#111312] hover:border-[#111312] hover:bg-[#F9FAFB] cursor-pointer shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-base font-bold tabular-nums">
                  #{locker.number}
                </span>
                {isMyLocker ? (
                  <Lock className="w-3.5 h-3.5 text-[#E5E7EB]" />
                ) : isOccupied ? (
                  <ShieldAlert className="w-3.5 h-3.5 text-[#C93B3B]" />
                ) : (
                  <KeyRound className="w-3.5 h-3.5 opacity-60" />
                )}
              </div>

              <div className="space-y-1">
                <div
                  className={`text-[10px] uppercase tracking-wider ${
                    isMyLocker ? 'text-[#D1D5DB]' : 'opacity-70'
                  }`}
                >
                  {locker.size}
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isMyLocker
                        ? 'bg-white text-[#111312]'
                        : isOccupied
                        ? 'bg-[#F4D0D0] text-[#AC4242]'
                        : isReserved
                        ? 'bg-[#D1D5DB]/70 text-[#374151]'
                        : 'bg-[#F3F4F6] text-[#111312]'
                    }`}
                  >
                    {state.status}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Premium Locker Room Hero Cover */}
      <section className="rounded-xl border border-[#272A2E] bg-[#111312] text-white overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch shadow-sm">
        <div className="lg:col-span-5 min-h-[240px] sm:min-h-[280px] overflow-hidden bg-[#1D2024]">
          <SafeImage
            src={BRAND_MEDIA.lockerCover}
            alt="Brave Gym & Fitness Locker Room"
            className="w-full h-full object-cover object-center"
            fallbackLabel="Locker Sanctuary"
          />
        </div>
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">
              LOCKER APPOINTMENT · ONLINE RESERVATION FREE
            </p>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Locker Room Reservation &amp; Assignment
            </h1>
            <p className="mt-2 text-sm text-[#D1D5DB] leading-relaxed">
              Reserve your personal locker ahead of your workout. Online locker reservations are complimentary with active membership, with zero deposit required and live North &amp; South Wing availability.
            </p>
            <p className="mt-2.5 text-xs font-medium text-[#E5E7EB] tabular-nums">
              Daily Studio Hours: {STUDIO_HOURS_24H} ({STUDIO_HOURS_12H} · {STUDIO_HOURS_STATUS})
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10 text-xs">
            <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">Available</div>
              <div className="font-display text-xl font-bold text-white tabular-nums mt-0.5">
                {summaryCounts.available}
              </div>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">My Locker</div>
              <div className="font-display text-xl font-bold text-white tabular-nums mt-0.5">
                {upcomingMemberLockers.length}
              </div>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">Reserved</div>
              <div className="font-display text-xl font-bold text-[#D1D5DB] tabular-nums mt-0.5">
                {summaryCounts.reserved}
              </div>
            </div>
            <div className="rounded-lg bg-[#C93B3B]/15 border border-[#C93B3B]/30 px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-wider text-[#FCA5A5]">Occupied</div>
              <div className="font-display text-xl font-bold text-[#FCA5A5] tabular-nums mt-0.5">
                {summaryCounts.occupied}
              </div>
            </div>
          </div>
        </div>
      </section>

      {confirmed && (
        <div className="rounded-xl border border-[#111312] bg-[#111312] text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#E5E7EB] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs uppercase tracking-wider text-[#9CA3AF] font-semibold">
                Locker Reservation Confirmed · {confirmed.id}
              </div>
              <div className="font-display text-base font-bold mt-0.5">
                Locker #{confirmed.lockerNumber} · {formatDisplayDate(confirmed.date)} (
                {confirmed.startTime}–{confirmed.endTime})
              </div>
              <div className="text-xs text-[#D1D5DB]">
                Status: {confirmed.status} · Complimentary Online Member Benefit
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmed(null)}
            className="px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold cursor-pointer self-start"
          >
            Dismiss
          </button>
        </div>
      )}

      {feedback && !confirmed && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.ok
              ? 'border-[#D1D5DB] bg-[#F3F4F6] text-[#111312]'
              : 'border-[#C93B3B]/35 bg-[#FBE7E7] text-[#AC4242]'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* My Locker Section */}
      <section className="rounded-xl border border-[#D1D5DB] bg-white overflow-hidden shadow-xs">
        <div className="px-6 py-4 bg-[#F9FAFB] border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
              Assigned Locker Access
            </div>
            <h2 className="font-display text-lg font-bold text-[#111312]">My Locker</h2>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-[#111312] text-white text-[11px] font-bold uppercase tracking-wider tabular-nums">
            {upcomingMemberLockers.length} Active
          </span>
        </div>

        {upcomingMemberLockers.length === 0 ? (
          <div className="p-6 flex flex-wrap items-center justify-between gap-4 text-xs text-[#4B5563]">
            <span>
              You have no active locker reservation yet. Select a date, window, and any Available locker in the grid below.
            </span>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB]">
            {upcomingMemberLockers.map((b) => {
              const lockerMeta = store.lockers.find((l) => l.number === b.lockerNumber);
              const isBeingChanged = changingBooking?.id === b.id;
              return (
                <div
                  key={b.id}
                  className="p-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-[#111312] text-white flex flex-col items-center justify-center shrink-0">
                      <span className="text-[9px] uppercase tracking-wider text-[#9CA3AF]">
                        Locker
                      </span>
                      <span className="font-mono text-lg font-bold leading-none mt-0.5">
                        #{b.lockerNumber}
                      </span>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-base font-bold text-[#111312]">
                          {lockerMeta?.zone || (Number(b.lockerNumber) <= 12 ? 'North Wing' : 'South Wing')} ·{' '}
                          {lockerMeta?.size || 'Standard'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#111312] text-white text-[10px] font-bold uppercase tracking-wider">
                          {b.status}
                        </span>
                      </div>
                      <div className="text-xs text-[#4B5563] mt-1 tabular-nums flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#6B7280]" />
                          {formatDisplayDate(b.date)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#6B7280]" />
                          {b.startTime}–{b.endTime}
                        </span>
                        <span className="font-mono text-[#6B7280]">{b.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isExpired}
                      onClick={() =>
                        isBeingChanged ? setChangingBooking(null) : handleOpenChangeMode(b)
                      }
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-45 ${
                        isBeingChanged
                          ? 'bg-[#111312] text-white'
                          : 'border border-[#D1D5DB] bg-white text-[#111312] hover:bg-[#F3F4F6]'
                      }`}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{isBeingChanged ? 'Cancel Change' : 'Change Locker'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancel(b.id)}
                      className="px-3.5 py-2 rounded-lg border border-[#C93B3B]/35 bg-[#FBE7E7] text-[#AC4242] text-xs font-semibold hover:bg-[#f6d6d6] cursor-pointer"
                    >
                      Cancel Reservation
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Change Mode Banner */}
      {changingBooking && (
        <div className="rounded-xl border border-[#111312] bg-[#111312] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span>
            <strong>Changing Locker Reservation ({changingBooking.id}):</strong> Adjust the date or time window below if needed, then click any <strong>Available</strong> locker to switch from Locker #{changingBooking.lockerNumber}.
          </span>
          <button
            type="button"
            onClick={() => setChangingBooking(null)}
            className="px-3 py-1 rounded bg-white/15 hover:bg-white/25 font-semibold cursor-pointer"
          >
            Exit Change Mode
          </button>
        </div>
      )}

      {/* Interactive Locker Availability Map */}
      <section className="rounded-xl border border-[#D1D5DB] bg-white p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-1.5">
              Reservation Date
            </label>
            <input
              type="date"
              min={todayISO}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] px-3 py-2.5 text-sm tabular-nums text-[#111312] focus:outline-none focus:border-[#111312]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-1.5">
              Start Time
            </label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] px-3 py-2.5 text-sm tabular-nums text-[#111312] focus:outline-none focus:border-[#111312]"
            >
              {timeOptions.slice(0, -1).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-1.5">
              End Time
            </label>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] px-3 py-2.5 text-sm tabular-nums text-[#111312] focus:outline-none focus:border-[#111312]"
            >
              {timeOptions.slice(1).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-1.5">
              Locker Wing
            </label>
            <select
              value={wingFilter}
              onChange={(e) =>
                setWingFilter(e.target.value as 'All' | 'North Wing' | 'South Wing')
              }
              className="w-full rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] px-3 py-2.5 text-sm text-[#111312] focus:outline-none focus:border-[#111312]"
            >
              <option value="All">All Wings (01–24)</option>
              <option value="North Wing">North Wing (01–12)</option>
              <option value="South Wing">South Wing (13–24)</option>
            </select>
          </div>
        </div>

        {!validTimeRange && (
          <div className="rounded-lg border border-[#C93B3B]/35 bg-[#FBE7E7] px-4 py-2.5 text-xs text-[#AC4242] font-medium">
            End time must be later than start time to inspect locker availability.
          </div>
        )}

        {/* Subtle Status Legend */}
        <div className="flex flex-wrap items-center gap-5 text-xs text-[#4B5563] pt-3 border-t border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-white border border-[#D1D5DB] inline-block" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-[#111312] inline-block" />
            <span>My Locker</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-[#ECEEF1] border border-[#D1D5DB] inline-block" />
            <span>Reserved</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-[#FBE7E7] border border-[#C93B3B]/35 inline-block" />
            <span>Occupied / Unavailable</span>
          </div>
        </div>

        {/* Visual Locker Grids */}
        <div className="space-y-6">
          {(wingFilter === 'All' || wingFilter === 'North Wing') &&
            renderLockerGrid(northLockers, 'North Wing Lockers (01–12)')}
          {(wingFilter === 'All' || wingFilter === 'South Wing') &&
            renderLockerGrid(southLockers, 'South Wing Lockers (13–24)')}
        </div>
      </section>

      {/* Past / Cancelled Locker History */}
      {pastMemberLockers.length > 0 && (
        <section className="rounded-xl border border-[#D1D5DB] bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5E7EB] bg-[#F9FAFB]">
            <h2 className="font-display text-base font-bold text-[#111312]">
              Past &amp; Cancelled Locker History ({pastMemberLockers.length})
            </h2>
          </div>
          <div className="divide-y divide-[#E5E7EB]">
            {pastMemberLockers.map((b) => (
              <div
                key={b.id}
                className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-sm"
              >
                <div>
                  <div className="font-semibold text-[#111312] tabular-nums">
                    Locker #{b.lockerNumber} · {formatDisplayDate(b.date)} ({b.startTime}–
                    {b.endTime})
                  </div>
                  <div className="text-xs text-[#6B7280]">{b.id}</div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                    b.status === 'Cancelled'
                      ? 'bg-[#FBE7E7] text-[#AC4242]'
                      : 'bg-[#F3F4F6] text-[#4B5563]'
                  }`}
                >
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Booking Confirmation Modal */}
      {confirmLockerObj && (
        <div
          className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="locker-confirm-title"
        >
          <div className="bg-white rounded-xl border border-[#D1D5DB] max-w-md w-full overflow-hidden shadow-xl">
            <div className="px-6 py-4 bg-[#111312] text-white flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-[#9CA3AF]">
                  {changingBooking ? 'Confirm Locker Change' : 'Confirm Locker Reservation'}
                </div>
                <h3 id="locker-confirm-title" className="font-display text-lg font-bold">
                  Locker #{confirmLockerObj.number} · {confirmLockerObj.zone}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmLockerObj(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                aria-label="Close locker confirmation dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Locker Number</span>
                  <span className="font-mono font-bold text-[#111312]">
                    #{confirmLockerObj.number} ({confirmLockerObj.size})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Location</span>
                  <span className="font-semibold text-[#111312]">{confirmLockerObj.zone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Reservation Date</span>
                  <span className="font-semibold tabular-nums text-[#111312]">
                    {formatDisplayDate(date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Time Window</span>
                  <span className="font-semibold tabular-nums text-[#111312]">
                    {startTime}–{endTime}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#E5E7EB]">
                  <span className="text-[#6B7280]">Member Fee</span>
                  <span className="font-bold text-[#111312]">Free Online Reservation</span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmLockerObj(null)}
                  className="px-4 py-2.5 rounded-lg border border-[#D1D5DB] text-xs font-semibold text-[#111312] hover:bg-[#F3F4F6] cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmModalSubmit}
                  className="px-5 py-2.5 rounded-lg bg-[#111312] text-white text-xs font-semibold hover:bg-[#272A2E] cursor-pointer"
                >
                  {changingBooking ? 'Confirm Locker Change' : 'Confirm Reservation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
