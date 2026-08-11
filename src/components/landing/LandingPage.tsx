import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Newspaper,
  FileText,
  Bot,
  Activity,
  TrendingUp,
  Clock,
  AlertTriangle,
  Network,
  GitFork,
  Target,
  RotateCcw,
  BarChart3,
  CheckCircle2,
  Zap,
  Eye,
  Search,
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const [activePreviewTab, setActivePreviewTab] = useState<'tutor' | 'graph' | 'pyq' | 'affairs' | 'revision'>('tutor');

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#0B1933] flex flex-col font-sans selection:bg-[#D99A16] selection:text-white">
      {/* Top Academic Ribbon Accent */}
      <div className="h-1 w-full bg-gradient-to-r from-[#0B1933] via-[#D99A16] to-[#5B5CE2]" />

      {/* Public Navbar */}
      <header className="sticky top-0 z-40 bg-[#FAF9F5]/90 backdrop-blur-md border-b border-[#0B1933]/10 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0B1933] flex items-center justify-center text-[#E7A91A] font-serif font-bold text-lg shadow-sm border border-[#D99A16]/30">
            I
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-[#0B1933] flex items-center gap-2 font-serif">
              <span>IKSHOVIA</span>
              <span className="text-[10px] uppercase font-mono tracking-widest bg-[#0B1933]/5 text-[#5B5CE2] border border-[#5B5CE2]/20 px-2 py-0.5 rounded-md font-sans font-bold">
                v3.0
              </span>
            </div>
            <div className="text-[10px] font-medium text-slate-500 font-sans tracking-wide">
              Personal Learning Intelligence
            </div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-700">
          <a href="#intelligence" className="hover:text-[#0B1933] transition-colors">Learning Intelligence</a>
          <a href="#loop" className="hover:text-[#0B1933] transition-colors">Intelligence Loop</a>
          <a href="#features" className="hover:text-[#0B1933] transition-colors font-medium">Features</a>
          <a href="#preview" className="hover:text-[#0B1933] transition-colors">Platform Preview</a>
          <a href="#architecture" className="hover:text-[#0B1933] transition-colors">How It Works</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenAuth('login')}
            className="text-xs font-bold text-[#0B1933] hover:bg-[#0B1933]/5 px-4 py-2 rounded-xl border border-[#0B1933]/20 transition-all cursor-pointer"
          >
            Log In
          </button>
          <button
            onClick={() => onOpenAuth('register')}
            className="text-xs font-bold text-white px-4 py-2 rounded-xl bg-[#0B1933] hover:bg-[#101C35] shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#E7A91A]" />
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative px-4 sm:px-8 pt-10 pb-16 sm:py-20 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Headline & Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0B1933]/5 border border-[#0B1933]/10 text-[#0B1933] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#D99A16]" />
              <span>Next-Generation Learning Intelligence Architecture</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-normal text-[#0B1933] tracking-tight leading-[1.12]">
              Personal Learning <br className="hidden sm:inline" />
              <span className="font-bold">Intelligence</span> <br />
              <span className="italic text-[#D99A16]">
                That Understands How You Learn.
              </span>
            </h1>

            <p className="text-slate-600 text-base sm:text-lg max-w-xl leading-relaxed">
              IKSHOVIA continuously understands what you know, what you forget, why you make mistakes, and what you should learn next.
            </p>

            {/* Public CTAs ONLY */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onOpenAuth('register')}
                className="px-6 py-3.5 rounded-xl bg-[#0B1933] hover:bg-[#101C35] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Begin Your Learning Journey</span>
                <ArrowRight className="w-4 h-4 text-[#E7A91A]" />
              </button>

              <a
                href="#architecture"
                className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-[#0B1933] border border-[#0B1933]/20 font-bold text-xs sm:text-sm shadow-sm transition-all"
              >
                See How It Works
              </a>
            </div>

            {/* Value Badges */}
            <div className="pt-6 border-t border-[#0B1933]/10 flex flex-wrap items-center gap-6 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Source-Grounded Verification</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Memory Decay Prediction</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Diagnostic Error Taxonomy</span>
              </div>
            </div>
          </div>

          {/* Right Column: "Learning Intelligence Engine" Node Diagram */}
          <div className="lg:col-span-5 relative">
            <div className="bg-white border border-[#0B1933]/10 rounded-2xl p-6 shadow-xl space-y-5 relative overflow-hidden">
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#D99A16]" />
                  <span className="text-xs font-bold text-[#0B1933] font-serif">Learning Intelligence Engine</span>
                </div>
                <span className="text-[10px] font-mono font-semibold bg-indigo-50 text-[#5B5CE2] border border-indigo-200 px-2 py-0.5 rounded-md">
                  Active Cognitive Model
                </span>
              </div>

              {/* Connected Intelligence Nodes Grid */}
              <div className="space-y-3 relative">
                
                {/* Node 1: UNDERSTAND */}
                <div className="p-3 rounded-xl bg-[#FAF9F5] border border-slate-200/90 space-y-1 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#5B5CE2] uppercase tracking-wider">01. UNDERSTAND</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      Concept Mastery: 88%
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#0B1933]">What You Know</div>
                  <p className="text-[11px] text-slate-500">
                    Real-time knowledge graph mapping prerequisite links & syllabus topics.
                  </p>
                </div>

                {/* Node 2: DETECT */}
                <div className="p-3 rounded-xl bg-[#FAF9F5] border border-amber-200/90 space-y-1 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#D99A16] uppercase tracking-wider">02. DETECT</span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      Retention Decay Risk
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#0B1933]">What You Forget</div>
                  <p className="text-[11px] text-slate-500">
                    Ebbinghaus retention curve predicts memory drop before threshold.
                  </p>
                </div>

                {/* Node 3: DIAGNOSE */}
                <div className="p-3 rounded-xl bg-[#FAF9F5] border border-rose-200/90 space-y-1 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-rose-600 uppercase tracking-wider">03. DIAGNOSE</span>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                      Conceptual Gap
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#0B1933]">Why You Make Mistakes</div>
                  <p className="text-[11px] text-slate-500">
                    Categorizes errors into Conceptual Gap, Memory Slip, or Distractor Trap.
                  </p>
                </div>

                {/* Node 4: GUIDE */}
                <div className="p-3.5 rounded-xl bg-[#0B1933] text-white space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#E7A91A]">
                      <Bot className="w-4 h-4 text-[#E7A91A]" />
                      <span>04. GUIDE — Next Best Action</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">5 Mins</span>
                  </div>
                  <p className="text-[11px] text-slate-200 leading-relaxed">
                    "Review <em>Article 32 Writ Jurisdiction</em> flashcards to patch a memory slip before solving 2023 PYQs."
                  </p>
                </div>

              </div>

              {/* Decorative Glow */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#5B5CE2]/5 rounded-full blur-2xl pointer-events-none" />
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2: THE INTELLIGENCE LOOP */}
      <section id="loop" className="bg-[#0B1933] text-white py-16 sm:py-24 px-4 sm:px-8 relative overflow-hidden">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-[#E7A91A] text-xs font-mono font-medium">
              <span>The Cognitive Architecture</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold font-serif text-white tracking-tight">
              A Continuous Model of the Learner's Mind
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Standard study tools deliver static content. IKSHOVIA builds a dynamic, continuously updating model of how your brain acquires, retains, and applies civil services knowledge.
            </p>
          </div>

          {/* 5-Step Intelligence Loop Diagram */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-3 relative">
              <div className="w-8 h-8 rounded-lg bg-[#5B5CE2]/20 border border-[#5B5CE2]/40 flex items-center justify-center text-[#5B5CE2] font-mono font-bold text-xs">
                01
              </div>
              <h3 className="text-sm font-bold text-white font-serif">UNDERSTAND</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Maps your precise concept mastery across static topics, current affairs, and prerequisites.
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-3 relative">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[#E7A91A] font-mono font-bold text-xs">
                02
              </div>
              <h3 className="text-sm font-bold text-white font-serif">DETECT</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tracks Ebbinghaus retention curves to detect memory decay before performance drops.
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-3 relative">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-mono font-bold text-xs">
                03
              </div>
              <h3 className="text-sm font-bold text-white font-serif">DIAGNOSE</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Diagnoses root causes of practice errors — separating concept gaps from distractor traps.
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-3 relative">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs">
                04
              </div>
              <h3 className="text-sm font-bold text-white font-serif">PREDICT</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Predicts exam readiness and calibrates subjective confidence against objective accuracy.
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-3 relative">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-mono font-bold text-xs">
                05
              </div>
              <h3 className="text-sm font-bold text-white font-serif">GUIDE</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Generates real-time Next-Best-Action recommendations targeting your highest-yield gaps.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 3: FEATURES GRID */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-8 bg-[#FAF9F5]">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1933] font-serif">
              Everything You Need. Powered by Learning Intelligence.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              A unified, source-backed learning environment built for serious civil services aspirants.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-white border border-[#0B1933]/10 p-5 rounded-2xl space-y-2.5 shadow-sm hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-xl bg-[#5B5CE2]/10 border border-[#5B5CE2]/20 flex items-center justify-center text-[#5B5CE2]">
                <Bot className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#0B1933] font-serif">AI Tutor</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Context-grounded multi-turn concept clarification, step-by-step PYQ walkthroughs, and trap breakdowns.
              </p>
            </div>

            <div className="bg-white border border-[#0B1933]/10 p-5 rounded-2xl space-y-2.5 shadow-sm hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-xl bg-[#0B1933]/5 border border-[#0B1933]/10 flex items-center justify-center text-[#0B1933]">
                <Target className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#0B1933] font-serif">Practice Intelligence</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Adaptive practice sets with confidence calibration ratings and statement-based eliminations.
              </p>
            </div>

            <div className="bg-white border border-[#0B1933]/10 p-5 rounded-2xl space-y-2.5 shadow-sm hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-xl bg-[#D99A16]/10 border border-[#D99A16]/20 flex items-center justify-center text-[#D99A16]">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#0B1933] font-serif">Mistake Analysis</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Diagnostic error taxonomy that isolates conceptual gaps, memory slips, and distractor traps.
              </p>
            </div>

            <div className="bg-white border border-[#0B1933]/10 p-5 rounded-2xl space-y-2.5 shadow-sm hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700">
                <RotateCcw className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#0B1933] font-serif">Revision Intelligence</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Memory stability calculations automatically schedule flash revisions before retention decay occurs.
              </p>
            </div>

            <div className="bg-white border border-[#0B1933]/10 p-5 rounded-2xl space-y-2.5 shadow-sm hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-700">
                <Network className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#0B1933] font-serif">Knowledge Graph</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Interactive topic graph displaying prerequisite chains, subject dependencies, and mastery heatmaps.
              </p>
            </div>

            <div className="bg-white border border-[#0B1933]/10 p-5 rounded-2xl space-y-2.5 shadow-sm hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-700">
                <Newspaper className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#0B1933] font-serif">Current Affairs</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Date-wise, source-backed articles mapped directly to static syllabus concepts with PIB & Govt sources.
              </p>
            </div>

            <div className="bg-white border border-[#0B1933]/10 p-5 rounded-2xl space-y-2.5 shadow-sm hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-700">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#0B1933] font-serif">Mains Evaluation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Structured answer evaluation rubric assessing structure, key directives, and syllabus alignment.
              </p>
            </div>

            <div className="bg-white border border-[#0B1933]/10 p-5 rounded-2xl space-y-2.5 shadow-sm hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#0B1933] font-serif">Mock Tests & PYQs</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Official past paper repository with official answer keys, difficulty tags, and solution guides.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 4: PLATFORM INTERFACE PREVIEW */}
      <section id="preview" className="bg-[#0B1933] text-white py-16 sm:py-24 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-2xl font-extrabold text-white font-serif">Platform Interface Preview</h2>
              <p className="text-xs text-slate-400">Explore how IKSHOVIA organizes learning intelligence</p>
            </div>

            {/* Preview Tabs */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActivePreviewTab('tutor')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activePreviewTab === 'tutor' ? 'bg-[#5B5CE2] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                AI Tutor
              </button>
              <button
                onClick={() => setActivePreviewTab('graph')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activePreviewTab === 'graph' ? 'bg-[#5B5CE2] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Knowledge Graph
              </button>
              <button
                onClick={() => setActivePreviewTab('revision')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activePreviewTab === 'revision' ? 'bg-[#5B5CE2] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Revision Queue
              </button>
              <button
                onClick={() => setActivePreviewTab('pyq')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activePreviewTab === 'pyq' ? 'bg-[#5B5CE2] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Verified PYQ Bank
              </button>
              <button
                onClick={() => setActivePreviewTab('affairs')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activePreviewTab === 'affairs' ? 'bg-[#5B5CE2] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Current Affairs
              </button>
            </div>
          </div>

          {/* Interactive Preview Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            {activePreviewTab === 'tutor' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Bot className="w-5 h-5 text-[#E7A91A]" />
                  <span className="text-sm font-bold text-white">IKSHOVIA AI Tutor — Interactive Concept Dialogue</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full ml-auto font-mono">
                    Context-Grounded
                  </span>
                </div>
                <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                  <div className="bg-indigo-950/60 border border-indigo-800/80 p-3 rounded-xl text-xs text-indigo-200">
                    <span className="font-bold">Aspirant Prompt:</span> "Explain the distinction between Article 32 and Article 226 writ jurisdiction for UPSC Prelims."
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-xs text-slate-200 leading-relaxed space-y-2">
                    <p className="font-bold text-[#E7A91A]">IKSHOVIA AI Tutor:</p>
                    <p>Here is the high-yield distinction required for UPSC CSE:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                      <li><strong>Article 32:</strong> A Fundamental Right itself (Part III). Supreme Court issues writs <em>only for Fundamental Rights enforcement</em>.</li>
                      <li><strong>Article 226:</strong> A Constitutional power (Part VI). High Courts issue writs for FRs <em>and any other legal purpose</em>.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'graph' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Brain className="w-5 h-5 text-[#5B5CE2]" />
                  <span className="text-sm font-bold text-white">Knowledge Graph & Concept Mastery</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-900 p-4 rounded-xl border border-emerald-800/60 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono">Indian Polity</span>
                    <div className="text-lg font-black text-white">88% Mastery</div>
                    <p className="text-[11px] text-slate-400">Article 32, Writs, Fundamental Rights</p>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-amber-800/60 space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 uppercase font-mono">Indian Economy</span>
                    <div className="text-lg font-black text-white">64% Mastery</div>
                    <p className="text-[11px] text-slate-400">16th Finance Commission, Monetary Policy</p>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-rose-800/60 space-y-1">
                    <span className="text-[10px] font-bold text-rose-400 uppercase font-mono">Science & Tech</span>
                    <div className="text-lg font-black text-white">48% Mastery</div>
                    <p className="text-[11px] text-slate-400">ISRO NGLV, Cryogenic Engines</p>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'revision' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <RotateCcw className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-white">Memory Decay Revision Queue</span>
                </div>
                <div className="space-y-2">
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-amber-800/60 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">Article 280 Finance Commission Devolution</div>
                      <p className="text-[11px] text-slate-400">Memory Stability: 54% (Decay Risk Detected)</p>
                    </div>
                    <span className="px-3 py-1 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-lg">
                      Revise Today
                    </span>
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
                    <span className="text-emerald-400 font-medium">Official Key Verified</span>
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

      {/* SECTION 5: HOW IT WORKS */}
      <section id="architecture" className="py-16 sm:py-24 px-4 sm:px-8 bg-[#F5F3EC]">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1933] font-serif">
              How IKSHOVIA Guides Your Preparation
            </h2>
            <p className="text-xs text-slate-600">Four structured steps from baseline setup to exam readiness</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-[#0B1933]/10 p-5 rounded-2xl space-y-2 text-center shadow-sm">
              <div className="text-xl font-bold text-[#0B1933] font-serif">01</div>
              <h4 className="text-xs font-bold text-[#0B1933]">Goal & Syllabus Setup</h4>
              <p className="text-[11px] text-slate-600">Configure target civil services examination and target date.</p>
            </div>

            <div className="bg-white border border-[#0B1933]/10 p-5 rounded-2xl space-y-2 text-center shadow-sm">
              <div className="text-xl font-bold text-[#5B5CE2] font-serif">02</div>
              <h4 className="text-xs font-bold text-[#0B1933]">Concept Diagnosis</h4>
              <p className="text-[11px] text-slate-600">Solve diagnostic PYQs and let the engine map baseline knowledge.</p>
            </div>

            <div className="bg-white border border-[#0B1933]/10 p-5 rounded-2xl space-y-2 text-center shadow-sm">
              <div className="text-xl font-bold text-[#D99A16] font-serif">03</div>
              <h4 className="text-xs font-bold text-[#0B1933]">Targeted Remediation</h4>
              <p className="text-[11px] text-slate-600">Receive Next-Best-Action guidance targeting high-yield syllabus gaps.</p>
            </div>

            <div className="bg-white border border-[#0B1933]/10 p-5 rounded-2xl space-y-2 text-center shadow-sm">
              <div className="text-xl font-bold text-emerald-700 font-serif">04</div>
              <h4 className="text-xs font-bold text-[#0B1933]">Spaced Decay Revision</h4>
              <p className="text-[11px] text-slate-600">Automatically trigger flash revisions before memory decay occurs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER & FINAL CTA */}
      <footer className="mt-auto bg-[#0B1933] text-white border-t border-slate-800 px-4 sm:px-8 py-12 text-center space-y-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-2 text-white font-serif font-bold text-xl">
            <div className="w-7 h-7 rounded-lg bg-[#E7A91A] text-[#0B1933] flex items-center justify-center font-bold text-sm font-serif">
              I
            </div>
            <span>IKSHOVIA</span>
          </div>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Personal Learning Intelligence platform engineered for civil services examination excellence.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onOpenAuth('register')}
              className="px-6 py-2.5 rounded-xl bg-[#E7A91A] hover:bg-amber-400 text-[#0B1933] font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Get Started
            </button>
            <button
              onClick={() => onOpenAuth('login')}
              className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer"
            >
              Log In
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 pt-6 border-t border-slate-800">
          © {new Date().getFullYear()} IKSHOVIA. Personal Learning Intelligence. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
