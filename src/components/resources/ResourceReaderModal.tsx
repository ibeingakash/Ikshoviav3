import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Bookmark,
  BookmarkCheck,
  Bot,
  Download,
  RotateCcw,
  BookOpen,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { LearningResource } from '../../types/index.js';
import { registerBackButtonHandler } from '../../lib/capacitor.js';
import { ResourceAskAIDialog } from './ResourceAskAIDialog.js';

interface ResourceReaderModalProps {
  resource: LearningResource;
  isOpen: boolean;
  onClose: () => void;
  onBookmarkChanged?: (resourceId: string, isBookmarked: boolean) => void;
  onProgressUpdated?: (resourceId: string, lastPage: number, progressPercentage: number) => void;
}

export const ResourceReaderModal: React.FC<ResourceReaderModalProps> = ({
  resource,
  isOpen,
  onClose,
  onBookmarkChanged,
  onProgressUpdated,
}) => {
  const totalPages = Math.max(1, resource.page_count || 1);
  const initialPage = Math.min(
    totalPages,
    Math.max(1, resource.last_page || resource.lastPage || 1)
  );

  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [pageInput, setPageInput] = useState<string>(String(initialPage));
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(
    Boolean(resource.is_bookmarked || resource.isBookmarked)
  );
  const [bookmarkLoading, setBookmarkLoading] = useState<boolean>(false);
  const [isAskAIOpen, setIsAskAIOpen] = useState<boolean>(false);
  const [streamLoading, setStreamLoading] = useState<boolean>(true);
  const [streamError, setStreamError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync initial page when resource changes & set loading timeout
  useEffect(() => {
    const p = Math.min(totalPages, Math.max(1, resource.last_page || resource.lastPage || 1));
    setCurrentPage(p);
    setPageInput(String(p));
    setIsBookmarked(Boolean(resource.is_bookmarked || resource.isBookmarked));
    setStreamLoading(true);
    setStreamError(null);

    // Ensure overlay never persists indefinitely if browser doesn't fire load event for PDF plugin
    const timer = setTimeout(() => {
      setStreamLoading(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, [resource.id]);

  // Handle Android back button
  useEffect(() => {
    if (isOpen) {
      const unregister = registerBackButtonHandler(() => {
        if (isAskAIOpen) {
          setIsAskAIOpen(false);
          return true;
        }
        handleSaveAndClose();
        return true;
      });
      return () => unregister();
    }
  }, [isOpen, isAskAIOpen, currentPage]);

  // Persist reading progress on page change (debounced)
  useEffect(() => {
    const progressPct = Math.min(100, Math.round((currentPage / totalPages) * 100));
    const timer = setTimeout(() => {
      api.saveResourceProgress(resource.id, currentPage, totalPages, progressPct).catch((err) => {
        console.warn('Could not auto-save reading progress:', err);
      });
      if (onProgressUpdated) {
        onProgressUpdated(resource.id, currentPage, progressPct);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [currentPage, resource.id, totalPages]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || isAskAIOpen) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        goToPage(currentPage + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        goToPage(currentPage - 1);
      } else if (e.key === 'Escape') {
        handleSaveAndClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isAskAIOpen, currentPage, totalPages]);

  const goToPage = (page: number) => {
    const valid = Math.max(1, Math.min(totalPages, page));
    setCurrentPage(valid);
    setPageInput(String(valid));

    // If iframe supports PDF fragment navigation, update src hash
    if (iframeRef.current) {
      try {
        iframeRef.current.src = valid > 1
          ? `/api/resources/${resource.id}/stream#page=${valid}`
          : `/api/resources/${resource.id}/stream`;
      } catch (e) {
        // ignore hash set error
      }
    }
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(pageInput, 10);
    if (!isNaN(parsed)) {
      goToPage(parsed);
    } else {
      setPageInput(String(currentPage));
    }
  };

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

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const handleSaveAndClose = () => {
    const progressPct = Math.min(100, Math.round((currentPage / totalPages) * 100));
    api.saveResourceProgress(resource.id, currentPage, totalPages, progressPct).catch(() => {});
    if (onProgressUpdated) {
      onProgressUpdated(resource.id, currentPage, progressPct);
    }
    onClose();
  };

  if (!isOpen) return null;

  const streamUrl = currentPage > 1
    ? `/api/resources/${resource.id}/stream#page=${currentPage}`
    : `/api/resources/${resource.id}/stream`;

  const isGoogleDriveStream = resource.storage_provider === 'GOOGLE_DRIVE' || Boolean(resource.drive_file_id);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div
        ref={containerRef}
        className="bg-stone-900 text-stone-100 rounded-2xl border border-stone-800 shadow-2xl w-full h-[95vh] max-w-6xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Control Bar */}
        <div className="px-4 py-3 bg-stone-950 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3">
          {/* Title & Metadata */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-xs sm:text-sm text-stone-100 truncate">
                {resource.title}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-stone-400 truncate">
                <span>{resource.author || 'IKSHOVIA Faculty'}</span>
                <span>•</span>
                <span className="text-amber-400 font-medium">{resource.subject || 'General Studies'}</span>
                <span>•</span>
                <span className="hidden sm:inline">{resource.exam || 'UPSC / BPSC'}</span>
                <span>•</span>
                <span className="text-stone-400">
                  {isGoogleDriveStream ? 'Streaming directly from Google Drive' : 'Local PDF Stream'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5 bg-stone-900 p-1 rounded-xl border border-stone-800">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 text-stone-300 hover:text-white disabled:opacity-30 rounded-lg hover:bg-stone-800 transition cursor-pointer"
              title="Previous Page (Left Arrow)"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1 text-xs">
              <span className="text-stone-400 text-[11px] hidden sm:inline">Page</span>
              <input
                type="text"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={() => setPageInput(String(currentPage))}
                className="w-10 px-1.5 py-0.5 text-center font-bold text-xs bg-stone-950 text-amber-300 rounded border border-stone-700 focus:outline-none focus:border-amber-400"
              />
              <span className="text-stone-400 text-[11px]">of {totalPages}</span>
            </form>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 text-stone-300 hover:text-white disabled:opacity-30 rounded-lg hover:bg-stone-800 transition cursor-pointer"
              title="Next Page (Right Arrow)"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5">
            {/* Ask AI Context Button */}
            <button
              onClick={() => setIsAskAIOpen(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Ask AI Tutor about this page"
            >
              <Bot className="w-3.5 h-3.5 text-amber-200" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>

            {/* Bookmark Toggle */}
            <button
              onClick={handleToggleBookmark}
              disabled={bookmarkLoading}
              className={`p-2 rounded-xl transition border cursor-pointer ${
                isBookmarked
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-white hover:bg-stone-800'
              }`}
              title={isBookmarked ? 'Bookmarked' : 'Add to Bookmarks'}
              aria-label="Toggle Bookmark"
            >
              {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>

            {/* Zoom Controls */}
            <div className="hidden md:flex items-center gap-1 bg-stone-900 px-1 py-0.5 rounded-xl border border-stone-800 text-xs">
              <button
                onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                className="p-1 text-stone-400 hover:text-white rounded"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-semibold text-stone-400 w-9 text-center">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
                className="p-1 text-stone-400 hover:text-white rounded"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Download */}
            <a
              href={`/api/resources/${resource.id}/download`}
              target="_blank"
              rel="noreferrer"
              className="p-2 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white rounded-xl border border-stone-800 transition"
              title="Download PDF"
              aria-label="Download PDF"
            >
              <Download className="w-4 h-4" />
            </a>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white rounded-xl border border-stone-800 transition hidden sm:block"
              title="Toggle Fullscreen"
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={handleSaveAndClose}
              className="p-2 bg-stone-800 hover:bg-red-900/40 text-stone-300 hover:text-red-300 rounded-xl transition cursor-pointer"
              title="Save & Close"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Reader Canvas / Document Viewport */}
        <div className="flex-1 bg-stone-950 relative overflow-hidden flex flex-col">
          {streamLoading && (
            <div className="absolute inset-0 z-10 bg-stone-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-stone-400 gap-3 pointer-events-none">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
              <div className="text-center">
                <p className="text-xs font-semibold text-stone-200">
                  Streaming {resource.title}...
                </p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Resuming at Page {currentPage} of {totalPages}
                </p>
              </div>
            </div>
          )}

          {streamError ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-stone-400">
              <AlertCircle className="w-10 h-10 text-amber-500 mb-2" />
              <h4 className="text-sm font-bold text-stone-200">Could not render PDF stream</h4>
              <p className="text-xs text-stone-400 mt-1 max-w-md">
                Your browser or network prevented live PDF streaming. You can download the verified document directly.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => {
                    setStreamError(null);
                    setStreamLoading(true);
                  }}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold"
                >
                  Retry
                </button>
                <a
                  href={`/api/resources/${resource.id}/download`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </a>
              </div>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={streamUrl}
              title={resource.title}
              onLoad={() => setStreamLoading(false)}
              onError={() => {
                setStreamLoading(false);
                setStreamError('Failed to load streaming viewer');
              }}
              className="w-full h-full border-0 bg-stone-900"
            />
          )}

          {/* Bottom Progress Bar */}
          <div className="h-1 bg-stone-800 w-full">
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.round((currentPage / totalPages) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grounded AI Tutor Drawer / Dialog */}
      <ResourceAskAIDialog
        resource={resource}
        currentPage={currentPage}
        isOpen={isAskAIOpen}
        onClose={() => setIsAskAIOpen(false)}
      />
    </div>
  );
};
