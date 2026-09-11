import React, { useState, useEffect, useRef } from 'react';
import {
  FileUp,
  FileText,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Filter,
  Trash2,
  Edit3,
  BookOpen,
  Check,
  X,
  RefreshCw,
  Info,
  UploadCloud,
  ShieldCheck,
  Eye,
  Save,
  Send,
  Plus,
  Table as TableIcon,
  Clock,
  ExternalLink,
  Archive,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { ShortNote, ShortNoteBlock, ResourceVisibility } from '../../types/index.js';
import { StructuredBlockCard } from '../resources/ShortNotesView.js';

export const ShortNotesAdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'review' | 'upload'>('review');

  // List & Filter states
  const [notes, setNotes] = useState<ShortNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Editing Note State
  const [selectedNote, setSelectedNote] = useState<ShortNote | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedBlocks, setEditedBlocks] = useState<ShortNoteBlock[]>([]);
  const [savingNote, setSavingNote] = useState<boolean>(false);
  const [showRawOcr, setShowRawOcr] = useState<boolean>(false);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<{
    file: File | null;
    name: string;
    sizeKb: number;
    base64: string;
  } | null>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formExam, setFormExam] = useState<string>('UPSC CSE');
  const [formSubject, setFormSubject] = useState<string>('Polity');
  const [formTopic, setFormTopic] = useState<string>('');
  const [formTags, setFormTags] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formYear, setFormYear] = useState<string>('2025');
  const [formLanguage, setFormLanguage] = useState<'en' | 'hi' | 'bilingual'>('en');
  const [formAutoPublish, setFormAutoPublish] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch admin notes
  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminShortNotes({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        subject: subjectFilter === 'ALL' ? undefined : subjectFilter,
        search: searchQuery || undefined,
        limit: 100,
      });
      setNotes(res?.notes || []);
    } catch (err: any) {
      console.warn('Notice when loading admin short notes:', err?.message || err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [statusFilter, subjectFilter]);

  // File Upload Selection
  const handleFileSelect = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setUploadFile({
        file,
        name: file.name,
        sizeKb: Math.round(file.size / 1024),
        base64,
      });
      if (!formTitle) {
        setFormTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Upload & Run Existing OCR
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a PDF or image file first.');
      return;
    }
    if (!formTitle.trim()) {
      setUploadError('Please provide a descriptive title for this Short Note.');
      return;
    }
    if (!formSubject.trim() || !formTopic.trim()) {
      setUploadError('Subject and Topic are required.');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setUploadResult(null);

      const tagsArray = formTags
        .split(',')
        .map(t => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const res = await api.uploadShortNote({
        title: formTitle.trim(),
        exam: formExam,
        subject: formSubject.trim(),
        topic: formTopic.trim(),
        tags: tagsArray,
        description: formDescription.trim(),
        year: formYear ? parseInt(formYear, 10) : undefined,
        language: formLanguage,
        fileBase64: uploadFile.base64,
        fileName: uploadFile.name,
        autoPublish: formAutoPublish,
      });

      setUploadResult(res);
      // Reset form on success
      setUploadFile(null);
      setFormTitle('');
      setFormTopic('');
      setFormTags('');
      setFormDescription('');
      fetchNotes();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload and run OCR');
    } finally {
      setUploading(false);
    }
  };

  // Open note for review
  const handleSelectNoteForReview = async (noteId: string) => {
    try {
      setSavingNote(true);
      const res = await api.getAdminShortNoteById(noteId);
      setSelectedNote(res.shortNote);
      setEditedBlocks(res.shortNote.blocks || []);
      setIsEditing(false);
      setShowRawOcr(false);
    } catch (err) {
      console.error('Failed to open note for review:', err);
    } finally {
      setSavingNote(false);
    }
  };

  // Save changes to note blocks
  const handleSaveBlockChanges = async () => {
    if (!selectedNote) return;
    try {
      setSavingNote(true);
      const res = await api.updateAdminShortNote(selectedNote.id, {
        blocks: editedBlocks,
        title: selectedNote.title,
        subject: selectedNote.subject,
        topic: selectedNote.topic,
      });
      setSelectedNote(res.shortNote);
      setEditedBlocks(res.shortNote.blocks);
      setIsEditing(false);
      fetchNotes();
    } catch (err) {
      console.error('Failed to save changes:', err);
    } finally {
      setSavingNote(false);
    }
  };

  // Publish note
  const handlePublishNote = async (noteId: string) => {
    try {
      setSavingNote(true);
      const res = await api.publishAdminShortNote(noteId);
      if (selectedNote && selectedNote.id === noteId) {
        setSelectedNote(res.shortNote);
      }
      fetchNotes();
    } catch (err) {
      console.error('Failed to publish note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  // Archive note
  const handleArchiveNote = async (noteId: string) => {
    try {
      setSavingNote(true);
      const res = await api.archiveAdminShortNote(noteId);
      if (selectedNote && selectedNote.id === noteId) {
        setSelectedNote(res.shortNote);
      }
      fetchNotes();
    } catch (err) {
      console.error('Failed to archive note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  // Delete note flows (in-app modal to avoid iframe prompt blockage)
  const handleRequestDelete = (noteId: string, title: string) => {
    setNoteToDelete({ id: noteId, title });
  };

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    const noteId = noteToDelete.id;
    setIsDeleting(true);
    try {
      // Optimistic UI update
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
      await api.deleteAdminShortNote(noteId);
      setToastMessage('Short Note deleted successfully');
      setTimeout(() => setToastMessage(null), 3500);
      setNoteToDelete(null);
      fetchNotes();
    } catch (err: any) {
      console.error('Failed to delete note:', err);
      setToastMessage(`Error: ${err.message || 'Failed to delete short note'}`);
      setNoteToDelete(null);
      fetchNotes();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans pb-16 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Administrative OCR & Revision Cards Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-stone-900 tracking-tight">
              Short Notes Production Studio
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-3xl leading-relaxed">
              Upload standard notes PDFs or scanned images. The existing Test Paper OCR engine extracts the content,
              the Short Notes Structure Mapper identifies tables, timelines, and facts, and you can review or correct
              every card before publishing to learners.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('upload');
                setSelectedNote(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                activeTab === 'upload'
                  ? 'bg-amber-600 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <FileUp className="w-4 h-4" />
              Upload New Short Note
            </button>
            <button
              onClick={() => {
                setActiveTab('review');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                activeTab === 'review'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              Review & Manage Notes ({notes.length})
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: UPLOAD & OCR INGESTION */}
      {activeTab === 'upload' && (
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6 sm:p-8 shadow-2xs animate-fadeIn">
          <h2 className="text-lg font-serif-editorial font-bold text-stone-900 mb-1 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-amber-700" />
            Upload Short Note PDF / Document
          </h2>
          <p className="text-xs text-stone-500 mb-6">
            Files are processed using the existing Test Paper OCR pipeline. No duplicate OCR models are invoked.
          </p>

          <form onSubmit={handleUploadSubmit} className="space-y-6">
            {/* Drag & Drop File Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              className="border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-2xl p-8 text-center cursor-pointer bg-stone-50/50 hover:bg-amber-50/20 transition-all"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                accept=".pdf,image/*"
                className="hidden"
              />

              <div className="space-y-2">
                <FileText className="w-10 h-10 text-amber-700 mx-auto" />
                {uploadFile ? (
                  <div>
                    <p className="text-sm font-bold text-stone-800">{uploadFile.name}</p>
                    <p className="text-xs text-stone-500">{uploadFile.sizeKb} KB • Ready for OCR</p>
                    <span className="inline-block mt-2 text-xs font-semibold text-amber-700 underline">
                      Click to choose a different file
                    </span>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-stone-700">
                      Drag and drop your PDF or image here, or <span className="text-amber-700 underline">browse</span>
                    </p>
                    <p className="text-xs text-stone-400 mt-1">Supports PDF, PNG, JPG, WEBP</p>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-stone-700">Note Title *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. Fundamental Rights vs DPSP: Comprehensive Matrix"
                  required
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Target Exam</label>
                <select
                  value={formExam}
                  onChange={e => setFormExam(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="UPSC CSE">UPSC CSE (Civil Services)</option>
                  <option value="BPSC 71st CCE">BPSC 71st CCE</option>
                  <option value="ALL">All State / Central PSCs</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Subject *</label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={e => setFormSubject(e.target.value)}
                  placeholder="e.g. Polity, History, Economy, Environment"
                  required
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Topic *</label>
                <input
                  type="text"
                  value={formTopic}
                  onChange={e => setFormTopic(e.target.value)}
                  placeholder="e.g. Constitutional Framework, Monetary Policy"
                  required
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Year</label>
                <input
                  type="number"
                  value={formYear}
                  onChange={e => setFormYear(e.target.value)}
                  placeholder="2025"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Language</label>
                <select
                  value={formLanguage}
                  onChange={e => setFormLanguage(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="bilingual">Bilingual (English + Hindi)</option>
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-stone-700">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={e => setFormTags(e.target.value)}
                  placeholder="prelims2025, articles, constitution, basic-structure"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <label className="text-xs font-bold text-stone-700">Brief Overview / Description</label>
                <textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="High-yield revision card focusing on key distinctions, landmark judgments, and exception clauses..."
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Auto Publish Checkbox */}
            <div className="flex items-center gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <input
                type="checkbox"
                id="autoPublish"
                checked={formAutoPublish}
                onChange={e => setFormAutoPublish(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
              />
              <label htmlFor="autoPublish" className="text-xs font-medium text-stone-700 cursor-pointer">
                <span className="font-bold text-stone-900">Auto-publish to learners immediately.</span> (Uncheck
                if you prefer to review and refine blocks before publishing)
              </label>
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Upload Result Feedback */}
            {uploadResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{uploadResult.message}</span>
                </div>
                {uploadResult.ocrSummary && (
                  <p className="text-[11px] text-emerald-800">
                    Engine: <span className="font-bold">{uploadResult.ocrSummary.engineUsed}</span> | Pages:{' '}
                    {uploadResult.ocrSummary.pages} | Characters: {uploadResult.ocrSummary.totalChars} | Structured
                    Blocks: <span className="font-bold">{uploadResult.ocrSummary.blocksCount}</span>
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (uploadResult.shortNote?.id) {
                      handleSelectNoteForReview(uploadResult.shortNote.id);
                      setActiveTab('review');
                    }
                  }}
                  className="mt-2 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition-colors"
                >
                  Review & Edit This Note →
                </button>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={uploading || !uploadFile}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                  uploading || !uploadFile
                    ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                    : 'bg-stone-900 hover:bg-stone-800 text-white'
                }`}
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Running Existing Test Paper OCR Pipeline...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Upload & Extract Structured Blocks
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: REVIEW & MANAGE NOTES */}
      {activeTab === 'review' && (
        <div className="space-y-6">
          {/* Note Detail / Correction Studio Modal or View */}
          {selectedNote ? (
            <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                <div>
                  <button
                    onClick={() => setSelectedNote(null)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors mb-2"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Notes List
                  </button>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                        selectedNote.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-900'
                          : selectedNote.status === 'REVIEW_REQUIRED'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {selectedNote.status}
                    </span>
                    <span className="text-xs font-bold text-stone-500">
                      {selectedNote.subject} • {selectedNote.topic}
                    </span>
                  </div>

                  <h2 className="text-xl font-serif-editorial font-bold text-stone-900 mt-1">
                    {selectedNote.title}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowRawOcr(!showRawOcr)}
                    className="px-3 py-1.5 bg-stone-100 text-stone-700 rounded-lg text-xs font-medium hover:bg-stone-200 transition-colors"
                  >
                    {showRawOcr ? 'Hide Raw OCR Text' : 'Inspect Raw OCR'}
                  </button>

                  {isEditing ? (
                    <button
                      onClick={handleSaveBlockChanges}
                      disabled={savingNote}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save Block Edits
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-200 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Blocks
                    </button>
                  )}

                  {selectedNote.status !== 'PUBLISHED' && (
                    <button
                      onClick={() => handlePublishNote(selectedNote.id)}
                      disabled={savingNote}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                    >
                      <Send className="w-4 h-4" />
                      Approve & Publish to Learners
                    </button>
                  )}

                  <button
                    id={`btn-delete-editor-note-${selectedNote.id}`}
                    onClick={() => handleRequestDelete(selectedNote.id, selectedNote.title)}
                    className="flex items-center gap-1.5 px-3 py-2 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    title="Delete Short Note"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Raw OCR Text Collapsible Inspector */}
              {showRawOcr && (
                <div className="bg-stone-900 text-stone-200 rounded-xl p-4 font-mono text-xs max-h-60 overflow-y-auto space-y-2">
                  <div className="flex items-center justify-between text-stone-400 pb-2 border-b border-stone-800">
                    <span>Raw Output from Existing Test Paper OCR Pipeline</span>
                    <span>{selectedNote.rawOcrText?.length || 0} characters</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-stone-300">
                    {selectedNote.rawOcrText || 'No raw OCR text recorded.'}
                  </pre>
                </div>
              )}

              {/* Block Cards List / Editor */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Extracted Structured Blocks ({editedBlocks.length})
                  </h3>
                  {isEditing && (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      Editing Mode Active
                    </span>
                  )}
                </div>

                {editedBlocks.map((block, idx) => (
                  <div key={block.id} className="relative group">
                    {isEditing ? (
                      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs text-stone-500">
                          <span className="font-bold uppercase text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                            {block.type}
                          </span>
                          <button
                            onClick={() => {
                              setEditedBlocks(editedBlocks.filter((_, i) => i !== idx));
                            }}
                            className="text-rose-600 hover:text-rose-800 text-xs font-bold"
                          >
                            Remove Block
                          </button>
                        </div>

                        {/* Editable Content depending on type */}
                        {block.text !== undefined && (
                          <textarea
                            value={block.text}
                            onChange={e => {
                              const updated = [...editedBlocks];
                              updated[idx] = { ...updated[idx], text: e.target.value };
                              setEditedBlocks(updated);
                            }}
                            rows={block.type === 'heading' ? 1 : 3}
                            className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-xs font-sans text-stone-900"
                          />
                        )}

                        {block.type === 'bullet_list' && (
                          <textarea
                            value={block.items?.join('\n') || ''}
                            onChange={e => {
                              const updated = [...editedBlocks];
                              updated[idx] = {
                                ...updated[idx],
                                items: e.target.value.split('\n').filter(Boolean),
                              };
                              setEditedBlocks(updated);
                            }}
                            rows={4}
                            placeholder="One list item per line..."
                            className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-xs font-sans text-stone-900"
                          />
                        )}
                      </div>
                    ) : (
                      <StructuredBlockCard block={block} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Table of All Short Notes */
            <div className="bg-white border border-[#EAE6DF] rounded-2xl overflow-hidden shadow-2xs">
              <div className="p-5 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-800"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="REVIEW_REQUIRED">Review Required</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>

                  <select
                    value={subjectFilter}
                    onChange={e => setSubjectFilter(e.target.value)}
                    className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-800"
                  >
                    <option value="ALL">All Subjects</option>
                    <option value="Polity">Polity</option>
                    <option value="History">History</option>
                    <option value="Economy">Economy</option>
                    <option value="Environment">Environment</option>
                    <option value="Geography">Geography</option>
                  </select>
                </div>

                <div className="text-xs text-stone-500 font-medium">
                  Showing {notes.length} Short Note{notes.length === 1 ? '' : 's'}
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center text-stone-500 text-xs">
                  <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading repository...
                </div>
              ) : notes.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <BookOpen className="w-8 h-8 text-stone-300 mx-auto" />
                  <p className="text-sm font-bold text-stone-700">No Short Notes in Repository</p>
                  <p className="text-xs text-stone-500">
                    Switch to the Upload tab to ingest a PDF or document through the Test Paper OCR system.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
                        <th className="p-3.5">Title</th>
                        <th className="p-3.5">Subject & Topic</th>
                        <th className="p-3.5">Blocks</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {notes.map(note => (
                        <tr key={note.id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="p-3.5 font-bold text-stone-900 max-w-xs truncate">
                            {note.title}
                          </td>
                          <td className="p-3.5 text-stone-600">
                            <span className="font-semibold text-stone-800">{note.subject}</span> • {note.topic}
                          </td>
                          <td className="p-3.5 text-stone-500">
                            {note.blocks?.length || 0} blocks ({note.pageCount || 1} p)
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                note.status === 'PUBLISHED'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : note.status === 'REVIEW_REQUIRED'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-stone-200 text-stone-700'
                              }`}
                            >
                              {note.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => handleSelectNoteForReview(note.id)}
                              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg font-bold text-xs transition-colors"
                            >
                              Review & Edit
                            </button>
                            {note.status !== 'PUBLISHED' && (
                              <button
                                onClick={() => handlePublishNote(note.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors"
                              >
                                Publish
                              </button>
                            )}
                            <button
                              id={`btn-delete-shortnote-${note.id}`}
                              onClick={() => handleRequestDelete(note.id, note.title)}
                              className="px-2.5 py-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Delete Short Note"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* In-App Delete Confirmation Dialog (Reliable in iFrames) */}
      {noteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-md w-full p-6 shadow-2xl space-y-4 font-sans animate-scaleUp">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Delete Short Note</h3>
                <p className="text-xs text-stone-500">Action cannot be undone</p>
              </div>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed">
              Are you sure you want to delete <strong className="text-stone-900">"{noteToDelete.title}"</strong>?
              This will permanently remove the short note, its structured revision blocks, user progress, and bookmarks.
              <span className="block mt-1.5 text-stone-500 text-[11px]">
                Note: Shared canonical books, PYQs, questions, and Google Drive resources will NOT be touched or affected.
              </span>
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setNoteToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete-shortnote"
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-fadeIn border border-stone-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
