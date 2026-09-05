import React, { useState, useEffect } from 'react';
import {
  Package,
  CheckCircle2,
  Tag,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  FolderArchive,
  FileCheck2,
  Bot,
  BookOpen,
  Newspaper,
  FileText,
  Calendar,
  BarChart3,
  Bookmark,
  X,
  CreditCard,
  Lock,
  ExternalLink,
  AlertTriangle,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { Course, Entitlement, PlatformFeatureCode } from '../../types/index.js';
import { useLearner } from '../../context/LearnerContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { LearnerPurchasesView } from './LearnerPurchasesView.js';

interface CourseCatalogViewProps {
  initialTab?: 'catalog' | 'purchases';
}

export const CourseCatalogView: React.FC<CourseCatalogViewProps> = ({ initialTab = 'catalog' }) => {
  const { user } = useAuth();
  const { setActiveSection } = useLearner();
  const [activeTab, setActiveTab] = useState<'catalog' | 'purchases'>(initialTab);
  const [courses, setCourses] = useState<Course[]>([]);
  const [myEntitlements, setMyEntitlements] = useState<Entitlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Gateway Config state
  const [gatewayConfig, setGatewayConfig] = useState<{
    provider: string;
    isConfigured: boolean;
    mode: 'TEST' | 'LIVE' | 'NOT_CONFIGURED';
    keyId: string | null;
  } | null>(null);

  // Checkout Progress State
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccessData, setCheckoutSuccessData] = useState<{
    paymentId: string;
    courseName: string;
    expiresAt?: string;
  } | null>(null);

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

  const featureIconMap: Record<PlatformFeatureCode, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
    PYQ_PRACTICE: { label: 'PYQ Practice', icon: FolderArchive },
    MOCK_TESTS: { label: 'Mock Test Simulator', icon: FileCheck2 },
    TOPIC_SUBJECT_PRACTICE: { label: 'Topic & Subject Practice', icon: BookOpen },
    CURRENT_AFFAIRS: { label: 'Current Affairs Studio', icon: Newspaper },
    NOTES: { label: 'Notes & Syllabus', icon: FileText },
    AI_TUTOR: { label: 'AI Mentor & Socratic Tutor', icon: Bot },
    STUDY_PLAN: { label: 'Study Planner', icon: Calendar },
    ANALYTICS: { label: 'Performance Analytics', icon: BarChart3 },
    BOOKMARKS: { label: 'Bookmarks & Errors', icon: Bookmark },
    RESOURCE_LIBRARY: { label: 'Resource Library', icon: Layers },
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [catalog, ents, config] = await Promise.all([
        api.getCourseCatalog(),
        user ? api.getLearnerEntitlements() : Promise.resolve([]),
        api.getPaymentConfig(),
      ]);
      setCourses(catalog);
      setMyEntitlements(ents);
      setGatewayConfig(config);
    } catch (err) {
      console.error('Failed to load courses or entitlements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleOpenCheckout = (course: Course) => {
    setSelectedCourse(course);
    setCheckoutError(null);
    setCheckoutSuccessData(null);
    setIsProcessingCheckout(false);
    setCouponCodeInput('');
    setCouponError(null);
    setAppliedCoupon(null);
    setShowCheckoutModal(true);
  };

  const handleApplyCoupon = async () => {
    if (!selectedCourse || !couponCodeInput.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError(null);

    try {
      const res = await api.validateCoupon(couponCodeInput.trim().toUpperCase(), selectedCourse.id);
      if (!res.isValid) {
        setCouponError(res.error || 'Invalid or expired coupon code');
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({
          code: res.coupon?.code || couponCodeInput.trim().toUpperCase(),
          name: res.coupon?.name,
          discountAmount: res.discountAmount,
          finalAmount: res.finalAmount,
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

  const handleRemoveCoupon = () => {
    setCouponCodeInput('');
    setAppliedCoupon(null);
    setCouponError(null);
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

  const handleProceedToCheckout = async () => {
    if (!selectedCourse) return;

    if (!gatewayConfig?.isConfigured) {
      setCheckoutError('Payment gateway is not configured. Please contact the administrator.');
      return;
    }

    setIsProcessingCheckout(true);
    setCheckoutError(null);

    try {
      // 1. Ensure Razorpay script is loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Unable to connect to Razorpay secure checkout service. Please check your connection.');
      }

      // 2. Create Order on backend (Server calculates canonical price with verified coupon discount)
      const orderData = await api.createPaymentOrder(selectedCourse.id, appliedCoupon?.code);

      // 3. Configure Razorpay checkout options
      const options = {
        key: orderData.keyId,
        amount: orderData.amount * 100, // in paise
        currency: orderData.currency || 'INR',
        name: 'IKSHOVIA',
        description: `${orderData.course.name} (${orderData.course.exam})`,
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
            const verifyResult = await api.verifyPayment({
              orderId: orderData.orderId,
              providerPaymentId: response.razorpay_payment_id,
              providerOrderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            });

            // 5. Verification successful: Grant Entitlement on UI
            setCheckoutSuccessData({
              paymentId: verifyResult.paymentId,
              courseName: verifyResult.courseName || selectedCourse.name,
              expiresAt: verifyResult.expiresAt,
            });

            // Refresh entitlements in background
            const freshEnts = await api.getLearnerEntitlements();
            setMyEntitlements(freshEnts);
          } catch (verifyErr: any) {
            console.error('Payment verification failed:', verifyErr);
            setCheckoutError(
              verifyErr.message ||
                'Payment verification failed on the server. Your card will not be debited without verified access.'
            );
          } finally {
            setIsProcessingCheckout(false);
          }
        },
      };

      const rzpInstance = new (window as any).Razorpay(options);
      rzpInstance.on('payment.failed', (failResp: any) => {
        console.error('Razorpay payment failed:', failResp.error);
        setCheckoutError(failResp.error?.description || 'Payment was declined by your bank or provider.');
        setIsProcessingCheckout(false);
      });

      rzpInstance.open();
    } catch (err: any) {
      console.error('Checkout error:', err);
      setCheckoutError(err.message || 'Failed to initialize payment checkout.');
      setIsProcessingCheckout(false);
    }
  };

  // If viewing purchases tab
  if (activeTab === 'purchases') {
    return (
      <div className="space-y-6">
        {/* Tab switcher */}
        <div className="flex items-center gap-2 border-b border-stone-200/80 pb-3">
          <button
            onClick={() => setActiveTab('catalog')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white hover:bg-stone-100 text-stone-600 border border-stone-200/90"
          >
            <Tag className="w-4 h-4" />
            <span>Available Programs</span>
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-[#35156B] text-amber-300 shadow-2xs"
          >
            <Receipt className="w-4 h-4" />
            <span>My Purchases & Receipts</span>
          </button>
        </div>

        <LearnerPurchasesView />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-6xl mx-auto font-sans-editorial">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-serif-editorial font-bold text-[#111426] flex items-center gap-2">
            <Package className="w-6 h-6 text-[#35156B]" />
            <span>Comprehensive Civil Services Programs</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 font-medium">
            Master UPSC and BPSC with verified past questions, full-length simulations, and AI mentor guidance.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setActiveTab('catalog')}
            className="px-4 py-2 bg-[#35156B] text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Curated Plans</span>
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className="px-4 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200/90 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <Receipt className="w-3.5 h-3.5 text-[#35156B]" />
            <span>My Purchases</span>
          </button>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-stone-400">
            <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-[#35156B]" />
            <p className="text-xs">Loading official curriculum catalog...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="col-span-full py-16 text-center text-stone-500 bg-white border border-stone-200 rounded-2xl">
            <Package className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="font-bold text-sm">No courses currently available</p>
            <p className="text-xs text-stone-400 mt-1">Check back shortly for new test series batches.</p>
          </div>
        ) : (
          courses.map(course => {
            const activeEntitlement = myEntitlements.find(e => e.courseId === course.id && e.status === 'ACTIVE');
            const isEnrolled = !!activeEntitlement;
            const price = course.currentPrice;
            const finalPrice = price ? price.salePrice || price.basePrice : 0;
            const hasDiscount = price && price.salePrice && price.salePrice < price.basePrice;

            return (
              <div
                key={course.id}
                className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                      {course.exam}
                    </span>
                    <span className="text-xs text-stone-500 font-mono font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {course.defaultDurationDays} Days Access
                    </span>
                  </div>

                  {/* Course Title & Description */}
                  <div>
                    <h3 className="font-serif-editorial font-bold text-lg text-[#111426] leading-snug group-hover:text-[#35156B] transition-colors">
                      {course.name}
                    </h3>
                    <p className="text-xs text-stone-600 mt-1.5 line-clamp-3 leading-relaxed">
                      {course.description ||
                        'Comprehensive syllabus coverage with verified past year questions, full simulations, and AI mentor.'}
                    </p>
                  </div>

                  {/* Pricing Display */}
                  <div className="pt-2 border-t border-stone-100 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-stone-400 font-bold block">
                        Enrollment Fee
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-bold font-mono text-stone-900">
                          ₹{finalPrice.toLocaleString('en-IN')}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs text-stone-400 line-through font-mono">
                            ₹{price?.basePrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>

                    {hasDiscount && price && (
                      <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {Math.round(((price.basePrice - price.salePrice!) / price.basePrice) * 100)}% OFF
                      </span>
                    )}
                  </div>

                  {/* Included Features List */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono uppercase text-stone-400 font-bold block">
                      Included Capabilities
                    </span>
                    <div className="space-y-1">
                      {course.features?.slice(0, 4).map(f => {
                        const info = featureIconMap[f] || { label: f.replace(/_/g, ' '), icon: CheckCircle2 };
                        const Icon = info.icon;
                        return (
                          <div key={f} className="flex items-center gap-2 text-xs text-stone-700">
                            <Icon className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span className="truncate">{info.label}</span>
                          </div>
                        );
                      })}
                      {course.features && course.features.length > 4 && (
                        <div className="text-[10px] text-stone-400 font-mono pl-5">
                          +{course.features.length - 4} additional modules
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="border-t border-stone-100 pt-4 mt-5">
                  {isEnrolled ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-bold">ENROLLED & ACTIVE</span>
                        </div>
                        {activeEntitlement.expiresAt && (
                          <span>
                            Until {new Date(activeEntitlement.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setActiveSection('pyq-practice')}
                        className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        <span>Open Course Modules</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenCheckout(course)}
                      className="w-full py-2.5 bg-[#0C1024] hover:bg-[#1A1F36] text-amber-300 text-xs font-bold rounded-xl shadow-2xs border border-amber-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>View Details & Enroll</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CHECKOUT / DETAIL MODAL (RAZORPAY INTEGRATED) */}
      {showCheckoutModal && selectedCourse && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                  {selectedCourse.exam} PROGRAM
                </span>
                <h2 className="text-lg font-serif-editorial font-bold text-stone-900 mt-1">
                  {selectedCourse.name}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowCheckoutModal(false);
                  setCheckoutSuccessData(null);
                  setCheckoutError(null);
                }}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If Payment Successful State */}
            {checkoutSuccessData ? (
              <div className="space-y-4 py-4 text-center">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-serif-editorial font-bold text-stone-900">
                    Payment Verified & Access Unlocked!
                  </h3>
                  <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto">
                    Your enrollment in <strong className="text-stone-800">{checkoutSuccessData.courseName}</strong> is
                    cryptographically verified. All curriculum modules, mock tests, and mentor features are ready for you.
                  </p>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 font-mono space-y-1">
                  <div>Transaction ID: {checkoutSuccessData.paymentId}</div>
                  <div>
                    Access Valid Until:{' '}
                    {checkoutSuccessData.expiresAt
                      ? new Date(checkoutSuccessData.expiresAt).toLocaleDateString()
                      : 'Lifetime'}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setShowCheckoutModal(false);
                      setActiveSection('pyq-practice');
                    }}
                    className="px-6 py-2.5 bg-[#0C1024] hover:bg-[#1A1F36] text-amber-300 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>Start Learning Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-stone-600 leading-relaxed">
                  {selectedCourse.description ||
                    'Complete civil services preparation program with full-length timed simulations, official UPSC past papers, and personal analytics.'}
                </p>

                {/* All Features */}
                <div className="space-y-2">
                  <span className="font-mono uppercase text-stone-400 font-bold block text-[10px]">
                    Included Capabilities ({selectedCourse.features?.length || 0})
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedCourse.features?.map(f => {
                      const info = featureIconMap[f] || { label: f.replace(/_/g, ' '), icon: CheckCircle2 };
                      const Icon = info.icon;
                      return (
                        <div
                          key={f}
                          className="p-2 bg-[#FAF8F5] border border-stone-200/80 rounded-xl flex items-center gap-2"
                        >
                          <Icon className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span className="text-[11px] font-medium text-stone-800 truncate">{info.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Coupon Code Section */}
                <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-700" />
                      <span>Promotional Coupon / Referral</span>
                    </span>
                    {appliedCoupon && (
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Applied</span>
                      </span>
                    )}
                  </div>

                  {!appliedCoupon ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Enter coupon code (e.g. UPSC2026)"
                        value={couponCodeInput}
                        onChange={e => setCouponCodeInput(e.target.value.toUpperCase())}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyCoupon();
                          }
                        }}
                        className="flex-1 bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold uppercase text-stone-900 focus:outline-none focus:border-amber-600"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={isValidatingCoupon || !couponCodeInput.trim()}
                        className="px-3 py-1.5 bg-[#0C1024] hover:bg-[#1A1F36] text-amber-300 rounded-xl text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                      >
                        {isValidatingCoupon ? 'Checking...' : 'Apply'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-emerald-50/80 border border-emerald-200 rounded-xl p-2.5 text-xs">
                      <div>
                        <div className="font-mono font-bold text-emerald-900">{appliedCoupon.code}</div>
                        <div className="text-[11px] text-emerald-700">
                          {appliedCoupon.name || 'Promotional Discount'} (Savings: ₹{appliedCoupon.discountAmount.toLocaleString('en-IN')})
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs font-bold text-rose-700 hover:text-rose-900 cursor-pointer bg-white px-2 py-1 rounded-lg border border-rose-200 shadow-2xs"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {couponError && (
                    <div className="text-[11px] text-rose-700 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                      <span>{couponError}</span>
                    </div>
                  )}
                </div>

                {/* Canonical Server-Calculated Price Breakdown */}
                <div className="p-4 bg-stone-900 text-white rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <span className="text-stone-400 text-xs">Validity Duration</span>
                    <span className="font-mono font-bold text-amber-300">{selectedCourse.defaultDurationDays} Days</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-400">Course Base Fee</span>
                    <span className="font-mono text-stone-300">
                      ₹{selectedCourse.currentPrice?.basePrice.toLocaleString('en-IN') || '0'}
                    </span>
                  </div>
                  {selectedCourse.currentPrice?.salePrice &&
                    selectedCourse.currentPrice.salePrice < selectedCourse.currentPrice.basePrice && (
                      <div className="flex items-center justify-between text-xs text-emerald-400">
                        <span>Course Catalog Discount</span>
                        <span className="font-mono">
                          -₹{(selectedCourse.currentPrice.basePrice - selectedCourse.currentPrice.salePrice).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                  {appliedCoupon && appliedCoupon.discountAmount > 0 && (
                    <div className="flex items-center justify-between text-xs text-amber-400 font-medium">
                      <span>Coupon Discount ({appliedCoupon.code})</span>
                      <span className="font-mono font-bold">
                        -₹{appliedCoupon.discountAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs border-t border-stone-800 pt-2 font-bold">
                    <span className="text-amber-200">Total Payable Amount</span>
                    <span className="font-mono text-base text-amber-300">
                      ₹{appliedCoupon
                        ? appliedCoupon.finalAmount.toLocaleString('en-IN')
                        : (selectedCourse.currentPrice?.salePrice || selectedCourse.currentPrice?.basePrice || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Gateway Warning or Status */}
                {gatewayConfig && !gatewayConfig.isConfigured ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-950 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>PAYMENT CONFIGURATION REQUIRED</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-stone-600">
                      Razorpay Key ID and Secret are not configured in environment variables. Live checkout transactions
                      are temporarily disabled. Contact your administrator or wait for activation.
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 font-medium">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Razorpay Secure Encrypted Checkout</span>
                    </div>
                    {gatewayConfig?.mode && (
                      <span className="font-mono text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                        {gatewayConfig.mode}
                      </span>
                    )}
                  </div>
                )}

                {/* Checkout Error Message */}
                {checkoutError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-[11px] flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Payment Error:</strong> {checkoutError}
                    </div>
                  </div>
                )}

                {/* Bottom Action Buttons */}
                <div className="border-t border-stone-100 pt-3 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setShowCheckoutModal(false)}
                    disabled={isProcessingCheckout}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleProceedToCheckout}
                    disabled={isProcessingCheckout || !gatewayConfig?.isConfigured}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-2xs ${
                      !gatewayConfig?.isConfigured
                        ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                        : 'bg-[#0C1024] hover:bg-[#1A1F36] text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {isProcessingCheckout
                        ? 'Connecting to Gateway...'
                        : !gatewayConfig?.isConfigured
                        ? 'Payment Gateway Unconfigured'
                        : 'Proceed to Checkout'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
