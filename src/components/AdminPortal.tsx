import React, { useMemo, useState } from 'react';
import {
  Check,
  CreditCard,
  Dumbbell,
  Flame,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react';
import { useBrave } from '../context/BraveContext';
import {
  AdminTabId,
  DayOfWeek,
  GymClass,
  MembershipCategory,
  MembershipStatus,
  Trainer,
} from '../types';
import {
  DAYS_OF_WEEK,
  formatRupiah,
  getTodayISO,
  STUDIO_HOURS_12H,
  STUDIO_HOURS_24H,
  STUDIO_HOURS_STATUS,
} from '../utils/dateUtils';
import { getMembershipTheme } from '../utils/membershipTheme';
import { BraveLogo } from './BraveLogo';

const ADMIN_TABS: { id: AdminTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview & Bookings', icon: LayoutDashboard },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'classes', label: 'Classes', icon: Dumbbell },
  { id: 'trainers', label: 'Trainers & Policy', icon: Users },
  { id: 'packages', label: 'PT Packages', icon: Package },
  { id: 'sauna', label: 'Sauna', icon: Flame },
  { id: 'lockers', label: 'Lockers', icon: KeyRound },
  { id: 'payments', label: 'Payments', icon: CreditCard },
];

export const AdminPortal: React.FC = () => {
  const {
    store,
    currentUser,
    logout,
    adminUpdateMemberStatus,
    adminAddMember,
    adminUpdateClass,
    adminAddClass,
    adminDeleteClass,
    adminUpdateTrainer,
    adminAddTrainer,
    adminUpdatePackagePrice,
    adminUpdateSaunaConfig,
    adminToggleLockerStatus,
    adminApprovePayment,
    adminRejectPayment,
    adminUpdatePolicyConfig,
    adminCompletePTAppointment,
  } = useBrave();

  const [tab, setTab] = useState<AdminTabId>('overview');
  const [memberSearch, setMemberSearch] = useState('');
  const [adminFeedback, setAdminFeedback] = useState<string | null>(null);

  // Add Member form
  const [newMemName, setNewMemName] = useState('');
  const [newMemGmail, setNewMemGmail] = useState('');
  const [newMemId, setNewMemId] = useState('');
  const [newMemCat, setNewMemCat] = useState<MembershipCategory>('Regular');
  const [newMemExp, setNewMemExp] = useState('2027-12-31');

  // Add Class form
  const [newClsDay, setNewClsDay] = useState<DayOfWeek>('Monday');
  const [newClsTime, setNewClsTime] = useState('16:00');
  const [newClsTitle, setNewClsTitle] = useState('');
  const [newClsCoach, setNewClsCoach] = useState('');
  const [newClsCapacity, setNewClsCapacity] = useState(14);

  // Add Trainer form
  const [newTrnName, setNewTrnName] = useState('');
  const [newTrnTier, setNewTrnTier] = useState<'senior' | 'standard'>('standard');
  const [newTrnSpec, setNewTrnSpec] = useState('');
  const [newTrnExp, setNewTrnExp] = useState('3 Years Experience');

  // Sauna config local form
  const [saunaForm, setSaunaForm] = useState(store.saunaConfig);
  const [blockedDateInput, setBlockedDateInput] = useState('');

  // Policy local form
  const [policyForm, setPolicyForm] = useState(store.policyConfig);

  if (!currentUser || currentUser.role !== 'admin') return null;

  const todayISO = getTodayISO();
  const activeMembersCount = store.members.filter(
    (m) => m.role === 'member' && m.status === 'Active'
  ).length;
  const classBookingsToday = store.classBookings.filter(
    (b) => b.status === 'Upcoming' && b.date === todayISO
  ).length;
  const ptToday = store.ptAppointments.filter(
    (a) => a.status === 'Upcoming' && a.date === todayISO
  ).length;
  const totalSaunaUpcoming = store.saunaBookings.filter((b) => b.status === 'Upcoming').length;
  const totalLockerUpcoming = store.lockerBookings.filter((b) => b.status === 'Upcoming').length;
  const pendingPaymentsCount = store.payments.filter(
    (p) => p.status === 'Pending Verification'
  ).length;

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    return store.members.filter((m) => {
      if (m.role === 'admin') return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.gmail.toLowerCase().includes(q) ||
        m.membershipId.toLowerCase().includes(q)
      );
    });
  }, [store.members, memberSearch]);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemName.trim() || !newMemGmail.trim() || !newMemId.trim()) return;
    const res = adminAddMember({
      name: newMemName.trim(),
      gmail: newMemGmail.trim().toLowerCase(),
      membershipId: newMemId.trim().toUpperCase(),
      category: newMemCat,
      status: 'Active',
      expirationDate: newMemExp,
      role: 'member',
      phone: '+62 812-0000-0000',
      joinDate: todayISO,
      ptCreditsTotal: 0,
      ptCreditsUsed: 0,
    });
    setAdminFeedback(res.message);
    if (res.ok) {
      setNewMemName('');
      setNewMemGmail('');
      setNewMemId('');
    }
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClsTitle.trim() || !newClsCoach.trim()) return;
    adminAddClass({
      day: newClsDay,
      time: newClsTime,
      title: newClsTitle.trim(),
      coach: newClsCoach.trim(),
      durationMin: 60,
      location: 'Main Conditioning Floor',
      capacity: newClsCapacity,
      mockOccupiedCount: 0,
      category: 'Strength & Conditioning',
    });
    setAdminFeedback(`Added ${newClsTitle} on ${newClsDay} at ${newClsTime}.`);
    setNewClsTitle('');
    setNewClsCoach('');
  };

  const handleAddTrainer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrnName.trim() || !newTrnSpec.trim()) return;
    adminAddTrainer({
      name: newTrnName.trim(),
      tier: newTrnTier,
      specialization: newTrnSpec.trim(),
      experience: newTrnExp,
      bio: `Brave Gym certified personal trainer specializing in ${newTrnSpec.trim()}.`,
      workingDays: [1, 2, 3, 4, 5, 6],
      startHour: 6,
      endHour: 23,
      breakHours: [12],
      active: true,
    });
    setAdminFeedback(`Added Coach ${newTrnName.trim()} to coaching roster.`);
    setNewTrnName('');
    setNewTrnSpec('');
  };

  return (
    <div className="min-h-screen bg-[#F8F7F3] text-[#252823] flex flex-col">
      {/* Admin Top Header */}
      <header className="bg-[#0B2E21] text-[#F8F7F3] px-6 py-4 border-b border-[#123F2D] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <BraveLogo variant="light" compact />
          <div className="hidden sm:block border-l border-white/15 pl-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#EAE2D5]/75">
              Club Management Console · {STUDIO_HOURS_24H} ({STUDIO_HOURS_12H} · {STUDIO_HOURS_STATUS})
            </div>
            <div className="text-sm font-semibold">Brave Gym &amp; Fitness Admin Mode</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-[#EAE2D5]/80 font-mono">{currentUser.membershipId}</span>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout Admin</span>
          </button>
        </div>
      </header>

      {/* Admin Tab Navigation */}
      <nav className="bg-white border-b border-[#252823]/10 px-6 py-2 overflow-x-auto">
        <div className="max-w-[1320px] mx-auto flex items-center gap-1.5">
          {ADMIN_TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  setAdminFeedback(null);
                }}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#123F2D] text-[#F8F7F3]'
                    : 'text-[#252823]/75 hover:bg-[#F8F7F3] hover:text-[#123F2D]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
                {t.id === 'payments' && pendingPaymentsCount > 0 && (
                  <span className="tabular-nums px-1.5 py-0.5 rounded bg-[#EAE2D5] text-[#0B2E21] text-[10px] font-bold">
                    {pendingPaymentsCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Admin Workspace */}
      <main className="flex-1 p-6 max-w-[1320px] w-full mx-auto space-y-6">
        {/* KPI Strip */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Active Members', value: activeMembersCount },
            { label: 'Class Bookings Today', value: classBookingsToday },
            { label: 'PT Appointments Today', value: ptToday },
            { label: 'Sauna Bookings', value: totalSaunaUpcoming },
            { label: 'Locker Bookings', value: totalLockerUpcoming },
            { label: 'Pending Approvals', value: pendingPaymentsCount },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[#252823]/10 bg-white p-4"
            >
              <div className="font-display text-2xl font-bold tabular-nums text-[#123F2D]">
                {stat.value}
              </div>
              <div className="text-xs text-[#252823]/70 mt-1">{stat.label}</div>
            </div>
          ))}
        </section>

        {adminFeedback && (
          <div className="rounded-lg border border-[#123F2D]/25 bg-[#EAE2D5]/60 px-4 py-3 text-sm text-[#123F2D] flex items-center justify-between">
            <span>{adminFeedback}</span>
            <button
              type="button"
              onClick={() => setAdminFeedback(null)}
              className="text-xs font-semibold underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TAB: OVERVIEW & BOOKINGS */}
        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="rounded-xl border border-[#252823]/10 bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-[#252823]/10 flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-[#123F2D]">
                  All Personal Training Appointments
                </h2>
              </div>
              <div className="divide-y divide-[#252823]/10 max-h-[420px] overflow-y-auto">
                {store.ptAppointments.map((a) => (
                  <div
                    key={a.id}
                    className="p-4 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[#123F2D]">
                        {a.memberName} → Coach {a.trainerName}
                      </div>
                      <div className="text-[#252823]/70 tabular-nums mt-0.5">
                        {a.id} · {a.date} at {a.startTime} · Status: {a.status}
                      </div>
                    </div>
                    {a.status === 'Upcoming' && (
                      <button
                        type="button"
                        onClick={() => {
                          adminCompletePTAppointment(a.id);
                          setAdminFeedback(`Marked ${a.id} as Completed.`);
                        }}
                        className="px-3 py-1.5 rounded bg-[#EAE2D5] text-[#123F2D] font-semibold hover:bg-[#123F2D] hover:text-white cursor-pointer"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-[#252823]/10 bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-[#252823]/10 flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-[#123F2D]">
                  Recent Class Bookings
                </h2>
              </div>
              <div className="divide-y divide-[#252823]/10 max-h-[420px] overflow-y-auto">
                {store.classBookings.map((b) => (
                  <div key={b.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-[#123F2D]">
                        {b.memberName} · {b.classTitle}
                      </div>
                      <div className="text-[#252823]/70 tabular-nums mt-0.5">
                        {b.id} · {b.day} ({b.date}) at {b.time} · {b.coach}
                      </div>
                    </div>
                    <span className="font-semibold text-[#6F8569]">{b.status}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* TAB: MEMBERS */}
        {tab === 'members' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#252823]/10 bg-white p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="font-display text-base font-bold text-[#123F2D]">
                  Member Directory ({filteredMembers.length})
                </h2>
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-[#252823]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search name, Gmail, or ID..."
                    className="w-full rounded-lg border border-[#252823]/15 bg-[#F8F7F3] pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#123F2D]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="text-[#252823]/60 font-medium mr-1">Membership Color Key:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold tracking-wider uppercase bg-[#D0E3D2] text-[#245B3B]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#245B3B]" />
                  ACTIVE (Regular)
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold tracking-wider uppercase bg-[#D0DFF4] text-[#315E9E]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#315E9E]" />
                  STUDENT
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold tracking-wider uppercase bg-[#F8DFC0] text-[#B87527]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B87527]" />
                  RENEWAL PENDING
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold tracking-wider uppercase bg-[#F4D0D0] text-[#AC4242]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#AC4242]" />
                  EXPIRED
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#252823]/10 text-[#6F8569] uppercase tracking-wider">
                      <th className="py-3 px-3">Membership ID</th>
                      <th className="py-3 px-3">Name &amp; Gmail</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Expires</th>
                      <th className="py-3 px-3">PT Credits</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#252823]/10">
                    {filteredMembers.map((m) => {
                      const theme = getMembershipTheme(m.category, m.status);
                      return (
                        <tr key={m.id}>
                          <td className="py-3 px-3 font-mono font-semibold">
                            <span
                              className={`inline-block px-2 py-1 rounded border ${theme.cardBgClass} ${theme.borderClass} ${theme.accentTextClass}`}
                            >
                              {m.membershipId}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-[#123F2D]">{m.name}</div>
                            <div className="text-[#252823]/65">{m.gmail}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-[#252823]">{m.category}</span>
                          </td>
                          <td className="py-3 px-3 tabular-nums">{m.expirationDate}</td>
                          <td className="py-3 px-3 tabular-nums">
                            {Math.max(0, m.ptCreditsTotal - m.ptCreditsUsed)} / {m.ptCreditsTotal}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase ${theme.badgeClass}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${theme.dotClass}`} />
                              {theme.badgeLabel}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <select
                              aria-label={`Set status for ${m.name}`}
                              value={m.status}
                              onChange={(e) => {
                                const next = e.target.value as MembershipStatus;
                                adminUpdateMemberStatus(m.id, next);
                                setAdminFeedback(`Updated ${m.name} status to ${next}.`);
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-[#252823]/15 bg-[#F8F7F3] text-[#252823] font-semibold cursor-pointer focus:outline-none focus:border-[#123F2D]"
                            >
                              <option value="Active">Active</option>
                              <option value="Pending Renewal">Pending Renewal</option>
                              <option value="Expired">Expired</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <form
              onSubmit={handleAddMember}
              className="rounded-xl border border-[#252823]/10 bg-white p-5 space-y-4"
            >
              <h3 className="font-display text-sm font-bold text-[#123F2D]">
                Register New Member
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={newMemName}
                  onChange={(e) => setNewMemName(e.target.value)}
                  className="rounded-lg border border-[#252823]/15 px-3 py-2 text-xs"
                />
                <input
                  type="email"
                  required
                  placeholder="Gmail Address"
                  value={newMemGmail}
                  onChange={(e) => setNewMemGmail(e.target.value)}
                  className="rounded-lg border border-[#252823]/15 px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="BRV-2026-0999"
                  value={newMemId}
                  onChange={(e) => setNewMemId(e.target.value)}
                  className="rounded-lg border border-[#252823]/15 px-3 py-2 text-xs font-mono"
                />
                <select
                  value={newMemCat}
                  onChange={(e) => setNewMemCat(e.target.value as MembershipCategory)}
                  className="rounded-lg border border-[#252823]/15 px-3 py-2 text-xs"
                >
                  <option value="Regular">Regular</option>
                  <option value="Student">Student</option>
                </select>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#123F2D] text-white px-4 py-2 text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB: CLASSES */}
        {tab === 'classes' && (
          <div className="space-y-6">
            <form
              onSubmit={handleAddClass}
              className="rounded-xl border border-[#252823]/10 bg-white p-5 space-y-3"
            >
              <h2 className="font-display text-sm font-bold text-[#123F2D]">
                Add Group Fitness Class
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                <select
                  value={newClsDay}
                  onChange={(e) => setNewClsDay(e.target.value as DayOfWeek)}
                  className="rounded-lg border border-[#252823]/15 px-3 py-2 text-xs"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newClsTime}
                  onChange={(e) => setNewClsTime(e.target.value)}
                  placeholder="16:00"
                  className="rounded-lg border border-[#252823]/15 px-3 py-2 text-xs font-mono"
                />
                <input
                  type="text"
                  required
                  value={newClsTitle}
                  onChange={(e) => setNewClsTitle(e.target.value)}
                  placeholder="Class Title"
                  className="rounded-lg border border-[#252823]/15 px-3 py-2 text-xs sm:col-span-2"
                />
                <input
                  type="text"
                  required
                  value={newClsCoach}
                  onChange={(e) => setNewClsCoach(e.target.value)}
                  placeholder="Coach Name"
                  className="rounded-lg border border-[#252823]/15 px-3 py-2 text-xs"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#123F2D] text-white px-4 py-2 text-xs font-semibold cursor-pointer"
                >
                  Add Class
                </button>
              </div>
            </form>

            <div className="rounded-xl border border-[#252823]/10 bg-white overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#252823]/10 bg-[#F8F7F3] text-[#6F8569] uppercase tracking-wider">
                    <th className="py-3 px-4">Day</th>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Class Name</th>
                    <th className="py-3 px-4">Coach</th>
                    <th className="py-3 px-4">Capacity</th>
                    <th className="py-3 px-4 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252823]/10">
                  {store.classes.map((cls: GymClass) => (
                    <tr key={cls.id}>
                      <td className="py-2.5 px-4 font-semibold">{cls.day}</td>
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          value={cls.time}
                          onChange={(e) =>
                            adminUpdateClass({ ...cls, time: e.target.value })
                          }
                          className="w-20 rounded border border-[#252823]/15 px-2 py-1 font-mono"
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          value={cls.title}
                          onChange={(e) =>
                            adminUpdateClass({ ...cls, title: e.target.value })
                          }
                          className="w-full rounded border border-[#252823]/15 px-2 py-1 font-semibold"
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          value={cls.coach}
                          onChange={(e) =>
                            adminUpdateClass({ ...cls, coach: e.target.value })
                          }
                          className="w-full rounded border border-[#252823]/15 px-2 py-1"
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={cls.capacity}
                          onChange={(e) =>
                            adminUpdateClass({
                              ...cls,
                              capacity: Math.max(1, Number(e.target.value)),
                            })
                          }
                          className="w-16 rounded border border-[#252823]/15 px-2 py-1 tabular-nums"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => adminDeleteClass(cls.id)}
                          className="px-2.5 py-1 rounded text-[#9E2A2B] hover:bg-[#FCEEEE] cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: TRAINERS & POLICY */}
        {tab === 'trainers' && (
          <div className="space-y-6">
            {/* PT Appointment Policy Configuration */}
            <div className="rounded-xl border border-[#252823]/10 bg-white p-5 space-y-3">
              <h2 className="font-display text-sm font-bold text-[#123F2D]">
                PT Appointment &amp; Rescheduling Rules
              </h2>
              <div className="flex flex-wrap items-end gap-4 text-xs">
                <div>
                  <label className="block text-[#6F8569] font-semibold mb-1">
                    Cancellation / Reschedule Notice (Hours)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={48}
                    value={policyForm.ptCancelNoticeHours}
                    onChange={(e) =>
                      setPolicyForm({
                        ...policyForm,
                        ptCancelNoticeHours: Number(e.target.value),
                      })
                    }
                    className="w-28 rounded-lg border border-[#252823]/15 px-3 py-2 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[#6F8569] font-semibold mb-1">
                    Default Session Duration (Min)
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={120}
                    step={15}
                    value={policyForm.ptDefaultDurationMin}
                    onChange={(e) =>
                      setPolicyForm({
                        ...policyForm,
                        ptDefaultDurationMin: Number(e.target.value),
                      })
                    }
                    className="w-28 rounded-lg border border-[#252823]/15 px-3 py-2 tabular-nums"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    adminUpdatePolicyConfig(policyForm);
                    setAdminFeedback('PT appointment policy updated.');
                  }}
                  className="px-4 py-2 rounded-lg bg-[#123F2D] text-white font-semibold cursor-pointer"
                >
                  Save Policy
                </button>
              </div>
            </div>

            {/* Add Trainer */}
            <form
              onSubmit={handleAddTrainer}
              className="rounded-xl border border-[#252823]/10 bg-white p-5 space-y-3"
            >
              <h3 className="font-display text-sm font-bold text-[#123F2D]">Add New Trainer</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Trainer Name"
                  value={newTrnName}
                  onChange={(e) => setNewTrnName(e.target.value)}
                  className="rounded-lg border border-[#252823]/15 px-3 py-2 text-xs"
                />
                <select
                  value={newTrnTier}
                  onChange={(e) => setNewTrnTier(e.target.value as 'senior' | 'standard')}
                  className="rounded-lg border border-[#252823]/15 px-3 py-2 text-xs"
                >
                  <option value="senior">Senior Tier</option>
                  <option value="standard">Club Tier</option>
                </select>
                <input
                  type="text"
                  required
                  placeholder="Specialization"
                  value={newTrnSpec}
                  onChange={(e) => setNewTrnSpec(e.target.value)}
                  className="rounded-lg border border-[#252823]/15 px-3 py-2 text-xs"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#123F2D] text-white px-4 py-2 text-xs font-semibold cursor-pointer"
                >
                  Add Trainer
                </button>
              </div>
            </form>

            {/* Editable Trainers Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {store.trainers.map((t: Trainer) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-[#252823]/10 bg-white p-5 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-display text-base font-bold text-[#123F2D]">
                      Coach {t.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => adminUpdateTrainer({ ...t, active: !t.active })}
                      className={`px-3 py-1 rounded font-semibold cursor-pointer ${
                        t.active
                          ? 'bg-[#EAE2D5] text-[#123F2D]'
                          : 'bg-[#FCEEEE] text-[#9E2A2B]'
                      }`}
                    >
                      {t.active ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <div>
                    <label className="text-[#6F8569] font-semibold block mb-1">
                      Specialization
                    </label>
                    <input
                      type="text"
                      value={t.specialization}
                      onChange={(e) =>
                        adminUpdateTrainer({ ...t, specialization: e.target.value })
                      }
                      className="w-full rounded border border-[#252823]/15 px-2.5 py-1.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[#6F8569] font-semibold block mb-1">
                        Start Hour
                      </label>
                      <input
                        type="number"
                        min={6}
                        max={22}
                        value={t.startHour}
                        onChange={(e) =>
                          adminUpdateTrainer({ ...t, startHour: Number(e.target.value) })
                        }
                        className="w-full rounded border border-[#252823]/15 px-2.5 py-1.5 tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="text-[#6F8569] font-semibold block mb-1">
                        End Hour
                      </label>
                      <input
                        type="number"
                        min={7}
                        max={23}
                        value={t.endHour}
                        onChange={(e) =>
                          adminUpdateTrainer({ ...t, endHour: Number(e.target.value) })
                        }
                        className="w-full rounded border border-[#252823]/15 px-2.5 py-1.5 tabular-nums"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: PT PACKAGES */}
        {tab === 'packages' && (
          <div className="rounded-xl border border-[#252823]/10 bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-[#252823]/10">
              <h2 className="font-display text-base font-bold text-[#123F2D]">
                Editable PT Package Pricing
              </h2>
              <p className="text-xs text-[#252823]/65">
                Changes save immediately and reflect on the member PT Packages page.
              </p>
            </div>
            <div className="divide-y divide-[#252823]/10">
              {store.ptPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-sm"
                >
                  <div>
                    <div className="text-xs font-semibold text-[#6F8569]">{pkg.tierLabel}</div>
                    <div className="font-display font-bold text-[#123F2D]">{pkg.name}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#252823]/65 tabular-nums">
                      Current: {formatRupiah(pkg.price)}
                    </span>
                    <input
                      type="number"
                      step={50000}
                      min={100000}
                      value={pkg.price}
                      onChange={(e) =>
                        adminUpdatePackagePrice(pkg.id, Math.max(0, Number(e.target.value)))
                      }
                      className="w-36 rounded-lg border border-[#252823]/15 px-3 py-2 text-xs font-mono tabular-nums"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: SAUNA */}
        {tab === 'sauna' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 rounded-xl border border-[#252823]/10 bg-white p-5 space-y-4">
              <h2 className="font-display text-base font-bold text-[#123F2D]">
                Sauna Capacity &amp; Hours
              </h2>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#6F8569] mb-1">Open Hour</label>
                  <input
                    type="number"
                    min={6}
                    max={22}
                    value={saunaForm.openHour}
                    onChange={(e) =>
                      setSaunaForm({ ...saunaForm, openHour: Number(e.target.value) })
                    }
                    className="w-full rounded border border-[#252823]/15 px-3 py-2 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#6F8569] mb-1">Close Hour</label>
                  <input
                    type="number"
                    min={7}
                    max={23}
                    value={saunaForm.closeHour}
                    onChange={(e) =>
                      setSaunaForm({ ...saunaForm, closeHour: Number(e.target.value) })
                    }
                    className="w-full rounded border border-[#252823]/15 px-3 py-2 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#6F8569] mb-1">
                    Slot Duration (Min)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={90}
                    step={15}
                    value={saunaForm.slotDurationMin}
                    onChange={(e) =>
                      setSaunaForm({ ...saunaForm, slotDurationMin: Number(e.target.value) })
                    }
                    className="w-full rounded border border-[#252823]/15 px-3 py-2 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#6F8569] mb-1">
                    Max Capacity
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={saunaForm.maxCapacity}
                    onChange={(e) =>
                      setSaunaForm({ ...saunaForm, maxCapacity: Number(e.target.value) })
                    }
                    className="w-full rounded border border-[#252823]/15 px-3 py-2 tabular-nums"
                  />
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <label className="block font-semibold text-[#6F8569]">
                  Block Maintenance Date
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={blockedDateInput}
                    onChange={(e) => setBlockedDateInput(e.target.value)}
                    className="flex-1 rounded border border-[#252823]/15 px-3 py-2 tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        blockedDateInput &&
                        !saunaForm.blockedDates.includes(blockedDateInput)
                      ) {
                        setSaunaForm({
                          ...saunaForm,
                          blockedDates: [...saunaForm.blockedDates, blockedDateInput],
                        });
                        setBlockedDateInput('');
                      }
                    }}
                    className="px-3 py-2 rounded border border-[#252823]/15 font-semibold cursor-pointer"
                  >
                    Block
                  </button>
                </div>
                {saunaForm.blockedDates.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {saunaForm.blockedDates.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() =>
                          setSaunaForm({
                            ...saunaForm,
                            blockedDates: saunaForm.blockedDates.filter((x) => x !== d),
                          })
                        }
                        className="px-2.5 py-1 rounded bg-[#FCEEEE] text-[#9E2A2B] font-mono cursor-pointer"
                      >
                        {d} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  adminUpdateSaunaConfig(saunaForm);
                  setAdminFeedback('Sauna configuration saved.');
                }}
                className="w-full py-2.5 rounded-lg bg-[#123F2D] text-white text-xs font-semibold cursor-pointer"
              >
                Save Sauna Settings
              </button>
            </div>

            <div className="lg:col-span-7 rounded-xl border border-[#252823]/10 bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-[#252823]/10">
                <h2 className="font-display text-base font-bold text-[#123F2D]">
                  All Sauna Reservations ({store.saunaBookings.length})
                </h2>
              </div>
              <div className="divide-y divide-[#252823]/10 max-h-[380px] overflow-y-auto">
                {store.saunaBookings.map((b) => (
                  <div key={b.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-[#123F2D]">
                        {b.memberName} · {b.date} ({b.timeSlot})
                      </div>
                      <div className="text-[#252823]/65 font-mono">{b.id}</div>
                    </div>
                    <span className="font-semibold text-[#6F8569]">{b.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: LOCKERS */}
        {tab === 'lockers' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#252823]/10 bg-white p-5 space-y-4">
              <h2 className="font-display text-base font-bold text-[#123F2D]">
                Locker Maintenance Controls (Click to Toggle Status)
              </h2>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
                {store.lockers.map((l) => (
                  <button
                    key={l.number}
                    type="button"
                    onClick={() => {
                      adminToggleLockerStatus(l.number);
                      setAdminFeedback(`Toggled Locker #${l.number} availability.`);
                    }}
                    className={`p-2.5 rounded-lg border text-center cursor-pointer ${
                      l.status === 'operational'
                        ? 'border-[#123F2D]/25 bg-white text-[#123F2D]'
                        : 'border-[#9E2A2B]/30 bg-[#FCEEEE] text-[#9E2A2B]'
                    }`}
                  >
                    <div className="font-mono text-xs font-bold">#{l.number}</div>
                    <div className="text-[10px]">
                      {l.status === 'operational' ? 'OK' : 'Maint'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#252823]/10 bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-[#252823]/10">
                <h3 className="font-display text-base font-bold text-[#123F2D]">
                  Locker Reservations ({store.lockerBookings.length})
                </h3>
              </div>
              <div className="divide-y divide-[#252823]/10">
                {store.lockerBookings.map((b) => (
                  <div key={b.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-[#123F2D]">
                        Locker #{b.lockerNumber} · {b.memberName}
                      </div>
                      <div className="text-[#252823]/65 tabular-nums">
                        {b.id} · {b.date} ({b.startTime}–{b.endTime})
                      </div>
                    </div>
                    <span className="font-semibold text-[#6F8569]">{b.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: PAYMENTS */}
        {tab === 'payments' && (
          <div className="rounded-xl border border-[#252823]/10 bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-[#252823]/10">
              <h2 className="font-display text-base font-bold text-[#123F2D]">
                PT Package Payment Submissions
              </h2>
              <p className="text-xs text-[#252823]/65">
                Approving a payment immediately grants the member their PT session credits and sends an in-app notification.
              </p>
            </div>
            <div className="divide-y divide-[#252823]/10">
              {store.payments.map((p) => (
                <div
                  key={p.id}
                  className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono text-[#252823]/60">{p.id}</span>
                      <span>·</span>
                      <span className="font-semibold text-[#123F2D]">{p.memberName}</span>
                      <span>·</span>
                      <span>{p.method}</span>
                    </div>
                    <div className="font-display text-base font-bold text-[#252823]">
                      {p.packageName} ({p.trainerTierLabel}) — {formatRupiah(p.amount)}
                    </div>
                    <div className="text-xs text-[#252823]/70">
                      Credits: +{p.sessionsCount} sessions · Proof: {p.proofFileName || 'None'}
                      {p.proofNote ? ` · "${p.proofNote}"` : ''}
                    </div>
                    {p.proofPreviewUrl && (
                      <img
                        src={p.proofPreviewUrl}
                        alt="Member payment proof"
                        className="mt-2 max-h-28 rounded border border-[#252823]/15 bg-[#F8F7F3] p-1"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-bold ${
                        p.status === 'Approved'
                          ? 'text-[#123F2D]'
                          : p.status === 'Rejected'
                          ? 'text-[#9E2A2B]'
                          : 'text-[#9A671F]'
                      }`}
                    >
                      {p.status}
                    </span>

                    {p.status !== 'Approved' && p.status !== 'Rejected' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            adminApprovePayment(p.id);
                            setAdminFeedback(
                              `Approved ${p.id}. +${p.sessionsCount} PT credits added to ${p.memberName}.`
                            );
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#123F2D] text-white text-xs font-semibold hover:bg-[#0B2E21] cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            adminRejectPayment(p.id);
                            setAdminFeedback(`Rejected payment ${p.id}.`);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#9E2A2B]/30 bg-[#FCEEEE] text-[#9E2A2B] text-xs font-semibold hover:bg-[#f8dede] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
