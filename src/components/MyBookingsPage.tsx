import React, { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useBrave } from '../context/BraveContext';
import { BookingStatus, PTAppointment, YogaAppointment } from '../types';
import { formatDisplayDate } from '../utils/dateUtils';
import { PTRescheduleModal } from './PTRescheduleModal';
import { YogaRescheduleModal } from './YogaRescheduleModal';

type BookingTypeFilter =
  | 'All'
  | 'Group Class'
  | 'Personal Training'
  | 'Yoga'
  | 'Sauna'
  | 'Locker';
type StatusFilter = 'All' | BookingStatus;

interface CentralizedBooking {
  id: string;
  type: Exclude<BookingTypeFilter, 'All'>;
  title: string;
  date: string;
  time: string;
  trainerOrCoach: string;
  location: string;
  status: BookingStatus;
  ptRaw?: PTAppointment;
  yogaRaw?: YogaAppointment;
}

export const MyBookingsPage: React.FC = () => {
  const {
    store,
    currentUser,
    setActivePage,
    cancelClassBooking,
    cancelPT,
    cancelYoga,
    cancelSauna,
    cancelLocker,
    canModifyPTAppointment,
  } = useBrave();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [typeFilter, setTypeFilter] = useState<BookingTypeFilter>('All');
  const [rescheduleTarget, setRescheduleTarget] = useState<PTAppointment | null>(null);
  const [rescheduleYogaTarget, setRescheduleYogaTarget] = useState<YogaAppointment | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  if (!currentUser) return null;

  const allBookings = useMemo<CentralizedBooking[]>(() => {
    const list: CentralizedBooking[] = [];

    store.classBookings
      .filter((b) => b.memberId === currentUser.id)
      .forEach((b) =>
        list.push({
          id: b.id,
          type: 'Group Class',
          title: b.classTitle,
          date: b.date,
          time: b.time,
          trainerOrCoach: b.coach,
          location: b.location,
          status: b.status,
        })
      );

    store.ptAppointments
      .filter((a) => a.memberId === currentUser.id)
      .forEach((a) =>
        list.push({
          id: a.id,
          type: 'Personal Training',
          title: `PT Session (${a.durationMin} min)`,
          date: a.date,
          time: a.startTime,
          trainerOrCoach: `Coach ${a.trainerName}`,
          location: 'Private Training Zone',
          status: a.status,
          ptRaw: a,
        })
      );

    store.yogaAppointments
      .filter((y) => y.memberId === currentUser.id)
      .forEach((y) =>
        list.push({
          id: y.id,
          type: 'Yoga',
          title: `${y.style} (${y.durationMin} min)`,
          date: y.date,
          time: y.startTime,
          trainerOrCoach: y.instructor,
          location: y.location,
          status: y.status,
          yogaRaw: y,
        })
      );

    store.saunaBookings
      .filter((s) => s.memberId === currentUser.id)
      .forEach((s) =>
        list.push({
          id: s.id,
          type: 'Sauna',
          title: 'Complimentary Sauna Access',
          date: s.date,
          time: s.timeSlot,
          trainerOrCoach: 'Self-Guided',
          location: 'Thermal Recovery Suite',
          status: s.status,
        })
      );

    store.lockerBookings
      .filter((l) => l.memberId === currentUser.id)
      .forEach((l) =>
        list.push({
          id: l.id,
          type: 'Locker',
          title: `Locker #${l.lockerNumber}`,
          date: l.date,
          time: `${l.startTime}–${l.endTime}`,
          trainerOrCoach: 'Online Free',
          location: Number(l.lockerNumber) <= 12 ? 'North Wing' : 'South Wing',
          status: l.status,
        })
      );

    return list.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  }, [
    store.classBookings,
    store.ptAppointments,
    store.yogaAppointments,
    store.saunaBookings,
    store.lockerBookings,
    currentUser.id,
  ]);

  const filtered = useMemo(() => {
    return allBookings.filter((b) => {
      if (statusFilter !== 'All' && b.status !== statusFilter) return false;
      if (typeFilter !== 'All' && b.type !== typeFilter) return false;
      return true;
    });
  }, [allBookings, statusFilter, typeFilter]);

  const handleCancel = (item: CentralizedBooking) => {
    let res;
    if (item.type === 'Group Class') res = cancelClassBooking(item.id);
    else if (item.type === 'Personal Training') res = cancelPT(item.id);
    else if (item.type === 'Yoga') res = cancelYoga(item.id);
    else if (item.type === 'Sauna') res = cancelSauna(item.id);
    else res = cancelLocker(item.id);

    setFeedback({ ok: res.ok, text: res.message });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6F8569]">
            Unified Appointment Ledger
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#123F2D]">
            My Bookings
          </h1>
          <p className="mt-1 text-sm text-[#252823]/70">
            View, filter, reschedule, or cancel your Group Classes, Personal Training, Sauna, and Locker reservations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActivePage('pt-schedule')}
          className="px-4 py-2.5 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-xs font-semibold hover:bg-[#0B2E21] cursor-pointer self-start"
        >
          Open Interactive PT Calendar
        </button>
      </div>

      {feedback && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.ok
              ? 'border-[#123F2D]/25 bg-[#EAE2D5]/60 text-[#123F2D]'
              : 'border-[#9E2A2B]/30 bg-[#FCEEEE] text-[#7A1E1F]'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-[#252823]/10 bg-white p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#F8F7F3] border border-[#252823]/10">
          {(['All', 'Upcoming', 'Completed', 'Cancelled'] as StatusFilter[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#123F2D] text-[#F8F7F3]'
                  : 'text-[#252823]/70 hover:text-[#123F2D]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            ['All', 'Group Class', 'Personal Training', 'Yoga', 'Sauna', 'Locker'] as BookingTypeFilter[]
          ).map((tp) => (
            <button
              key={tp}
              type="button"
              onClick={() => setTypeFilter(tp)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                typeFilter === tp
                  ? 'border-[#123F2D] bg-[#EAE2D5]/70 text-[#123F2D] font-semibold'
                  : 'border-[#252823]/15 text-[#252823]/75 hover:border-[#123F2D]/40'
              }`}
            >
              {tp}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table / List */}
      <div className="rounded-xl border border-[#252823]/10 bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm text-[#252823]/70">
              No appointments match your selected filter criteria.
            </p>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('All');
                setTypeFilter('All');
              }}
              className="px-4 py-2 rounded-lg border border-[#252823]/15 text-xs font-semibold text-[#123F2D] cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#252823]/10 bg-[#F8F7F3] text-[11px] uppercase tracking-wider text-[#6F8569]">
                  <th className="py-3.5 px-5 font-semibold">Booking ID</th>
                  <th className="py-3.5 px-5 font-semibold">Type &amp; Service</th>
                  <th className="py-3.5 px-5 font-semibold">Date &amp; Time</th>
                  <th className="py-3.5 px-5 font-semibold">Trainer / Coach</th>
                  <th className="py-3.5 px-5 font-semibold">Location</th>
                  <th className="py-3.5 px-5 font-semibold">Status</th>
                  <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252823]/10">
                {filtered.map((item) => {
                  const ptMod = item.ptRaw ? canModifyPTAppointment(item.ptRaw) : null;
                  return (
                    <tr key={item.id} className="hover:bg-[#F8F7F3]/60 transition-colors">
                      <td className="py-4 px-5 font-mono text-xs font-semibold text-[#252823]/75 whitespace-nowrap">
                        {item.id}
                      </td>
                      <td className="py-4 px-5">
                        <div className="text-xs font-semibold text-[#6F8569]">{item.type}</div>
                        <div className="font-semibold text-[#123F2D]">{item.title}</div>
                      </td>
                      <td className="py-4 px-5 tabular-nums whitespace-nowrap">
                        <div className="font-medium text-[#252823]">
                          {formatDisplayDate(item.date)}
                        </div>
                        <div className="text-xs text-[#252823]/65">{item.time}</div>
                      </td>
                      <td className="py-4 px-5 text-xs font-medium text-[#252823]">
                        {item.trainerOrCoach}
                      </td>
                      <td className="py-4 px-5 text-xs text-[#252823]/75">{item.location}</td>
                      <td className="py-4 px-5">
                        <span
                          className={`text-xs font-semibold ${
                            item.status === 'Upcoming'
                              ? 'text-[#123F2D]'
                              : item.status === 'Completed'
                              ? 'text-[#6F8569]'
                              : 'text-[#9E2A2B]'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        {item.status === 'Upcoming' ? (
                          <div className="inline-flex items-center gap-2">
                            {item.ptRaw && (
                              <button
                                type="button"
                                disabled={!ptMod?.allowed}
                                title={ptMod?.reason}
                                onClick={() => setRescheduleTarget(item.ptRaw!)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-xs font-semibold hover:bg-[#0B2E21] disabled:opacity-45 cursor-pointer"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>RESCHEDULE</span>
                              </button>
                            )}
                            {item.yogaRaw && (
                              <button
                                type="button"
                                onClick={() => setRescheduleYogaTarget(item.yogaRaw!)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#264538] text-white text-xs font-semibold hover:bg-[#1C352A] cursor-pointer"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>RESCHEDULE</span>
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={ptMod ? !ptMod.allowed : false}
                              title={ptMod?.reason}
                              onClick={() => handleCancel(item)}
                              className="px-3 py-1.5 rounded-lg border border-[#9E2A2B]/30 bg-[#FCEEEE] text-[#9E2A2B] text-xs font-semibold hover:bg-[#f8dede] disabled:opacity-45 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#252823]/40">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rescheduleTarget && (
        <PTRescheduleModal
          appointment={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onSuccess={(updated) =>
            setFeedback({
              ok: true,
              text: `Rescheduled ${updated.id} to ${updated.date} at ${updated.startTime} with Coach ${updated.trainerName}.`,
            })
          }
        />
      )}

      {rescheduleYogaTarget && (
        <YogaRescheduleModal
          appointment={rescheduleYogaTarget}
          onClose={() => setRescheduleYogaTarget(null)}
          onSuccess={(updated) =>
            setFeedback({
              ok: true,
              text: `Rescheduled ${updated.style} to ${updated.date} at ${updated.startTime}.`,
            })
          }
        />
      )}
    </div>
  );
};
