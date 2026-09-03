import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  Eye,
  Key,
  Calendar,
  User,
  BookOpen,
  DollarSign,
  Receipt,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '../../lib/api.js';

interface AdminPaymentItem {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseName: string;
  courseExam: string;
  provider: string;
  providerPaymentId?: string;
  providerOrderId?: string;
  amount: number;
  currency: string;
  status: 'PAID' | 'FAILED' | 'REFUNDED' | 'PENDING' | 'CREATED';
  method?: string;
  verifiedAt?: string;
  createdAt: string;
  entitlementId?: string;
  entitlementStatus?: string;
  entitlementExpiresAt?: string;
}

interface PaymentMetrics {
  totalRevenue: number;
  paidCount: number;
  pendingCount: number;
  refundedCount: number;
  failedCount: number;
}

interface GatewayStatus {
  provider: string;
  isConfigured: boolean;
  mode: 'TEST' | 'LIVE' | 'NOT_CONFIGURED';
  keyId: string | null;
  webhookConfigured: boolean;
}

export const AdminPaymentsView: React.FC = () => {
  const [payments, setPayments] = useState<AdminPaymentItem[]>([]);
  const [metrics, setMetrics] = useState<PaymentMetrics | null>(null);
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [coursesList, setCoursesList] = useState<{ id: string; name: string }[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Selected item for details modal
  const [selectedPayment, setSelectedPayment] = useState<AdminPaymentItem | null>(null);

  // Refund Modal State
  const [refundTarget, setRefundTarget] = useState<AdminPaymentItem | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundSuccessMsg, setRefundSuccessMsg] = useState<string | null>(null);

  // Copied indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchPaymentsData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.getAdminPayments({
        status: statusFilter,
        courseId: courseFilter,
        search: searchQuery,
      });

      setPayments(res.items || []);
      setMetrics(res.metrics || null);
      setGatewayStatus(res.gatewayStatus || null);

      // Extract unique courses
      const uniqueCourses = Array.from(
        new Map(
          (res.items || []).map(item => [item.courseId, { id: item.courseId, name: item.courseName }])
        ).values()
      );
      if (uniqueCourses.length > 0) {
        setCoursesList(uniqueCourses);
      }
    } catch (err: any) {
      console.warn('Could not load admin payments:', err);
      setLoadError(err?.message || 'Failed to fetch admin payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsData();
  }, [statusFilter, courseFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPaymentsData();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(label);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenRefundModal = (payment: AdminPaymentItem) => {
    setRefundTarget(payment);
    setRefundReason('Learner cancellation request');
    setRefundError(null);
    setRefundSuccessMsg(null);
  };

  const handleExecuteRefund = async () => {
    if (!refundTarget) return;

    setIsProcessingRefund(true);
    setRefundError(null);

    try {
      const res = await api.refundPayment(refundTarget.id, refundReason);
      setRefundSuccessMsg(res.message || 'Refund successfully processed and access revoked.');
      setTimeout(() => {
        setRefundTarget(null);
        setRefundSuccessMsg(null);
        fetchPaymentsData();
      }, 1500);
    } catch (err: any) {
      setRefundError(err.message || 'Failed to process refund');
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            PAID
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-full">
            <RotateCcw className="w-3 h-3 text-purple-600" />
            REFUNDED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-full">
            <XCircle className="w-3 h-3 text-rose-600" />
            FAILED
          </span>
        );
      case 'PENDING':
      case 'CREATED':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
            <Clock className="w-3 h-3 text-amber-600" />
            PENDING
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-6xl mx-auto font-sans-editorial">
      {/* Header & Gateway Operational Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-serif-editorial font-bold text-[#111426] flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-[#35156B]" />
              <span>Payments & Revenue Operations</span>
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-0.5 font-medium">
            Manage Razorpay payment orders, verified transactions, financial telemetry, and access revocations.
          </p>
        </div>

        {/* Gateway Status Badge */}
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          {gatewayStatus?.isConfigured ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-mono font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                RAZORPAY: {gatewayStatus.mode} MODE
              </span>
              {gatewayStatus.keyId && (
                <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                  {gatewayStatus.keyId.slice(0, 10)}...
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-mono font-bold text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>GATEWAY NOT CONFIGURED</span>
            </div>
          )}

          <button
            onClick={fetchPaymentsData}
            disabled={loading}
            className="px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200/90 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#35156B] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Banner if fetch failed */}
      {loadError && (
        <div className="p-4 bg-rose-50/90 border border-rose-300/80 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="text-xs text-rose-900">
              <span className="font-bold">Unable to load payment records: </span>
              <span>{loadError}</span>
            </div>
          </div>
          <button
            onClick={fetchPaymentsData}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Gateway Configuration Warning if not configured */}
      {gatewayStatus && !gatewayStatus.isConfigured && (
        <div className="p-4 bg-amber-50/90 border border-amber-300/80 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <div className="font-bold">Payment Gateway Credentials Required</div>
            <p className="leading-relaxed">
              Razorpay API credentials (<code className="bg-amber-100 px-1 rounded">RAZORPAY_KEY_ID</code> and{' '}
              <code className="bg-amber-100 px-1 rounded">RAZORPAY_KEY_SECRET</code>) are not configured in your
              environment. Checkout orders are safely prevented until credentials are set, protecting both the platform
              and learner entitlements.
            </p>
          </div>
        </div>
      )}

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500 font-bold uppercase font-mono">
            <span>Total Verified Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif-editorial font-bold text-stone-900 mt-1.5">
            ₹{(metrics?.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            {metrics?.paidCount || 0} Successful Transactions
          </div>
        </div>

        {/* Paid Count */}
        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500 font-bold uppercase font-mono">
            <span>Verified Enrollments</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif-editorial font-bold text-emerald-700 mt-1.5">
            {metrics?.paidCount || 0}
          </div>
          <div className="text-[11px] text-stone-500 font-medium mt-1">
            Active course entitlements granted
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500 font-bold uppercase font-mono">
            <span>Pending Checkouts</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-serif-editorial font-bold text-amber-700 mt-1.5">
            {metrics?.pendingCount || 0}
          </div>
          <div className="text-[11px] text-stone-500 font-medium mt-1">
            Orders awaiting provider callback
          </div>
        </div>

        {/* Refunded Count */}
        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500 font-bold uppercase font-mono">
            <span>Refunded Orders</span>
            <RotateCcw className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-serif-editorial font-bold text-purple-800 mt-1.5">
            {metrics?.refundedCount || 0}
          </div>
          <div className="text-[11px] text-stone-500 font-medium mt-1">
            Access automatically revoked
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200/90 p-4 rounded-2xl shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by learner name, email, payment ID, or order ID..."
            className="w-full pl-9 pr-4 py-2 bg-[#FCFBF9] border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-[#35156B] transition-colors"
          />
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#FCFBF9] border border-stone-200 rounded-xl text-xs font-bold text-stone-700 cursor-pointer focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">PAID (Verified)</option>
            <option value="PENDING">PENDING</option>
            <option value="REFUNDED">REFUNDED</option>
            <option value="FAILED">FAILED</option>
          </select>

          {coursesList.length > 0 && (
            <select
              value={courseFilter}
              onChange={e => setCourseFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#FCFBF9] border border-stone-200 rounded-xl text-xs font-bold text-stone-700 cursor-pointer focus:outline-hidden max-w-[180px] truncate"
            >
              <option value="ALL">All Courses</option>
              {coursesList.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-stone-200/90 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-stone-200 text-stone-500 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Transaction / Order</th>
                <th className="py-3 px-4">Learner</th>
                <th className="py-3 px-4">Course Program</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Entitlement Access</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#35156B]" />
                    <span>Loading payment transactions...</span>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-500">
                    <Receipt className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="font-bold text-sm text-stone-700">No payment transactions found</p>
                    <p className="text-xs text-stone-400 mt-1">
                      {searchQuery || statusFilter !== 'ALL'
                        ? 'Try adjusting your filter or search query.'
                        : 'New enrollments and orders will appear here automatically.'}
                    </p>
                  </td>
                </tr>
              ) : (
                payments.map(p => {
                  return (
                    <tr key={p.id} className="hover:bg-stone-50/80 transition-colors">
                      {/* Transaction IDs */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] font-bold text-stone-800 flex items-center gap-1">
                          <span>{p.id}</span>
                          <button
                            onClick={() => copyToClipboard(p.id, p.id)}
                            className="text-stone-400 hover:text-stone-700 cursor-pointer"
                            title="Copy Payment ID"
                          >
                            {copiedId === p.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <div className="font-mono text-[10px] text-stone-400 mt-0.5">
                          Order: {p.orderId}
                        </div>
                        {p.providerPaymentId && (
                          <div className="font-mono text-[9px] text-stone-500 mt-0.5">
                            Gateway: {p.providerPaymentId}
                          </div>
                        )}
                      </td>

                      {/* Learner */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-stone-900">{p.userName}</div>
                        <div className="text-[11px] text-stone-500 truncate max-w-[160px]">{p.userEmail}</div>
                      </td>

                      {/* Course */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-stone-800 truncate max-w-[200px]" title={p.courseName}>
                          {p.courseName}
                        </div>
                        <span className="inline-block mt-0.5 text-[9px] font-mono font-bold bg-stone-100 text-stone-700 px-1.5 py-0.2 rounded">
                          {p.courseExam}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">{getStatusBadge(p.status)}</td>

                      {/* Linked Entitlement Access */}
                      <td className="py-3 px-4">
                        {p.status === 'PAID' ? (
                          p.entitlementStatus === 'ACTIVE' ? (
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <Key className="w-2.5 h-2.5" />
                                ACTIVE
                              </span>
                              {p.entitlementExpiresAt && (
                                <div className="text-[10px] text-stone-400 font-mono">
                                  Until {new Date(p.entitlementExpiresAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                              EXPIRED / INACTIVE
                            </span>
                          )
                        ) : p.status === 'REFUNDED' ? (
                          <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <RotateCcw className="w-2.5 h-2.5" />
                            REVOKED
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-stone-400">NO ACCESS</span>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 text-stone-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString()}{' '}
                        <span className="text-[10px] text-stone-400">
                          {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Details</span>
                        </button>

                        {p.status === 'PAID' && (
                          <button
                            onClick={() => handleOpenRefundModal(p)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Refund</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TRANSACTION DETAILS MODAL */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold bg-[#35156B] text-amber-300 px-2 py-0.5 rounded-full">
                  PAYMENT RECORD
                </span>
                <h2 className="text-lg font-serif-editorial font-bold text-stone-900 mt-1">
                  Transaction #{selectedPayment.id}
                </h2>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#FAF8F5] rounded-xl border border-stone-200/80">
                <div>
                  <span className="text-[10px] uppercase font-mono text-stone-400 font-bold block">Status</span>
                  <div className="mt-0.5">{getStatusBadge(selectedPayment.status)}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-stone-400 font-bold block">Payable Amount</span>
                  <span className="font-mono text-base font-bold text-stone-900">
                    ₹{selectedPayment.amount.toLocaleString('en-IN')} {selectedPayment.currency}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-stone-400 font-bold block">Gateway Provider</span>
                  <span className="font-mono font-bold text-stone-800">{selectedPayment.provider}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-stone-400 font-bold block">Payment Method</span>
                  <span className="font-mono text-stone-700">{selectedPayment.method || 'Online Checkout'}</span>
                </div>
              </div>

              {/* Technical IDs */}
              <div className="space-y-2 p-3 bg-stone-900 text-stone-300 rounded-xl font-mono text-[11px]">
                <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
                  <span className="text-stone-400">Internal Order ID:</span>
                  <span className="text-amber-300">{selectedPayment.orderId}</span>
                </div>
                {selectedPayment.providerOrderId && (
                  <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
                    <span className="text-stone-400">Gateway Order ID:</span>
                    <span>{selectedPayment.providerOrderId}</span>
                  </div>
                )}
                {selectedPayment.providerPaymentId && (
                  <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
                    <span className="text-stone-400">Gateway Payment ID:</span>
                    <span className="text-emerald-400">{selectedPayment.providerPaymentId}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Verified Timestamp:</span>
                  <span>{selectedPayment.verifiedAt ? new Date(selectedPayment.verifiedAt).toLocaleString() : 'N/A'}</span>
                </div>
              </div>

              {/* Learner & Course */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-white border border-stone-200 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase font-mono text-stone-400 font-bold block">Learner</span>
                  <div className="font-bold text-stone-900">{selectedPayment.userName}</div>
                  <div className="text-[11px] text-stone-500">{selectedPayment.userEmail}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-stone-400 font-bold block">Course Enrolled</span>
                  <div className="font-bold text-stone-900">{selectedPayment.courseName}</div>
                  <div className="text-[11px] text-stone-500">{selectedPayment.courseExam} Program</div>
                </div>
              </div>

              {/* Linked Entitlement */}
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start gap-2.5">
                <Key className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed text-emerald-950">
                  <span className="font-bold">Course Access Entitlement: </span>
                  {selectedPayment.status === 'PAID' ? (
                    <span>
                      Access active until{' '}
                      <span className="font-mono font-bold">
                        {selectedPayment.entitlementExpiresAt
                          ? new Date(selectedPayment.entitlementExpiresAt).toLocaleDateString()
                          : 'Lifetime'}
                      </span>
                      . Features and mocks are completely unlocked for this learner.
                    </span>
                  ) : selectedPayment.status === 'REFUNDED' ? (
                    <span className="text-purple-900 font-bold">
                      Access revoked automatically upon refund completion.
                    </span>
                  ) : (
                    <span className="text-stone-600">
                      Access is withheld until cryptographic payment verification completes.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-stone-100 pt-3 flex justify-end">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REFUND CONFIRMATION MODAL */}
      {refundTarget && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-600" />
                <h2 className="text-lg font-serif-editorial font-bold text-stone-900">
                  Confirm Payment Refund
                </h2>
              </div>
              <button
                onClick={() => setRefundTarget(null)}
                disabled={isProcessingRefund}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-stone-600">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Irreversible Gateway & Entitlement Action
                </div>
                <p className="leading-relaxed text-[11px]">
                  Executing this refund will immediately call the Razorpay refund API for{' '}
                  <span className="font-mono font-bold">₹{refundTarget.amount.toLocaleString('en-IN')}</span> and
                  revoke the learner's active course entitlement and question bank access.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-400">Learner:</span>
                  <span className="font-bold text-stone-800">{refundTarget.userName} ({refundTarget.userEmail})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Course:</span>
                  <span className="font-bold text-stone-800">{refundTarget.courseName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Gateway Payment ID:</span>
                  <span className="font-mono text-stone-700">{refundTarget.providerPaymentId}</span>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-mono uppercase text-stone-500 font-bold block">
                  Refund Reason (Audit Log)
                </label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  placeholder="e.g., Learner withdrawal request within trial period"
                  className="w-full px-3 py-2 bg-[#FCFBF9] border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-hidden focus:border-rose-500"
                />
              </div>

              {refundError && (
                <div className="p-2.5 bg-rose-100 text-rose-900 border border-rose-300 rounded-xl text-[11px]">
                  {refundError}
                </div>
              )}

              {refundSuccessMsg && (
                <div className="p-2.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-[11px] font-bold">
                  {refundSuccessMsg}
                </div>
              )}
            </div>

            <div className="border-t border-stone-100 pt-3 flex items-center justify-between gap-3">
              <button
                onClick={() => setRefundTarget(null)}
                disabled={isProcessingRefund}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleExecuteRefund}
                disabled={isProcessingRefund}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isProcessingRefund ? 'animate-spin' : ''}`} />
                <span>{isProcessingRefund ? 'Processing Refund...' : 'Confirm & Revoke Access'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
