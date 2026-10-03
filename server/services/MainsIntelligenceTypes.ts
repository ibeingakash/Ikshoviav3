export type MainsQuestionType =
  | 'GS'
  | 'ESSAY'
  | 'ETHICS'
  | 'OPTIONAL'
  | 'BPSC_GS'
  | 'BPSC_OPTIONAL'
  | 'OTHER';

export type QuestionDirective =
  | 'DISCUSS'
  | 'ANALYZE'
  | 'CRITICALLY_EXAMINE'
  | 'EVALUATE'
  | 'EXAMINE'
  | 'COMMENT'
  | 'EXPLAIN'
  | 'ELUCIDATE'
  | 'OTHER';

export type DisagreementLevel =
  | 'AGREEMENT'
  | 'MINOR_DISAGREEMENT'
  | 'MAJOR_DISAGREEMENT';

export type TrainingEligibilityStatus =
  | 'CANDIDATE'
  | 'REVIEW_REQUIRED'
  | 'TRAINING_ELIGIBLE'
  | 'EXCLUDED'
  | 'USED_IN_TRAINING';

export type ModelLifecycleStatus =
  | 'EXPERIMENTAL'
  | 'BENCHMARKED'
  | 'SHADOW'
  | 'PRODUCTION'
  | 'RETIRED';

export type TrainingJobStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type BenchmarkTier =
  | 'WEAK'
  | 'AVERAGE'
  | 'STRONG'
  | 'EXCELLENT';

export interface QuestionDemandAnalysis {
  directive: QuestionDirective;
  coreDemand: string;
  requiredDimensions: string[];
  scope: string;
  expectedDepth: 'FOUNDATIONAL' | 'STANDARD' | 'ADVANCED';
  wordLimit: number;
}

export interface RubricDimensionDefinition {
  key: string;
  label: string;
  weightPercentage: number;
  description: string;
}

export interface StandardQuestionRubric {
  questionType: MainsQuestionType;
  dimensions: RubricDimensionDefinition[];
  maxMarks: number;
}

export interface EvaluationDimensionsScore {
  [dimensionKey: string]: number;
}

export interface EvaluationResultPayload {
  marksObtained: number;
  maxMarks: number;
  normalizedPercentage: number;
  dimensions: EvaluationDimensionsScore;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  missingDimensions: string[];
  actionableImprovement: string;
  evaluatorType: 'AI' | 'FACULTY';
  modelVersion?: string;
  retrievedContextSnippets?: string[];
}

export interface DisagreementMetrics {
  aiMarks: number;
  facultyMarks: number;
  maxMarks: number;
  marksDifference: number;
  percentageDifference: number;
  disagreementLevel: DisagreementLevel;
  dimensionDisagreements: {
    [key: string]: {
      aiScore: number;
      facultyScore: number;
      diff: number;
    };
  };
}

export interface TrainingExampleJSONL {
  id: string;
  anonymized_learner_id: string;
  split: 'TRAIN' | 'VALIDATION' | 'TEST';
  input: {
    question: string;
    question_type: MainsQuestionType;
    directive: QuestionDirective;
    exam: string;
    stage: string;
    paper?: string;
    subject?: string;
    topic?: string;
    concept?: string;
    max_marks: number;
    word_limit: number;
    student_answer: string;
    answer_format: string;
    ocr_confidence: number;
    rubric: RubricDimensionDefinition[];
    retrieved_context?: string[];
    model_answer_reference?: string;
  };
  target: {
    marks_obtained: number;
    max_marks: number;
    normalized_percentage: number;
    rubric_scores: EvaluationDimensionsScore;
    feedback: string;
    strengths: string[];
    weaknesses: string[];
    actionable_improvement: string;
  };
  metadata: {
    review_id: string;
    submission_id: string;
    faculty_role: string;
    answer_hash: string;
    dataset_version: string;
  };
}

export interface BaseEvaluationModel {
  id: string;
  name: string;
  version: string;
  evaluate(input: {
    questionText: string;
    answerText: string;
    maxMarks: number;
    wordLimit?: number;
    questionType: MainsQuestionType;
    rubric: StandardQuestionRubric;
    retrievedContext?: string[];
  }): Promise<EvaluationResultPayload>;
}

// ------------------------------------------------------------------
// PHASE 4.1C DATASET COLLECTION TYPES
// ------------------------------------------------------------------
export type DatasetCoverageStatus = 'COVERED' | 'PARTIALLY_COVERED' | 'MISSING';

export type DoubleReviewStatus =
  | 'AWAITING_SECOND_REVIEW'
  | 'COMPLETED'
  | 'ADJUDICATION_REQUIRED'
  | 'ADJUDICATED';

export type DatasetEventType =
  | 'ACQUISITION_QUESTION_ASSIGNED'
  | 'ANSWER_STARTED'
  | 'ANSWER_SUBMITTED'
  | 'AI_EVALUATED'
  | 'AI_EVALUATION_CREATED'
  | 'FACULTY_REVIEW_ASSIGNED'
  | 'FACULTY_REVIEW_STARTED'
  | 'FACULTY_REVIEW_COMPLETED'
  | 'OCR_STARTED'
  | 'OCR_COMPLETED'
  | 'OCR_CORRECTED'
  | 'OCR_REVIEW_REQUIRED'
  | 'OCR_APPROVED'
  | 'DOUBLE_REVIEW_CREATED'
  | 'ADJUDICATION_REQUIRED'
  | 'ADJUDICATION_COMPLETED'
  | 'CALIBRATION_COMPLETED'
  | 'TRAINING_READINESS_AUDITED'
  | 'BENCHMARK_LEAKAGE_REMEDIATED'
  | 'DUPLICATE_TRAINING_CANDIDATE_EXCLUDED'
  | 'REMEDIATION_SNAPSHOT_CAPTURED'
  | 'TRAINING_CANDIDATE_ELIGIBLE'
  | 'TRAINING_CANDIDATE_EXCLUDED'
  | 'BENCHMARK_CANDIDATE_CREATED'
  | 'BENCHMARK_CANDIDATE_ISOLATED'
  | 'CAMPAIGN_CREATED'
  | 'CAMPAIGN_UPDATED'
  | 'TRAINING_ELIGIBLE'
  | 'TRAINING_EXCLUDED'
  | 'QUARANTINE_ISOLATED'
  | 'QUARANTINE_RESOLVED'
  | 'QUARANTINE_RESTORED';

export interface CalibrationCase {
  id: string;
  submissionId: string;
  questionId: string;
  question: string;
  exam: string;
  paper: string;
  subject: string;
  topic: string;
  studentAnswer: string;
  answerType: string;
  marksObtained: number;
  maxMarks: number;
  normalizedPercentage: number;
  performanceTier: BenchmarkTier;
  dimensions: EvaluationDimensionsScore;
  feedback: string;
  verdict: string;
  disagreementLevel: DisagreementLevel;
  anonymizedLearnerId: string;
}

export interface DatasetCoverageItem {
  category: string;
  subcategory: string;
  count: number;
  eligibleCount: number;
  status: DatasetCoverageStatus;
}

// ------------------------------------------------------------------
// PHASE 4.1D DATASET ACQUISITION TYPES
// ------------------------------------------------------------------

export interface DatasetAcquisitionPriority {
  paper: string;
  subject: string;
  topic: string;
  concept?: string;
  questionId: string;
  question: string;
  directive: string;
  marks: number;
  wordLimit: number;
  currentCoverage: DatasetCoverageStatus;
  priorityReason: string;
  provenance: 'CANONICAL_UPSC' | 'IKSHOVIA_CREATED';
  recommendedPracticePath: string;
  priorityRank: number;
}

export interface ReviewWorkloadConfig {
  id: string;
  maxActiveReviewsPerTeacher: number;
  maxDailyNewReviews: number;
  maxPendingAssignments: number;
  doubleReviewPercentage: number;
  updatedAt?: string;
}

export interface ReviewAssignment {
  id: string;
  submissionId: string;
  reviewerId: string;
  reviewerName?: string;
  assignedBy?: string;
  status: 'ASSIGNED' | 'CLAIMED' | 'COMPLETED' | 'REASSIGNED' | 'EXPIRED';
  assignedAt: string;
  claimedAt?: string;
  completedAt?: string;
  reviewDurationSeconds?: number;
  priorityScore: number;
  priorityReason?: string;
}

export interface DatasetAcquisitionFunnel {
  questionsSurfaced: number;
  answersSubmitted: number;
  aiEvaluated: number;
  facultyReviewed: number;
  groundTruthAccepted: number;
  qualityGatesPassed: number;
  uniqueTrainingCandidates: number;
  conversionRates: {
    submissionRate: number;
    aiEvaluationRate: number;
    facultyReviewRate: number;
    acceptanceRate: number;
    qualityGatePassRate: number;
    overallConversionRate: number;
  };
}

export interface LearnerDiversityMetrics {
  totalUniqueLearners: number;
  uniqueLearnersWithEligible: number;
  eligibleAnswersPerLearner: {
    anonymizedLearnerId: string;
    eligibleCount: number;
    percentageOfDataset: number;
  }[];
  highestContributorPercentage?: number;
  concentrationFlag: boolean;
  concentrationWarningMessage?: string;
}

export interface DetailedCoverageMatrix {
  paperTier: Record<string, Record<string, { raw: number; facultyReviewed: number; trainingEligible: number }>>;
  paperDirective: Record<string, Record<string, { raw: number; facultyReviewed: number; trainingEligible: number }>>;
  paperMarks: Record<string, Record<string, { raw: number; facultyReviewed: number; trainingEligible: number }>>;
  paperType: Record<string, Record<string, { raw: number; facultyReviewed: number; trainingEligible: number }>>;
  subjectPaper: Record<string, Record<string, { raw: number; facultyReviewed: number; trainingEligible: number }>>;
  topicPaper: Record<string, Record<string, { raw: number; facultyReviewed: number; trainingEligible: number }>>;
}

export interface DatasetSnapshotRecord {
  id: string;
  versionName: string;
  description?: string;
  status: 'DRAFT' | 'VALIDATING' | 'FROZEN';
  eligibleItemsCount: number;
  checksumSha256?: string;
  eligibleSubmissionIds: string[];
  coverageStatistics: any;
  duplicateStatistics: any;
  learnerDiversity: any;
  paperDistribution: any;
  tierDistribution: any;
  creatorId?: string;
  createdAt: string;
  frozenAt?: string;
}

// ------------------------------------------------------------------
// PHASE 4.1E DATASET QUALITY CONTROL & RELEASE CANDIDATE TYPES
// ------------------------------------------------------------------

export type QualityDimensionStatus = 'PASS' | 'WARNING' | 'FAIL';

export interface QualityDimensionEvaluation {
  dimension: string;
  status: QualityDimensionStatus;
  summary: string;
  details?: any;
}

export interface DatasetQualityScorecard {
  dataCompleteness: QualityDimensionEvaluation;
  facultyGroundTruth: QualityDimensionEvaluation;
  evaluationConsistency: QualityDimensionEvaluation;
  paperSubjectCoverage: QualityDimensionEvaluation;
  performanceTierCoverage: QualityDimensionEvaluation;
  answerFormatCoverage: QualityDimensionEvaluation;
  ocrQuality: QualityDimensionEvaluation;
  duplicateHealth: QualityDimensionEvaluation;
  benchmarkIsolation: QualityDimensionEvaluation;
  learnerDiversity: QualityDimensionEvaluation;
  piiSafety: QualityDimensionEvaluation;
  datasetIntegrity: QualityDimensionEvaluation;
  overallReadiness: 'READY' | 'READY_WITH_WARNINGS' | 'BLOCKED';
  evaluatedAt: string;
  summaryCounts: {
    totalAnswers: number;
    facultyReviewed: number;
    trainingEligible: number;
    quarantined: number;
    benchmarkExcluded: number;
  };
}

export interface InterRaterReliabilityResult {
  sampleSize: number;
  status: 'SUFFICIENT' | 'INSUFFICIENT_SAMPLE_SIZE';
  statisticName: string;
  value?: number;
  exactMarkAgreementRate: number;
  averageAbsoluteDifference: number;
  normalizedPercentageDifference: number;
  rubricDimensionAgreementRate: number;
  adjudicationFrequency: number;
  message?: string;
}

export interface FacultyCalibrationSummary {
  totalReviews: number;
  uniqueFacultyEvaluators: number;
  pairedEvaluations: number;
  doubleReviewedAnswers: number;
  adjudicatedAnswers: number;
  averageMarkDifference: number;
  medianMarkDifference: number;
  percentageDifference: number;
  rubricAgreement: number;
  disagreementCategories: {
    minimal: number;
    minor: number;
    major: number;
  };
  interRaterReliability: InterRaterReliabilityResult;
}

export interface FacultyEvaluatorConsistency {
  evaluatorId: string;
  evaluatorName: string;
  reviewsCompleted: number;
  papersReviewed: string[];
  subjectsReviewed: string[];
  averageMarks: number;
  markDistribution: {
    min: number;
    max: number;
    stdDev: number;
  };
  aiFacultyDisagreementRate: number;
  doubleReviewParticipation: number;
  adjudicationRate: number;
  rubricConsistency: number;
  status: 'VALID' | 'INSUFFICIENT_DATA';
  calibrationNote?: string;
  notes?: string;
}

export interface CandidateAnswerQualityCheck {
  submissionId: string;
  questionId: string;
  paper: string;
  marksObtained: number;
  maxMarks: number;
  eligible: boolean;
  status: 'PASS' | 'WARNING' | 'FAIL';
  rejections: string[];
  warnings: string[];
  checks: {
    questionValidity: { status: 'PASS' | 'WARNING' | 'FAIL'; reason?: string };
    answerValidity: { status: 'PASS' | 'WARNING' | 'FAIL'; reason?: string };
    facultyReviewStatus: { status: 'PASS' | 'WARNING' | 'FAIL'; reason?: string };
    rubricCompleteness: { status: 'PASS' | 'WARNING' | 'FAIL'; reason?: string };
    marksValidity: { status: 'PASS' | 'WARNING' | 'FAIL'; reason?: string };
    aiFacultyDisagreement: { status: 'PASS' | 'WARNING' | 'FAIL'; reason?: string };
    doubleReviewStatus: { status: 'PASS' | 'WARNING' | 'FAIL'; reason?: string };
    adjudicationStatus: { status: 'PASS' | 'WARNING' | 'FAIL'; reason?: string };
    ocrConfidence: { status: 'PASS' | 'WARNING' | 'FAIL'; reason?: string };
    duplicateStatus: { status: 'PASS' | 'WARNING' | 'FAIL'; reason?: string };
    benchmarkOverlap: { status: 'PASS' | 'WARNING' | 'FAIL'; reason?: string };
    testFixtureStatus: { status: 'PASS' | 'WARNING' | 'FAIL'; reason?: string };
    learnerDiversity: { status: 'PASS' | 'WARNING' | 'FAIL'; reason?: string };
    piiSafety: { status: 'PASS' | 'WARNING' | 'FAIL'; reason?: string };
  };
}

export interface ReleaseCandidateManifest {
  release_candidate_id: string;
  created_at: string;
  git_commit?: string;
  total_answers_evaluated: number;
  passed_answers: number;
  excluded_answers: number;
  exclusion_reasons: Record<string, number>;
  paper_breakdown: Record<string, { total: number; passed: number }>;
  subject_breakdown: Record<string, { total: number; passed: number }>;
  directive_breakdown: Record<string, { total: number; passed: number }>;
  marks_breakdown: Record<string, { total: number; passed: number }>;
  tier_breakdown: Record<string, { total: number; passed: number }>;
  faculty_review_count: number;
  double_review_count: number;
  adjudication_count: number;
  calibration_status: string;
  sha256_checksum: string;
  dataset_signature: string;
  training_eligibility_status: 'STILL_LOCKED';
}

export interface DatasetReleaseCandidate {
  id: string;
  releaseCandidateId: string;
  datasetVersion: string;
  status: 'DRAFT' | 'VALIDATING' | 'READY' | 'READY_FOR_RELEASE_CANDIDATE' | 'BLOCKED' | 'FROZEN';
  eligibleItemsCount: number;
  checksumSha256?: string;
  itemIds: string[];
  uniqueAnswerHashes: string[];
  qualityReport: any;
  coverageReport: any;
  calibrationReport: any;
  duplicateReport: any;
  benchmarkReport: any;
  piiReport: any;
  learnerDiversityReport: any;
  ocrReport: any;
  manifest?: ReleaseCandidateManifest;
  datasetSignature?: string;
  gitCommit?: string;
  overallStatus: 'READY' | 'READY_WITH_WARNINGS' | 'BLOCKED';
  mandatoryChecksPassed: boolean;
  blockingReasons: string[];
  validationReportMarkdown?: string;
  creatorId?: string;
  createdAt: string;
  validatedAt?: string;
  frozenAt?: string;
}

export interface AiDisagreementAnalytics {
  totalPaired: number;
  mae: number;
  medianAbsoluteError: number;
  averagePercentageDifference: number;
  buckets: {
    minimal: number;
    minor: number;
    major: number;
  };
  breakdowns: {
    byPaper: Record<string, { count: number; mae: number }>;
    bySubject: Record<string, { count: number; mae: number }>;
    byMarks: Record<string, { count: number; mae: number }>;
    byDirective: Record<string, { count: number; mae: number }>;
    byTier: Record<string, { count: number; mae: number }>;
    byAnswerType: Record<string, { count: number; mae: number }>;
  };
}

export interface QuarantineRecord {
  id: string;
  submissionId: string;
  quarantineReason: string;
  detectedBy: string;
  previousEligibilityState: string;
  resolutionStatus: 'QUARANTINED' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
  resolutionOutcome?: 'RESTORED' | 'PERMANENTLY_EXCLUDED';
  notes?: string;
  metadata?: any;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  restoredAt?: string;
}

export type TrainingReadinessStatus = 'TRAINING_READY' | 'TRAINING_READY_WITH_LIMITATIONS' | 'TRAINING_NOT_READY';
export type HardGateStatus = 'PASS' | 'FAIL' | 'INSUFFICIENT_DATA';

export interface TrainingReadinessAuditResult {
  status: TrainingReadinessStatus;
  generatedAt: string;
  dataset: {
    totalSubmissions: number;
    submittedAnswers: number;
    aiEvaluatedAnswers: number;
    facultyVerified: number;
    pairedAiFacultyAnswers: number;
    independentFacultyEvaluations: number;
    acceptedAiEvaluations: number;
    editedCalibratedEvaluations: number;
    rejectedEvaluations: number;
    trainingEligibleReviews: number;
    eligibleUniqueAnswers: number;
    uniqueAnswers: number;
    uniqueLearners: number;
    duplicateAnswerHashes: number;
    duplicateRate: number;
    quarantinedAnswers: number;
    pendingFacultyReviews: number;
    adjudicationRequiredReviews: number;
    ocrRequiredAnswers: number;
    ocrReviewedAnswers: number;
    rawReviewRecords: number;
    uniqueSubmissionIds: number;
  };
  coverage: {
    papers: Record<string, { count: number; uniqueAnswers: number; facultyVerified: number; eligible: number; percentage: number }>;
    subjects: Record<string, { count: number; uniqueAnswers: number; facultyVerified: number; eligible: number; percentage: number }>;
    topics: Record<string, { count: number; uniqueAnswers: number; facultyVerified: number; eligible: number; percentage: number }>;
    directives: Record<string, { count: number; uniqueAnswers: number; facultyVerified: number; eligible: number; percentage: number; isUnderrepresented: boolean }>;
    marks: Record<string, { count: number; uniqueAnswers: number; facultyVerified: number; eligible: number; percentage: number }>;
    tiers: Record<string, { count: number; uniqueAnswers: number; uniqueLearners: number; eligible: number; percentage: number }>;
    formats: {
      typed: number;
      handwritten: number;
      ocrProcessed: number;
      ocrHighConfidence: number;
      ocrLowConfidence: number;
      ocrManuallyCorrected: number;
      ocrApproved: number;
      ocrReviewRequired: number;
      handwrittenUsableCount: number;
      handwrittenUsabilityNote?: string;
    };
    blindSpots: string[];
  };
  calibration: {
    status: 'CALIBRATED' | 'WATCH' | 'INSUFFICIENT_DATA';
    mae: number | null;
    medianAbsoluteError: number | null;
    averagePercentageDifference: number | null;
    adjudicationRate: number | null;
    evaluatorsCount: number;
    rubricAgreement: number | null;
    pairedReviewsCount: number;
    doubleReviewsCount: number;
    interRaterStatus: string;
    note: string;
  };
  duplicates: {
    duplicateRate: number | null;
    hashCollisions: number;
    exactDuplicates: number;
    learnerCollisions: number;
  };
  benchmark: {
    status: 'ISOLATED' | 'CONTAMINATED' | 'INSUFFICIENT_DATA';
    items: number;
    uniqueAnswers: number;
    isolated: boolean;
    benchmarksCount: number;
    leakageCount: number;
    benchmarksSummary: any[];
  };
  releaseCandidate: {
    status: 'VALIDATED' | 'FROZEN' | 'BLOCKED' | 'MISSING';
    checksumValid: boolean;
    piiSafe: boolean;
    frozen: boolean;
    latestVersion?: string;
    manifestValid: boolean;
    storedChecksum?: string;
    recomputedChecksum?: string;
  };
  hardGates: {
    unadjudicatedDoubleReviews: HardGateStatus;
    pendingQuarantines: HardGateStatus;
    benchmarkIsolation: HardGateStatus;
    piiSafety: HardGateStatus;
    rubricCompleteness: HardGateStatus;
    facultyGroundTruth: HardGateStatus;
    duplicateCheck: HardGateStatus;
    signedReleaseCandidate: HardGateStatus;
  };
  hardGatesDetail: Record<string, { status: HardGateStatus; message: string }>;
  training: {
    configuredThresholds: {
      minimumVerifiedReviews: number;
      minimumUniqueAnswers: number;
      minimumSubjects: number;
      minimumBenchmarkItems: number;
      maxDisagreementThreshold: number;
    };
    actualTrainingEligible: boolean;
    modelActuallyTrained: boolean;
    trainingJobsRunning: number;
  };
  blockingReasons: string[];
  recommendations: string[];
  summary: string;
}

// ------------------------------------------------------------------
// PHASE 4.1H: DATASET REMEDIATION & ACQUISITION TYPES
// ------------------------------------------------------------------

export interface DatasetRemediationSnapshot {
  id: string;
  snapshotType: 'PRE_REMEDIATION' | 'POST_REMEDIATION' | 'PERIODIC';
  timestamp: string;
  uniqueAnswerCount: number;
  facultyVerifiedCount: number;
  uniqueLearnerCount: number;
  subjectCount: number;
  benchmarkCount: number;
  leakageRecordCount: number;
  duplicateRecordCount: number;
  releaseCandidateState: string;
  details: any;
}

export interface LeakageRemediationRecord {
  benchmarkId: string;
  benchmarkItemId: string;
  submissionId: string;
  answerHash: string;
  learnerId: string;
  previousEligibility: string;
  remediationAction: 'QUARANTINED_AND_EXCLUDED';
  reason: string;
  remediatedAt: string;
}

export interface DuplicateRemediationGroup {
  answerHash: string;
  totalSubmissions: number;
  canonicalSubmissionId: string;
  canonicalFacultyId?: string;
  canonicalMarks?: number;
  excludedSubmissionIds: string[];
  learnerIds: string[];
  remediationAction: 'EXCLUDED_NON_CANONICAL_DUPLICATES';
  remediatedAt: string;
}

export interface TargetedSyllabusTrack {
  trackId: string;
  paper: string;
  subject: string;
  title: string;
  description: string;
  availableQuestions: number;
  unansweredQuestions: number;
  pendingFacultyReviews: number;
  facultyReviewedCount: number;
  trainingEligibleCount: number;
  coverageDeficit: number;
  priorityScore: number;
  recommendedNextQuestion?: {
    id: string;
    question: string;
    directive: string;
    marks: number;
    sourceOrigin: 'CANONICAL_UPSC' | 'IKSHOVIA_CREATED';
  };
}

export interface DatasetRemediationOverview {
  status: TrainingReadinessStatus;
  remediationExecuted: boolean;
  remediationSummary: string;
  targets: {
    minimumVerifiedReviews: number;
    minimumUniqueAnswers: number;
    minimumSubjects: number;
    minimumBenchmarkItems: number;
  };
  current: {
    rawSubmissions: number;
    uniqueAnswers: number;
    facultyVerified: number;
    eligibleUniqueAnswers: number;
    uniqueLearners: number;
    subjectsCount: number;
    duplicateCollisions: number;
    benchmarkLeakageCount: number;
  };
  blockers: string[];
  coverageGaps: {
    papers: Record<string, { count: number; verified: number; eligible: number; deficit: number }>;
    subjects: Record<string, { count: number; verified: number; eligible: number; deficit: number }>;
    directives: Record<string, { count: number; verified: number; eligible: number; isUnderrepresented: boolean }>;
    marks: Record<string, { count: number; verified: number; eligible: number; isOverConcentrated: boolean }>;
    tiers: Record<string, { count: number; verified: number; eligible: number }>;
    formats: { typed: number; handwritten: number; ocrHighConfidence: number; ocrReviewRequired: number };
  };
  leakage: LeakageRemediationRecord[];
  duplicates: DuplicateRemediationGroup[];
  benchmark: {
    totalItems: number;
    requiredItems: number;
    deficit: number;
    isolationVerified: boolean;
    leakageCount: number;
  };
  facultyWorkload: {
    evaluatorCount: number;
    evaluators: {
      facultyId: string;
      reviewsCount: number;
      percentageShare: number;
      isConcentrated: boolean;
    }[];
    concentrationWarning: boolean;
  };
  learnerDiversity: {
    uniqueLearners: number;
    maxSingleSharePct: number;
    concentrationWarning: boolean;
  };
  nextPriorities: {
    rank: number;
    paper: string;
    subject: string;
    directive: string;
    marks: number;
    deficitReason: string;
    priorityScore: number;
    recommendedQuestion?: any;
  }[];
  targetedTracks: TargetedSyllabusTrack[];
}

// ------------------------------------------------------------------
// PHASE 4.1I: CONTROLLED DATASET GROWTH & ACQUISITION TYPES
// ------------------------------------------------------------------

export interface AcquisitionCampaign {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  targetAnswers: number;
  targetFacultyReviews: number;
  targetSubjects: number;
  targetBenchmarkItems: number;
  coveragePriorities: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  progress?: {
    currentAnswers: number;
    currentReviews: number;
    currentSubjects: number;
    currentBenchmark: number;
    answersPct: number;
    reviewsPct: number;
  };
}

export interface AcquisitionMatrixCell {
  raw: number;
  reviewed: number;
  eligible: number;
}

export interface AcquisitionCoverageMatrices {
  paperMarks: Record<string, Record<string, AcquisitionMatrixCell>>;
  paperDirective: Record<string, Record<string, AcquisitionMatrixCell>>;
  paperTier: Record<string, Record<string, AcquisitionMatrixCell>>;
  paperFormat: Record<string, Record<string, AcquisitionMatrixCell>>;
  subjectTopic: Record<string, Record<string, AcquisitionMatrixCell>>;
  learnerContribution: Record<string, { total: number; eligible: number; sharePct: number }>;
  facultyReviews: Record<string, { total: number; independent: number; sharePct: number }>;
}

export interface FacultyAcquisitionQueueItem {
  submissionId: string;
  questionId: string;
  question: string;
  exam: string;
  paper: string;
  subject: string;
  topic: string;
  directive: string;
  marks: number;
  wordLimit: number;
  wordCount: number;
  learnerAnswer: string;
  answerFormat: string;
  attachmentUrl?: string;
  ocrExtractedText?: string;
  ocrConfidence?: number;
  ocrStatus?: string;
  aiMarksObtained?: number;
  aiFeedback?: string;
  aiStrengths?: string[];
  aiWeaknesses?: string[];
  submittedAt: string;
  reviewStatus: string;
  ageHours: number;
  priorityReason: string;
  priorityScore: number;
}

export interface DatasetGrowthOverview {
  status: TrainingReadinessStatus;
  progress: {
    uniqueTrainingAnswers: { current: number; target: number; percentage: number };
    facultyVerifiedReviews: { current: number; target: number; percentage: number };
    uniqueLearners: { current: number; maxSharePct: number };
    subjectsCovered: { current: number; target: number };
    benchmarkItems: { current: number; target: number; leakageCount: number };
    pendingFacultyReviews: number;
    pendingOcrReviews: number;
    adjudicationRequiredCount: number;
    trainingReadinessVerdict: TrainingReadinessStatus;
  };
  activeCampaigns: AcquisitionCampaign[];
  recentEvents: any[];
  safetyGuarantees: {
    modelActuallyTrained: boolean;
    fineTuningExecuted: boolean;
    syntheticDataCreated: boolean;
    trainingLocked: boolean;
  };
}

// ------------------------------------------------------------------
// PHASE 4.1J: TELEGRAM MAINS COPY INGESTION TYPES
// ------------------------------------------------------------------

export type TelegramSourceType = 'PRIVATE_GROUP' | 'PRIVATE_CHANNEL' | 'DIRECT_BOT_UPLOAD';
export type TelegramRetentionPolicy = 'TEMPORARY_PROCESSING' | 'PERSIST_ORIGINAL';

export type TelegramImportStatus =
  | 'DISCOVERED'
  | 'AUTHORIZED'
  | 'DOWNLOADING'
  | 'DOWNLOADED'
  | 'HASHED'
  | 'VALIDATING'
  | 'EXTRACTING'
  | 'OCR_REQUIRED'
  | 'OCR_PROCESSING'
  | 'OCR_COMPLETE'
  | 'SEGMENTING'
  | 'GROUND_TRUTH_DETECTION'
  | 'PII_SANITIZATION'
  | 'DUPLICATE_CHECK'
  | 'QUALITY_VALIDATION'
  | 'IMPORTED'
  | 'DATASET_CANDIDATE'
  | 'EXCLUDED'
  | 'FAILED'
  | 'DUPLICATE_SOURCE_FILE';

export type FacultyGroundTruthStatus =
  | 'FACULTY_GROUND_TRUTH_PRESENT'
  | 'FACULTY_GROUND_TRUTH_PARTIAL'
  | 'FACULTY_GROUND_TRUTH_ABSENT'
  | 'FACULTY_GROUND_TRUTH_REQUIRES_VALIDATION';

export type LearnerIdentityStatus =
  | 'KNOWN_IKSHOVIA_LEARNER'
  | 'KNOWN_EXTERNAL_LEARNER'
  | 'UNKNOWN_LEARNER'
  | 'IDENTITY_REQUIRES_REVIEW';

export interface TelegramSource {
  id: string;
  sourceType: TelegramSourceType;
  telegramChatId: string;
  telegramChatType: string;
  displayName: string;
  authorized: boolean;
  enabled: boolean;
  authorizationBasis?: string;
  retentionPolicy: TelegramRetentionPolicy;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  auditMetadata?: any;
}

export interface TelegramImportRecord {
  id: string;
  sourceId: string;
  sourceDisplayName?: string;
  sourceType?: TelegramSourceType;
  telegramMessageId?: string;
  telegramFileId?: string;
  telegramMediaGroupId?: string;
  originalFilename?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  sha256?: string;
  storagePath?: string;
  retentionPolicy: TelegramRetentionPolicy;
  status: TelegramImportStatus;
  failureReason?: string;
  pageCount: number;
  ocrConfidence?: number;
  ocrStatus: string;
  extractedText?: string;
  ocrExtractedText?: string;
  correctedOcrText?: string;
  sanitizedText?: string;
  detectedQuestion?: string;
  detectedAnswer?: string;
  questionId?: string;
  questionProvenance: 'OFFICIAL_COMMISSION' | 'IKSHOVIA_CREATED' | 'EXTERNAL_UNVERIFIED' | 'UNKNOWN';
  facultyGroundTruthStatus: FacultyGroundTruthStatus;
  detectedFacultyMarks?: number;
  detectedFacultyMaxMarks?: number;
  detectedFacultyFeedback?: string;
  detectedRubric?: Record<string, number>;
  groundTruthValidated: boolean;
  groundTruthValidatedBy?: string;
  groundTruthValidatedAt?: string;
  piiSanitized: boolean;
  piiScanDetails?: any;
  saltedLearnerHash?: string;
  learnerIdentityStatus: LearnerIdentityStatus;
  normalizedAnswerHash?: string;
  isDuplicateCandidate: boolean;
  benchmarkOverlap: boolean;
  trainingCandidateId?: string;
  importedAt: string;
  updatedAt: string;
  metadata?: any;
}

export type TelegramRuntimeStatus =
  | 'READY'
  | 'VERIFIED'
  | 'WEBHOOK_PENDING'
  | 'CONFIGURED_WEBHOOK_PENDING'
  | 'CONFIGURATION_MISSING'
  | 'WEBHOOK_ERROR'
  | 'BLOCKED_CONFIGURATION';

export interface TelegramRuntimeStatusResponse {
  configured: boolean;
  telegramApiReachable: boolean;
  webhookConfigured: boolean;
  runtime: TelegramRuntimeStatus;
  authorizedSources: number;
  environment_loaded_by_running_process: boolean;
  reason?: string;
  webhookUrl?: string;
  pendingUpdateCount?: number;
  lastErrorDate?: string | null;
  lastErrorReason?: string | null;
  lastErrorCode?: number | null;
  maxConnections?: number | null;
  allowedUpdates?: string[] | null;
  webhookReachable?: boolean;
}

export interface TelegramPendingSource {
  id: string;
  telegramChatId: string;
  telegramChatType: string;
  firstSeen: string;
  lastSeen: string;
  eventCount: number;
  status: 'PENDING_AUTHORIZATION' | 'AUTHORIZED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export interface TelegramIngestionStats {
  telegramRuntime: TelegramRuntimeStatus;
  botConfigured: boolean;
  webhookConfigured?: boolean;
  telegramApiReachable?: boolean;
  authorizedSourcesCount: number;
  totalImportedFiles: number;
  successfulExtractions: number;
  ocrRequiredCount: number;
  ocrCompletedCount: number;
  groundTruthValidatedCount: number;
  piiSanitizedCount: number;
  duplicateSourceFilesCount: number;
  duplicateAnswerCandidatesCount: number;
  benchmarkBlockedCount: number;
  trainingCandidatesCreatedCount: number;
  failedImportsCount: number;
}





