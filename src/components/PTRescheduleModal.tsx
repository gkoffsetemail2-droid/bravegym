import React, { useMemo, useState } from 'react';
import { ArrowRight, Calendar, CheckCircle2, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import { useBrave } from '../context/BraveContext';
import { PTAppointment } from '../types';
import {
  formatDisplayDate,
  getMonthCalendarDays,
  getTodayISO,
  minutesToTime,
  toISODate,
} from '../utils/dateUtils';

interface PTRescheduleModalProps {
  appointment: PTAppointment;
  onClose: () => void;
  onSuccess?: (updated: PTAppointment) => void;
}

export const PTRescheduleModal: React.FC<PTRescheduleModalProps> = ({
  appointment,
  onClose,
  onSuccess,
}) => {
  const { store, checkPTSlotAvailability, reschedulePT, canModifyPTAppointment } = useBrave();

  const initialDateObj = new Date();
  const [viewMonth, setViewMonth] = useState(
    new Date(initialDateObj.getFullYear(), initialDateObj.getMonth(), 1)
  );
  const [selectedTrainerId, setSelectedTrainerId] = useState(appointment.trainerId);
  const [selectedDate, setSelectedDate] = useState(appointment.date);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [completedAppt, setCompletedAppt] = useState<PTAppointment | null>(null);

  const todayISO = getTodayISO();
  const policyStatus = canModifyPTAppointment(appointment);
  const selectedTrainer = store.trainers.find((t) => t.id === selectedTrainerId);

  const monthDays = useMemo(
    () => getMonthCalendarDays(viewMonth.getFullYear(), viewMonth.getMonth()),
    [viewMonth]
  );

  const timeSlotsForDate = useMemo(() => {
    if (!selectedTrainer) return [];
    const list: {
      time: string;
      available: boolean;
      reason?: string;
      isOriginalSlot: boolean;
    }[] = [];
    for (let h = selectedTrainer.startHour; h < selectedTrainer.endHour; h++) {
      const timeStr = minutesToTime(h * 60);
      const isOriginalSlot =
        selectedTrainer.id === appointment.trainerId &&
        selectedDate === appointment.date &&
        timeStr === appointment.startTime;

      const check = checkPTSlotAvailability(
        selectedTrainer.id,
        selectedDate,
        timeStr,
        appointment.durationMin,
        appointment.id,
        appointment.memberId
      );

      list.push({
        time: timeStr,
        available: check.available && !isOriginalSlot,
        reason: isOriginalSlot ? 'Current slot' : check.message,
        isOriginalSlot,
      });
    }
    return list;
  }, [selectedTrainer, selectedDate, appointment, checkPTSlotAvailability]);

  const handleConfirm = () => {
    setFeedback(null);
    if (!selectedTime) {
      setFeedback({ ok: false, text: 'Please select a new available time slot.' });
      return;
    }
    const res = reschedulePT(appointment.id, selectedDate, selectedTime, selectedTrainerId);
    if (!res.ok) {
      setFeedback({ ok: false, text: res.message });
      return;
    }
    setCompletedAppt(res.data ?? null);
    if (res.data && onSuccess) {
      onSuccess(res.data);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reschedule-modal-title"
    >
      <div className="bg-[#F8F7F3] border border-[#252823]/15 rounded-xl max-w-4xl w-full shadow-xl overflow-hidden my-auto">
        <div className="px-6 py-4 bg-[#123F2D] text-[#F8F7F3] flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#EAE2D5]/80">
              Interactive PT Rescheduling
            </p>
            <h2 id="reschedule-modal-title" className="font-display text-lg font-bold">
              Reschedule Appointment · {appointment.id}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close reschedule dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {completedAppt ? (
          <div className="p-8 text-center space-y-5">
            <div className="w-12 h-12 rounded-full bg-[#123F2D] text-[#F8F7F3] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-[#123F2D]">
                Appointment Rescheduled
              </h3>
              <p className="mt-2 text-sm text-[#252823]/75">
                Your previous slot has been released and your new session is confirmed across your calendar and bookings.
              </p>
            </div>
            <div className="max-w-md mx-auto rounded-lg border border-[#252823]/15 bg-white p-5 text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#252823]/60">Booking ID</span>
                <span className="font-mono font-semibold">{completedAppt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#252823]/60">Trainer</span>
                <span className="font-semibold">Coach {completedAppt.trainerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#252823]/60">New Date</span>
                <span className="font-semibold tabular-nums">
                  {formatDisplayDate(completedAppt.date)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#252823]/60">New Time</span>
                <span className="font-semibold tabular-nums">
                  {completedAppt.startTime} ({completedAppt.durationMin} min)
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-sm font-semibold hover:bg-[#0B2E21] cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
            {/* Policy Notice */}
            <div className="rounded-lg border border-[#6F8569]/30 bg-[#EAE2D5]/50 px-4 py-3 text-xs text-[#252823]/85 flex flex-wrap items-center justify-between gap-2">
              <span>
                <strong>Club Rescheduling Policy:</strong> Appointments may be rescheduled up to{' '}
                {store.policyConfig.ptCancelNoticeHours} hours before session start. Old slots are automatically released upon confirmation.
              </span>
              {!policyStatus.allowed && (
                <span className="font-semibold text-[#9E2A2B]">{policyStatus.reason}</span>
              )}
            </div>

            {feedback && !feedback.ok && (
              <div className="rounded-lg border border-[#9E2A2B]/30 bg-[#FCEEEE] px-4 py-3 text-sm text-[#7A1E1F]">
                {feedback.text}
              </div>
            )}

            {/* Trainer Selector + Interactive Calendar + Time Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Calendar Column */}
              <div className="lg:col-span-6 rounded-xl border border-[#252823]/10 bg-white p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6F8569] mb-2">
                    1. Trainer
                  </label>
                  <select
                    value={selectedTrainerId}
                    onChange={(e) => {
                      setSelectedTrainerId(e.target.value);
                      setSelectedTime('');
                    }}
                    className="w-full rounded-lg border border-[#252823]/15 bg-[#F8F7F3] px-3 py-2.5 text-sm font-medium text-[#252823] focus:outline-none focus:border-[#123F2D]"
                  >
                    {store.trainers
                      .filter((t) => t.active)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          Coach {t.name} — {t.specialization}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#6F8569]">
                      2. Select New Date
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setViewMonth(
                            new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1)
                          )
                        }
                        className="p-1 rounded hover:bg-[#F8F7F3] cursor-pointer"
                        aria-label="Previous month"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-semibold px-2 tabular-nums">
                        {viewMonth.toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setViewMonth(
                            new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)
                          )
                        }
                        className="p-1 rounded hover:bg-[#F8F7F3] cursor-pointer"
                        aria-label="Next month"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-[#252823]/55 mb-1">
                    {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
                      <div key={d} className="py-1">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {monthDays.map((dayObj) => {
                      const iso = toISODate(dayObj);
                      const inMonth = dayObj.getMonth() === viewMonth.getMonth();
                      const isPast = iso < todayISO;
                      const isOffDay =
                        selectedTrainer && !selectedTrainer.workingDays.includes(dayObj.getDay());
                      const disabled = isPast || !!isOffDay;
                      const isSelected = iso === selectedDate;

                      return (
                        <button
                          key={iso}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            setSelectedDate(iso);
                            setSelectedTime('');
                          }}
                          className={`h-9 rounded-lg text-xs font-medium tabular-nums transition-colors ${
                            disabled
                              ? 'text-[#252823]/25 cursor-not-allowed bg-[#F8F7F3]/50'
                              : isSelected
                              ? 'bg-[#123F2D] text-[#F8F7F3] font-semibold cursor-pointer'
                              : inMonth
                              ? 'hover:bg-[#EAE2D5] text-[#252823] cursor-pointer'
                              : 'text-[#252823]/40 hover:bg-[#F8F7F3] cursor-pointer'
                          }`}
                        >
                          {dayObj.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Time Slots Column */}
              <div className="lg:col-span-6 rounded-xl border border-[#252823]/10 bg-white p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#6F8569]">
                      3. Available Time Slots
                    </span>
                    <span className="text-xs text-[#252823]/70 tabular-nums">
                      {formatDisplayDate(selectedDate)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {timeSlotsForDate.map((slot) => {
                      const active = selectedTime === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          title={slot.reason || 'Available'}
                          className={`px-3 py-2.5 rounded-lg border text-xs font-medium tabular-nums text-left transition-colors ${
                            !slot.available
                              ? 'border-[#252823]/10 bg-[#F8F7F3] text-[#252823]/35 cursor-not-allowed'
                              : active
                              ? 'border-[#123F2D] bg-[#123F2D] text-[#F8F7F3] cursor-pointer'
                              : 'border-[#252823]/15 bg-white text-[#252823] hover:border-[#123F2D] hover:bg-[#EAE2D5]/40 cursor-pointer'
                          }`}
                        >
                          <div className="font-semibold">{slot.time}</div>
                          <div className="text-[10px] opacity-80 truncate">
                            {slot.isOriginalSlot
                              ? 'Current'
                              : slot.available
                              ? 'Available'
                              : 'Occupied'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Side-by-side Comparison */}
                <div className="mt-6 pt-4 border-t border-[#252823]/10">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#6F8569] mb-3">
                    Appointment Comparison
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-11 gap-2 items-center text-xs">
                    <div className="sm:col-span-5 rounded-lg bg-[#F8F7F3] border border-[#252823]/10 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-[#252823]/55">
                        Current Appointment
                      </div>
                      <div className="font-semibold text-[#252823] mt-1">
                        Coach {appointment.trainerName}
                      </div>
                      <div className="text-[#252823]/75 tabular-nums mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{appointment.date}</span>
                      </div>
                      <div className="text-[#252823]/75 tabular-nums flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{appointment.startTime}</span>
                      </div>
                    </div>

                    <div className="sm:col-span-1 flex justify-center">
                      <ArrowRight className="w-4 h-4 text-[#6F8569]" />
                    </div>

                    <div className="sm:col-span-5 rounded-lg bg-[#EAE2D5]/60 border border-[#123F2D]/25 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-[#123F2D]">
                        New Appointment
                      </div>
                      <div className="font-semibold text-[#123F2D] mt-1">
                        Coach {selectedTrainer?.name ?? appointment.trainerName}
                      </div>
                      <div className="text-[#123F2D] tabular-nums mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{selectedDate}</span>
                      </div>
                      <div className="text-[#123F2D] tabular-nums flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{selectedTime || 'Select time'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#252823]/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg border border-[#252823]/15 text-sm font-medium text-[#252823] hover:bg-white cursor-pointer"
              >
                Keep Current Time
              </button>
              <button
                type="button"
                disabled={!policyStatus.allowed || !selectedTime}
                onClick={handleConfirm}
                className="px-5 py-2.5 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-sm font-semibold hover:bg-[#0B2E21] disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
