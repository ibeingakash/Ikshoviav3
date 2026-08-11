import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Target,
  CheckCircle2,
  ArrowRight,
  Newspaper,
  FileText,
  BarChart3,
  Bot,
  UserCheck,
  Compass,
  Zap,
  HelpCircle,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const { login } = useAuth();
  const [activePreviewTab, setActivePreviewTab] = useState<'graph' | 'tutor' | 'pyq' | 'affairs'>('tutor');

  const handleDemoLogin = async (role: 'USER' | 'ADMIN' | 'SUPER_ADMIN') => {
    let email = 'student@ikshovia.com';
    if (role === 'ADMIN') email = 'admin@ikshovia.com';
    if (role === 'SUPER_ADMIN') email = 'superadmin@ikshovia.com';
    await login(email, 'password', role);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Brand Ribbon */}
      <div className="h-1 w-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500" />

      {/* Public Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-rose-900/20">
            I
          </div>
          <div>
            <div className="text-lg font-black tracking-tight text-white flex items-center gap-1.5 font-serif">
              <span>IKSHOVIA</span>
              <span className="text-[10px] uppercase font-mono tracking-widest bg-rose-950/80 border border-rose-800/80 text-rose-300 px-2 py-0.5 rounded-md font-sans">
                v3.0
              </span>
            </div>
            <div className="text-[10px] font-medium text-slate-400 font-sans tracking-wide">
              Personal Learning Intelligence
            </div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <a href="#features" className="hover:text-rose-300 transition-colors">Features</a>
          <a href="#architecture" className="hover:text-rose-300 transition-colors">How It Works</a>
          <a href="#preview" className="hover:text-rose-300 transition-colors">Platform Preview</a>
          <a href="#provenance" className="hover:text-rose-300 transition-colors">Source Provenance</a>
        </nav>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onOpenAuth('login')}
            className="text-xs font-bold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 transition-all"
          >
            Log In
          </button>
          <button
            onClick={() => onOpenAuth('register')}
            className="text-xs font-bold text-white px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 shadow-md shadow-rose-950 transition-all flex items-center gap-1.5"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-8 py-16 sm:py-24 max-w-6xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          <span>Next-Generation Cognitive Tracking for Competitive Exams</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight font-serif max-w-4xl mx-auto leading-tight sm:leading-none">
          Personal Learning Intelligence <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-400">
            That Understands How You Learn.
          </span>
        </h1>

        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          IKSHOVIA continuously maps your concept mastery, predicts retention decay, diagnoses mistake causes, and delivers real-time AI guidance grounded in verified civil services syllabus standards.
        </p>

        {/* Primary CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onOpenAuth('register')}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-indigo-600 to-rose-600 hover:opacity-95 text-white font-extrabold text-sm shadow-xl shadow-rose-950/50 transition-all flex items-center gap-2"
          >
            <span>Begin Your Learning Journey</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenAuth('login')}
            className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-extrabold text-sm transition-all"
          >
            Access Existing Account
          </button>
        </div>

        {/* Quick Testing Identities Banner */}
        <div className="pt-8 border-t border-slate-800/80 max-w-3xl mx-auto space-y-3">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Instant Demo Access (Test Authentic User Roles)</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => handleDemoLogin('USER')}
              className="text-xs font-semibold bg-indigo-950/80 border border-indigo-800 hover:bg-indigo-900 text-indigo-200 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5"
            >
              <div className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>Learner (Akash)</span>
            </button>

            <button
              onClick={() => handleDemoLogin('ADMIN')}
              className="text-xs font-semibold bg-rose-950/80 border border-rose-800 hover:bg-rose-900 text-rose-200 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5"
            >
              <div className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Admin (Akash Singh)</span>
            </button>

            <button
              onClick={() => handleDemoLogin('SUPER_ADMIN')}
              className="text-xs font-semibold bg-amber-950/80 border border-amber-800 hover:bg-amber-900 text-amber-200 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5"
            >
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Super Admin (Akash Pratap Singh)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Product Pillars / Core Features */}
      <section id="features" className="px-4 sm:px-8 py-16 bg-slate-900/50 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-serif">
              Built for Serious Civil Services Aspirants
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Moving beyond traditional static learning into continuous, adaptive cognitive coaching.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-rose-900/60 transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-800/80 flex items-center justify-center text-rose-400">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Adaptive Knowledge Graph</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Visualizes prerequisites, core concepts, and subject dependencies with real-time mastery heatmaps.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-indigo-900/60 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800/80 flex items-center justify-center text-indigo-400">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Context-Grounded AI Tutor</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Engages in multi-turn concept clarification, step-by-step pyq walkthroughs, and exam trap breakdowns.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-emerald-900/60 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Retention Decay Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calculates memory stability curves for each topic to automatically schedule revision before retention drops.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-amber-900/60 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800/80 flex items-center justify-center text-amber-400">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Mistake Diagnostic Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Categorizes every practice error into Conceptual Gap, Memory Slip, or Distractor Trap to target exact fixes.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-rose-900/60 transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-800/80 flex items-center justify-center text-rose-400">
                <Newspaper className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Source-Backed Current Affairs</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Daily date-wise news articles linked to static syllabus concepts with direct primary government provenance.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-indigo-900/60 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800/80 flex items-center justify-center text-indigo-400">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Verified PYQ Repository</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Official UPSC CSE and State PSC past papers with official answer keys, difficulty tags, and solution guides.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Architecture & How It Works */}
      <section id="architecture" className="px-4 sm:px-8 py-16 max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-serif">
            How IKSHOVIA Guides Your Preparation
          </h2>
          <p className="text-xs text-slate-400">Four steps from diagnostic assessment to exam readiness</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-2 text-center">
            <div className="text-xl font-black text-rose-400 font-mono">01</div>
            <h4 className="text-xs font-bold text-white">Syllabus & Goal Setup</h4>
            <p className="text-[11px] text-slate-400">Configure target exam (UPSC CSE/BPSC/UPPCS) and target date.</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-2 text-center">
            <div className="text-xl font-black text-indigo-400 font-mono">02</div>
            <h4 className="text-xs font-bold text-white">Concept Diagnosis</h4>
            <p className="text-[11px] text-slate-400">Solve diagnostic PYQs and let the engine assess baseline knowledge.</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-2 text-center">
            <div className="text-xl font-black text-amber-400 font-mono">03</div>
            <h4 className="text-xs font-bold text-white">Targeted Remediation</h4>
            <p className="text-[11px] text-slate-400">Receive Next-Best-Action recommendations for high-yield gaps.</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-2 text-center">
            <div className="text-xl font-black text-emerald-400 font-mono">04</div>
            <h4 className="text-xs font-bold text-white">Spaced Decay Revision</h4>
            <p className="text-[11px] text-slate-400">Automatically trigger revision cards before memory decay sets in.</p>
          </div>
        </div>
      </section>

      {/* Platform Interactive Sandbox Preview */}
      <section id="preview" className="px-4 sm:px-8 py-16 bg-slate-900/60 border-t border-slate-800">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-2xl font-extrabold text-white font-serif">Platform Interface Preview</h2>
              <p className="text-xs text-slate-400">Explore how IKSHOVIA organizes intelligence for learners</p>
            </div>

            {/* Preview Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActivePreviewTab('tutor')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  activePreviewTab === 'tutor' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                AI Tutor Interface
              </button>
              <button
                onClick={() => setActivePreviewTab('graph')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  activePreviewTab === 'graph' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Knowledge Graph
              </button>
              <button
                onClick={() => setActivePreviewTab('pyq')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  activePreviewTab === 'pyq' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Verified PYQ Bank
              </button>
              <button
                onClick={() => setActivePreviewTab('affairs')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  activePreviewTab === 'affairs' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Current Affairs
              </button>
            </div>
          </div>

          {/* Interactive Preview Container */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
            {activePreviewTab === 'tutor' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Bot className="w-5 h-5 text-rose-400" />
                  <span className="text-sm font-bold text-white">IKSHOVIA AI Tutor — Interactive Concept Dialogue</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full ml-auto">
                    Context-Grounded
                  </span>
                </div>
                <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                  <div className="bg-indigo-950/60 border border-indigo-800/80 p-3 rounded-xl text-xs text-indigo-200">
                    <span className="font-bold">Aspirant Prompt:</span> "Can you explain the distinction between Article 32 and Article 226 writ jurisdiction for UPSC Prelims?"
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-xs text-slate-200 leading-relaxed space-y-2">
                    <p className="font-bold text-rose-300">IKSHOVIA AI Tutor:</p>
                    <p>Here is the high-yield distinction required for UPSC CSE:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                      <li><strong>Article 32:</strong> A Fundamental Right itself (Part III). Supreme Court can issue writs <em>only for Fundamental Rights enforcement</em>.</li>
                      <li><strong>Article 226:</strong> A Constitutional power (Part VI). High Courts can issue writs for FRs <em>and for any other legal purpose</em> (broader scope).</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'graph' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Brain className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm font-bold text-white">Knowledge Graph & Mastery Distribution</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-900 p-4 rounded-xl border border-emerald-800/60 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">Indian Polity</span>
                    <div className="text-lg font-black text-white">82% Mastery</div>
                    <p className="text-[11px] text-slate-400">Article 32, Fundamental Rights, Judiciary</p>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-amber-800/60 space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 uppercase">Indian Economy</span>
                    <div className="text-lg font-black text-white">64% Mastery</div>
                    <p className="text-[11px] text-slate-400">16th Finance Commission, Monetary Policy</p>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-rose-800/60 space-y-1">
                    <span className="text-[10px] font-bold text-rose-400 uppercase">Science & Tech</span>
                    <div className="text-lg font-black text-white">48% Mastery</div>
                    <p className="text-[11px] text-slate-400">ISRO NGLV, Semi-cryogenic Engines</p>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'pyq' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-bold text-white">Verified UPSC CSE PYQ Record</span>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-amber-300">UPSC CSE 2023 Prelims (Q.42)</span>
                    <span className="text-emerald-400 font-medium">Official Answer Key Verified</span>
                  </div>
                  <p className="text-xs text-white font-medium">
                    "With reference to the Finance Bill and Appropriation Bill in Indian Parliament, consider the following statements..."
                  </p>
                </div>
              </div>
            )}

            {activePreviewTab === 'affairs' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Newspaper className="w-5 h-5 text-rose-400" />
                  <span className="text-sm font-bold text-white">Source-Backed Current Affair Article</span>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-rose-300">Polity & Governance</span>
                    <span className="text-slate-400 font-mono">Press Information Bureau (PIB)</span>
                  </div>
                  <h4 className="text-xs font-bold text-white">Supreme Court Clarifies Limits of Advisory Judgments & Article 226 Writs</h4>
                  <p className="text-[11px] text-slate-300">
                    Linked to Static Concept: Article 226 High Court Jurisdiction.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-950 border-t border-slate-800 px-4 sm:px-8 py-8 text-center text-xs text-slate-500 space-y-4">
        <div className="flex items-center justify-center gap-2 text-slate-300 font-serif font-bold text-base">
          <span>IKSHOVIA</span>
          <span className="text-[10px] font-sans font-normal text-slate-400">
            Personal Learning Intelligence
          </span>
        </div>
        <p className="max-w-md mx-auto text-slate-400">
          An AI-first learning architecture engineered for civil services examination excellence.
        </p>
        <div className="text-[11px] text-slate-600">
          © {new Date().getFullYear()} IKSHOVIA. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
