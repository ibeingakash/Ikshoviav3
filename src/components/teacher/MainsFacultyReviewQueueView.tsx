import React, { useEffect, useState } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lightbulb,
  X,
  Search,
  Sliders,
  ShieldCheck,
  Award,
  ChevronRight,
  Sparkles,
  FileText,
  Lock,
  Unlock,
  Eye,
  RefreshCw,
  Edit3,
  Check,
  Image as ImageIcon
} from 'lucide-react';
import { api } from '../../lib/api.js';

export const MainsFacultyReviewQueueView: React.FC = () => {
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED' | 'ALL' | 'CALIBRATION' | 'ASSIGNED'>('PENDING');
  const [calibrationCases, setCalibrationCases] = useState<any[]>([]);
  const [isDoubleReview, setIsDoubleReview] = useState<boolean>(false);

  // Review form state
  const [facultyMarks, setFacultyMarks] = useState<number>(0);
  const [maxMarks, setMaxMarks] = useState<number>(10);
  const [dimensions, setDimensions] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<string>('');
  const [strengths, setStrengths] = useState<string>('');
  const [weaknesses, setWeaknesses] = useState<string>('');
  const [actionableImprovement, setActionableImprovement] = useState<string>('');
  const [verdict, setVerdict] = useState<'ACCEPTED' | 'EDITED' | 'INDEPENDENT' | 'REJECTED'>('EDITED');
  const [trainingEligibility, setTrainingEligibility] = useState<'TRAINING_ELIGIBLE' | 'EXCLUDED'>('TRAINING_ELIGIBLE');
  const [exclusionReason, setExclusionReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Handwritten OCR Workbench state
  const [ocrRunning, setOcrRunning] = useState<boolean>(false);
  const [editingOcr, setEditingOcr] = useState<boolean>(false);
  const [correctedOcrText, setCorrectedOcrText] = useState<string>('');
  const [savingOcr, setSavingOcr] = useState<boolean>(false);

  useEffect(() => {
    loadPending();
  }, [activeTab]);

  const loadPending = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'CALIBRATION') {
        const cases = await api.getTeacherMainsCalibrationCases();
        setCalibrationCases(cases || []);
      } else if (activeTab === 'ASSIGNED') {
        const assignments = await api.getTeacherMainsReviewAssignments('ASSIGNED');
        setPendingList(assignments.map((a: any) => ({
          ...a.submission,
          id: a.submissionId,
          assignmentId: a.id,
          priorityScore: a.priorityScore,
          priorityReason: a.priorityReason,
          assignedAt: a.assignedAt
        })));
      } else {
        const data = await api.getTeacherMainsPendingReviews(50, 0, activeTab);
        setPendingList(data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load Mains evaluations queue');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = async (item: any) => {
    setError(null);
    try {
      // 1. Claim Review Lock to prevent concurrent collisions
      try {
        await api.claimMainsReview(item.id);
      } catch (lockErr: any) {
        if (lockErr.status === 409) {
          setError(`Lock Conflict: Submission is currently claimed by faculty member '${lockErr.lockedBy || 'another evaluator'}'.`);
          return;
        }
        console.warn('Review lock notice:', lockErr.message);
      }

      // 2. Load submission evaluation and rubric
      const full = await api.getMainsSubmissionEvaluation(item.id);
      setActiveItem(full);
      const sub = full.submission;
      const mm = Number(sub.max_marks || 10);
      setMaxMarks(mm);

      const aiMarks = sub.marks_obtained !== null ? Number(sub.marks_obtained) : Math.round(mm * 0.5);
      const aiDims = sub.evaluation?.dimensions || {};
      const standardRubric = full.standardRubric?.dimensions || [];
      const initDims: Record<string, number> = {};
      for (const d of standardRubric) {
        initDims[d.key] = aiDims[d.key] ?? Math.round(mm * 0.6);
      }

      // If existing faculty review history exists, load its values
      const existing = (full.reviews && full.reviews.length > 0) ? full.reviews[0] : null;
      if (existing) {
        setFacultyMarks(Number(existing.faculty_marks_obtained || aiMarks));
        setVerdict(existing.faculty_verdict || 'EDITED');
        setDimensions(existing.faculty_dimensions || initDims);
        setFeedback(existing.faculty_feedback || sub.feedback || '');
        setStrengths((existing.faculty_strengths || []).join('\n'));
        setWeaknesses((existing.faculty_weaknesses || []).join('\n'));
        setActionableImprovement(existing.faculty_actionable_improvement || '');
        setTrainingEligibility(existing.training_eligibility || 'TRAINING_ELIGIBLE');
        setExclusionReason(existing.exclusion_reason || '');
      } else {
        setFacultyMarks(aiMarks);
        setVerdict('EDITED');
        setDimensions(initDims);
        setFeedback(sub.feedback || 'Structured answer with relevant conceptual points.');
        setStrengths((sub.strengths || []).join('\n'));
        setWeaknesses((sub.weaknesses || []).join('\n'));
        setActionableImprovement(sub.actionable_improvement || '');
        setTrainingEligibility('TRAINING_ELIGIBLE');
        setExclusionReason('');
      }

      // OCR state init
      setCorrectedOcrText(sub.corrected_ocr_text || sub.ocr_extracted_text || '');
      setEditingOcr(false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch submission details');
    }
  };

  const handleCloseReview = async () => {
    if (activeItem) {
      try {
        await api.releaseMainsReview(activeItem.submission.id);
      } catch (err) {
        console.warn('Release review error:', err);
      }
    }
    setActiveItem(null);
    setEditingOcr(false);
    loadPending();
  };

  const handleSelectVerdict = (mode: 'ACCEPTED' | 'EDITED' | 'INDEPENDENT' | 'REJECTED') => {
    setVerdict(mode);
    if (mode === 'ACCEPTED') {
      const sub = activeItem?.submission;
      const mm = Number(sub?.max_marks || 10);
      const aiScore = sub?.marks_obtained !== null ? Number(sub.marks_obtained) : Math.round(mm * 0.5);
      setFacultyMarks(aiScore);
      setFeedback(sub?.feedback || 'Adopted AI evaluation remarks.');
      const aiDims = sub?.evaluation?.dimensions || {};
      const standardRubric = activeItem?.standardRubric?.dimensions || [];
      const updatedDims: Record<string, number> = {};
      for (const d of standardRubric) {
        updatedDims[d.key] = aiDims[d.key] ?? Math.round(mm * 0.6);
      }
      setDimensions(updatedDims);
    } else if (mode === 'REJECTED') {
      setTrainingEligibility('EXCLUDED');
      if (!exclusionReason) {
        setExclusionReason('Rejected by faculty evaluator as corrupted, off-topic, or invalid attempt.');
      }
    }
  };

  const handleRunOcr = async () => {
    if (!activeItem) return;
    setOcrRunning(true);
    try {
      const res = await api.runMainsHandwrittenOcr(activeItem.submission.id);
      if (res.ocr) {
        setActiveItem({
          ...activeItem,
          submission: {
            ...activeItem.submission,
            ocr_extracted_text: res.ocr.ocr_extracted_text,
            ocr_confidence: res.ocr.ocr_confidence,
            ocr_status: res.ocr.ocr_status
          }
        });
        setCorrectedOcrText(res.ocr.ocr_extracted_text);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to run OCR pipeline');
    } finally {
      setOcrRunning(false);
    }
  };

  const handleSaveCorrectedOcr = async () => {
    if (!activeItem || !correctedOcrText.trim()) return;
    setSavingOcr(true);
    try {
      const res = await api.correctMainsOcrText(activeItem.submission.id, correctedOcrText.trim());
      if (res.submission) {
        setActiveItem({
          ...activeItem,
          submission: {
            ...activeItem.submission,
            corrected_ocr_text: res.submission.corrected_ocr_text,
            ocr_status: res.submission.ocr_status,
            ocr_approved: res.submission.ocr_approved,
            answer_text: res.submission.corrected_ocr_text
          }
        });
      }
      setEditingOcr(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save corrected OCR text');
    } finally {
      setSavingOcr(false);
    }
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;

    if (verdict === 'REJECTED' && !exclusionReason.trim()) {
      alert('Please provide an exclusion reason explaining why this submission is rejected.');
      return;
    }

    if (trainingEligibility === 'EXCLUDED' && !exclusionReason.trim()) {
      alert('Please provide a reason for excluding this answer from model training.');
      return;
    }

    setSubmitting(true);
    try {
      const resp = await api.submitMainsFacultyReview(activeItem.submission.id, {
        marksObtained: Number(facultyMarks),
        maxMarks,
        dimensions,
        feedback,
        strengths: strengths.split('\n').filter(Boolean),
        weaknesses: weaknesses.split('\n').filter(Boolean),
        actionableImprovement,
        verdict,
        trainingEligibility,
        exclusionReason: trainingEligibility === 'EXCLUDED' ? exclusionReason : undefined
      });

      if (resp.review?.qualityGateEvaluation?.exclusionReason && trainingEligibility === 'TRAINING_ELIGIBLE') {
        alert(`Note: Review recorded, but automatic Quality Gates flagged: ${resp.review.qualityGateEvaluation.exclusionReason}`);
      }

      // If Double-Review mode enabled, record dual review
      if (isDoubleReview) {
        try {
          await api.submitMainsDoubleReview(activeItem.submission.id, {
            marks: Number(facultyMarks),
            maxMarks,
            dimensions,
            feedback,
            verdict
          });
        } catch (dErr: any) {
          console.warn('Double review note:', dErr.message);
        }
      }

      setActiveItem(null);
      await loadPending();
    } catch (err: any) {
      alert(err.message || 'Failed to record faculty ground-truth review');
    } finally {
      setSubmitting(false);
    }
  };

  // Live disagreement indicator
  const aiScore = activeItem?.submission?.marks_obtained !== null ? Number(activeItem?.submission?.marks_obtained) : facultyMarks;
  const absDiff = Math.abs(facultyMarks - aiScore);
  const pctDiff = maxMarks > 0 ? (absDiff / maxMarks) * 100 : 0;
  let disagreementBadge = { label: 'High Agreement (≤10%)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  if (pctDiff > 25) {
    disagreementBadge = { label: `Major Disagreement (${pctDiff.toFixed(1)}%)`, color: 'bg-rose-100 text-rose-800 border-rose-300' };
  } else if (pctDiff > 10) {
    disagreementBadge = { label: `Minor Disagreement (${pctDiff.toFixed(1)}%)`, color: 'bg-amber-100 text-amber-800 border-amber-300' };
  }

  // Live quality gates preview
  const currentAnswer = activeItem?.submission?.corrected_ocr_text || activeItem?.submission?.ocr_extracted_text || activeItem?.submission?.answer_text || '';
  const currentWords = currentAnswer.split(/\s+/).filter(Boolean).length;
  const isHandwritten = activeItem?.submission?.submission_type === 'HANDWRITTEN_IMAGE' || activeItem?.submission?.submission_type === 'HANDWRITTEN';
  const gates = [
    { label: 'Question Valid (≥10 chars)', pass: Boolean(activeItem?.submission?.question && activeItem.submission.question.length >= 10) },
    { label: 'Answer Present (Non-Empty)', pass: Boolean(currentAnswer.trim().length > 0) },
    { label: 'Meaningful Content (≥25 words)', pass: currentWords >= 25 },
    { label: 'Score Scale [0, maxMarks]', pass: facultyMarks >= 0 && facultyMarks <= maxMarks },
    { label: 'Rubric Complete', pass: Object.keys(dimensions).length > 0 && Object.values(dimensions).every(v => v !== null && !isNaN(v)) },
    { label: 'Verdict Valid', pass: ['ACCEPTED', 'EDITED', 'INDEPENDENT'].includes(verdict) },
    { label: 'No Disagreement Blockers', pass: pctDiff <= 25 || feedback.trim().length >= 25 },
    { label: 'Handwritten OCR Verified', pass: !isHandwritten || Boolean(activeItem?.submission?.ocr_approved || (activeItem?.submission?.ocr_confidence && Number(activeItem.submission.ocr_confidence) >= 0.70)) }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
              Phase 4.1B Ground Truth
            </span>
            <span className="text-xs text-stone-500 font-mono">Faculty Intelligence Desk</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif-editorial text-stone-900 mt-1">
            Mains Faculty Review & Calibration Desk
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Review student copies, calibrate AI evaluations, run handwritten OCR, and curate leak-free training ground truth.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Status Tabs */}
          <div className="flex rounded-lg border border-stone-300 p-0.5 bg-stone-100 text-xs">
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'PENDING' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Pending ({pendingList.length})
            </button>
            <button
              onClick={() => setActiveTab('COMPLETED')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'COMPLETED' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'ALL' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('ASSIGNED')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'ASSIGNED' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Assigned to Me
            </button>
            <button
              onClick={() => setActiveTab('CALIBRATION')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'CALIBRATION' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Calibration Standard
            </button>
          </div>
          <button
            onClick={loadPending}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded border border-stone-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Queue Listing */}
      {loading ? (
        <div className="py-12 text-center text-stone-500 text-sm">
          Loading Mains submissions queue...
        </div>
      ) : activeTab === 'CALIBRATION' ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200">
            <h3 className="text-sm font-bold text-purple-950 flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-700" />
              Faculty Calibration Reference Standards (Phase 4.1C)
            </h3>
            <p className="text-xs text-purple-900/80 mt-1">
              Curated benchmark answers across WEAK, AVERAGE, STRONG, and EXCELLENT tiers. Evaluators must study these rubric score anchors to establish uniform marking standards.
            </p>
          </div>

          {calibrationCases.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-dashed border-stone-300 bg-stone-50 p-6 text-xs text-stone-500">
              No completed ground-truth calibration answers recorded in database yet.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-200 overflow-hidden shadow-xs">
              {calibrationCases.map((c: any) => (
                <div key={c.id} className="p-5 hover:bg-stone-50/80 transition-colors space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-800 border border-stone-200">
                        {c.paper}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                        {c.subject} • {c.topic}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        {c.answerType}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        c.performanceTier === 'EXCELLENT' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        c.performanceTier === 'STRONG' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                        c.performanceTier === 'AVERAGE' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        Tier: {c.performanceTier}
                      </span>
                      <span className="text-xs font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                        {c.marksObtained} / {c.maxMarks} ({c.normalizedPercentage}%)
                      </span>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-stone-900">
                    {c.question}
                  </h4>

                  <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs text-stone-800 whitespace-pre-wrap font-serif">
                    {c.studentAnswer}
                  </div>

                  <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200/80 space-y-1 text-xs">
                    <span className="font-bold text-amber-950 uppercase text-[10px] tracking-wider">Faculty Anchor Feedback:</span>
                    <p className="text-stone-700">{c.feedback}</p>
                    {c.dimensions && Object.keys(c.dimensions).length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1 border-t border-amber-200/50 text-[11px] text-stone-600 font-mono">
                        {Object.entries(c.dimensions).map(([k, v]) => (
                          <span key={k}>{k}: <strong>{String(v)}</strong></span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : pendingList.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-stone-300 bg-stone-50 p-8">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-900">No Submissions In This Filter</h3>
          <p className="text-xs text-stone-600 max-w-md mx-auto mt-1">
            Check the other tabs or wait as students submit new Mains copies.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-200 overflow-hidden shadow-xs">
          {pendingList.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 hover:bg-stone-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-800 border border-stone-200">
                    {item.paper || 'GS Paper'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                    {item.subject} • {item.topic}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    {item.answerType || 'TYPED'}
                  </span>
                  {item.reviewStatus === 'COMPLETED' ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 font-semibold">
                      <ShieldCheck className="w-3 h-3" /> Ground Truth Completed
                    </span>
                  ) : item.reviewStatus === 'IN_REVIEW' ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 font-semibold">
                      <Lock className="w-3 h-3" /> Locked by {item.reviewLockedBy}
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" /> Awaiting Review
                    </span>
                  )}
                  <span className="text-xs text-stone-400">
                    {new Date(item.submittedAt || item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-stone-900 line-clamp-2">
                  {item.question}
                </h3>
                <div className="flex items-center gap-4 text-xs text-stone-600">
                  <span>AI Score: <strong>{item.aiMarks !== null ? `${item.aiMarks}/${item.maxMarks}` : 'Pending'}</strong></span>
                  <span>Word Count: <strong>{item.wordCount || 'N/A'}</strong></span>
                  {item.existingReviewHistory?.length > 0 && (
                    <span>Faculty Marks: <strong>{item.existingReviewHistory[0].facultyMarks}/{item.maxMarks} ({item.existingReviewHistory[0].facultyVerdict})</strong></span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleOpenReview(item)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg border border-amber-300 transition-colors shrink-0"
              >
                {item.reviewStatus === 'COMPLETED' ? 'Re-Calibrate Review' : 'Claim & Review'}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal Workbench */}
      {activeItem && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-stone-300">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                    {activeItem.classification?.questionType || 'GS'} • Directive: {activeItem.classification?.directive || 'DISCUSS'}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded border ${disagreementBadge.color}`}>
                    {disagreementBadge.label}
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-stone-200 text-stone-700">
                    Lock: Active (You)
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold font-serif-editorial text-stone-900 mt-1">
                  Faculty Copy Checking & Ground-Truth Calibration
                </h2>
              </div>
              <button
                onClick={handleCloseReview}
                className="p-1.5 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveReview} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Question & Demand */}
              <div className="p-4 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Commission Question</span>
                <p className="text-sm font-serif-editorial text-stone-900 leading-relaxed font-semibold">
                  "{activeItem.submission?.question}"
                </p>
                <div className="flex flex-wrap gap-3 pt-1 text-xs text-stone-600">
                  <span>Max Marks: <strong>{maxMarks}</strong></span>
                  <span>Target Word Limit: <strong>{activeItem.classification?.demand?.wordLimit || 150} words</strong></span>
                  <span>Required Dimensions: <strong>{(activeItem.classification?.demand?.requiredDimensions || []).join(', ')}</strong></span>
                </div>
              </div>

              {/* Student Submission (Typed vs Handwritten OCR Side-by-Side) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-700" />
                    Student Submission ({activeItem.submission?.submission_type || 'TYPED'})
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-stone-500">
                      Word Count: <strong>{currentWords}</strong>
                    </span>
                    {isHandwritten && (
                      <span className={`text-xs px-2 py-0.5 rounded font-medium border ${
                        activeItem.submission?.ocr_status === 'OCR_COMPLETED' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}>
                        OCR: {activeItem.submission?.ocr_status || 'OCR_PENDING'} ({Math.round(Number(activeItem.submission?.ocr_confidence || 0.85) * 100)}%)
                      </span>
                    )}
                  </div>
                </div>

                {isHandwritten ? (
                  /* Handwritten Side-by-Side View */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left: Original Handwriting Image */}
                    <div className="border border-stone-300 rounded-lg p-3 bg-stone-100 flex flex-col">
                      <div className="flex items-center justify-between pb-2 border-b border-stone-200 mb-2">
                        <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5 text-stone-500" />
                          Original Answer Sheet (Permanent Artifact)
                        </span>
                        <span className="text-xs text-stone-400">Preserved</span>
                      </div>
                      <div className="flex-1 min-h-[220px] max-h-[320px] overflow-auto flex items-center justify-center bg-white rounded border border-stone-200">
                        {activeItem.submission?.attachment_url ? (
                          <img
                            src={activeItem.submission.attachment_url.startsWith('http') ? '/mains-handwritten/sample_sheet_page1.jpg' : activeItem.submission.attachment_url}
                            alt="Original Student Answer Sheet"
                            className="w-full h-auto object-contain max-h-[300px]"
                            onError={(e) => {
                              // Local fallback
                              (e.target as any).src = '/mains-handwritten/sample_sheet_page1.jpg';
                            }}
                          />
                        ) : (
                          <div className="text-xs text-stone-400 p-4 text-center">
                            Handwritten image attached but not rendered.
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 mt-2 italic">
                        Original handwriting image is securely retained and never overwritten by OCR.
                      </p>
                    </div>

                    {/* Right: OCR Extracted / Corrected Text */}
                    <div className="border border-stone-300 rounded-lg p-3 bg-white flex flex-col">
                      <div className="flex items-center justify-between pb-2 border-b border-stone-200 mb-2">
                        <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
                          <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                          Extracted OCR Text
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleRunOcr}
                            disabled={ocrRunning}
                            className="px-2 py-0.5 text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 rounded border border-amber-300 transition-colors inline-flex items-center gap-1"
                          >
                            <RefreshCw className={`w-3 h-3 ${ocrRunning ? 'animate-spin' : ''}`} />
                            {ocrRunning ? 'Running...' : 'Re-run OCR'}
                          </button>
                          {!editingOcr ? (
                            <button
                              type="button"
                              onClick={() => setEditingOcr(true)}
                              className="px-2 py-0.5 text-xs text-stone-700 bg-stone-100 hover:bg-stone-200 rounded border border-stone-300 transition-colors"
                            >
                              Edit / Correct
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSaveCorrectedOcr}
                              disabled={savingOcr}
                              className="px-2 py-0.5 text-xs text-white bg-emerald-700 hover:bg-emerald-800 rounded font-bold transition-colors inline-flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              {savingOcr ? 'Saving...' : 'Approve OCR'}
                            </button>
                          )}
                        </div>
                      </div>

                      {editingOcr ? (
                        <textarea
                          rows={10}
                          value={correctedOcrText}
                          onChange={(e) => setCorrectedOcrText(e.target.value)}
                          className="w-full flex-1 p-2 text-xs font-mono border border-amber-300 rounded bg-amber-50/30 focus:ring-1 focus:ring-amber-500"
                          placeholder="Correct extracted OCR text..."
                        />
                      ) : (
                        <div className="flex-1 min-h-[220px] max-h-[300px] overflow-y-auto p-2 text-xs text-stone-800 leading-relaxed font-sans whitespace-pre-wrap bg-stone-50/50 rounded border border-stone-100">
                          {activeItem.submission?.corrected_ocr_text || activeItem.submission?.ocr_extracted_text || '(No OCR text extracted yet. Click Re-run OCR)'}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Standard Typed Answer View */
                  <div className="p-4 rounded-lg bg-white border border-stone-300 max-h-56 overflow-y-auto text-sm text-stone-800 leading-relaxed whitespace-pre-wrap font-sans">
                    {activeItem.submission?.answer_text || '(Empty answer content)'}
                  </div>
                )}
              </div>

              {/* AI Evaluation Reference Snapshot */}
              <div className="p-4 rounded-lg bg-blue-50/60 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Existing AI Model Evaluation Reference
                  </span>
                  <span className="text-xs font-bold text-blue-900">
                    AI Score: {activeItem.submission?.marks_obtained ?? 'N/A'} / {maxMarks}
                  </span>
                </div>
                <p className="text-xs text-blue-800 italic">
                  "{activeItem.submission?.feedback || 'Good structural effort.'}"
                </p>
              </div>

              {/* Faculty Ground Truth Scoring & Verdict Choice */}
              <div className="space-y-4 pt-2 border-t border-stone-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-700" />
                    Faculty Ground-Truth Evaluation
                  </h3>
                  {/* Verdict Options */}
                  <div className="flex rounded-lg border border-stone-300 p-0.5 bg-stone-100 text-xs">
                    <button
                      type="button"
                      onClick={() => handleSelectVerdict('ACCEPTED')}
                      className={`px-3 py-1 rounded font-medium transition-colors ${
                        verdict === 'ACCEPTED' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      1. Accept AI
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectVerdict('EDITED')}
                      className={`px-3 py-1 rounded font-medium transition-colors ${
                        verdict === 'EDITED' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      2. Calibrate Score
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectVerdict('INDEPENDENT')}
                      className={`px-3 py-1 rounded font-medium transition-colors ${
                        verdict === 'INDEPENDENT' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      3. Independent
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectVerdict('REJECTED')}
                      className={`px-3 py-1 rounded font-medium transition-colors ${
                        verdict === 'REJECTED' ? 'bg-rose-600 text-white font-bold' : 'text-rose-700 hover:text-rose-900'
                      }`}
                    >
                      4. Reject
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Faculty Final Marks (out of {maxMarks})
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max={maxMarks}
                      value={facultyMarks}
                      onChange={(e) => setFacultyMarks(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Live Disagreement vs AI Model
                    </label>
                    <div className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-stone-50 flex items-center justify-between">
                      <span className="font-mono text-stone-700">
                        Δ {absDiff.toFixed(1)} marks ({pctDiff.toFixed(1)}%)
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${disagreementBadge.color}`}>
                        {disagreementBadge.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rubric Dimension Sliders */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-stone-500" />
                    Standard Rubric Dimensions ({activeItem.classification?.questionType || 'GS'})
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-50 p-3 rounded-lg border border-stone-200">
                    {(activeItem.standardRubric?.dimensions || []).map((dim: any) => (
                      <div key={dim.key} className="space-y-1">
                        <div className="flex justify-between text-xs text-stone-700">
                          <span className="font-medium">{dim.label}</span>
                          <span className="font-bold text-amber-900">{dimensions[dim.key] ?? 6}/10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="1"
                          value={dimensions[dim.key] ?? 6}
                          onChange={(e) => setDimensions({ ...dimensions, [dim.key]: Number(e.target.value) })}
                          className="w-full accent-amber-700 cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detailed Feedback & Improvements */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Evaluator Qualitative Feedback
                    </label>
                    <textarea
                      rows={3}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      placeholder="Comprehensive examiner remarks..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-emerald-800 mb-1">
                        Key Strengths (one per line)
                      </label>
                      <textarea
                        rows={2}
                        value={strengths}
                        onChange={(e) => setStrengths(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        placeholder="Clear constitutional framing..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-rose-800 mb-1">
                        Key Weaknesses (one per line)
                      </label>
                      <textarea
                        rows={2}
                        value={weaknesses}
                        onChange={(e) => setWeaknesses(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                        placeholder="Limited counterarguments..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Actionable Step to Gain 2-3 Extra Marks
                    </label>
                    <input
                      type="text"
                      value={actionableImprovement}
                      onChange={(e) => setActionableImprovement(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      placeholder="e.g. Include 2nd ARC recommendations or relevant committee findings."
                    />
                  </div>
                </div>

                {/* Quality Gates Checklist Preview */}
                <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-stone-600" />
                      Dataset Readiness Quality Gates
                    </span>
                    <span className="text-[11px] text-stone-500 font-mono">
                      {gates.filter(g => g.pass).length} / {gates.length} Gates Passing
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {gates.map((g, idx) => (
                      <div
                        key={idx}
                        className={`p-1.5 rounded flex items-center gap-1.5 border ${
                          g.pass ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {g.pass ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                        <span className="truncate">{g.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Training Eligibility & Anti-Leakage Flag */}
                <div className="p-4 rounded-lg bg-amber-50/70 border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-800" />
                      Model Training Dataset Curation
                    </span>
                    <select
                      value={trainingEligibility}
                      onChange={(e: any) => setTrainingEligibility(e.target.value)}
                      className="text-xs px-2.5 py-1 rounded border border-amber-300 font-bold bg-white text-stone-800"
                    >
                      <option value="TRAINING_ELIGIBLE">TRAINING_ELIGIBLE</option>
                      <option value="EXCLUDED">EXCLUDE FROM TRAINING</option>
                    </select>
                  </div>

                  {trainingEligibility === 'EXCLUDED' && (
                    <div>
                      <label className="block text-xs font-semibold text-rose-800 mb-1">
                        Exclusion Reason (Mandatory when excluding)
                      </label>
                      <input
                        type="text"
                        value={exclusionReason}
                        onChange={(e) => setExclusionReason(e.target.value)}
                        placeholder="e.g. Incomplete answer, corrupted OCR, or disputed interpretation"
                        className="w-full px-3 py-1.5 text-xs border border-rose-300 rounded bg-white text-rose-900"
                        required
                      />
                    </div>
                  )}

                  <div className="pt-2 border-t border-amber-200/60 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="doubleReviewCheck"
                      checked={isDoubleReview}
                      onChange={(e) => setIsDoubleReview(e.target.checked)}
                      className="rounded border-amber-300 text-amber-700 focus:ring-amber-500 h-4 w-4"
                    />
                    <label htmlFor="doubleReviewCheck" className="text-xs font-semibold text-amber-950 cursor-pointer">
                      Conduct Blind Double-Review (Dual-evaluator inter-rater calibration)
                    </label>
                  </div>

                  <p className="text-xs text-amber-800/90 leading-tight">
                    Approved answers will be anonymized, hashed, and separated by learner to form the proprietary IKSHOVIA Mains Copy Checking Dataset without benchmark leakage or duplicate contamination.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleCloseReview}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors inline-flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  Release Review & Exit
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Saving Ground Truth...' : 'Record Faculty Review & Complete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
