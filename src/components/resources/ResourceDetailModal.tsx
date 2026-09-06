import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Eye,
  Bot,
  Bookmark,
  BookmarkCheck,
  Download,
  Clock,
  FileText,
  Layers,
  GraduationCap,
  Sparkles,
  Share2,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { LearningResource } from '../../types/index.js';
import { registerBackButtonHandler } from '../../lib/capacitor.js';
import { ResourceAskAIDialog } from './ResourceAskAIDialog.js';

interface ResourceDetailModalProps {
  resource: LearningResource;
  isOpen: boolean;
  onClose: () => void;
  onOpenReader: (resource: LearningResource) => void;
  onBookmarkChanged?: (resourceId: string, isBookmarked: boolean) => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  resource,
  isOpen,
  onClose,
  onOpenReader,
  onBookmarkChanged,
}) => {
  const [isBookmarked, setIsBookmarked] = useState<boolean>(
    Boolean(resource.is_bookmarked || resource.isBookmarked)
  );
  const [bookmarkLoading, setBookmarkLoading] = useState<boolean>(false);
  const [isAskAIOpen, setIsAskAIOpen] = useState<boolean>(false);

  useEffect(() => {
    setIsBookmarked(Boolean(resource.is_bookmarked || resource.isBookmarked));
  }, [resource.id, resource.is_bookmarked, resource.isBookmarked]);

  useEffect(() => {
    if (isOpen) {
      const unregister = registerBackButtonHandler(() => {
        if (isAskAIOpen) {
          setIsAskAIOpen(false);
          return true;
        }
        onClose();
        return true;
      });
      return () => unregister();
    }
  }, [isOpen, isAskAIOpen]);

  if (!isOpen) return null;

  const totalPages = Math.max(1, resource.page_count || 1);
  const lastPage = Math.min(totalPages, Math.max(1, resource.last_page || resource.lastPage || 1));
  const progressPct =
    resource.progress_percentage !== undefined
      ? Number(resource.progress_percentage)
      : Math.round((lastPage / totalPages) * 100);

  const handleToggleBookmark = async () => {
    setBookmarkLoading(true);
    try {
      const res = await api.toggleResourceBookmark(resource.id);
      setIsBookmarked(res.isBookmarked);
      if (onBookmarkChanged) {
        onBookmarkChanged(resource.id, res.isBookmarked);
      }
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'PDF Document';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
              {resource.resource_type || resource.type || 'BOOK'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 text-stone-700">
              {resource.exam || resource.examTag || 'ALL'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Main Title & Cover Info */}
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Visual Cover Card */}
            <div className="w-full sm:w-40 h-52 bg-gradient-to-br from-amber-800 to-stone-900 rounded-xl p-4 flex flex-col justify-between text-white shadow-md shrink-0 border border-amber-700/40">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-amber-300">
                  IKSHOVIA LIBRARY
                </span>
                <h4 className="text-xs font-bold mt-1 line-clamp-3 leading-snug">
                  {resource.title}
                </h4>
              </div>

              <div className="border-t border-white/20 pt-2 text-[10px] text-stone-300">
                <p className="truncate font-medium">{resource.author || 'Faculty Reference'}</p>
                <p className="text-[9px] text-amber-300/80 mt-0.5">{totalPages} Pages</p>
              </div>
            </div>

            {/* Core Info Details */}
            <div className="flex-1 space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 leading-snug">
                {resource.title}
              </h2>

              <p className="text-xs text-stone-500">
                Author:{' '}
                <strong className="text-stone-800 font-semibold">
                  {resource.author || 'IKSHOVIA Editorial Board'}
                </strong>
              </p>

              {/* Metadata Badges */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2 rounded-xl bg-stone-50 border border-stone-100 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-stone-400 block leading-tight">Subject</span>
                    <span className="font-semibold text-stone-800 text-[11px] truncate block">
                      {resource.subject || 'General Studies'}
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-stone-50 border border-stone-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-stone-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-stone-400 block leading-tight">Pages</span>
                    <span className="font-semibold text-stone-800 text-[11px] block">
                      {totalPages} Pages
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-stone-50 border border-stone-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-stone-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-stone-400 block leading-tight">Est. Read Time</span>
                    <span className="font-semibold text-stone-800 text-[11px] block">
                      {resource.readTimeMinutes || 60} mins
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-stone-50 border border-stone-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-stone-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-stone-400 block leading-tight">Size</span>
                    <span className="font-semibold text-stone-800 text-[11px] block">
                      {formatFileSize(resource.file_size)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reading Progress Bar (if started) */}
              {lastPage > 1 && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1.5 mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-900">Your Reading Progress</span>
                    <span className="font-bold text-amber-700">{progressPct}%</span>
                  </div>
                  <div className="w-full bg-amber-200/50 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Last read at <strong>Page {lastPage}</strong> of {totalPages}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Description & Syllabus Overview */}
          {resource.description && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Syllabus & Document Overview
              </h3>
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700 leading-relaxed">
                {resource.description}
              </div>
            </div>
          )}

          {/* Topic Scope */}
          {resource.topic && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Focused Topic:
              </span>
              <p className="text-xs font-medium text-stone-800">{resource.topic}</p>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Bookmark Toggle */}
            <button
              onClick={handleToggleBookmark}
              disabled={bookmarkLoading}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer ${
                isBookmarked
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              {isBookmarked ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-amber-700" />
                  <span>Bookmarked</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 text-stone-400" />
                  <span>Bookmark</span>
                </>
              )}
            </button>

            {/* Ask AI Context */}
            <button
              onClick={() => setIsAskAIOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Ask AI about this resource"
            >
              <Bot className="w-4 h-4 text-amber-400" />
              <span>Ask AI Tutor</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Download */}
            <a
              href={`/api/resources/${resource.id}/download`}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded-xl transition border border-stone-200 bg-white"
              title="Download PDF"
              aria-label="Download PDF"
            >
              <Download className="w-4 h-4" />
            </a>

            {/* Primary Read Now / Resume CTA */}
            <button
              onClick={() => {
                onClose();
                onOpenReader(resource);
              }}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>{lastPage > 1 ? `Resume at Page ${lastPage}` : 'Read Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grounded AI Tutor Dialog */}
      <ResourceAskAIDialog
        resource={resource}
        currentPage={lastPage}
        isOpen={isAskAIOpen}
        onClose={() => setIsAskAIOpen(false)}
      />
    </div>
  );
};
