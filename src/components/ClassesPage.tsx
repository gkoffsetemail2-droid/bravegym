import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock, MapPin, UserCheck, Users } from 'lucide-react';
import { useBrave } from '../context/BraveContext';
import { BRAND_MEDIA } from '../data/brandMedia';
import { ClassBooking, DayOfWeek, GymClass } from '../types';
import {
  DAYS_OF_WEEK,
  formatDisplayDate,
  STUDIO_HOURS_12H,
  STUDIO_HOURS_24H,
  STUDIO_HOURS_STATUS,
} from '../utils/dateUtils';
import { SafeImage } from './BraveLogo';

export const ClassesPage: React.FC = () => {
  const {
    store,
    currentUser,
    getClassRemainingSpots,
    hasMemberBookedClass,
    bookClass,
    cancelClassBooking,
  } = useBrave();

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [viewMode, setViewMode] = useState<'day' | 'weekly'>('day');
  const [confirmedBooking, setConfirmedBooking] = useState<ClassBooking | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  if (!currentUser) return null;

  const isExpired = currentUser.status === 'Expired';

  const classesForSelectedDay = useMemo(() => {
    return store.classes
      .filter((c) => c.day === selectedDay)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [store.classes, selectedDay]);

  const memberBookedClasses = useMemo(() => {
    return store.classBookings.filter(
      (b) => b.memberId === currentUser.id && b.status === 'Upcoming'
    );
  }, [store.classBookings, currentUser.id]);

  const handleBook = (cls: GymClass) => {
    setFeedback(null);
    const res = bookClass(cls.id);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok && res.data) {
      setConfirmedBooking(res.data);
    }
  };

  const handleCancel = (bookingId: string) => {
    setFeedback(null);
    const res = cancelClassBooking(bookingId);
    setFeedback({ ok: res.ok, text: res.message });
    if (confirmedBooking?.id === bookingId) {
      setConfirmedBooking(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6F8569]">
            Studio Schedule
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#123F2D]">
            Group Fitness Classes
          </h1>
          <p className="mt-1 text-sm text-[#252823]/70">
            Select a training day or browse the full weekly timetable to reserve your spot.
          </p>
          <p className="mt-1.5 text-xs font-medium text-[#6F8569] tabular-nums">
            Daily Studio Hours: {STUDIO_HOURS_24H} · {STUDIO_HOURS_12H} · {STUDIO_HOURS_STATUS}
          </p>
        </div>

        <div className="inline-flex items-center p-1 rounded-lg bg-[#EAE2D5]/70 border border-[#252823]/10 self-start">
          <button
            type="button"
            onClick={() => setViewMode('day')}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              viewMode === 'day'
                ? 'bg-[#123F2D] text-[#F8F7F3]'
                : 'text-[#252823]/75 hover:text-[#123F2D]'
            }`}
          >
            Day Schedule
          </button>
          <button
            type="button"
            onClick={() => setViewMode('weekly')}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              viewMode === 'weekly'
                ? 'bg-[#123F2D] text-[#F8F7F3]'
                : 'text-[#252823]/75 hover:text-[#123F2D]'
            }`}
          >
            Weekly Timetable
          </button>
        </div>
      </div>

      {/* Studio Spaces Visual Banner */}
      <section className="rounded-xl border border-[#252823]/10 bg-white overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-4 min-h-[170px] bg-[#EAE2D5]">
          <SafeImage
            src={BRAND_MEDIA.groupCoreClass}
            alt="Brave Gym group mat and core class in session"
            className="w-full h-full object-cover object-top"
          />
        </div>
        <div className="lg:col-span-4 p-6 flex flex-col justify-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6F8569]">
            Community Training Energy
          </p>
          <h2 className="mt-1 font-display text-lg font-bold text-[#123F2D]">
            Mindful Flow, Strength &amp; Conditioning
          </h2>
          <p className="mt-2 text-xs text-[#252823]/75 leading-relaxed">
            Small-group coaching across our Mind &amp; Flow Studio, Main Conditioning Floor, and Combat Zone with live seat tracking.
          </p>
        </div>
        <div className="lg:col-span-4 min-h-[170px] bg-[#EAE2D5]">
          <SafeImage
            src={BRAND_MEDIA.freeWeightsStudio}
            alt="Member strength session inside Brave Gym free weights floor"
            className="w-full h-full object-cover object-top"
          />
        </div>
      </section>

      {/* Confirmation Banner */}
      {confirmedBooking && (
        <div className="rounded-xl border border-[#123F2D]/25 bg-[#123F2D] text-[#F8F7F3] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#EAE2D5] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs uppercase tracking-wider text-[#EAE2D5]/80 font-semibold">
                Booking Confirmed · {confirmedBooking.id}
              </div>
              <div className="font-display text-base font-bold mt-0.5">
                {confirmedBooking.classTitle} with {confirmedBooking.coach}
              </div>
              <div className="text-xs text-[#EAE2D5]/90 tabular-nums mt-0.5">
                {confirmedBooking.day} · {formatDisplayDate(confirmedBooking.date)} at{' '}
                {confirmedBooking.time} · {confirmedBooking.location}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmedBooking(null)}
            className="px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold cursor-pointer self-start sm:self-center"
          >
            Dismiss
          </button>
        </div>
      )}

      {feedback && !confirmedBooking && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.ok
              ? 'border-[#123F2D]/25 bg-[#EAE2D5]/55 text-[#123F2D]'
              : 'border-[#9E2A2B]/30 bg-[#FCEEEE] text-[#7A1E1F]'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {viewMode === 'day' ? (
        <>
          {/* Day Selector */}
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const count = store.classes.filter((c) => c.day === day).length;
              const active = selectedDay === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap border ${
                    active
                      ? 'bg-[#123F2D] text-[#F8F7F3] border-[#123F2D]'
                      : 'bg-white text-[#252823] border-[#252823]/10 hover:border-[#123F2D]/40'
                  }`}
                >
                  {day} <span className="opacity-70 tabular-nums">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Class Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {classesForSelectedDay.map((cls) => {
              const remaining = getClassRemainingSpots(cls);
              const existingBooking = hasMemberBookedClass(cls.id);
              const isFull = remaining <= 0;

              return (
                <div
                  key={cls.id}
                  className="rounded-xl border border-[#252823]/10 bg-white p-6 flex flex-col justify-between gap-5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-[#6F8569]">
                      <span className="font-medium">{cls.category}</span>
                      <span className="tabular-nums font-mono text-[#252823]/60">
                        {cls.durationMin} min
                      </span>
                    </div>

                    <div className="mt-2 flex items-baseline justify-between gap-3">
                      <h3 className="font-display text-xl font-bold text-[#123F2D]">
                        {cls.title}
                      </h3>
                      <span className="font-mono text-base font-semibold text-[#123F2D] tabular-nums">
                        {cls.time}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-[#252823]/75">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-[#6F8569]" />
                        <span className="font-medium text-[#252823]">{cls.coach}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#6F8569]" />
                        <span>{cls.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-[#6F8569]" />
                        <span className="tabular-nums">
                          {remaining} of {cls.capacity} spots remaining
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#252823]/10 flex items-center justify-between gap-3">
                    {existingBooking ? (
                      <>
                        <span className="text-xs font-semibold text-[#123F2D]">
                          Booked · {existingBooking.id}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCancel(existingBooking.id)}
                          className="px-4 py-2 rounded-lg border border-[#9E2A2B]/30 bg-[#FCEEEE] text-[#9E2A2B] text-xs font-semibold hover:bg-[#f8dede] transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Cancel Class
                        </button>
                      </>
                    ) : (
                      <>
                        <span
                          className={`text-xs font-medium ${
                            isFull ? 'text-[#9E2A2B]' : 'text-[#6F8569]'
                          }`}
                        >
                          {isFull ? 'Class Full' : 'Available'}
                        </span>
                        <button
                          type="button"
                          disabled={isExpired || isFull}
                          onClick={() => handleBook(cls)}
                          className="px-5 py-2 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-xs font-semibold tracking-wide hover:bg-[#0B2E21] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {isFull ? 'Full' : 'BOOK CLASS'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Full Weekly Timetable */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {DAYS_OF_WEEK.map((day) => {
            const dayClasses = store.classes
              .filter((c) => c.day === day)
              .sort((a, b) => a.time.localeCompare(b.time));
            return (
              <div
                key={day}
                className="rounded-xl border border-[#252823]/10 bg-white overflow-hidden flex flex-col"
              >
                <div className="px-4 py-3 bg-[#123F2D] text-[#F8F7F3] flex items-center justify-between">
                  <span className="font-display text-sm font-bold uppercase tracking-wider">
                    {day}
                  </span>
                  <span className="text-xs tabular-nums text-[#EAE2D5]/80">
                    {dayClasses.length} classes
                  </span>
                </div>
                <div className="divide-y divide-[#252823]/10 flex-1">
                  {dayClasses.map((cls) => {
                    const remaining = getClassRemainingSpots(cls);
                    const booked = hasMemberBookedClass(cls.id);
                    return (
                      <div key={cls.id} className="p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-semibold text-[#123F2D] tabular-nums flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {cls.time}
                          </span>
                          <span className="text-[11px] text-[#252823]/60 tabular-nums">
                            {remaining}/{cls.capacity} left
                          </span>
                        </div>
                        <div className="font-display text-sm font-bold text-[#252823]">
                          {cls.title}
                        </div>
                        <div className="text-xs text-[#252823]/70">{cls.coach}</div>
                        <div className="pt-1">
                          {booked ? (
                            <button
                              type="button"
                              onClick={() => handleCancel(booked.id)}
                              className="w-full py-1.5 rounded border border-[#9E2A2B]/30 bg-[#FCEEEE] text-[#9E2A2B] text-xs font-semibold cursor-pointer"
                            >
                              Booked · Cancel
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isExpired || remaining <= 0}
                              onClick={() => handleBook(cls)}
                              className="w-full py-1.5 rounded bg-[#EAE2D5]/75 hover:bg-[#123F2D] hover:text-[#F8F7F3] text-[#123F2D] text-xs font-semibold disabled:opacity-40 cursor-pointer transition-colors"
                            >
                              {remaining <= 0 ? 'Full' : 'Book Class'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Member's Currently Booked Classes */}
      <section className="rounded-xl border border-[#252823]/10 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-[#252823]/10 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-[#123F2D]">
            Your Upcoming Booked Classes ({memberBookedClasses.length})
          </h2>
        </div>
        {memberBookedClasses.length === 0 ? (
          <div className="p-6 text-xs text-[#252823]/65">
            No upcoming group classes booked yet. Select any class above to reserve your spot.
          </div>
        ) : (
          <div className="divide-y divide-[#252823]/10">
            {memberBookedClasses.map((b) => (
              <div
                key={b.id}
                className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-sm"
              >
                <div>
                  <div className="font-semibold text-[#123F2D]">
                    {b.classTitle} · {b.coach}
                  </div>
                  <div className="text-xs text-[#252823]/70 tabular-nums mt-0.5">
                    {b.id} · {b.day} ({formatDisplayDate(b.date)}) at {b.time} · {b.location}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCancel(b.id)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#9E2A2B]/30 bg-[#FCEEEE] text-[#9E2A2B] text-xs font-semibold hover:bg-[#f8dede] cursor-pointer"
                >
                  Cancel Class
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
