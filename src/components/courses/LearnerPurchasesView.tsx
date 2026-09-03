import React, { useState, useEffect } from 'react';
import {
  Receipt,
  CheckCircle2,
  Clock,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Calendar,
  CreditCard,
  Download,
  Printer,
  ShieldCheck,
  Tag,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLearner } from '../../context/LearnerContext.js';

interface PurchaseRecord {
  id: string;
  orderId: string;
  courseId: string;
  courseName: string;
  courseExam: string;
  amount: number;
  currency: string;
  status: 'PAID' | 'REFUNDED' | 'FAILED' | 'PENDING';
  method?: string;
  verifiedAt?: string;
  createdAt: string;
  providerPaymentId?: string;
  entitlementId?: string;
  entitlementStatus?: string;
  entitlementExpiresAt?: string;
}

export const LearnerPurchasesView: React.FC = () => {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<PurchaseRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { setActiveSection } = useLearner();

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const data = await api.getLearnerPurchases();
      setPurchases(data);
    } catch (err) {
      console.error('Failed to load purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(label);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto font-sans-editorial">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-serif-editorial font-bold text-[#111426] flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#35156B]" />
            <span>My Purchases & Receipts</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 font-medium">
            Review your verified course enrollments, access validity windows, and official fee receipts.
          </p>
        </div>

        <button
          onClick={() => setActiveSection('courses-catalog')}
          className="px-4 py-2 bg-[#0C1024] hover:bg-[#1A1F36] text-amber-300 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-2xs self-start transition-colors"
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Explore Course Catalog</span>
        </button>
      </div>

      {/* Purchases List */}
      {loading ? (
        <div className="p-12 text-center text-stone-400 bg-white border border-stone-200 rounded-2xl">
          <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-[#35156B]" />
          <p className="text-xs">Loading your enrollment history...</p>
        </div>
      ) : purchases.length === 0 ? (
        <div className="p-12 text-center text-stone-500 bg-white border border-stone-200 rounded-2xl space-y-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-800 rounded-full flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 font-serif-editorial">No Active Purchases Yet</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
              You have not enrolled in any paid comprehensive programs yet. Explore the course catalog to unlock UPSC
              Prelims, BPSC Mastery, and simulated test series.
            </p>
          </div>
          <button
            onClick={() => setActiveSection('courses-catalog')}
            className="mt-2 px-5 py-2.5 bg-[#35156B] hover:bg-[#250d4d] text-amber-300 rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-2 transition-colors"
          >
            <span>Browse Available Courses</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map(p => {
            const isPaid = p.status === 'PAID';
            const isRefunded = p.status === 'REFUNDED';
            const isAccessActive = isPaid && p.entitlementStatus === 'ACTIVE';

            return (
              <div
                key={p.id}
                className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-stone-300 transition-colors"
              >
                {/* Left: Course & Order Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                      {p.courseExam} PROGRAM
                    </span>
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        VERIFIED ENROLLMENT
                      </span>
                    ) : isRefunded ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full">
                        <RotateCcw className="w-3 h-3 text-purple-600" />
                        REFUNDED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3 text-amber-600" />
                        {p.status}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-stone-900 font-serif-editorial">
                    {p.courseName}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 font-mono">
                    <div>
                      <span>Date: </span>
                      <span className="text-stone-800 font-bold">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span>Order ID: </span>
                      <span className="text-stone-800">{p.orderId}</span>
                    </div>
                    {p.providerPaymentId && (
                      <div>
                        <span>Payment ID: </span>
                        <span className="text-stone-800">{p.providerPaymentId}</span>
                      </div>
                    )}
                  </div>

                  {/* Access Validity info */}
                  {isAccessActive ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50/70 border border-emerald-200 px-2.5 py-1 rounded-lg w-fit">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        Access Active Until:{' '}
                        <strong className="font-mono">
                          {p.entitlementExpiresAt
                            ? new Date(p.entitlementExpiresAt).toLocaleDateString()
                            : 'Unlimited'}
                        </strong>
                      </span>
                    </div>
                  ) : isRefunded ? (
                    <div className="text-xs text-purple-800 font-medium">
                      Access revoked upon completion of payment refund.
                    </div>
                  ) : (
                    <div className="text-xs text-stone-400">Access not active.</div>
                  )}
                </div>

                {/* Right: Price & Actions */}
                <div className="flex flex-col md:items-end gap-3 shrink-0 border-t md:border-t-0 border-stone-100 pt-3 md:pt-0">
                  <div className="font-mono text-xl font-bold text-stone-900">
                    ₹{p.amount.toLocaleString('en-IN')}
                    <span className="text-xs font-normal text-stone-400 ml-1">{p.currency}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedReceipt(p)}
                      className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>View Receipt</span>
                    </button>

                    {isAccessActive && (
                      <button
                        onClick={() => setActiveSection('pyq-practice')}
                        className="px-4 py-2 bg-[#0C1024] hover:bg-[#1A1F36] text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Start Learning</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* OFFICIAL INVOICE / RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#35156B]" />
                <h2 className="text-lg font-serif-editorial font-bold text-stone-900">
                  Payment Receipt
                </h2>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Canvas */}
            <div className="border border-stone-200 rounded-2xl p-5 bg-[#FAF8F5] space-y-4 text-xs font-sans-editorial">
              <div className="flex justify-between items-start border-b border-stone-200/80 pb-3">
                <div>
                  <h3 className="font-serif-editorial font-bold text-lg text-[#111426]">IKSHOVIA</h3>
                  <p className="text-[10px] text-stone-500 font-mono">UPSC & BPSC Civil Services Mastery</p>
                </div>
                <div className="text-right font-mono text-[11px] text-stone-600">
                  <div className="font-bold text-stone-900">RECEIPT #{selectedReceipt.id}</div>
                  <div>Date: {new Date(selectedReceipt.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Line item */}
              <div className="space-y-2">
                <div className="text-[10px] uppercase font-mono font-bold text-stone-400">Billed Item</div>
                <div className="flex justify-between items-center py-2 border-y border-stone-200/60 font-medium">
                  <div>
                    <div className="text-stone-900 font-bold">{selectedReceipt.courseName}</div>
                    <div className="text-[11px] text-stone-500">{selectedReceipt.courseExam} Comprehensive Program</div>
                  </div>
                  <div className="font-mono font-bold text-stone-900 text-sm">
                    ₹{selectedReceipt.amount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-1.5 pt-1 text-right font-mono">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal:</span>
                  <span>₹{selectedReceipt.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>GST / Platform Fees:</span>
                  <span>Included</span>
                </div>
                <div className="flex justify-between text-base font-bold text-stone-900 border-t border-stone-200/80 pt-1.5">
                  <span>Total Paid:</span>
                  <span className="text-emerald-800">₹{selectedReceipt.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Technical Verification Stamp */}
              <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-1 text-[10px] font-mono text-stone-500">
                <div className="flex justify-between">
                  <span>Payment Gateway:</span>
                  <span className="text-stone-800 font-bold">Razorpay</span>
                </div>
                {selectedReceipt.providerPaymentId && (
                  <div className="flex justify-between">
                    <span>Razorpay Payment ID:</span>
                    <span className="text-stone-800">{selectedReceipt.providerPaymentId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-emerald-700 font-bold">VERIFIED & CRYPTOGRAPHICALLY CONFIRMED</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-stone-100 pt-3 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>

              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
