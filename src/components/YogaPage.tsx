import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  RefreshCw,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useBrave } from '../context/BraveContext';
import { BRAND_MEDIA } from '../data/brandMedia';
import { YogaAppointment, YogaScheduleTemplate } from '../types';
import {
  addDaysISO,
  formatDisplayDate,
  formatShortDate,
  getMonthCalendarDays,
  getStartOfWeek,
  getTodayISO,
  parseISODate,
  STUDIO_HOURS_12H,
  STUDIO_HOURS_24H,
  STUDIO_HOURS_STATUS,
  toISODate,
} from '../utils/dateUtils';
import { SafeImage } from './BraveLogo';
import { YogaRescheduleModal } from './YogaRescheduleModal';

type YogaCalendarView = 'month' | 'week';

export const YogaPage: React.FC = () => {
  const {
    store,
    currentUser,
    checkYogaSlotAvailability,
    bookYoga,
    cancelYoga,
  } = useBrave();

  const todayISO = getTodayISO();
  const [view, setView] = useState<YogaCalendarView>('week');
  const [focusDate, setFocusDate] = useState<string>(addDaysISO(todayISO, 1));
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('all');

  // Booking confirmation modal state
  const [bookingTarget, setBookingTarget] = useState<{
    template: YogaScheduleTemplate;
    date: string;
    startTime: string;
    spotsLeft: number;
  } | null>(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [rescheduleTarget, setRescheduleTarget] = useState<YogaAppointment | null>(null);
  const [confirmedAppt, setConfirmedAppt] = useState<YogaAppointment | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  if (!currentUser) return null;

  const isExpired = currentUser.status === 'Expired';
  const focusDateObj = parseISODate(focusDate);

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

  const visibleTemplates = useMemo(
    () =>
      selectedTemplateId === 'all'
        ? store.yogaTemplates
        : store.yogaTemplates.filter((t) => t.id === selectedTemplateId),
    [store.yogaTemplates, selectedTemplateId]
  );

  const memberYogaAppointments = useMemo(
    () =>
      store.yogaAppointments
        .filter((a) => a.memberId === currentUser.id)
        .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)),
    [store.yogaAppointments, currentUser.id]
  );

  const upcomingYoga = useMemo(
    () => memberYogaAppointments.filter((a) => a.status === 'Upcoming'),
    [memberYogaAppointments]
  );

  const pastYoga = useMemo(
    () =>
      memberYogaAppointments
        .filter((a) => a.status !== 'Upcoming')
        .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`)),
    [memberYogaAppointments]
  );

  const handleNavigateRange = (direction: -1 | 1) => {
    if (view === 'week') {
      setFocusDate(addDaysISO(focusDate, direction * 7));
    } else {
      const d = new Date(focusDateObj.getFullYear(), focusDateObj.getMonth() + direction, 1);
      setFocusDate(toISODate(d));
    }
  };

  const displayedRange = useMemo(() => {
    if (view === 'month') {
      return focusDateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return `${formatShortDate(weekDays[0])} – ${formatShortDate(
      weekDays[6]
    )}, ${parseISODate(weekDays[6]).getFullYear()}`;
  }, [view, focusDateObj, weekDays]);

  const getSessionsForDate = (dateISO: string) => {
    const dayIdx = new Date(`${dateISO}T00:00:00`).getDay();
    const list: {
      template: YogaScheduleTemplate;
      startTime: string;
      available: boolean;
      spotsLeft: number;
      reason?: string;
      bookedAppt?: YogaAppointment;
    }[] = [];

    visibleTemplates.forEach((tpl) => {
      if (!tpl.daysOfWeek.includes(dayIdx)) return;
      tpl.timeSlots.forEach((time) => {
        const bookedAppt = store.yogaAppointments.find(
          (a) =>
            a.memberId === currentUser.id &&
            a.templateId === tpl.id &&
            a.date === dateISO &&
            a.startTime === time &&
            a.status === 'Upcoming'
        );
        const avail = checkYogaSlotAvailability(tpl.id, dateISO, time);
        list.push({
          template: tpl,
          startTime: time,
          available: avail.available,
          spotsLeft: avail.spotsLeft,
          reason: avail.reason,
          bookedAppt,
        });
      });
    });

    return list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const selectedDateSessions = useMemo(
    () => getSessionsForDate(focusDate),
    [focusDate, visibleTemplates, store.yogaAppointments, currentUser.id]
  );

  const handleConfirmBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingTarget) return;
    const res = bookYoga({
      templateId: bookingTarget.template.id,
      date: bookingTarget.date,
      startTime: bookingTarget.startTime,
      notes: bookingNotes,
    });
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok && res.data) {
      setConfirmedAppt(res.data);
      setBookingTarget(null);
      setBookingNotes('');
    }
  };

  const handleCancelYoga = (id: string) => {
    setFeedback(null);
    const res = cancelYoga(id);
    setFeedback({ ok: res.ok, text: res.message });
    if (confirmedAppt?.id === id) setConfirmedAppt(null);
  };

  return (
    <div className="space-y-6">
      {/* Main Cover Hero — Uploaded Yoga Cover Photo */}
      <section className="rounded-xl border border-[#2C4A3E]/15 bg-[#F4F7F4] overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch shadow-sm">
        <div className="lg:col-span-5 min-h-[240px] sm:min-h-[280px] overflow-hidden bg-[#DCE7DF]">
          <SafeImage
            src={BRAND_MEDIA.yogaCover}
            alt="Brave Gym Yoga and Pilates ring flow inside Mind & Flow Studio"
            className="w-full h-full object-cover object-center"
            fallbackLabel="Yoga & Mindful Flow"
          />
        </div>
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5B7567]">
              YOGA APPOINTMENT · MIND &amp; FLOW STUDIO
            </p>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#264538]">
              Yoga &amp; Mindful Movement Schedule
            </h1>
            <p className="mt-2 text-sm text-[#252823]/75 leading-relaxed">
              Balance heavy lifting with breath-led yoga, core alignment, and restorative studio sessions. Select any date on the calendar below to book, reschedule, or manage your upcoming yoga appointments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 border-t border-[#2C4A3E]/15 text-xs text-[#264538]/85">
            <span className="flex items-center gap-1.5 tabular-nums font-semibold">
              <Clock className="w-3.5 h-3.5 text-[#5B7567]" />
              Daily Studio Hours: {STUDIO_HOURS_24H} ({STUDIO_HOURS_12H} · {STUDIO_HOURS_STATUS})
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#5B7567]" />
              50–60 Min Guided Sessions
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#5B7567]" />
              Small-Group Studio Caps (10–14)
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#5B7567]" />
              Included with Active Membership
            </span>
          </div>
        </div>
      </section>

      {/* Secondary Uploaded Yoga Banner */}
      <section className="rounded-xl border border-[#2C4A3E]/15 bg-white overflow-hidden grid grid-cols-1 md:grid-cols-12 items-stretch">
        <div className="md:col-span-8 p-5 sm:p-6 flex flex-col justify-center gap-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5B7567]">
            Studio Atmosphere · Breath, Alignment &amp; Longevity
          </div>
          <h2 className="font-display text-lg font-bold text-[#264538]">
            Five curated weekly disciplines with live spot tracking
          </h2>
          <p className="text-xs text-[#252823]/70 leading-relaxed">
            Choose from Power Yoga, Hatha &amp; Gentle Yoga, Vinyasa Inside Flow, Pilates Ring &amp; Mat Flow, or Restorative Mobility. Every booking syncs automatically to your member dashboard and appointment ledger.
          </p>
        </div>
        <div className="md:col-span-4 h-44 md:h-auto min-h-[160px] overflow-hidden bg-[#DCE7DF]">
          <SafeImage
            src={BRAND_MEDIA.yogaBanner}
            alt="Brave Gym mat yoga side plank flow session"
            className="w-full h-full object-cover object-top"
            fallbackLabel="Studio Movement"
          />
        </div>
      </section>

      {confirmedAppt && (
        <div className="rounded-xl border border-[#264538]/25 bg-[#264538] text-[#F4F7F4] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#D7E3DC] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs uppercase tracking-wider text-[#D7E3DC] font-semibold">
                Yoga Session Confirmed · {confirmedAppt.id}
              </div>
              <div className="font-display text-base font-bold mt-0.5">
                {confirmedAppt.style} with {confirmedAppt.instructor}
              </div>
              <div className="text-xs text-[#D7E3DC]">
                {formatDisplayDate(confirmedAppt.date)} at {confirmedAppt.startTime} ·{' '}
                {confirmedAppt.durationMin} min · {confirmedAppt.location}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmedAppt(null)}
            className="px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold cursor-pointer self-start"
          >
            Dismiss
          </button>
        </div>
      )}

      {feedback && !confirmedAppt && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.ok
              ? 'border-[#264538]/25 bg-[#E8F0E8] text-[#245B3B]'
              : 'border-[#AC4242]/30 bg-[#FBE7E7] text-[#AC4242]'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Interactive Yoga Calendar Interface */}
      <section className="rounded-xl border border-[#2C4A3E]/15 bg-white overflow-hidden">
        {/* Calendar Toolbar */}
        <div className="px-5 py-4 border-b border-[#2C4A3E]/10 bg-[#F4F7F4] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFocusDate(todayISO)}
              className="px-3 py-1.5 rounded-lg border border-[#2C4A3E]/20 bg-white text-xs font-semibold text-[#264538] hover:bg-[#E8EFE9] cursor-pointer"
            >
              Today
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleNavigateRange(-1)}
                className="p-1.5 rounded-lg border border-[#2C4A3E]/15 bg-white hover:bg-[#E8EFE9] text-[#264538] cursor-pointer"
                aria-label="Previous period"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleNavigateRange(1)}
                className="p-1.5 rounded-lg border border-[#2C4A3E]/15 bg-white hover:bg-[#E8EFE9] text-[#264538] cursor-pointer"
                aria-label="Next period"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <h2 className="font-display text-base sm:text-lg font-bold text-[#264538] ml-1 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#5B7567]" />
              {displayedRange}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              aria-label="Filter yoga discipline"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="rounded-lg border border-[#2C4A3E]/20 bg-white px-3 py-2 text-xs font-semibold text-[#264538] focus:outline-none focus:border-[#264538]"
            >
              <option value="all">All Yoga Disciplines (5)</option>
              {store.yogaTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.style} · {t.instructor}
                </option>
              ))}
            </select>

            <div className="flex items-center p-1 rounded-lg bg-white border border-[#2C4A3E]/15">
              {(['week', 'month'] as YogaCalendarView[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                    view === v
                      ? 'bg-[#264538] text-white'
                      : 'text-[#252823]/70 hover:text-[#264538]'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Week View */}
        {view === 'week' && (
          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-[#2C4A3E]/10">
            {weekDays.map((dateISO) => {
              const dayObj = parseISODate(dateISO);
              const sessions = getSessionsForDate(dateISO);
              const isSelected = dateISO === focusDate;
              const isToday = dateISO === todayISO;

              return (
                <div
                  key={dateISO}
                  className={`p-3 flex flex-col gap-2.5 min-h-[220px] ${
                    isSelected ? 'bg-[#F4F7F4]/80' : 'bg-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setFocusDate(dateISO)}
                    className="flex items-center justify-between text-left pb-2 border-b border-[#2C4A3E]/10 cursor-pointer"
                  >
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5B7567]">
                        {dayObj.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div
                        className={`font-display text-base font-bold tabular-nums ${
                          isToday ? 'text-[#264538]' : 'text-[#252823]'
                        }`}
                      >
                        {dayObj.getDate()} {dayObj.toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                    </div>
                    {isToday && (
                      <span className="px-2 py-0.5 rounded bg-[#E3EDE7] text-[#264538] text-[10px] font-bold uppercase">
                        Today
                      </span>
                    )}
                  </button>

                  {sessions.length === 0 ? (
                    <div className="text-[11px] text-[#252823]/45 py-4 text-center">
                      No matching sessions
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sessions.map((item) => (
                        <div
                          key={`${item.template.id}-${item.startTime}`}
                          className={`rounded-lg border p-2.5 space-y-1.5 text-xs ${
                            item.bookedAppt
                              ? 'border-[#264538] bg-[#264538] text-white'
                              : item.available
                              ? 'border-[#2C4A3E]/15 bg-[#F6F8F6] text-[#252823]'
                              : 'border-[#252823]/10 bg-[#F8F7F3] text-[#252823]/45'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono font-bold tabular-nums">
                              {item.startTime}
                            </span>
                            <span
                              className={`text-[10px] font-semibold ${
                                item.bookedAppt ? 'text-[#D7E3DC]' : 'text-[#5B7567]'
                              }`}
                            >
                              {item.template.durationMin}m
                            </span>
                          </div>
                          <div className="font-semibold leading-snug">{item.template.style}</div>
                          <div
                            className={`text-[11px] ${
                              item.bookedAppt ? 'text-[#D7E3DC]' : 'text-[#252823]/65'
                            }`}
                          >
                            {item.template.instructor} ·{' '}
                            {item.bookedAppt
                              ? 'Booked'
                              : item.available
                              ? `${item.spotsLeft} spots left`
                              : 'Unavailable'}
                          </div>

                          {item.bookedAppt ? (
                            <div className="pt-1 flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setRescheduleTarget(item.bookedAppt!)}
                                className="flex-1 py-1 rounded bg-white/15 hover:bg-white/25 text-[10px] font-semibold cursor-pointer"
                              >
                                Reschedule
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancelYoga(item.bookedAppt!.id)}
                                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] font-semibold cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={isExpired || !item.available}
                              onClick={() => {
                                setFeedback(null);
                                setBookingNotes('');
                                setBookingTarget({
                                  template: item.template,
                                  date: dateISO,
                                  startTime: item.startTime,
                                  spotsLeft: item.spotsLeft,
                                });
                              }}
                              className="w-full py-1.5 rounded bg-[#E3EDE7] hover:bg-[#264538] hover:text-white text-[#264538] text-[11px] font-semibold disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                              Book Session
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Month View + Selected Day Panel */}
        {view === 'month' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#2C4A3E]/10">
            <div className="lg:col-span-7 p-5">
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[#5B7567] mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {monthDays.map((dayObj) => {
                  const iso = toISODate(dayObj);
                  const inMonth = dayObj.getMonth() === focusDateObj.getMonth();
                  const sessions = inMonth ? getSessionsForDate(iso) : [];
                  const hasUserBooked = sessions.some((s) => Boolean(s.bookedAppt));
                  const isSelected = iso === focusDate;

                  return (
                    <button
                      key={iso}
                      type="button"
                      disabled={!inMonth}
                      onClick={() => setFocusDate(iso)}
                      className={`min-h-[68px] rounded-lg border p-2 text-left flex flex-col justify-between transition-colors ${
                        !inMonth
                          ? 'border-transparent text-transparent pointer-events-none'
                          : isSelected
                          ? 'border-[#264538] bg-[#264538] text-white cursor-pointer'
                          : 'border-[#2C4A3E]/15 bg-[#F8FAF8] hover:border-[#264538] text-[#252823] cursor-pointer'
                      }`}
                    >
                      <span className="text-xs font-bold tabular-nums">{dayObj.getDate()}</span>
                      {sessions.length > 0 && (
                        <span
                          className={`text-[10px] font-semibold ${
                            isSelected
                              ? 'text-[#D7E3DC]'
                              : hasUserBooked
                              ? 'text-[#264538]'
                              : 'text-[#5B7567]'
                          }`}
                        >
                          {hasUserBooked ? 'Booked' : `${sessions.length} slots`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-5 p-5 space-y-4 bg-[#F9FBF9]">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#5B7567]">
                  Sessions on {formatDisplayDate(focusDate)}
                </div>
                <p className="text-xs text-[#252823]/65 mt-0.5">
                  Select a slot below to book immediately or manage your reservation.
                </p>
              </div>

              {selectedDateSessions.length === 0 ? (
                <div className="rounded-lg border border-[#2C4A3E]/10 bg-white p-5 text-xs text-[#252823]/65">
                  No scheduled yoga sessions match your current filter on this day.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateSessions.map((item) => (
                    <div
                      key={`${item.template.id}-${item.startTime}`}
                      className="rounded-xl border border-[#2C4A3E]/15 bg-white p-4 flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-mono text-xs font-bold text-[#264538]">
                            {item.startTime} · {item.template.durationMin} min
                          </div>
                          <div className="font-display text-base font-bold text-[#252823]">
                            {item.template.style}
                          </div>
                          <div className="text-xs text-[#252823]/70">
                            {item.template.instructor} · {item.template.location}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-md bg-[#E3EDE7] text-[#264538] text-[10px] font-bold uppercase tracking-wider shrink-0">
                          {item.bookedAppt
                            ? 'Booked'
                            : item.available
                            ? `${item.spotsLeft} Spots`
                            : 'Closed'}
                        </span>
                      </div>

                      {item.bookedAppt ? (
                        <div className="flex items-center gap-2 pt-2 border-t border-[#2C4A3E]/10">
                          <button
                            type="button"
                            onClick={() => setRescheduleTarget(item.bookedAppt!)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#264538] text-white text-xs font-semibold cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Reschedule</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelYoga(item.bookedAppt!.id)}
                            className="px-3 py-1.5 rounded-lg border border-[#AC4242]/30 bg-[#FBE7E7] text-[#AC4242] text-xs font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isExpired || !item.available}
                          onClick={() => {
                            setFeedback(null);
                            setBookingNotes('');
                            setBookingTarget({
                              template: item.template,
                              date: focusDate,
                              startTime: item.startTime,
                              spotsLeft: item.spotsLeft,
                            });
                          }}
                          className="w-full py-2 rounded-lg bg-[#264538] text-white text-xs font-semibold hover:bg-[#1C352A] disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Book Yoga Session
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Upcoming & Past Yoga Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-[#2C4A3E]/15 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2C4A3E]/10 bg-[#F4F7F4] flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[#264538]">
              Upcoming Yoga Appointments ({upcomingYoga.length})
            </h2>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5B7567]">
              Active Schedule
            </span>
          </div>
          {upcomingYoga.length === 0 ? (
            <div className="p-6 text-xs text-[#252823]/65">
              No upcoming yoga appointments yet. Choose any open slot in the calendar above.
            </div>
          ) : (
            <div className="divide-y divide-[#2C4A3E]/10">
              {upcomingYoga.map((appt) => (
                <div key={appt.id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#5B7567]">
                        <span className="font-mono font-semibold">{appt.id}</span>
                        <span>·</span>
                        <span className="tabular-nums">{appt.durationMin} min</span>
                      </div>
                      <div className="font-display text-base font-bold text-[#264538] mt-0.5">
                        {appt.style}
                      </div>
                      <div className="text-xs text-[#252823]/75 mt-0.5">
                        {appt.instructor} · {formatDisplayDate(appt.date)} at {appt.startTime}
                      </div>
                      <div className="text-xs text-[#252823]/60 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{appt.location}</span>
                      </div>
                      {appt.rescheduledFrom && (
                        <div className="text-[11px] text-[#5B7567] mt-1">
                          Rescheduled from: {appt.rescheduledFrom}
                        </div>
                      )}
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-[#D0E3D2] text-[#245B3B] text-[10px] font-bold uppercase tracking-wider shrink-0">
                      {appt.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#2C4A3E]/10">
                    <button
                      type="button"
                      disabled={isExpired}
                      onClick={() => setRescheduleTarget(appt)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#264538] text-white text-xs font-semibold hover:bg-[#1C352A] disabled:opacity-45 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reschedule</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancelYoga(appt.id)}
                      className="px-3.5 py-1.5 rounded-lg border border-[#AC4242]/30 bg-[#FBE7E7] text-[#AC4242] text-xs font-semibold hover:bg-[#f6d6d6] cursor-pointer"
                    >
                      Cancel Session
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[#2C4A3E]/15 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2C4A3E]/10 bg-[#F8F7F3] flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[#252823]">
              Past &amp; Cancelled Yoga Sessions ({pastYoga.length})
            </h2>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#252823]/55">
              History
            </span>
          </div>
          {pastYoga.length === 0 ? (
            <div className="p-6 text-xs text-[#252823]/65">
              Your completed and cancelled yoga sessions will appear here.
            </div>
          ) : (
            <div className="divide-y divide-[#252823]/10">
              {pastYoga.map((appt) => (
                <div
                  key={appt.id}
                  className="p-5 flex items-start justify-between gap-3 text-sm"
                >
                  <div>
                    <div className="text-xs font-mono text-[#252823]/55">
                      {appt.id} · {appt.durationMin} min
                    </div>
                    <div className="font-semibold text-[#252823] mt-0.5">{appt.style}</div>
                    <div className="text-xs text-[#252823]/70 mt-0.5">
                      {appt.instructor} · {formatDisplayDate(appt.date)} at {appt.startTime}
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      appt.status === 'Completed'
                        ? 'bg-[#EAE2D5] text-[#252823]'
                        : 'bg-[#FBE7E7] text-[#AC4242]'
                    }`}
                  >
                    {appt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Booking Confirmation Modal */}
      {bookingTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleConfirmBook}
            className="bg-white rounded-xl border border-[#2C4A3E]/20 max-w-md w-full overflow-hidden shadow-xl"
          >
            <div className="px-6 py-4 bg-[#264538] text-white flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-[#D7E3DC]">
                  Confirm Yoga Appointment
                </div>
                <h3 className="font-display text-lg font-bold">{bookingTarget.template.style}</h3>
              </div>
              <button
                type="button"
                onClick={() => setBookingTarget(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                aria-label="Close yoga booking dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="rounded-lg bg-[#F4F7F4] border border-[#2C4A3E]/15 p-4 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#5B7567] font-semibold">Instructor</span>
                  <span className="font-semibold text-[#264538]">
                    {bookingTarget.template.instructor}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B7567] font-semibold">Date &amp; Time</span>
                  <span className="font-semibold tabular-nums text-[#264538]">
                    {formatDisplayDate(bookingTarget.date)} · {bookingTarget.startTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B7567] font-semibold">Duration</span>
                  <span className="font-semibold text-[#264538]">
                    {bookingTarget.template.durationMin} minutes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B7567] font-semibold">Studio</span>
                  <span className="font-semibold text-[#264538]">
                    {bookingTarget.template.location}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B7567] font-semibold">Availability</span>
                  <span className="font-semibold text-[#264538]">
                    {bookingTarget.spotsLeft} spots left
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#5B7567] mb-1.5">
                  Practice Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="E.g. tight hamstrings, prefer bolster or mat cushion..."
                  className="w-full rounded-lg border border-[#2C4A3E]/20 px-3 py-2 text-xs focus:outline-none focus:border-[#264538]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBookingTarget(null)}
                  className="px-4 py-2 rounded-lg border border-[#252823]/15 text-xs font-semibold text-[#252823] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#264538] text-white text-xs font-semibold hover:bg-[#1C352A] cursor-pointer"
                >
                  Book Yoga Session
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {rescheduleTarget && (
        <YogaRescheduleModal
          appointment={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onSuccess={(updated) => {
            setFeedback({
              ok: true,
              text: `Rescheduled ${updated.style} to ${formatDisplayDate(updated.date)} at ${updated.startTime}.`,
            });
          }}
        />
      )}
    </div>
  );
};
