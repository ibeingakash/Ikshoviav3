import React, { useState } from 'react';
import { X, Image as ImageIcon, CheckCircle2, AlertTriangle, Trash2, Eye } from 'lucide-react';
import { api } from '../../../lib/api.js';

interface FigureEditorModalProps {
  question: any;
  onClose: () => void;
  onFigureSaved: (updatedQuestion: any) => void;
}

export const FigureEditorModal: React.FC<FigureEditorModalProps> = ({
  question,
  onClose,
  onFigureSaved,
}) => {
  const [imageUrl, setImageUrl] = useState<string>(question.imageUrl || question.image_url || '');
  const [imageCaption, setImageCaption] = useState<string>(question.imageCaption || question.image_caption || '');
  const [figureStatus, setFigureStatus] = useState<string>(
    question.figureStatus || (question.imageUrl ? 'FIGURE_VERIFIED' : 'FIGURE_REVIEW_REQUIRED')
  );
  const [reason, setReason] = useState<string>('Verified diagram / map accuracy');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await api.updateQuestionFigure(question.id, {
        imageUrl: imageUrl.trim() || undefined,
        imageCaption: imageCaption.trim() || undefined,
        figureStatus,
        reason,
      });

      if (res && res.success && res.question) {
        onFigureSaved(res.question);
        onClose();
      } else {
        setErrorMessage(res?.error || 'Failed to update figure.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while saving figure.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearFigure = () => {
    setImageUrl('');
    setImageCaption('');
    setFigureStatus('FIGURE_NOT_REQUIRED');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold text-white">
                Figure / Diagram Editor — Q#{question.questionNum || question.questionNumber || '—'}
              </h2>
              <p className="text-xs text-slate-400">
                Inspect, attach, or verify visual maps and diagrams for this question.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMessage && (
            <div className="bg-rose-950/60 border border-rose-800 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Image Preview Box */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
            {imageUrl ? (
              <div className="space-y-2">
                <div className="max-h-60 overflow-hidden flex items-center justify-center rounded-lg bg-black/50 p-2 border border-slate-800">
                  <img
                    src={imageUrl}
                    alt={imageCaption || 'Question figure'}
                    className="max-h-56 max-w-full object-contain rounded"
                    onError={() => setErrorMessage('Failed to load image from provided URL.')}
                  />
                </div>
                {imageCaption && (
                  <p className="text-xs text-slate-400 italic font-mono">{imageCaption}</p>
                )}
                <div className="flex justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleClearFigure}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Diagram</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 space-y-2">
                <ImageIcon className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No figure currently attached to this question.</p>
              </div>
            )}
          </div>

          {/* Image URL Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Figure Image URL or Base64 URI
            </label>
            <input
              type="text"
              placeholder="https://example.com/figure.png or data:image/png;base64,..."
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Caption */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Figure Caption / Diagram Title
            </label>
            <input
              type="text"
              placeholder="e.g. Figure 1: Geological cross section of Himalayan fault lines"
              value={imageCaption}
              onChange={e => setImageCaption(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Verification Status */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Figure Verification Status
            </label>
            <select
              value={figureStatus}
              onChange={e => setFigureStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="FIGURE_VERIFIED">FIGURE_VERIFIED — Visual is clear and validated</option>
              <option value="FIGURE_REVIEW_REQUIRED">FIGURE_REVIEW_REQUIRED — Needs visual clarity check</option>
              <option value="FIGURE_MISSING">FIGURE_MISSING — Visual referred in text but image missing</option>
              <option value="FIGURE_NOT_REQUIRED">FIGURE_NOT_REQUIRED — Text only, no visual needed</option>
            </select>
          </div>

          {/* Audit Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Audit Note / Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-white rounded-xl bg-indigo-600 hover:bg-indigo-500 transition shadow-lg flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Update & Verify Figure</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
