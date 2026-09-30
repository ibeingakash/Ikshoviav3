import React, { useState } from 'react';
import {
  X,
  Calendar,
  Building2,
  Compass,
  FileText,
  BookOpen,
  Tag,
  Target,
  Layers,
  MapPin,
  Scale,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  Share2,
  ExternalLink,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { CurrentAffairArticle } from '../../types/index.js';
import { useLearner } from '../../context/LearnerContext.js';
import { formatDateHuman } from '../../lib/dateUtils.js';

interface ArticleReaderModalProps {
  article: CurrentAffairArticle | null;
  onClose: () => void;
  onBookmark?: (id: string) => void;
  isBookmarked?: boolean;
}

export const ArticleReaderModal: React.FC<ArticleReaderModalProps> = ({
  article,
  onClose,
  onBookmark,
  isBookmarked = false,
}) => {
  const { askTutorWithContext, setActiveSection, setSelectedSubjectId, learnerModel } = useLearner();
  const [copied, setCopied] = useState(false);

  if (!article) return null;

  // Resolve matching subject id and check if it is an identified weak area
  const resolveSubjectId = (): { id: string; name: string } | null => {
    const cat = (article.category || '').toLowerCase();
    const rel = (article.relatedSubject || '').toLowerCase();
    if (cat.includes('polity') || rel.includes('polity')) return { id: 'sub_polity', name: 'Indian Polity & Governance' };
    if (cat.includes('economy') || rel.includes('economy')) return { id: 'sub_economy', name: 'Indian Economy' };
    if (cat.includes('environment') || rel.includes('environment') || cat.includes('ecology')) return { id: 'sub_environment', name: 'Environment & Ecology' };
    if (cat.includes('science') || rel.includes('sci') || cat.includes('tech')) return { id: 'sub_sci_tech', name: 'Science & Technology' };
    if (cat.includes('history') || rel.includes('history')) return { id: 'sub_history', name: 'History & Culture' };
    if (cat.includes('bihar') || rel.includes('bihar')) return { id: 'sub_bihar_special', name: 'Bihar Special (BPSC)' };
    return null;
  };

  const matchedSubject = resolveSubjectId();
  const subjectMastery = matchedSubject && learnerModel?.subjectMastery
    ? Number(learnerModel.subjectMastery[matchedSubject.id] ?? 50)
    : null;
  const isWeakArea = subjectMastery !== null && subjectMastery < 65;

  const handleAskTutor = () => {
    askTutorWithContext(
      `Please provide a comprehensive UPSC / BPSC analytical brief for: "${article.title}". Include core conceptual foundations, Prelims trap points, and a model Mains 15-mark answer framework.`,
      {
        subjectName: article.relatedSubject || article.category,
        pageContext: `Current Affairs: ${article.title}. Category: ${article.category}. GS Paper: ${article.gsPaper || 'General Studies'}. Why in news: ${article.whyInNews || article.summary}. Key facts: ${(article.keyFacts || []).join('; ')}. Prelims pointers: ${(article.prelimsPointers || []).join('; ')}.`,
        conceptTitle: article.title,
        conceptSummary: article.whyInNews || article.summary,
      }
    );
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${article.title} — Verified Current Affairs on IKSHOVIA`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Science & Tech':
        return 'bg-blue-50 text-blue-900 border-blue-200';
      case 'Economy':
        return 'bg-emerald-50 text-emerald-900 border-emerald-200';
      case 'Polity & Governance':
        return 'bg-purple-50 text-purple-900 border-purple-200';
      case 'Environment':
        return 'bg-teal-50 text-teal-900 border-teal-200';
      case 'International Relations':
        return 'bg-indigo-50 text-indigo-900 border-indigo-200';
      case 'Bihar Current Affairs':
        return 'bg-amber-50 text-amber-900 border-amber-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto font-sans-editorial">
      <div className="bg-white border border-[#EAE6DF] rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl relative my-auto">
        
        {/* Sticky Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#EAE6DF] bg-[#FAF8F5] rounded-t-3xl sticky top-0 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[11px] font-extrabold uppercase border px-3 py-0.5 rounded-full ${getCategoryColor(article.category)}`}>
              {article.category}
            </span>
            {article.gsPaper && (
              <span className="text-[11px] font-bold bg-stone-200 text-stone-800 px-2.5 py-0.5 rounded-full font-mono">
                {article.gsPaper}
              </span>
            )}
            {article.examRelevance && (
              <span className="text-[11px] font-extrabold bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full font-mono">
                {article.examRelevance}
              </span>
            )}
            {article.articleType === 'EDITORIAL' && (
              <span className="text-[11px] font-extrabold bg-amber-100 text-amber-950 border border-amber-300 px-2.5 py-0.5 rounded-full font-mono">
                Editorial Analysis
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {onBookmark && (
              <button
                onClick={() => onBookmark(article.id)}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isBookmarked
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-white text-stone-600 border-[#EAE6DF] hover:bg-stone-100'
                }`}
                title="Bookmark for Spaced Repetition"
              >
                {isBookmarked ? <BookmarkCheck className="w-4 h-4 text-emerald-600" /> : <Bookmark className="w-4 h-4" />}
              </button>
            )}

            <button
              onClick={handleShare}
              className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors border border-[#EAE6DF] cursor-pointer"
              title="Copy Reference"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-full transition-colors cursor-pointer ml-1"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-8 space-y-6 overflow-y-auto leading-relaxed">
          
          {/* Headline & Metadata */}
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 font-mono mb-2.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                {formatDateHuman(article.date)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold text-stone-700">
                <Building2 className="w-3.5 h-3.5 text-stone-400" />
                {article.source}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                article.sourceType === 'SUPPLEMENTARY_REFERENCE' || article.sourceType === 'EDUCATIONAL_ANALYSIS' || (article.source && (article.source.includes('Drishti') || article.source.includes('Synthesis') || article.source.includes('Reference')))
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : article.sourceType === 'PRIMARY_GOVT' || article.sourceType === 'OFFICIAL_PORTAL' || (article.source && (article.source.includes('PIB') || article.source.includes('ISRO') || article.source.includes('RBI') || article.source.includes('Supreme Court') || article.source.includes('Ministry') || (article.source.includes('Bihar') && !article.source.includes('Synthesis') && !article.source.includes('Reference'))))
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-sky-50 text-sky-900 border-sky-200'
              }`}>
                {article.sourceType === 'SUPPLEMENTARY_REFERENCE' || article.sourceType === 'EDUCATIONAL_ANALYSIS' || (article.source && (article.source.includes('Drishti') || article.source.includes('Synthesis') || article.source.includes('Reference')))
                  ? 'Reference / Synthesis'
                  : article.sourceType === 'PRIMARY_GOVT' || article.sourceType === 'OFFICIAL_PORTAL' || (article.source && (article.source.includes('PIB') || article.source.includes('ISRO') || article.source.includes('RBI') || article.source.includes('Supreme Court') || article.source.includes('Ministry') || (article.source.includes('Bihar') && !article.source.includes('Synthesis') && !article.source.includes('Reference'))))
                  ? 'Primary Official'
                  : 'News / Secondary'}
              </span>
              {article.sourceUrl && (
                <a
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-800 hover:underline flex items-center gap-1 ml-1 text-[11px]"
                >
                  <span>{article.sourceType === 'PRIMARY_GOVT' || article.sourceType === 'OFFICIAL_PORTAL' ? 'Official Gazette / Release' : 'Source Document'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif-editorial leading-snug">
              {article.title}
            </h1>
          </div>

          {/* Exam Intelligence Weak-Area Alert */}
          {matchedSubject && isWeakArea && (
            <div className="bg-gradient-to-r from-amber-900 via-stone-900 to-amber-950 text-white p-4 rounded-2xl border border-amber-600/40 shadow-sm space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300">
                    High-Yield Exam Intelligence Alert • Weak Area Intersection
                  </span>
                </div>
                <span className="text-[11px] font-mono text-amber-200 bg-amber-800/60 px-2 py-0.5 rounded-md border border-amber-500/40">
                  {matchedSubject.name}: {subjectMastery}% Mastery
                </span>
              </div>
              <p className="text-xs text-stone-200 leading-relaxed">
                This Current Affairs development directly intersects with your identified priority weak subject: <strong className="text-amber-300">{matchedSubject.name}</strong>. Linking this news to static constitutional & syllabus provisions is high-yield for both Prelims elimination and multi-dimensional Mains scoring.
              </p>
              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubjectId(matchedSubject.id);
                    onClose();
                    setActiveSection('exam-engine');
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>Practice {matchedSubject.name.split(' ')[0]} PYQs</span>
                  <ArrowRight className="w-3 h-3 text-amber-200" />
                </button>
              </div>
            </div>
          )}

          {/* Why in News? */}
          <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl space-y-1.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-950 flex items-center gap-1.5 font-mono">
              <Compass className="w-4 h-4 text-amber-700" />
              <span>Why in News?</span>
            </h3>
            <p className="text-xs sm:text-sm text-stone-800 font-medium leading-relaxed">
              {article.whyInNews || article.summary}
            </p>
          </div>

          {/* What Happened / Background */}
          {article.whatHappened && article.whatHappened !== article.whyInNews && (
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-900 flex items-center gap-1.5 border-b border-stone-100 pb-1.5 font-mono">
                <FileText className="w-4 h-4 text-amber-700" />
                <span>What Happened & Key Context</span>
              </h3>
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                {article.whatHappened}
              </p>
            </div>
          )}

          {article.background && (
            <div className="bg-[#FAF8F5] border border-[#EAE6DF] p-4 rounded-2xl space-y-1.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-800 flex items-center gap-1.5 font-mono">
                <BookOpen className="w-4 h-4 text-stone-600" />
                <span>Background & Significance</span>
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {article.background}
              </p>
            </div>
          )}

          {/* Structured Editorial Intelligence (If Present) */}
          {article.editorialAnalysis && (
            <div className="space-y-4 bg-white border border-[#EAE6DF] p-5 rounded-2xl">
              <div className="flex items-center gap-2 border-b border-[#EAE6DF] pb-2">
                <Scale className="w-4 h-4 text-amber-700" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-900 font-mono">
                  Structured Editorial Analysis & Debate
                </h3>
              </div>

              {article.editorialAnalysis.coreArgument && (
                <div>
                  <span className="text-[11px] font-bold text-stone-800 block mb-1 uppercase tracking-wide font-mono">Core Editorial Thesis:</span>
                  <p className="text-xs sm:text-sm text-stone-800 italic bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE6DF] shadow-2xs font-serif-editorial">
                    "{article.editorialAnalysis.coreArgument}"
                  </p>
                </div>
              )}

              {/* Arguments For & Against */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {article.editorialAnalysis.argumentsFor && article.editorialAnalysis.argumentsFor.length > 0 && (
                  <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl space-y-1.5">
                    <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Arguments in Favor</span>
                    </span>
                    <ul className="space-y-1 text-xs text-stone-700">
                      {article.editorialAnalysis.argumentsFor.map((arg, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-700 font-bold">•</span>
                          <span>{arg}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {article.editorialAnalysis.argumentsAgainst && article.editorialAnalysis.argumentsAgainst.length > 0 && (
                  <div className="bg-rose-50/70 border border-rose-200 p-3.5 rounded-xl space-y-1.5">
                    <span className="text-[11px] font-bold text-rose-950 uppercase tracking-wide flex items-center gap-1 font-mono">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
                      <span>Challenges & Counter-Arguments</span>
                    </span>
                    <ul className="space-y-1 text-xs text-stone-700">
                      {article.editorialAnalysis.argumentsAgainst.map((arg, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-rose-700 font-bold">•</span>
                          <span>{arg}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Constitutional & Policy Dimensions */}
              {article.editorialAnalysis.constitutionalDimensions && article.editorialAnalysis.constitutionalDimensions.length > 0 && (
                <div className="space-y-1 bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EAE6DF]">
                  <span className="text-[11px] font-bold text-stone-900 uppercase tracking-wider block font-mono">
                    Constitutional & Statutory Articles Linked:
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {article.editorialAnalysis.constitutionalDimensions.map((cd, i) => (
                      <span key={i} className="text-xs bg-white text-stone-800 border border-[#EAE6DF] px-2.5 py-1 rounded-lg font-medium font-mono">
                        {cd}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Key Facts & Parameters */}
          {article.keyFacts && article.keyFacts.length > 0 && (
            <div className="space-y-2 bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE6DF]">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-900 flex items-center gap-1.5 font-mono">
                <Tag className="w-4 h-4 text-stone-600" />
                <span>Key Facts & Parameters</span>
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-stone-700">
                {article.keyFacts.map((fact, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2 shrink-0" />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prelims & Mains Value Addition Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prelims Takeaways */}
            {article.prelimsPointers && article.prelimsPointers.length > 0 && (
              <div className="bg-amber-50/50 border border-amber-200/80 p-4 rounded-2xl space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5 font-mono">
                  <Target className="w-4 h-4 text-amber-700" />
                  <span>Prelims High-Yield Pointers</span>
                </h3>
                <ul className="space-y-1.5 text-xs text-stone-700">
                  {article.prelimsPointers.map((ptr, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-700 font-bold">•</span>
                      <span>{ptr}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mains Value Addition */}
            {article.mainsDimensions && Object.keys(article.mainsDimensions).length > 0 && (
              <div className="bg-[#FAF8F5] border border-[#EAE6DF] p-4 rounded-2xl space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-900 flex items-center gap-1.5 font-mono">
                  <Layers className="w-4 h-4 text-amber-700" />
                  <span>Mains Dimensions</span>
                </h3>
                <div className="space-y-2 text-xs">
                  {Object.entries(article.mainsDimensions).map(([k, v]) => (
                    <div key={k}>
                      <span className="font-bold text-amber-900 uppercase block text-[10px] font-mono">{k.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="text-stone-700">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bihar Specific Relevance */}
          {article.biharRelevance && (
            <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl space-y-1">
              <h3 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
                <span>BPSC & Bihar State Specific Angle:</span>
              </h3>
              <p className="text-xs sm:text-sm text-amber-950 font-medium leading-relaxed pl-5">
                {article.biharRelevance}
              </p>
            </div>
          )}

          {/* Connected PYQ Linkages */}
          {article.editorialAnalysis?.pyqLinkages && article.editorialAnalysis.pyqLinkages.length > 0 && (
            <div className="bg-[#FAF8F5] border border-[#EAE6DF] p-4 rounded-2xl space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-900 flex items-center gap-1.5 font-mono">
                <HelpCircle className="w-4 h-4 text-amber-700" />
                <span>Connected Previous Year Questions (PYQs)</span>
              </h3>
              <div className="space-y-2">
                {article.editorialAnalysis.pyqLinkages.map((pyq, idx) => (
                  <div key={idx} className="bg-white p-3.5 rounded-xl border border-[#EAE6DF] space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 font-mono">
                      <span>{pyq.exam} {pyq.year} • {pyq.paper}</span>
                      <span className="text-stone-500 font-normal">{pyq.topic}</span>
                    </div>
                    <p className="text-xs text-stone-800 font-serif-editorial italic">
                      "{pyq.questionText}"
                    </p>
                    <div className="flex items-center justify-end pt-1">
                      <button
                        onClick={() => {
                          if (article.relatedSubject) setSelectedSubjectId(article.relatedSubject);
                          onClose();
                          setActiveSection('exam-engine');
                        }}
                        className="text-[11px] font-bold text-amber-800 hover:text-amber-950 font-mono flex items-center gap-1 cursor-pointer"
                      >
                        <span>Practice in Exam Engine</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connected Mains Questions */}
          {article.mainsQuestions && article.mainsQuestions.length > 0 && (
            <div className="bg-[#FAF8F5] border border-[#EAE6DF] p-4 rounded-2xl space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-900 flex items-center gap-1.5 font-mono">
                <Layers className="w-4 h-4 text-emerald-700" />
                <span>Probable Mains Analytical Questions</span>
              </h3>
              <div className="space-y-2">
                {article.mainsQuestions.map((qText, idx) => (
                  <div key={idx} className="bg-white p-3.5 rounded-xl border border-[#EAE6DF] space-y-2">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase font-mono">
                      Question {idx + 1} • Mains 15 Marks (250 Words)
                    </span>
                    <p className="text-xs text-stone-800 font-serif-editorial italic">
                      "{qText}"
                    </p>
                    <div className="flex items-center justify-end pt-1">
                      <button
                        onClick={() => {
                          if (article.relatedSubject) setSelectedSubjectId(article.relatedSubject);
                          onClose();
                          setActiveSection('exam-engine');
                        }}
                        className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 font-mono flex items-center gap-1 cursor-pointer"
                      >
                        <span>Write Answer in Mains Engine</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Sticky Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#EAE6DF] bg-[#FAF8F5] rounded-b-3xl flex flex-wrap items-center justify-between gap-3 sticky bottom-0 z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={handleAskTutor}
              className="text-xs font-bold text-amber-300 bg-stone-900 hover:bg-stone-800 px-4 py-2.5 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Discuss with AI Tutor</span>
            </button>

            {copied && (
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                Copied reference to clipboard!
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-xs font-bold text-stone-600 bg-white hover:bg-stone-100 border border-[#EAE6DF] px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            Close Reader
          </button>
        </div>

      </div>
    </div>
  );
};
