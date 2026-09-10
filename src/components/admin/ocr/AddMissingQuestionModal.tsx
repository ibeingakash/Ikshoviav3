import React, { useState } from 'react';
import { X, Plus, Trash2, CheckCircle2, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { api } from '../../../lib/api.js';
import { getExpectedOptionsForExam } from '../../../lib/examOptionPolicy.js';

interface AddMissingQuestionModalProps {
  jobId: string;
  exam: 'UPSC CSE' | 'BPSC' | string;
  suggestedQuestionNum?: number;
  existingMissingNumbers: number[];
  onClose: () => void;
  onQuestionAdded: (newQuestion: any, completeness?: any) => void;
}

export const AddMissingQuestionModal: React.FC<AddMissingQuestionModalProps> = ({
  jobId,
  exam,
  suggestedQuestionNum,
  existingMissingNumbers,
  onClose,
  onQuestionAdded,
}) => {
  const isBpsc = exam === 'BPSC' || exam?.toUpperCase().includes('BPSC');
  const defaultOptionKeys = isBpsc ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];
  const maxAllowedOptions = isBpsc ? 5 : 4;

  const [questionNum, setQuestionNum] = useState<number>(
    suggestedQuestionNum || (existingMissingNumbers.length > 0 ? existingMissingNumbers[0] : 1)
  );
  const [questionTextEn, setQuestionTextEn] = useState('');
  const [questionTextHi, setQuestionTextHi] = useState('');
  const [options, setOptions] = useState<{ id: string; text: string }[]>(
    defaultOptionKeys.map(k => ({ id: k, text: '' }))
  );
  const [optionsHi, setOptionsHi] = useState<{ id: string; text: string }[]>(
    defaultOptionKeys.map(k => ({ id: k, text: '' }))
  );
  const [correctAnswer, setCorrectAnswer] = useState<string>('A');
  const [explanationEn, setExplanationEn] = useState('');
  const [explanationHi, setExplanationHi] = useState('');

  // Visual / Figure
  const [hasVisualContent, setHasVisualContent] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');

  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isNoMissingQuestions = existingMissingNumbers.length === 0;
  const isInvalidQuestionNum = !isNoMissingQuestions && !existingMissingNumbers.includes(Number(questionNum));

  const handleOptionTextChange = (index: number, text: string, lang: 'en' | 'hi') => {
    if (lang === 'en') {
      const copy = [...options];
      copy[index] = { ...copy[index], text };
      setOptions(copy);
    } else {
      const copy = [...optionsHi];
      copy[index] = { ...copy[index], text };
      setOptionsHi(copy);
    }
  };

  const handleAddOption = () => {
    if (options.length >= maxAllowedOptions) return; // Strict policy: BPSC max 5 (A-E), UPSC max 4 (A-D). NEVER Option F!
    const canonicalOrder = isBpsc ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];
    const currentIds = options.map(o => o.id.toUpperCase());
    const nextChar = canonicalOrder.find(id => !currentIds.includes(id)) || String.fromCharCode(65 + options.length);
    setOptions(prev => [...prev, { id: nextChar, text: '' }]);
    setOptionsHi(prev => [...prev, { id: nextChar, text: '' }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    const filtered = options.filter((_, i) => i !== index);
    const filteredHi = optionsHi.filter((_, i) => i !== index);
    setOptions(filtered);
    setOptionsHi(filteredHi);
    if (!filtered.some(o => o.id === correctAnswer)) {
      setCorrectAnswer(filtered[0]?.id || 'A');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!jobId) {
      setErrorMessage('No active OCR Job ID found. Please select or load an OCR job first.');
      return;
    }

    if (isNoMissingQuestions) {
      setErrorMessage('All canonical questions are accounted for (0 missing). Insertion is disabled.');
      return;
    }

    if (isInvalidQuestionNum) {
      setErrorMessage(`Question #${questionNum} is already accounted for. Permitted missing numbers are: ${existingMissingNumbers.slice(0, 10).join(', ')}.`);
      return;
    }

    if (!questionTextEn.trim() && !questionTextHi.trim()) {
      setErrorMessage('Please enter question text (English or Hindi).');
      return;
    }

    const filledOptions = options.filter(o => o.text.trim().length > 0);
    if (filledOptions.length < 2) {
      setErrorMessage('Please provide at least 2 options.');
      return;
    }

    if (isBpsc && options.length < 5) {
      setErrorMessage('BPSC Prelims questions require 5 options (A, B, C, D, E). Please add Option E.');
      return;
    }

    if (!isBpsc && options.length > 4) {
      setErrorMessage('UPSC Prelims questions strictly require 4 options (A, B, C, D). Please remove unexpected options.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        questionNum: Number(questionNum),
        question: questionTextEn.trim() || questionTextHi.trim(),
        questionEn: questionTextEn.trim() || undefined,
        questionHi: questionTextHi.trim() || undefined,
        options: options.map(o => ({ id: o.id.toUpperCase(), text: o.text.trim() })),
        optionsEn: options.map(o => ({ id: o.id.toUpperCase(), text: o.text.trim() })),
        optionsHi: optionsHi.some(o => o.text.trim())
          ? optionsHi.map(o => ({ id: o.id.toUpperCase(), text: o.text.trim() }))
          : undefined,
        correctAnswer: correctAnswer.toUpperCase(),
        explanation: explanationEn.trim() || explanationHi.trim() || undefined,
        explanationEn: explanationEn.trim() || undefined,
        explanationHi: explanationHi.trim() || undefined,
        imageUrl: hasVisualContent && imageUrl.trim() ? imageUrl.trim() : undefined,
        imageCaption: hasVisualContent && imageCaption.trim() ? imageCaption.trim() : undefined,
        figureStatus: hasVisualContent && imageUrl.trim() ? 'FIGURE_VERIFIED' : 'FIGURE_NOT_REQUIRED',
        difficulty,
        pageNumber: Number(pageNumber) || 1,
      };

      const res = await api.addMissingQuestionToOcrJob(jobId, payload);
      if (res && res.success && res.question) {
        onQuestionAdded(res.question, res.completeness);
        onClose();
      } else {
        setErrorMessage(res?.error || 'Failed to add missing question.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while saving question.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Add Missing Question</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                {isBpsc ? 'BPSC Policy: 5 Options (A-E)' : 'UPSC Policy: 4 Options (A-D)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Insert a missed question directly into the canonical sequence for OCR Job {jobId ? `${jobId.slice(0, 12)}...` : 'N/A'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="bg-rose-950/60 border border-rose-800 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isNoMissingQuestions ? (
            <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 p-3.5 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>
                <strong>All Canonical Questions Accounted For:</strong> There are 0 missing questions in this paper. Inserting duplicate or out-of-sequence question numbers is disabled.
              </span>
            </div>
          ) : isInvalidQuestionNum ? (
            <div className="bg-amber-950/60 border border-amber-800 text-amber-300 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Accounted Warning:</strong> Question #{questionNum} is already accounted for in this paper. Permitted missing numbers are: {existingMissingNumbers.slice(0, 10).join(', ')}{existingMissingNumbers.length > 10 ? '...' : ''}.
              </span>
            </div>
          ) : null}

          {/* Quick Missing Number selector if multiple missing */}
          {existingMissingNumbers.length > 0 && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 block mb-2">
                Unresolved Missing Sequence Numbers:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {existingMissingNumbers.map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setQuestionNum(n)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition ${
                      questionNum === n
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-indigo-400'
                    }`}
                  >
                    Q#{n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Question Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Question Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={200}
                value={questionNum}
                onChange={e => setQuestionNum(Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Source Page (PDF)</label>
              <input
                type="number"
                min={1}
                value={pageNumber}
                onChange={e => setPageNumber(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          {/* Question Text English */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Question Text (English) <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              value={questionTextEn}
              onChange={e => setQuestionTextEn(e.target.value)}
              placeholder="Enter full question text in English..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Question Text Hindi */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Question Text (Hindi - Optional)
            </label>
            <textarea
              rows={2}
              value={questionTextHi}
              onChange={e => setQuestionTextHi(e.target.value)}
              placeholder="हिंदी में प्रश्न दर्ज करें..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Options Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300">
                Options ({isBpsc ? 'Must be 5 for BPSC' : 'Must be 4 for UPSC'})
              </label>
              <div className="flex items-center gap-2">
                {options.length < maxAllowedOptions && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Option</span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2.5">
              {options.map((opt, idx) => (
                <div key={opt.id} className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="pt-2 px-1">
                    <input
                      type="radio"
                      name="correctAnswerOption"
                      id={`opt_radio_${opt.id}`}
                      checked={correctAnswer === opt.id}
                      onChange={() => setCorrectAnswer(opt.id)}
                      className="text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                    />
                  </div>
                  <span className="w-8 pt-1.5 text-center font-bold text-sm text-indigo-400 bg-slate-900 rounded-lg py-1 border border-slate-800">
                    {opt.id}
                  </span>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      placeholder={`Option ${opt.id} text (English)...`}
                      value={opt.text}
                      onChange={e => handleOptionTextChange(idx, e.target.value, 'en')}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder={`Option ${opt.id} हिंदी (वैकल्पिक)...`}
                      value={optionsHi[idx]?.text || ''}
                      onChange={e => handleOptionTextChange(idx, e.target.value, 'hi')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  {options.length > 4 && !isBpsc && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded"
                      title="Remove Option"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              Select the radio button next to the option that represents the <span className="text-emerald-400 font-bold">Official Correct Answer</span>.
            </p>
          </div>

          {/* Diagram / Visual Content Section */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasVisualContent}
                  onChange={e => setHasVisualContent(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span>Question Contains Diagram, Map, or Figure</span>
              </label>
            </div>

            {hasVisualContent && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Image URL or Base64 / Static Path
                  </label>
                  <input
                    type="text"
                    placeholder="https://... or /assets/figures/q12.png"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Figure Caption or Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Map showing major tectonic plate boundaries"
                    value={imageCaption}
                    onChange={e => setImageCaption(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Explanations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Official Explanation (English)
              </label>
              <textarea
                rows={2}
                value={explanationEn}
                onChange={e => setExplanationEn(e.target.value)}
                placeholder="Reference rationale or source note..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Official Explanation (Hindi)
              </label>
              <textarea
                rows={2}
                value={explanationHi}
                onChange={e => setExplanationHi(e.target.value)}
                placeholder="व्याख्या / संदर्भ..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isNoMissingQuestions || isInvalidQuestionNum || !jobId}
              className="px-5 py-2 text-xs font-bold text-white rounded-xl bg-indigo-600 hover:bg-indigo-500 transition shadow-lg flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Adding Question...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Question to Job</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
