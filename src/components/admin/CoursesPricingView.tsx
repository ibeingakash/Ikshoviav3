import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Edit2,
  Archive,
  DollarSign,
  Tag,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  RefreshCw,
  Sparkles,
  Shield,
  HelpCircle,
  FolderArchive,
  FileCheck2,
  BookOpen,
  Newspaper,
  FileText,
  Bot,
  Calendar,
  BarChart3,
  Bookmark,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { Course, CoursePrice, PlatformFeatureCode, CourseType } from '../../types/index.js';

export const CoursesPricingView: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'COURSES' | 'PRICING'>('COURSES');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New / Edit Course Modal
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exam, setExam] = useState('UPSC');
  const [courseType, setCourseType] = useState<CourseType>('TEST_SERIES');
  const [defaultDurationDays, setDefaultDurationDays] = useState(90);
  const [displayOrder, setDisplayOrder] = useState(1);
  const [selectedFeatures, setSelectedFeatures] = useState<PlatformFeatureCode[]>([
    'PYQ_PRACTICE',
    'MOCK_TESTS',
  ]);

  // Initial Price Fields
  const [basePrice, setBasePrice] = useState<number>(4999);
  const [salePrice, setSalePrice] = useState<number>(2499);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline Price Edit Modal
  const [priceModalCourse, setPriceModalCourse] = useState<Course | null>(null);
  const [editPriceBase, setEditPriceBase] = useState<number>(0);
  const [editPriceSale, setEditPriceSale] = useState<number>(0);
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  const allAvailableFeatures: { code: PlatformFeatureCode; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { code: 'PYQ_PRACTICE', label: 'PYQ Practice', desc: '10-year official papers with rich explanations & audio', icon: FolderArchive },
    { code: 'MOCK_TESTS', label: 'Mock Test Simulator', desc: 'Timed simulated exams with negative marking & rank analytics', icon: FileCheck2 },
    { code: 'TOPIC_SUBJECT_PRACTICE', label: 'Topic & Subject Drills', desc: 'Targeted chapter-wise question practice', icon: BookOpen },
    { code: 'CURRENT_AFFAIRS', label: 'Current Affairs Studio', desc: 'Daily editorial briefs, MCQs, and monthly digests', icon: Newspaper },
    { code: 'NOTES', label: 'Notes & Mindmaps', desc: 'High-yield syllabus notes and concept summaries', icon: FileText },
    { code: 'AI_TUTOR', label: 'AI Mentor & Socratic Tutor', desc: 'Interactive chat guidance powered by Gemini models', icon: Bot },
    { code: 'STUDY_PLAN', label: 'Study Planner & Timetable', desc: 'Personalized revision and daily study schedules', icon: Calendar },
    { code: 'ANALYTICS', label: 'Deep Performance Analytics', desc: 'Accuracy graphs, weak topic telemetry, time metrics', icon: BarChart3 },
    { code: 'BOOKMARKS', label: 'Bookmarks & Error Registry', desc: 'Saved questions and mistake-revision drills', icon: Bookmark },
    { code: 'RESOURCE_LIBRARY', label: 'Resource Library', desc: 'Reference documents, reports, and gazettes', icon: Layers },
  ];

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await api.getCourses();
      setCourses(data);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to load courses' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const openNewCourseModal = () => {
    setEditingCourseId(null);
    setName('');
    setDescription('');
    setExam('UPSC');
    setCourseType('TEST_SERIES');
    setDefaultDurationDays(90);
    setDisplayOrder(courses.length + 1);
    setSelectedFeatures(['PYQ_PRACTICE', 'MOCK_TESTS']);
    setBasePrice(4999);
    setSalePrice(2499);
    setShowCourseModal(true);
  };

  const openEditCourseModal = (course: Course) => {
    setEditingCourseId(course.id);
    setName(course.name);
    setDescription(course.description || '');
    setExam(course.exam);
    setCourseType(course.courseType);
    setDefaultDurationDays(course.defaultDurationDays);
    setDisplayOrder(course.displayOrder);
    setSelectedFeatures(course.features || []);
    setBasePrice(course.currentPrice?.basePrice || 0);
    setSalePrice(course.currentPrice?.salePrice || 0);
    setShowCourseModal(true);
  };

  const toggleFeature = (code: PlatformFeatureCode) => {
    if (selectedFeatures.includes(code)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== code));
    } else {
      setSelectedFeatures([...selectedFeatures, code]);
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNotification({ type: 'error', message: 'Course name is required' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCourseId) {
        await api.updateCourse(editingCourseId, {
          name: name.trim(),
          description: description.trim(),
          exam,
          courseType,
          defaultDurationDays: Number(defaultDurationDays),
          displayOrder: Number(displayOrder),
          features: selectedFeatures,
        });
        setNotification({ type: 'success', message: 'Course updated successfully.' });
      } else {
        await api.createCourse({
          name: name.trim(),
          description: description.trim(),
          exam,
          courseType,
          defaultDurationDays: Number(defaultDurationDays),
          displayOrder: Number(displayOrder),
          features: selectedFeatures,
          pricing: {
            basePrice: Number(basePrice),
            salePrice: salePrice ? Number(salePrice) : null,
            currency: 'INR',
          },
        });
        setNotification({ type: 'success', message: 'New course and price created successfully.' });
      }
      setShowCourseModal(false);
      await fetchCourses();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to save course' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (courseId: string, courseName: string) => {
    if (!window.confirm(`Archive course "${courseName}"? Existing learners will retain access, but it will be hidden from new purchases.`)) return;
    try {
      await api.archiveCourse(courseId);
      setNotification({ type: 'success', message: 'Course archived.' });
      await fetchCourses();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to archive course' });
    }
  };

  const openPriceModal = (course: Course) => {
    setPriceModalCourse(course);
    setEditPriceBase(course.currentPrice?.basePrice || 4999);
    setEditPriceSale(course.currentPrice?.salePrice || 2499);
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceModalCourse) return;

    setIsSavingPrice(true);
    try {
      await api.setCoursePrice(priceModalCourse.id, {
        basePrice: Number(editPriceBase),
        salePrice: editPriceSale ? Number(editPriceSale) : null,
        currency: 'INR',
      });
      setNotification({ type: 'success', message: `Pricing updated for ${priceModalCourse.name}.` });
      setPriceModalCourse(null);
      await fetchCourses();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to update price' });
    } finally {
      setIsSavingPrice(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-7xl mx-auto font-sans-editorial">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-900 border border-amber-300 shadow-2xs">
              <Package className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h1 className="text-2xl font-serif-editorial font-bold text-stone-900 flex items-center gap-2">
                Courses, Products & Pricing
              </h1>
              <p className="text-xs text-stone-500 font-medium">
                Define academic programs, feature access capability mappings, and live canonical pricing.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchCourses}
            className="px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200/90 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-stone-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={openNewCourseModal}
            className="px-4 py-2 bg-[#1C1917] hover:bg-[#292524] text-amber-300 text-xs font-bold rounded-xl shadow-2xs border border-amber-500/30 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Add Course / Product</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
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
          <button onClick={() => setNotification(null)} className="text-stone-400 hover:text-stone-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200/80 pb-3">
        <button
          onClick={() => setActiveTab('COURSES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'COURSES'
              ? 'bg-[#1C1917] text-amber-300 shadow-2xs'
              : 'bg-white hover:bg-stone-50 text-stone-600 border border-stone-200/90'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Course Products ({courses.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('PRICING')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'PRICING'
              ? 'bg-[#1C1917] text-amber-300 shadow-2xs'
              : 'bg-white hover:bg-stone-50 text-stone-600 border border-stone-200/90'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Pricing Matrix & Offers</span>
        </button>
      </div>

      {/* TAB 1: COURSES & FEATURES */}
      {activeTab === 'COURSES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map(course => {
            const hasSale =
              course.currentPrice?.salePrice !== undefined &&
              course.currentPrice?.salePrice !== null &&
              course.currentPrice?.salePrice < (course.currentPrice?.basePrice || 0);

            return (
              <div
                key={course.id}
                className={`bg-white border rounded-2xl p-5 shadow-2xs flex flex-col justify-between transition-all ${
                  course.isActive ? 'border-stone-200/90 hover:border-amber-400/80' : 'border-stone-200 opacity-60'
                }`}
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-950 border border-amber-300 px-2 py-0.5 rounded-full">
                        {course.exam}
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-stone-100 text-stone-700 border border-stone-200 px-2 py-0.5 rounded-full">
                        {course.courseType.replace('_', ' ')}
                      </span>
                      {!course.isActive && (
                        <span className="text-[10px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full">
                          ARCHIVED
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-stone-400">
                      {course.defaultDurationDays} days
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold font-serif-editorial text-stone-900 leading-snug">
                      {course.name}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                      {course.description || 'Comprehensive exam preparation course.'}
                    </p>
                  </div>

                  {/* Pricing Badge */}
                  <div className="p-2.5 bg-[#FAF8F5] border border-stone-200/80 rounded-xl flex items-center justify-between">
                    <span className="text-[11px] font-mono text-stone-500 uppercase font-bold">Canonical Price</span>
                    <div className="text-right">
                      {course.currentPrice ? (
                        <div className="flex items-center gap-1.5 justify-end">
                          {hasSale && (
                            <span className="text-xs text-stone-400 line-through font-mono">
                              ₹{course.currentPrice.basePrice}
                            </span>
                          )}
                          <span className="text-sm font-bold text-stone-900 font-mono">
                            ₹{hasSale ? course.currentPrice.salePrice : course.currentPrice.basePrice}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-stone-400 italic">Not priced</span>
                      )}
                    </div>
                  </div>

                  {/* Feature Capabilities Tag Grid */}
                  <div>
                    <span className="text-[10px] font-mono uppercase text-stone-400 font-bold block mb-1.5">
                      Included Capabilities ({course.features?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {course.features && course.features.length > 0 ? (
                        course.features.map(f => (
                          <span
                            key={f}
                            className="text-[10px] font-medium bg-stone-50 border border-stone-200 text-stone-700 px-2 py-0.5 rounded-md"
                          >
                            {f.replace(/_/g, ' ')}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-stone-400 italic">No features assigned</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-stone-100 pt-3 mt-4 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openPriceModal(course)}
                    className="px-2.5 py-1 text-xs font-bold text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <DollarSign className="w-3 h-3 text-stone-500" />
                    <span>Set Price</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditCourseModal(course)}
                      className="px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3 text-amber-700" />
                      <span>Edit</span>
                    </button>

                    {course.isActive && (
                      <button
                        onClick={() => handleArchive(course.id, course.name)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                        title="Archive Course"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: PRICING MATRIX */}
      {activeTab === 'PRICING' && (
        <div className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-2xs space-y-4 p-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900 font-serif-editorial">
                Catalog Pricing Registry (Payment-Ready)
              </h3>
              <p className="text-xs text-stone-500">
                These prices serve as the canonical source of truth for all entitlement checkouts and invoice generation.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Currency: INR (₹)</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-[#FAF8F5] border-b border-stone-200/90 font-mono text-[11px] text-stone-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Course Product</th>
                  <th className="py-3 px-3">Exam / Type</th>
                  <th className="py-3 px-3">Base Price</th>
                  <th className="py-3 px-3">Sale Price</th>
                  <th className="py-3 px-3">Learner Discount</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {courses.map(c => {
                  const base = c.currentPrice?.basePrice || 0;
                  const sale = c.currentPrice?.salePrice || null;
                  const discountPct =
                    sale && base > 0 ? Math.round(((base - sale) / base) * 100) : 0;

                  return (
                    <tr key={c.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-stone-900">{c.name}</span>
                        <div className="text-[10px] text-stone-400 font-mono">{c.id}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-mono font-bold bg-stone-100 text-stone-700 border border-stone-200 px-2 py-0.5 rounded">
                          {c.exam} • {c.courseType}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-stone-900">
                        ₹{base.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-800">
                        {sale ? `₹${sale.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {discountPct > 0 ? (
                          <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            {discountPct}% OFF
                          </span>
                        ) : (
                          <span className="text-stone-400 text-[11px]">Regular</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openPriceModal(c)}
                          className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                        >
                          Modify Price
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT COURSE */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <form
            onSubmit={handleSaveCourse}
            className="bg-white border border-stone-200 rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h2 className="text-base font-bold font-serif-editorial text-stone-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-700" />
                <span>{editingCourseId ? 'Edit Course Product' : 'Create New Course Product'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowCourseModal(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. UPSC Prelims GS Comprehensive 2026"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                    Target Exam
                  </label>
                  <select
                    value={exam}
                    onChange={e => setExam(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-600"
                  >
                    <option value="UPSC">UPSC Civil Services</option>
                    <option value="BPSC">BPSC Combined Competitive</option>
                    <option value="UPPCS">UPPCS Civil Services</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                    Course Type
                  </label>
                  <select
                    value={courseType}
                    onChange={e => setCourseType(e.target.value as CourseType)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-600"
                  >
                    <option value="TEST_SERIES">Test Series</option>
                    <option value="FULL_COURSE">Full Comprehensive Course</option>
                    <option value="SUBJECT_MODULE">Subject Specific Module</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                    Default Validity (Days)
                  </label>
                  <input
                    type="number"
                    value={defaultDurationDays}
                    onChange={e => setDefaultDurationDays(Number(e.target.value))}
                    min={1}
                    max={730}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={e => setDisplayOrder(Number(e.target.value))}
                    min={0}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Detailed academic overview of this test series or package..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-600 h-16 resize-none"
                />
              </div>

              {/* Initial Pricing if new */}
              {!editingCourseId && (
                <div className="p-3.5 bg-[#FAF8F5] border border-stone-200 rounded-xl space-y-2">
                  <span className="text-[11px] font-mono font-bold text-stone-800 uppercase block">
                    Initial Canonical Pricing (INR)
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-stone-500 font-mono mb-0.5">Base Price (MRP)</label>
                      <input
                        type="number"
                        value={basePrice}
                        onChange={e => setBasePrice(Number(e.target.value))}
                        min={0}
                        className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 font-mono font-bold text-stone-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-500 font-mono mb-0.5">Sale Price (Offer)</label>
                      <input
                        type="number"
                        value={salePrice}
                        onChange={e => setSalePrice(Number(e.target.value))}
                        min={0}
                        className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 font-mono font-bold text-emerald-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Feature Access Capability Checklist */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <span className="text-[11px] font-mono font-bold text-stone-700 uppercase block">
                  Select Allowed Features / Module Entitlements
                </span>
                <p className="text-[11px] text-stone-500">
                  Learners enrolled in this course will be granted server-side access to checked capabilities.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {allAvailableFeatures.map(feat => {
                    const isSelected = selectedFeatures.includes(feat.code);
                    const Icon = feat.icon;
                    return (
                      <div
                        key={feat.code}
                        onClick={() => toggleFeature(feat.code)}
                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-50/70 border-amber-300 text-stone-900'
                            : 'bg-white border-stone-200/80 text-stone-500 hover:border-stone-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-0.5 accent-amber-800"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-800' : 'text-stone-400'}`} />
                            <span>{feat.label}</span>
                          </div>
                          <p className="text-[10px] text-stone-500 leading-tight mt-0.5">{feat.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-stone-200 pt-3">
              <button
                type="button"
                onClick={() => setShowCourseModal(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#1C1917] hover:bg-[#292524] text-amber-300 text-xs font-bold rounded-xl shadow-2xs border border-amber-500/30 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : editingCourseId ? 'Save Changes' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: EDIT PRICE ONLY */}
      {priceModalCourse && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <form
            onSubmit={handleSavePrice}
            className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h2 className="text-base font-bold font-serif-editorial text-stone-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-700" />
                <span>Configure Price: {priceModalCourse.name}</span>
              </h2>
              <button
                type="button"
                onClick={() => setPriceModalCourse(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                  Base Price (MRP in ₹)
                </label>
                <input
                  type="number"
                  value={editPriceBase}
                  onChange={e => setEditPriceBase(Number(e.target.value))}
                  min={0}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-mono font-bold text-stone-900 focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-stone-700 uppercase mb-1">
                  Sale / Offer Price (in ₹)
                </label>
                <input
                  type="number"
                  value={editPriceSale}
                  onChange={e => setEditPriceSale(Number(e.target.value))}
                  min={0}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-mono font-bold text-emerald-800 focus:outline-none focus:border-amber-600"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Leave equal to base price or lower for discount.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-stone-200 pt-3">
              <button
                type="button"
                onClick={() => setPriceModalCourse(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingPrice}
                className="px-5 py-2 bg-[#1C1917] hover:bg-[#292524] text-amber-300 text-xs font-bold rounded-xl shadow-2xs border border-amber-500/30 cursor-pointer disabled:opacity-50"
              >
                {isSavingPrice ? 'Saving Price...' : 'Update Price'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
