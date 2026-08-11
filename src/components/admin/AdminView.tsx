import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  FileSpreadsheet,
  HelpCircle,
  Sparkles,
  Plus,
  CheckCircle2,
  AlertCircle,
  Search,
  BookOpen,
  Send,
  Check,
  RefreshCw,
  TrendingUp,
  BarChart2,
} from 'lucide-react';
import { useLearner, NavigationSection } from '../../context/LearnerContext.js';
import { api } from '../../lib/api.js';

export const AdminView: React.FC = () => {
  const { activeSection, setActiveSection } = useLearner();

  const [metrics, setMetrics] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New concept form
  const [newConceptTitle, setNewConceptTitle] = useState('');
  const [newConceptSubject, setNewConceptSubject] = useState('sub_polity');
  const [newConceptSummary, setNewConceptSummary] = useState('');
  const [conceptSuccess, setConceptSuccess] = useState(false);

  // New question form
  const [newQQuestion, setNewQQuestion] = useState('');
  const [newQSubject, setNewQSubject] = useState('sub_polity');
  const [newQOpt0, setNewQOpt0] = useState('');
  const [newQOpt1, setNewQOpt1] = useState('');
  const [newQOpt2, setNewQOpt2] = useState('');
  const [newQOpt3, setNewQOpt3] = useState('');
  const [newQCorrect, setNewQCorrect] = useState(0);
  const [newQExplanation, setNewQExplanation] = useState('');
  const [questionSuccess, setQuestionSuccess] = useState(false);

  // AI Generator Form
  const [aiPrompt, setAiPrompt] = useState('Generate 2 high-yield UPSC Prelims MCQs on Article 21 and Right to Privacy with options and detailed explanations.');
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [m, u, d] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminUsers(),
        api.getAdminDrafts(),
      ]);
      setMetrics(m);
      setUsersList(u);
      setDrafts(d);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [activeSection]);

  const handleCreateConcept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConceptTitle.trim()) return;

    await api.createConcept({
      title: newConceptTitle,
      subjectId: newConceptSubject,
      topicId: 'top_rights',
      summary: newConceptSummary,
      difficulty: 'MEDIUM',
      importance: 'HIGH',
      contentMd: `## ${newConceptTitle}\n\n${newConceptSummary}\n\n### Key Principles\n* Fundamental Provision\n* High-yield exam relevance`,
      tags: ['UPSC', 'Core Concept'],
      examFrequencyYears: [2020, 2022, 2024],
    });

    setNewConceptTitle('');
    setNewConceptSummary('');
    setConceptSuccess(true);
    setTimeout(() => setConceptSuccess(false), 3000);
    fetchAdminData();
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQQuestion.trim() || !newQOpt0.trim()) return;

    await api.createQuestion({
      subjectId: newQSubject,
      topicId: 'top_rights',
      conceptId: 'c_art21',
      type: 'MCQ',
      question: newQQuestion,
      options: [newQOpt0, newQOpt1, newQOpt2, newQOpt3],
      correctAnswer: newQCorrect,
      explanation: newQExplanation || 'Standard UPSC analytical explanation.',
      difficulty: 'MEDIUM',
      examTag: 'UPSC Prelims',
    });

    setNewQQuestion('');
    setNewQOpt0('');
    setNewQOpt1('');
    setNewQOpt2('');
    setNewQOpt3('');
    setNewQExplanation('');
    setQuestionSuccess(true);
    setTimeout(() => setQuestionSuccess(false), 3000);
    fetchAdminData();
  };

  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    try {
      await api.generateAIQuestions(aiPrompt, 'sub_polity', 'top_rights', 2);
      await fetchAdminData();
      setActiveSection('admin-ai');
    } catch (err) {
      console.error('Failed to generate AI questions:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveDraft = async (draftId: string) => {
    await api.approveDraft(draftId);
    await fetchAdminData();
  };

  const adminTabs: { id: NavigationSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'admin-dashboard', label: 'Overview', icon: Shield },
    { id: 'admin-users', label: 'User Directory', icon: Users },
    { id: 'admin-content', label: 'Concepts & Syllabus', icon: FileSpreadsheet },
    { id: 'admin-questions', label: 'Question Bank', icon: HelpCircle },
    { id: 'admin-ai', label: 'AI Content Studio', icon: Sparkles },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/80 to-slate-900 border border-rose-900/50 p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-950 border border-rose-800 rounded-xl text-rose-300">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">IKSHOVIA Admin & AI Control Panel</h1>
            <p className="text-xs text-rose-200 mt-0.5">
              Curate syllabus concepts, create question banks, and approve AI-generated questions.
            </p>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4 text-rose-400" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Sub Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {adminTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: ADMIN OVERVIEW */}
      {activeSection === 'admin-dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs text-slate-400 font-semibold uppercase">Total Registered Learners</div>
              <div className="text-2xl font-extrabold text-white mt-1">{metrics?.totalUsers || 2}</div>
              <div className="text-[10px] text-emerald-400 font-medium mt-1">Active Learner Engine</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs text-slate-400 font-semibold uppercase">Syllabus Concepts</div>
              <div className="text-2xl font-extrabold text-indigo-300 mt-1">{metrics?.totalConcepts || 8}</div>
              <div className="text-[10px] text-indigo-400 font-medium mt-1">across {metrics?.totalSubjects || 2} Subjects</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs text-slate-400 font-semibold uppercase">Question Bank Size</div>
              <div className="text-2xl font-extrabold text-blue-300 mt-1">{metrics?.totalQuestions || 12}</div>
              <div className="text-[10px] text-blue-400 font-medium mt-1">Prelims & Mains MCQs</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs text-slate-400 font-semibold uppercase">AI Drafts Pending</div>
              <div className="text-2xl font-extrabold text-amber-300 mt-1">{metrics?.totalAiDrafts || 0}</div>
              <div className="text-[10px] text-amber-400 font-medium mt-1">Ready for Review</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-rose-400" />
              <span>Platform Health Summary</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-2">
                <div className="font-bold text-white">Gemini AI Studio Engine</div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Server-side @google/genai SDK active with model gemini-2.5-flash. Automatically powers AI Tutor chat, custom question generation, and real-time learner model insights.
                </p>
              </div>

              <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-2">
                <div className="font-bold text-white">Learner Intelligence Matrix</div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Real-time updating of mastery percentages, mistake breakdowns, confidence self-ratings, and next best action priorities.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: USER DIRECTORY */}
      {activeSection === 'admin-users' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-rose-400" />
            <span>Registered Learner Directory</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Name & Email</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Target Exam</th>
                  <th className="py-2.5 px-3">Daily Target</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {usersList.map((u, i) => (
                  <tr key={i} className="hover:bg-slate-800/50">
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{u.name}</div>
                      <div className="text-[10px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'ADMIN' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{u.onboarding?.targetExam || 'UPSC CSE'}</td>
                    <td className="py-3 px-3 font-mono">{u.onboarding?.dailyGoalMinutes || 120} mins</td>
                    <td className="py-3 px-3">
                      <span className="text-emerald-400 font-semibold text-[10px] bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-full">
                        {u.isOnboarded ? 'Onboarded' : 'New Candidate'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: CONCEPTS & SYLLABUS MANAGEMENT */}
      {activeSection === 'admin-content' && (
        <div className="space-y-6">
          <form onSubmit={handleCreateConcept} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Create New Concept Entry</span>
            </h2>

            {conceptSuccess && (
              <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>New Concept published successfully!</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Concept Title</label>
                <input
                  type="text"
                  value={newConceptTitle}
                  onChange={e => setNewConceptTitle(e.target.value)}
                  placeholder="e.g. Article 300A Right to Property"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Subject</label>
                <select
                  value={newConceptSubject}
                  onChange={e => setNewConceptSubject(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="sub_polity">Indian Polity & Governance</option>
                  <option value="sub_economy">Indian Economy & Development</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Concept Summary</label>
              <textarea
                value={newConceptSummary}
                onChange={e => setNewConceptSummary(e.target.value)}
                placeholder="High-yield constitutional summary..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 h-20"
                required
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md"
            >
              Publish Concept
            </button>
          </form>
        </div>
      )}

      {/* SECTION 4: QUESTION BANK MANAGEMENT */}
      {activeSection === 'admin-questions' && (
        <div className="space-y-6">
          <form onSubmit={handleCreateQuestion} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span>Add Custom Practice MCQ</span>
            </h2>

            {questionSuccess && (
              <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>MCQ added to Question Bank!</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Question Statement</label>
              <textarea
                value={newQQuestion}
                onChange={e => setNewQQuestion(e.target.value)}
                placeholder="Consider the following statements..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 h-20"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={newQOpt0}
                onChange={e => setNewQOpt0(e.target.value)}
                placeholder="Option A"
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                required
              />
              <input
                type="text"
                value={newQOpt1}
                onChange={e => setNewQOpt1(e.target.value)}
                placeholder="Option B"
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                required
              />
              <input
                type="text"
                value={newQOpt2}
                onChange={e => setNewQOpt2(e.target.value)}
                placeholder="Option C"
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                required
              />
              <input
                type="text"
                value={newQOpt3}
                onChange={e => setNewQOpt3(e.target.value)}
                placeholder="Option D"
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Correct Option</label>
                <select
                  value={newQCorrect}
                  onChange={e => setNewQCorrect(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value={0}>Option A</option>
                  <option value={1}>Option B</option>
                  <option value={2}>Option C</option>
                  <option value={3}>Option D</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Explanation</label>
                <input
                  type="text"
                  value={newQExplanation}
                  onChange={e => setNewQExplanation(e.target.value)}
                  placeholder="Detailed reasoning..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md"
            >
              Add Question
            </button>
          </form>
        </div>
      )}

      {/* SECTION 5: AI CONTENT GENERATION STUDIO */}
      {activeSection === 'admin-ai' && (
        <div className="space-y-6">
          {/* AI Generator Box */}
          <form onSubmit={handleGenerateAI} className="bg-slate-900 border border-indigo-500/50 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Gemini AI Studio Question Generator
              </h2>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Describe the subject, topic, or question format. Gemini will generate high-yield MCQs with option distractor logic and detailed explanations.
            </p>

            <div>
              <textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 h-24"
                placeholder="Prompt Gemini..."
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gemini is generating...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Generate Questions with AI</span>
                </>
              )}
            </button>
          </form>

          {/* Pending Drafts List */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Pending AI Content Drafts ({drafts.length})</span>
            </h2>

            {drafts.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No pending drafts. Use the generator above to create questions.
              </div>
            ) : (
              <div className="space-y-4">
                {drafts.map((draft, idx) => (
                  <div key={idx} className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-indigo-300 font-bold">{draft.id}</span>
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        draft.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {draft.status}
                      </span>
                    </div>

                    {draft.generatedData && (
                      <div className="space-y-2 text-xs text-slate-200">
                        <div className="font-bold text-white">{draft.generatedData.question}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2 text-slate-300 text-[11px]">
                          {draft.generatedData.options?.map((opt: string, i: number) => (
                            <div key={i} className={`p-1.5 rounded border ${i === draft.generatedData.correctAnswer ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200 font-semibold' : 'bg-slate-900 border-slate-800'}`}>
                              {i === draft.generatedData.correctAnswer ? '✓ ' : ''}{opt}
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-400 italic bg-slate-950 p-2 rounded">
                          <strong>Explanation:</strong> {draft.generatedData.explanation}
                        </p>
                      </div>
                    )}

                    {draft.status === 'DRAFT' && (
                      <button
                        onClick={() => handleApproveDraft(draft.id)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Publish to Question Bank</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
