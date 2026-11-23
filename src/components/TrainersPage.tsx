import React, { useMemo, useState } from 'react';
import { Award, Calendar, CheckCircle2, Clock, Coffee, Dumbbell, X } from 'lucide-react';
import { useBrave } from '../context/BraveContext';
import { BRAND_MEDIA } from '../data/brandMedia';
import { PTAppointment, Trainer } from '../types';
import {
  addDaysISO,
  formatDisplayDate,
  getTodayISO,
  minutesToTime,
  STUDIO_HOURS_12H,
  STUDIO_HOURS_24H,
  STUDIO_HOURS_STATUS,
} from '../utils/dateUtils';
import { SafeImage } from './BraveLogo';

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const TrainersPage: React.FC = () => {
  const {
    store,
    currentUser,
    setActivePage,
    setPreselectedTrainerId,
    getMemberPTCreditsRemaining,
    checkPTSlotAvailability,
    bookPT,
  } = useBrave();

  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(addDaysISO(getTodayISO(), 1));
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [bookingResult, setBookingResult] = useState<PTAppointment | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!currentUser) return null;

  const isExpired = currentUser.status === 'Expired';
  const creditsRemaining = getMemberPTCreditsRemaining(currentUser);
  const activeTrainers = store.trainers.filter((t) => t.active);

  const slotsForTrainerDate = useMemo(() => {
    if (!selectedTrainer) return [];
    const list: { time: string; available: boolean; message?: string }[] = [];
    for (let h = selectedTrainer.startHour; h < selectedTrainer.endHour; h++) {
      const time = minutesToTime(h * 60);
      const check = checkPTSlotAvailability(
        selectedTrainer.id,
        selectedDate,
        time,
        store.policyConfig.ptDefaultDurationMin,
        undefined,
        currentUser.id
      );
      list.push({ time, available: check.available, message: check.message });
    }
    return list;
  }, [selectedTrainer, selectedDate, store.policyConfig.ptDefaultDurationMin, currentUser.id, checkPTSlotAvailability]);

  const handleOpenTrainer = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    setSelectedTime('');
    setNotes('');
    setBookingResult(null);
    setErrorMsg(null);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainer) return;
    setErrorMsg(null);
    if (!selectedTime) {
      setErrorMsg('Please select an available time slot.');
      return;
    }
    const res = bookPT({
      trainerId: selectedTrainer.id,
      date: selectedDate,
      startTime: selectedTime,
      durationMin: store.policyConfig.ptDefaultDurationMin,
      packageType: 'PT Session Credit',
      notes,
    });
    if (!res.ok) {
      setErrorMsg(res.message);
      return;
    }
    setBookingResult(res.data ?? null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6F8569]">
            Coaching Roster
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#123F2D]">
            Personal Trainers
          </h1>
          <p className="mt-1 text-sm text-[#252823]/70">
            Select a Brave Gym coach to view availability and schedule a 60-minute personal training session.
          </p>
          <p className="mt-1.5 text-xs font-medium text-[#6F8569] tabular-nums">
            Daily Studio Hours: {STUDIO_HOURS_24H} · {STUDIO_HOURS_12H} · {STUDIO_HOURS_STATUS}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-[#252823]/75 tabular-nums">
            Credits Available:{' '}
            <strong className="text-[#123F2D] text-sm">{creditsRemaining}</strong>
          </div>
          <button
            type="button"
            onClick={() => setActivePage('pt-schedule')}
            className="px-4 py-2 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-xs font-semibold hover:bg-[#0B2E21] transition-colors cursor-pointer whitespace-nowrap"
          >
            Open My PT Schedule
          </button>
        </div>
      </div>

      {/* Personal Training Experience Split Showcase */}
      <section className="rounded-xl border border-[#252823]/10 bg-white overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-5 min-h-[240px] bg-[#EAE2D5]">
          <SafeImage
            src={BRAND_MEDIA.ptCoaching}
            alt="Brave Gym personal trainer guiding a client through form alignment"
            className="w-full h-full object-cover object-top"
          />
        </div>
        <div className="lg:col-span-4 p-6 sm:p-7 flex flex-col justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6F8569]">
              1-on-1 Precision Coaching
            </p>
            <h2 className="mt-1 font-display text-xl font-bold text-[#123F2D] [text-wrap:balance]">
              Tailored programming, hands-on form guidance, measurable results.
            </h2>
            <p className="mt-2 text-xs text-[#252823]/75 leading-relaxed">
              Every 60-minute session pairs you with a dedicated Brave Gym coach for progressive strength, mobility assessment, and technique cueing on our private floor.
            </p>
          </div>
          <div className="text-xs text-[#123F2D] font-semibold pt-2 border-t border-[#252823]/10">
            Select any coach below to inspect live slots or open My PT Schedule.
          </div>
        </div>
        <div className="lg:col-span-3 min-h-[200px] bg-[#EAE2D5]">
          <SafeImage
            src={BRAND_MEDIA.cableStrength}
            alt="Strength training on cable tower at Brave Gym"
            className="w-full h-full object-cover object-top"
          />
        </div>
      </section>

      {/* Trainers Grid — Clean, Compact Text-Based Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {activeTrainers.map((trainer) => {
          const scheduleStr = trainer.workingDays.map((d) => DAY_NAMES_SHORT[d]).join(' · ');
          const hoursStr = `${String(trainer.startHour).padStart(2, '0')}:00–${String(
            trainer.endHour
          ).padStart(2, '0')}:00`;
          const breakStr =
            trainer.breakHours.length > 0
              ? trainer.breakHours
                  .map((h) => `${String(h).padStart(2, '0')}:00`)
                  .join(', ')
              : 'Flexible';
          const isSenior = trainer.tier === 'senior';

          return (
            <article
              key={trainer.id}
              className="rounded-xl border border-[#252823]/12 bg-white overflow-hidden flex flex-col justify-between shadow-xs hover:border-[#123F2D]/35 transition-colors"
            >
              <div>
                {/* Compact Dark-Green / Warm-Neutral Text Header */}
                <div className="px-5 pt-5 pb-4 bg-[#F8F7F3] border-b border-[#252823]/10">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        isSenior
                          ? 'bg-[#123F2D] text-[#F8F7F3]'
                          : 'bg-[#EAE2D5] text-[#123F2D]'
                      }`}
                    >
                      {isSenior ? 'Senior Coach Tier' : 'Club Coach Tier'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6F8569]">
                      <Award className="w-3.5 h-3.5 shrink-0" />
                      <span>{trainer.experience}</span>
                    </span>
                  </div>

                  <h2 className="mt-3 font-display text-xl font-bold tracking-tight text-[#123F2D]">
                    Coach {trainer.name}
                  </h2>
                  <p className="mt-0.5 text-xs font-semibold text-[#252823]/80">
                    {trainer.specialization}
                  </p>
                </div>

                {/* Bio & Structured Training Schedule */}
                <div className="p-5 space-y-4">
                  <p className="text-xs text-[#252823]/75 leading-relaxed">{trainer.bio}</p>

                  <div className="rounded-lg border border-[#252823]/10 bg-[#F8F7F3]/75 p-3.5 space-y-2 text-xs text-[#252823]/80">
                    <div className="flex items-start gap-2.5">
                      <Calendar className="w-3.5 h-3.5 text-[#123F2D] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-[#6F8569] block">
                          Training Days
                        </span>
                        <span className="font-medium text-[#252823]">{scheduleStr}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 tabular-nums">
                      <Clock className="w-3.5 h-3.5 text-[#123F2D] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-[#6F8569] block">
                          Coaching Hours
                        </span>
                        <span className="font-semibold text-[#123F2D]">{hoursStr}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#252823]/10 text-[11px] text-[#252823]/70">
                      <span className="inline-flex items-center gap-1.5 tabular-nums">
                        <Coffee className="w-3 h-3 text-[#6F8569]" />
                        Break: {breakStr}
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-medium text-[#123F2D]">
                        <Dumbbell className="w-3 h-3 text-[#6F8569]" />
                        {store.policyConfig.ptDefaultDurationMin}-Min Session
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOpenTrainer(trainer)}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-xs font-semibold tracking-wider uppercase hover:bg-[#0B2E21] transition-colors cursor-pointer whitespace-nowrap"
                >
                  BOOK TRAINER
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreselectedTrainerId(trainer.id);
                    setActivePage('pt-schedule');
                  }}
                  className="py-2.5 px-3.5 rounded-lg border border-[#252823]/15 text-xs font-semibold text-[#123F2D] hover:bg-[#F8F7F3] cursor-pointer whitespace-nowrap"
                >
                  Calendar
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Trainer Detail & Booking Modal */}
      {selectedTrainer && (
        <div
          className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#F8F7F3] rounded-xl border border-[#252823]/15 max-w-2xl w-full overflow-hidden shadow-xl my-auto">
            <div className="px-6 py-4 bg-[#123F2D] text-[#F8F7F3] flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#EAE2D5]/80">
                  Personal Training Booking
                </p>
                <h2 className="font-display text-lg font-bold">Coach {selectedTrainer.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTrainer(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                aria-label="Close trainer booking"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingResult ? (
              <div className="p-8 text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-[#123F2D] mx-auto" />
                <h3 className="font-display text-2xl font-bold text-[#123F2D]">
                  PT Session Confirmed
                </h3>
                <p className="text-sm text-[#252823]/75">
                  Added to your PT Calendar and My Bookings.
                </p>
                <div className="max-w-sm mx-auto rounded-lg bg-white border border-[#252823]/10 p-4 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#252823]/60">Booking ID</span>
                    <span className="font-mono font-semibold">{bookingResult.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#252823]/60">Coach</span>
                    <span className="font-semibold">Coach {bookingResult.trainerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#252823]/60">Date &amp; Time</span>
                    <span className="font-semibold tabular-nums">
                      {bookingResult.date} · {bookingResult.startTime}
                    </span>
                  </div>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTrainer(null);
                      setActivePage('pt-schedule');
                    }}
                    className="px-5 py-2.5 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-xs font-semibold cursor-pointer"
                  >
                    View on PT Calendar
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTrainer(null)}
                    className="px-4 py-2.5 rounded-lg border border-[#252823]/15 text-xs font-semibold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
                <div className="bg-white rounded-lg border border-[#252823]/10 p-4 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold">
                    <span className="text-[#123F2D] uppercase tracking-wider">
                      {selectedTrainer.tier === 'senior' ? 'Senior Coach Tier' : 'Club Coach Tier'}
                    </span>
                    <span className="text-[#6F8569]">{selectedTrainer.experience}</span>
                  </div>
                  <div className="font-display text-base font-bold text-[#123F2D]">
                    Coach {selectedTrainer.name}
                  </div>
                  <div className="text-xs text-[#252823]/75">
                    {selectedTrainer.specialization}
                  </div>
                  <div className="text-[11px] text-[#6F8569] pt-1 tabular-nums">
                    {String(selectedTrainer.startHour).padStart(2, '0')}:00–
                    {String(selectedTrainer.endHour).padStart(2, '0')}:00 ·{' '}
                    {store.policyConfig.ptDefaultDurationMin}-Minute Session · {creditsRemaining} PT Credits Remaining
                  </div>
                </div>

                {creditsRemaining <= 0 && (
                  <div className="rounded-lg border border-[#9A671F]/30 bg-[#FDF6E9] px-4 py-3 text-xs text-[#7A5214] flex items-center justify-between gap-3">
                    <span>You currently have 0 PT session credits remaining.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTrainer(null);
                        setActivePage('packages');
                      }}
                      className="font-semibold underline cursor-pointer whitespace-nowrap"
                    >
                      Buy PT Package
                    </button>
                  </div>
                )}

                {errorMsg && (
                  <div className="rounded-lg border border-[#9E2A2B]/30 bg-[#FCEEEE] px-4 py-3 text-xs text-[#7A1E1F]">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6F8569] mb-2">
                    1. Select Date
                  </label>
                  <input
                    type="date"
                    min={getTodayISO()}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTime('');
                    }}
                    className="w-full rounded-lg border border-[#252823]/15 bg-white px-4 py-2.5 text-sm tabular-nums focus:outline-none focus:border-[#123F2D]"
                  />
                  <div className="mt-1 text-[11px] text-[#252823]/60">
                    {formatDisplayDate(selectedDate)}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6F8569] mb-2">
                    2. Available Time Slots
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slotsForTrainerDate.map((slot) => {
                      const active = selectedTime === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          title={slot.message || 'Available'}
                          className={`px-3 py-2 rounded-lg border text-xs font-medium tabular-nums text-left transition-colors ${
                            !slot.available
                              ? 'border-[#252823]/10 bg-[#EAE2D5]/40 text-[#252823]/35 cursor-not-allowed'
                              : active
                              ? 'border-[#123F2D] bg-[#123F2D] text-[#F8F7F3] cursor-pointer'
                              : 'border-[#252823]/15 bg-white hover:border-[#123F2D] cursor-pointer'
                          }`}
                        >
                          <div className="font-semibold">{slot.time}</div>
                          <div className="text-[10px] opacity-75">
                            {slot.available ? 'Open' : 'Unavailable'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6F8569] mb-2">
                    3. Session Goals / Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., Lower body strength, squat form check, mobility warm-up..."
                    className="w-full rounded-lg border border-[#252823]/15 bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-[#123F2D]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#252823]/10">
                  <button
                    type="button"
                    onClick={() => setSelectedTrainer(null)}
                    className="px-4 py-2.5 rounded-lg border border-[#252823]/15 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isExpired || creditsRemaining <= 0 || !selectedTime}
                    className="px-5 py-2.5 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-xs font-semibold hover:bg-[#0B2E21] disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Confirm PT Booking
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
