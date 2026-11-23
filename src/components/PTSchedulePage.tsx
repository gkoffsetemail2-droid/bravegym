import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  RefreshCw,
  User,
  X,
} from 'lucide-react';
import { useBrave } from '../context/BraveContext';
import { PTAppointment } from '../types';
import {
  addDaysISO,
  formatDisplayDate,
  formatShortDate,
  getMonthCalendarDays,
  getStartOfWeek,
  getTodayISO,
  minutesToTime,
  parseISODate,
  STUDIO_CLOSE_HOUR,
  STUDIO_HOURS_12H,
  STUDIO_HOURS_24H,
  STUDIO_HOURS_STATUS,
  STUDIO_OPEN_HOUR,
  toISODate,
} from '../utils/dateUtils';
import { PTRescheduleModal } from './PTRescheduleModal';

type CalendarView = 'month' | 'week' | 'day';

export const PTSchedulePage: React.FC = () => {
  const {
    store,
    currentUser,
    setActivePage,
    preselectedTrainerId,
    setPreselectedTrainerId,
    getMemberPTCreditsRemaining,
    checkPTSlotAvailability,
    bookPT,
    cancelPT,
    canModifyPTAppointment,
  } = useBrave();

  const todayISO = getTodayISO();
  const [view, setView] = useState<CalendarView>('week');
  const [focusDate, setFocusDate] = useState<string>(addDaysISO(todayISO, 1));
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>(
    preselectedTrainerId || store.trainers[0]?.id || 'trn-clara'
  );

  // Selected appointment detail drawer
  const [detailAppt, setDetailAppt] = useState<PTAppointment | null>(null);
  const [rescheduleAppt, setRescheduleAppt] = useState<PTAppointment | null>(null);

  // Direct calendar booking modal state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookTrainerId, setBookTrainerId] = useState<string>(selectedTrainerId);
  const [bookDate, setBookDate] = useState<string>(focusDate);
  const [bookTime, setBookTime] = useState<string>('');
  const [bookDuration, setBookDuration] = useState<number>(
    store.policyConfig.ptDefaultDurationMin
  );
  const [bookPackageLabel, setBookPackageLabel] = useState<string>('PT Session Credit');
  const [bookNotes, setBookNotes] = useState<string>('');
  const [bookingSuccess, setBookingSuccess] = useState<PTAppointment | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bannerMsg, setBannerMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (preselectedTrainerId) {
      setSelectedTrainerId(preselectedTrainerId);
      setPreselectedTrainerId(null);
    }
  }, [preselectedTrainerId, setPreselectedTrainerId]);

  if (!currentUser) return null;

  const isExpired = currentUser.status === 'Expired';
  const creditsRemaining = getMemberPTCreditsRemaining(currentUser);
  const activeTrainers = store.trainers.filter((t) => t.active);
  const activeTrainer =
    selectedTrainerId === 'all'
      ? null
      : store.trainers.find((t) => t.id === selectedTrainerId) ?? activeTrainers[0];

  const focusDateObj = parseISODate(focusDate);
  const hoursList = useMemo(() => {
    const arr: number[] = [];
    for (let h = STUDIO_OPEN_HOUR; h < STUDIO_CLOSE_HOUR; h++) arr.push(h);
    return arr;
  }, []);

  const weekDays = useMemo(() => {
    const start = getStartOfWeek(focusDateObj);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return toISODate(d);
    });
  }, [focusDateObj]);

  const monthDays = useMemo(
    () => getMonthCalendarDays(focusDateObj.getFullYear(), focusDateObj.getMonth()),
    [focusDateObj]
  );

  // Keep detailAppt synced if store updates
  const liveDetailAppt = detailAppt
    ? store.ptAppointments.find((a) => a.id === detailAppt.id) ?? null
    : null;

  const handleNavigateRange = (direction: -1 | 1) => {
    if (view === 'day') {
      setFocusDate(addDaysISO(focusDate, direction));
    } else if (view === 'week') {
      setFocusDate(addDaysISO(focusDate, direction * 7));
    } else {
      const d = new Date(focusDateObj.getFullYear(), focusDateObj.getMonth() + direction, 1);
      setFocusDate(toISODate(d));
    }
  };

  const handleJumpToday = () => {
    setFocusDate(todayISO);
  };

  const displayedHeaderRange = useMemo(() => {
    if (view === 'month') {
      return focusDateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    if (view === 'week') {
      return `${formatShortDate(weekDays[0])} – ${formatShortDate(
        weekDays[6]
      )}, ${parseISODate(weekDays[6]).getFullYear()}`;
    }
    return formatDisplayDate(focusDate);
  }, [view, focusDate, focusDateObj, weekDays]);

  const openBookingFlow = (dateISO: string, timeStr = '', trainerIdOverride?: string) => {
    setBookingError(null);
    setBookingSuccess(null);
    setBookDate(dateISO);
    setBookTime(timeStr);
    setBookTrainerId(
      trainerIdOverride || (selectedTrainerId === 'all' ? activeTrainers[0]?.id : selectedTrainerId)
    );
    setBookDuration(store.policyConfig.ptDefaultDurationMin);
    setBookNotes('');
    setBookingModalOpen(true);
  };

  const modalTrainer = store.trainers.find((t) => t.id === bookTrainerId) ?? activeTrainers[0];

  const modalAvailableSlots = useMemo(() => {
    if (!modalTrainer) return [];
    const list: { time: string; available: boolean; message?: string }[] = [];
    for (let h = modalTrainer.startHour; h < modalTrainer.endHour; h++) {
      const time = minutesToTime(h * 60);
      const res = checkPTSlotAvailability(
        modalTrainer.id,
        bookDate,
        time,
        bookDuration,
        undefined,
        currentUser.id
      );
      list.push({ time, available: res.available, message: res.message });
    }
    return list;
  }, [modalTrainer, bookDate, bookDuration, currentUser.id, checkPTSlotAvailability]);

  const handleConfirmDirectBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    if (!bookTime) {
      setBookingError('Please choose an available time slot.');
      return;
    }
    const res = bookPT({
      trainerId: bookTrainerId,
      date: bookDate,
      startTime: bookTime,
      durationMin: bookDuration,
      packageType: bookPackageLabel,
      notes: bookNotes,
    });
    if (!res.ok) {
      setBookingError(res.message);
      return;
    }
    setBookingSuccess(res.data ?? null);
    setBannerMsg({ ok: true, text: res.message });
  };

  const handleCancelAppointment = (appt: PTAppointment) => {
    const res = cancelPT(appt.id);
    setBannerMsg({ ok: res.ok, text: res.message });
    if (res.ok) {
      setDetailAppt(null);
    }
  };

  // Helper to get member's appointments on a date
  const getMemberApptsForDate = (dateISO: string) =>
    store.ptAppointments.filter(
      (a) =>
        a.memberId === currentUser.id &&
        a.date === dateISO &&
        (selectedTrainerId === 'all' || a.trainerId === selectedTrainerId)
    );

  // Helper to classify a specific hour cell for a given trainer and date
  const getCellState = (trainerId: string, dateISO: string, hour: number) => {
    const timeStr = minutesToTime(hour * 60);
    // Check if member has an appointment at this hour (Upcoming, Completed, or Cancelled)
    const memberAppts = store.ptAppointments.filter(
      (a) =>
        a.memberId === currentUser.id &&
        a.date === dateISO &&
        a.startTime === timeStr &&
        (selectedTrainerId === 'all' || a.trainerId === trainerId)
    );
    const activeMemberAppt =
      memberAppts.find((a) => a.status === 'Upcoming') ??
      memberAppts.find((a) => a.status === 'Completed') ??
      memberAppts.find((a) => a.status === 'Cancelled');

    if (activeMemberAppt) {
      return {
        kind: activeMemberAppt.status as 'Upcoming' | 'Completed' | 'Cancelled',
        appt: activeMemberAppt,
      };
    }

    if (trainerId === 'all') {
      return { kind: 'all-empty' as const };
    }

    const avail = checkPTSlotAvailability(
      trainerId,
      dateISO,
      timeStr,
      store.policyConfig.ptDefaultDurationMin,
      undefined,
      currentUser.id
    );

    if (avail.available) {
      return { kind: 'available' as const };
    }
    if (avail.reason === 'trainer-booked' || avail.reason === 'member-conflict') {
      return {
        kind: 'occupied' as const,
        reason: avail.message,
      };
    }
    return {
      kind: 'unavailable' as const,
      reason: avail.message,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6F8569]">
            Interactive Calendar &amp; Rescheduling
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#123F2D]">
            MY PT SCHEDULE
          </h1>
          <p className="mt-1 text-sm text-[#252823]/70">
            Browse live trainer availability, book 1-on-1 sessions directly from the grid, and reschedule upcoming appointments.
          </p>
          <p className="mt-1.5 text-xs font-medium text-[#6F8569] tabular-nums">
            Daily Studio Hours: {STUDIO_HOURS_24H} · {STUDIO_HOURS_12H} · {STUDIO_HOURS_STATUS}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-[#252823]/10 bg-white px-4 py-2 text-xs tabular-nums">
            PT Credits Remaining:{' '}
            <strong className="text-[#123F2D] font-bold">{creditsRemaining}</strong>
          </div>
          {creditsRemaining <= 0 && (
            <button
              type="button"
              onClick={() => setActivePage('packages')}
              className="px-4 py-2.5 rounded-lg border border-[#123F2D]/25 bg-[#EAE2D5] text-[#123F2D] text-xs font-semibold cursor-pointer"
            >
              Buy PT Package
            </button>
          )}
          <button
            type="button"
            disabled={isExpired}
            onClick={() => openBookingFlow(focusDate)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-xs font-semibold hover:bg-[#0B2E21] disabled:opacity-45 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Book PT Session</span>
          </button>
        </div>
      </div>

      {bannerMsg && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm flex items-center justify-between gap-3 ${
            bannerMsg.ok
              ? 'border-[#123F2D]/25 bg-[#EAE2D5]/65 text-[#123F2D]'
              : 'border-[#9E2A2B]/30 bg-[#FCEEEE] text-[#7A1E1F]'
          }`}
        >
          <span>{bannerMsg.text}</span>
          <button
            type="button"
            onClick={() => setBannerMsg(null)}
            className="text-xs font-semibold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Calendar Controls Bar */}
      <div className="rounded-xl border border-[#252823]/10 bg-white p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Date Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleNavigateRange(-1)}
            className="p-2 rounded-lg border border-[#252823]/15 hover:bg-[#F8F7F3] cursor-pointer"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleJumpToday}
            className="px-3.5 py-2 rounded-lg border border-[#252823]/15 text-xs font-semibold hover:bg-[#F8F7F3] cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handleNavigateRange(1)}
            className="p-2 rounded-lg border border-[#252823]/15 hover:bg-[#F8F7F3] cursor-pointer"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <h2 className="ml-2 font-display text-base sm:text-lg font-bold text-[#123F2D] tabular-nums">
            {displayedHeaderRange}
          </h2>
        </div>

        {/* Trainer Filter + View Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label
              htmlFor="pt-cal-trainer-filter"
              className="text-xs font-semibold text-[#6F8569] whitespace-nowrap"
            >
              Trainer:
            </label>
            <select
              id="pt-cal-trainer-filter"
              value={selectedTrainerId}
              onChange={(e) => setSelectedTrainerId(e.target.value)}
              className="rounded-lg border border-[#252823]/15 bg-[#F8F7F3] px-3 py-2 text-xs font-semibold text-[#123F2D] focus:outline-none focus:border-[#123F2D]"
            >
              <option value="all">All Trainers (My Bookings)</option>
              {activeTrainers.map((t) => (
                <option key={t.id} value={t.id}>
                  Coach {t.name} ({t.tier === 'senior' ? 'Senior' : 'Club'})
                </option>
              ))}
            </select>
          </div>

          <div className="inline-flex items-center p-1 rounded-lg bg-[#EAE2D5]/70 border border-[#252823]/10">
            {(['month', 'week', 'day'] as CalendarView[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                  view === v
                    ? 'bg-[#123F2D] text-[#F8F7F3]'
                    : 'text-[#252823]/75 hover:text-[#123F2D]'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#252823]/80 px-1">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-[#123F2D] inline-block" />
          <span className="font-medium">My Upcoming PT</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-white border border-[#6F8569] inline-block" />
          <span>Available PT Slot</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-[#EAE2D5] border border-[#252823]/20 inline-block" />
          <span>Completed PT</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-[#FCEEEE] border border-[#9E2A2B]/30 inline-block" />
          <span>Cancelled PT</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-[#E5E2DA] inline-block" />
          <span>Unavailable / Occupied</span>
        </div>
      </div>

      {/* CALENDAR VIEWPORT */}
      {view === 'month' && (
        <div className="rounded-xl border border-[#252823]/10 bg-white overflow-hidden">
          <div className="grid grid-cols-7 border-b border-[#252823]/10 bg-[#F8F7F3]">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div
                key={d}
                className="py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-[#6F8569]"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((dayObj) => {
              const iso = toISODate(dayObj);
              const inMonth = dayObj.getMonth() === focusDateObj.getMonth();
              const isToday = iso === todayISO;
              const isSelected = iso === focusDate;
              const dayAppts = getMemberApptsForDate(iso);
              const isTrainerOff =
                activeTrainer && !activeTrainer.workingDays.includes(dayObj.getDay());
              const isPast = iso < todayISO;

              return (
                <div
                  key={iso}
                  onClick={() => {
                    setFocusDate(iso);
                    setView('day');
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setFocusDate(iso);
                      setView('day');
                    }
                  }}
                  className={`min-h-[104px] p-2.5 border-b border-r border-[#252823]/10 text-left flex flex-col justify-between transition-colors cursor-pointer ${
                    !inMonth ? 'bg-[#F8F7F3]/60 text-[#252823]/40' : 'bg-white hover:bg-[#F8F7F3]'
                  } ${isSelected ? 'ring-2 ring-inset ring-[#123F2D]' : ''}`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded ${
                        isToday ? 'bg-[#123F2D] text-[#F8F7F3]' : ''
                      }`}
                    >
                      {dayObj.getDate()}
                    </span>
                    {!isPast && !isTrainerOff && inMonth && (
                      <span className="text-[10px] text-[#6F8569] font-medium">Open</span>
                    )}
                    {isTrainerOff && inMonth && (
                      <span className="text-[10px] text-[#252823]/35">Off</span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1.5">
                    {dayAppts.slice(0, 2).map((appt) => (
                      <button
                        key={appt.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailAppt(appt);
                        }}
                        className={`w-full text-left px-1.5 py-1 rounded text-[10px] font-semibold truncate cursor-pointer ${
                          appt.status === 'Upcoming'
                            ? 'bg-[#123F2D] text-[#F8F7F3]'
                            : appt.status === 'Completed'
                            ? 'bg-[#EAE2D5] text-[#252823]'
                            : 'bg-[#FCEEEE] text-[#9E2A2B] line-through'
                        }`}
                      >
                        {appt.startTime} · {appt.trainerName}
                      </button>
                    ))}
                    {dayAppts.length > 2 && (
                      <div className="text-[10px] font-medium text-[#6F8569]">
                        +{dayAppts.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'week' && (
        <div className="rounded-xl border border-[#252823]/10 bg-white overflow-x-auto">
          <div className="min-w-[820px]">
            {/* Week Header */}
            <div className="grid grid-cols-8 border-b border-[#252823]/10 bg-[#F8F7F3]">
              <div className="p-3 text-xs font-semibold text-[#6F8569] uppercase tracking-wider">
                Time
              </div>
              {weekDays.map((iso) => {
                const dt = parseISODate(iso);
                const isToday = iso === todayISO;
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => {
                      setFocusDate(iso);
                      setView('day');
                    }}
                    className={`p-3 text-center border-l border-[#252823]/10 hover:bg-[#EAE2D5]/40 cursor-pointer ${
                      iso === focusDate ? 'bg-[#EAE2D5]/55' : ''
                    }`}
                  >
                    <div className="text-[11px] uppercase tracking-wider text-[#6F8569] font-semibold">
                      {dt.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div
                      className={`mt-0.5 text-sm font-bold tabular-nums inline-block px-2 py-0.5 rounded ${
                        isToday ? 'bg-[#123F2D] text-[#F8F7F3]' : 'text-[#123F2D]'
                      }`}
                    >
                      {dt.getDate()}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Week Hourly Grid */}
            <div className="divide-y divide-[#252823]/10">
              {hoursList.map((hour) => {
                const timeStr = minutesToTime(hour * 60);
                return (
                  <div key={hour} className="grid grid-cols-8">
                    <div className="px-3 py-3 text-xs font-mono font-medium text-[#252823]/65 tabular-nums bg-[#F8F7F3]/50">
                      {timeStr}
                    </div>
                    {weekDays.map((iso) => {
                      const state = getCellState(selectedTrainerId, iso, hour);

                      if (state.kind === 'Upcoming' || state.kind === 'Completed' || state.kind === 'Cancelled') {
                        const a = state.appt;
                        return (
                          <div key={iso} className="p-1.5 border-l border-[#252823]/10">
                            <button
                              type="button"
                              onClick={() => setDetailAppt(a)}
                              className={`w-full h-full rounded-md px-2 py-1.5 text-left text-[11px] font-semibold cursor-pointer transition-opacity hover:opacity-90 ${
                                a.status === 'Upcoming'
                                  ? 'bg-[#123F2D] text-[#F8F7F3]'
                                  : a.status === 'Completed'
                                  ? 'bg-[#EAE2D5] text-[#252823]'
                                  : 'bg-[#FCEEEE] text-[#9E2A2B] border border-[#9E2A2B]/25'
                              }`}
                            >
                              <div className="truncate">Coach {a.trainerName}</div>
                              <div className="text-[10px] opacity-80">{a.status}</div>
                            </button>
                          </div>
                        );
                      }

                      if (state.kind === 'available') {
                        return (
                          <div key={iso} className="p-1.5 border-l border-[#252823]/10">
                            <button
                              type="button"
                              disabled={isExpired}
                              onClick={() => openBookingFlow(iso, timeStr)}
                              className="w-full h-full min-h-[42px] rounded-md border border-dashed border-[#6F8569]/45 text-[11px] font-medium text-[#123F2D] hover:bg-[#EAE2D5]/55 hover:border-[#123F2D] disabled:opacity-40 transition-colors cursor-pointer"
                            >
                              Available
                            </button>
                          </div>
                        );
                      }

                      if (state.kind === 'occupied') {
                        return (
                          <div key={iso} className="p-1.5 border-l border-[#252823]/10">
                            <div
                              title={state.reason}
                              className="w-full h-full min-h-[42px] rounded-md bg-[#E5E2DA] px-2 py-1.5 text-[10px] font-medium text-[#252823]/55 flex items-center justify-center"
                            >
                              Occupied
                            </div>
                          </div>
                        );
                      }

                      if (state.kind === 'all-empty') {
                        return (
                          <div key={iso} className="p-1.5 border-l border-[#252823]/10">
                            <button
                              type="button"
                              disabled={isExpired || iso < todayISO}
                              onClick={() => openBookingFlow(iso, timeStr)}
                              className="w-full h-full min-h-[42px] rounded-md hover:bg-[#F8F7F3] text-[10px] text-[#252823]/30 hover:text-[#123F2D] cursor-pointer disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div key={iso} className="p-1.5 border-l border-[#252823]/10">
                          <div
                            title={state.reason}
                            className="w-full h-full min-h-[42px] rounded-md bg-[#F8F7F3] text-[10px] text-[#252823]/30 flex items-center justify-center"
                          >
                            —
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {view === 'day' && (
        <div className="rounded-xl border border-[#252823]/10 bg-white overflow-hidden">
          <div className="px-6 py-4 bg-[#F8F7F3] border-b border-[#252823]/10 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-bold text-[#123F2D]">
                {formatDisplayDate(focusDate)}
              </h3>
              <p className="text-xs text-[#252823]/65">
                {activeTrainer
                  ? `Showing Coach ${activeTrainer.name} (${String(
                      activeTrainer.startHour
                    ).padStart(2, '0')}:00–${String(activeTrainer.endHour).padStart(2, '0')}:00)`
                  : 'Showing your scheduled PT appointments across all trainers'}
              </p>
            </div>
            {activeTrainer && (
              <span className="text-xs text-[#6F8569] font-medium">
                Click any Available slot to book directly
              </span>
            )}
          </div>

          <div className="divide-y divide-[#252823]/10">
            {hoursList.map((hour) => {
              const timeStr = minutesToTime(hour * 60);
              const state = getCellState(selectedTrainerId, focusDate, hour);

              return (
                <div
                  key={hour}
                  className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="font-mono text-sm font-semibold tabular-nums text-[#123F2D] w-16 shrink-0">
                      {timeStr}
                    </span>

                    {state.kind === 'Upcoming' ||
                    state.kind === 'Completed' ||
                    state.kind === 'Cancelled' ? (
                      <button
                        type="button"
                        onClick={() => setDetailAppt(state.appt)}
                        className="text-left group cursor-pointer"
                      >
                        <div className="font-display text-sm font-bold text-[#123F2D] group-hover:underline">
                          My PT Session · Coach {state.appt.trainerName} ({state.appt.status})
                        </div>
                        <div className="text-xs text-[#252823]/65">
                          {state.appt.id} · {state.appt.durationMin} min ·{' '}
                          {state.appt.notes || state.appt.packageType}
                        </div>
                      </button>
                    ) : state.kind === 'available' ? (
                      <div>
                        <div className="text-sm font-semibold text-[#123F2D]">Available</div>
                        <div className="text-xs text-[#6F8569]">
                          Coach {activeTrainer?.name} is open for a 60-min session
                        </div>
                      </div>
                    ) : state.kind === 'occupied' ? (
                      <div>
                        <div className="text-sm font-medium text-[#252823]/60">Booked</div>
                        <div className="text-xs text-[#252823]/45">{state.reason}</div>
                      </div>
                    ) : state.kind === 'all-empty' ? (
                      <div className="text-xs text-[#252823]/55">
                        Select a specific trainer above to view slot-level availability
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-[#252823]/45">Unavailable</div>
                        <div className="text-xs text-[#252823]/40">{state.reason}</div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {(state.kind === 'Upcoming' ||
                      state.kind === 'Completed' ||
                      state.kind === 'Cancelled') && (
                      <>
                        <button
                          type="button"
                          onClick={() => setDetailAppt(state.appt)}
                          className="px-3.5 py-1.5 rounded-lg border border-[#252823]/15 text-xs font-semibold text-[#123F2D] hover:bg-[#F8F7F3] cursor-pointer"
                        >
                          Details
                        </button>
                        {state.kind === 'Upcoming' && (
                          <button
                            type="button"
                            onClick={() => setRescheduleAppt(state.appt)}
                            className="px-3.5 py-1.5 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-xs font-semibold hover:bg-[#0B2E21] cursor-pointer"
                          >
                            RESCHEDULE
                          </button>
                        )}
                      </>
                    )}

                    {state.kind === 'available' && (
                      <button
                        type="button"
                        disabled={isExpired}
                        onClick={() => openBookingFlow(focusDate, timeStr)}
                        className="px-4 py-2 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-xs font-semibold hover:bg-[#0B2E21] disabled:opacity-45 cursor-pointer"
                      >
                        Book {timeStr}
                      </button>
                    )}

                    {state.kind === 'all-empty' && (
                      <button
                        type="button"
                        disabled={isExpired || focusDate < todayISO}
                        onClick={() => openBookingFlow(focusDate, timeStr)}
                        className="px-3.5 py-1.5 rounded-lg border border-[#123F2D]/25 text-xs font-semibold text-[#123F2D] hover:bg-[#EAE2D5]/50 disabled:opacity-35 cursor-pointer"
                      >
                        Book Slot
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming PT Quick List below calendar */}
      <section className="rounded-xl border border-[#252823]/10 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-[#252823]/10 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-[#123F2D]">
            Your Personal Training Appointments
          </h2>
          <span className="text-xs text-[#252823]/60">
            Policy: {store.policyConfig.ptCancelNoticeHours}h notice required for changes
          </span>
        </div>

        {store.ptAppointments.filter((a) => a.memberId === currentUser.id).length === 0 ? (
          <div className="p-6 text-xs text-[#252823]/65">
            No personal training appointments yet. Click any available calendar slot to book.
          </div>
        ) : (
          <div className="divide-y divide-[#252823]/10">
            {store.ptAppointments
              .filter((a) => a.memberId === currentUser.id)
              .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))
              .map((appt) => {
                const mod = canModifyPTAppointment(appt);
                return (
                  <div
                    key={appt.id}
                    className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono text-[#252823]/60">{appt.id}</span>
                        <span>·</span>
                        <span
                          className={`font-semibold ${
                            appt.status === 'Upcoming'
                              ? 'text-[#123F2D]'
                              : appt.status === 'Completed'
                              ? 'text-[#6F8569]'
                              : 'text-[#9E2A2B]'
                          }`}
                        >
                          {appt.status}
                        </span>
                        {appt.rescheduledFrom && (
                          <>
                            <span>·</span>
                            <span className="text-[#6F8569]">
                              Rescheduled from {appt.rescheduledFrom}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="font-display text-sm font-bold text-[#252823]">
                        Coach {appt.trainerName} · {formatDisplayDate(appt.date)} at {appt.startTime}{' '}
                        ({appt.durationMin} min)
                      </div>
                      {appt.notes && (
                        <div className="text-xs text-[#252823]/65">{appt.notes}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setDetailAppt(appt)}
                        className="px-3 py-1.5 rounded-lg border border-[#252823]/15 text-xs font-semibold text-[#252823] hover:bg-[#F8F7F3] cursor-pointer"
                      >
                        Details
                      </button>
                      {appt.status === 'Upcoming' && (
                        <>
                          <button
                            type="button"
                            disabled={!mod.allowed}
                            title={mod.reason}
                            onClick={() => setRescheduleAppt(appt)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-xs font-semibold hover:bg-[#0B2E21] disabled:opacity-45 cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>RESCHEDULE</span>
                          </button>
                          <button
                            type="button"
                            disabled={!mod.allowed}
                            title={mod.reason}
                            onClick={() => handleCancelAppointment(appt)}
                            className="px-3.5 py-1.5 rounded-lg border border-[#9E2A2B]/30 bg-[#FCEEEE] text-[#9E2A2B] text-xs font-semibold hover:bg-[#f8dede] disabled:opacity-45 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>

      {/* Appointment Detail Drawer/Modal */}
      {liveDetailAppt && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl border border-[#252823]/15 max-w-md w-full overflow-hidden shadow-xl">
            <div className="px-6 py-4 bg-[#123F2D] text-[#F8F7F3] flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#EAE2D5]/80">
                  PT Appointment Details
                </div>
                <h3 className="font-display text-lg font-bold">
                  Coach {liveDetailAppt.trainerName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailAppt(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-[#252823]/10">
                <span className="text-[#252823]/60">Booking ID</span>
                <span className="font-mono font-semibold">{liveDetailAppt.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#252823]/10">
                <span className="text-[#252823]/60">Status</span>
                <span className="font-semibold text-[#123F2D]">{liveDetailAppt.status}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#252823]/10">
                <span className="text-[#252823]/60 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5" /> Date
                </span>
                <span className="font-semibold tabular-nums">
                  {formatDisplayDate(liveDetailAppt.date)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#252823]/10">
                <span className="text-[#252823]/60 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Time &amp; Duration
                </span>
                <span className="font-semibold tabular-nums">
                  {liveDetailAppt.startTime} ({liveDetailAppt.durationMin} min)
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#252823]/10">
                <span className="text-[#252823]/60">Credit Used</span>
                <span className="font-medium">{liveDetailAppt.packageType}</span>
              </div>
              {liveDetailAppt.notes && (
                <div className="pt-1">
                  <span className="text-xs text-[#252823]/60 block mb-1">Training Notes</span>
                  <p className="text-xs bg-[#F8F7F3] rounded-lg p-3 text-[#252823]">
                    {liveDetailAppt.notes}
                  </p>
                </div>
              )}
              {liveDetailAppt.rescheduledFrom && (
                <div className="text-xs text-[#6F8569]">
                  Previously scheduled: {liveDetailAppt.rescheduledFrom}
                </div>
              )}
            </div>

            {liveDetailAppt.status === 'Upcoming' && (
              <div className="px-6 py-4 bg-[#F8F7F3] border-t border-[#252823]/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleCancelAppointment(liveDetailAppt)}
                  className="px-4 py-2 rounded-lg border border-[#9E2A2B]/30 bg-[#FCEEEE] text-[#9E2A2B] text-xs font-semibold hover:bg-[#f8dede] cursor-pointer"
                >
                  Cancel Appointment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = liveDetailAppt;
                    setDetailAppt(null);
                    setRescheduleAppt(target);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-xs font-semibold hover:bg-[#0B2E21] cursor-pointer"
                >
                  RESCHEDULE
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Direct Booking Modal from Calendar */}
      {bookingModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#F8F7F3] rounded-xl border border-[#252823]/15 max-w-2xl w-full shadow-xl overflow-hidden my-auto">
            <div className="px-6 py-4 bg-[#123F2D] text-[#F8F7F3] flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#EAE2D5]/80">
                  Direct Calendar Booking
                </p>
                <h2 className="font-display text-lg font-bold">Schedule Personal Training</h2>
              </div>
              <button
                type="button"
                onClick={() => setBookingModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="p-8 text-center space-y-5">
                <CheckCircle2 className="w-12 h-12 text-[#123F2D] mx-auto" />
                <div>
                  <h3 className="font-display text-2xl font-bold text-[#123F2D]">
                    PT Appointment Confirmed
                  </h3>
                  <p className="text-sm text-[#252823]/75 mt-1">
                    Your session is now live on your PT Schedule, My Bookings, and Dashboard.
                  </p>
                </div>
                <div className="max-w-sm mx-auto rounded-lg bg-white border border-[#252823]/10 p-4 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#252823]/60">Appointment ID</span>
                    <span className="font-mono font-semibold">{bookingSuccess.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#252823]/60">Trainer</span>
                    <span className="font-semibold">Coach {bookingSuccess.trainerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#252823]/60">Date</span>
                    <span className="font-semibold tabular-nums">{bookingSuccess.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#252823]/60">Time</span>
                    <span className="font-semibold tabular-nums">
                      {bookingSuccess.startTime} ({bookingSuccess.durationMin} min)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="px-6 py-2.5 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-xs font-semibold cursor-pointer"
                >
                  Back to Calendar
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleConfirmDirectBooking}
                className="p-6 space-y-5 max-h-[82vh] overflow-y-auto"
              >
                {creditsRemaining <= 0 && (
                  <div className="rounded-lg border border-[#9A671F]/30 bg-[#FDF6E9] px-4 py-3 text-xs text-[#7A5214] flex items-center justify-between gap-3">
                    <span>
                      You need at least 1 PT credit to book a session.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setBookingModalOpen(false);
                        setActivePage('packages');
                      }}
                      className="font-semibold underline cursor-pointer whitespace-nowrap"
                    >
                      Purchase PT Package
                    </button>
                  </div>
                )}

                {bookingError && (
                  <div className="rounded-lg border border-[#9E2A2B]/30 bg-[#FCEEEE] px-4 py-3 text-xs text-[#7A1E1F]">
                    {bookingError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#6F8569] mb-1.5">
                      1. Personal Trainer
                    </label>
                    <select
                      value={bookTrainerId}
                      onChange={(e) => {
                        setBookTrainerId(e.target.value);
                        setBookTime('');
                      }}
                      className="w-full rounded-lg border border-[#252823]/15 bg-white px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-[#123F2D]"
                    >
                      {activeTrainers.map((t) => (
                        <option key={t.id} value={t.id}>
                          Coach {t.name} ({t.specialization.split('&')[0].trim()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#6F8569] mb-1.5">
                      2. Date
                    </label>
                    <input
                      type="date"
                      min={todayISO}
                      value={bookDate}
                      onChange={(e) => {
                        setBookDate(e.target.value);
                        setBookTime('');
                      }}
                      className="w-full rounded-lg border border-[#252823]/15 bg-white px-3 py-2.5 text-sm tabular-nums focus:outline-none focus:border-[#123F2D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6F8569] mb-2">
                    3. Available Time Slots
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {modalAvailableSlots.map((slot) => {
                      const active = bookTime === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setBookTime(slot.time)}
                          title={slot.message || 'Available'}
                          className={`px-3 py-2 rounded-lg border text-xs font-medium tabular-nums text-left ${
                            !slot.available
                              ? 'border-[#252823]/10 bg-[#EAE2D5]/40 text-[#252823]/35 cursor-not-allowed'
                              : active
                              ? 'border-[#123F2D] bg-[#123F2D] text-[#F8F7F3] cursor-pointer'
                              : 'border-[#252823]/15 bg-white hover:border-[#123F2D] cursor-pointer'
                          }`}
                        >
                          <div className="font-semibold">{slot.time}</div>
                          <div className="text-[10px] opacity-80">
                            {slot.available ? 'Available' : 'Unavailable'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#6F8569] mb-1.5">
                      4. Session Duration
                    </label>
                    <select
                      value={bookDuration}
                      onChange={(e) => setBookDuration(Number(e.target.value))}
                      className="w-full rounded-lg border border-[#252823]/15 bg-white px-3 py-2.5 text-sm"
                    >
                      <option value={60}>60 Minutes (Standard)</option>
                      <option value={90}>90 Minutes (Extended)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#6F8569] mb-1.5">
                      5. Credit Source
                    </label>
                    <select
                      value={bookPackageLabel}
                      onChange={(e) => setBookPackageLabel(e.target.value)}
                      className="w-full rounded-lg border border-[#252823]/15 bg-white px-3 py-2.5 text-sm"
                    >
                      <option value="PT Session Credit">
                        PT Session Credit ({creditsRemaining} remaining)
                      </option>
                      <option value="8 Session Personal">8 Session Personal</option>
                      <option value="12 Session Personal">12 Session Personal</option>
                      <option value="Couple PT Session">Couple PT Session</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6F8569] mb-1.5">
                    6. Training Goals or Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={bookNotes}
                    onChange={(e) => setBookNotes(e.target.value)}
                    placeholder="e.g., Hypertrophy upper body, mobility warm-up, barbell technique..."
                    className="w-full rounded-lg border border-[#252823]/15 bg-white px-3 py-2 text-sm focus:outline-none focus:border-[#123F2D]"
                  />
                </div>

                {/* Review Box */}
                <div className="rounded-lg border border-[#252823]/10 bg-white p-4 text-xs space-y-1.5">
                  <div className="font-semibold text-[#123F2D] uppercase tracking-wider text-[11px]">
                    Review Summary
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#252823]/65 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Coach {modalTrainer?.name}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatDisplayDate(bookDate)} · {bookTime || 'Select slot'} ({bookDuration} min)
                    </span>
                  </div>
                  <div className="text-[11px] text-[#252823]/60">
                    Policy: Cancellations &amp; reschedules require at least{' '}
                    {store.policyConfig.ptCancelNoticeHours} hours notice. 1 PT credit will be applied.
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#252823]/10">
                  <button
                    type="button"
                    onClick={() => setBookingModalOpen(false)}
                    className="px-4 py-2.5 rounded-lg border border-[#252823]/15 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isExpired || creditsRemaining <= 0 || !bookTime}
                    className="px-5 py-2.5 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-xs font-semibold hover:bg-[#0B2E21] disabled:opacity-45 cursor-pointer"
                  >
                    Confirm PT Booking
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleAppt && (
        <PTRescheduleModal
          appointment={rescheduleAppt}
          onClose={() => setRescheduleAppt(null)}
          onSuccess={(updated) =>
            setBannerMsg({
              ok: true,
              text: `Rescheduled ${updated.id} to ${updated.date} at ${updated.startTime} with Coach ${updated.trainerName}.`,
            })
          }
        />
      )}
    </div>
  );
};
