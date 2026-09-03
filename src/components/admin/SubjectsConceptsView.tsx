import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Search,
  ChevronRight,
  Edit3,
  Tag,
  Shield,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { Subject, Topic, Concept } from '../../types/index.js';

export const SubjectsConceptsView: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('sub_polity');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New Concept Form
  const [showAddConcept, setShowAddConcept] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newSummary, setNewSummary] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadTaxonomy();
  }, []);

  useEffect(() => {
    if (selectedSubjectId) {
      loadSubjectDetail(selectedSubjectId);
    }
  }, [selectedSubjectId]);

  const loadTaxonomy = async () => {
    setLoading(true);
    try {
      const subs = await api.getSubjects();
      setSubjects(subs);
      if (subs.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(subs[0].id);
      }
    } catch (err) {
      console.error('Failed to load taxonomy:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSubjectDetail = async (subId: string) => {
    try {
      const detail = await api.getSubjectDetail(subId);
      setTopics(detail.topics || []);
      setConcepts(detail.concepts || []);
      if (detail.topics?.length > 0) {
        setSelectedTopicId(detail.topics[0].id);
      }
    } catch (err) {
      console.error('Failed to load subject detail:', err);
    }
  };

  const handleCreateConcept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSaving(true);
    try {
      await api.createConcept({
        title: newTitle,
        subjectId: selectedSubjectId,
        topicId: selectedTopicId || topics[0]?.id || 'top_general',
        summary: newSummary,
        difficulty: 'MEDIUM',
        importance: 'HIGH',
        contentMd: `## ${newTitle}\n\n${newSummary}\n\n### Key Provisions\n* Core constitutional or institutional principle\n* High-yield exam focus`,
        tags: ['UPSC CSE', 'Core Syllabus'],
        examFrequencyYears: [2022, 2024, 2025],
      });

      setNewTitle('');
      setNewSummary('');
      setShowAddConcept(false);
      setSuccessMsg('Concept created in syllabus taxonomy!');
      setTimeout(() => setSuccessMsg(null), 3000);
      loadSubjectDetail(selectedSubjectId);
    } catch (err) {
      console.error('Failed to create concept:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto font-sans-editorial">
      {/* Toast */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 bg-stone-900 text-amber-300 px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold border border-amber-500/40 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE6DF] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
              Curriculum & Knowledge Taxonomy
            </span>
            <span className="text-[11px] font-mono text-stone-500">
              {subjects.length} Core Subjects
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-stone-900 mt-1 flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-amber-700" />
            <span>Subjects & Concepts Taxonomy</span>
          </h1>
          <p className="text-stone-600 text-xs mt-1 font-medium">
            Manage the central syllabus hierarchy (Subject → Topic → Concept) mapped to UPSC CSE & BPSC CCE benchmarks.
          </p>
        </div>

        <button
          onClick={() => setShowAddConcept(true)}
          className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Concept Node</span>
        </button>
      </div>

      {/* Subject Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-100">
        {subjects.map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedSubjectId(s.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedSubjectId === s.id
                ? 'bg-stone-900 text-amber-300 shadow-2xs'
                : 'bg-white hover:bg-stone-100 text-stone-700 border border-[#EAE6DF]'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Main Hierarchy Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Topics Column */}
        <div className="bg-white border border-[#EAE6DF] p-5 rounded-2xl space-y-3 shadow-2xs">
          <h3 className="text-xs font-bold text-stone-600 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-amber-700" />
            <span>Topics ({topics.length})</span>
          </h3>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {topics.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">No topics found for this subject.</p>
            ) : (
              topics.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTopicId(t.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedTopicId === t.id
                      ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold shadow-2xs'
                      : 'bg-[#FCFBF9] border-stone-200 text-stone-700 hover:border-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{t.title || (t as any).name}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Concepts Column */}
        <div className="md:col-span-2 bg-white border border-[#EAE6DF] p-5 rounded-2xl space-y-3 shadow-2xs">
          <h3 className="text-xs font-bold text-stone-600 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-amber-700" />
            <span>Concepts & Mastery Nodes ({concepts.length})</span>
          </h3>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {concepts.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">No concepts defined for this topic.</p>
            ) : (
              concepts.map(c => (
                <div
                  key={c.id}
                  className="p-4 bg-[#FCFBF9] border border-stone-200 rounded-xl space-y-2 text-xs hover:border-amber-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif-editorial font-bold text-stone-900 text-sm">{c.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                      {c.importance || 'HIGH'} PRIORITY
                    </span>
                  </div>
                  <p className="text-stone-600 leading-relaxed">{c.summary}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Concept Modal */}
      {showAddConcept && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-serif-editorial font-bold text-stone-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-700" />
              <span>Add Concept to Syllabus</span>
            </h3>

            <form onSubmit={handleCreateConcept} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Concept Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Article 32: Constitutional Remedies"
                  className="w-full bg-[#FCFBF9] border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900 font-medium focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Parent Topic</label>
                <select
                  value={selectedTopicId}
                  onChange={e => setSelectedTopicId(e.target.value)}
                  className="w-full bg-[#FCFBF9] border border-stone-300 rounded-xl p-2 text-xs focus:border-amber-500 focus:outline-none"
                >
                  {topics.map(t => (
                    <option key={t.id} value={t.id}>{t.title || (t as any).name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Concept Summary & High-Yield Notes</label>
                <textarea
                  rows={3}
                  value={newSummary}
                  onChange={e => setNewSummary(e.target.value)}
                  placeholder="Summarize the core constitutional/syllabus principle..."
                  className="w-full bg-[#FCFBF9] border border-stone-300 rounded-xl p-2.5 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowAddConcept(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSaving ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Save Concept</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
