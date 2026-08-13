import React, { useState, useEffect } from 'react';
import { FolderArchive, Download, FileText, Search, Sparkles, Filter, ShieldCheck, CheckCircle2, HelpCircle, ArrowRight, Bot, BookOpen } from 'lucide-react';
import { api } from '../../lib/api.js';
import { LearningResource, Question } from '../../types/index.js';
import { useLearner } from '../../context/LearnerContext.js';

export const ResourcesView: React.FC = () => {
  const { askTutorWithContext, navigateToConcept } = useLearner();
  const [activeTab, setActiveTab] = useState<'pyqs' | 'notes'>('pyqs');

  // PYQ state
  const [pyqs, setPyqs] = useState<Question[]>([]);
  const [pyqLoading, setPyqLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [pyqSearch, setPyqSearch] = useState('');
  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>({});

  // Notes/Resources state
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resourceSearch, setResourceSearch] = useState('');

  const exams = ['All', 'UPSC CSE', 'BPSC Prelims', 'UPPCS'];
  const years = ['All', '2023', '2022', '2021', '2020'];

  const fetchPYQs = () => {
    setPyqLoading(true);
    api.getPYQs({
      exam: selectedExam === 'All' ? undefined : selectedExam,
      year: selectedYear === 'All' ? undefined : Number(selectedYear),
      search: pyqSearch,
    }).then(list => {
      setPyqs(list);
      setPyqLoading(false);
    });
  };

  useEffect(() => {
    fetchPYQs();
  }, [selectedExam, selectedYear]);

  useEffect(() => {
    api.getResources().then(list => {
      setResources(list);
      setResourcesLoading(false);
    });
  }, []);

  const handlePyqSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPYQs();
  };

  const toggleAnswer = (id: string) => {
    setExpandedAnswers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#111827] flex items-center gap-2">
            <FolderArchive className="w-6 h-6 text-indigo-600" />
            <span>Official PYQ Repository & Resource Library</span>
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">
            Verified Civil Services Past Year Questions (UPSC CSE/State PSCs) with primary provenance and syllabus notes.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('pyqs')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pyqs'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Verified PYQ Bank
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Syllabus Notes & PDFs
          </button>
        </div>
      </div>

      {/* TAB 1: Verified PYQ Bank */}
      {activeTab === 'pyqs' && (
        <div className="space-y-5">
          {/* PYQ Filters */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                {/* Exam Filter */}
                <div className="flex items-center gap-1.5 max-w-full overflow-hidden">
                  <span className="text-[11px] font-bold text-slate-500 shrink-0">Exam:</span>
                  <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none max-w-full">
                    {exams.map(e => (
                      <button
                        key={e}
                        onClick={() => setSelectedExam(e)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                          selectedExam === e
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Year Filter */}
                <div className="flex items-center gap-1.5 max-w-full overflow-hidden">
                  <span className="text-[11px] font-bold text-slate-500 shrink-0">Year:</span>
                  <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none max-w-full">
                    {years.map(y => (
                      <button
                        key={y}
                        onClick={() => setSelectedYear(y)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                          selectedYear === y
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Search */}
              <form onSubmit={handlePyqSearchSubmit} className="relative flex-1 sm:max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search PYQ text..."
                  value={pyqSearch}
                  onChange={e => setPyqSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </form>
            </div>
          </div>

          {/* PYQ List */}
          {pyqLoading && (
            <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2 font-medium">
              <Sparkles className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Fetching verified previous year questions...</span>
            </div>
          )}

          {!pyqLoading && pyqs.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3 shadow-2xs">
              <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-[#111827]">No PYQs found matching these filters</h3>
              <p className="text-xs text-slate-500">
                Try clearing year or exam filters to view the full collection of verified UPSC CSE past year questions.
              </p>
              <button
                onClick={() => {
                  setSelectedExam('All');
                  setSelectedYear('All');
                  setPyqSearch('');
                }}
                className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-xl cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}

          {!pyqLoading && pyqs.length > 0 && (
            <div className="space-y-4">
              {pyqs.map((q) => {
                const isExpanded = !!expandedAnswers[q.id];
                return (
                  <div
                    key={q.id}
                    className="bg-white border border-slate-200 hover:border-indigo-200 p-5 rounded-2xl space-y-4 transition-all shadow-2xs"
                  >
                    {/* PYQ Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full font-mono">
                          {q.examTag || `UPSC CSE ${q.pyqYear}`}
                        </span>

                        {q.paper && (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                            {q.paper}
                          </span>
                        )}

                        {q.questionNumber && (
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            Q.{q.questionNumber}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Official UPSC Verified</span>
                        </span>
                      </div>
                    </div>

                    {/* Question Statement */}
                    <div className="text-sm font-semibold text-[#111827] leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                      {q.question}
                    </div>

                    {/* Options */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map(opt => {
                          const isCorrectOpt = q.correctAnswer === opt.id;
                          return (
                            <div
                              key={opt.id}
                              className={`p-3 rounded-xl border text-xs font-medium transition-all ${
                                isExpanded && isCorrectOpt
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <span className="font-bold mr-1.5 uppercase text-slate-400">({opt.id}):</span>
                              <span>{opt.text}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => toggleAnswer(q.id)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{isExpanded ? 'Hide Verified Solution' : 'Show Verified Solution'}</span>
                      </button>

                      <button
                        onClick={() => askTutorWithContext(`Explain this UPSC PYQ step-by-step: ${q.question}`, q.conceptId)}
                        className="text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        <span>Ask AI Tutor About This PYQ</span>
                      </button>
                    </div>

                    {/* Explanation Drawer */}
                    {isExpanded && (
                      <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-2 animate-fade-in">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Official Solution & Explanation:</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                          {q.explanation}
                        </p>
                        {q.source && (
                          <p className="text-[10px] text-slate-500 font-mono pt-1">
                            Source: {q.source}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Syllabus Notes & PDFs */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={resourceSearch}
              onChange={e => setResourceSearch(e.target.value)}
              placeholder="Search syllabus notes, case summaries, primers..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-2xs"
            />
          </div>

          {resourcesLoading && (
            <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2 font-medium">
              <Sparkles className="w-4 h-4 animate-spin text-indigo-600" />
              Loading resources...
            </div>
          )}

          {!resourcesLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources
                .filter(r =>
                  r.title.toLowerCase().includes(resourceSearch.toLowerCase()) ||
                  r.summary.toLowerCase().includes(resourceSearch.toLowerCase())
                )
                .map(r => (
                  <div
                    key={r.id}
                    className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 hover:border-indigo-200 transition-all shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200 font-mono">
                        {r.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{r.fileSize || '2.4 MB'}</span>
                    </div>

                    <h2 className="text-sm font-bold text-[#111827]">{r.title}</h2>
                    <p className="text-xs text-slate-500 line-clamp-2">{r.summary}</p>

                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 pt-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Open Syllabus Resource</span>
                    </a>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
