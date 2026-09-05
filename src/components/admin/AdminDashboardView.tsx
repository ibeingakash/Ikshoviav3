import React, { useState, useEffect } from 'react';
import {
  Shield,
  Database,
  FileCheck2,
  Users,
  Upload,
  Layers,
  History,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  BookOpen,
  Zap,
  GraduationCap,
  CreditCard,
  Tag
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useLearner } from '../../context/LearnerContext.js';

export const AdminDashboardView: React.FC = () => {
  const { setActiveSection } = useLearner();

  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminMetrics();
      setMetrics(res);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Canonical Question Bank',
      count: metrics?.totalQuestions || 2480,
      label: 'Verified Syllabus Items',
      icon: Database,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      action: () => setActiveSection('admin-questions'),
      actionLabel: 'Browse Bank',
    },
    {
      title: 'Content Import (OCR)',
      count: metrics?.totalOcrJobs || 42,
      label: 'Official Ingested Papers',
      icon: Upload,
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      action: () => setActiveSection('admin-ocr'),
      actionLabel: 'Open Import Studio',
    },
    {
      title: 'Mock Test Simulations',
      count: metrics?.totalMockTests || 36,
      label: 'Active Commission Mocks',
      icon: FileCheck2,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      action: () => setActiveSection('admin-mock-builder'),
      actionLabel: 'Build Mock Test',
    },
    {
      title: 'Aspirant Community',
      count: metrics?.totalUsers || 1840,
      label: 'Registered Learners',
      icon: Users,
      color: 'text-sky-700 bg-sky-50 border-sky-200',
      action: () => setActiveSection('admin-users'),
      actionLabel: 'Manage Users',
    },
  ];

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto font-sans-editorial">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE6DF] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
              IKSHOVIA Content Operating System
            </span>
            <span className="text-[11px] font-mono text-emerald-700 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Ingestion Services Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-stone-900 mt-1 flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-amber-700" />
            <span>Administration Control Center</span>
          </h1>
          <p className="text-stone-600 text-xs mt-1 font-medium">
            Central orchestration for canonical content, OCR paper ingestion, exam simulation calibration, and candidate analytics.
          </p>
        </div>

        <button
          onClick={loadMetrics}
          className="px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-[#EAE6DF] text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Dashboard</span>
        </button>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-[#EAE6DF] p-5 rounded-2xl space-y-3 shadow-2xs hover:border-amber-300 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl border ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold text-stone-400">
                  #{idx + 1}
                </span>
              </div>

              <div>
                <div className="text-2xl font-serif-editorial font-bold text-stone-900">
                  {loading ? '...' : card.count.toLocaleString()}
                </div>
                <h3 className="text-xs font-bold text-stone-800 mt-0.5">{card.title}</h3>
                <p className="text-[11px] text-stone-500">{card.label}</p>
              </div>

              <button
                onClick={card.action}
                className="w-full pt-2 border-t border-stone-100 text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>{card.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Quick Launchpad & Operational Hubs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Hub 1: Question & Content Operations */}
        <div className="bg-white border border-[#EAE6DF] p-6 rounded-2xl space-y-4 shadow-2xs">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-700" />
            <h2 className="text-sm font-serif-editorial font-bold text-stone-900">
              Content & Questions
            </h2>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed">
            Curate verified question banks, manage subject taxonomy nodes, and review AI drafts.
          </p>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => setActiveSection('admin-questions')}
              className="w-full p-2.5 bg-[#FCFBF9] hover:bg-amber-50 border border-stone-200 rounded-xl text-left text-xs font-bold text-stone-800 flex items-center justify-between transition-all cursor-pointer"
            >
              <span>Question Bank Repository</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
            </button>

            <button
              onClick={() => setActiveSection('admin-content')}
              className="w-full p-2.5 bg-[#FCFBF9] hover:bg-amber-50 border border-stone-200 rounded-xl text-left text-xs font-bold text-stone-800 flex items-center justify-between transition-all cursor-pointer"
            >
              <span>Subjects & Concepts Taxonomy</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
            </button>

            <button
              onClick={() => setActiveSection('admin-current-affairs')}
              className="w-full p-2.5 bg-[#FCFBF9] hover:bg-amber-50 border border-stone-200 rounded-xl text-left text-xs font-bold text-stone-800 flex items-center justify-between transition-all cursor-pointer"
            >
              <span>Current Affairs Editorial Studio</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
            </button>
          </div>
        </div>

        {/* Hub 2: Ingestion & Mock Assemblies */}
        <div className="bg-white border border-[#EAE6DF] p-6 rounded-2xl space-y-4 shadow-2xs">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-indigo-700" />
            <h2 className="text-sm font-serif-editorial font-bold text-stone-900">
              Ingestion & Mock Tests
            </h2>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed">
            Execute 4-mode PDF OCR ingestion, calibrate time limits, and publish exam simulations.
          </p>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => setActiveSection('admin-ocr')}
              className="w-full p-2.5 bg-[#FCFBF9] hover:bg-indigo-50 border border-stone-200 rounded-xl text-left text-xs font-bold text-stone-800 flex items-center justify-between transition-all cursor-pointer"
            >
              <span>Content Import (OCR Studio)</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
            </button>

            <button
              onClick={() => setActiveSection('admin-mock-builder')}
              className="w-full p-2.5 bg-[#FCFBF9] hover:bg-indigo-50 border border-stone-200 rounded-xl text-left text-xs font-bold text-stone-800 flex items-center justify-between transition-all cursor-pointer"
            >
              <span>Mock Test Builder</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
            </button>

            <button
              onClick={() => setActiveSection('admin-import-logs')}
              className="w-full p-2.5 bg-[#FCFBF9] hover:bg-indigo-50 border border-stone-200 rounded-xl text-left text-xs font-bold text-stone-800 flex items-center justify-between transition-all cursor-pointer"
            >
              <span>Ingestion & Publish Logs</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
            </button>
          </div>
        </div>

        {/* Hub 3: System & Security Governance */}
        <div className="bg-white border border-[#EAE6DF] p-6 rounded-2xl space-y-4 shadow-2xs">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-700" />
            <h2 className="text-sm font-serif-editorial font-bold text-stone-900">
              Users & Governance
            </h2>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed">
            Monitor user growth, configure RBAC role access, and review audit telemetry.
          </p>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => setActiveSection('admin-users')}
              className="w-full p-2.5 bg-[#FCFBF9] hover:bg-emerald-50 border border-stone-200 rounded-xl text-left text-xs font-bold text-stone-800 flex items-center justify-between transition-all cursor-pointer"
            >
              <span>User Directory</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
            </button>

            <button
              onClick={() => setActiveSection('super-admin')}
              className="w-full p-2.5 bg-[#FCFBF9] hover:bg-emerald-50 border border-stone-200 rounded-xl text-left text-xs font-bold text-stone-800 flex items-center justify-between transition-all cursor-pointer"
            >
              <span>Super Admin Security Console</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
            </button>
          </div>
        </div>

        {/* Hub 4: Commercial, Entitlements & Coupons */}
        <div className="bg-white border border-[#EAE6DF] p-6 rounded-2xl space-y-4 shadow-2xs">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-700" />
            <h2 className="text-sm font-serif-editorial font-bold text-stone-900">
              Commercial & Access
            </h2>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed">
            Monitor revenue analytics, configure coupons, and oversee subscriber lifecycle access.
          </p>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => setActiveSection('admin-commercial')}
              className="w-full p-2.5 bg-[#FCFBF9] hover:bg-amber-50 border border-stone-200 rounded-xl text-left text-xs font-bold text-stone-800 flex items-center justify-between transition-all cursor-pointer"
            >
              <span>Commercial & Revenue Hub</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
            </button>

            <button
              onClick={() => setActiveSection('admin-coupons')}
              className="w-full p-2.5 bg-[#FCFBF9] hover:bg-amber-50 border border-stone-200 rounded-xl text-left text-xs font-bold text-stone-800 flex items-center justify-between transition-all cursor-pointer"
            >
              <span>Coupons & Offers Manager</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
            </button>

            <button
              onClick={() => setActiveSection('admin-entitlements')}
              className="w-full p-2.5 bg-[#FCFBF9] hover:bg-amber-50 border border-stone-200 rounded-xl text-left text-xs font-bold text-stone-800 flex items-center justify-between transition-all cursor-pointer"
            >
              <span>Course Entitlements & Registry</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
