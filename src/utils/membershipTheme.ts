import { MembershipCategory, MembershipStatus } from '../types';

export interface MembershipTheme {
  schemeKey: 'regular-active' | 'student-active' | 'expired' | 'pending-renewal';
  badgeLabel: 'ACTIVE' | 'STUDENT' | 'EXPIRED' | 'RENEWAL PENDING';
  statusLabel: string;
  cardBgClass: string;
  borderClass: string;
  dividerClass: string;
  accentTextClass: string;
  secondaryTextClass: string;
  badgeClass: string;
  dotClass: string;
}

/**
 * Automatically assigns the Brave Gym & Fitness color-coded membership theme
 * from the member's category (`Regular` | `Student` | `Admin`) and status
 * (`Active` | `Expired` | `Pending Renewal`).
 *
 * Priority:
 * 1. Expired (regardless of Regular or Student) -> Soft Red (#FBE7E7 / #AC4242 / #F4D0D0)
 * 2. Pending Renewal -> Soft Orange (#FFF1DF / #B87527 / #F8DFC0)
 * 3. Active Student -> Soft Blue (#E5EDF9 / #315E9E / #D0DFF4)
 * 4. Active Regular (or Admin) -> Soft Forest Green (#E8F0E8 / #245B3B / #D0E3D2)
 */
export function getMembershipTheme(
  category: MembershipCategory,
  status: MembershipStatus
): MembershipTheme {
  if (status === 'Expired') {
    return {
      schemeKey: 'expired',
      badgeLabel: 'EXPIRED',
      statusLabel: 'Expired',
      cardBgClass: 'bg-[#FBE7E7]',
      borderClass: 'border-[#AC4242]/25',
      dividerClass: 'border-[#AC4242]/15',
      accentTextClass: 'text-[#AC4242]',
      secondaryTextClass: 'text-[#AC4242]/80',
      badgeClass: 'bg-[#F4D0D0] text-[#AC4242]',
      dotClass: 'bg-[#AC4242]',
    };
  }

  if (status === 'Pending Renewal') {
    return {
      schemeKey: 'pending-renewal',
      badgeLabel: 'RENEWAL PENDING',
      statusLabel: 'Pending Renewal',
      cardBgClass: 'bg-[#FFF1DF]',
      borderClass: 'border-[#B87527]/25',
      dividerClass: 'border-[#B87527]/15',
      accentTextClass: 'text-[#B87527]',
      secondaryTextClass: 'text-[#B87527]/85',
      badgeClass: 'bg-[#F8DFC0] text-[#B87527]',
      dotClass: 'bg-[#B87527]',
    };
  }

  if (category === 'Student') {
    return {
      schemeKey: 'student-active',
      badgeLabel: 'STUDENT',
      statusLabel: 'Active Student',
      cardBgClass: 'bg-[#E5EDF9]',
      borderClass: 'border-[#315E9E]/25',
      dividerClass: 'border-[#315E9E]/15',
      accentTextClass: 'text-[#315E9E]',
      secondaryTextClass: 'text-[#315E9E]/80',
      badgeClass: 'bg-[#D0DFF4] text-[#315E9E]',
      dotClass: 'bg-[#315E9E]',
    };
  }

  return {
    schemeKey: 'regular-active',
    badgeLabel: 'ACTIVE',
    statusLabel: category === 'Admin' ? 'Club Admin' : 'Active Regular',
    cardBgClass: 'bg-[#E8F0E8]',
    borderClass: 'border-[#245B3B]/25',
    dividerClass: 'border-[#245B3B]/15',
    accentTextClass: 'text-[#245B3B]',
    secondaryTextClass: 'text-[#245B3B]/80',
    badgeClass: 'bg-[#D0E3D2] text-[#245B3B]',
    dotClass: 'bg-[#245B3B]',
  };
}
