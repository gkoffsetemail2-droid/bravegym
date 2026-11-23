import React, { useMemo, useState } from 'react';
import { CheckCircle2, CreditCard, Upload, X } from 'lucide-react';
import { useBrave } from '../context/BraveContext';
import { PaymentSubmission } from '../types';
import { formatRupiah } from '../utils/dateUtils';

export const PaymentsPage: React.FC = () => {
  const { store, currentUser, setActivePage, submitPaymentProof } = useBrave();

  const [activePayment, setActivePayment] = useState<PaymentSubmission | null>(null);
  const [method, setMethod] = useState('Bank Transfer BCA');
  const [proofFileName, setProofFileName] = useState('');
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | undefined>(undefined);
  const [proofNote, setProofNote] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  if (!currentUser) return null;

  const memberPayments = useMemo(
    () =>
      store.payments
        .filter((p) => p.memberId === currentUser.id)
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [store.payments, currentUser.id]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFileName(file.name);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') setProofPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePayment) return;
    const res = submitPaymentProof(
      activePayment.id,
      method,
      proofFileName || 'manual-transfer-receipt.jpg',
      proofNote,
      proofPreviewUrl
    );
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setActivePayment(null);
      setProofFileName('');
      setProofNote('');
      setProofPreviewUrl(undefined);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6F8569]">
            Simulated Manual Billing
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#123F2D]">
            Payment Center
          </h1>
          <p className="mt-1 text-sm text-[#252823]/70">
            Submit manual transfer receipts for PT package orders and track approval status. Session credits are added once approved by Club Admin.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActivePage('packages')}
          className="px-4 py-2.5 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-xs font-semibold hover:bg-[#0B2E21] cursor-pointer self-start"
        >
          Browse PT Packages
        </button>
      </div>

      {/* Bank Transfer Instructions Card */}
      <section className="rounded-xl border border-[#252823]/10 bg-[#EAE2D5]/55 p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <div className="font-semibold uppercase tracking-wider text-[#6F8569]">
            Bank Transfer (BCA)
          </div>
          <div className="font-mono font-bold text-sm text-[#123F2D] mt-1 tabular-nums">
            778-0192-4410
          </div>
          <div className="text-[#252823]/75 mt-0.5">PT Brave Gym &amp; Fitness Indonesia</div>
        </div>
        <div>
          <div className="font-semibold uppercase tracking-wider text-[#6F8569]">
            Bank Transfer (Mandiri)
          </div>
          <div className="font-mono font-bold text-sm text-[#123F2D] mt-1 tabular-nums">
            131-0098-2214-01
          </div>
          <div className="text-[#252823]/75 mt-0.5">PT Brave Gym &amp; Fitness Indonesia</div>
        </div>
        <div>
          <div className="font-semibold uppercase tracking-wider text-[#6F8569]">
            Verification Flow (Prototype)
          </div>
          <div className="text-[#252823]/80 mt-1">
            After uploading proof, switch to Admin Mode (<span className="font-mono">BRV-ADMIN-001</span>) to test approving your payment and issuing PT credits.
          </div>
        </div>
      </section>

      {feedback && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm flex items-center gap-2 ${
            feedback.ok
              ? 'border-[#123F2D]/25 bg-[#EAE2D5]/60 text-[#123F2D]'
              : 'border-[#9E2A2B]/30 bg-[#FCEEEE] text-[#7A1E1F]'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Payment Orders Table */}
      <section className="rounded-xl border border-[#252823]/10 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-[#252823]/10 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-[#123F2D]">
            Your PT Package Orders &amp; Payment History
          </h2>
        </div>

        {memberPayments.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm text-[#252823]/70">No PT package orders yet.</p>
            <button
              type="button"
              onClick={() => setActivePage('packages')}
              className="px-4 py-2 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-xs font-semibold cursor-pointer"
            >
              View PT Packages
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#252823]/10">
            {memberPayments.map((pay) => (
              <div
                key={pay.id}
                className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono text-[#252823]/60">{pay.id}</span>
                    <span>·</span>
                    <span className="text-[#6F8569] font-medium">{pay.trainerTierLabel}</span>
                    <span>·</span>
                    <span className="tabular-nums text-[#252823]/65">
                      {new Date(pay.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="font-display text-lg font-bold text-[#123F2D]">
                    {pay.packageName} — {formatRupiah(pay.amount)}
                  </div>
                  <div className="text-xs text-[#252823]/75">
                    Method: {pay.method}
                    {pay.proofFileName ? ` · Proof: ${pay.proofFileName}` : ''}
                    {pay.proofNote ? ` · Note: ${pay.proofNote}` : ''}
                  </div>
                  {pay.adminNote && (
                    <div className="text-xs text-[#123F2D] font-medium">
                      Club Note: {pay.adminNote}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-[#252823]/55">
                      Payment Status
                    </div>
                    <div
                      className={`text-xs font-bold ${
                        pay.status === 'Approved'
                          ? 'text-[#123F2D]'
                          : pay.status === 'Rejected'
                          ? 'text-[#9E2A2B]'
                          : 'text-[#9A671F]'
                      }`}
                    >
                      {pay.status}
                    </div>
                  </div>

                  {(pay.status === 'Awaiting Payment' || pay.status === 'Rejected') && (
                    <button
                      type="button"
                      onClick={() => {
                        setActivePayment(pay);
                        setMethod(pay.method || 'Bank Transfer BCA');
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-xs font-semibold hover:bg-[#0B2E21] cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Submit Payment Proof</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Proof Upload Modal */}
      {activePayment && (
        <div
          className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#F8F7F3] rounded-xl border border-[#252823]/15 max-w-md w-full overflow-hidden shadow-xl">
            <div className="px-6 py-4 bg-[#123F2D] text-[#F8F7F3] flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-[#EAE2D5]/80">
                  Manual Payment Submission
                </div>
                <h3 className="font-display text-base font-bold">
                  {activePayment.packageName} · {formatRupiah(activePayment.amount)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePayment(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProof} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6F8569] mb-1.5">
                  Payment Method
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full rounded-lg border border-[#252823]/15 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="Bank Transfer BCA">Bank Transfer BCA</option>
                  <option value="Bank Transfer Mandiri">Bank Transfer Mandiri</option>
                  <option value="QRIS Brave Club Desk">QRIS Brave Club Desk</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6F8569] mb-1.5">
                  Upload Transfer Receipt (Image / PDF)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="w-full text-xs text-[#252823] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[#123F2D] file:text-white file:text-xs file:font-semibold cursor-pointer"
                />
                {proofFileName && (
                  <div className="mt-1.5 text-xs text-[#123F2D] font-medium">
                    Attached: {proofFileName}
                  </div>
                )}
                {proofPreviewUrl && (
                  <img
                    src={proofPreviewUrl}
                    alt="Uploaded payment proof preview"
                    className="mt-2 max-h-36 rounded-lg border border-[#252823]/10 object-contain bg-white p-1"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6F8569] mb-1.5">
                  Reference / Sender Name Note
                </label>
                <input
                  type="text"
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  placeholder="e.g., Transferred from BCA a/n Azka N."
                  className="w-full rounded-lg border border-[#252823]/15 bg-white px-3 py-2.5 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#252823]/10">
                <button
                  type="button"
                  onClick={() => setActivePayment(null)}
                  className="px-4 py-2 rounded-lg border border-[#252823]/15 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#123F2D] text-[#F8F7F3] text-xs font-semibold hover:bg-[#0B2E21] cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Submit Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
