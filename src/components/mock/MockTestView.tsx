import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Clock,
  Award,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  SlidersHorizontal,
  Bookmark,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { useLearner } from '../../context/LearnerContext.js';
import { api } from '../../lib/api.js';
import { MockTest, Question, Subject } from '../../types/index.js';

export const MockTestView: React.FC = () => {
  const { refreshLearnerData, setActiveSection } = useLearner();
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [activeTest, setActiveTest] = useState<MockTest | null>(null);
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [inTest, setInTest] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Custom Mock Test Generator Modal / Accordion state
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customQuestionCount, setCustomQuestionCount] = useState<number>(20);
  const [customDuration, setCustomDuration] = useState<number>(25);
  const [customExam, setCustomExam] = useState<string>('UPSC CSE Prelims');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(['sub_polity', 'sub_economy']);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);

  // Timer state
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Countdown timer for active mock test
  useEffect(() => {
    let timer: any = null;
    if (inTest && timeRemainingSeconds > 0) {
      timer = setInterval(() => {
        setTimeRemainingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [inTest, timeRemainingSeconds]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [testsRes, subsRes] = await Promise.all([
        api.getMockTests(),
        api.getSubjects(),
      ]);
      setMockTests(Array.isArray(testsRes) ? testsRes : []);
      setAllSubjects(Array.isArray(subsRes) ? subsRes : []);
    } catch (e) {
      console.error('Failed to load mock tests:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async (test: MockTest) => {
    setActiveTest(test);
    setLoading(true);
    try {
      const testDetails = await api.getMockTest(test.id);
      let qs: Question[] = [];
      if (testDetails && Array.isArray(testDetails.questions) && testDetails.questions.length > 0) {
        qs = testDetails.questions;
      } else {
        const count = test.totalQuestions || 20;
        qs = await api.getPracticeQuestions(test.subjectIds?.[0], undefined, count);
      }
      setTestQuestions(qs);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setMarkedForReview({});
      setTimeRemainingSeconds((test.durationMinutes || 20) * 60);
      setInTest(true);
      setSubmittedResult(null);
    } catch (e) {
      console.error('Error starting test:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCustomTest = async () => {
    setIsGenerating(true);
    try {
      const res = await api.createCustomMockTest({
        title: customTitle || `${customExam} Custom Sprint (${customQuestionCount} Questions)`,
        totalQuestions: customQuestionCount,
        durationMinutes: customDuration,
        subjectIds: selectedSubjectIds,
        examTag: customExam,
      });

      if (res.success && res.test) {
        setMockTests(prev => [res.test, ...prev]);
        setShowCustomBuilder(false);
        await handleStartTest(res.test);
      }
    } catch (e) {
      console.error('Failed to generate custom test:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleToggleMarkForReview = (questionId: string) => {
    setMarkedForReview(prev => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleSubmitTest = async () => {
    if (!activeTest) return;
    setLoading(true);
    try {
      const timeSpent = (activeTest.durationMinutes || 20) * 60 - timeRemainingSeconds;
      const result = await api.submitMockTest(activeTest.id, userAnswers, Math.max(10, timeSpent));
      setSubmittedResult(result.mockAttempt);
      setInTest(false);
      refreshLearnerData();
    } catch (e) {
      console.error('Failed to submit test:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQ = testQuestions[currentQuestionIndex];
  const answeredCount = Object.keys(userAnswers).length;
  const reviewCount = Object.values(markedForReview).filter(Boolean).length;

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto font-sans-editorial">
      
      {/* View Header */}
      {!inTest && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200/80 pb-4 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-serif-editorial font-bold text-[#111426] flex items-center gap-2">
              <FileCheck2 className="w-6 h-6 text-[#35156B]" />
              <span>Civil Services Mock Test Simulator</span>
            </h1>
            <p className="text-stone-500 text-xs mt-0.5 font-medium">
              Real UPSC & State PSC examination engine with configurable 10, 20, 30, 50, 100, and 200 question tests.
            </p>
          </div>

          <button
            onClick={() => setShowCustomBuilder(prev => !prev)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer min-h-[44px]"
          >
            <Zap className="w-4 h-4 text-stone-950" />
            <span>{showCustomBuilder ? 'Close Generator' : 'Generate Custom Mock (10-200 Qs)'}</span>
          </button>
        </div>
      )}

      {/* Custom Mock Test Generator Card */}
      {showCustomBuilder && !inTest && (
        <div className="bg-gradient-to-br from-[#0C1024] to-[#1E1238] border border-amber-500/30 text-white p-5 sm:p-6 rounded-2xl space-y-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm sm:text-base font-serif-editorial font-bold text-amber-200">
                Custom Mock Test Configuration
              </h2>
            </div>
            <span className="text-[11px] font-mono text-stone-300 bg-white/10 px-2.5 py-1 rounded-lg">
              PostgreSQL Data-Driven
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            
            {/* Target Exam */}
            <div className="space-y-1.5">
              <label className="font-bold text-stone-300">Target Exam Format</label>
              <select
                value={customExam}
                onChange={e => setCustomExam(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl p-2.5 text-white font-medium focus:border-amber-400 focus:outline-none min-h-[44px]"
              >
                <option value="UPSC CSE Prelims" className="bg-[#0C1024]">UPSC CSE Prelims (Paper-1)</option>
                <option value="BPSC Prelims" className="bg-[#0C1024]">BPSC CCE Prelims</option>
                <option value="State PSC Prelims" className="bg-[#0C1024]">State PSC Sectional Sprint</option>
              </select>
            </div>

            {/* Configurable Question Count */}
            <div className="space-y-1.5">
              <label className="font-bold text-stone-300">Question Count</label>
              <select
                value={customQuestionCount}
                onChange={e => {
                  const val = Number(e.target.value);
                  setCustomQuestionCount(val);
                  setCustomDuration(Math.round(val * 1.2));
                }}
                className="w-full bg-white/10 border border-white/20 rounded-xl p-2.5 text-white font-medium focus:border-amber-400 focus:outline-none min-h-[44px]"
              >
                <option value="10" className="bg-[#0C1024]">10 Questions (Quick Sprint - 12 mins)</option>
                <option value="20" className="bg-[#0C1024]">20 Questions (Standard Sprint - 25 mins)</option>
                <option value="30" className="bg-[#0C1024]">30 Questions (Sectional Mock - 40 mins)</option>
                <option value="50" className="bg-[#0C1024]">50 Questions (Half-Length Mock - 60 mins)</option>
                <option value="100" className="bg-[#0C1024]">100 Questions (Full UPSC Mock - 120 mins)</option>
                <option value="150" className="bg-[#0C1024]">150 Questions (Full BPSC Mock - 120 mins)</option>
                <option value="200" className="bg-[#0C1024]">200 Questions (Mega Test - 150 mins)</option>
              </select>
            </div>

            {/* Test Duration */}
            <div className="space-y-1.5">
              <label className="font-bold text-stone-300">Time Limit (Minutes)</label>
              <input
                type="number"
                min="5"
                max="240"
                value={customDuration}
                onChange={e => setCustomDuration(Number(e.target.value))}
                className="w-full bg-white/10 border border-white/20 rounded-xl p-2.5 text-white font-medium focus:border-amber-400 focus:outline-none min-h-[44px]"
              />
            </div>

          </div>

          {/* Subjects Selection */}
          <div className="space-y-2">
            <label className="font-bold text-stone-300 text-xs">Included Syllabus Subjects</label>
            <div className="flex flex-wrap gap-2">
              {allSubjects.map(sub => {
                const isSelected = selectedSubjectIds.includes(sub.id);
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        if (selectedSubjectIds.length > 1) {
                          setSelectedSubjectIds(selectedSubjectIds.filter(id => id !== sub.id));
                        }
                      } else {
                        setSelectedSubjectIds([...selectedSubjectIds, sub.id]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer min-h-[36px] ${
                      isSelected
                        ? 'bg-amber-400 text-stone-950 border-amber-300 font-bold'
                        : 'bg-white/5 text-stone-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {sub.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleGenerateCustomTest}
              disabled={isGenerating}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Generating {customQuestionCount}-Question Mock Test...</span>
                </>
              ) : (
                <>
                  <span>Create & Launch {customQuestionCount}Q Mock Test</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="py-12 text-center text-stone-500 text-xs flex items-center justify-center gap-2 font-medium">
          <Sparkles className="w-4 h-4 animate-spin text-amber-600" />
          Loading mock test library...
        </div>
      )}

      {/* Available Tests List */}
      {!loading && !inTest && !submittedResult && (
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider font-mono">
            Standard & Sectional Mock Tests
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockTests.map(test => (
              <div
                key={test.id}
                className="bg-white border border-stone-200/90 p-5 rounded-2xl space-y-4 hover:border-amber-400 transition-all shadow-2xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-[#35156B] bg-purple-50 border border-purple-200 px-2 py-0.5 rounded uppercase font-mono">
                      {test.type || 'MOCK TEST'}
                    </span>
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 font-mono">
                      {test.totalQuestions} Questions
                    </span>
                  </div>

                  <h2 className="text-base font-serif-editorial font-bold text-[#111426]">
                    {test.title}
                  </h2>
                  <p className="text-xs text-stone-600 line-clamp-2">
                    Full standard exam pattern with negative marking (0.66 per wrong attempt) and detailed answer solutions.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs text-stone-600 font-mono bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>{test.durationMinutes} mins</span>
                    </div>
                    <div>Marks: {test.totalMarks || test.totalQuestions * 2}</div>
                    <div className="text-emerald-700 font-bold">+2 / -0.66</div>
                  </div>

                  <button
                    onClick={() => handleStartTest(test)}
                    className="w-full py-2.5 bg-[#0C1024] hover:bg-[#121027] text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-500/20 min-h-[44px]"
                  >
                    <span>Start Test ({test.totalQuestions} Questions)</span>
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTIVE TEST INTERFACE (Clean Single-Question + Question Palette) */}
      {!loading && inTest && activeTest && currentQ && (
        <div className="space-y-5">
          
          {/* Top Test Control Bar */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-2xs sticky top-16 z-20">
            <div>
              <h2 className="text-sm sm:text-base font-serif-editorial font-bold text-[#111426]">
                {activeTest.title}
              </h2>
              <div className="flex items-center gap-3 text-xs text-stone-500 mt-0.5">
                <span>Question {currentQuestionIndex + 1} of {testQuestions.length}</span>
                <span>•</span>
                <span className="text-emerald-700 font-semibold">{answeredCount} Answered</span>
                <span>•</span>
                <span className="text-amber-700 font-semibold">{reviewCount} For Review</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border flex items-center gap-1.5 ${
                timeRemainingSeconds < 300
                  ? 'bg-rose-50 border-rose-300 text-rose-800 animate-pulse'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimer(timeRemainingSeconds)}</span>
              </div>

              <button
                onClick={handleSubmitTest}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer min-h-[40px]"
              >
                Submit Test
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            
            {/* Main Question Display (3 cols on desktop) */}
            <div className="lg:col-span-3 space-y-5">
              <div className="bg-white border border-stone-200/90 p-5 sm:p-6 rounded-2xl space-y-5 shadow-2xs">
                
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <span className="text-xs font-bold font-mono text-stone-500">
                    Question {currentQuestionIndex + 1}
                  </span>
                  
                  <button
                    onClick={() => handleToggleMarkForReview(currentQ.id)}
                    className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer min-h-[36px] ${
                      markedForReview[currentQ.id]
                        ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{markedForReview[currentQ.id] ? 'Marked for Review' : 'Mark for Review'}</span>
                  </button>
                </div>

                {/* Question Statement */}
                <div className="text-sm sm:text-base font-semibold text-stone-900 leading-relaxed">
                  {currentQ.question}
                </div>

                {/* Options List */}
                <div className="space-y-3 pt-2">
                  {currentQ.options?.map((opt, optIdx) => {
                    const isSelected = userAnswers[currentQ.id] === opt.id || userAnswers[currentQ.id] === String(optIdx);
                    return (
                      <button
                        key={opt.id || optIdx}
                        onClick={() => handleSelectOption(currentQ.id, opt.id || String(optIdx))}
                        className={`w-full text-left p-3.5 rounded-xl text-xs sm:text-sm font-medium border transition-all cursor-pointer flex items-start gap-3 min-h-[44px] ${
                          isSelected
                            ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold shadow-2xs ring-1 ring-amber-400'
                            : 'bg-stone-50/70 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-mono font-bold mt-0.5 ${
                          isSelected ? 'bg-amber-500 text-stone-950' : 'bg-stone-200 text-stone-600'
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="leading-relaxed">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Question Bottom Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                  <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    className="flex items-center gap-1 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer min-h-[40px]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    disabled={currentQuestionIndex === testQuestions.length - 1}
                    onClick={() => setCurrentQuestionIndex(prev => Math.min(testQuestions.length - 1, prev + 1))}
                    className="flex items-center gap-1 px-4 py-2 bg-[#0C1024] hover:bg-[#121027] text-white text-xs font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer min-h-[40px]"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Question Palette / Number Grid (1 col on desktop) */}
            <div className="bg-white border border-stone-200/90 p-4 sm:p-5 rounded-2xl space-y-4 shadow-2xs h-fit">
              <h3 className="text-xs font-bold text-stone-600 uppercase font-mono tracking-wider border-b border-stone-100 pb-2">
                Question Grid ({testQuestions.length} Qs)
              </h3>

              <div className="grid grid-cols-5 gap-1.5 max-h-72 overflow-y-auto pr-1">
                {testQuestions.map((q, qIdx) => {
                  const isAnswered = userAnswers[q.id] !== undefined;
                  const isReview = markedForReview[q.id];
                  const isCurrent = currentQuestionIndex === qIdx;

                  let colorClass = 'bg-stone-100 text-stone-700 border-stone-200';
                  if (isCurrent) {
                    colorClass = 'ring-2 ring-[#35156B] bg-purple-100 font-extrabold text-[#35156B] border-purple-300';
                  } else if (isReview) {
                    colorClass = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
                  } else if (isAnswered) {
                    colorClass = 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
                  }

                  return (
                    <button
                      key={q.id || qIdx}
                      onClick={() => setCurrentQuestionIndex(qIdx)}
                      className={`h-8 rounded-lg text-xs font-mono border transition-all cursor-pointer flex items-center justify-center ${colorClass}`}
                    >
                      {qIdx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="pt-2 border-t border-stone-100 space-y-1.5 text-[11px] font-medium text-stone-600">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
                  <span>Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
                  <span>Marked for Review ({reviewCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-stone-100 border border-stone-200" />
                  <span>Unanswered ({testQuestions.length - answeredCount})</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Test Result Screen */}
      {submittedResult && (
        <div className="bg-white border border-stone-200/90 rounded-2xl p-6 space-y-6 shadow-2xs animate-fade-in">
          <div className="text-center space-y-2 border-b border-stone-200/80 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto">
              <Award className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-serif-editorial font-bold text-[#111426]">
              Performance & Accuracy Diagnostic Report
            </h2>
            <p className="text-xs text-stone-500 font-medium">
              {submittedResult.mockTitle || 'Mock Test Assessment'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div className="text-xs font-bold text-stone-500">Score</div>
              <div className="text-2xl font-serif-editorial font-bold text-[#35156B]">
                {submittedResult.score} / {submittedResult.maxScore}
              </div>
            </div>
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div className="text-xs font-bold text-stone-500">Accuracy</div>
              <div className="text-2xl font-serif-editorial font-bold text-emerald-700">
                {submittedResult.accuracy}%
              </div>
            </div>
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div className="text-xs font-bold text-stone-500">Time Taken</div>
              <div className="text-2xl font-serif-editorial font-bold text-amber-700">
                {Math.round((submittedResult.timeTakenSeconds || 600) / 60)} mins
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setSubmittedResult(null);
                setInTest(false);
              }}
              className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl border border-stone-200 transition-all cursor-pointer min-h-[44px]"
            >
              Back to Test Library
            </button>
            <button
              onClick={() => setActiveSection('analytics')}
              className="flex-1 py-3 bg-[#0C1024] hover:bg-[#121027] text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer border border-amber-500/20 min-h-[44px]"
            >
              View Detailed Analytics
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
