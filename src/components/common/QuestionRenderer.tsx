import React from 'react';
import { Question, QuestionOption } from '../../types';
import { CheckCircle2, XCircle, ShieldCheck, Bot, Sparkles, BookOpen, Layers, GitCompare } from 'lucide-react';

export interface QuestionRendererProps {
  question: Question;
  questionNumber?: number;
  language?: 'en' | 'hi';
  selectedOption?: string | string[];
  selectedOptionId?: string | string[];
  isSubmitted?: boolean;
  isCorrect?: boolean;
  onSelectOption?: (optionId: string) => void;
  mode?: 'interactive' | 'exam' | 'study' | 'review';
  showSolution?: boolean;
  showCorrectAnswer?: boolean;
  onToggleSolution?: () => void;
  onAskAiTutor?: (prompt: string) => void;
  marks?: number;
  negativeMarks?: number;
  hideHeaderMeta?: boolean;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  questionNumber,
  language = 'en',
  selectedOption,
  selectedOptionId,
  isSubmitted = false,
  isCorrect,
  onSelectOption,
  mode = 'interactive',
  showSolution = false,
  showCorrectAnswer,
  onToggleSolution,
  onAskAiTutor,
  marks = 2.0,
  negativeMarks = 0.666,
  hideHeaderMeta = false,
}) => {
  if (!question) {
    return (
      <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-dashed border-[#EAE6DF] text-center text-stone-500 text-xs">
        Question data unavailable.
      </div>
    );
  }

  // Determine effective texts based on language
  const isHindi = language === 'hi';

  const renderSafeText = (val: any): string => {
    if (val === undefined || val === null) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') {
      if (isHindi && val.hi) return String(val.hi);
      if (val.en) return String(val.en);
      if (val.text) return String(val.text);
      try {
        return JSON.stringify(val);
      } catch {
        return '';
      }
    }
    return String(val);
  };

  const qText = isHindi && question.question_hi ? question.question_hi : (question.question_en || question.question);
  
  const options: QuestionOption[] = (isHindi && question.options_hi && question.options_hi.length > 0)
    ? question.options_hi
    : (question.options_en && question.options_en.length > 0 ? question.options_en : (question.options || []));

  const explanation = isHindi && question.explanation_hi 
    ? question.explanation_hi 
    : (question.explanation_en || question.explanation);

  const statements = isHindi && question.statements_hi && question.statements_hi.length > 0
    ? question.statements_hi
    : question.statements;

  const rawMatch = isHindi && question.matchData_hi ? question.matchData_hi : question.matchData;
  const matchData = rawMatch ? {
    leftColumn: ((rawMatch as any).leftColumn || (rawMatch as any).listI || (rawMatch as any).left_column || []) as any[],
    rightColumn: ((rawMatch as any).rightColumn || (rawMatch as any).listII || (rawMatch as any).right_column || []) as any[],
    leftHeader: rawMatch.leftHeader || (rawMatch as any).left_header,
    rightHeader: rawMatch.rightHeader || (rawMatch as any).right_header,
    codes: rawMatch.codes || [],
  } : undefined;

  const qType = question.questionType || (matchData && matchData.leftColumn.length > 0 ? 'MATCH_FOLLOWING' : (statements && statements.length > 0 ? 'STATEMENT_BASED' : 'SINGLE_CHOICE'));

  // Support both selectedOption and selectedOptionId props
  const effectiveSelectedOption = selectedOption !== undefined ? selectedOption : selectedOptionId;
  const effectiveShowSolution = showSolution || Boolean(showCorrectAnswer);

  const isSelected = (optId: string) => {
    if (effectiveSelectedOption === undefined || effectiveSelectedOption === null || effectiveSelectedOption === '') {
      return false;
    }
    const cleanOptId = String(optId).trim().toUpperCase();
    if (Array.isArray(effectiveSelectedOption)) {
      return effectiveSelectedOption.some(s => String(s).trim().toUpperCase() === cleanOptId);
    }
    return String(effectiveSelectedOption).trim().toUpperCase() === cleanOptId;
  };

  const isMatchFollowing = (qType === 'MATCH_FOLLOWING' || Boolean(matchData && matchData.leftColumn.length > 0)) && Boolean(matchData && matchData.leftColumn.length > 0);
  const isStatementBased = qType === 'STATEMENT_BASED' && statements && statements.length > 0;

  return (
    <div id={`question-card-${question.id}`} className="space-y-5">
      {/* Header Metadata */}
      {!hideHeaderMeta && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 pb-3.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-[#F4F0E8] text-stone-800 text-xs font-bold font-mono">
              Q.{questionNumber || question.questionNumber || question.questionNum || 1}
            </span>
            {qType === 'MATCH_FOLLOWING' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-200">
                <GitCompare className="w-3 h-3 text-purple-700" />
                Match the Following
              </span>
            )}
            {qType === 'STATEMENT_BASED' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-900 border border-blue-200">
                <Layers className="w-3 h-3 text-blue-700" />
                Statement Based
              </span>
            )}
            {question.topicId && (
              <span className="text-xs text-stone-600 bg-stone-100 px-2 py-0.5 rounded font-medium">
                {question.topicId.replace(/^top_/, '').replace(/_/g, ' ')}
              </span>
            )}
            {question.sourceType === 'ADMIN_IMPORTED' ? (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-medium border border-amber-200">
                <BookOpen className="w-3 h-3 text-amber-600" />
                Admin / Custom Import
              </span>
            ) : question.sourceType === 'IKSHOVIA_CREATED' ? (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-medium border border-blue-200">
                <Sparkles className="w-3 h-3 text-blue-600" />
                IKSHOVIA Practice Question
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-medium border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Verified Official PYQ
              </span>
            )}
          </div>

          <div className="text-xs text-stone-400 font-mono">
            +{marks} Marks • -{negativeMarks}
          </div>
        </div>
      )}

      {/* Main Question Text */}
      {/* Passage / Comprehension Block if present */}
      {(question.passageText || (question as any).passage) && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900 font-mono">
            <BookOpen className="w-3.5 h-3.5 text-amber-700" />
            <span>{isHindi ? 'गद्यांश / निर्देश:' : 'Reading Passage / Context:'}</span>
          </div>
          <div className="text-sm sm:text-base font-serif-editorial text-stone-800 leading-relaxed whitespace-pre-line border-l-2 border-amber-300 pl-3.5 italic">
            {question.passageText || (question as any).passage}
          </div>
        </div>
      )}

      <div className="text-base sm:text-lg font-serif-editorial font-semibold text-stone-900 leading-relaxed whitespace-pre-line">
        {qText}
      </div>

      {/* Structured Statement-Based Display */}
      {isStatementBased && statements && (
        <div className="p-4 sm:p-5 rounded-xl bg-stone-50/80 border border-stone-200 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-500 font-mono">
            {isHindi ? 'दिए गए कथन:' : 'Statements to consider:'}
          </div>
          <div className="space-y-2.5">
            {statements.map((stmt) => (
              <div key={stmt.id} className="flex items-start gap-3 text-sm sm:text-base text-stone-800 leading-relaxed">
                <span className="w-6 h-6 rounded-md bg-stone-200 text-stone-800 font-bold font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {stmt.id}
                </span>
                <span className="flex-1 font-medium">{renderSafeText(stmt.text)}</span>
              </div>
            ))}
          </div>
          <div className="text-xs font-semibold text-stone-600 italic pt-1 border-t border-stone-200/60">
            {isHindi ? 'उपर्युक्त कथनों में से कौन सा/से सही है/हैं?' : 'Which of the statements given above is/are correct?'}
          </div>
        </div>
      )}

      {/* Structured Match the Following (2-Column Comparison Matrix) */}
      {isMatchFollowing && matchData && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-amber-200/80 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column (List-I) */}
            <div className="space-y-2.5 bg-white p-4 rounded-xl border border-stone-200">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-700 font-mono border-b border-stone-100 pb-2 flex items-center justify-between">
                <span>{renderSafeText(matchData.leftHeader) || (isHindi ? 'सूची-I' : 'List-I')}</span>
                <span className="text-[10px] text-stone-400 font-normal">Items</span>
              </div>
              <div className="space-y-2">
                {matchData.leftColumn.map((item) => (
                  <div key={item.key} className="flex items-start gap-2.5 text-xs sm:text-sm">
                    <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-900 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                      {item.key}
                    </span>
                    <span className="font-medium text-stone-800 leading-snug pt-0.5">{renderSafeText(item.text)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column (List-II) */}
            <div className="space-y-2.5 bg-white p-4 rounded-xl border border-stone-200">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-700 font-mono border-b border-stone-100 pb-2 flex items-center justify-between">
                <span>{renderSafeText(matchData.rightHeader) || (isHindi ? 'सूची-II' : 'List-II')}</span>
                <span className="text-[10px] text-stone-400 font-normal">Matches</span>
              </div>
              <div className="space-y-2">
                {matchData.rightColumn.map((item) => (
                  <div key={item.key} className="flex items-start gap-2.5 text-xs sm:text-sm">
                    <span className="w-6 h-6 rounded-md bg-stone-100 text-stone-700 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                      {item.key}
                    </span>
                    <span className="font-medium text-stone-800 leading-snug pt-0.5">{renderSafeText(item.text)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-xs font-bold uppercase tracking-wider text-stone-500 font-mono pt-1">
            {isHindi ? 'सही कूट का चयन कीजिए:' : 'Select the correct code / combination:'}
          </div>
        </div>
      )}

      {/* Options Matrix */}
      <div className="space-y-3 pt-1">
        {options.map((opt) => {
          const optTextStr = renderSafeText(opt.text);
          const selected = isSelected(opt.id);
          const isCorrectAnswer = String(opt.id).trim().toUpperCase() === String(question.correctAnswer).trim().toUpperCase();
          const isOptENotAttempted = String(opt.id).trim().toUpperCase() === 'E' && (
            optTextStr.toLowerCase().includes('not attempted') ||
            optTextStr.toLowerCase().includes('अनुत्तरित') ||
            optTextStr.toLowerCase().includes('unattempted')
          );
          const userChoseNotAttempted = selected && isOptENotAttempted && !isCorrectAnswer;

          let optionStyle = 'border-[#EAE6DF] hover:border-amber-400 bg-stone-50/60 text-stone-800 hover:bg-stone-50';

          if (isSubmitted || mode === 'study' || mode === 'review') {
            if (isCorrectAnswer) {
              optionStyle = 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-bold shadow-2xs ring-1 ring-emerald-500';
            } else if (userChoseNotAttempted) {
              optionStyle = 'border-stone-400 bg-stone-100/90 text-stone-800 font-semibold shadow-2xs ring-1 ring-stone-400';
            } else if (selected && !isCorrectAnswer) {
              optionStyle = 'border-rose-500 bg-rose-50/80 text-rose-950 font-bold shadow-2xs ring-1 ring-rose-500';
            } else {
              optionStyle = 'border-[#EAE6DF] opacity-60 text-stone-400 bg-transparent';
            }
          } else if (selected) {
            optionStyle = 'border-amber-500 bg-amber-50 text-amber-950 font-bold shadow-2xs ring-2 ring-amber-500';
          }

          return (
            <button
              key={opt.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!isSubmitted && mode !== 'study' && mode !== 'review') {
                  onSelectOption?.(opt.id);
                }
              }}
              disabled={isSubmitted || mode === 'study' || mode === 'review'}
              className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-start gap-3.5 min-h-[48px] touch-manipulation cursor-pointer disabled:cursor-default ${optionStyle}`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-colors font-mono select-none ${
                  (isSubmitted || mode === 'study' || mode === 'review') && isCorrectAnswer
                    ? 'bg-emerald-600 text-white'
                    : (isSubmitted || mode === 'study' || mode === 'review') && userChoseNotAttempted
                    ? 'bg-stone-600 text-white'
                    : (isSubmitted || mode === 'study' || mode === 'review') && selected && !isCorrectAnswer
                    ? 'bg-rose-600 text-white'
                    : selected
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-2xs'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                {opt.id}
              </div>

              <div className="flex-1 text-sm sm:text-base leading-relaxed font-sans select-none">
                {optTextStr}
                {userChoseNotAttempted && (isSubmitted || mode === 'study' || mode === 'review') && (
                  <span className="block text-xs font-mono font-medium text-stone-500 mt-1">
                    (Candidate marked Not Attempted — 0 marks / 0 penalty)
                  </span>
                )}
              </div>

              {(isSubmitted || mode === 'study' || mode === 'review') && isCorrectAnswer && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              )}
              {(isSubmitted || mode === 'study' || mode === 'review') && selected && !isCorrectAnswer && !userChoseNotAttempted && (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Expandable Official Solution & Explanation */}
      {(isSubmitted || effectiveShowSolution || mode === 'study' || mode === 'review') && (
        <div className="mt-5 p-5 rounded-2xl bg-[#FCFBF9] border border-amber-200/80 space-y-4 animate-in fade-in duration-200">
          {/* Status Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {isSubmitted && isCorrect !== undefined ? (
                isCorrect ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Correct Answer! (+{marks} Marks)
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-1 rounded-lg">
                    <XCircle className="w-4 h-4 text-rose-600" /> Official Answer: Option ({question.correctAnswer}) (-{negativeMarks})
                  </span>
                )
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-amber-700" /> Official Commission Answer: Option ({question.correctAnswer})
                </span>
              )}
            </div>

            {onAskAiTutor && (
              <button
                onClick={() => onAskAiTutor(`Explain official exam question: "${question.question}" (Official Answer: Option ${question.correctAnswer})`)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5 text-amber-700" />
                <span>Ask AI Tutor</span>
              </button>
            )}
          </div>

          {/* Detailed Solution Text */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 font-mono">
              Official Key & Detailed Explanation:
            </span>
            <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-line font-medium">
              {explanation}
            </p>
          </div>

          {/* Provenance Footer */}
          <div className="pt-3 border-t border-amber-200/60 flex flex-wrap items-center justify-between text-xs text-stone-500 gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-700">Source:</span>
              <span>{question.source || 'Official Commission Master Paper'}</span>
            </div>
            {question.sourceUrl && (
              <a
                href={question.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-amber-800 hover:text-amber-900 font-bold underline flex items-center gap-1"
              >
                View Commission Document
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
