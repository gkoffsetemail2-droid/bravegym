import React, { useState } from 'react';
import { CheckCircle2, CreditCard, Package } from 'lucide-react';
import { useBrave } from '../context/BraveContext';
import { BRAND_MEDIA } from '../data/brandMedia';
import { PTPackage, PaymentSubmission } from '../types';
import { formatRupiah } from '../utils/dateUtils';
import { SafeImage } from './BraveLogo';

export const PTPackagesPage: React.FC = () => {
  const {
    store,
    currentUser,
    setActivePage,
    getMemberPTCreditsRemaining,
    createPackageOrder,
  } = useBrave();

  const [selectedPkg, setSelectedPkg] = useState<PTPackage | null>(null);
  const [createdOrder, setCreatedOrder] = useState<PaymentSubmission | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!currentUser) return null;

  const isExpired = currentUser.status === 'Expired';
  const remainingCredits = getMemberPTCreditsRemaining(currentUser);

  const seniorPackages = store.ptPackages.filter((p) => p.tier === 'senior');
  const standardPackages = store.ptPackages.filter((p) => p.tier === 'standard');

  const handlePurchase = (pkg: PTPackage) => {
    setErrorMsg(null);
    const res = createPackageOrder(pkg.id);
    if (!res.ok) {
      setErrorMsg(res.message);
      return;
    }
    setSelectedPkg(pkg);
    setCreatedOrder(res.data ?? null);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6F8569]">
            Training Credits
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#123F2D]">
            Personal Training Packages
          </h1>
          <p className="mt-1 text-sm text-[#252823]/70">
            Purchase a personal or couple coaching package. Session credits are added immediately upon payment approval.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActivePage('payments')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#123F2D]/25 bg-white text-xs font-semibold text-[#123F2D] hover:bg-[#EAE2D5]/50 cursor-pointer self-start"
        >
          <CreditCard className="w-4 h-4" />
          <span>Go to Payment Center</span>
        </button>
      </div>

      {/* Member PT Credit Balance Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#252823]/10 bg-white p-5">
          <div className="text-xs font-medium text-[#6F8569]">Total PT Credits Issued</div>
          <div className="mt-1 font-display text-3xl font-bold tabular-nums text-[#123F2D]">
            {currentUser.ptCreditsTotal}
          </div>
        </div>
        <div className="rounded-xl border border-[#252823]/10 bg-white p-5">
          <div className="text-xs font-medium text-[#6F8569]">Used Sessions</div>
          <div className="mt-1 font-display text-3xl font-bold tabular-nums text-[#252823]">
            {currentUser.ptCreditsUsed}
          </div>
        </div>
        <div className="rounded-xl border border-[#123F2D] bg-[#123F2D] text-[#F8F7F3] p-5">
          <div className="text-xs font-medium text-[#EAE2D5]/80">Remaining PT Sessions</div>
          <div className="mt-1 font-display text-3xl font-bold tabular-nums">
            {remainingCredits}
          </div>
        </div>
      </section>

      {errorMsg && (
        <div className="rounded-lg border border-[#9E2A2B]/30 bg-[#FCEEEE] px-4 py-3 text-sm text-[#7A1E1F]">
          {errorMsg}
        </div>
      )}

      {createdOrder && selectedPkg && (
        <div className="rounded-xl border border-[#123F2D]/25 bg-[#123F2D] text-[#F8F7F3] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#EAE2D5] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs uppercase tracking-wider text-[#EAE2D5]/80 font-semibold">
                Order Created · {createdOrder.id}
              </div>
              <div className="font-display text-lg font-bold mt-0.5">
                {selectedPkg.name} ({selectedPkg.tierLabel}) — {formatRupiah(selectedPkg.price)}
              </div>
              <p className="text-xs text-[#EAE2D5]/90 mt-1">
                Status: {createdOrder.status}. Upload your transfer receipt in Payment Center to receive +{selectedPkg.sessions} PT session credits upon approval.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActivePage('payments')}
            className="px-5 py-2.5 rounded-lg bg-[#EAE2D5] text-[#0B2E21] text-xs font-bold hover:bg-white cursor-pointer whitespace-nowrap self-start sm:self-center"
          >
            Submit Payment Proof
          </button>
        </div>
      )}

      {/* Tier 1: CLARA, CINDY & UGI */}
      <section className="space-y-4">
        <div className="rounded-xl border border-[#252823]/10 bg-white overflow-hidden grid grid-cols-1 md:grid-cols-12 items-center">
          <div className="md:col-span-4 h-40 md:h-full min-h-[140px] bg-[#EAE2D5]">
            <SafeImage
              src={BRAND_MEDIA.coachCableFly}
              alt="Brave Gym senior personal trainer on cable station"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="md:col-span-8 p-5 sm:p-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6F8569]">
                Senior Coaching Tier
              </p>
              <h2 className="font-display text-xl font-bold text-[#123F2D] uppercase mt-0.5">
                CLARA, CINDY &amp; UGI
              </h2>
              <p className="text-xs text-[#252823]/70 mt-1">
                60-minute private &amp; couple sessions with Brave&apos;s senior strength &amp; recomposition specialists.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {seniorPackages.map((pkg) => (
            <div
              key={pkg.id}
              className="rounded-xl border border-[#252823]/10 bg-white p-6 flex flex-col justify-between gap-5"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-[#6F8569] font-medium">
                  <span>{pkg.type} Plan</span>
                  <span className="tabular-nums">{pkg.sessions} Sessions</span>
                </div>
                <h3 className="mt-2 font-display text-lg font-bold text-[#123F2D]">
                  {pkg.name}
                </h3>
                <div className="mt-2 font-display text-2xl font-bold tabular-nums text-[#252823]">
                  {formatRupiah(pkg.price)}
                </div>
                <p className="mt-3 text-xs text-[#252823]/70 leading-relaxed">
                  {pkg.description}
                </p>
              </div>

              <button
                type="button"
                disabled={isExpired}
                onClick={() => handlePurchase(pkg)}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-xs font-semibold tracking-wider uppercase hover:bg-[#0B2E21] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Purchase Package</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Tier 2: SALVA, FACHRI & EGA */}
      <section className="space-y-4">
        <div className="rounded-xl border border-[#252823]/10 bg-white overflow-hidden grid grid-cols-1 md:grid-cols-12 items-center">
          <div className="md:col-span-4 h-40 md:h-full min-h-[140px] bg-[#EAE2D5]">
            <SafeImage
              src={BRAND_MEDIA.ptCoaching}
              alt="Personal training form coaching session at Brave Gym"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="md:col-span-8 p-5 sm:p-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6F8569]">
                Club Coaching Tier
              </p>
              <h2 className="font-display text-xl font-bold text-[#123F2D] uppercase mt-0.5">
                SALVA, FACHRI &amp; EGA
              </h2>
              <p className="text-xs text-[#252823]/70 mt-1">
                60-minute private &amp; couple sessions focused on hypertrophy, conditioning, and movement balance.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {standardPackages.map((pkg) => (
            <div
              key={pkg.id}
              className="rounded-xl border border-[#252823]/10 bg-white p-6 flex flex-col justify-between gap-5"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-[#6F8569] font-medium">
                  <span>{pkg.type} Plan</span>
                  <span className="tabular-nums">{pkg.sessions} Sessions</span>
                </div>
                <h3 className="mt-2 font-display text-lg font-bold text-[#123F2D]">
                  {pkg.name}
                </h3>
                <div className="mt-2 font-display text-2xl font-bold tabular-nums text-[#252823]">
                  {formatRupiah(pkg.price)}
                </div>
                <p className="mt-3 text-xs text-[#252823]/70 leading-relaxed">
                  {pkg.description}
                </p>
              </div>

              <button
                type="button"
                disabled={isExpired}
                onClick={() => handlePurchase(pkg)}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-xs font-semibold tracking-wider uppercase hover:bg-[#0B2E21] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Purchase Package</span>
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
