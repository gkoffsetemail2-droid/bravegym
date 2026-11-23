import React, { useState } from 'react';
import { ArrowRight, ExternalLink, Instagram, MapPin, MessageCircle, ShieldAlert } from 'lucide-react';
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

export const LoginPage: React.FC = () => {
  const { store, loginWithCredentials, demoLogin, resetDemoData } = useBrave();
  const [gmail, setGmail] = useState('');
  const [membershipId, setMembershipId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = loginWithCredentials(gmail, membershipId);
    if (!res.ok) {
      setError(res.message);
    }
  };

  const handleQuickDemo = (memberId: string) => {
    setError(null);
    const res = demoLogin(memberId);
    if (!res.ok) setError(res.message);
  };

  return (
    <div className="min-h-screen bg-[#F8F7F3] text-[#252823] grid grid-cols-1 lg:grid-cols-12">
      {/* Left Architectural Hero Panel */}
      <div className="relative lg:col-span-6 xl:col-span-7 min-h-[300px] lg:min-h-screen bg-[#0B2E21] overflow-hidden flex flex-col justify-between p-8 sm:p-12">
        <SafeImage
          src={BRAND_MEDIA.coachCableFly}
          alt="Brave Gym & Fitness coach training inside the studio"
          className="absolute inset-0 w-full h-full object-cover object-top opacity-80"
          fallbackLabel="BRAVE GYM & FITNESS"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#0B2E21]/95 via-[#0B2E21]/50 to-[#0B2E21]/45"
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-center justify-between">
          <BraveLogo variant="light" compact />
          <span className="text-xs font-medium tracking-[0.18em] uppercase text-[#EAE2D5]/90">
            Member Sanctuary
          </span>
        </div>

        <div className="relative z-10 max-w-xl pt-12 pb-4 space-y-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#EAE2D5]/85 mb-3">
              Exclusive Member Access
            </p>
            <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#F8F7F3] leading-[1.1] [text-wrap:balance]">
              Train with purpose. Recover in stillness.
            </h1>
            <p className="mt-4 text-sm sm:text-base text-[#EAE2D5]/90 leading-relaxed max-w-lg">
              Reserve studio group classes, schedule and reschedule personal training sessions, book complimentary sauna access, and manage your club lockers in one private portal.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-md">
            <div className="aspect-[4/3] rounded-lg overflow-hidden border border-white/20">
              <SafeImage
                src={BRAND_MEDIA.teamCommunity}
                alt="Brave Gym coaching team and members"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="aspect-[4/3] rounded-lg overflow-hidden border border-white/20">
              <SafeImage
                src={BRAND_MEDIA.squatRackFloor}
                alt="Brave Gym power rack training floor"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-[4/3] rounded-lg overflow-hidden border border-white/20">
              <SafeImage
                src={BRAND_MEDIA.studioLounge}
                alt="Brave Gym lounge bench"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#EAE2D5]/20 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#EAE2D5]/90 tabular-nums">
            <span className="font-semibold text-[#F8F7F3]">
              Daily Studio Hours: {STUDIO_HOURS_24H}
            </span>
            <span aria-hidden="true">·</span>
            <span>{STUDIO_HOURS_12H}</span>
            <span aria-hidden="true">·</span>
            <span>{STUDIO_HOURS_STATUS}</span>
            <span aria-hidden="true">·</span>
            <span>Complimentary Sauna &amp; Online Lockers</span>
          </div>
        </div>
      </div>

      {/* Right Authentication Form Panel */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 sm:p-12 lg:p-16 bg-[#F8F7F3]">
        <div className="max-w-md w-full mx-auto my-auto py-4">
          <div className="mb-8">
            <div className="mb-5">
              <BraveLogo variant="dark" />
            </div>
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#6F8569] mb-2">
              Member Verification
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#123F2D]">
              Sign in to Brave Portal
            </h2>
            <p className="mt-2 text-sm text-[#252823]/75">
              Enter your registered Gmail address and club Membership ID. No password is required.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-[#9E2A2B]/30 bg-[#FCEEEE] px-4 py-3 text-sm text-[#7A1E1F] flex items-start gap-3"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="login-gmail"
                className="block text-xs font-semibold tracking-wide uppercase text-[#252823]/80 mb-2"
              >
                Gmail Address
              </label>
              <input
                id="login-gmail"
                type="email"
                autoComplete="email"
                required
                value={gmail}
                onChange={(e) => setGmail(e.target.value)}
                placeholder="member@gmail.com"
                className="w-full rounded-lg border border-[#252823]/15 bg-white px-4 py-3 text-sm text-[#252823] placeholder:text-[#252823]/40 focus:outline-none focus:border-[#123F2D] focus:ring-2 focus:ring-[#123F2D]/15 transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="login-membership-id"
                className="block text-xs font-semibold tracking-wide uppercase text-[#252823]/80 mb-2"
              >
                Membership ID
              </label>
              <input
                id="login-membership-id"
                type="text"
                required
                value={membershipId}
                onChange={(e) => setMembershipId(e.target.value)}
                placeholder="BRV-2026-0142"
                className="w-full rounded-lg border border-[#252823]/15 bg-white px-4 py-3 text-sm font-mono uppercase tracking-wider text-[#252823] placeholder:text-[#252823]/40 focus:outline-none focus:border-[#123F2D] focus:ring-2 focus:ring-[#123F2D]/15 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#123F2D] px-6 py-3.5 text-sm font-semibold tracking-wide text-[#F8F7F3] hover:bg-[#0B2E21] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#123F2D] transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>LOGIN TO BRAVE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Optional Demo Login & Discreet Testing Hint */}
          <div className="mt-8 pt-6 border-t border-[#252823]/10">
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => handleQuickDemo('mem-regular-1')}
                className="inline-flex items-center justify-center rounded-lg border border-[#123F2D]/25 bg-[#EAE2D5]/60 px-4 py-2.5 text-xs font-semibold tracking-wide text-[#123F2D] hover:bg-[#EAE2D5] transition-colors cursor-pointer whitespace-nowrap"
              >
                DEMO LOGIN (Active Member)
              </button>

              <button
                type="button"
                onClick={() => setShowDemoMenu((v) => !v)}
                className="text-xs font-medium text-[#6F8569] hover:text-[#123F2D] underline underline-offset-4 cursor-pointer whitespace-nowrap"
              >
                {showDemoMenu ? 'Hide demo accounts' : 'View demo credentials'}
              </button>
            </div>

            {showDemoMenu && (
              <div className="mt-4 rounded-lg border border-[#252823]/10 bg-white p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-[#252823]/60 pb-1 border-b border-[#252823]/10">
                  <span className="font-semibold uppercase tracking-wider">
                    Development Demo Directory
                  </span>
                  <button
                    type="button"
                    onClick={resetDemoData}
                    className="text-[#6F8569] hover:text-[#123F2D] underline cursor-pointer"
                  >
                    Reset Demo Data
                  </button>
                </div>

                {store.members.map((m) => {
                  const theme = getMembershipTheme(m.category, m.status);
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-3 py-1.5 border-b border-[#252823]/5 last:border-none"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-[#252823] flex flex-wrap items-center gap-1.5">
                          <span className="truncate">{m.name}</span>
                          {m.role === 'admin' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#D0E3D2] text-[#245B3B]">
                              CLUB ADMIN
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${theme.badgeClass}`}
                            >
                              {theme.badgeLabel}
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-[#252823]/65 truncate mt-0.5">
                          {m.gmail} · {m.membershipId}
                        </div>
                      </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setGmail(m.gmail);
                          setMembershipId(m.membershipId);
                        }}
                        className="px-2.5 py-1.5 rounded border border-[#252823]/15 text-[#252823] hover:bg-[#F8F7F3] cursor-pointer"
                      >
                        Fill
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDemo(m.id)}
                        className="px-2.5 py-1.5 rounded bg-[#123F2D] text-white hover:bg-[#0B2E21] cursor-pointer"
                      >
                        Enter
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer External Links */}
        <footer className="max-w-md w-full mx-auto pt-6 border-t border-[#252823]/10 flex flex-wrap items-center justify-between gap-3 text-xs text-[#252823]/70">
          <div className="flex flex-wrap items-center gap-4">
            <a
              href={EXTERNAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-[#123F2D] transition-colors"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>Instagram</span>
            </a>
            <a
              href={EXTERNAL_LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-[#123F2D] transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Contact via WhatsApp</span>
            </a>
            <a
              href={EXTERNAL_LINKS.maps}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-[#123F2D] transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Directions to Brave Gym</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};
