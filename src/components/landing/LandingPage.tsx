import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Play,
  Check,
  Star,
  Users,
  Menu,
  X,
  Compass,
  TrendingUp,
  AlertTriangle,
  Scale,
  Sun,
  ShieldCheck,
  Award,
  FileCheck2,
  Target,
  Zap,
  BookOpen,
  Bot,
  Brain,
  BarChart3,
  CheckCircle2,
  Mail
} from 'lucide-react';
import { IKLogo } from '../common/IKLogo.js';
import { IKBrandMark } from '../common/IKBrandMark.js';
import { Hero3DDashboard } from './Hero3DDashboard.js';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pricingCycle, setPricingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#111426] flex flex-col font-sans-editorial selection:bg-[#35156B] selection:text-amber-300">
      
      {/* ========================================== */}
      {/* 1. BRAND NAVBAR                            */}
      {/* ========================================== */}
      <header className="sticky top-0 z-50 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Brand Logo & Preferred Symbol */}
          <IKLogo
            onClick={() => onOpenAuth('login')}
            showTagline={true}
            taglineText="Unlock Human Potential Through Understanding"
            size="md"
          />

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-stone-700">
            <a href="#intelligence" className="hover:text-[#35156B] transition-colors">Learning Intelligence</a>
            <a href="#how-it-works" className="hover:text-[#35156B] transition-colors">How It Works</a>
            <a href="#platform" className="hover:text-[#35156B] transition-colors">Platform</a>
            <a href="#features" className="hover:text-[#35156B] transition-colors">Features</a>
            <a href="#ai-system" className="hover:text-[#35156B] transition-colors">AI System</a>
            <a href="#pricing" className="hover:text-[#35156B] transition-colors">Pricing</a>
          </nav>

          {/* Auth Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => onOpenAuth('login')}
              className="p-2 rounded-xl text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
              title="Light Mode Active"
            >
              <Sun className="w-4 h-4 text-amber-700" />
            </button>
            <button
              onClick={() => onOpenAuth('login')}
              className="text-xs font-bold text-stone-800 hover:text-[#35156B] px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              Log In
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="text-xs font-bold text-white px-5 py-2.5 rounded-full bg-[#0C1024] hover:bg-[#121027] border border-amber-500/30 shadow-xs transition-all flex items-center gap-2 cursor-pointer hover:border-amber-400"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-stone-700 hover:text-stone-900 cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-stone-200/80 px-2 space-y-3 animate-fade-in bg-[#FAF7F0]">
            <div className="flex flex-col space-y-2 text-xs font-semibold text-stone-800">
              <a href="#intelligence" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-stone-100">Learning Intelligence</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-stone-100">How It Works</a>
              <a href="#platform" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-stone-100">Platform</a>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-stone-100">Features</a>
              <a href="#ai-system" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-stone-100">AI System</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-stone-100">Pricing</a>
            </div>

            <div className="pt-2 border-t border-stone-200 flex items-center gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('login');
                }}
                className="flex-1 py-2 text-xs font-bold border border-stone-300 rounded-xl text-center text-stone-800"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('register');
                }}
                className="flex-1 py-2 text-xs font-bold bg-[#0C1024] text-amber-400 rounded-xl text-center flex items-center justify-center gap-1.5"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ========================================== */}
      {/* 2. HERO SECTION & 3D FLOATING DASHBOARD    */}
      {/* ========================================== */}
      <section className="relative px-4 sm:px-8 pt-8 sm:pt-12 pb-16 max-w-7xl mx-auto w-full">
        
        {/* Soft Ambient Radial Lighting */}
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-[#35156B]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">
          
          {/* Left Hero Column: Headline & Messaging */}
          <div className="lg:col-span-5 space-y-6 text-left">
            
            {/* AI Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200/80 text-[#35156B]">
              <IKBrandMark size="sm" />
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase">
                AI-POWERED LEARNING PLATFORM
              </span>
            </div>

            {/* HERO HEADLINE */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-[50px] font-serif-editorial font-bold text-[#111426] tracking-tight leading-[1.1]">
                Understand Better. <br />
                Learn Smarter. <br />
                <span className="text-[#35156B] italic">
                  Achieve Greater.
                </span>
              </h1>
            </div>

            {/* HERO SUPPORTING COPY */}
            <p className="text-stone-600 text-xs sm:text-sm max-w-md leading-relaxed font-normal">
              IKSHOVIA is your AI study partner that helps you understand deeply, connect concepts, and master any subject with confidence.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => onOpenAuth('register')}
                className="px-6 py-3.5 rounded-full bg-[#0C1024] hover:bg-[#121027] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer border border-amber-500/30 hover:border-amber-400"
              >
                <span>Start Learning Free</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>

              <a
                href="#platform"
                className="px-6 py-3.5 rounded-full bg-white hover:bg-stone-50 text-stone-800 border border-stone-300/80 font-bold text-xs shadow-2xs transition-all flex items-center gap-2"
              >
                <div className="w-4 h-4 rounded-full bg-stone-100 flex items-center justify-center text-stone-700">
                  <Play className="w-2.5 h-2.5 fill-stone-700 ml-0.5" />
                </div>
                <span>Explore Platform</span>
              </a>
            </div>

            {/* Social Proof Strip */}
            <div className="pt-3 border-t border-stone-200/80 flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-amber-900">
                  A
                </div>
                <div className="w-7 h-7 rounded-full bg-[#0C1024] border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
                  R
                </div>
                <div className="w-7 h-7 rounded-full bg-stone-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-stone-800">
                  P
                </div>
              </div>
              <div className="text-[11px] text-stone-600">
                <div className="font-bold text-stone-900">Dedicated AI Study Partner</div>
                <div className="text-amber-700 font-bold flex items-center gap-1">
                  <span>★ ★ ★ ★ ★</span>
                  <span>4.9/5 Rating</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Hero Column: Signature 3D Floating Dashboard Asset */}
          <div id="platform" className="lg:col-span-7">
            <Hero3DDashboard onInteractiveClick={() => onOpenAuth('register')} />
          </div>

        </div>
      </section>

      {/* ========================================== */}
      {/* 3. TRUSTED BY LEARNERS STRIP               */}
      {/* ========================================== */}
      <section className="py-8 px-4 sm:px-8 bg-white border-y border-stone-200/80">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="text-center">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-stone-500">
              TRUSTED BY LEARNERS PREPARING FOR
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-1">
            <div className="px-4 py-2 bg-[#FAF7F0] border border-stone-200 rounded-xl text-xs font-bold text-stone-800 flex items-center gap-2 hover:border-amber-400 transition-colors">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>UPSC CSE</span>
            </div>

            <div className="px-4 py-2 bg-[#FAF7F0] border border-stone-200 rounded-xl text-xs font-bold text-stone-800 flex items-center gap-2 hover:border-amber-400 transition-colors">
              <Award className="w-4 h-4 text-amber-700" />
              <span>BPSC</span>
            </div>

            <div className="px-4 py-2 bg-[#FAF7F0] border border-stone-200 rounded-xl text-xs font-bold text-stone-800 flex items-center gap-2 hover:border-amber-400 transition-colors">
              <Compass className="w-4 h-4 text-amber-700" />
              <span>STATE PCS</span>
            </div>

            <div className="px-4 py-2 bg-[#FAF7F0] border border-stone-200 rounded-xl text-xs font-bold text-stone-800 flex items-center gap-2 hover:border-amber-400 transition-colors">
              <Zap className="w-4 h-4 text-amber-700" />
              <span>NDA & CDS</span>
            </div>

            <div className="px-4 py-2 bg-[#FAF7F0] border border-stone-200 rounded-xl text-xs font-bold text-stone-800 flex items-center gap-2 hover:border-amber-400 transition-colors">
              <FileCheck2 className="w-4 h-4 text-amber-700" />
              <span>SSC CGL</span>
            </div>

            <div className="px-4 py-2 bg-[#FAF7F0] border border-stone-200 rounded-xl text-xs font-bold text-stone-800 flex items-center gap-2 hover:border-amber-400 transition-colors">
              <Target className="w-4 h-4 text-amber-700" />
              <span>BANKING</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 4. 5 INTELLIGENCE PILLARS (DARK PANEL)     */}
      {/* ========================================== */}
      <section className="py-12 px-4 sm:px-8 bg-[#0C1024] text-white border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="text-center space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
              BUILT FOR DEEP LEARNING
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-white">
              AI that adapts to you.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            <div className="p-4 rounded-xl bg-[#121027] border border-amber-500/20 space-y-2">
              <Compass className="w-5 h-5 text-amber-400" />
              <div className="text-sm font-bold text-white">Learning Intelligence</div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Understands how you learn best and creates a path just for you.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#121027] border border-amber-500/20 space-y-2">
              <Target className="w-5 h-5 text-amber-400" />
              <div className="text-sm font-bold text-white">Adaptive</div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Adapts to your strengths & weaknesses and aligns with your goals.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#121027] border border-amber-500/20 space-y-2">
              <Users className="w-5 h-5 text-amber-400" />
              <div className="text-sm font-bold text-white">Personalized</div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Personal study plan, smart recommendations & curated resources.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#121027] border border-amber-500/20 space-y-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              <div className="text-sm font-bold text-white">Insightful</div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Smart analytics to help you focus on what truly matters.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#121027] border border-amber-500/20 space-y-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <div className="text-sm font-bold text-white">Predictive</div>
              <p className="text-xs text-stone-300 leading-relaxed">
                AI predicts your performance and helps you stay ahead of every exam.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================== */}
      {/* 5. HOW IKSHOVIA WORKS (THE 4 STAGES)       */}
      {/* ========================================== */}
      <section id="how-it-works" className="py-16 px-4 sm:px-8 bg-[#FAF7F0] border-b border-stone-200/80">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#35156B]">
              HOW IKSHOVIA WORKS
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-[#111426]">
              Understand What You Know. Master What You Don't.
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              A continuous 4-stage cognitive loop designed to eliminate study guesswork and drive measurable retention gains.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Stage 1 */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200/90 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-mono font-bold text-xs flex items-center justify-center">
                  01
                </span>
                <Compass className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-[#35156B]">01 — UNDERSTAND</div>
                <h3 className="text-base font-serif-editorial font-bold text-[#111426] mt-0.5">What You Know</h3>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Maps what you actually know, verified across practice attempts, topic depth, and syllabus coverage.
              </p>
            </div>

            {/* Stage 2 */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200/90 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-mono font-bold text-xs flex items-center justify-center">
                  02
                </span>
                <TrendingUp className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-[#35156B]">02 — DETECT</div>
                <h3 className="text-base font-serif-editorial font-bold text-[#111426] mt-0.5">What You're Forgetting</h3>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Calculates memory decay curves to catch retention lapses before they cost you marks in the exam.
              </p>
            </div>

            {/* Stage 3 */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200/90 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-mono font-bold text-xs flex items-center justify-center">
                  03
                </span>
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-[#35156B]">03 — DIAGNOSE</div>
                <h3 className="text-base font-serif-editorial font-bold text-[#111426] mt-0.5">Why You Make Mistakes</h3>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Classifies incorrect responses into conceptual gaps vs factual memory slips vs unconfident guessing.
              </p>
            </div>

            {/* Stage 4 Highlight */}
            <div className="p-6 rounded-2xl bg-amber-50/80 border-2 border-amber-400/80 space-y-4 shadow-md relative overflow-hidden">
              <div className="absolute top-2 right-2 text-amber-400 opacity-20">
                <IKBrandMark size="xl" />
              </div>
              <div className="flex items-center justify-between relative z-10">
                <span className="w-8 h-8 rounded-xl bg-[#0C1024] text-amber-400 font-mono font-bold text-xs flex items-center justify-center border border-amber-500/30">
                  04
                </span>
                <IKBrandMark size="md" glow />
              </div>
              <div className="relative z-10">
                <div className="text-xs font-mono font-bold text-amber-900">04 — GUIDE</div>
                <h3 className="text-base font-serif-editorial font-bold text-[#111426] mt-0.5">What You Should Learn Next</h3>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed relative z-10 font-medium">
                Determines your optimal Next Best Action for every study session, eliminating decision paralysis.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================== */}
      {/* 6. TESTIMONIAL, STATS & AI ASSISTANT CARD  */}
      {/* ========================================== */}
      <section id="ai-system" className="py-16 px-4 sm:px-8 bg-white border-b border-stone-200/80">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            
            {/* Testimonial Quote Card */}
            <div className="p-6 rounded-2xl bg-[#FAF7F0] border border-stone-200 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="text-2xl text-amber-700 font-serif-editorial">“</div>
                <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-serif-editorial">
                  IKSHOVIA changed the way I study. The AI explanations and concept maps are just amazing!
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-stone-200">
                <div className="w-9 h-9 rounded-full bg-[#0C1024] text-amber-400 font-bold font-serif-editorial flex items-center justify-center text-xs">
                  A
                </div>
                <div>
                  <div className="text-xs font-bold text-[#111426]">Ananya Singh</div>
                  <div className="text-[10px] text-stone-500">UPSC Aspirant</div>
                </div>
                <div className="ml-auto text-amber-500 text-xs">★★★★★</div>
              </div>
            </div>

            {/* Empowering Learners Across India Stats */}
            <div className="p-6 rounded-2xl bg-[#0C1024] text-white border border-amber-500/30 flex flex-col justify-between space-y-6">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-serif-editorial font-bold text-white">Empowering Learners Across India</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 rounded-xl bg-[#121027] border border-amber-500/20">
                  <div className="text-xl font-bold text-amber-400 font-mono">100%</div>
                  <div className="text-[10px] text-stone-300">Syllabus Coverage</div>
                </div>

                <div className="p-3 rounded-xl bg-[#121027] border border-amber-500/20">
                  <div className="text-xl font-bold text-amber-400 font-mono">24/7</div>
                  <div className="text-[10px] text-stone-300">AI Tutor Availability</div>
                </div>

                <div className="p-3 rounded-xl bg-[#121027] border border-amber-500/20">
                  <div className="text-xl font-bold text-amber-400 font-mono">100%</div>
                  <div className="text-[10px] text-stone-300">Adaptive AI Intelligence</div>
                </div>

                <div className="p-3 rounded-xl bg-[#121027] border border-amber-500/20">
                  <div className="text-xl font-bold text-amber-400 font-mono">24/7</div>
                  <div className="text-[10px] text-stone-300">AI Support</div>
                </div>
              </div>
            </div>

            {/* AI Assistant Card with 3D Star Trophy Graphic */}
            <div className="p-6 rounded-2xl bg-[#FAF7F0] border border-stone-200 flex flex-col items-center text-center justify-between space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-serif-editorial font-bold text-[#111426]">Your AI Study Assistant</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Get instant answers, explanations & guidance whenever you need.
                </p>
              </div>

              {/* 3D Star Graphic Container */}
              <div className="w-24 h-24 relative flex items-center justify-center">
                <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl pointer-events-none" />
                <IKBrandMark size="xl" glow />
              </div>

              <button
                onClick={() => onOpenAuth('register')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#35156B] hover:bg-[#4B1F78] text-amber-300 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Chat with AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================== */}
      {/* 7. PRICING SECTION                         */}
      {/* ========================================== */}
      <section id="pricing" className="py-16 px-4 sm:px-8 bg-[#FAF7F0] border-b border-stone-200/80">
        <div className="max-w-6xl mx-auto space-y-10">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-[#111426]">
              Simple, Transparent Pricing
            </h2>
            
            {/* Monthly / Yearly Toggle */}
            <div className="inline-flex items-center gap-2 p-1 bg-stone-200/80 rounded-full text-xs font-bold">
              <button
                onClick={() => setPricingCycle('monthly')}
                className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                  pricingCycle === 'monthly' ? 'bg-[#0C1024] text-white shadow-2xs' : 'text-stone-700'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setPricingCycle('yearly')}
                className={`px-4 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                  pricingCycle === 'yearly' ? 'bg-[#0C1024] text-white shadow-2xs' : 'text-stone-700'
                }`}
              >
                <span>Yearly</span>
                <span className="text-[10px] font-mono bg-amber-500/20 text-amber-800 px-1.5 py-0.5 rounded-full">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            
            {/* FREE TIER */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="text-xs font-mono font-bold text-stone-500 uppercase">FREE</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold font-serif-editorial text-[#111426]">₹0</span>
                  <span className="text-xs text-stone-500">/month</span>
                </div>

                <div className="space-y-2 text-xs text-stone-700 pt-2 border-t border-stone-100">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>AI Assistant (Limited)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Smart Notes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>5 Mock Tests / Month</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onOpenAuth('register')}
                className="w-full py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-bold transition-all cursor-pointer"
              >
                Get Started
              </button>
            </div>

            {/* PRO TIER (POPULAR) */}
            <div className="p-6 rounded-2xl bg-[#0C1024] text-white border-2 border-amber-400 flex flex-col justify-between space-y-6 shadow-xl relative">
              <div className="absolute -top-3 right-6 bg-[#C9953C] text-[#0C1024] text-[10px] font-mono font-bold px-3 py-0.5 rounded-full uppercase">
                MOST POPULAR
              </div>

              <div className="space-y-4">
                <div className="text-xs font-mono font-bold text-amber-400 uppercase">PRO</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold font-serif-editorial text-white">
                    {pricingCycle === 'monthly' ? '₹399' : '₹319'}
                  </span>
                  <span className="text-xs text-stone-400">/month</span>
                </div>

                <div className="space-y-2 text-xs text-stone-200 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400" />
                    <span>AI Assistant (Unlimited)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400" />
                    <span>Unlimited Mock Tests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400" />
                    <span>Advanced Analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400" />
                    <span>Priority Support</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onOpenAuth('register')}
                className="w-full py-2.5 rounded-xl bg-[#35156B] hover:bg-[#4B1F78] text-amber-300 text-xs font-bold transition-all shadow-xs cursor-pointer border border-amber-500/30"
              >
                Get Started
              </button>
            </div>

            {/* PREMIUM TIER */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="text-xs font-mono font-bold text-stone-500 uppercase">PREMIUM</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold font-serif-editorial text-[#111426]">
                    {pricingCycle === 'monthly' ? '₹799' : '₹639'}
                  </span>
                  <span className="text-xs text-stone-500">/month</span>
                </div>

                <div className="space-y-2 text-xs text-stone-700 pt-2 border-t border-stone-100">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Everything in Pro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>1-on-1 Mentorship</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Custom Study Plan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Early Access to New Features</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onOpenAuth('register')}
                className="w-full py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-bold transition-all cursor-pointer"
              >
                Get Started
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================== */}
      {/* 8. FINAL CALL TO ACTION BANNER             */}
      {/* ========================================== */}
      <section className="py-16 px-4 sm:px-8 bg-white">
        <div className="max-w-4xl mx-auto rounded-3xl bg-[#0C1024] text-white p-8 sm:p-12 text-center space-y-6 border border-amber-500/30 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(#C9953C_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
          
          <div className="space-y-2 relative z-10">
            <IKBrandMark size="lg" glow className="mx-auto mb-2" />
            <h2 className="text-2xl sm:text-4xl font-serif-editorial font-bold text-white leading-tight">
              Your journey to success starts here.
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-md mx-auto">
              Join thousands of aspirants who are learning smarter, not harder with IKSHOVIA.
            </p>
          </div>

          <div className="pt-2 relative z-10">
            <button
              onClick={() => onOpenAuth('register')}
              className="px-8 py-3.5 rounded-full bg-[#35156B] hover:bg-[#4B1F78] text-amber-300 font-bold text-xs shadow-lg transition-all border border-amber-500/30 cursor-pointer inline-flex items-center gap-2"
            >
              <span>Start Your Journey Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 9. DARK PREMIUM FOOTER                     */}
      {/* ========================================== */}
      <footer className="bg-[#0C1024] text-white border-t border-slate-800 pt-12 pb-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            
            {/* Column 1: Brand & Tagline */}
            <div className="md:col-span-2 space-y-4">
              <IKLogo
                variant="dark"
                showTagline={true}
                taglineText="Unlock Human Potential Through Understanding"
                size="md"
              />
              <p className="text-xs text-stone-400 max-w-sm leading-relaxed">
                IKSHOVIA is the personal AI learning intelligence platform engineered for serious civil services and competitive exam aspirants.
              </p>
            </div>

            {/* Column 2: Product */}
            <div className="space-y-3">
              <div className="text-xs font-mono font-bold text-amber-400 uppercase">PRODUCT</div>
              <ul className="space-y-2 text-xs text-stone-300 font-medium">
                <li><a href="#features" className="hover:text-amber-400 transition-colors">Features</a></li>
                <li><a href="#ai-system" className="hover:text-amber-400 transition-colors">AI Assistant</a></li>
                <li><a href="#platform" className="hover:text-amber-400 transition-colors">Mock Tests</a></li>
                <li><a href="#pricing" className="hover:text-amber-400 transition-colors">Pricing</a></li>
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div className="space-y-3">
              <div className="text-xs font-mono font-bold text-amber-400 uppercase">RESOURCES</div>
              <ul className="space-y-2 text-xs text-stone-300 font-medium">
                <li><a href="#how-it-works" className="hover:text-amber-400 transition-colors">Notes & PYQs</a></li>
                <li><a href="#how-it-works" className="hover:text-amber-400 transition-colors">Current Affairs</a></li>
                <li><a href="#how-it-works" className="hover:text-amber-400 transition-colors">Knowledge Graph</a></li>
                <li><a href="#how-it-works" className="hover:text-amber-400 transition-colors">Exam Guides</a></li>
              </ul>
            </div>

            {/* Column 4: Stay Updated */}
            <div className="space-y-3">
              <div className="text-xs font-mono font-bold text-amber-400 uppercase">STAY UPDATED</div>
              <p className="text-xs text-stone-400 leading-relaxed">
                Get the latest updates and learning tips in your inbox.
              </p>
              <div className="flex items-center gap-1 bg-[#121027] p-1.5 rounded-xl border border-slate-800">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-transparent px-2 text-xs text-white placeholder-stone-500 focus:outline-none w-full"
                />
                <button
                  onClick={() => alert("Subscribed!")}
                  className="p-2 bg-[#35156B] text-amber-300 rounded-lg hover:bg-[#4B1F78] cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-500 gap-4">
            <div>
              © 2026 IKSHOVIA. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-stone-300">Privacy Policy</a>
              <a href="#" className="hover:text-stone-300">Terms of Service</a>
              <a href="#" className="hover:text-stone-300">Contact Support</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};
