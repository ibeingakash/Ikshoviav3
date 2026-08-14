import React, { useState, useEffect } from 'react';
import { FileCheck2, Clock, AlertCircle, CheckCircle2, ArrowRight, Award, Sparkles } from 'lucide-react';
import { useLearner } from '../../context/LearnerContext.js';
import { api } from '../../lib/api.js';
import { MockTest, Question } from '../../types/index.js';

export const MockTestView: React.FC = () => {
  const { refreshLearnerData, setActiveSection } = useLearner();
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [activeTest, setActiveTest] = useState<MockTest | null>(null);
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [inTest, setInTest] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMockTests().then(tests => {
      setMockTests(tests);
      setLoading(false);
    });
  }, []);

  const handleStartTest = async (test: MockTest) => {
    setActiveTest(test);
    setLoading(true);
    try {
      const testDetails = await api.getMockTest(test.id);
      let qs: Question[] = [];
      if (testDetails && testDetails.questions && testDetails.questions.length > 0) {
        qs = testDetails.questions;
      } else {
        const count = test.totalQuestions || 25;
        qs = await api.getPracticeQuestions(test.subjectIds[0], undefined, count);
      }
      setTestQuestions(qs);
    } catch (e) {
      const count = test.totalQuestions || 25;
      const qs = await api.getPracticeQuestions(test.subjectIds[0], undefined, count);
      setTestQuestions(qs);
    }
    setUserAnswers({});
    setInTest(true);
    setSubmittedResult(null);
    setLoading(false);
  };

  const handleSubmitTest = async () => {
    if (!activeTest) return;
    setLoading(true);
    const result = await api.submitMockTest(activeTest.id, userAnswers, 600);
    setSubmittedResult(result.mockAttempt);
    setInTest(false);
    setLoading(false);
    refreshLearnerData();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto font-sans-editorial">
      
      {/* View Header */}
      <div className="flex items-center justify-between border-b border-stone-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-serif-editorial font-bold text-[#111426] flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-[#35156B]" />
            <span>Mock Test Engine</span>
          </h1>
          <p className="text-stone-500 text-xs mt-0.5 font-medium">
            Real exam simulation with negative marking, time tracking, subject breakdown, and AI diagnostic report.
          </p>
        </div>
      </div>

      {loading && (
        <div className="py-12 text-center text-stone-500 text-xs flex items-center justify-center gap-2 font-medium">
          <Sparkles className="w-4 h-4 animate-spin text-amber-600" />
          Loading mock tests...
        </div>
      )}

      {/* Test List */}
      {!loading && !inTest && !submittedResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockTests.map(test => (
            <div
              key={test.id}
              className="bg-white border border-stone-200/90 p-5 rounded-2xl space-y-4 hover:border-amber-400 transition-all shadow-2xs"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#35156B] uppercase tracking-wider font-mono">
                  {test.examType}
                </span>
                <h2 className="text-base font-serif-editorial font-bold text-[#111426]">{test.title}</h2>
                <p className="text-xs text-stone-600 line-clamp-2">{test.description}</p>
              </div>

              <div className="flex items-center gap-4 text-xs text-stone-600 font-mono bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  <span>{test.durationMinutes} mins</span>
                </div>
                <div>Questions: {test.totalQuestions}</div>
                <div>Marks: {test.totalMarks}</div>
              </div>

              <button
                onClick={() => handleStartTest(test)}
                className="w-full py-2.5 bg-[#0C1024] hover:bg-[#121027] text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-500/20"
              >
                <span>Start Mock Test</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Active Test Screen */}
      {!loading && inTest && activeTest && (
        <div className="bg-white border border-stone-200/90 rounded-2xl p-6 space-y-6 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between border-b border-stone-200/80 pb-3 gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-serif-editorial font-bold text-[#111426]">{activeTest.title}</h2>
              <p className="text-xs text-stone-500 font-medium">Negative marking rate: {activeTest.negativeMarkingRate * 100}%</p>
            </div>
            <div className="text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl font-mono shrink-0">
              ⏱ Time Remaining: {activeTest.durationMinutes}:00
            </div>
          </div>

          <div className="space-y-5">
            {testQuestions.map((q, idx) => (
              <div key={q.id} className="bg-stone-50 p-4 rounded-xl border border-stone-200/90 space-y-3">
                <div className="text-xs font-bold text-stone-900">
                  Q{idx + 1}. {q.question}
                </div>

                {q.options?.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setUserAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                    className={`w-full text-left p-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      userAnswers[q.id] === opt.id
                        ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold shadow-2xs'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmitTest}
            className="w-full py-3 bg-[#35156B] hover:bg-[#4B1F78] text-amber-300 font-bold text-sm rounded-xl shadow-2xs transition-all cursor-pointer border border-amber-500/30"
          >
            Submit Mock Test & View Report
          </button>
        </div>
      )}

      {/* Test Result Screen */}
      {submittedResult && (
        <div className="bg-white border border-stone-200/90 rounded-2xl p-6 space-y-6 shadow-2xs">
          <div className="text-center space-y-2 border-b border-stone-200/80 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto">
              <Award className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-serif-editorial font-bold text-[#111426]">Mock Test Performance Report</h2>
            <p className="text-xs text-stone-500 font-medium">{submittedResult.mockTitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
            <div className="bg-stone-50 p-3 sm:p-4 rounded-xl border border-stone-200">
              <div className="text-xs font-bold text-stone-500">Score</div>
              <div className="text-xl sm:text-2xl font-serif-editorial font-bold text-[#35156B]">{submittedResult.score} / {submittedResult.maxScore}</div>
            </div>
            <div className="bg-stone-50 p-3 sm:p-4 rounded-xl border border-stone-200">
              <div className="text-xs font-bold text-stone-500">Accuracy</div>
              <div className="text-xl sm:text-2xl font-serif-editorial font-bold text-emerald-700">{submittedResult.accuracy}%</div>
            </div>
            <div className="bg-stone-50 p-3 sm:p-4 rounded-xl border border-stone-200">
              <div className="text-xs font-bold text-stone-500">Time Spent</div>
              <div className="text-xl sm:text-2xl font-serif-editorial font-bold text-amber-700">10 mins</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setSubmittedResult(null);
                setInTest(false);
              }}
              className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl border border-stone-200 transition-all cursor-pointer"
            >
              Back to Tests
            </button>
            <button
              onClick={() => setActiveSection('analytics')}
              className="flex-1 py-2.5 bg-[#0C1024] hover:bg-[#121027] text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer border border-amber-500/20"
            >
              View Learner Analytics
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

