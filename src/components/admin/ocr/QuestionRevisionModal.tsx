import React, { useState, useEffect } from 'react';
import { X, History, Clock, User, ShieldCheck, ArrowRight, AlertCircle, FileText } from 'lucide-react';
import { api } from '../../../lib/api.js';

interface QuestionRevisionModalProps {
  question: any;
  onClose: () => void;
  onCorrectionSaved?: (updatedQuestion: any) => void;
}

export const QuestionRevisionModal: React.FC<QuestionRevisionModalProps> = ({
  question,
  onClose,
  onCorrectionSaved,
}) => {
  const [revisions, setRevisions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'AUDIT_LOG' | 'NEW_CORRECTION'>('AUDIT_LOG');

  // Correction Form
  const [fieldChanged, setFieldChanged] = useState<'questionText' | 'options' | 'correctAnswer' | 'explanation' | 'figure'>('questionText');
  const [correctionReason, setCorrectionReason] = useState('');
  const [newQuestionText, setNewQuestionText] = useState(question.question || question.question_text || '');
  const [newCorrectAnswer, setNewCorrectAnswer] = useState(question.correctAnswer || question.correct_answer || '');
  const [newExplanation, setNewExplanation] = useState(question.explanation || '');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchRevisions = async () => {
    setIsLoading(true);
    try {
      const res = await api.getQuestionRevisions(question.id);
      if (res && res.success && Array.isArray(res.revisions)) {
        setRevisions(res.revisions);
      }
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRevisions();
  }, [question.id]);

  const handleApplyCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionReason.trim()) {
      setStatusMessage({ type: 'error', text: 'Please provide a reason for this audit trail correction.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);
    try {
      const payload: any = {
        fieldChanged,
        reason: correctionReason.trim(),
        oldValue: fieldChanged === 'questionText'
          ? (question.question || question.question_text)
          : fieldChanged === 'correctAnswer'
          ? (question.correctAnswer || question.correct_answer)
          : (question.explanation || ''),
        newValue: fieldChanged === 'questionText'
          ? newQuestionText
          : fieldChanged === 'correctAnswer'
          ? newCorrectAnswer
          : newExplanation,
      };

      if (fieldChanged === 'questionText') payload.newQuestionText = newQuestionText;
      if (fieldChanged === 'correctAnswer') payload.newCorrectAnswer = newCorrectAnswer;
      if (fieldChanged === 'explanation') payload.newExplanation = newExplanation;

      const res = await api.correctQuestion(question.id, payload);
      if (res && res.success) {
        setStatusMessage({ type: 'success', text: 'Correction recorded successfully in immutable revision log!' });
        setCorrectionReason('');
        await fetchRevisions();
        if (onCorrectionSaved && res.question) {
          onCorrectionSaved(res.question);
        }
      } else {
        setStatusMessage({ type: 'error', text: res?.error || 'Failed to save correction.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error occurred while saving correction.' });
    } finally {
      setIsSaving(false);
    }
  };

  const originalOcrText = question.originalOcrText || question.original_ocr_text || question.question || question.question_text;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">
                Question #{question.questionNum || question.questionNumber || '—'} Revision & Provenance Audit
              </h2>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400">
                Source: <span className="text-emerald-400 font-semibold">{question.source || question.sourceType || 'OFFICIAL_COMMISSION'}</span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">
                Corrections Count: <span className="text-white font-bold">{revisions.length}</span>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-6 gap-4">
          <button
            onClick={() => setActiveTab('AUDIT_LOG')}
            className={`py-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'AUDIT_LOG'
                ? 'text-amber-400 border-amber-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Audit Trail History ({revisions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('NEW_CORRECTION')}
            className={`py-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'NEW_CORRECTION'
                ? 'text-indigo-400 border-indigo-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Record New Correction</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-800 text-rose-300'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{statusMessage.text}</span>
            </div>
          )}

          {activeTab === 'AUDIT_LOG' ? (
            <div className="space-y-4">
              {/* Immutable Original Source Block */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400">Original Commission / OCR Source Text</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-slate-400 border border-slate-800">
                    IMMUTABLE PROVENANCE
                  </span>
                </div>
                <p className="text-xs text-slate-300 italic bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80 font-mono">
                  {originalOcrText || 'No original OCR text preserved.'}
                </p>
              </div>

              {/* Revision List */}
              {isLoading ? (
                <div className="text-center py-8 text-xs text-slate-500">Loading audit history...</div>
              ) : revisions.length === 0 ? (
                <div className="text-center py-8 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                  <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No revisions yet. Question matches original OCR source.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-400">Logged Revisions:</span>
                  {revisions.map((rev, idx) => (
                    <div
                      key={rev.id || idx}
                      className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                            Rev #{rev.revisionNum || idx + 1}
                          </span>
                          <span className="font-semibold text-white">
                            Field: {rev.fieldChanged}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(rev.changedAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                        <div>
                          <span className="text-rose-400 font-semibold block mb-0.5">Previous Value:</span>
                          <span className="text-slate-400 break-words font-mono">{rev.oldValue || '—'}</span>
                        </div>
                        <div>
                          <span className="text-emerald-400 font-semibold block mb-0.5">Corrected Value:</span>
                          <span className="text-slate-200 break-words font-mono">{rev.newValue || '—'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[11px]">
                        <span className="text-slate-400">
                          <span className="font-semibold text-slate-300">Reason:</span> {rev.reason}
                        </span>
                        <span className="text-slate-500 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {rev.changedBy}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* New Correction Form */
            <form onSubmit={handleApplyCorrection} className="space-y-4">
              <div className="bg-amber-950/30 border border-amber-800/50 p-3 rounded-xl text-xs text-amber-200">
                <span className="font-bold">Provenance Notice:</span> Correcting this question will not erase the original commission OCR text. It appends an audited override entry into the revision log.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Field to Correct</label>
                <select
                  value={fieldChanged}
                  onChange={e => setFieldChanged(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="questionText">Question Text</option>
                  <option value="correctAnswer">Correct Answer</option>
                  <option value="explanation">Explanation</option>
                </select>
              </div>

              {fieldChanged === 'questionText' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Corrected Question Text</label>
                  <textarea
                    rows={4}
                    value={newQuestionText}
                    onChange={e => setNewQuestionText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              {fieldChanged === 'correctAnswer' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Corrected Answer Key</label>
                  <input
                    type="text"
                    value={newCorrectAnswer}
                    onChange={e => setNewCorrectAnswer(e.target.value.toUpperCase())}
                    placeholder="e.g. A, B, C, D, or E"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              {fieldChanged === 'explanation' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Corrected Official Explanation</label>
                  <textarea
                    rows={3}
                    value={newExplanation}
                    onChange={e => setNewExplanation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Correction Reason (Required for Commission Provenance) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fixed OCR typo in article number, updated answer key from final commission gazette"
                  value={correctionReason}
                  onChange={e => setCorrectionReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('AUDIT_LOG')}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-bold text-white rounded-xl bg-indigo-600 hover:bg-indigo-500 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? 'Logging Revision...' : 'Save & Record Revision'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
