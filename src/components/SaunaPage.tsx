import React, { useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Clock, Flame, Users } from 'lucide-react';
import { useBrave } from '../context/BraveContext';
import { BRAND_MEDIA } from '../data/brandMedia';
import { SaunaBooking } from '../types';
import {
  addDaysISO,
  formatDisplayDate,
  generateSaunaTimeSlots,
  getTodayISO,
  isPastDateTime,
  STUDIO_HOURS_12H,
  STUDIO_HOURS_24H,
  STUDIO_HOURS_STATUS,
} from '../utils/dateUtils';
import { SafeImage } from './BraveLogo';

export const SaunaPage: React.FC = () => {
  const {
    store,
    currentUser,
    getSaunaSlotBookedCount,
    bookSauna,
    cancelSauna,
  } = useBrave();

  const todayISO = getTodayISO();
  const [selectedDate, setSelectedDate] = useState<string>(addDaysISO(todayISO, 1));
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [confirmed, setConfirmed] = useState<SaunaBooking | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  if (!currentUser) return null;

  const isExpired = currentUser.status === 'Expired';
  const { saunaConfig } = store;
  const isBlockedDate = saunaConfig.blockedDates.includes(selectedDate);

  const slots = useMemo(
    () =>
      generateSaunaTimeSlots(
        saunaConfig.openHour,
        saunaConfig.closeHour,
        saunaConfig.slotDurationMin
      ),
    [saunaConfig]
  );

  const upcomingSauna = useMemo(
    () =>
      store.saunaBookings
        .filter((b) => b.memberId === currentUser.id && b.status === 'Upcoming')
        .sort((a, b) => `${a.date} ${a.timeSlot}`.localeCompare(`${b.date} ${b.timeSlot}`)),
    [store.saunaBookings, currentUser.id]
  );

  const pastSauna = useMemo(
    () =>
      store.saunaBookings
        .filter((b) => b.memberId === currentUser.id && b.status !== 'Upcoming')
        .sort((a, b) => `${b.date} ${b.timeSlot}`.localeCompare(`${a.date} ${a.timeSlot}`)),
    [store.saunaBookings, currentUser.id]
  );

  const handleBookSlot = (slot: string) => {
    setFeedback(null);
    const res = bookSauna(selectedDate, slot);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok && res.data) {
      setConfirmed(res.data);
      setSelectedSlot('');
    }
  };

  const handleCancel = (bookingId: string) => {
    setFeedback(null);
    const res = cancelSauna(bookingId);
    setFeedback({ ok: res.ok, text: res.message });
    if (confirmed?.id === bookingId) setConfirmed(null);
  };

  return (
    <div className="space-y-6">
      {/* Warm Wood-Tone Sauna Appointment Hero */}
      <section className="rounded-xl border border-[#C8A882]/40 bg-[#FBF6EF] overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch shadow-sm">
        <div className="lg:col-span-5 min-h-[240px] sm:min-h-[290px] overflow-hidden bg-[#4A2E19]">
          <SafeImage
            src={BRAND_MEDIA.saunaCover}
            alt="Brave Gym members relaxing inside the wooden sauna"
            className="w-full h-full object-cover object-center"
            fallbackLabel="Thermal Recovery Suite"
          />
        </div>
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8C5227]">
              SAUNA APPOINTMENT · THERMAL RECOVERY SUITE
            </p>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#4A2E19]">
              Wooden Sauna Recovery Sanctuary
            </h1>
            <p className="mt-2 text-sm text-[#4A2E19]/80 leading-relaxed">
              Step into warm cedar heat after training. Sauna appointments are complimentary for all active Brave Gym members, capped at {saunaConfig.maxCapacity} guests per {saunaConfig.slotDurationMin}-minute session for a calm recovery ritual.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 border-t border-[#C8A882]/35 text-xs text-[#4A2E19]/85">
            <span className="flex items-center gap-1.5 tabular-nums font-semibold">
              <Clock className="w-3.5 h-3.5 text-[#8C5227]" />
              Daily Studio Hours: {STUDIO_HOURS_24H} ({STUDIO_HOURS_12H} · {STUDIO_HOURS_STATUS})
            </span>
            <span className="flex items-center gap-1.5 tabular-nums">
              <Clock className="w-3.5 h-3.5 text-[#8C5227]" />
              Duration: {saunaConfig.slotDurationMin} Minutes
            </span>
            <span className="flex items-center gap-1.5 tabular-nums">
              <Users className="w-3.5 h-3.5 text-[#8C5227]" />
              Capacity: {saunaConfig.maxCapacity} members / slot
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-[#8C5227]">
              <Flame className="w-3.5 h-3.5" />
              Complimentary · Rp0
            </span>
          </div>
        </div>
      </section>

      {confirmed && (
        <div className="rounded-xl border border-[#8C5227]/30 bg-[#5C3A21] text-[#FBF6EF] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#F4D9B6] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs uppercase tracking-wider text-[#F4D9B6] font-semibold">
                Sauna Appointment Confirmed · {confirmed.id}
              </div>
              <div className="font-display text-base font-bold mt-0.5">
                {formatDisplayDate(confirmed.date)} · {confirmed.timeSlot}
              </div>
              <div className="text-xs text-[#F4D9B6]">
                Duration: {saunaConfig.slotDurationMin} minutes · Status: {confirmed.status} · Added to your upcoming sauna list.
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
              ? 'border-[#8C5227]/30 bg-[#FBF6EF] text-[#5C3A21]'
              : 'border-[#AC4242]/30 bg-[#FBE7E7] text-[#AC4242]'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Date Picker, Slot Selection & Explicit Book Sauna CTA */}
      <section className="rounded-xl border border-[#C8A882]/35 bg-white p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#C8A882]/25">
          <div>
            <h2 className="font-display text-lg font-bold text-[#4A2E19]">
              Select Sauna Date &amp; Time Slot
            </h2>
            <p className="text-xs text-[#252823]/65 tabular-nums">
              Showing {saunaConfig.slotDurationMin}-minute sessions ({String(saunaConfig.openHour).padStart(2, '0')}:00–{String(saunaConfig.closeHour).padStart(2, '0')}:00) for {formatDisplayDate(selectedDate)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label
              htmlFor="sauna-date"
              className="text-xs font-semibold uppercase tracking-wider text-[#8C5227]"
            >
              Booking Date:
            </label>
            <input
              id="sauna-date"
              type="date"
              min={todayISO}
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedSlot('');
              }}
              className="rounded-lg border border-[#C8A882]/45 bg-[#FBF6EF] px-3.5 py-2 text-sm tabular-nums text-[#4A2E19] focus:outline-none focus:border-[#8C5227]"
            />
          </div>
        </div>

        {/* Selected Slot Summary Bar with Clear Book Sauna CTA */}
        {!isBlockedDate && (
          <div className="rounded-xl border border-[#C8A882]/35 bg-[#FBF6EF] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#4A2E19]">
              <span className="flex items-center gap-1.5 font-semibold">
                <Calendar className="w-4 h-4 text-[#8C5227]" />
                Date: <span className="tabular-nums">{formatDisplayDate(selectedDate)}</span>
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <Clock className="w-4 h-4 text-[#8C5227]" />
                Slot:{' '}
                <span className="font-mono">
                  {selectedSlot || 'Pick a slot below'}
                </span>
              </span>
              <span>Duration: {saunaConfig.slotDurationMin} min</span>
            </div>
            <button
              type="button"
              disabled={isExpired || !selectedSlot}
              onClick={() => selectedSlot && handleBookSlot(selectedSlot)}
              className="px-5 py-2.5 rounded-lg bg-[#8C5227] text-white text-xs font-semibold tracking-wider uppercase hover:bg-[#6E3F1C] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
            >
              Book Sauna
            </button>
          </div>
        )}

        {isBlockedDate ? (
          <div className="rounded-lg border border-[#AC4242]/25 bg-[#FBE7E7] p-5 text-sm text-[#AC4242]">
            The Sauna Sanctuary is closed for scheduled maintenance on {formatDisplayDate(selectedDate)}. Please choose another date.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {slots.map((slot) => {
              const bookedCount = getSaunaSlotBookedCount(selectedDate, slot);
              const remaining = Math.max(0, saunaConfig.maxCapacity - bookedCount);
              const startTime = slot.split('–')[0];
              const isPast = isPastDateTime(selectedDate, startTime);
              const memberBooking = store.saunaBookings.find(
                (b) =>
                  b.memberId === currentUser.id &&
                  b.date === selectedDate &&
                  b.timeSlot === slot &&
                  b.status === 'Upcoming'
              );
              const disabled = isExpired || remaining <= 0 || isPast;
              const isPicked = selectedSlot === slot;

              return (
                <div
                  key={slot}
                  className={`rounded-lg border p-3.5 flex flex-col justify-between gap-3 transition-colors ${
                    memberBooking
                      ? 'border-[#5C3A21] bg-[#5C3A21] text-[#FBF6EF]'
                      : isPicked
                      ? 'border-[#8C5227] bg-[#FBF6EF] text-[#4A2E19] ring-2 ring-[#8C5227]/25'
                      : disabled
                      ? 'border-[#252823]/10 bg-[#F8F7F3] text-[#252823]/45'
                      : 'border-[#C8A882]/35 bg-white hover:border-[#8C5227]'
                  }`}
                >
                  <div>
                    <div className="font-mono text-xs font-bold tabular-nums">{slot}</div>
                    <div
                      className={`text-[11px] tabular-nums mt-1 ${
                        memberBooking ? 'text-[#F4D9B6]' : 'text-[#8C5227]'
                      }`}
                    >
                      {isPast
                        ? 'Elapsed'
                        : remaining <= 0
                        ? 'Full (0 left)'
                        : `${remaining} / ${saunaConfig.maxCapacity} spots left`}
                    </div>
                  </div>

                  {memberBooking ? (
                    <button
                      type="button"
                      onClick={() => handleCancel(memberBooking.id)}
                      className="w-full py-1.5 rounded bg-white/15 hover:bg-white/25 text-[11px] font-semibold cursor-pointer"
                    >
                      Booked · Cancel
                    </button>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => setSelectedSlot(slot)}
                        className={`w-full py-1.5 rounded text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                          isPicked
                            ? 'bg-[#8C5227] text-white'
                            : 'bg-[#FBF6EF] border border-[#C8A882]/40 text-[#5C3A21] hover:bg-[#F3E5D3]'
                        }`}
                      >
                        {isPicked ? 'Selected' : remaining <= 0 ? 'Full' : 'Select Slot'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Upcoming & Past Sauna Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-[#C8A882]/35 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-[#C8A882]/25 bg-[#FBF6EF] flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[#4A2E19]">
              Upcoming Sauna Appointments ({upcomingSauna.length})
            </h2>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C5227]">
              Thermal Recovery
            </span>
          </div>
          {upcomingSauna.length === 0 ? (
            <div className="p-6 text-xs text-[#252823]/65">
              No upcoming sauna appointments. Select a time slot above and click Book Sauna.
            </div>
          ) : (
            <div className="divide-y divide-[#C8A882]/20">
              {upcomingSauna.map((b) => (
                <div
                  key={b.id}
                  className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-sm"
                >
                  <div>
                    <div className="font-semibold text-[#4A2E19] tabular-nums">
                      {formatDisplayDate(b.date)} · {b.timeSlot}
                    </div>
                    <div className="text-xs text-[#252823]/70 mt-0.5">
                      {b.id} · Duration: {saunaConfig.slotDurationMin} min · Complimentary
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-[#D0E3D2] text-[#245B3B] text-[10px] font-bold uppercase tracking-wider">
                      {b.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCancel(b.id)}
                      className="px-3 py-1.5 rounded-lg border border-[#AC4242]/30 bg-[#FBE7E7] text-[#AC4242] text-xs font-semibold hover:bg-[#f6d6d6] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[#252823]/10 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-[#252823]/10 bg-[#F8F7F3] flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[#252823]">
              Past &amp; Cancelled Sauna Appointments ({pastSauna.length})
            </h2>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#252823]/55">
              History
            </span>
          </div>
          {pastSauna.length === 0 ? (
            <div className="p-6 text-xs text-[#252823]/65">
              No past or cancelled sauna sessions recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-[#252823]/10">
              {pastSauna.map((b) => (
                <div
                  key={b.id}
                  className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-sm"
                >
                  <div>
                    <div className="font-semibold text-[#252823] tabular-nums">
                      {formatDisplayDate(b.date)} · {b.timeSlot}
                    </div>
                    <div className="text-xs text-[#252823]/65 mt-0.5">
                      {b.id} · Duration: {saunaConfig.slotDurationMin} min · Thermal Suite
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      b.status === 'Completed'
                        ? 'bg-[#EAE2D5] text-[#4A2E19]'
                        : 'bg-[#FBE7E7] text-[#AC4242]'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
