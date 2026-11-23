import React from 'react';
import { Clock, ExternalLink, Instagram, Lock, MapPin, MessageCircle } from 'lucide-react';
import { useBrave } from '../context/BraveContext';
import { BRAND_MEDIA } from '../data/brandMedia';
import {
  EXTERNAL_LINKS,
  STUDIO_HOURS_12H,
  STUDIO_HOURS_24H,
  STUDIO_HOURS_STATUS,
} from '../utils/dateUtils';
import { getMembershipTheme } from '../utils/membershipTheme';
import { BraveLogo, SafeImage } from './BraveLogo';

export const ProfilePage: React.FC = () => {
  const { currentUser, getMemberPTCreditsRemaining, logout } = useBrave();

  if (!currentUser) return null;

  const ptRemaining = getMemberPTCreditsRemaining(currentUser);
  const memberTheme = getMembershipTheme(currentUser.category, currentUser.status);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6F8569]">
          Account Credentials
        </p>
        <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#123F2D]">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-[#252823]/70">
          Your verified Brave Gym &amp; Fitness membership credentials. Membership IDs are issued by the club desk and cannot be edited by members.
        </p>
      </div>

      {/* Membership Details Card */}
      <section
        className={`rounded-xl border ${memberTheme.borderClass} bg-white overflow-hidden shadow-sm`}
      >
        <div
          className={`px-6 py-5 ${memberTheme.cardBgClass} border-b ${memberTheme.dividerClass} flex flex-wrap items-center justify-between gap-4`}
        >
          <BraveLogo variant="dark" compact />
          <div className="text-right">
            <div
              className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${memberTheme.secondaryTextClass}`}
            >
              Account Status
            </div>
            <div className="mt-1.5 flex items-center justify-end gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase ${memberTheme.badgeClass}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${memberTheme.dotClass}`} />
                {memberTheme.badgeLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#6F8569]">
              Member Name
            </div>
            <div className="mt-1 font-display text-lg font-bold text-[#252823]">
              {currentUser.name}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#6F8569]">
              Gmail Address
            </div>
            <div className="mt-1 font-medium text-[#252823]">{currentUser.gmail}</div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#6F8569] flex items-center gap-1.5">
              <span>Membership ID</span>
              <Lock className="w-3 h-3 text-[#252823]/45" />
            </div>
            <div
              className={`mt-1 font-mono font-bold text-base ${memberTheme.accentTextClass} ${memberTheme.cardBgClass} border ${memberTheme.borderClass} rounded-lg px-3 py-2 inline-block select-all`}
            >
              {currentUser.membershipId}
            </div>
            <p className="mt-1 text-[11px] text-[#252823]/55">
              Locked by Brave Club Administration
            </p>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#6F8569]">
              Membership Category
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="font-semibold text-[#252823]">
                {currentUser.category} Membership
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase ${memberTheme.badgeClass}`}
              >
                {memberTheme.badgeLabel}
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#6F8569]">
              Expiration Date
            </div>
            <div className="mt-1 font-semibold tabular-nums text-[#252823]">
              {currentUser.expirationDate}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#6F8569]">
              PT Credits Summary
            </div>
            <div className="mt-1 font-semibold tabular-nums text-[#123F2D]">
              {ptRemaining} remaining ({currentUser.ptCreditsUsed} used of{' '}
              {currentUser.ptCreditsTotal} total)
            </div>
          </div>
        </div>
      </section>

      {/* External Club Support */}
      <section className="rounded-xl border border-[#252823]/10 bg-white overflow-hidden grid grid-cols-1 sm:grid-cols-12 items-center">
        <div className="sm:col-span-4 h-44 sm:h-full bg-[#0B2E21]">
          <SafeImage
            src={BRAND_MEDIA.clubExterior}
            alt="Brave Gym & Fitness entrance facade"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="sm:col-span-8 p-6 space-y-4">
          <div>
            <h2 className="font-display text-base font-bold text-[#123F2D]">
              Club Support &amp; Location
            </h2>
            <p className="text-xs text-[#252823]/70 mt-1">
              Need to renew membership or visit our training floor? Reach our team directly.
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#123F2D] tabular-nums">
              <Clock className="w-3.5 h-3.5 text-[#6F8569]" />
              Daily Studio Hours: {STUDIO_HOURS_24H} ({STUDIO_HOURS_12H} · {STUDIO_HOURS_STATUS})
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={EXTERNAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#252823]/15 text-xs font-semibold text-[#123F2D] hover:bg-[#F8F7F3]"
            >
              <Instagram className="w-4 h-4" />
              <span>Instagram</span>
            </a>
            <a
              href={EXTERNAL_LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#252823]/15 text-xs font-semibold text-[#123F2D] hover:bg-[#F8F7F3]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contact via WhatsApp</span>
            </a>
            <a
              href={EXTERNAL_LINKS.maps}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-xs font-semibold hover:bg-[#0B2E21]"
            >
              <MapPin className="w-4 h-4" />
              <span>Directions to Brave Gym</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      <div className="pt-2">
        <button
          type="button"
          onClick={logout}
          className="px-5 py-2.5 rounded-lg border border-[#9E2A2B]/30 bg-[#FCEEEE] text-[#9E2A2B] text-xs font-semibold hover:bg-[#f8dede] cursor-pointer"
        >
          Sign Out of Member Portal
        </button>
      </div>
    </div>
  );
};
