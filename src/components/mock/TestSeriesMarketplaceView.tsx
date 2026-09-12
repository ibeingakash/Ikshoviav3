import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Eye,
  FileCheck2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Tag,
  Lock,
  Unlock,
  AlertCircle,
  Play,
  RotateCcw,
  BarChart3,
  Calendar,
  X,
  CreditCard,
  ExternalLink,
  Award,
  BookOpen,
  Filter,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { TestSeries, TestSeriesWithTests, TestSeriesTest } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { useLearner } from '../../context/LearnerContext.js';

interface TestSeriesMarketplaceViewProps {
  onStartMockTest?: (mockTestId: string) => void;
  initialSeriesId?: string;
}

export const TestSeriesMarketplaceView: React.FC<TestSeriesMarketplaceViewProps> = ({
  onStartMockTest,
  initialSeriesId,
}) => {
  const { user } = useAuth();
  const { setActiveSection } = useLearner();

  // Mode: 'CATALOG' | 'DETAIL'
  const [viewMode, setViewMode] = useState<'CATALOG' | 'DETAIL'>(initialSeriesId ? 'DETAIL' : 'CATALOG');
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(initialSeriesId || null);

  // Catalog State
  const [seriesList, setSeriesList] = useState<TestSeries[]>([]);
  const [examsSummary, setExamsSummary] = useState<{ code: string; name: string; seriesCount: number }[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [selectedExamTab, setSelectedExamTab] = useState<string>('ALL');
  const [pricingFilter, setPricingFilter] = useState<'ALL' | 'FREE' | 'PAID'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Detail State
  const [detailSeries, setDetailSeries] = useState<TestSeriesWithTests | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Gateway Config state
  const [gatewayConfig, setGatewayConfig] = useState<{
    provider: string;
    isConfigured: boolean;
    mode: 'TEST' | 'LIVE' | 'NOT_CONFIGURED';
    keyId: string | null;
  } | null>(null);

  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState<boolean>(false);

  // Coupon State
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    name?: string;
    discountAmount: number;
    finalAmount: number;
  } | null>(null);

  // Load Catalog Data
  const loadCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const [listRes, summaryRes, configRes] = await Promise.all([
        api.getTestSeriesList({
          exam: selectedExamTab !== 'ALL' ? selectedExamTab : undefined,
          isFree: pricingFilter === 'FREE' ? true : pricingFilter === 'PAID' ? false : undefined,
          category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
          search: searchQuery.trim() || undefined,
          limit: 30,
        }),
        api.getTestSeriesExamsSummary(),
        api.getPaymentConfig(),
      ]);

      setSeriesList(listRes.series || []);
      setExamsSummary(summaryRes || []);
      setGatewayConfig(configRes);
    } catch (err) {
      console.error('Failed to load test series catalog:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, [selectedExamTab, pricingFilter, categoryFilter]);

  // Load Series Detail
  const loadSeriesDetail = async (idOrSlug: string) => {
    setLoadingDetail(true);
    try {
      const detail = await api.getTestSeriesDetail(idOrSlug);
      setDetailSeries(detail);
      setViewMode('DETAIL');
      setSelectedSeriesId(detail?.id || idOrSlug);
    } catch (err) {
      console.error('Failed to load test series details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (initialSeriesId) {
      loadSeriesDetail(initialSeriesId);
    }
  }, [initialSeriesId]);

  // Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCatalog();
  };

  // Open Series Detail
  const handleOpenDetail = (series: TestSeries) => {
    loadSeriesDetail(series.slug || series.id);
  };

  // Free 1-Click Enrollment
  const handleFreeEnroll = async (seriesId: string) => {
    try {
      setLoadingDetail(true);
      await api.enrollFreeTestSeries(seriesId);
      await loadSeriesDetail(seriesId);
      // Also update in list
      setSeriesList(prev =>
        prev.map(s => (s.id === seriesId ? { ...s, isEnrolled: true } : s))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to enroll');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Open Checkout Modal for Paid Series
  const handleOpenCheckout = (series: TestSeries) => {
    setSelectedSeriesId(series.id);
    setCheckoutError(null);
    setCheckoutSuccess(false);
    setIsProcessingCheckout(false);
    setCouponCodeInput('');
    setCouponError(null);
    setAppliedCoupon(null);
    setShowCheckoutModal(true);
  };

  // Apply Coupon
  const handleApplyCoupon = async () => {
    if (!detailSeries || !couponCodeInput.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError(null);

    try {
      const res = await api.validateCoupon(couponCodeInput.trim().toUpperCase(), undefined);
      if (!res.isValid) {
        setCouponError(res.error || 'Invalid or expired coupon code');
        setAppliedCoupon(null);
      } else {
        const originalPrice = detailSeries.salePrice;
        let discount = 0;
        if (res.coupon?.discountType === 'PERCENTAGE') {
          discount = Math.round((originalPrice * (res.coupon.discountValue || 0)) / 100);
        } else {
          discount = res.coupon?.discountValue || 0;
        }
        discount = Math.min(discount, originalPrice);
        const finalAmount = Math.max(0, originalPrice - discount);

        setAppliedCoupon({
          code: res.coupon?.code || couponCodeInput.trim().toUpperCase(),
          name: res.coupon?.name,
          discountAmount: discount,
          finalAmount,
        });
        setCouponError(null);
      }
    } catch (err: any) {
      setCouponError(err.message || 'Failed to validate coupon');
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Helper to load Razorpay script on demand
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise(resolve => {
      if ((window as any).Razorpay) {
        return resolve(true);
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Proceed to Checkout
  const handleProceedToCheckout = async () => {
    const targetSeries = detailSeries || seriesList.find(s => s.id === selectedSeriesId);
    if (!targetSeries) return;

    if (!gatewayConfig?.isConfigured) {
      setCheckoutError('Payment gateway is not currently configured. Please contact support.');
      return;
    }

    setIsProcessingCheckout(true);
    setCheckoutError(null);

    try {
      // 1. Ensure Razorpay script is loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Unable to connect to Razorpay secure checkout service.');
      }

      // 2. Create Order on backend (Server calculates canonical price with verified coupon discount)
      const orderData = await api.createTestSeriesPaymentOrder(targetSeries.id, appliedCoupon?.code);

      // 3. Configure Razorpay checkout options
      const options = {
        key: orderData.keyId,
        amount: orderData.amount * 100, // in paise
        currency: orderData.currency || 'INR',
        name: 'IKSHOVIA',
        description: `${targetSeries.name} (${targetSeries.targetExam})`,
        order_id: orderData.providerOrderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#35156B',
        },
        modal: {
          ondismiss: () => {
            setIsProcessingCheckout(false);
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            setIsProcessingCheckout(true);

            // 4. Server-Side Cryptographic Signature Verification
            await api.verifyPayment({
              orderId: orderData.orderId,
              providerPaymentId: response.razorpay_payment_id,
              providerOrderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            });

            // 5. Verification successful: Reload detail & catalog
            setCheckoutSuccess(true);
            setIsProcessingCheckout(false);
            if (detailSeries) {
              await loadSeriesDetail(detailSeries.id);
            }
            loadCatalog();
          } catch (err: any) {
            setCheckoutError(err.message || 'Payment verification failed. Please contact support.');
            setIsProcessingCheckout(false);
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (resp: any) => {
        setCheckoutError(resp.error?.description || 'Payment transaction failed. Please try again.');
        setIsProcessingCheckout(false);
      });
      rzp.open();
    } catch (err: any) {
      setCheckoutError(err.message || 'Failed to initialize payment.');
      setIsProcessingCheckout(false);
    }
  };

  // Launch mock test
  const handleLaunchTest = (mockTestId: string) => {
    if (onStartMockTest) {
      onStartMockTest(mockTestId);
    } else {
      setActiveSection('mock-tests');
    }
  };

  // RENDER: Series Detail View
  if (viewMode === 'DETAIL') {
    if (loadingDetail) {
      return (
        <div className="bg-white rounded-xl p-16 border border-stone-200 text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-stone-700">Loading Test Series Curriculum & Attempts...</p>
        </div>
      );
    }

    if (!detailSeries) {
      return (
        <div className="bg-white rounded-xl p-12 border border-stone-200 text-center space-y-3">
          <Layers className="w-10 h-10 text-stone-400 mx-auto" />
          <h2 className="text-lg font-bold text-stone-800">Test Series Not Found</h2>
          <button
            onClick={() => setViewMode('CATALOG')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold"
          >
            Back to All Test Series
          </button>
        </div>
      );
    }

    const isEnrolled = detailSeries.isEnrolled;
    const canAccessAll = isEnrolled;

    return (
      <div className="space-y-6 pb-20">
        {/* Navigation Breadcrumb */}
        <button
          onClick={() => setViewMode('CATALOG')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Test Series Marketplace
        </button>

        {/* Series Hero Banner */}
        <div className="bg-gradient-to-br from-[#1C0F38] via-[#2A1550] to-[#1F0C3B] rounded-2xl p-6 sm:p-8 text-white shadow-lg border border-purple-900/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {detailSeries.targetExam}
                </span>
                {detailSeries.examCycle && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/90 border border-white/20">
                    {detailSeries.examCycle}
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/90 border border-white/20">
                  {detailSeries.category.replace('_', ' ')}
                </span>
                {detailSeries.language && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/90 border border-white/20">
                    {detailSeries.language}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {detailSeries.name}
              </h1>

              {detailSeries.description && (
                <p className="text-sm text-stone-300 line-clamp-3 leading-relaxed">
                  {detailSeries.description}
                </p>
              )}

              {/* Stats Bar */}
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-stone-300">
                <span className="flex items-center gap-1.5 font-semibold text-white">
                  <FileCheck2 className="w-4 h-4 text-amber-400" />
                  {detailSeries.totalTests || (detailSeries.tests?.length || 0)} Full Tests
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-emerald-300">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  {detailSeries.previewTestCount || 0} Free Preview Tests
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-stone-400" />
                  {detailSeries.durationDays || 180} Days Validity
                </span>
              </div>
            </div>

            {/* Commercial Action Box */}
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-xl border border-white/15 min-w-[260px] self-start lg:self-center text-center space-y-3">
              {isEnrolled ? (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    Enrolled & Active Pass
                  </div>
                  <p className="text-xs text-stone-300">
                    All tests and AI analytics are fully unlocked.
                  </p>
                </div>
              ) : detailSeries.isFree ? (
                <div className="space-y-3">
                  <div>
                    <span className="text-2xl font-extrabold text-emerald-400">FREE</span>
                    <p className="text-xs text-stone-300 mt-0.5">Complimentary Exam Preparation Pack</p>
                  </div>
                  <button
                    onClick={() => handleFreeEnroll(detailSeries.id)}
                    className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg transition-colors shadow-md"
                  >
                    Enroll Now for Free
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-2xl font-extrabold text-white">₹{detailSeries.salePrice}</span>
                      {detailSeries.mrp > detailSeries.salePrice && (
                        <span className="text-stone-400 line-through text-sm">₹{detailSeries.mrp}</span>
                      )}
                    </div>
                    {detailSeries.mrp > detailSeries.salePrice && (
                      <span className="text-[11px] font-semibold text-emerald-400">
                        Save {Math.round(((detailSeries.mrp - detailSeries.salePrice) / detailSeries.mrp) * 100)}%
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleOpenCheckout(detailSeries)}
                    className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-lg transition-colors shadow-md flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Enroll Now • ₹{detailSeries.salePrice}
                  </button>
                  <p className="text-[11px] text-stone-400">
                    Or take the free preview tests below first.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tests Schedule & Syllabus List */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
            <div>
              <h2 className="text-base font-bold text-stone-900">Included Mock Tests & Simulations</h2>
              <p className="text-xs text-stone-500">
                Attempt in exam simulation mode with exact timing, negative marking, and post-test analytics.
              </p>
            </div>
            <span className="text-xs font-semibold text-stone-600">
              {detailSeries.tests?.length || 0} Total Tests
            </span>
          </div>

          <div className="divide-y divide-stone-100">
            {(!detailSeries.tests || detailSeries.tests.length === 0) ? (
              <div className="p-12 text-center text-stone-500 text-xs">
                Tests are being scheduled for this series. Check back shortly.
              </div>
            ) : (
              detailSeries.tests.map((item, index) => {
                const test = item.mockTest;
                const canTake = canAccessAll || item.isFreePreview;
                const attempt = item.attemptSummary;

                return (
                  <div
                    key={item.mockTestId}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/50 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {String(item.sequenceNumber || index + 1).padStart(2, '0')}
                      </span>

                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-stone-900 truncate">
                            {test?.title || `Mock Test #${item.mockTestId.slice(0, 8)}`}
                          </h3>
                          {item.isFreePreview && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                              Free Preview
                            </span>
                          )}
                          {!canTake && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-600 shrink-0 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> Series Pass Required
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500">
                          {test?.type && (
                            <span className="capitalize">{test.type.toLowerCase().replace('_', ' ')}</span>
                          )}
                          <span>{test?.totalQuestions || 150} Questions</span>
                          <span>{test?.durationMinutes || 120} Minutes</span>
                          {test?.totalMarks && <span>{test.totalMarks} Marks</span>}
                        </div>

                        {/* Attempt Summary If Attempted */}
                        {attempt && (
                          <div className="inline-flex items-center gap-2 mt-1 px-2.5 py-1 rounded-md bg-stone-100 text-[11px] font-medium text-stone-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Score: <strong>{attempt.score}</strong></span>
                            <span>•</span>
                            <span>Accuracy: <strong>{attempt.percentage}%</strong></span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="self-end sm:self-center shrink-0">
                      {canTake ? (
                        <button
                          onClick={() => handleLaunchTest(item.mockTestId)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          {attempt ? (
                            <>
                              <RotateCcw className="w-3.5 h-3.5" />
                              Re-attempt Test
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" />
                              Start Test
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenCheckout(detailSeries)}
                          className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                        >
                          <Lock className="w-3.5 h-3.5 text-stone-400" />
                          Unlock with Series Pass
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // RENDER: Catalog Browse Mode
  return (
    <div className="space-y-6 pb-20">
      {/* Marketplace Header */}
      <div className="bg-gradient-to-r from-[#1C0F38] via-[#2D1656] to-[#1E0E38] rounded-2xl p-6 sm:p-8 text-white shadow-md border border-purple-900/30">
        <div className="max-w-2xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-400/20 text-amber-300 rounded-lg border border-amber-400/30">
              <Layers className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Official Simulation Marketplace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Exam-wise Test Series Packs
          </h1>
          <p className="text-sm text-stone-300 leading-relaxed">
            Full syllabus exam packages, sectional drill papers, and rigorous simulated exams designed with official Commission negative-marking standards and AI performance diagnostics.
          </p>
        </div>
      </div>

      {/* Exam Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-stone-200 text-xs font-semibold">
        <button
          onClick={() => setSelectedExamTab('ALL')}
          className={`px-3 py-2 rounded-lg transition-colors shrink-0 ${
            selectedExamTab === 'ALL'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          All Exams ({seriesList.length})
        </button>
        {examsSummary.map(ex => (
          <button
            key={ex.code}
            onClick={() => setSelectedExamTab(ex.code)}
            className={`px-3 py-2 rounded-lg transition-colors shrink-0 flex items-center gap-1.5 ${
              selectedExamTab === ex.code
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <span>{ex.code}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10">
              {ex.seriesCount}
            </span>
          </button>
        ))}
      </div>

      {/* Search and Secondary Filters */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search test series by exam or keyword..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={pricingFilter}
            onChange={e => setPricingFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium"
          >
            <option value="ALL">All Pricing</option>
            <option value="FREE">Free Packs Only</option>
            <option value="PAID">Premium Packs</option>
          </select>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium"
          >
            <option value="ALL">All Stages</option>
            <option value="PRELIMS">Prelims</option>
            <option value="MAINS">Mains</option>
            <option value="FULL_LENGTH">Full Length</option>
            <option value="CHAPTER_WISE">Sectional</option>
          </select>
        </div>
      </div>

      {/* Series Cards Grid */}
      {loadingCatalog ? (
        <div className="bg-white rounded-xl p-16 border border-stone-200 text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-stone-700">Loading Exam Test Series...</p>
        </div>
      ) : seriesList.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-dashed border-stone-300 text-center space-y-2">
          <Layers className="w-10 h-10 text-stone-400 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">No Test Series Found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Try resetting your search query or selecting a different exam tab.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {seriesList.map(series => {
            const isEnrolled = series.isEnrolled;
            return (
              <div
                key={series.id}
                className="bg-white rounded-xl border border-stone-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-stone-100 text-stone-800 border border-stone-200">
                      {series.targetExam}
                    </span>
                    {series.examCycle && (
                      <span className="text-xs font-semibold text-stone-500">
                        {series.examCycle}
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => handleOpenDetail(series)}
                    className="text-base font-bold text-stone-900 hover:text-indigo-600 cursor-pointer line-clamp-2 transition-colors"
                  >
                    {series.name}
                  </h3>

                  {series.description && (
                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                      {series.description}
                    </p>
                  )}

                  {/* Badges & Stats */}
                  <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-3 text-xs text-stone-600">
                    <span className="font-semibold text-stone-900 flex items-center gap-1">
                      <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
                      {series.totalTests || 0} Tests
                    </span>
                    {(series.previewTestCount || 0) > 0 && (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        {series.previewTestCount} Free
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-stone-400">
                      <Clock className="w-3.5 h-3.5" />
                      {series.durationDays || 180}d
                    </span>
                  </div>
                </div>

                {/* Footer Action & Pricing */}
                <div className="p-4 bg-stone-50/70 border-t border-stone-100 flex items-center justify-between gap-3">
                  <div>
                    {isEnrolled ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Enrolled
                      </span>
                    ) : series.isFree ? (
                      <span className="text-sm font-extrabold text-emerald-700">FREE</span>
                    ) : (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold text-stone-900">₹{series.salePrice}</span>
                        {series.mrp > series.salePrice && (
                          <span className="text-xs text-stone-400 line-through">₹{series.mrp}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenDetail(series)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                      isEnrolled
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {isEnrolled ? 'Open Series' : 'View Syllabus'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Checkout Modal for Paid Series */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900">Enroll in Test Series</h3>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {checkoutSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-stone-900">Enrollment Confirmed!</h4>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  Your payment was verified cryptographically. All tests in this series have been unlocked.
                </p>
                <button
                  onClick={() => {
                    setShowCheckoutModal(false);
                    if (selectedSeriesId) loadSeriesDetail(selectedSeriesId);
                  }}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                >
                  Start Practicing Now
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {checkoutError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    {checkoutError}
                  </div>
                )}

                <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                  <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    {detailSeries?.targetExam} Series
                  </div>
                  <div className="text-sm font-bold text-stone-900 mt-0.5">{detailSeries?.name}</div>
                  <div className="text-xs text-stone-500 mt-1">
                    {detailSeries?.totalTests || 0} Tests • {detailSeries?.durationDays || 180} Days Access
                  </div>
                </div>

                {/* Coupon Code Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700">Discount Coupon</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCodeInput}
                      onChange={e => setCouponCodeInput(e.target.value.toUpperCase())}
                      placeholder="ENTER CODE"
                      className="flex-1 px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg uppercase font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isValidatingCoupon || !couponCodeInput.trim()}
                      className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                    >
                      {isValidatingCoupon ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="text-[11px] text-red-600 font-medium">{couponError}</p>}
                  {appliedCoupon && (
                    <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Coupon {appliedCoupon.code} applied! Saved ₹{appliedCoupon.discountAmount}
                    </p>
                  )}
                </div>

                {/* Order Summary */}
                <div className="border-t border-stone-100 pt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Base Price</span>
                    <span>₹{detailSeries?.salePrice || 0}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Discount</span>
                      <span>-₹{appliedCoupon.discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-stone-900 border-t border-stone-200 pt-2">
                    <span>Total Payable</span>
                    <span>₹{appliedCoupon ? appliedCoupon.finalAmount : (detailSeries?.salePrice || 0)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  disabled={isProcessingCheckout}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  {isProcessingCheckout ? 'Opening Checkout...' : `Pay ₹${appliedCoupon ? appliedCoupon.finalAmount : (detailSeries?.salePrice || 0)} Securely`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
