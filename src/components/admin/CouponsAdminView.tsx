import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  RefreshCw,
  Edit2,
  Trash2,
  Percent,
  Coins,
  Calendar,
  Layers,
  ShoppingBag,
  Power,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { Coupon, Course } from '../../types/index.js';

export const CouponsAdminView: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'INACTIVE'>('ALL');
  const [courseFilter, setCourseFilter] = useState<string>('ALL');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FLAT',
    discountValue: 20,
    maxDiscount: '' as string | number,
    minOrderValue: 0,
    courseId: '',
    startDate: '',
    expiryDate: '',
    usageLimit: '' as string | number,
    perUserLimit: 1,
    isActive: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [couponList, courseList] = await Promise.all([
        api.getAdminCoupons(),
        api.getCourses({ activeOnly: false }),
      ]);
      setCoupons(couponList);
      setCourses(courseList);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to load coupon registry' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      maxDiscount: '',
      minOrderValue: 0,
      courseId: '',
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      usageLimit: '',
      perUserLimit: 1,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      discountType: coupon.discountType === 'FIXED_AMOUNT' ? 'FLAT' : (coupon.discountType as 'PERCENTAGE' | 'FLAT'),
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount !== null && coupon.maxDiscount !== undefined ? coupon.maxDiscount : '',
      minOrderValue: coupon.minOrderValue || 0,
      courseId: coupon.courseId || '',
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : '',
      expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '',
      usageLimit: coupon.usageLimit !== null && coupon.usageLimit !== undefined ? coupon.usageLimit : '',
      perUserLimit: coupon.perUserLimit || 1,
      isActive: coupon.isActive,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      setNotification({ type: 'error', message: 'Coupon code and name are required' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        maxDiscount: formData.maxDiscount !== '' ? Number(formData.maxDiscount) : null,
        minOrderValue: Number(formData.minOrderValue) || 0,
        courseId: formData.courseId || null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate + 'T23:59:59.999Z').toISOString() : null,
        usageLimit: formData.usageLimit !== '' ? Number(formData.usageLimit) : null,
        perUserLimit: Number(formData.perUserLimit) || 1,
        isActive: formData.isActive,
      };

      if (editingCoupon) {
        await api.updateCoupon(editingCoupon.id, payload);
        setNotification({ type: 'success', message: `Coupon "${payload.code}" updated successfully.` });
      } else {
        await api.createCoupon(payload);
        setNotification({ type: 'success', message: `Coupon "${payload.code}" created successfully.` });
      }

      setModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Operation failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      await api.updateCoupon(coupon.id, { isActive: !coupon.isActive });
      setNotification({
        type: 'success',
        message: `Coupon "${coupon.code}" ${!coupon.isActive ? 'activated' : 'deactivated'}.`,
      });
      await fetchData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to update coupon status' });
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    const confirm = window.confirm(
      `Delete or archive coupon "${coupon.code}"? If it has been used in past purchases, it will be safely disabled instead of permanently removed.`
    );
    if (!confirm) return;

    try {
      const res = await api.deleteCoupon(coupon.id);
      setNotification({ type: 'success', message: res.message });
      await fetchData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to delete coupon' });
    }
  };

  // Metrics
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter(c => c.isActive && (!c.expiryDate || new Date(c.expiryDate) > new Date())).length;
  const totalUsages = coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0);
  const totalDiscountDistributed = coupons.reduce((sum, c) => sum + (Number(c.totalDiscountGiven) || 0), 0);

  // Filtered Coupons
  const filteredCoupons = coupons.filter(coupon => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      coupon.code.toLowerCase().includes(q) ||
      coupon.name.toLowerCase().includes(q) ||
      (coupon.description && coupon.description.toLowerCase().includes(q));

    const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) <= new Date();
    let matchesStatus = true;
    if (statusFilter === 'ACTIVE') {
      matchesStatus = coupon.isActive && !isExpired;
    } else if (statusFilter === 'EXPIRED') {
      matchesStatus = Boolean(isExpired);
    } else if (statusFilter === 'INACTIVE') {
      matchesStatus = !coupon.isActive;
    }

    const matchesCourse = courseFilter === 'ALL' || (coupon.courseId === courseFilter);

    return matchesQuery && matchesStatus && matchesCourse;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-7xl mx-auto font-sans-editorial">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-900 border border-amber-300 shadow-2xs">
              <Tag className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h1 className="text-2xl font-serif-editorial font-bold text-stone-900 flex items-center gap-2">
                Coupons & Promotional Offers
              </h1>
              <p className="text-xs text-stone-500 font-medium">
                Manage promotional discount codes, validity periods, redemption limits, and course associations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchData}
            className="px-3 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-stone-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#1C1917] hover:bg-[#292524] text-amber-300 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs cursor-pointer border border-amber-500/30"
          >
            <Plus className="w-4 h-4" />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-stone-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-medium">Total Coupons</span>
            <Tag className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-bold font-serif-editorial text-stone-900">{totalCoupons}</div>
          <div className="text-[11px] text-stone-400 mt-1">Configured in registry</div>
        </div>

        <div className="p-4 bg-white border border-stone-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-medium">Active Offers</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-serif-editorial text-emerald-700">{activeCoupons}</div>
          <div className="text-[11px] text-stone-400 mt-1">Currently redeemable</div>
        </div>

        <div className="p-4 bg-white border border-stone-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-medium">Total Redemptions</span>
            <ShoppingBag className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-serif-editorial text-indigo-700">{totalUsages}</div>
          <div className="text-[11px] text-stone-400 mt-1">Applied orders verified</div>
        </div>

        <div className="p-4 bg-white border border-stone-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-medium">Total Savings Given</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-serif-editorial text-amber-800">
            ₹{totalDiscountDistributed.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">Cumulative student discount</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white border border-stone-200/80 rounded-2xl shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search coupons by code, title, or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:border-amber-600"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-stone-600">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-[11px] font-bold text-stone-500">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="EXPIRED">Expired</option>
              <option value="INACTIVE">Disabled</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-stone-600">
            <Layers className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-[11px] font-bold text-stone-500">Course:</span>
            <select
              value={courseFilter}
              onChange={e => setCourseFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-stone-800 focus:outline-none cursor-pointer max-w-[150px] truncate"
            >
              <option value="ALL">All Courses</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white border border-stone-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-mono uppercase text-stone-500 tracking-wider">
                <th className="py-3 px-4">Coupon Code & Title</th>
                <th className="py-3 px-3">Discount Value</th>
                <th className="py-3 px-3">Applicability</th>
                <th className="py-3 px-3">Validity Window</th>
                <th className="py-3 px-3">Redemptions</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-stone-400" />
                    Loading coupon registry...
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-500">
                    No promotional coupons match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map(coupon => {
                  const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) <= new Date();
                  const course = courses.find(c => c.id === coupon.courseId);

                  return (
                    <tr key={coupon.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="px-2.5 py-1 bg-amber-50 border border-amber-300/80 rounded-lg text-amber-900 font-mono font-bold text-xs tracking-wider">
                            {coupon.code}
                          </div>
                          <div>
                            <div className="font-bold text-stone-900">{coupon.name}</div>
                            {coupon.description && (
                              <div className="text-[11px] text-stone-400 line-clamp-1">{coupon.description}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-stone-900 flex items-center gap-1">
                          {coupon.discountType === 'PERCENTAGE' ? (
                            <>
                              <Percent className="w-3.5 h-3.5 text-amber-700" />
                              <span>{coupon.discountValue}% OFF</span>
                            </>
                          ) : (
                            <>
                              <Coins className="w-3.5 h-3.5 text-amber-700" />
                              <span>₹{coupon.discountValue} FLAT OFF</span>
                            </>
                          )}
                        </div>
                        {coupon.maxDiscount && (
                          <div className="text-[10px] text-stone-500">Cap: ₹{coupon.maxDiscount}</div>
                        )}
                        {coupon.minOrderValue > 0 && (
                          <div className="text-[10px] text-stone-400">Min Order: ₹{coupon.minOrderValue}</div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {course ? (
                          <span className="text-[11px] font-medium text-stone-800 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-lg inline-block max-w-[180px] truncate">
                            {course.name}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg inline-block">
                            All Courses
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-[11px] text-stone-500 font-mono">
                        <div>
                          {coupon.startDate ? new Date(coupon.startDate).toLocaleDateString() : 'Immediate'}
                          <span className="mx-1 text-stone-300">→</span>
                          {coupon.expiryDate ? (
                            <span className={isExpired ? 'text-rose-600 font-bold' : 'text-stone-800 font-bold'}>
                              {new Date(coupon.expiryDate).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-bold">No Expiry</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-stone-900">
                          {coupon.usageCount || 0}
                          {coupon.usageLimit ? (
                            <span className="text-stone-400 font-normal"> / {coupon.usageLimit}</span>
                          ) : (
                            <span className="text-stone-400 font-normal"> / ∞</span>
                          )}
                        </div>
                        {coupon.totalDiscountGiven ? (
                          <div className="text-[10px] text-stone-500">
                            Saved: ₹{Number(coupon.totalDiscountGiven).toLocaleString('en-IN')}
                          </div>
                        ) : null}
                      </td>

                      <td className="py-3 px-3">
                        {isExpired ? (
                          <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            EXPIRED
                          </span>
                        ) : coupon.isActive ? (
                          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold text-stone-600 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full">
                            DISABLED
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggleActive(coupon)}
                            title={coupon.isActive ? 'Deactivate Coupon' : 'Activate Coupon'}
                            className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                              coupon.isActive
                                ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(coupon)}
                            title="Edit Coupon"
                            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 rounded-lg cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(coupon)}
                            title="Delete / Disable Coupon"
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CREATE / EDIT COUPON */}
      {modalOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-stone-200 rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h2 className="text-base font-bold font-serif-editorial text-stone-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-700" />
                <span>{editingCoupon ? 'Edit Promotional Coupon' : 'Create New Coupon'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. UPSC2026, SPRINT50"
                    required
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-mono font-bold uppercase focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                    Display Title *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Early Bird Scholarship Offer"
                    required
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-medium focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                  Description / Terms
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Valid for all Prelims courses during registration week"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                    Discount Type
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={e => setFormData({ ...formData, discountType: e.target.value as any })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-600 font-medium"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                    Value {formData.discountType === 'PERCENTAGE' ? '(%)' : '(₹)'} *
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={e => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    min={1}
                    max={formData.discountType === 'PERCENTAGE' ? 100 : 100000}
                    required
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={e => setFormData({ ...formData, maxDiscount: e.target.value })}
                    placeholder="Optional (e.g. 1500)"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.minOrderValue}
                    onChange={e => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                    min={0}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                    Target Course (Optional)
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={e => setFormData({ ...formData, courseId: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-600"
                  >
                    <option value="">All Courses Applicable</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.exam})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                    Active From
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                    Total Global Usage Limit
                  </label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={e => setFormData({ ...formData, usageLimit: e.target.value })}
                    placeholder="Leave empty for unlimited"
                    min={1}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                    Usage Limit Per Learner
                  </label>
                  <input
                    type="number"
                    value={formData.perUserLimit}
                    onChange={e => setFormData({ ...formData, perUserLimit: Number(e.target.value) })}
                    min={1}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-600 font-bold"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-stone-800 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span>Publish coupon immediately as Active</span>
                </label>
              </div>
            </div>

            <div className="border-t border-stone-200 pt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#1C1917] hover:bg-[#292524] text-amber-300 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-2xs border border-amber-500/30"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{editingCoupon ? 'Update Coupon' : 'Create Coupon'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
