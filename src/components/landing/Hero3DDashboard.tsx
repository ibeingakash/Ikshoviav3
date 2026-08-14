import React from 'react';
import {
  Home,
  BookOpen,
  Bot,
  CheckSquare,
  BarChart2,
  Bookmark,
  Settings,
  Search,
  Bell,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Compass,
  GitGraph,
  Sparkles,
  Flame,
  Scale
} from 'lucide-react';
import { IKBrandMark } from '../common/IKBrandMark.js';

interface Hero3DDashboardProps {
  onInteractiveClick?: () => void;
}

export const Hero3DDashboard: React.FC<Hero3DDashboardProps> = ({ onInteractiveClick }) => {
  return (
    <div className="relative w-full max-w-full sm:max-w-4xl mx-auto md:perspective-container py-2 sm:py-4 overflow-hidden sm:overflow-visible">
      {/* Golden Orbital Accent Rings (hidden on small viewports to prevent overflow) */}
      <div className="hidden sm:block orbital-ring w-[105%] h-[105%] -top-[2.5%] -left-[2.5%] opacity-40 border-dashed border-amber-500/30 animate-spin-slow pointer-events-none" />
      <div className="hidden sm:block orbital-ring w-[115%] h-[115%] -top-[7.5%] -left-[7.5%] opacity-20 border-purple-500/20 pointer-events-none" />

      {/* Dark Purple Floating Base Shadow Platform */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[85%] h-16 bg-[#0C1024]/40 rounded-full blur-2xl pointer-events-none" />

      {/* 3D Tilted Floating Dashboard Container */}
      <div
        onClick={onInteractiveClick}
        className="w-full md:dashboard-3d-tilt bg-[#FBF9F4] border border-amber-500/30 rounded-2xl sm:rounded-3xl shadow-2xl p-3 sm:p-5 relative z-10 text-[#111426] cursor-pointer hover:border-amber-400 transition-all group overflow-hidden"
      >
        {/* Top Window Glass Bar */}
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-mono text-stone-400 ml-2">
              ikshovia.app / product-demo-preview
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              PRODUCT DEMO VISUALIZATION
            </span>
          </div>
        </div>

        {/* Dashboard Main Grid Layout (Left Navigation + Main Area) */}
        <div className="grid grid-cols-12 gap-3 sm:gap-4">
          
          {/* Left Mini Sidebar */}
          <div className="col-span-2 sm:col-span-1 bg-[#0C1024] text-white rounded-xl p-2 flex flex-col items-center justify-between py-4 border border-amber-500/20 shadow-md">
            <div className="space-y-4 flex flex-col items-center">
              <div className="p-1 rounded-lg bg-amber-500/20 border border-amber-500/30">
                <IKBrandMark size="sm" glow />
              </div>

              <div className="space-y-3 pt-2 text-stone-400">
                <div className="p-1.5 rounded-lg bg-[#35156B] text-amber-300 shadow-xs">
                  <Home className="w-4 h-4" />
                </div>
                <div className="p-1.5 hover:text-white transition-colors">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="p-1.5 hover:text-white transition-colors">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-1.5 hover:text-white transition-colors">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div className="p-1.5 hover:text-white transition-colors">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div className="p-1.5 hover:text-white transition-colors">
                  <Bookmark className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="p-1.5 text-stone-400 hover:text-white transition-colors">
              <Settings className="w-4 h-4" />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="col-span-10 sm:col-span-11 space-y-3">
            
            {/* Learner Greeting Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-xl border border-stone-200/90 shadow-2xs">
              <div>
                <div className="text-sm sm:text-base font-serif-editorial font-bold text-[#111426] flex items-center gap-1.5">
                  <span>Good Morning, Aspirant!</span>
                  <span className="text-sm">👋</span>
                </div>
                <div className="text-[11px] text-stone-500">
                  Ready to continue your learning journey?
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 bg-[#FAF7F0] px-3 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-500 w-44">
                  <Search className="w-3.5 h-3.5 text-stone-400" />
                  <span className="truncate">Search topics, questions...</span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#FAF7F0] border border-stone-200 text-stone-600 relative">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
                </div>
                <div className="w-7 h-7 rounded-full bg-[#0C1024] text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs font-bold font-serif-editorial">
                  A
                </div>
              </div>
            </div>

            {/* Top 4 Stats Metric Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-xl bg-white border border-stone-200/90 space-y-0.5">
                <div className="text-[10px] text-stone-500 font-medium">Study Hours</div>
                <div className="text-sm sm:text-base font-bold text-[#111426] flex items-center justify-between">
                  <span>24.6h</span>
                  <span className="text-[10px] text-emerald-700 font-mono font-bold">↑ 16%</span>
                </div>
                <div className="text-[9px] text-stone-400">This Week</div>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-stone-200/90 space-y-0.5">
                <div className="text-[10px] text-stone-500 font-medium">Accuracy</div>
                <div className="text-sm sm:text-base font-bold text-[#111426] flex items-center justify-between">
                  <span>82%</span>
                  <span className="text-[10px] text-emerald-700 font-mono font-bold">↑ 12%</span>
                </div>
                <div className="text-[9px] text-stone-400">This Week</div>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-stone-200/90 space-y-0.5">
                <div className="text-[10px] text-stone-500 font-medium">Topics Mastered</div>
                <div className="text-sm sm:text-base font-bold text-[#111426] flex items-center justify-between">
                  <span>128</span>
                  <span className="text-[10px] text-emerald-700 font-mono font-bold">↑ 16%</span>
                </div>
                <div className="text-[9px] text-stone-400">This Week</div>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-stone-200/90 space-y-0.5">
                <div className="text-[10px] text-stone-500 font-medium">Study Streak</div>
                <div className="text-sm sm:text-base font-bold text-[#111426] flex items-center justify-between">
                  <span>32</span>
                  <span className="text-xs">🔥</span>
                </div>
                <div className="text-[9px] text-stone-400">Days Active</div>
              </div>
            </div>

            {/* Middle Grid: 3 Core Intelligence Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              
              {/* 01 Concept Mastery */}
              <div className="p-3 rounded-xl bg-white border border-stone-200/90 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-stone-500 uppercase flex items-center gap-1">
                    <Compass className="w-3 h-3 text-amber-700" />
                    <span>01 • CONCEPT MASTERY</span>
                  </span>
                  <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                    78% High
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div>
                    <div className="flex justify-between text-stone-700 text-[10px]">
                      <span>Polity (Fundamental Rights)</span>
                      <span className="font-bold">85%</span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden mt-0.5">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-stone-700 text-[10px]">
                      <span>Economics (Fiscal Policy)</span>
                      <span className="font-bold">62%</span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden mt-0.5">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '62%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-stone-700 text-[10px]">
                      <span>History (Modern India)</span>
                      <span className="font-bold">74%</span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden mt-0.5">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '74%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 02 Retention Decay */}
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-amber-900 uppercase flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-amber-700" />
                    <span>02 • RETENTION DECAY</span>
                  </span>
                  <span className="text-[9px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                    3 At Risk
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-amber-950 font-bold">
                    Memory Lapses Detected
                  </div>
                  <div className="text-[9px] text-stone-600 leading-tight">
                    Article 32 & Writs Taxonomy retention curve dropping below 50% threshold.
                  </div>

                  <div className="h-8 w-full relative pt-1">
                    <svg className="w-full h-full" viewBox="0 0 100 25" preserveAspectRatio="none">
                      <path d="M 0 5 Q 30 7, 50 16 T 100 24" fill="none" stroke="#D9A441" strokeWidth="2" />
                      <circle cx="50" cy="16" r="3" fill="#35156B" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* 03 Mistake Diagnosis */}
              <div className="p-3 rounded-xl bg-white border border-stone-200/90 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-stone-500 uppercase flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-700" />
                    <span>03 • MISTAKE DIAGNOSIS</span>
                  </span>
                  <span className="text-[9px] font-mono text-stone-400">Last Test</span>
                </div>

                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-stone-800">Conceptual Gap</span>
                    <span className="font-mono text-stone-600 font-bold">45%</span>
                  </div>
                  <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: '45%' }} />
                  </div>

                  <div className="flex justify-between items-center pt-0.5">
                    <span className="font-bold text-stone-800">Factual Slip</span>
                    <span className="font-mono text-stone-600 font-bold">35%</span>
                  </div>
                  <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '35%' }} />
                  </div>

                  <div className="flex justify-between items-center pt-0.5">
                    <span className="font-bold text-stone-800">Time Pressure</span>
                    <span className="font-mono text-stone-600 font-bold">20%</span>
                  </div>
                  <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-400 rounded-full" style={{ width: '20%' }} />
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Row: Knowledge Graph + Guided Next Best Action */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* Knowledge Graph Card */}
              <div className="p-3 rounded-xl bg-white border border-stone-200/90 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-stone-500 uppercase flex items-center gap-1">
                    <GitGraph className="w-3 h-3 text-amber-700" />
                    <span>04 • KNOWLEDGE GRAPH</span>
                  </span>
                  <span className="text-[9px] font-mono text-stone-400">Connected</span>
                </div>

                <div className="h-20 bg-[#0C1024] rounded-lg p-2 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#D9A441_1px,transparent_1px)] [background-size:12px_12px]" />
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#35156B] border border-amber-400 text-white flex items-center justify-center shadow-xs">
                      <IKBrandMark size="sm" />
                    </div>
                    <div className="text-left space-y-0.5">
                      <div className="text-[10px] font-bold text-white">Article 32 Writs</div>
                      <div className="text-[9px] text-amber-300">Linked: Fundamental Rights & SC Jurisdiction</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guided Next Best Action Card */}
              <div className="p-3 rounded-xl bg-[#0C1024] text-white border border-amber-500/30 space-y-2 flex flex-col justify-between shadow-md">
                <div className="space-y-1">
                  <div className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <Scale className="w-3 h-3 text-amber-400" />
                    <span>GUIDED NEXT BEST ACTION</span>
                  </div>
                  <div className="text-xs font-bold text-white">
                    Review Article 32 & Writs Taxonomy
                  </div>
                  <div className="text-[9px] text-stone-300">
                    Highest-yield task to restore memory decay • Yield: <strong className="text-amber-300">+8% Recall</strong>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-end">
                  <div className="px-3 py-1.5 rounded-lg bg-[#35156B] hover:bg-[#4B1F78] text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                    <span>Execute Guidance</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Floating Ask AI Input */}
            <div className="bg-[#0C1024] text-white p-2.5 rounded-xl border border-amber-500/30 flex items-center justify-between gap-2 shadow-lg">
              <div className="flex items-center gap-2 text-stone-400 text-xs pl-2">
                <Bot className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] text-stone-300">Ask AI anything about your studies...</span>
              </div>
              <div className="p-1.5 rounded-lg bg-[#35156B] text-amber-400 hover:bg-[#4B1F78] transition-colors cursor-pointer">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
