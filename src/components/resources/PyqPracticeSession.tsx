import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Award,
  Clock,
  Zap,
  ExternalLink,
  BookOpen,
  LayoutGrid,
  Bot,
  Shuffle
} from 'lucide-react';
import { Question, PyqPaper } from '../../types/index.js';
import { useLearner } from '../../context/LearnerContext.js';
import { QuestionRenderer } from '../common/QuestionRenderer.js';
import confetti from 'canvas-confetti';

interface PracticeAttempt {
  selectedOption: string;
  isCorrect: boolean;
  timestamp: number;
}

interface PyqPracticeSessionProps {
  paper: PyqPaper;
  questions: Question[];
  onExit: () => void;
  onRandomQuestion?: () => void;
}

export const PyqPracticeSession: React.FC<PyqPracticeSessionProps> = ({
  paper,
  questions,
  onExit,
  onRandomQuestion
}) => {
  const { askTutorWithContext, navigateToConcept } = useLearner();
  
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [attempts, setAttempts] = useState<Record<string, PracticeAttempt>>({});
  const [showPalette, setShowPalette] = useState<boolean>(false);
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [filterIncorrectOnly, setFilterIncorrectOnly] = useState<boolean>(false);

  const currentQ = questions[currentIndex];

  const currentAttempt = currentQ ? attempts[currentQ.id] : undefined;
  const isAnswered = !!currentAttempt;

  const totalQuestions = questions.length;
  const attemptedCount = Object.keys(attempts).length;
  const correctCount = Object.values(attempts).filter((a: PracticeAttempt) => a.isCorrect).length;
  const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

  // Handle Option Click (Instant Evaluation)
  const handleSelectOption = (optionId: string) => {
    if (!currentQ || isAnswered) return;

    const isCorrect = optionId === currentQ.correctAnswer;
    const newAttempt: PracticeAttempt = {
      selectedOption: optionId,
      isCorrect,
      timestamp: Date.now()
    };

    setAttempts(prev => ({
      ...prev,
      [currentQ.id]: newAttempt
    }));

    if (isCorrect) {
      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#10b981', '#34d399', '#6ee7b7']
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleResetSession = () => {
    setAttempts({});
    setCurrentIndex(0);
  };

  if (!currentQ || totalQuestions === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-[#EAE6DF] text-center space-y-4 shadow-2xs">
        <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="text-base sm:text-lg font-serif-editorial font-bold text-stone-900">
          Digitization in Progress for {paper.exam} {paper.examCycle || paper.year}
        </h3>
        <p className="text-stone-500 text-xs max-w-md mx-auto leading-relaxed font-sans">
          This question paper is currently being digitized from the official commission booklet ({paper.expectedQuestionCount || 150} Total Questions).
          You can inspect or download the original PDF booklet directly from the commission portal below.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={onExit}
            className="px-4 py-2 bg-[#F4F0E8] hover:bg-[#ECE6DC] text-stone-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Return to Archive
          </button>
          <a
            href={paper.officialPaperUrl || paper.officialSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Official PDF</span>
          </a>
        </div>
      </div>
    );
  }

  const questionText = lang === 'hi' && currentQ.question_hi ? currentQ.question_hi : (currentQ.question_en || currentQ.question);
  const options = (lang === 'hi' && currentQ.options_hi && currentQ.options_hi.length > 0)
    ? currentQ.options_hi
    : (currentQ.options_en && currentQ.options_en.length > 0 ? currentQ.options_en : (currentQ.options || []));
  const explanation = lang === 'hi' && currentQ.explanation_hi ? currentQ.explanation_hi : (currentQ.explanation_en || currentQ.explanation);

  return (
    <div className="space-y-4 font-sans-editorial animate-in fade-in duration-200">
      {/* Top Session Navigation & Stats Strip */}
      <div className="bg-white rounded-2xl p-4 border border-[#EAE6DF] shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 text-stone-500 hover:text-stone-900 hover:bg-[#F4F0E8] rounded-xl transition-colors cursor-pointer"
            title="Exit Practice Mode"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200/80 font-mono">
                {paper.exam} {paper.examCycle || paper.year}
              </span>
              <span className="text-xs font-semibold text-stone-600">
                {paper.paper}
              </span>
            </div>
            <h2 className="text-sm font-serif-editorial font-bold text-stone-900">
              Interactive Practice: Question {currentIndex + 1} of {totalQuestions}
            </h2>
          </div>
        </div>

        {/* Action Controls & Metrics */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Language Toggle */}
          <div className="flex items-center bg-[#F4F0E8] border border-[#EAE6DF] rounded-xl p-0.5 text-xs font-medium">
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-bold ${lang === 'en' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'}`}
            >
              English
            </button>
            <button
              onClick={() => setLang('hi')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-bold ${lang === 'hi' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'}`}
            >
              हिंदी
            </button>
          </div>

          {/* Stats Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#FAF8F5] rounded-xl border border-[#EAE6DF] text-xs">
            <span className="text-stone-500 font-medium">Score:</span>
            <span className="font-bold text-emerald-700">{correctCount}</span>
            <span className="text-stone-300">/</span>
            <span className="font-semibold text-stone-700">{attemptedCount} attempted</span>
            <span className="text-stone-400 font-mono text-[11px]">({accuracy}%)</span>
          </div>

          {/* Palette Button */}
          <button
            onClick={() => setShowPalette(!showPalette)}
            className={`p-2 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer ${showPalette ? 'bg-stone-900 text-amber-300 border-stone-900' : 'border-[#EAE6DF] text-stone-700 hover:bg-[#F4F0E8]'}`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden md:inline">Palette</span>
          </button>

          {/* Reset */}
          <button
            onClick={handleResetSession}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-[#F4F0E8] rounded-xl transition-colors cursor-pointer"
            title="Reset Practice Session"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Question Palette Dropdown Grid */}
      {showPalette && (
        <div className="bg-white rounded-2xl p-4 border border-[#EAE6DF] shadow-md animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-stone-900">
              Jump to Question ({totalQuestions} Total)
            </div>
            <div className="flex items-center gap-3 text-[11px] text-stone-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Correct</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Incorrect</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-stone-300"></span> Unattempted</span>
            </div>
          </div>
          <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 gap-1.5 max-h-48 overflow-y-auto p-1">
            {questions.map((q, idx) => {
              const att = attempts[q.id];
              let bg = 'bg-[#F4F0E8] text-stone-700 hover:bg-[#ECE6DC]';
              if (idx === currentIndex) {
                bg = 'ring-2 ring-amber-500 font-bold ' + bg;
              }
              if (att) {
                bg = att.isCorrect
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-rose-600 text-white font-bold';
              }
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setShowPalette(false);
                  }}
                  className={`h-7 rounded-lg text-xs transition-colors flex items-center justify-center cursor-pointer ${bg}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Interactive Question Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EAE6DF] shadow-2xs space-y-6">
        <QuestionRenderer
          question={currentQ}
          questionNumber={currentQ.questionNumber || currentIndex + 1}
          language={lang}
          selectedOption={currentAttempt?.selectedOption}
          isSubmitted={isAnswered}
          isCorrect={currentAttempt?.isCorrect}
          onSelectOption={handleSelectOption}
          mode="interactive"
          showSolution={isAnswered}
          onAskAiTutor={(prompt) => askTutorWithContext(prompt)}
          marks={paper.marksPerCorrect || 2.0}
          negativeMarks={paper.negativeMarking || 0.666}
        />

        {/* Bottom Pagination & Navigation Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-stone-100">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-4 py-2 bg-[#FAF8F5] hover:bg-[#F4F0E8] border border-[#EAE6DF] text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          {onRandomQuestion && (
            <button
              onClick={onRandomQuestion}
              className="px-3.5 py-2 bg-[#FAF8F5] hover:bg-[#F4F0E8] border border-[#EAE6DF] text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-700" />
              Random PYQ
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={currentIndex === totalQuestions - 1}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
