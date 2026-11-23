import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createInitialStore } from '../data/seedData';
import {
  AppNotification,
  BraveStore,
  ClassBooking,
  DayOfWeek,
  GymClass,
  LockerBooking,
  Member,
  MembershipStatus,
  PageId,
  PaymentSubmission,
  PolicyConfig,
  PTAppointment,
  PTPackage,
  SaunaBooking,
  SaunaConfig,
  Trainer,
  YogaAppointment,
} from '../types';
import {
  getNextDateForDay,
  hoursUntilDateTime,
  isPastDateTime,
  makeId,
  minutesToTime,
  parseISODate,
  timeToMinutes,
} from '../utils/dateUtils';

const STORE_KEY = 'brave_gym_portal_store_v1';
const SESSION_KEY = 'brave_gym_portal_session_v1';

export interface ActionResult<T = undefined> {
  ok: boolean;
  message: string;
  data?: T;
}

export interface SlotAvailability {
  available: boolean;
  reason?:
    | 'past'
    | 'off-day'
    | 'outside-hours'
    | 'break'
    | 'trainer-booked'
    | 'member-conflict'
    | 'trainer-inactive';
  message?: string;
  occupiedAppointment?: PTAppointment;
}

interface BraveContextValue {
  store: BraveStore;
  currentUser: Member | null;
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  preselectedTrainerId: string | null;
  setPreselectedTrainerId: (id: string | null) => void;
  rescheduleTargetId: string | null;
  setRescheduleTargetId: (id: string | null) => void;

  // Auth
  loginWithCredentials: (gmail: string, membershipId: string) => ActionResult<Member>;
  demoLogin: (memberId: string) => ActionResult<Member>;
  logout: () => void;
  resetDemoData: () => void;

  // Classes
  getClassRemainingSpots: (cls: GymClass) => number;
  hasMemberBookedClass: (classId: string, memberId?: string) => ClassBooking | undefined;
  bookClass: (classId: string) => ActionResult<ClassBooking>;
  cancelClassBooking: (bookingId: string) => ActionResult;

  // PT & Calendar
  getMemberPTCreditsRemaining: (member?: Member | null) => number;
  checkPTSlotAvailability: (
    trainerId: string,
    date: string,
    startTime: string,
    durationMin?: number,
    excludeAppointmentId?: string,
    memberIdToCheck?: string
  ) => SlotAvailability;
  bookPT: (params: {
    trainerId: string;
    date: string;
    startTime: string;
    durationMin?: number;
    packageType?: string;
    notes?: string;
  }) => ActionResult<PTAppointment>;
  reschedulePT: (
    appointmentId: string,
    newDate: string,
    newStartTime: string,
    newTrainerId?: string
  ) => ActionResult<PTAppointment>;
  cancelPT: (appointmentId: string) => ActionResult;
  canModifyPTAppointment: (appt: PTAppointment) => { allowed: boolean; reason?: string };

  // Sauna
  getSaunaSlotBookedCount: (date: string, timeSlot: string) => number;
  bookSauna: (date: string, timeSlot: string) => ActionResult<SaunaBooking>;
  cancelSauna: (bookingId: string) => ActionResult;

  // Yoga Appointments
  getYogaSlotBookedCount: (templateId: string, date: string, startTime: string) => number;
  checkYogaSlotAvailability: (
    templateId: string,
    date: string,
    startTime: string,
    ignoreAppointmentId?: string
  ) => { available: boolean; spotsLeft: number; reason?: string };
  bookYoga: (params: {
    templateId: string;
    date: string;
    startTime: string;
    notes?: string;
  }) => ActionResult<YogaAppointment>;
  rescheduleYoga: (
    appointmentId: string,
    newDate: string,
    newStartTime: string,
    newTemplateId?: string
  ) => ActionResult<YogaAppointment>;
  cancelYoga: (appointmentId: string) => ActionResult;

  // Lockers
  isLockerAvailableForWindow: (
    lockerNumber: string,
    date: string,
    startTime: string,
    endTime: string,
    ignoreBookingId?: string
  ) => boolean;
  bookLocker: (
    lockerNumber: string,
    date: string,
    startTime: string,
    endTime: string
  ) => ActionResult<LockerBooking>;
  changeLocker: (
    bookingId: string,
    newLockerNumber: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string
  ) => ActionResult<LockerBooking>;
  cancelLocker: (bookingId: string) => ActionResult;

  // Packages & Payments
  createPackageOrder: (packageId: string) => ActionResult<PaymentSubmission>;
  submitPaymentProof: (
    paymentId: string,
    method: string,
    proofFileName: string,
    proofNote: string,
    proofPreviewUrl?: string
  ) => ActionResult<PaymentSubmission>;

  // Notifications
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Admin actions
  adminUpdateMemberStatus: (memberId: string, status: MembershipStatus) => void;
  adminAddMember: (member: Omit<Member, 'id'>) => ActionResult<Member>;
  adminUpdateClass: (cls: GymClass) => void;
  adminAddClass: (cls: Omit<GymClass, 'id'>) => void;
  adminDeleteClass: (classId: string) => void;
  adminUpdateTrainer: (trainer: Trainer) => void;
  adminAddTrainer: (trainer: Omit<Trainer, 'id'>) => void;
  adminUpdatePackagePrice: (packageId: string, price: number) => void;
  adminUpdateSaunaConfig: (config: SaunaConfig) => void;
  adminToggleLockerStatus: (lockerNumber: string) => void;
  adminApprovePayment: (paymentId: string, adminNote?: string) => void;
  adminRejectPayment: (paymentId: string, adminNote?: string) => void;
  adminUpdatePolicyConfig: (policy: PolicyConfig) => void;
  adminCompletePTAppointment: (appointmentId: string) => void;
}

const BraveContext = createContext<BraveContextValue | null>(null);

function loadInitialStore(): BraveStore {
  const fallback = createInitialStore();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<BraveStore>;
      if (parsed && Array.isArray(parsed.members) && Array.isArray(parsed.classes)) {
        const legacySauna =
          parsed.saunaConfig &&
          parsed.saunaConfig.openHour === 7 &&
          parsed.saunaConfig.closeHour === 21;

        const migratedSaunaConfig = parsed.saunaConfig
          ? legacySauna
            ? { ...parsed.saunaConfig, openHour: 6, closeHour: 23 }
            : parsed.saunaConfig
          : fallback.saunaConfig;

        const migratedTrainers = Array.isArray(parsed.trainers)
          ? parsed.trainers.map((t) => {
              const seedMatch = fallback.trainers.find((ft) => ft.id === t.id);
              if (!seedMatch) return t;
              const isLegacyHours =
                (t.id === 'trn-clara' && t.startHour === 7 && t.endHour === 19) ||
                (t.id === 'trn-cindy' && t.startHour === 8 && t.endHour === 20) ||
                (t.id === 'trn-ugi' && t.startHour === 7 && t.endHour === 19) ||
                (t.id === 'trn-salva' && t.startHour === 9 && t.endHour === 20) ||
                (t.id === 'trn-fachri' && t.startHour === 8 && t.endHour === 21) ||
                (t.id === 'trn-ega' && t.startHour === 8 && t.endHour === 19);
              return isLegacyHours
                ? { ...t, startHour: seedMatch.startHour, endHour: seedMatch.endHour }
                : t;
            })
          : fallback.trainers;

        const migratedYogaTemplates =
          Array.isArray(parsed.yogaTemplates) && parsed.yogaTemplates.length > 0
            ? parsed.yogaTemplates.map((tpl) => {
                const seedTpl = fallback.yogaTemplates.find((ft) => ft.id === tpl.id);
                if (!seedTpl) return tpl;
                if (tpl.id === 'yog-power' && !tpl.timeSlots.includes('06:00')) {
                  return { ...tpl, timeSlots: seedTpl.timeSlots };
                }
                if (tpl.id === 'yog-mobility' && !tpl.timeSlots.includes('21:30')) {
                  return { ...tpl, timeSlots: seedTpl.timeSlots };
                }
                return tpl;
              })
            : fallback.yogaTemplates;

        const migratedMembers = parsed.members.map((m) =>
          m.id === 'mem-regular-1' &&
          (m.name === 'Nadia Pratama' || m.name === 'Viona Aleena')
            ? { ...m, name: 'Azka Nur Fadillah' }
            : m
        );

        const renameMemberRecord = <T extends { memberId: string; memberName: string }>(
          arr: T[] | undefined,
          defaultArr: T[]
        ): T[] =>
          Array.isArray(arr)
            ? arr.map((item) =>
                item.memberId === 'mem-regular-1' &&
                (item.memberName === 'Nadia Pratama' || item.memberName === 'Viona Aleena')
                  ? { ...item, memberName: 'Azka Nur Fadillah' }
                  : item
              )
            : defaultArr;

        return {
          ...fallback,
          ...parsed,
          members: migratedMembers,
          classBookings: renameMemberRecord(parsed.classBookings, fallback.classBookings),
          ptAppointments: renameMemberRecord(parsed.ptAppointments, fallback.ptAppointments),
          saunaBookings: renameMemberRecord(parsed.saunaBookings, fallback.saunaBookings),
          lockerBookings: renameMemberRecord(parsed.lockerBookings, fallback.lockerBookings),
          payments: renameMemberRecord(parsed.payments, fallback.payments),
          trainers: migratedTrainers,
          saunaConfig: migratedSaunaConfig,
          yogaTemplates: migratedYogaTemplates,
          yogaAppointments: renameMemberRecord(
            parsed.yogaAppointments,
            fallback.yogaAppointments
          ),
        };
      }
    }
  } catch {
    // ignore corrupted storage and fall back to seed
  }
  return fallback;
}

function loadInitialSession(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export const BraveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [store, setStore] = useState<BraveStore>(loadInitialStore);
  const [sessionUserId, setSessionUserId] = useState<string | null>(loadInitialSession);
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [preselectedTrainerId, setPreselectedTrainerId] = useState<string | null>(null);
  const [rescheduleTargetId, setRescheduleTargetId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch {
      // ignore quota errors
    }
  }, [store]);

  useEffect(() => {
    try {
      if (sessionUserId) {
        localStorage.setItem(SESSION_KEY, sessionUserId);
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // ignore
    }
  }, [sessionUserId]);

  const currentUser = useMemo(() => {
    if (!sessionUserId) return null;
    return store.members.find((m) => m.id === sessionUserId) ?? null;
  }, [sessionUserId, store.members]);

  // If session points to nonexistent member, clear it
  useEffect(() => {
    if (sessionUserId && !currentUser) {
      setSessionUserId(null);
    }
  }, [sessionUserId, currentUser]);

  const addNotification = (
    prev: BraveStore,
    notif: Omit<AppNotification, 'id' | 'read' | 'createdAt'>
  ): AppNotification[] => {
    const item: AppNotification = {
      ...notif,
      id: makeId('NTF'),
      read: false,
      createdAt: new Date().toISOString(),
    };
    return [item, ...prev.notifications];
  };

  // Auth
  const loginWithCredentials = (gmail: string, membershipId: string): ActionResult<Member> => {
    const cleanGmail = gmail.trim().toLowerCase();
    const cleanId = membershipId.trim().toUpperCase();
    if (!cleanGmail || !cleanId) {
      return { ok: false, message: 'Please enter both your registered Gmail address and Membership ID.' };
    }
    const found = store.members.find(
      (m) => m.gmail.toLowerCase() === cleanGmail && m.membershipId.toUpperCase() === cleanId
    );
    if (!found) {
      return {
        ok: false,
        message: 'No matching Brave Gym membership found. Please verify your Gmail address and Membership ID.',
      };
    }
    setSessionUserId(found.id);
    setActivePage('dashboard');
    return { ok: true, message: `Welcome back, ${found.name}.`, data: found };
  };

  const demoLogin = (memberId: string): ActionResult<Member> => {
    const found = store.members.find((m) => m.id === memberId);
    if (!found) return { ok: false, message: 'Demo member not found.' };
    setSessionUserId(found.id);
    setActivePage('dashboard');
    return { ok: true, message: `Signed in as ${found.name}.`, data: found };
  };

  const logout = () => {
    setSessionUserId(null);
    setActivePage('dashboard');
    setPreselectedTrainerId(null);
    setRescheduleTargetId(null);
  };

  const resetDemoData = () => {
    const fresh = createInitialStore();
    setStore(fresh);
    setSessionUserId(null);
    setActivePage('dashboard');
    localStorage.removeItem(SESSION_KEY);
    localStorage.setItem(STORE_KEY, JSON.stringify(fresh));
  };

  // Classes
  const getClassRemainingSpots = (cls: GymClass): number => {
    const memberBookedCount = store.classBookings.filter(
      (b) => b.classId === cls.id && b.status === 'Upcoming'
    ).length;
    return Math.max(0, cls.capacity - cls.mockOccupiedCount - memberBookedCount);
  };

  const hasMemberBookedClass = (classId: string, memberId?: string): ClassBooking | undefined => {
    const targetMemberId = memberId ?? currentUser?.id;
    if (!targetMemberId) return undefined;
    return store.classBookings.find(
      (b) => b.classId === classId && b.memberId === targetMemberId && b.status === 'Upcoming'
    );
  };

  const bookClass = (classId: string): ActionResult<ClassBooking> => {
    if (!currentUser) return { ok: false, message: 'Authentication required.' };
    if (currentUser.status === 'Expired') {
      return {
        ok: false,
        message: 'Your membership is currently expired. Please renew at the club desk to resume booking.',
      };
    }
    const cls = store.classes.find((c) => c.id === classId);
    if (!cls) return { ok: false, message: 'Selected class could not be found.' };

    if (hasMemberBookedClass(classId, currentUser.id)) {
      return { ok: false, message: `You have already booked ${cls.title} (${cls.day} ${cls.time}).` };
    }

    const remaining = getClassRemainingSpots(cls);
    if (remaining <= 0) {
      return { ok: false, message: `${cls.title} is currently at full capacity.` };
    }

    const nextDate = getNextDateForDay(cls.day as DayOfWeek);
    const booking: ClassBooking = {
      id: makeId('CLS'),
      classId: cls.id,
      classTitle: cls.title,
      day: cls.day,
      date: nextDate,
      time: cls.time,
      coach: cls.coach,
      location: cls.location,
      memberId: currentUser.id,
      memberName: currentUser.name,
      status: 'Upcoming',
      createdAt: new Date().toISOString(),
    };

    setStore((prev) => ({
      ...prev,
      classBookings: [booking, ...prev.classBookings],
      notifications: addNotification(prev, {
        memberId: currentUser.id,
        title: 'Group Class Booked',
        message: `Reserved spot in ${cls.title} with ${cls.coach} on ${cls.day} (${nextDate}) at ${cls.time}.`,
        type: 'booking',
        linkPage: 'bookings',
      }),
    }));

    return { ok: true, message: `Booked ${cls.title} on ${cls.day} at ${cls.time}.`, data: booking };
  };

  const cancelClassBooking = (bookingId: string): ActionResult => {
    if (!currentUser) return { ok: false, message: 'Authentication required.' };
    const target = store.classBookings.find((b) => b.id === bookingId);
    if (!target) return { ok: false, message: 'Class booking not found.' };
    if (target.status !== 'Upcoming') {
      return { ok: false, message: 'Only upcoming class bookings can be cancelled.' };
    }

    setStore((prev) => ({
      ...prev,
      classBookings: prev.classBookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'Cancelled' } : b
      ),
      notifications: addNotification(prev, {
        memberId: target.memberId,
        title: 'Class Booking Cancelled',
        message: `Your reservation for ${target.classTitle} on ${target.date} at ${target.time} has been cancelled.`,
        type: 'booking',
        linkPage: 'classes',
      }),
    }));

    return { ok: true, message: `Cancelled ${target.classTitle} reservation.` };
  };

  // PT Credits & Calendar Availability
  const getMemberPTCreditsRemaining = (member?: Member | null): number => {
    const m = member ?? currentUser;
    if (!m) return 0;
    return Math.max(0, m.ptCreditsTotal - m.ptCreditsUsed);
  };

  const checkPTSlotAvailability = (
    trainerId: string,
    date: string,
    startTime: string,
    durationMin = store.policyConfig.ptDefaultDurationMin,
    excludeAppointmentId?: string,
    memberIdToCheck?: string
  ): SlotAvailability => {
    const trainer = store.trainers.find((t) => t.id === trainerId);
    if (!trainer || !trainer.active) {
      return {
        available: false,
        reason: 'trainer-inactive',
        message: 'Selected trainer is currently unavailable.',
      };
    }

    if (isPastDateTime(date, startTime)) {
      return {
        available: false,
        reason: 'past',
        message: 'Cannot select a date or time in the past.',
      };
    }

    const dayIdx = parseISODate(date).getDay();
    if (!trainer.workingDays.includes(dayIdx)) {
      return {
        available: false,
        reason: 'off-day',
        message: `Coach ${trainer.name} is off on this day.`,
      };
    }

    const startMin = timeToMinutes(startTime);
    const endMin = startMin + durationMin;
    const startHour = Math.floor(startMin / 60);

    if (startMin < trainer.startHour * 60 || endMin > trainer.endHour * 60) {
      return {
        available: false,
        reason: 'outside-hours',
        message: `Outside Coach ${trainer.name}'s working hours (${String(trainer.startHour).padStart(
          2,
          '0'
        )}:00–${String(trainer.endHour).padStart(2, '0')}:00).`,
      };
    }

    // Check if any hour covered by session falls on trainer break
    const coveredHours: number[] = [];
    for (let h = startHour; h * 60 < endMin; h++) {
      coveredHours.push(h);
    }
    if (coveredHours.some((h) => trainer.breakHours.includes(h))) {
      return {
        available: false,
        reason: 'break',
        message: `Coach ${trainer.name} is on scheduled break at this hour.`,
      };
    }

    // Check trainer overlapping Upcoming appointments
    const trainerConflict = store.ptAppointments.find((appt) => {
      if (appt.id === excludeAppointmentId) return false;
      if (appt.trainerId !== trainerId || appt.date !== date || appt.status !== 'Upcoming') {
        return false;
      }
      const apptStart = timeToMinutes(appt.startTime);
      const apptEnd = apptStart + appt.durationMin;
      return startMin < apptEnd && apptStart < endMin;
    });

    if (trainerConflict) {
      return {
        available: false,
        reason: 'trainer-booked',
        message: `Coach ${trainer.name} already has a session booked at ${trainerConflict.startTime}.`,
        occupiedAppointment: trainerConflict,
      };
    }

    // Check member overlapping Upcoming appointments
    if (memberIdToCheck) {
      const memberConflict = store.ptAppointments.find((appt) => {
        if (appt.id === excludeAppointmentId) return false;
        if (appt.memberId !== memberIdToCheck || appt.date !== date || appt.status !== 'Upcoming') {
          return false;
        }
        const apptStart = timeToMinutes(appt.startTime);
        const apptEnd = apptStart + appt.durationMin;
        return startMin < apptEnd && apptStart < endMin;
      });
      if (memberConflict) {
        return {
          available: false,
          reason: 'member-conflict',
          message: `You already have a PT session with Coach ${memberConflict.trainerName} at ${memberConflict.startTime} on ${date}.`,
          occupiedAppointment: memberConflict,
        };
      }
    }

    return { available: true };
  };

  const canModifyPTAppointment = (appt: PTAppointment): { allowed: boolean; reason?: string } => {
    if (appt.status !== 'Upcoming') {
      return { allowed: false, reason: `${appt.status} appointments cannot be modified.` };
    }
    if (isPastDateTime(appt.date, appt.startTime)) {
      return { allowed: false, reason: 'Past appointments cannot be rescheduled or cancelled.' };
    }
    const hrs = hoursUntilDateTime(appt.date, appt.startTime);
    const minNotice = store.policyConfig.ptCancelNoticeHours;
    if (hrs < minNotice) {
      return {
        allowed: false,
        reason: `Changes require at least ${minNotice} hours notice before session start.`,
      };
    }
    return { allowed: true };
  };

  const bookPT = (params: {
    trainerId: string;
    date: string;
    startTime: string;
    durationMin?: number;
    packageType?: string;
    notes?: string;
  }): ActionResult<PTAppointment> => {
    if (!currentUser) return { ok: false, message: 'Authentication required.' };
    if (currentUser.status === 'Expired') {
      return {
        ok: false,
        message: 'Your membership is expired. Please renew your membership before booking Personal Training.',
      };
    }

    const remainingCredits = getMemberPTCreditsRemaining(currentUser);
    if (remainingCredits <= 0) {
      return {
        ok: false,
        message: 'You have 0 PT session credits remaining. Purchase a PT package to continue booking.',
      };
    }

    const duration = params.durationMin ?? store.policyConfig.ptDefaultDurationMin;
    const availability = checkPTSlotAvailability(
      params.trainerId,
      params.date,
      params.startTime,
      duration,
      undefined,
      currentUser.id
    );

    if (!availability.available) {
      return { ok: false, message: availability.message || 'Selected time slot is unavailable.' };
    }

    const trainer = store.trainers.find((t) => t.id === params.trainerId)!;
    const appt: PTAppointment = {
      id: makeId('PT'),
      memberId: currentUser.id,
      memberName: currentUser.name,
      trainerId: trainer.id,
      trainerName: trainer.name,
      date: params.date,
      startTime: params.startTime,
      durationMin: duration,
      status: 'Upcoming',
      packageType: params.packageType || 'PT Session Credit',
      notes: params.notes?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    setStore((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.id === currentUser.id ? { ...m, ptCreditsUsed: m.ptCreditsUsed + 1 } : m
      ),
      ptAppointments: [appt, ...prev.ptAppointments],
      notifications: addNotification(prev, {
        memberId: currentUser.id,
        title: 'Personal Training Booked',
        message: `Session with Coach ${trainer.name} confirmed for ${params.date} at ${params.startTime} (${duration} min).`,
        type: 'booking',
        linkPage: 'pt-schedule',
      }),
    }));

    return {
      ok: true,
      message: `Personal Training booked with Coach ${trainer.name} on ${params.date} at ${params.startTime}.`,
      data: appt,
    };
  };

  const reschedulePT = (
    appointmentId: string,
    newDate: string,
    newStartTime: string,
    newTrainerId?: string
  ): ActionResult<PTAppointment> => {
    if (!currentUser) return { ok: false, message: 'Authentication required.' };
    const existing = store.ptAppointments.find((a) => a.id === appointmentId);
    if (!existing) return { ok: false, message: 'Appointment not found.' };

    const policyCheck = canModifyPTAppointment(existing);
    if (!policyCheck.allowed) {
      return { ok: false, message: policyCheck.reason || 'Appointment cannot be rescheduled.' };
    }

    const targetTrainerId = newTrainerId || existing.trainerId;
    const targetTrainer = store.trainers.find((t) => t.id === targetTrainerId);
    if (!targetTrainer) return { ok: false, message: 'Selected trainer not found.' };

    if (
      existing.date === newDate &&
      existing.startTime === newStartTime &&
      targetTrainerId === existing.trainerId
    ) {
      return { ok: false, message: 'Please select a different date, time, or trainer to reschedule.' };
    }

    const availability = checkPTSlotAvailability(
      targetTrainerId,
      newDate,
      newStartTime,
      existing.durationMin,
      existing.id,
      existing.memberId
    );
    if (!availability.available) {
      return { ok: false, message: availability.message || 'New slot is not available.' };
    }

    const oldSummary = `${existing.date} ${existing.startTime} (Coach ${existing.trainerName})`;
    const updatedAppt: PTAppointment = {
      ...existing,
      date: newDate,
      startTime: newStartTime,
      trainerId: targetTrainer.id,
      trainerName: targetTrainer.name,
      rescheduledFrom: oldSummary,
    };

    setStore((prev) => ({
      ...prev,
      ptAppointments: prev.ptAppointments.map((a) => (a.id === appointmentId ? updatedAppt : a)),
      notifications: addNotification(prev, {
        memberId: existing.memberId,
        title: 'PT Session Rescheduled',
        message: `Moved ${existing.id} from ${oldSummary} to ${newDate} at ${newStartTime} with Coach ${targetTrainer.name}.`,
        type: 'reschedule',
        linkPage: 'pt-schedule',
      }),
    }));

    return {
      ok: true,
      message: `Rescheduled to ${newDate} at ${newStartTime} with Coach ${targetTrainer.name}.`,
      data: updatedAppt,
    };
  };

  const cancelPT = (appointmentId: string): ActionResult => {
    if (!currentUser) return { ok: false, message: 'Authentication required.' };
    const existing = store.ptAppointments.find((a) => a.id === appointmentId);
    if (!existing) return { ok: false, message: 'PT appointment not found.' };

    const policyCheck = canModifyPTAppointment(existing);
    if (!policyCheck.allowed) {
      return { ok: false, message: policyCheck.reason || 'Appointment cannot be cancelled.' };
    }

    setStore((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.id === existing.memberId ? { ...m, ptCreditsUsed: Math.max(0, m.ptCreditsUsed - 1) } : m
      ),
      ptAppointments: prev.ptAppointments.map((a) =>
        a.id === appointmentId ? { ...a, status: 'Cancelled' } : a
      ),
      notifications: addNotification(prev, {
        memberId: existing.memberId,
        title: 'PT Session Cancelled',
        message: `Your PT appointment with Coach ${existing.trainerName} on ${existing.date} at ${existing.startTime} was cancelled and 1 PT credit was restored.`,
        type: 'booking',
        linkPage: 'pt-schedule',
      }),
    }));

    return { ok: true, message: 'PT appointment cancelled and session credit restored.' };
  };

  // Sauna
  const getSaunaSlotBookedCount = (date: string, timeSlot: string): number => {
    return store.saunaBookings.filter(
      (b) => b.date === date && b.timeSlot === timeSlot && b.status === 'Upcoming'
    ).length;
  };

  const bookSauna = (date: string, timeSlot: string): ActionResult<SaunaBooking> => {
    if (!currentUser) return { ok: false, message: 'Authentication required.' };
    if (currentUser.status === 'Expired') {
      return {
        ok: false,
        message: 'Complimentary sauna reservations require an active Brave Gym membership.',
      };
    }
    if (store.saunaConfig.blockedDates.includes(date)) {
      return { ok: false, message: 'The sauna is closed for scheduled maintenance on this date.' };
    }

    const startTime = timeSlot.split('–')[0];
    if (isPastDateTime(date, startTime)) {
      return { ok: false, message: 'Cannot reserve a sauna time slot in the past.' };
    }

    const duplicate = store.saunaBookings.find(
      (b) =>
        b.memberId === currentUser.id &&
        b.date === date &&
        b.timeSlot === timeSlot &&
        b.status === 'Upcoming'
    );
    if (duplicate) {
      return { ok: false, message: `You already reserved ${timeSlot} on ${date}.` };
    }

    const bookedCount = getSaunaSlotBookedCount(date, timeSlot);
    if (bookedCount >= store.saunaConfig.maxCapacity) {
      return { ok: false, message: 'This sauna time slot has reached maximum capacity.' };
    }

    const booking: SaunaBooking = {
      id: makeId('SAU'),
      memberId: currentUser.id,
      memberName: currentUser.name,
      date,
      timeSlot,
      status: 'Upcoming',
      createdAt: new Date().toISOString(),
    };

    setStore((prev) => ({
      ...prev,
      saunaBookings: [booking, ...prev.saunaBookings],
      notifications: addNotification(prev, {
        memberId: currentUser.id,
        title: 'Sauna Slot Reserved',
        message: `Complimentary sauna access confirmed for ${date} (${timeSlot}).`,
        type: 'booking',
        linkPage: 'bookings',
      }),
    }));

    return { ok: true, message: `Sauna reserved for ${date} (${timeSlot}).`, data: booking };
  };

  const cancelSauna = (bookingId: string): ActionResult => {
    const existing = store.saunaBookings.find((b) => b.id === bookingId);
    if (!existing) return { ok: false, message: 'Sauna reservation not found.' };
    if (existing.status !== 'Upcoming') return { ok: false, message: 'Already cancelled or completed.' };

    setStore((prev) => ({
      ...prev,
      saunaBookings: prev.saunaBookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'Cancelled' } : b
      ),
      notifications: addNotification(prev, {
        memberId: existing.memberId,
        title: 'Sauna Reservation Cancelled',
        message: `Sauna reservation on ${existing.date} (${existing.timeSlot}) was cancelled.`,
        type: 'booking',
        linkPage: 'sauna',
      }),
    }));

    return { ok: true, message: 'Sauna reservation cancelled.' };
  };

  // Yoga Appointments
  const getYogaSlotBookedCount = (
    templateId: string,
    date: string,
    startTime: string
  ): number => {
    return store.yogaAppointments.filter(
      (a) =>
        a.templateId === templateId &&
        a.date === date &&
        a.startTime === startTime &&
        a.status === 'Upcoming'
    ).length;
  };

  const checkYogaSlotAvailability = (
    templateId: string,
    date: string,
    startTime: string,
    ignoreAppointmentId?: string
  ): { available: boolean; spotsLeft: number; reason?: string } => {
    const tpl = store.yogaTemplates.find((t) => t.id === templateId);
    if (!tpl) return { available: false, spotsLeft: 0, reason: 'Yoga style not found.' };

    const dayIdx = new Date(`${date}T00:00:00`).getDay();
    if (!tpl.daysOfWeek.includes(dayIdx)) {
      return {
        available: false,
        spotsLeft: 0,
        reason: `${tpl.style} does not run on this weekday.`,
      };
    }
    if (!tpl.timeSlots.includes(startTime)) {
      return {
        available: false,
        spotsLeft: 0,
        reason: `${startTime} is not a scheduled slot for ${tpl.style}.`,
      };
    }
    if (isPastDateTime(date, startTime)) {
      return { available: false, spotsLeft: 0, reason: 'This yoga slot has already passed.' };
    }

    const bookedCount = store.yogaAppointments.filter(
      (a) =>
        a.id !== ignoreAppointmentId &&
        a.templateId === templateId &&
        a.date === date &&
        a.startTime === startTime &&
        a.status === 'Upcoming'
    ).length;
    const spotsLeft = Math.max(0, tpl.capacity - bookedCount);

    if (currentUser) {
      const duplicate = store.yogaAppointments.some(
        (a) =>
          a.id !== ignoreAppointmentId &&
          a.memberId === currentUser.id &&
          a.date === date &&
          a.startTime === startTime &&
          a.status === 'Upcoming'
      );
      if (duplicate) {
        return {
          available: false,
          spotsLeft,
          reason: `You already have a yoga appointment booked at ${startTime} on ${date}.`,
        };
      }
    }

    if (spotsLeft <= 0) {
      return { available: false, spotsLeft: 0, reason: 'This yoga session is at full capacity.' };
    }

    return { available: true, spotsLeft };
  };

  const bookYoga = (params: {
    templateId: string;
    date: string;
    startTime: string;
    notes?: string;
  }): ActionResult<YogaAppointment> => {
    if (!currentUser) return { ok: false, message: 'Authentication required.' };
    if (currentUser.status === 'Expired') {
      return {
        ok: false,
        message: 'Your membership is currently expired. Please renew before booking Yoga sessions.',
      };
    }

    const tpl = store.yogaTemplates.find((t) => t.id === params.templateId);
    if (!tpl) return { ok: false, message: 'Yoga session could not be found.' };

    const check = checkYogaSlotAvailability(params.templateId, params.date, params.startTime);
    if (!check.available) {
      return { ok: false, message: check.reason || 'Selected yoga slot is unavailable.' };
    }

    const appt: YogaAppointment = {
      id: makeId('YOG'),
      memberId: currentUser.id,
      memberName: currentUser.name,
      templateId: tpl.id,
      style: tpl.style,
      instructor: tpl.instructor,
      date: params.date,
      startTime: params.startTime,
      durationMin: tpl.durationMin,
      location: tpl.location,
      status: 'Upcoming',
      notes: params.notes?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    setStore((prev) => ({
      ...prev,
      yogaAppointments: [appt, ...prev.yogaAppointments],
      notifications: addNotification(prev, {
        memberId: currentUser.id,
        title: 'Yoga Appointment Booked',
        message: `Confirmed ${tpl.style} with ${tpl.instructor} on ${params.date} at ${params.startTime}.`,
        type: 'booking',
        linkPage: 'yoga',
      }),
    }));

    return {
      ok: true,
      message: `Booked ${tpl.style} with ${tpl.instructor} on ${params.date} at ${params.startTime}.`,
      data: appt,
    };
  };

  const rescheduleYoga = (
    appointmentId: string,
    newDate: string,
    newStartTime: string,
    newTemplateId?: string
  ): ActionResult<YogaAppointment> => {
    if (!currentUser) return { ok: false, message: 'Authentication required.' };
    if (currentUser.status === 'Expired') {
      return { ok: false, message: 'Renew membership before modifying Yoga appointments.' };
    }
    const existing = store.yogaAppointments.find((a) => a.id === appointmentId);
    if (!existing) return { ok: false, message: 'Yoga appointment not found.' };
    if (existing.status !== 'Upcoming') {
      return { ok: false, message: 'Only upcoming Yoga sessions can be rescheduled.' };
    }

    const targetTemplateId = newTemplateId || existing.templateId;
    const tpl = store.yogaTemplates.find((t) => t.id === targetTemplateId);
    if (!tpl) return { ok: false, message: 'Selected yoga session style not found.' };

    if (
      existing.date === newDate &&
      existing.startTime === newStartTime &&
      targetTemplateId === existing.templateId
    ) {
      return { ok: false, message: 'Select a new date, time, or yoga style to reschedule.' };
    }

    const check = checkYogaSlotAvailability(
      targetTemplateId,
      newDate,
      newStartTime,
      existing.id
    );
    if (!check.available) {
      return { ok: false, message: check.reason || 'Selected yoga slot is not available.' };
    }

    const oldSummary = `${existing.date} ${existing.startTime} (${existing.style})`;
    const updated: YogaAppointment = {
      ...existing,
      templateId: tpl.id,
      style: tpl.style,
      instructor: tpl.instructor,
      durationMin: tpl.durationMin,
      location: tpl.location,
      date: newDate,
      startTime: newStartTime,
      rescheduledFrom: oldSummary,
    };

    setStore((prev) => ({
      ...prev,
      yogaAppointments: prev.yogaAppointments.map((a) =>
        a.id === appointmentId ? updated : a
      ),
      notifications: addNotification(prev, {
        memberId: existing.memberId,
        title: 'Yoga Appointment Rescheduled',
        message: `Moved ${existing.id} from ${oldSummary} to ${newDate} at ${newStartTime} (${tpl.style}).`,
        type: 'reschedule',
        linkPage: 'yoga',
      }),
    }));

    return {
      ok: true,
      message: `Rescheduled ${tpl.style} to ${newDate} at ${newStartTime}.`,
      data: updated,
    };
  };

  const cancelYoga = (appointmentId: string): ActionResult => {
    const existing = store.yogaAppointments.find((a) => a.id === appointmentId);
    if (!existing) return { ok: false, message: 'Yoga appointment not found.' };
    if (existing.status !== 'Upcoming') {
      return { ok: false, message: 'Only upcoming Yoga appointments can be cancelled.' };
    }

    setStore((prev) => ({
      ...prev,
      yogaAppointments: prev.yogaAppointments.map((a) =>
        a.id === appointmentId ? { ...a, status: 'Cancelled' } : a
      ),
      notifications: addNotification(prev, {
        memberId: existing.memberId,
        title: 'Yoga Appointment Cancelled',
        message: `${existing.style} on ${existing.date} at ${existing.startTime} was cancelled.`,
        type: 'booking',
        linkPage: 'yoga',
      }),
    }));

    return { ok: true, message: `Cancelled ${existing.style} appointment.` };
  };

  // Lockers
  const isLockerAvailableForWindow = (
    lockerNumber: string,
    date: string,
    startTime: string,
    endTime: string,
    ignoreBookingId?: string
  ): boolean => {
    const locker = store.lockers.find((l) => l.number === lockerNumber);
    if (!locker || locker.status !== 'operational') return false;
    const reqStart = timeToMinutes(startTime);
    const reqEnd = timeToMinutes(endTime);
    if (reqEnd <= reqStart) return false;

    const overlap = store.lockerBookings.some((b) => {
      if (
        b.id === ignoreBookingId ||
        b.lockerNumber !== lockerNumber ||
        b.date !== date ||
        b.status !== 'Upcoming'
      ) {
        return false;
      }
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      return reqStart < bEnd && bStart < reqEnd;
    });

    return !overlap;
  };

  const bookLocker = (
    lockerNumber: string,
    date: string,
    startTime: string,
    endTime: string
  ): ActionResult<LockerBooking> => {
    if (!currentUser) return { ok: false, message: 'Authentication required.' };
    if (currentUser.status === 'Expired') {
      return {
        ok: false,
        message: 'Online locker reservation is available exclusively to active Brave Gym members.',
      };
    }

    if (isPastDateTime(date, startTime)) {
      return { ok: false, message: 'Cannot reserve a locker for a past date or time.' };
    }

    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      return { ok: false, message: 'End time must be after start time.' };
    }

    if (!isLockerAvailableForWindow(lockerNumber, date, startTime, endTime)) {
      return {
        ok: false,
        message: `Locker #${lockerNumber} is reserved or unavailable during ${startTime}–${endTime} on ${date}.`,
      };
    }

    const booking: LockerBooking = {
      id: makeId('LCK'),
      lockerNumber,
      memberId: currentUser.id,
      memberName: currentUser.name,
      date,
      startTime,
      endTime,
      status: 'Upcoming',
      createdAt: new Date().toISOString(),
    };

    setStore((prev) => ({
      ...prev,
      lockerBookings: [booking, ...prev.lockerBookings],
      notifications: addNotification(prev, {
        memberId: currentUser.id,
        title: 'Locker Reserved (Free Online)',
        message: `Locker #${lockerNumber} reserved for ${date} from ${startTime} to ${endTime}.`,
        type: 'booking',
        linkPage: 'bookings',
      }),
    }));

    return {
      ok: true,
      message: `Locker #${lockerNumber} reserved for ${date} (${startTime}–${endTime}).`,
      data: booking,
    };
  };

  const cancelLocker = (bookingId: string): ActionResult => {
    const existing = store.lockerBookings.find((b) => b.id === bookingId);
    if (!existing) return { ok: false, message: 'Locker reservation not found.' };
    if (existing.status !== 'Upcoming') return { ok: false, message: 'Already cancelled or completed.' };

    setStore((prev) => ({
      ...prev,
      lockerBookings: prev.lockerBookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'Cancelled' } : b
      ),
      notifications: addNotification(prev, {
        memberId: existing.memberId,
        title: 'Locker Reservation Cancelled',
        message: `Locker #${existing.lockerNumber} reservation on ${existing.date} was cancelled.`,
        type: 'booking',
        linkPage: 'lockers',
      }),
    }));

    return { ok: true, message: `Locker #${existing.lockerNumber} reservation cancelled.` };
  };

  const changeLocker = (
    bookingId: string,
    newLockerNumber: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string
  ): ActionResult<LockerBooking> => {
    if (!currentUser) return { ok: false, message: 'Authentication required.' };
    if (currentUser.status === 'Expired') {
      return {
        ok: false,
        message: 'Renew your club membership before modifying locker reservations.',
      };
    }
    const existing = store.lockerBookings.find((b) => b.id === bookingId);
    if (!existing) return { ok: false, message: 'Locker reservation not found.' };
    if (existing.status !== 'Upcoming') {
      return { ok: false, message: 'Only upcoming locker reservations can be changed.' };
    }
    if (isPastDateTime(newDate, newStartTime)) {
      return { ok: false, message: 'Cannot move a locker reservation into the past.' };
    }
    if (timeToMinutes(newEndTime) <= timeToMinutes(newStartTime)) {
      return { ok: false, message: 'End time must be after start time.' };
    }
    if (!isLockerAvailableForWindow(newLockerNumber, newDate, newStartTime, newEndTime, bookingId)) {
      return {
        ok: false,
        message: `Locker #${newLockerNumber} is unavailable during ${newStartTime}–${newEndTime} on ${newDate}.`,
      };
    }

    const updated: LockerBooking = {
      ...existing,
      lockerNumber: newLockerNumber,
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
    };

    setStore((prev) => ({
      ...prev,
      lockerBookings: prev.lockerBookings.map((b) => (b.id === bookingId ? updated : b)),
      notifications: addNotification(prev, {
        memberId: existing.memberId,
        title: 'Locker Reservation Updated',
        message: `Updated ${existing.id} to Locker #${newLockerNumber} on ${newDate} (${newStartTime}–${newEndTime}).`,
        type: 'reschedule',
        linkPage: 'lockers',
      }),
    }));

    return {
      ok: true,
      message: `Updated reservation to Locker #${newLockerNumber} (${newDate}, ${newStartTime}–${newEndTime}).`,
      data: updated,
    };
  };

  // Packages & Payments
  const createPackageOrder = (packageId: string): ActionResult<PaymentSubmission> => {
    if (!currentUser) return { ok: false, message: 'Authentication required.' };
    if (currentUser.status === 'Expired') {
      return {
        ok: false,
        message: 'Expired accounts must renew club membership before purchasing PT packages.',
      };
    }

    const pkg = store.ptPackages.find((p) => p.id === packageId);
    if (!pkg) return { ok: false, message: 'PT Package not found.' };

    const submission: PaymentSubmission = {
      id: makeId('PAY'),
      memberId: currentUser.id,
      memberName: currentUser.name,
      packageId: pkg.id,
      packageName: pkg.name,
      trainerTierLabel: pkg.tierLabel,
      sessionsCount: pkg.sessions,
      amount: pkg.price,
      method: 'Bank Transfer BCA',
      status: 'Awaiting Payment',
      submittedAt: new Date().toISOString(),
    };

    setStore((prev) => ({
      ...prev,
      payments: [submission, ...prev.payments],
      notifications: addNotification(prev, {
        memberId: currentUser.id,
        title: 'PT Package Order Created',
        message: `Order ${submission.id} for ${pkg.name} (${pkg.tierLabel}) created. Please upload payment proof in Payment Center.`,
        type: 'payment',
        linkPage: 'payments',
      }),
    }));

    return { ok: true, message: `Order ${submission.id} created. Proceed to submit payment proof.`, data: submission };
  };

  const submitPaymentProof = (
    paymentId: string,
    method: string,
    proofFileName: string,
    proofNote: string,
    proofPreviewUrl?: string
  ): ActionResult<PaymentSubmission> => {
    const existing = store.payments.find((p) => p.id === paymentId);
    if (!existing) return { ok: false, message: 'Payment record not found.' };

    const updated: PaymentSubmission = {
      ...existing,
      method,
      proofFileName: proofFileName || 'transfer-proof.jpg',
      proofNote: proofNote.trim(),
      proofPreviewUrl,
      status: 'Pending Verification',
      submittedAt: new Date().toISOString(),
    };

    setStore((prev) => ({
      ...prev,
      payments: prev.payments.map((p) => (p.id === paymentId ? updated : p)),
      notifications: addNotification(prev, {
        memberId: existing.memberId,
        title: 'Payment Proof Submitted',
        message: `Payment proof for ${existing.packageName} (${existing.id}) submitted and pending verification.`,
        type: 'payment',
        linkPage: 'payments',
      }),
    }));

    return {
      ok: true,
      message: 'Payment proof submitted. Credits will be added once verified by Brave Club Admin.',
      data: updated,
    };
  };

  // Notifications
  const unreadNotificationCount = useMemo(() => {
    if (!currentUser) return 0;
    return store.notifications.filter((n) => n.memberId === currentUser.id && !n.read).length;
  }, [store.notifications, currentUser]);

  const markNotificationRead = (id: string) => {
    setStore((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  };

  const markAllNotificationsRead = () => {
    if (!currentUser) return;
    setStore((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.memberId === currentUser.id ? { ...n, read: true } : n
      ),
    }));
  };

  // Admin actions
  const adminUpdateMemberStatus = (memberId: string, status: MembershipStatus) => {
    setStore((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === memberId ? { ...m, status } : m)),
    }));
  };

  const adminAddMember = (member: Omit<Member, 'id'>): ActionResult<Member> => {
    const exists = store.members.some(
      (m) =>
        m.gmail.toLowerCase() === member.gmail.toLowerCase() ||
        m.membershipId.toUpperCase() === member.membershipId.toUpperCase()
    );
    if (exists) {
      return { ok: false, message: 'A member with this Gmail or Membership ID already exists.' };
    }
    const created: Member = { ...member, id: makeId('MEM') };
    setStore((prev) => ({ ...prev, members: [created, ...prev.members] }));
    return { ok: true, message: 'Member added.', data: created };
  };

  const adminUpdateClass = (cls: GymClass) => {
    setStore((prev) => ({
      ...prev,
      classes: prev.classes.map((c) => (c.id === cls.id ? cls : c)),
    }));
  };

  const adminAddClass = (cls: Omit<GymClass, 'id'>) => {
    const created: GymClass = { ...cls, id: makeId('CLS') };
    setStore((prev) => ({ ...prev, classes: [...prev.classes, created] }));
  };

  const adminDeleteClass = (classId: string) => {
    setStore((prev) => ({
      ...prev,
      classes: prev.classes.filter((c) => c.id !== classId),
    }));
  };

  const adminUpdateTrainer = (trainer: Trainer) => {
    setStore((prev) => ({
      ...prev,
      trainers: prev.trainers.map((t) => (t.id === trainer.id ? trainer : t)),
    }));
  };

  const adminAddTrainer = (trainer: Omit<Trainer, 'id'>) => {
    const created: Trainer = { ...trainer, id: makeId('TRN') };
    setStore((prev) => ({ ...prev, trainers: [...prev.trainers, created] }));
  };

  const adminUpdatePackagePrice = (packageId: string, price: number) => {
    setStore((prev) => ({
      ...prev,
      ptPackages: prev.ptPackages.map((p) => (p.id === packageId ? { ...p, price } : p)),
    }));
  };

  const adminUpdateSaunaConfig = (config: SaunaConfig) => {
    setStore((prev) => ({ ...prev, saunaConfig: config }));
  };

  const adminToggleLockerStatus = (lockerNumber: string) => {
    setStore((prev) => ({
      ...prev,
      lockers: prev.lockers.map((l) =>
        l.number === lockerNumber
          ? { ...l, status: l.status === 'operational' ? 'maintenance' : 'operational' }
          : l
      ),
    }));
  };

  const adminApprovePayment = (paymentId: string, adminNote?: string) => {
    const target = store.payments.find((p) => p.id === paymentId);
    if (!target || target.status === 'Approved') return;

    setStore((prev) => ({
      ...prev,
      payments: prev.payments.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: 'Approved',
              reviewedAt: new Date().toISOString(),
              adminNote: adminNote || 'Payment verified & PT credits issued.',
            }
          : p
      ),
      members: prev.members.map((m) =>
        m.id === target.memberId
          ? { ...m, ptCreditsTotal: m.ptCreditsTotal + target.sessionsCount }
          : m
      ),
      notifications: addNotification(prev, {
        memberId: target.memberId,
        title: 'Payment Approved — PT Credits Added',
        message: `Your payment for ${target.packageName} was approved. +${target.sessionsCount} PT session credits have been added to your account.`,
        type: 'payment',
        linkPage: 'pt-schedule',
      }),
    }));
  };

  const adminRejectPayment = (paymentId: string, adminNote?: string) => {
    const target = store.payments.find((p) => p.id === paymentId);
    if (!target || target.status === 'Rejected') return;

    setStore((prev) => ({
      ...prev,
      payments: prev.payments.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: 'Rejected',
              reviewedAt: new Date().toISOString(),
              adminNote: adminNote || 'Transfer proof could not be verified. Please re-submit.',
            }
          : p
      ),
      notifications: addNotification(prev, {
        memberId: target.memberId,
        title: 'Payment Submission Declined',
        message: `Payment ${target.id} was declined: ${adminNote || 'Please re-verify your transfer proof.'}`,
        type: 'payment',
        linkPage: 'payments',
      }),
    }));
  };

  const adminUpdatePolicyConfig = (policy: PolicyConfig) => {
    setStore((prev) => ({ ...prev, policyConfig: policy }));
  };

  const adminCompletePTAppointment = (appointmentId: string) => {
    setStore((prev) => ({
      ...prev,
      ptAppointments: prev.ptAppointments.map((a) =>
        a.id === appointmentId ? { ...a, status: 'Completed' } : a
      ),
    }));
  };

  const value: BraveContextValue = {
    store,
    currentUser,
    activePage,
    setActivePage,
    preselectedTrainerId,
    setPreselectedTrainerId,
    rescheduleTargetId,
    setRescheduleTargetId,
    loginWithCredentials,
    demoLogin,
    logout,
    resetDemoData,
    getClassRemainingSpots,
    hasMemberBookedClass,
    bookClass,
    cancelClassBooking,
    getMemberPTCreditsRemaining,
    checkPTSlotAvailability,
    bookPT,
    reschedulePT,
    cancelPT,
    canModifyPTAppointment,
    getSaunaSlotBookedCount,
    bookSauna,
    cancelSauna,
    getYogaSlotBookedCount,
    checkYogaSlotAvailability,
    bookYoga,
    rescheduleYoga,
    cancelYoga,
    isLockerAvailableForWindow,
    bookLocker,
    changeLocker,
    cancelLocker,
    createPackageOrder,
    submitPaymentProof,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
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
  };

  return <BraveContext.Provider value={value}>{children}</BraveContext.Provider>;
};

export function useBrave(): BraveContextValue {
  const ctx = useContext(BraveContext);
  if (!ctx) throw new Error('useBrave must be used inside BraveProvider');
  return ctx;
}
