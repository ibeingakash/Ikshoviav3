import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Download,
  Eye,
  Bot,
  Filter,
  RefreshCw,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  X,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { LearningResource } from '../../types/index.js';
import { useLearner } from '../../context/LearnerContext.js';
import { isCapacitor, registerBackButtonHandler } from '../../lib/capacitor.js';

export const LearnerDriveLibraryTab: React.FC = () => {
  const { askTutorWithContext, setActiveSection } = useLearner();
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');

  // Preview Modal
  const [previewResource, setPreviewResource] = useState<LearningResource | null>(null);

  // Close preview modal on Android back button
  useEffect(() => {
    if (previewResource) {
      const unregister = registerBackButtonHandler(() => {
        setPreviewResource(null);
        return true; // handled
      });
      return () => unregister();
    }
  }, [previewResource]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const data = await api.getResources({
        type: selectedType !== 'ALL' ? selectedType : undefined,
        subject: selectedSubject !== 'ALL' ? selectedSubject : undefined,
        search: searchQuery || undefined,
        limit: 50,
      });
      setResources(data.resources);
    } catch (err) {
      console.error('Failed to load published resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [selectedType, selectedSubject, searchQuery]);

  const handleAskAITutor = (res: LearningResource) => {
    if (askTutorWithContext) {
      askTutorWithContext(
        `Explain the high-yield exam concepts from "${res.title}"`,
        res.conceptId || undefined,
        {
          resourceId: res.id,
          resourceTitle: res.title,
          subjectName: res.subject,
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-header and Search */}
      <div className="bg-white p-5 rounded-2xl border border-[#EAE6DF] shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-700" />
              <span>Standard Civil Services Reference Library</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              High-yield standard textbooks, official documents, and syllabus compendiums with AI Tutor knowledge grounding.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search books, topics, authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 text-xs">
          <span className="font-semibold text-stone-500 uppercase tracking-wider text-[10px] mr-1">Type:</span>
          {['ALL', 'BOOK', 'OFFICIAL_DOCUMENT', 'NOTES', 'SYLLABUS'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                selectedType === t
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {t === 'ALL' ? 'All' : t.replace('_', ' ')}
            </button>
          ))}

          <span className="font-semibold text-stone-500 uppercase tracking-wider text-[10px] ml-3 mr-1">Subject:</span>
          {['ALL', 'Indian Polity', 'Modern History', 'Economy', 'Geography', 'Environment & Ecology'].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSubject(s)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                selectedSubject === s
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Resources */}
      {loading ? (
        <div className="py-20 text-center text-stone-400 flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
          <span className="text-xs font-medium">Loading library documents...</span>
        </div>
      ) : resources.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-12 text-center text-stone-500">
          <BookOpen className="w-10 h-10 mx-auto text-stone-300 mb-2" />
          <h3 className="font-bold text-stone-800 text-sm">No documents found in this filter</h3>
          <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or filter selection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((res) => (
            <div
              key={res.id}
              className="bg-white rounded-2xl border border-[#EAE6DF] hover:border-amber-400/80 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                    {res.resource_type || res.type || 'BOOK'}
                  </span>
                  <span className="text-[11px] font-medium text-stone-500">
                    {res.page_count || 1} pages
                  </span>
                </div>

                <h3 className="text-sm font-bold text-stone-900 mt-3 group-hover:text-amber-800 transition-colors line-clamp-2">
                  {res.title}
                </h3>

                <p className="text-xs text-stone-500 mt-1">
                  By <strong className="text-stone-700 font-medium">{res.author || 'IKSHOVIA Faculty'}</strong>
                </p>

                {res.description && (
                  <p className="text-xs text-stone-600 mt-2 line-clamp-3 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                    {res.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-1.5 mt-3 text-[11px] text-stone-500">
                  <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                    {res.subject || res.subjectId}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                    {res.exam || res.examTag || 'ALL'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setPreviewResource(res)}
                  className="min-h-[40px] px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Read PDF</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`/api/resources/${res.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition"
                    title="Download PDF"
                    aria-label="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => handleAskAITutor(res)}
                    className="min-h-[40px] px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    title="Ask AI Tutor grounded in this book"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Ask Tutor</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* READ PDF MODAL */}
      {previewResource && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-4xl w-full h-[88vh] sm:h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50 gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-stone-900 text-xs sm:text-sm truncate">{previewResource.title}</h3>
                <p className="text-[11px] text-stone-500 truncate">
                  {previewResource.author} • {previewResource.page_count || 1} Pages
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleAskAITutor(previewResource)}
                  className="min-h-[40px] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Ask AI Tutor"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ask AI Tutor</span>
                </button>
                <a
                  href={`/api/resources/${previewResource.id}/download`}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[40px] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Download Document"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <button
                  onClick={() => setPreviewResource(null)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl cursor-pointer"
                  title="Close viewer"
                  aria-label="Close viewer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer or Android Native Fallback */}
            <div className="flex-1 bg-stone-100 relative flex flex-col">
              {isCapacitor() ? (
                /* Native Android Fallback Card (Android WebView cannot render embedded PDF plugins) */
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-stone-900">
                      Open PDF in Android Viewer
                    </h4>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      Android WebView securely delegates PDF document viewing to your device's native PDF reader (Google Drive, Adobe Acrobat, or Files).
                    </p>
                  </div>
                  <div className="w-full space-y-2 pt-2">
                    <a
                      href={`/api/resources/${previewResource.id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full min-h-[44px] py-2.5 px-4 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download & Open in System Reader</span>
                    </a>
                    <button
                      onClick={() => handleAskAITutor(previewResource)}
                      className="w-full min-h-[44px] py-2.5 px-4 bg-white border border-stone-200 text-stone-700 font-bold text-xs rounded-xl hover:bg-stone-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Bot className="w-4 h-4 text-indigo-600" />
                      <span>Ask AI Tutor Questions on this Book</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Web standard PDF iframe stream */
                <>
                  <iframe
                    src={`/api/resources/${previewResource.id}/stream`}
                    title={previewResource.title}
                    className="w-full flex-1 border-none"
                  />
                  <div className="p-2 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500 px-4">
                    <span>Having trouble loading the embedded document?</span>
                    <a
                      href={`/api/resources/${previewResource.id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>Download PDF</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
