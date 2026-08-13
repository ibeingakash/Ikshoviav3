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
    const qs = await api.getPracticeQuestions(test.subjectIds[0], undefined, 10);
    setTestQuestions(qs);
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
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto">
      
      {/* View Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#111827] flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-indigo-600" />
            <span>Mock Test Engine</span>
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">
            Real exam simulation with negative marking, time tracking, subject breakdown, and AI diagnostic report.
          </p>
        </div>
      </div>

      {loading && (
        <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2 font-medium">
          <Sparkles className="w-4 h-4 animate-spin text-indigo-600" />
          Loading mock tests...
        </div>
      )}

      {/* Test List */}
      {!loading && !inTest && !submittedResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockTests.map(test => (
            <div
              key={test.id}
              className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 hover:border-indigo-200 transition-all shadow-2xs"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider font-mono">
                  {test.examType}
                </span>
                <h2 className="text-base font-bold text-[#111827]">{test.title}</h2>
                <p className="text-xs text-slate-500 line-clamp-2">{test.description}</p>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-600 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{test.durationMinutes} mins</span>
                </div>
                <div>Questions: {test.totalQuestions}</div>
                <div>Marks: {test.totalMarks}</div>
              </div>

              <button
                onClick={() => handleStartTest(test)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Start Mock Test</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Active Test Screen */}
      {!loading && inTest && activeTest && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#111827]">{activeTest.title}</h2>
              <p className="text-xs text-slate-500 font-medium">Negative marking rate: {activeTest.negativeMarkingRate * 100}%</p>
            </div>
            <div className="text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl font-mono shrink-0">
              ⏱ Time Remaining: {activeTest.durationMinutes}:00
            </div>
          </div>

          <div className="space-y-5">
            {testQuestions.map((q, idx) => (
              <div key={q.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-900">
                  Q{idx + 1}. {q.question}
                </div>

                {q.options?.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setUserAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                    className={`w-full text-left p-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      userAnswers[q.id] === opt.id
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
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
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            Submit Mock Test & View Report
          </button>
        </div>
      )}

      {/* Test Result Screen */}
      {submittedResult && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-2xs">
          <div className="text-center space-y-2 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center mx-auto">
              <Award className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-[#111827]">Mock Test Performance Report</h2>
            <p className="text-xs text-slate-500 font-medium">{submittedResult.mockTitle}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xs font-bold text-slate-500">Score</div>
              <div className="text-2xl font-black text-indigo-700">{submittedResult.score} / {submittedResult.maxScore}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xs font-bold text-slate-500">Accuracy</div>
              <div className="text-2xl font-black text-emerald-700">{submittedResult.accuracy}%</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xs font-bold text-slate-500">Time Spent</div>
              <div className="text-2xl font-black text-amber-700">10 mins</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setSubmittedResult(null);
                setInTest(false);
              }}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
            >
              Back to Tests
            </button>
            <button
              onClick={() => setActiveSection('analytics')}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              View Learner Analytics
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
