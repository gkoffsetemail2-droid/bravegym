export type MemberRole = 'member' | 'admin';
export type MembershipCategory = 'Regular' | 'Student' | 'Admin';
export type MembershipStatus = 'Active' | 'Expired' | 'Pending Renewal';

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export type TrainerTier = 'senior' | 'standard';

export type BookingStatus = 'Upcoming' | 'Completed' | 'Cancelled';

export type PaymentStatus =
  | 'Awaiting Payment'
  | 'Submitted'
  | 'Pending Verification'
  | 'Approved'
  | 'Rejected';

export type PageId =
  | 'dashboard'
  | 'classes'
  | 'trainers'
  | 'pt-schedule'
  | 'yoga'
  | 'packages'
  | 'sauna'
  | 'lockers'
  | 'bookings'
  | 'payments'
  | 'notifications'
  | 'profile';

export type AdminTabId =
  | 'overview'
  | 'members'
  | 'classes'
  | 'trainers'
  | 'packages'
  | 'sauna'
  | 'lockers'
  | 'payments';

export interface Member {
  id: string;
  name: string;
  gmail: string;
  membershipId: string;
  category: MembershipCategory;
  status: MembershipStatus;
  expirationDate: string;
  role: MemberRole;
  phone: string;
  joinDate: string;
  ptCreditsTotal: number;
  ptCreditsUsed: number;
}

export interface GymClass {
  id: string;
  day: DayOfWeek;
  time: string;
  title: string;
  coach: string;
  durationMin: number;
  location: string;
  capacity: number;
  mockOccupiedCount: number;
  category: 'Yoga & Mobility' | 'Strength & Conditioning' | 'Pilates' | 'Combat & Cardio';
}

export interface ClassBooking {
  id: string;
  classId: string;
  classTitle: string;
  day: DayOfWeek;
  date: string;
  time: string;
  coach: string;
  location: string;
  memberId: string;
  memberName: string;
  status: BookingStatus;
  createdAt: string;
}

export interface Trainer {
  id: string;
  name: string;
  tier: TrainerTier;
  specialization: string;
  experience: string;
  bio: string;
  photo?: string;
  workingDays: number[]; // 0=Sunday ... 6=Saturday
  startHour: number; // e.g. 6
  endHour: number; // e.g. 23
  breakHours: number[]; // e.g. [12]
  active: boolean;
}

export interface PTPackage {
  id: string;
  tier: TrainerTier;
  tierLabel: string;
  sessions: number;
  type: 'Personal' | 'Couple';
  name: string;
  price: number;
  description: string;
}

export interface PTAppointment {
  id: string;
  memberId: string;
  memberName: string;
  trainerId: string;
  trainerName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:00
  durationMin: number;
  status: BookingStatus;
  packageType: string;
  notes?: string;
  createdAt: string;
  rescheduledFrom?: string;
}

export interface SaunaConfig {
  openHour: number;
  closeHour: number;
  slotDurationMin: number;
  maxCapacity: number;
  blockedDates: string[];
}

export interface SaunaBooking {
  id: string;
  memberId: string;
  memberName: string;
  date: string;
  timeSlot: string;
  status: BookingStatus;
  createdAt: string;
}

export interface YogaScheduleTemplate {
  id: string;
  style: string;
  instructor: string;
  level: string;
  durationMin: number;
  location: string;
  capacity: number;
  daysOfWeek: number[]; // 0=Sunday ... 6=Saturday
  timeSlots: string[]; // HH:mm
  description: string;
}

export interface YogaAppointment {
  id: string;
  memberId: string;
  memberName: string;
  templateId: string;
  style: string;
  instructor: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  durationMin: number;
  location: string;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
  rescheduledFrom?: string;
}

export interface Locker {
  number: string;
  zone: 'North Wing' | 'South Wing';
  size: 'Standard' | 'Tall';
  status: 'operational' | 'maintenance';
}

export interface LockerBooking {
  id: string;
  lockerNumber: string;
  memberId: string;
  memberName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  createdAt: string;
}

export interface PaymentSubmission {
  id: string;
  memberId: string;
  memberName: string;
  packageId: string;
  packageName: string;
  trainerTierLabel: string;
  sessionsCount: number;
  amount: number;
  method: string;
  proofFileName?: string;
  proofPreviewUrl?: string;
  proofNote?: string;
  status: PaymentStatus;
  submittedAt: string;
  reviewedAt?: string;
  adminNote?: string;
}

export interface AppNotification {
  id: string;
  memberId: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'system' | 'reschedule';
  read: boolean;
  createdAt: string;
  linkPage?: PageId;
}

export interface PolicyConfig {
  ptCancelNoticeHours: number;
  ptDefaultDurationMin: number;
}

export interface BraveStore {
  members: Member[];
  classes: GymClass[];
  classBookings: ClassBooking[];
  trainers: Trainer[];
  ptPackages: PTPackage[];
  ptAppointments: PTAppointment[];
  saunaConfig: SaunaConfig;
  saunaBookings: SaunaBooking[];
  yogaTemplates: YogaScheduleTemplate[];
  yogaAppointments: YogaAppointment[];
  lockers: Locker[];
  lockerBookings: LockerBooking[];
  payments: PaymentSubmission[];
  notifications: AppNotification[];
  policyConfig: PolicyConfig;
}
