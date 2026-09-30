import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  ExternalLink,
  Tag,
  AlertCircle,
  Eye,
  FileCheck2,
  Sparkles,
  ArrowUpDown,
  MoveUp,
  MoveDown,
  X,
  BookOpen,
  FolderArchive,
  RefreshCw,
  Award,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { TestSeries, TestSeriesWithTests, TestSeriesTest } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

export const AdminTestSeriesStudioView: React.FC = () => {
  const { user } = useAuth();

  // Series List State
  const [seriesList, setSeriesList] = useState<TestSeries[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExam, setSelectedExam] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Active Managing Series (for Linking Mock Tests)
  const [managingSeriesId, setManagingSeriesId] = useState<string | null>(null);
  const [managingSeries, setManagingSeries] = useState<TestSeriesWithTests | null>(null);
  const [loadingManaging, setLoadingManaging] = useState(false);

  // Available Mock Tests to Link Modal
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [availableTestsSearch, setAvailableTestsSearch] = useState('');
  const [loadingAvailableTests, setLoadingAvailableTests] = useState(false);
  const [testToLinkIsFreePreview, setTestToLinkIsFreePreview] = useState(false);

  // Create / Edit Series Modal State
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingSeries, setEditingSeries] = useState<TestSeries | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    targetExam: 'BPSC',
    examCycle: '71st BPSC Prelims 2026',
    category: 'PRELIMS' as 'PRELIMS' | 'MAINS' | 'INTEGRATED' | 'CHAPTER_WISE' | 'FULL_LENGTH',
    description: '',
    mrp: 1499,
    salePrice: 499,
    isFree: false,
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
    durationDays: 180,
    language: 'English / Hindi',
    coverImage: '',
    displayOrder: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load Test Series List
  const loadSeriesList = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminTestSeriesList({
        targetExam: selectedExam !== 'ALL' ? selectedExam : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        search: searchQuery.trim() || undefined,
        limit: 50,
      });
      setSeriesList(data.series || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error('Failed to load test series:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeriesList();
  }, [selectedExam, selectedStatus, selectedCategory]);

  // Handle Search Debounce / Submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadSeriesList();
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingSeries(null);
    setFormData({
      name: '',
      slug: '',
      targetExam: 'BPSC',
      examCycle: '71st BPSC Prelims 2026',
      category: 'PRELIMS',
      description: '',
      mrp: 1499,
      salePrice: 499,
      isFree: false,
      status: 'DRAFT',
      durationDays: 180,
      language: 'English / Hindi',
      coverImage: '',
      displayOrder: 0,
    });
    setFormError(null);
    setShowFormModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (series: TestSeries) => {
    setEditingSeries(series);
    setFormData({
      name: series.name,
      slug: series.slug,
      targetExam: series.targetExam,
      examCycle: series.examCycle || '',
      category: (series.category as 'CHAPTER_WISE' | 'FULL_LENGTH' | 'INTEGRATED' | 'MAINS' | 'PRELIMS') || 'PRELIMS',
      description: series.description || '',
      mrp: series.mrp || 0,
      salePrice: series.salePrice || 0,
      isFree: series.isFree,
      status: series.status,
      durationDays: series.durationDays || 180,
      language: series.language || 'English / Hindi',
      coverImage: series.coverImage || '',
      displayOrder: series.displayOrder || 0,
    });
    setFormError(null);
    setShowFormModal(true);
  };

  // Save (Create or Update) Series
  const handleSaveSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.targetExam.trim()) {
      setFormError('Series Name and Target Exam are required');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        ...formData,
        mrp: Number(formData.mrp),
        salePrice: formData.isFree ? 0 : Number(formData.salePrice),
        durationDays: Number(formData.durationDays),
        displayOrder: Number(formData.displayOrder),
      };

      if (editingSeries) {
        await api.updateAdminTestSeries(editingSeries.id, payload);
      } else {
        await api.createAdminTestSeries(payload);
      }

      setShowFormModal(false);
      loadSeriesList();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save test series');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Toggle Status
  const handleToggleStatus = async (series: TestSeries) => {
    const nextStatus = series.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await api.updateAdminTestSeries(series.id, { status: nextStatus });
      setSeriesList(prev =>
        prev.map(s => (s.id === series.id ? { ...s, status: nextStatus } : s))
      );
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  // Delete Series
  const handleDeleteSeries = async (series: TestSeries) => {
    if (!confirm(`Are you sure you want to delete or archive "${series.name}"?`)) {
      return;
    }
    try {
      await api.deleteAdminTestSeries(series.id);
      loadSeriesList();
      if (managingSeriesId === series.id) {
        setManagingSeriesId(null);
        setManagingSeries(null);
      }
    } catch (err: any) {
      alert('Failed to delete series: ' + err.message);
    }
  };

  // Open Manage Tests View for a Series
  const handleOpenManageTests = async (seriesId: string) => {
    setManagingSeriesId(seriesId);
    setLoadingManaging(true);
    try {
      const detail = await api.getAdminTestSeriesDetail(seriesId);
      setManagingSeries(detail);
    } catch (err) {
      console.error('Failed to load series details:', err);
    } finally {
      setLoadingManaging(false);
    }
  };

  // Refresh managing series
  const refreshManagingSeries = async () => {
    if (!managingSeriesId) return;
    try {
      const detail = await api.getAdminTestSeriesDetail(managingSeriesId);
      setManagingSeries(detail);
      // Also update counts in seriesList
      if (detail) {
        setSeriesList(prev =>
          prev.map(s => (s.id === detail.id ? { ...s, totalTests: detail.totalTests, previewTestCount: detail.previewTestCount } : s))
        );
      }
    } catch (err) {
      console.error('Failed to refresh series detail:', err);
    }
  };

  // Load available tests to link
  const loadAvailableTests = async (search = '') => {
    if (!managingSeriesId) return;
    setLoadingAvailableTests(true);
    try {
      const tests = await api.getAdminAvailableMockTestsForSeries(managingSeriesId, search);
      setAvailableTests(tests);
    } catch (err) {
      console.error('Failed to fetch available mock tests:', err);
    } finally {
      setLoadingAvailableTests(false);
    }
  };

  const handleOpenAddTestModal = () => {
    setAvailableTestsSearch('');
    setTestToLinkIsFreePreview(false);
    setShowAddTestModal(true);
    loadAvailableTests('');
  };

  // Link Test to Series
  const handleLinkTest = async (mockTestId: string) => {
    if (!managingSeriesId) return;
    try {
      await api.adminLinkTestToSeries(managingSeriesId, {
        mockTestId,
        isFreePreview: testToLinkIsFreePreview,
        sequenceNumber: (managingSeries?.tests?.length || 0) + 1,
      });
      await refreshManagingSeries();
      setShowAddTestModal(false);
    } catch (err: any) {
      alert('Failed to link test: ' + err.message);
    }
  };

  // Toggle Free Preview on linked test
  const handleToggleTestPreview = async (testItem: TestSeriesTest) => {
    if (!managingSeriesId) return;
    try {
      await api.adminUpdateTestInSeries(managingSeriesId, testItem.mockTestId, {
        isFreePreview: !testItem.isFreePreview,
      });
      await refreshManagingSeries();
    } catch (err: any) {
      alert('Failed to update preview setting: ' + err.message);
    }
  };

  // Unlink Test from Series
  const handleUnlinkTest = async (mockTestId: string, title: string) => {
    if (!managingSeriesId) return;
    if (!confirm(`Unlink "${title}" from this test series? The mock test itself will NOT be deleted.`)) {
      return;
    }
    try {
      await api.adminUnlinkTestFromSeries(managingSeriesId, mockTestId);
      await refreshManagingSeries();
    } catch (err: any) {
      alert('Failed to unlink test: ' + err.message);
    }
  };

  // Reorder Tests (Move Up / Down)
  const handleMoveTest = async (currentIndex: number, direction: 'UP' | 'DOWN') => {
    if (!managingSeries || !managingSeries.tests) return;
    const targetIndex = direction === 'UP' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= managingSeries.tests.length) return;

    const newTests = [...managingSeries.tests];
    const temp = newTests[currentIndex];
    newTests[currentIndex] = newTests[targetIndex];
    newTests[targetIndex] = temp;

    // Build ordered list of test IDs
    const orderedIds = newTests.map(t => t.mockTestId);
    try {
      await api.adminReorderTestsInSeries(managingSeries.id, orderedIds);
      await refreshManagingSeries();
    } catch (err: any) {
      alert('Failed to reorder: ' + err.message);
    }
  };

  // Summary Metrics
  const totalPublished = seriesList.filter(s => s.status === 'PUBLISHED').length;
  const totalDraft = seriesList.filter(s => s.status === 'DRAFT').length;
  const totalTestsLinked = seriesList.reduce((acc, s) => acc + (s.totalTests || 0), 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Studio Header */}
      <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Admin Test Series Studio
            </h1>
          </div>
          <p className="text-sm text-stone-500">
            Design exam-specific test series, bundle full simulations and subject tests, set commercial pricing, and grant free preview tests.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Test Series
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Total Series</span>
          <div className="text-2xl font-bold text-stone-900 mt-1">{totalCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Published Active</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{totalPublished}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Drafts</span>
          <div className="text-2xl font-bold text-amber-700 mt-1">{totalDraft}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Total Mock Tests</span>
          <div className="text-2xl font-bold text-indigo-700 mt-1">{totalTestsLinked}</div>
        </div>
      </div>

      {/* Main Layout: Split when Managing Series is Open */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Full: Series Catalog Table */}
        <div className={managingSeriesId ? 'lg:col-span-6 space-y-4' : 'lg:col-span-12 space-y-4'}>
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 flex flex-wrap items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search series name or cycle..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </form>

            <select
              value={selectedExam}
              onChange={e => setSelectedExam(e.target.value)}
              className="px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium"
            >
              <option value="ALL">All Exams</option>
              <option value="BPSC">BPSC</option>
              <option value="UPSC">UPSC</option>
              <option value="JPSC">JPSC</option>
              <option value="UPPSC">UPPSC</option>
              <option value="OTHER">Other</option>
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium"
            >
              <option value="ALL">All Categories</option>
              <option value="PRELIMS">Prelims</option>
              <option value="MAINS">Mains</option>
              <option value="INTEGRATED">Integrated</option>
              <option value="CHAPTER_WISE">Chapter-wise</option>
              <option value="FULL_LENGTH">Full Length</option>
            </select>
          </div>

          {/* Series List View */}
          {loading ? (
            <div className="bg-white rounded-xl border border-stone-200 p-12 text-center text-stone-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
              Loading Test Series...
            </div>
          ) : seriesList.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-stone-300 p-12 text-center">
              <Layers className="w-10 h-10 text-stone-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-stone-800">No test series found</h3>
              <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
                No test series matching your current filter criteria. Create your first exam pack to get started.
              </p>
              <button
                onClick={handleOpenCreate}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Test Series
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {seriesList.map(series => {
                const isManagingThis = managingSeriesId === series.id;
                return (
                  <div
                    key={series.id}
                    className={`bg-white rounded-xl p-4 border transition-all ${
                      isManagingThis
                        ? 'border-indigo-600 ring-2 ring-indigo-50 shadow-md'
                        : 'border-stone-200 hover:border-stone-300 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-stone-100 text-stone-800 border border-stone-200">
                            {series.targetExam}
                          </span>
                          {series.examCycle && (
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              {series.examCycle}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              series.status === 'PUBLISHED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : series.status === 'DRAFT'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {series.status}
                          </span>
                          {series.isFree ? (
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              Free Series
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-stone-50 text-stone-900 border border-stone-200">
                              ₹{series.salePrice}
                              {series.mrp > series.salePrice && (
                                <span className="text-stone-400 line-through ml-1 font-normal">₹{series.mrp}</span>
                              )}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-stone-900 truncate">{series.name}</h3>
                        {series.description && (
                          <p className="text-xs text-stone-500 line-clamp-2 mt-0.5">{series.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-stone-500">
                          <span className="flex items-center gap-1 font-medium text-stone-700">
                            <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
                            {series.totalTests || 0} Tests
                          </span>
                          <span className="flex items-center gap-1 font-medium text-emerald-700">
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            {series.previewTestCount || 0} Free Preview
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-stone-400" />
                            {series.durationDays || 180} Days Validity
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleOpenManageTests(series.id)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                            isManagingThis
                              ? 'bg-indigo-600 text-white'
                              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5" />
                          Manage Tests ({series.totalTests || 0})
                        </button>

                        <button
                          onClick={() => handleOpenEdit(series)}
                          title="Edit Series Details"
                          className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(series)}
                          title={series.status === 'PUBLISHED' ? 'Unpublish (Set to Draft)' : 'Publish Live'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            series.status === 'PUBLISHED'
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteSeries(series)}
                          title="Delete Series"
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Associated Mock Tests Manager (Active Series) */}
        {managingSeriesId && (
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-xl p-5 border border-indigo-200 shadow-sm">
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-stone-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-bold rounded bg-indigo-100 text-indigo-800 uppercase">
                      {managingSeries?.targetExam}
                    </span>
                    <span className="text-xs font-semibold text-stone-500">Managing Tests</span>
                  </div>
                  <h2 className="text-lg font-bold text-stone-900 mt-1">
                    {managingSeries?.name || 'Loading Series...'}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Order tests, toggle free previews, or link new mock tests from the Question Bank.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenAddTestModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Link Mock Test
                  </button>
                  <button
                    onClick={() => {
                      setManagingSeriesId(null);
                      setManagingSeries(null);
                    }}
                    className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Linked Tests List */}
              {loadingManaging ? (
                <div className="py-12 text-center text-stone-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                  Loading linked tests...
                </div>
              ) : !managingSeries || !managingSeries.tests || managingSeries.tests.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-stone-200 rounded-xl my-4">
                  <FileCheck2 className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-stone-700">No mock tests linked yet</p>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto mt-1">
                    Link existing mock simulations to build this test series curriculum.
                  </p>
                  <button
                    onClick={handleOpenAddTestModal}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Link First Test
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-stone-100 my-2">
                  {managingSeries.tests.map((item, index) => {
                    const testInfo = item.mockTest;
                    return (
                      <div key={item.id || item.mockTestId} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {item.sequenceNumber || index + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-stone-900 truncate">
                                {testInfo?.title || `Mock Test #${item.mockTestId.slice(0, 8)}`}
                              </span>
                              {item.isFreePreview ? (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                  Free Preview
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-stone-100 text-stone-600 shrink-0">
                                  Enrolled Only
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-500 flex items-center gap-3 mt-0.5">
                              {testInfo?.type && (
                                <span className="capitalize">{testInfo.type.toLowerCase().replace('_', ' ')}</span>
                              )}
                              <span>{testInfo?.totalQuestions || 150} Questions</span>
                              <span>{testInfo?.durationMinutes || 120} Mins</span>
                            </div>
                          </div>
                        </div>

                        {/* Controls: Preview Toggle, Reorder, Unlink */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleToggleTestPreview(item)}
                            title={item.isFreePreview ? 'Revoke Free Preview' : 'Make Free Preview'}
                            className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors ${
                              item.isFreePreview
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            {item.isFreePreview ? 'Preview On' : 'Set Preview'}
                          </button>

                          <div className="flex flex-col">
                            <button
                              disabled={index === 0}
                              onClick={() => handleMoveTest(index, 'UP')}
                              className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30"
                              title="Move Up"
                            >
                              <MoveUp className="w-3 h-3" />
                            </button>
                            <button
                              disabled={index === (managingSeries.tests?.length || 0) - 1}
                              onClick={() => handleMoveTest(index, 'DOWN')}
                              className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30"
                              title="Move Down"
                            >
                              <MoveDown className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => handleUnlinkTest(item.mockTestId, testInfo?.title || 'Mock Test')}
                            className="p-1.5 text-stone-400 hover:text-red-600 rounded"
                            title="Unlink from series"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Link Available Mock Tests */}
      {showAddTestModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl border border-stone-200">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900">Link Mock Tests to Series</h3>
                <p className="text-xs text-stone-500">
                  Select available mock tests that match {managingSeries?.targetExam} to include in this series pack.
                </p>
              </div>
              <button
                onClick={() => setShowAddTestModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search and preview toggle options */}
            <div className="p-4 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3 bg-stone-50">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={availableTestsSearch}
                  onChange={e => {
                    setAvailableTestsSearch(e.target.value);
                    loadAvailableTests(e.target.value);
                  }}
                  placeholder="Filter available mock tests by title..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                <input
                  type="checkbox"
                  checked={testToLinkIsFreePreview}
                  onChange={e => setTestToLinkIsFreePreview(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Mark as Free Preview Test
              </label>
            </div>

            {/* Available Tests List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {loadingAvailableTests ? (
                <div className="py-12 text-center text-stone-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                  Loading tests from library...
                </div>
              ) : availableTests.length === 0 ? (
                <div className="py-12 text-center text-stone-500 text-xs">
                  No unlinked mock tests found matching this exam. You can build new tests in the Mock Test Builder.
                </div>
              ) : (
                availableTests.map(test => (
                  <div
                    key={test.id}
                    className="p-3 rounded-lg border border-stone-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-800 uppercase">
                          {test.targetExam || 'EXAM'}
                        </span>
                        <h4 className="text-xs font-bold text-stone-900 truncate">{test.title}</h4>
                      </div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-3 mt-1">
                        <span>{test.totalQuestions} Questions</span>
                        <span>{test.durationMinutes} Mins</span>
                        <span>{test.type || 'MOCK'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleLinkTest(test.id)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold shrink-0 transition-colors"
                    >
                      + Add to Series
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create or Edit Test Series */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-xl border border-stone-200">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900">
                {editingSeries ? 'Edit Test Series' : 'Create New Test Series'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSeries} className="p-5 overflow-y-auto space-y-4 flex-1">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700">
                  {formError}
                </div>
              )}

              {/* Title & Target Exam */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Series Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., BPSC 71st Prelims Full Test Series"
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Target Exam *</label>
                  <select
                    value={formData.targetExam}
                    onChange={e => setFormData({ ...formData, targetExam: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                  >
                    <option value="BPSC">BPSC</option>
                    <option value="UPSC">UPSC</option>
                    <option value="JPSC">JPSC</option>
                    <option value="UPPSC">UPPSC</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {/* Exam Cycle & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Exam Cycle / Year</label>
                  <input
                    type="text"
                    value={formData.examCycle}
                    onChange={e => setFormData({ ...formData, examCycle: e.target.value })}
                    placeholder="e.g., 71st BPSC 2026"
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                  >
                    <option value="PRELIMS">Prelims</option>
                    <option value="MAINS">Mains</option>
                    <option value="INTEGRATED">Integrated (Prelims + Mains)</option>
                    <option value="CHAPTER_WISE">Chapter-wise Sectional</option>
                    <option value="FULL_LENGTH">Full Length Simulations</option>
                  </select>
                </div>
              </div>

              {/* Commercial Pricing: Free toggle, MRP, Sale Price */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800">Commercial Pricing & Access</span>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                    <input
                      type="checkbox"
                      checked={formData.isFree}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          isFree: e.target.checked,
                          salePrice: e.target.checked ? 0 : formData.salePrice,
                        })
                      }
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    Free Series (₹0)
                  </label>
                </div>

                {!formData.isFree && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">MRP (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.mrp}
                        onChange={e => setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 text-sm bg-white border border-stone-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">Sale Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.salePrice}
                        onChange={e => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 text-sm bg-white border border-stone-200 rounded-lg font-bold text-indigo-700"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Duration Days & Language */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.durationDays}
                    onChange={e => setFormData({ ...formData, durationDays: parseInt(e.target.value, 10) || 180 })}
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Medium / Language</label>
                  <input
                    type="text"
                    value={formData.language}
                    onChange={e => setFormData({ ...formData, language: e.target.value })}
                    placeholder="e.g. English / Hindi"
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Description / Syllabus Overview</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details on test series coverage, number of sectional tests, full length tests, and negative marking pattern..."
                  className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Publishing Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg font-semibold"
                >
                  <option value="DRAFT">DRAFT (Internal only)</option>
                  <option value="PUBLISHED">PUBLISHED (Visible in Learner Marketplace)</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingSeries ? 'Save Changes' : 'Create Series'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
