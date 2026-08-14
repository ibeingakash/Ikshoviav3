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
    <div className="space-y-6 animate-fade-in pb-12 max-w-6xl mx-auto font-sans-editorial">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-serif-editorial font-bold text-[#111426] flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#35156B]" />
            <span>IKSHOVIA Admin & Content Control Panel</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 font-medium">
            Curate syllabus concepts, create question banks, and approve AI-generated questions.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="px-3.5 py-1.5 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200/90 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-2xs self-start"
        >
          <RefreshCw className="w-4 h-4 text-[#35156B]" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Sub Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-stone-200/80 pb-3 overflow-x-auto">
        {adminTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#35156B] text-amber-300 shadow-2xs'
                  : 'bg-white hover:bg-stone-100/80 text-stone-600 border border-stone-200/90'
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
            <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
              <div className="text-xs text-stone-500 font-bold uppercase font-mono">Total Registered Learners</div>
              <div className="text-2xl font-serif-editorial font-bold text-[#111426] mt-1">{metrics?.totalUsers ?? 0}</div>
              <div className="text-[10px] text-emerald-700 font-medium mt-1">Active Learner Engine</div>
            </div>

            <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
              <div className="text-xs text-stone-500 font-bold uppercase font-mono">Syllabus Concepts</div>
              <div className="text-2xl font-serif-editorial font-bold text-[#35156B] mt-1">{metrics?.totalConcepts ?? 0}</div>
              <div className="text-[10px] text-stone-500 font-medium mt-1">across {metrics?.totalSubjects ?? 0} Subjects</div>
            </div>

            <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
              <div className="text-xs text-stone-500 font-bold uppercase font-mono">Question Bank Size</div>
              <div className="text-2xl font-serif-editorial font-bold text-[#111426] mt-1">{metrics?.totalQuestions ?? 0}</div>
              <div className="text-[10px] text-stone-500 font-medium mt-1">Prelims & Mains MCQs</div>
            </div>

            <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
              <div className="text-xs text-stone-500 font-bold uppercase font-mono">AI Drafts Pending</div>
              <div className="text-2xl font-serif-editorial font-bold text-amber-700 mt-1">{metrics?.totalAiDrafts ?? 0}</div>
              <div className="text-[10px] text-amber-800 font-medium mt-1">Ready for Review</div>
            </div>
          </div>

          <div className="bg-white border border-stone-200/90 p-6 rounded-2xl space-y-4 shadow-2xs">
            <h2 className="text-xs font-bold text-stone-600 uppercase tracking-wider font-mono flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#35156B]" />
              <span>Platform Health Summary</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/90 space-y-2">
                <div className="font-bold text-[#111426]">Gemini AI Studio Engine</div>
                <p className="text-stone-600 text-[11px] leading-relaxed">
                  Server-side @google/genai SDK active with model gemini-2.5-flash. Automatically powers AI Tutor chat, custom question generation, and real-time learner model insights.
                </p>
              </div>

              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/90 space-y-2">
                <div className="font-bold text-[#111426]">Learner Intelligence Matrix</div>
                <p className="text-stone-600 text-[11px] leading-relaxed">
                  Real-time updating of mastery percentages, mistake breakdowns, confidence self-ratings, and next best action priorities.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: USER DIRECTORY */}
      {activeSection === 'admin-users' && (
        <div className="bg-white border border-stone-200/90 p-6 rounded-2xl space-y-4 shadow-2xs">
          <h2 className="text-xs font-bold text-stone-600 uppercase tracking-wider font-mono flex items-center gap-2">
            <Users className="w-4 h-4 text-[#35156B]" />
            <span>Registered Learner Directory</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-bold font-mono">
                  <th className="py-2.5 px-3">Name & Email</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Target Exam</th>
                  <th className="py-2.5 px-3">Daily Target</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {usersList.map((u, i) => (
                  <tr key={i} className="hover:bg-stone-50">
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#111426]">{u.name}</div>
                      <div className="text-[10px] text-stone-500 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        u.role === 'ADMIN' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-purple-50 text-[#35156B] border border-purple-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-stone-600">{u.onboarding?.targetExam || 'UPSC CSE'}</td>
                    <td className="py-3 px-3 font-mono">{u.onboarding?.dailyGoalMinutes || 120} mins</td>
                    <td className="py-3 px-3">
                      <span className="text-emerald-800 font-semibold text-[10px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
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
          <form onSubmit={handleCreateConcept} className="bg-white border border-stone-200/90 p-6 rounded-2xl space-y-4 shadow-2xs">
            <h2 className="text-xs font-bold text-stone-600 uppercase tracking-wider font-mono flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Create New Concept Entry</span>
            </h2>

            {conceptSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>New Concept published successfully!</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 font-mono">Concept Title</label>
                <input
                  type="text"
                  value={newConceptTitle}
                  onChange={e => setNewConceptTitle(e.target.value)}
                  placeholder="e.g. Article 300A Right to Property"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#35156B]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 font-mono">Subject</label>
                <select
                  value={newConceptSubject}
                  onChange={e => setNewConceptSubject(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#35156B]"
                >
                  <option value="sub_polity">Indian Polity & Governance</option>
                  <option value="sub_economy">Indian Economy & Development</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 font-mono">Concept Summary</label>
              <textarea
                value={newConceptSummary}
                onChange={e => setNewConceptSummary(e.target.value)}
                placeholder="High-yield constitutional summary..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#35156B] h-20"
                required
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-[#0C1024] hover:bg-[#121027] text-amber-300 text-xs font-bold rounded-xl shadow-2xs border border-amber-500/30 cursor-pointer"
            >
              Publish Concept
            </button>
          </form>
        </div>
      )}

      {/* SECTION 4: QUESTION BANK MANAGEMENT */}
      {activeSection === 'admin-questions' && (
        <div className="space-y-6">
          <form onSubmit={handleCreateQuestion} className="bg-white border border-stone-200/90 p-6 rounded-2xl space-y-4 shadow-2xs">
            <h2 className="text-xs font-bold text-stone-600 uppercase tracking-wider font-mono flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#35156B]" />
              <span>Add Custom Practice MCQ</span>
            </h2>

            {questionSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>MCQ added to Question Bank!</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 font-mono">Question Statement</label>
              <textarea
                value={newQQuestion}
                onChange={e => setNewQQuestion(e.target.value)}
                placeholder="Consider the following statements..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#35156B] h-20"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={newQOpt0}
                onChange={e => setNewQOpt0(e.target.value)}
                placeholder="Option A"
                className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900"
                required
              />
              <input
                type="text"
                value={newQOpt1}
                onChange={e => setNewQOpt1(e.target.value)}
                placeholder="Option B"
                className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900"
                required
              />
              <input
                type="text"
                value={newQOpt2}
                onChange={e => setNewQOpt2(e.target.value)}
                placeholder="Option C"
                className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900"
                required
              />
              <input
                type="text"
                value={newQOpt3}
                onChange={e => setNewQOpt3(e.target.value)}
                placeholder="Option D"
                className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 font-mono">Correct Option</label>
                <select
                  value={newQCorrect}
                  onChange={e => setNewQCorrect(Number(e.target.value))}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900"
                >
                  <option value={0}>Option A</option>
                  <option value={1}>Option B</option>
                  <option value={2}>Option C</option>
                  <option value={3}>Option D</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 font-mono">Explanation</label>
                <input
                  type="text"
                  value={newQExplanation}
                  onChange={e => setNewQExplanation(e.target.value)}
                  placeholder="Detailed reasoning..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-[#0C1024] hover:bg-[#121027] text-amber-300 text-xs font-bold rounded-xl shadow-2xs border border-amber-500/30 cursor-pointer"
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
          <form onSubmit={handleGenerateAI} className="bg-white border border-stone-200/90 p-6 rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600 animate-pulse" />
              <h2 className="text-xs font-bold text-stone-700 uppercase tracking-wider font-mono">
                Gemini AI Studio Question Generator
              </h2>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed font-medium">
              Describe the subject, topic, or question format. Gemini will generate high-yield MCQs with option distractor logic and detailed explanations.
            </p>

            <div>
              <textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-900 focus:outline-none focus:border-[#35156B] h-24"
                placeholder="Prompt Gemini..."
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="px-6 py-2.5 bg-[#0C1024] hover:bg-[#121027] text-amber-300 font-bold text-xs rounded-xl shadow-2xs border border-amber-500/30 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Gemini is generating...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>Generate Questions with AI</span>
                </>
              )}
            </button>
          </form>

          {/* Pending Drafts List */}
          <div className="bg-white border border-stone-200/90 p-6 rounded-2xl space-y-4 shadow-2xs">
            <h2 className="text-xs font-bold text-stone-600 uppercase tracking-wider font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Pending AI Content Drafts ({drafts.length})</span>
            </h2>

            {drafts.length === 0 ? (
              <div className="text-center py-8 text-xs text-stone-400">
                No pending drafts. Use the generator above to create questions.
              </div>
            ) : (
              <div className="space-y-4">
                {drafts.map((draft, idx) => (
                  <div key={idx} className="p-4 bg-stone-50 border border-stone-200/90 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[#35156B] font-bold">{draft.id}</span>
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] font-mono ${
                        draft.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {draft.status}
                      </span>
                    </div>

                    {draft.generatedData && (
                      <div className="space-y-2 text-xs text-stone-800">
                        <div className="font-bold text-[#111426]">{draft.generatedData.question}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2 text-stone-700 text-[11px]">
                          {draft.generatedData.options?.map((opt: any, i: number) => {
                            const optText = typeof opt === 'object' && opt !== null ? (opt.text || JSON.stringify(opt)) : String(opt);
                            const isCorrect = i === draft.generatedData.correctAnswer ||
                              draft.generatedData.correctAnswer === String(i) ||
                              (typeof opt === 'object' && opt !== null && draft.generatedData.correctAnswer === opt.id);

                            return (
                              <div key={i} className={`p-2 rounded-xl border ${isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' : 'bg-white border-stone-200'}`}>
                                {isCorrect ? '✓ ' : ''}{optText}
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[11px] text-stone-600 bg-white p-2.5 rounded-xl border border-stone-200">
                          <strong>Explanation:</strong> {draft.generatedData.explanation}
                        </p>
                      </div>
                    )}

                    {draft.status === 'DRAFT' && (
                      <button
                        onClick={() => handleApproveDraft(draft.id)}
                        className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
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
