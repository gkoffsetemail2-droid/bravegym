import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
} from 'lucide-react';
import { useBrave } from '../context/BraveContext';
import { YogaAppointment } from '../types';
import {
  formatDisplayDate,
  getMonthCalendarDays,
  getTodayISO,
  toISODate,
} from '../utils/dateUtils';

interface YogaRescheduleModalProps {
  appointment: YogaAppointment;
  onClose: () => void;
  onSuccess?: (updated: YogaAppointment) => void;
}

export const YogaRescheduleModal: React.FC<YogaRescheduleModalProps> = ({
  appointment,
  onClose,
  onSuccess,
}) => {
  const { store, checkYogaSlotAvailability, rescheduleYoga } = useBrave();

  const initialDateObj = new Date(`${appointment.date}T00:00:00`);
  const [viewMonth, setViewMonth] = useState(
    new Date(initialDateObj.getFullYear(), initialDateObj.getMonth(), 1)
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState(appointment.templateId);
  const [selectedDate, setSelectedDate] = useState(appointment.date);
  const [selectedTime, setSelectedTime] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [completedAppt, setCompletedAppt] = useState<YogaAppointment | null>(null);

  const todayISO = getTodayISO();
  const selectedTemplate =
    store.yogaTemplates.find((t) => t.id === selectedTemplateId) ?? store.yogaTemplates[0];

  const monthDays = useMemo(
    () => getMonthCalendarDays(viewMonth.getFullYear(), viewMonth.getMonth()),
    [viewMonth]
  );

  const slotsForSelectedDate = useMemo(() => {
    if (!selectedTemplate) return [];
    return selectedTemplate.timeSlots.map((time) => {
      const isOriginal =
        selectedTemplate.id === appointment.templateId &&
        selectedDate === appointment.date &&
        time === appointment.startTime;
      const check = checkYogaSlotAvailability(
        selectedTemplate.id,
        selectedDate,
        time,
        appointment.id
      );
      return {
        time,
        available: check.available && !isOriginal,
        spotsLeft: check.spotsLeft,
        reason: isOriginal ? 'Current slot' : check.reason,
        isOriginal,
      };
    });
  }, [selectedTemplate, selectedDate, appointment, checkYogaSlotAvailability]);

  const handleConfirm = () => {
    setFeedback(null);
    if (!selectedTime) {
      setFeedback({ ok: false, text: 'Please select a new available yoga time slot.' });
      return;
    }
    const res = rescheduleYoga(appointment.id, selectedDate, selectedTime, selectedTemplateId);
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
      aria-labelledby="yoga-reschedule-title"
    >
      <div className="bg-[#F6F8F6] border border-[#2C4A3E]/20 rounded-xl max-w-4xl w-full shadow-xl overflow-hidden my-auto">
        <div className="px-6 py-4 bg-[#264538] text-[#F4F7F4] flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#D7E3DC]">
              Mind &amp; Flow Studio Rescheduling
            </p>
            <h2 id="yoga-reschedule-title" className="font-display text-lg font-bold">
              Reschedule Yoga Session · {appointment.id}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close yoga reschedule dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Current Appointment Summary */}
          <div className="rounded-lg border border-[#2C4A3E]/15 bg-white p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 text-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5B7567]">
                Current Yoga Appointment
              </div>
              <div className="font-semibold text-[#264538]">
                {appointment.style} · {appointment.instructor} · {formatDisplayDate(appointment.date)} at{' '}
                {appointment.startTime}
              </div>
              <div className="text-xs text-[#252823]/70">
                {appointment.durationMin} min · {appointment.location}
              </div>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#E3EDE7] text-[#264538] text-[11px] font-bold uppercase tracking-wider">
              {appointment.status}
            </span>
          </div>

          {completedAppt ? (
            <div className="rounded-xl border border-[#264538]/25 bg-white p-6 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#264538] shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-display text-lg font-bold text-[#264538]">
                    Yoga Session Rescheduled
                  </h3>
                  <p className="text-sm text-[#252823]/80 mt-1">
                    {completedAppt.style} with {completedAppt.instructor} moved to{' '}
                    <strong>{formatDisplayDate(completedAppt.date)}</strong> at{' '}
                    <strong>{completedAppt.startTime}</strong>.
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-lg bg-[#264538] text-white text-xs font-semibold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Calendar + Discipline Selector */}
              <div className="lg:col-span-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#5B7567] mb-1.5">
                    Yoga Discipline &amp; Instructor
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => {
                      setSelectedTemplateId(e.target.value);
                      setSelectedTime('');
                      setFeedback(null);
                    }}
                    className="w-full rounded-lg border border-[#2C4A3E]/20 bg-white px-3.5 py-2.5 text-sm font-medium text-[#264538] focus:outline-none focus:border-[#264538]"
                  >
                    {store.yogaTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.style} — {t.instructor} ({t.durationMin} min)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-xl border border-[#2C4A3E]/15 bg-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-display text-sm font-bold text-[#264538] flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#5B7567]" />
                      {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setViewMonth(
                            new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1)
                          )
                        }
                        className="p-1.5 rounded hover:bg-[#F4F7F4] text-[#264538] cursor-pointer"
                        aria-label="Previous month"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setViewMonth(
                            new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)
                          )
                        }
                        className="p-1.5 rounded hover:bg-[#F4F7F4] text-[#264538] cursor-pointer"
                        aria-label="Next month"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[#5B7567] mb-1.5">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
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
                      const runsToday = selectedTemplate?.daysOfWeek.includes(dayObj.getDay());
                      const isSelected = iso === selectedDate;
                      const clickable = inMonth && !isPast && runsToday;

                      return (
                        <button
                          key={iso}
                          type="button"
                          disabled={!clickable}
                          onClick={() => {
                            setSelectedDate(iso);
                            setSelectedTime('');
                            setFeedback(null);
                          }}
                          className={`h-9 rounded-lg text-xs font-medium tabular-nums transition-colors ${
                            !inMonth
                              ? 'text-transparent pointer-events-none'
                              : isSelected
                              ? 'bg-[#264538] text-white font-bold cursor-pointer'
                              : clickable
                              ? 'bg-[#F4F7F4] hover:bg-[#DCE7DF] text-[#264538] cursor-pointer'
                              : 'text-[#252823]/25 cursor-not-allowed'
                          }`}
                        >
                          {dayObj.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Slot Selection & Confirm */}
              <div className="lg:col-span-6 flex flex-col justify-between gap-4">
                <div className="rounded-xl border border-[#2C4A3E]/15 bg-white p-5 space-y-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#5B7567]">
                      Available Time Slots · {formatDisplayDate(selectedDate)}
                    </div>
                    <p className="text-xs text-[#252823]/65 mt-0.5">
                      {selectedTemplate?.style} ({selectedTemplate?.durationMin} min) with{' '}
                      {selectedTemplate?.instructor}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {slotsForSelectedDate.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => {
                          setSelectedTime(slot.time);
                          setFeedback(null);
                        }}
                        className={`p-3.5 rounded-lg border text-left transition-colors ${
                          selectedTime === slot.time
                            ? 'border-[#264538] bg-[#264538] text-white cursor-pointer'
                            : slot.available
                            ? 'border-[#2C4A3E]/20 bg-[#F6F8F6] hover:border-[#264538] text-[#264538] cursor-pointer'
                            : 'border-[#252823]/10 bg-[#F8F7F3] text-[#252823]/40 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm font-bold flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {slot.time}
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider">
                            {slot.isOriginal
                              ? 'Current'
                              : slot.available
                              ? `${slot.spotsLeft} spots`
                              : 'Unavailable'}
                          </span>
                        </div>
                        {slot.reason && !slot.available && (
                          <div className="text-[11px] mt-1 opacity-75">{slot.reason}</div>
                        )}
                      </button>
                    ))}
                  </div>

                  {feedback && (
                    <div className="rounded-lg border border-[#AC4242]/30 bg-[#FBE7E7] px-3.5 py-2.5 text-xs text-[#AC4242]">
                      {feedback.text}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-lg border border-[#252823]/15 text-xs font-semibold text-[#252823] hover:bg-white cursor-pointer"
                  >
                    Keep Current Slot
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={!selectedTime}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#264538] text-white text-xs font-semibold hover:bg-[#1C352A] disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>Confirm New Yoga Slot</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
