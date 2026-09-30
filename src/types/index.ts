export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'TEACHER' | 'STUDENT';
export * from './liveClass.js';

export interface YptGroup {
  id: string;
  name: string;
  description?: string;
  exam: string;
  creatorId: string;
  creatorName: string;
  inviteCode: string;
  dailyGoalMinutes: number;
  isArchived: boolean;
  memberCount: number;
  activeStudyingCount: number;
  userRole?: 'CREATOR' | 'ADMIN' | 'MEMBER';
  createdAt: string;
  updatedAt: string;
}

export interface YptMember {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  role: 'CREATOR' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  isActiveStudying: boolean;
  currentSubject?: string;
  lastActiveAt: string;
  todaySeconds: number;
}

export interface YptStudySession {
  id: string;
  userId: string;
  groupId?: string;
  subject: string;
  durationSeconds: number;
  startedAt: string;
  endedAt?: string;
  sessionDate: string;
  createdAt: string;
}

export interface YptTodaySummary {
  todaySeconds: number;
  todayMinutes: number;
  dailyGoalMinutes: number;
  goalProgressPercent: number;
  sessionsCount: number;
  activeStudying: boolean;
  currentSubject?: string;
  activeGroupsCount: number;
  primaryGroup?: {
    id: string;
    name: string;
    activeMembersCount: number;
    memberCount: number;
  };
}

export type QuestionStatus =
  | 'IMPORTED'
  | 'DRAFT'
  | 'NEEDS_ANSWER'
  | 'NEEDS_REVIEW'
  | 'READY_TO_PUBLISH'
  | 'PUBLISHED'
  | 'ARCHIVED';

export type OCRImportMode =
  | 'QUESTION_PDF_ONLY'
  | 'ANSWER_PDF_ONLY'
  | 'COMBINED_PDF'
  | 'SEPARATE_PDFS';

export type PublishDestination = 'PRACTICE_BANK' | 'MOCK_TEST' | 'BOTH';

export interface AuditLogRecord {
  id: string;
  actorUserId: string;
  actorRole: UserRole;
  action: string;
  targetType: string;
  targetId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  lastActiveAt?: string;
}

export type AnswerKeyStatus =
  | 'ANSWER_PENDING'
  | 'ANSWER_PARSED'
  | 'ANSWER_BOUND'
  | 'ANSWER_VERIFIED'
  | 'ANSWER_CONFLICT'
  | 'ANSWER_INVALID';

export interface OCRJob {
  id: string;
  mode: OCRImportMode;
  questionPdfName?: string;
  answerPdfName?: string;
  totalDetected: number;
  matchedCount: number;
  needsReviewCount: number;
  missingAnswerCount: number;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  answerKeyStatus?: AnswerKeyStatus | string;
  createdAt: string;
  questions: Question[];
}

export interface UserOnboardingData {
  targetExam: string;
  selectedSubjects: string[];
  dailyGoalMinutes: number;
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  goalStatement: string;
  preferredLanguage?: 'en' | 'hi';
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  isOnboarded: boolean;
  onboarding?: UserOnboardingData;
  preferredLanguage?: 'en' | 'hi';
  createdAt: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'REMOVED';
  isSuspended?: boolean;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  iconName: string;
  color: string;
  topicsCount: number;
  conceptsCount: number;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  title?: string;
  description: string;
  order: number;
  conceptsCount: number;
}

export interface Concept {
  id: string;
  topicId: string;
  subjectId: string;
  title: string;
  summary: string;
  explanation: string;
  examples: string[];
  keyPoints: string[];
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
  prerequisiteIds: string[];
  relatedIds: string[];
  tags: string[];
}

export type RelationType = 'prerequisite' | 'related' | 'parent_child' | 'contrast' | 'application';

export interface ConceptRelationship {
  sourceId: string;
  targetId: string;
  relationType: RelationType;
}

export interface ConceptMastery {
  conceptId: string;
  understanding: number; // 0-100
  retention: number;     // 0-100
  application: number;   // 0-100
  accuracy: number;      // 0-100
  confidence: number;    // 0-100
  overallMastery: number;// 0-100
  attemptsCount: number;
  correctCount: number;
  incorrectCount: number;
  lastStudiedAt: string | null;
  lastReviewedAt: string | null;
  nextReviewDate: string | null;
  timeSpentSeconds: number;
  confusionPartners?: string[]; // IDs of concepts often confused with
}

export type MistakeCategory =
  | 'CONCEPT_GAP'
  | 'RECALL_FAILURE'
  | 'CONCEPT_CONFUSION'
  | 'MISINTERPRETATION'
  | 'CARELESS_ERROR'
  | 'TIME_PRESSURE';

export interface LearnerModel {
  userId: string;
  overallScore: number;
  totalStudyTimeMinutes: number;
  currentStreak: number;
  highestStreak: number;
  activeDaysCount: number;
  confidenceBias: 'OVERCONFIDENT' | 'UNDERCONFIDENT' | 'ACCURATE' | 'BALANCED';
  mistakeBreakdown: Record<MistakeCategory, number>;
  subjectMastery: Record<string, number>;
  masteredConceptsCount: number;
  weakConceptsCount: number;
  dueRevisionCount: number;
  lastUpdated: string;
  totalQuestionsAttempted?: number;
  totalAttempts?: number;
  accuracyRate?: number;
  avgTimePerQuestionSeconds?: number;
  mockTestsCompletedCount?: number;
  topicsStudiedCount?: number;
}

export interface NextBestAction {
  id: string;
  actionType: 'REVISE' | 'PRACTICE' | 'LEARN' | 'MOCK' | 'CURRENT_AFFAIRS';
  title: string;
  description: string;
  reason: string;
  estimatedMinutes: number;
  subjectId?: string;
  conceptId?: string;
  topicId?: string;
  followUpAction?: string;
  priority: 'HIGH' | 'MEDIUM' | 'URGENT';
}

export type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER';

export interface QuestionOption {
  id: string;
  text: string;
}

export type FieldConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface FieldConfidence {
  question: FieldConfidenceLevel;
  options: FieldConfidenceLevel;
  answer?: FieldConfidenceLevel;
  correctAnswer?: FieldConfidenceLevel;
  explanation: FieldConfidenceLevel;
}

export type OCRDocumentLanguage = 'EN' | 'HI' | 'BILINGUAL' | 'AUTO';
export type OCRExtractionStrategy = 'TEXT_EXTRACTION' | 'VISION_OCR' | 'HYBRID_PAGE_BY_PAGE';

export type ContentSourceType = 'OFFICIAL_COMMISSION' | 'ADMIN_IMPORTED' | 'IKSHOVIA_CREATED' | 'COACHING_MOCK';

export interface PyqPaper {
  id: string;
  exam: string;
  examName?: string;
  year: number;
  examCycle?: string;
  stage: string;
  paper: string;
  paperName?: string;
  paperTitle: string;
  paperCode?: string;
  sourceType?: ContentSourceType;
  officialSourceUrl: string;
  officialPaperUrl?: string;
  sourceDomain?: string;
  sourceVerificationStatus: string;
  expectedQuestionCount: number;
  actualQuestionCount: number;
  verifiedQuestionCount?: number;
  verificationStatus?: 'OFFICIAL_VERIFIED' | 'INCOMPLETE' | 'SOURCE_UNAVAILABLE';
  answerKeyStatus?: 'OFFICIAL_KEY_VERIFIED' | 'ANSWER_KEY_PENDING';
  language?: string;
  marksPerCorrect?: number;
  negativeMarking?: number;
  durationMinutes?: number;
  completenessStatus: 'COMPLETE' | 'INCOMPLETE' | 'SOURCE_UNAVAILABLE';
  createdAt?: string;
  updatedAt?: string;
}

export interface PyqArchiveData {
  exams: string[];
  papers: PyqPaper[];
  cyclesByExam: Record<string, string[]>;
  yearsByExam: Record<string, number[]>;
  totalPapers: number;
  totalVerifiedQuestions: number;
  totalExpectedQuestions: number;
}

export interface PyqAuditReport {
  paperId: string;
  exam: string;
  examCycle: string;
  year: number;
  paper: string;
  paperName: string;
  sourceDomain: string;
  officialSourceUrl: string;
  officialPaperUrl: string;
  expectedQuestionCount: number;
  actualQuestionCount: number;
  verifiedQuestionCount: number;
  missingCount: number;
  duplicateCount: number;
  missingQuestionNumbers: number[];
  duplicateQuestionNumbers: number[];
  verificationStatus: 'OFFICIAL_VERIFIED' | 'INCOMPLETE' | 'SOURCE_UNAVAILABLE';
  answerKeyStatus: string;
  dataAccuracyRate: number;
}

export interface PyqCompletenessValidation {
  paperId: string;
  paperTitle: string;
  exam: string;
  year: number;
  stage: string;
  paper: string;
  expectedQuestionCount: number;
  actualQuestionCount: number;
  missingQuestionNumbers: number[];
  duplicateQuestionNumbers: number[];
  isComplete: boolean;
  status: 'COMPLETE' | 'INCOMPLETE' | 'SOURCE_UNAVAILABLE';
}

export type QuestionFormatType = 
  | 'SINGLE_CHOICE' 
  | 'MULTIPLE_CHOICE' 
  | 'STATEMENT_BASED' 
  | 'MATCH_FOLLOWING' 
  | 'ASSERTION_REASON' 
  | 'COMPREHENSION'
  | 'PASSAGE_BASED'
  | 'NUMERICAL_CSAT'
  | 'MULTI_PART'
  | 'MCQ'
  | 'OTHER';

export interface QuestionStatementItem {
  id: string | number;
  text: string;
  text_hi?: string;
}
export type StatementItem = QuestionStatementItem;

export interface MatchColumnItem {
  key: string;
  text: string;
  text_hi?: string;
}

export interface MatchCodeItem {
  label: string;
  mapping: string;
  mapping_hi?: string;
}

export interface QuestionMatchData {
  leftColumn: MatchColumnItem[];
  rightColumn: MatchColumnItem[];
  codes: MatchCodeItem[];
  leftHeader?: string;
  rightHeader?: string;
  leftHeader_hi?: string;
  rightHeader_hi?: string;
}
export type MatchColumnData = QuestionMatchData;

export interface Question {
  id: string;
  subjectId: string;
  topicId: string;
  conceptId: string;
  type: QuestionType;
  questionType?: QuestionFormatType;
  format?: QuestionFormatType;
  passageText?: string;
  question: string;
  statements?: QuestionStatementItem[];
  statements_hi?: QuestionStatementItem[];
  matchData?: QuestionMatchData;
  matchData_hi?: QuestionMatchData;
  options?: (QuestionOption | string)[];
  correctAnswer: string; // Option ID or exact text
  explanation: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'BEGINNER' | 'ADVANCED';
  examTag?: string;
  pyqYear?: number;
  exam?: string;
  paper?: string;
  questionNumber?: number;
  isPyq?: boolean;
  sourceType?: ContentSourceType;
  isAiGenerated?: boolean;
  source?: string;
  sourceUrl?: string;
  verifiedStatus?: 'VERIFIED_PYQ' | 'UNVERIFIED' | 'NEEDS_REVIEW';
  isPublished: boolean;
  status?: QuestionStatus;
  destination?: PublishDestination;
  ocrConfidence?: number;
  ocrMatchReason?: string;
  sourceJobId?: string;
  currentAffairId?: string;
  sourceProvenance?: {
    sourceId?: string;
    resourceId?: string;
    sourceName?: string;
    sourceType?: string;
    adapter?: string;
    contentHash?: string;
  };

  // OCR V3 Accuracy & Sequence
  subject?: string;
  topic?: string;
  tags?: string[];
  gsPaper?: string;
  prelimsArea?: string;
  questionNum?: number;
  pageNumber?: number;
  hasVisualContent?: boolean;
  fieldConfidence?: FieldConfidence;
  validationErrors?: string[];
  answerKeyStatus?: AnswerKeyStatus;
  solutionSource?: string;
  solutionPageNumber?: number;
  solutionQuestionNumber?: number;

  // Bilingual Support
  question_en?: string;
  question_hi?: string;
  options_en?: (QuestionOption | string)[];
  options_hi?: (QuestionOption | string)[];
  explanation_en?: string;
  explanation_hi?: string;
  availableLanguages?: ('en' | 'hi')[];
  isAITranslated?: boolean;

  // Visual content, figures & corrections
  imageUrl?: string;
  image_url?: string;
  imageCaption?: string;
  image_caption?: string;
  figureStatus?: 'FIGURE_VERIFIED' | 'FIGURE_REVIEW_REQUIRED' | 'FIGURE_MISSING' | 'FIGURE_NOT_REQUIRED';
  originalOcrText?: string;
  originalOptions?: (QuestionOption | string)[];
  correctionsCount?: number;
  corrections_count?: number;
  lastCorrectedAt?: string;
  lastCorrectedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuestionAttempt {
  id: string;
  userId: string;
  questionId: string;
  conceptId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  confidenceRating: number; // 1 to 5
  mistakeCategory?: MistakeCategory;
  timestamp: string;
}

export interface RevisionItem {
  conceptId: string;
  conceptTitle: string;
  subjectName: string;
  retention: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  daysSinceLastReview: number;
  estimatedMinutes: number;
  mistakeReason?: string;
}

export interface MockTest {
  id: string;
  title: string;
  displayName?: string;
  originalSourceName?: string;
  type: 'QUICK' | 'SUBJECT' | 'FULL';
  subjectIds: string[];
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  negativeMarkingRate: number;
  instructions?: string | string[];
  isPublished: boolean;
  sourceType?: ContentSourceType;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  attemptCount?: number;
  actualQuestionCount?: number;
  createdAt?: string;
  isLocked?: boolean;
  isFree?: boolean;
  isFreePreview?: boolean;
  testSeriesId?: string;
  testSeriesName?: string;
  message?: string;
  salePrice?: number;
}

export interface MockAttempt {
  id: string;
  userId: string;
  mockTestId: string;
  mockTitle: string;
  score: number;
  maxScore: number;
  accuracy: number;
  timeTakenSeconds: number;
  completedAt: string;
  subjectScores: Record<string, { total: number; correct: number; score: number }>;
  weakConceptIds: string[];
  mistakeSummary: Record<string, number>;
  status?: string;
  startedAt?: string;
}

export type ArticleType = 'EDITORIAL' | 'OPINION' | 'EXPLAINER' | 'UPSC_GUIDE' | 'CURRENT_AFFAIR' | 'STANDARD';

export interface PyqLinkage {
  id?: string;
  exam: string; // e.g. 'UPSC CSE', 'BPSC 70th CCE'
  year: number;
  paper: string; // e.g. 'GS Paper II', 'GS Paper III', 'Prelims Paper I'
  questionNumber?: number;
  questionText?: string;
  topic: string;
  relevanceScore?: number;
}

export interface MainsModelQuestion {
  question: string;
  marks?: number;
  wordCount?: number;
  gsPaper?: string;
  approachOutline?: string[];
  keyKeywords?: string[];
  modelStructure?: {
    introduction?: string;
    body?: string;
    conclusion?: string;
  };
  modelAnswerSummary?: string;
}

export interface EditorialAnalysis {
  coreArgument?: string;
  argumentsFor?: string[];
  argumentsAgainst?: string[];
  constitutionalDimensions?: string[];
  policyImplications?: string[];
  counterarguments?: string[];
  theHinduPerspective?: string;
  indianExpressPerspective?: string;
  prelimsTakeaways?: string[];
  mainsModelQuestions?: MainsModelQuestion[];
  pyqLinkages?: PyqLinkage[];
  expertQuotes?: string[];
  internationalComparisons?: string[];
}

export interface TopicCluster {
  id: string;
  title: string;
  category: string;
  summary: string;
  articlesCount: number;
  editorialsCount: number;
  lastUpdated: string;
  keyDebatePoints: string[];
  primarySources: string[];
  articles: CurrentAffairArticle[];
}

export interface IngestionRunRecord {
  id: string;
  sourceIdentifier: string;
  displayName?: string;
  jobType: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
  startedAt: string;
  completedAt?: string;
  resourcesDiscovered: number;
  resourcesFetched: number;
  resourcesSkipped: number;
  documentsCreated: number;
  documentsUpdated: number;
  duplicatesCount: number;
  currentAffairsPublished: number;
  editorialsPublished: number;
  errors?: string[];
  durationMs: number;
  freshnessStatus?: string;
  latestArticleDate?: string;
  latestArticleTitle?: string;
}

export interface SourceFreshnessRecord {
  sourceIdentifier: string;
  displayName: string;
  sourceType: string;
  isActive: boolean;
  scheduleDescription?: string;
  lastAttemptedRun?: string;
  lastSuccessfulRun?: string;
  latestDiscoveredArticle?: string;
  latestPublishedArticle?: string;
  latestArticleDate?: string;
  failureCount: number;
  freshnessStatus: 'HEALTHY' | 'SYNC_SUCCESSFUL' | 'PENDING' | 'WARNING' | 'FAILED';
  lastError?: string;
  updatedAt?: string;
}

export interface CurrentAffairArticle {
  id: string;
  title: string;
  date: string;
  category: string; // 'Polity & Governance', 'Economy', 'International Relations', 'Environment', 'Science & Tech', 'Internal Security', 'Social Issues', 'Reports & Indices', 'Government Schemes', 'Bihar Current Affairs'
  subtopic?: string;
  summary: string;
  whyInNews?: string;
  whatHappened?: string;
  background?: string;
  keyConcepts?: string[];
  keyFacts?: string[];
  whyItMatters?: string;
  implications?: string;
  issuesAndChallenges?: string[];
  wayForward?: string[];
  gsPaper?: string;
  examRelevance?: 'UPSC' | 'BPSC' | 'BOTH' | string | string[];
  prelimsRelevance?: string;
  mainsRelevance?: string;
  biharRelevance?: string;
  prelimsPointers?: string[];
  mainsDimensions?: Record<string, string>;
  importantFacts?: string[];
  relatedSubject?: string;
  relatedConceptIds?: string[];
  keywords?: string[];
  content?: string;
  isBookmarked?: boolean;
  tags?: string[];
  mainsQuestions?: string[];
  isTopStory?: boolean;
  isEditorial?: boolean;
  isBiharSpecial?: boolean;
  importance?: 'HIGH' | 'MEDIUM' | 'LOW';
  subjectId?: string;
  conceptId?: string;
  createdAt?: string;
  updatedAt?: string;
  source: string; // E.g. 'Press Information Bureau (PIB)', 'The Hindu', 'Supreme Court of India', 'Reserve Bank of India (RBI)'
  sourceUrl?: string;
  sourceDomain?: string;
  sourceType?: 'PRIMARY_GOVT' | 'SECONDARY_NEWS' | 'OFFICIAL_PORTAL' | 'SUPPLEMENTARY_REFERENCE' | 'EDUCATIONAL_ANALYSIS' | string;
  primarySource?: string;
  documentType?: string;
  secondarySource?: string;
  editorialSource?: string;
  articleType?: ArticleType;
  rawContent?: string;
  editorialAnalysis?: EditorialAnalysis;
  topicClusterId?: string;
  topicClusterTitle?: string;
  relatedEditorialIds?: string[];
  relatedCurrentAffairIds?: string[];
  relatedPyqIds?: string[];
  sourceProvenance?: Record<string, any>;
  verificationStatus?: 'VERIFIED' | 'UNVERIFIED' | 'FAILED' | string;
  qualityStatus?: 'PASSED' | 'FLAGGED' | 'REJECTED' | string;
  rejectionReason?: string;
  upscRelevant?: boolean;
  bpscRelevant?: boolean;
  relevanceScore?: number;
  relevanceReason?: string;
  canonicalUrl?: string;
  contentHash?: string;
  status?: 'INGESTED' | 'PROCESSING' | 'REVIEW_REQUIRED' | 'PUBLISHED' | 'REJECTED';
  publishedAt?: string;
  retrievedAt?: string;
  discoveredAt?: string;
  isPublished?: boolean;
  questions?: Question[];
}

export type ResourceType = 'BOOK' | 'OFFICIAL_DOCUMENT' | 'NOTES' | 'SYLLABUS' | 'PREVIOUS_YEAR_PAPER' | 'NOTE' | 'PDF' | 'ARTICLE' | 'VIDEO' | 'PYQ' | 'OFFICIAL' | 'CURRENT_AFFAIRS';
export type ResourceStatus = 'DRAFT' | 'UPLOADING' | 'PROCESSING' | 'READY' | 'PUBLISHED' | 'ARCHIVED' | 'ERROR';
export type ResourceVisibility = 'PUBLIC' | 'ALL_LEARNERS' | 'UPSC' | 'BPSC' | 'COURSE' | 'BATCH' | 'ENROLLED' | 'ADMIN_ONLY';

export interface LearningResource {
  id: string;
  title: string;
  author?: string;
  description?: string;
  resource_type?: ResourceType;
  type: ResourceType;
  category?: string;
  format?: string;
  subject?: string;
  subjectId: string;
  topic?: string;
  edition?: string;
  publication_year?: number;
  publisher?: string;
  language?: string;
  isbn?: string;
  license_status?: string;
  cover_image_url?: string;
  source_attribution?: string;
  storage_provider?: string;
  tags?: string[];
  tags_str?: string;
  conceptId?: string;
  exam?: string;
  examTag?: string;
  drive_file_id?: string;
  drive_folder_id?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  page_count?: number;
  status?: ResourceStatus;
  is_published?: boolean;
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
  course_id?: string;
  source_type?: string;
  visibility?: ResourceVisibility;
  uploaded_by?: string;
  url: string;
  summary: string;
  readTimeMinutes: number;
  isBookmarked?: boolean;
  is_bookmarked?: boolean;
  last_page?: number;
  lastPage?: number;
  progress_percentage?: number;
  progressPercentage?: number;
  created_at?: string;
  updated_at?: string;
}

export interface StudyGoal {
  id: string;
  userId: string;
  title: string;
  targetExam: string;
  targetDate: string;
  dailyStudyMinutes: number;
  subjects: string[];
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  progressPercentage: number;
}

export interface AiContextData {
  exam?: string;
  stage?: string;
  contextSummary?: string;
  subjectName?: string;
  topicName?: string;
  conceptId?: string;
  conceptTitle?: string;
  conceptSummary?: string;
  questionText?: string;
  options?: any[];
  userAnswer?: string;
  correctAnswer?: string;
  explanation?: string;
  mistakeType?: string;
  pageContext?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  quickActions?: string[];
  relatedConceptIds?: string[];
  context?: AiContextData;
}

export interface ChatConversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
  messages: ChatMessage[];
}

export type AIDraftType = 'MCQ' | 'CONCEPT' | 'SUMMARY' | 'EXPLANATION' | 'REVISION_NOTES' | 'MAINS_QUESTION' | 'FLASHCARD' | 'PRACTICE_SET';

export interface AIContentDraft {
  id: string;
  type: AIDraftType;
  prompt: string;
  subjectId: string;
  topicId?: string;
  conceptId?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  examTag?: string;
  sourceContext?: string;
  generatedData: any;
  createdBy?: string;
  aiModel?: string;
  status: 'DRAFT' | 'APPROVED' | 'REJECTED' | 'NEEDS_VERIFICATION';
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  timestamp?: string;
  createdAt?: string;
  isRead: boolean;
  actionUrl?: string;
  deepLink?: string;
  priority?: string;
  metadata?: Record<string, any>;
}

export type PlatformFeatureCode =
  | 'PYQ_PRACTICE'
  | 'MOCK_TESTS'
  | 'TOPIC_SUBJECT_PRACTICE'
  | 'CURRENT_AFFAIRS'
  | 'NOTES'
  | 'AI_TUTOR'
  | 'STUDY_PLAN'
  | 'ANALYTICS'
  | 'BOOKMARKS'
  | 'RESOURCE_LIBRARY';

export type CourseType = 'TEST_SERIES' | 'FULL_PROGRAM' | 'CURRENT_AFFAIRS' | 'CRASH_COURSE' | 'FOUNDATION' | 'SUBJECT_MODULE' | 'FULL_COURSE';

export interface Course {
  id: string;
  name: string;
  description?: string;
  exam: string;
  courseType: CourseType;
  isActive: boolean;
  displayOrder: number;
  startDate?: string;
  endDate?: string;
  defaultDurationDays: number;
  features: PlatformFeatureCode[];
  pricing?: CoursePrice;
  currentPrice?: CoursePrice;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CoursePrice {
  id: string;
  courseId: string;
  currency: string;
  basePrice: number;
  salePrice?: number | null;
  isActive: boolean;
  validFrom: string;
  validUntil?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type EntitlementStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'PENDING';
export type EntitlementSource = 'ADMIN_GRANT' | 'PAYMENT' | 'PROMOTION' | 'COMP';

export interface Entitlement {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  courseId?: string | null;
  courseName?: string;
  courseExam?: string;
  productType?: 'COURSE' | 'TEST_SERIES';
  productId?: string | null;
  testSeriesId?: string | null;
  testSeriesName?: string;
  features?: PlatformFeatureCode[];
  status: EntitlementStatus;
  source: EntitlementSource;
  startsAt: string;
  expiresAt?: string | null;
  daysRemaining?: number;
  grantedBy?: string | null;
  grantedByName?: string | null;
  paymentId?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FLAT';

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount?: number | null;
  minOrderValue: number;
  courseId?: string | null;
  courseName?: string | null;
  startDate: string;
  expiryDate?: string | null;
  usageLimit?: number | null;
  perUserLimit: number;
  timesUsed: number;
  usageCount?: number;
  totalDiscountGiven?: number;
  isActive: boolean;
  createdBy?: string | null;
  createdByName?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  originalPrice: number;
  finalAmount: number;
  message?: string;
  error?: string;
}

export interface CommercialDashboardMetrics {
  totalCourses: number;
  activeCourses: number;
  activePaidUsers: number;
  activeEntitlements: number;
  expiringSoon7Days: number;
  expiringSoon30Days: number;
  expiringNext7Days?: number;
  expiringNext30Days?: number;
  totalVerifiedRevenue: number;
  totalRevenue?: number;
  totalOrders?: number;
  averageOrderValue?: number;
  totalDiscountGiven?: number;
  activeCouponsCount?: number;
  thisMonthRevenue: number;
  last30DaysRevenue: number;
  refundsAmount: number;
  failedPaymentsCount: number;
  pendingPaymentsCount: number;
}

export interface RevenueAnalyticsMetrics {
  grossVerifiedRevenue: number;
  refundedAmount: number;
  netRevenue: number;
  paidOrdersCount: number;
  successfulEnrollments: number;
  averageOrderValue: number;
  dailyBreakdown?: { date: string; revenue: number; orders?: number }[];
}

export interface CourseSalesAnalytics {
  courseId: string;
  courseName: string;
  exam: string;
  courseType?: string;
  paidOrders: number;
  unitsSold?: number;
  grossRevenue: number;
  refunds: number;
  netRevenue: number;
  totalDiscount?: number;
  activeStudents: number;
  activeEntitlementsCount?: number;
}

export interface ManagedUser extends UserProfile {
  targetExam?: string;
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'REMOVED';
  status?: 'ACTIVE' | 'SUSPENDED' | 'REMOVED';
  is_suspended?: boolean;
  isSuspended?: boolean;
  courses: {
    courseId: string;
    courseName: string;
    status: EntitlementStatus;
    expiresAt?: string | null;
  }[];
  activeAccessCount: number;
  latestExpiry?: string | null;
  paymentStatus: 'PAID' | 'COMPLIMENTARY' | 'NONE';
  entitlementsCount: number;
  activeEntitlementsCount?: number;
  enrolledCourseNames?: string[];
}

export const ADMIN_PERMISSIONS = {
  // USER MANAGEMENT
  USERS_VIEW: 'USERS_VIEW',
  USERS_EDIT: 'USERS_EDIT',
  USERS_SUSPEND: 'USERS_SUSPEND',
  USERS_REMOVE: 'USERS_REMOVE',
  USERS_RESTORE: 'USERS_RESTORE',
  USERS_GRANT_ACCESS: 'USERS_GRANT_ACCESS',
  USERS_REVOKE_ACCESS: 'USERS_REVOKE_ACCESS',
  USERS_ROLE_MANAGE: 'USERS_ROLE_MANAGE',

  // COURSES
  COURSES_VIEW: 'COURSES_VIEW',
  COURSES_CREATE: 'COURSES_CREATE',
  COURSES_EDIT: 'COURSES_EDIT',
  COURSES_ARCHIVE: 'COURSES_ARCHIVE',

  // PRICING
  PRICING_VIEW: 'PRICING_VIEW',
  PRICING_EDIT: 'PRICING_EDIT',

  // ACCESS & ENTITLEMENTS
  ENTITLEMENTS_VIEW: 'ENTITLEMENTS_VIEW',
  ENTITLEMENTS_GRANT: 'ENTITLEMENTS_GRANT',
  ENTITLEMENTS_EXTEND: 'ENTITLEMENTS_EXTEND',
  ENTITLEMENTS_REVOKE: 'ENTITLEMENTS_REVOKE',

  // COUPONS & DISCOUNTS
  COUPONS_VIEW: 'COUPONS_VIEW',
  COUPONS_CREATE: 'COUPONS_CREATE',
  COUPONS_EDIT: 'COUPONS_EDIT',
  COUPONS_DELETE: 'COUPONS_DELETE',

  // COMMERCIAL & PAYMENTS
  COMMERCIAL_VIEW: 'COMMERCIAL_VIEW',
  PAYMENTS_VIEW: 'PAYMENTS_VIEW',
  PAYMENTS_REFUND: 'PAYMENTS_REFUND',
  REVENUE_VIEW: 'REVENUE_VIEW',

  // CONTENT
  QUESTION_BANK_VIEW: 'QUESTION_BANK_VIEW',
  QUESTION_BANK_EDIT: 'QUESTION_BANK_EDIT',
  QUESTION_CREATE: 'QUESTION_CREATE',
  QUESTION_EDIT: 'QUESTION_EDIT',
  QUESTION_PUBLISH: 'QUESTION_PUBLISH',
  MOCKS_VIEW: 'MOCKS_VIEW',
  MOCKS_CREATE: 'MOCKS_CREATE',
  MOCKS_EDIT: 'MOCKS_EDIT',
  MOCKS_DELETE: 'MOCKS_DELETE',
  CONTENT_IMPORT: 'CONTENT_IMPORT',
  OCR_IMPORT: 'OCR_IMPORT',
  OCR_REVIEW: 'OCR_REVIEW',
  CONCEPT_CREATE: 'CONCEPT_CREATE',
  CURRENT_AFFAIRS_MANAGE: 'CURRENT_AFFAIRS_MANAGE',

  // ANALYTICS
  ANALYTICS_VIEW: 'ANALYTICS_VIEW',

  // AUDIT & SYSTEM
  AUDIT_LOG_VIEW: 'AUDIT_LOG_VIEW',
  SYSTEM_SETTINGS: 'SYSTEM_SETTINGS',
  ADMIN_MANAGE: 'ADMIN_MANAGE',
  ALL_PERMISSIONS: 'ALL_PERMISSIONS',
} as const;

export type AdminPermissionCode = keyof typeof ADMIN_PERMISSIONS;

export const TEACHER_PERMISSIONS = {
  TEACHER_VIEW_DASHBOARD: 'TEACHER_VIEW_DASHBOARD',
  TEACHER_VIEW_STUDENTS: 'TEACHER_VIEW_STUDENTS',
  TEACHER_VIEW_ASSIGNED_STUDENTS: 'TEACHER_VIEW_ASSIGNED_STUDENTS',
  TEACHER_CREATE_CLASS: 'TEACHER_CREATE_CLASS',
  TEACHER_EDIT_CLASS: 'TEACHER_EDIT_CLASS',
  TEACHER_VIEW_CLASS: 'TEACHER_VIEW_CLASS',
  TEACHER_MANAGE_CLASS_MEMBERS: 'TEACHER_MANAGE_CLASS_MEMBERS',
  TEACHER_CREATE_ASSIGNMENT: 'TEACHER_CREATE_ASSIGNMENT',
  TEACHER_EDIT_ASSIGNMENT: 'TEACHER_EDIT_ASSIGNMENT',
  TEACHER_PUBLISH_ASSIGNMENT: 'TEACHER_PUBLISH_ASSIGNMENT',
  TEACHER_VIEW_SUBMISSIONS: 'TEACHER_VIEW_SUBMISSIONS',
  TEACHER_EVALUATE_ANSWERS: 'TEACHER_EVALUATE_ANSWERS',
  TEACHER_GIVE_FEEDBACK: 'TEACHER_GIVE_FEEDBACK',
  TEACHER_ASSIGN_MARKS: 'TEACHER_ASSIGN_MARKS',
  TEACHER_CREATE_QUIZ: 'TEACHER_CREATE_QUIZ',
  TEACHER_ASSIGN_QUIZ: 'TEACHER_ASSIGN_QUIZ',
  TEACHER_VIEW_QUIZ_RESULTS: 'TEACHER_VIEW_QUIZ_RESULTS',
  TEACHER_CREATE_NOTES: 'TEACHER_CREATE_NOTES',
  TEACHER_UPLOAD_RESOURCES: 'TEACHER_UPLOAD_RESOURCES',
  TEACHER_SHARE_RESOURCES: 'TEACHER_SHARE_RESOURCES',
  TEACHER_CREATE_LIVE_CLASS: 'TEACHER_CREATE_LIVE_CLASS',
  TEACHER_MANAGE_LIVE_CLASS: 'TEACHER_MANAGE_LIVE_CLASS',
  TEACHER_VIEW_LIVE_ATTENDANCE: 'TEACHER_VIEW_LIVE_ATTENDANCE',
  TEACHER_VIEW_STUDENT_ANALYTICS: 'TEACHER_VIEW_STUDENT_ANALYTICS',
  TEACHER_SEND_ANNOUNCEMENT: 'TEACHER_SEND_ANNOUNCEMENT',
  TEACHER_VIEW_OWN_PROFILE: 'TEACHER_VIEW_OWN_PROFILE',
} as const;

export type TeacherPermissionCode = keyof typeof TEACHER_PERMISSIONS;

// Teacher Workspace Interfaces
export interface TeacherClass {
  id: string;
  name: string;
  description?: string;
  exam: string;
  subject: string;
  topic?: string;
  teacherId: string;
  teacherName?: string;
  schedule?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  enrolledCount?: number;
  students?: TeacherClassStudent[];
  createdAt: string;
  updatedAt: string;
}

export interface TeacherClassStudent {
  id: string;
  classId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  targetExam?: string;
  course?: string;
  status: 'ENROLLED' | 'DROPPED';
  joinedAt: string;
  lastActivity?: string;
  attendanceRate?: number;
  submissionsCount?: number;
  avgScore?: number;
}

export interface TeacherAssignment {
  id: string;
  teacherId: string;
  classId?: string;
  className?: string;
  title: string;
  description?: string;
  subject?: string;
  topic?: string;
  instructions?: string;
  dueDate?: string;
  totalMarks: number;
  durationMinutes?: number;
  questions: any[];
  status: 'DRAFT' | 'PUBLISHED' | 'OPEN' | 'CLOSED' | 'ARCHIVED';
  submissionsCount?: number;
  evaluatedCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherSubmission {
  id: string;
  assignmentId: string;
  assignmentTitle?: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  classId?: string;
  answers: any[];
  submittedAt: string;
  status: 'SUBMITTED' | 'LATE' | 'EVALUATED';
  marksObtained?: number;
  totalMarks?: number;
  feedback?: string;
  strengths?: string;
  weaknesses?: string;
  suggestions?: string;
  evaluatedBy?: string;
  evaluatorName?: string;
  evaluatedAt?: string;
  evaluationHistory?: any[];
}

export interface TeacherQuiz {
  id: string;
  teacherId: string;
  teacherName?: string;
  classId?: string;
  className?: string;
  title: string;
  description?: string;
  subject?: string;
  questionIds: string[];
  origin: 'TEACHER_CREATED' | 'OFFICIAL_COMMISSION' | 'IKSHOVIA_CREATED';
  scheduledAt?: string;
  durationMinutes: number;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

export interface TeacherAnnouncement {
  id: string;
  teacherId: string;
  teacherName?: string;
  classId?: string;
  className?: string;
  title: string;
  message: string;
  targetStudentIds?: string[];
  publishedAt: string;
  createdAt: string;
}

export interface TeacherDashboardStats {
  totalAssignedStudents: number;
  activeStudents: number;
  pendingEvaluations: number;
  assignmentsDue: number;
  classesToday: number;
  avgStudentPerformance: number;
  todayClasses?: TeacherClass[];
  upcomingClasses?: TeacherClass[];
  pendingEvaluationsList?: TeacherSubmission[];
  recentAssignments?: TeacherAssignment[];
  recentSubmissions?: TeacherSubmission[];
  recentAnnouncements?: TeacherAnnouncement[];
}

// ==========================================
// SHORT NOTES ARCHITECTURE & STRUCTURED TYPES
// ==========================================

export type ShortNoteBlockType =
  | 'heading'
  | 'subheading'
  | 'paragraph'
  | 'bullet_list'
  | 'numbered_list'
  | 'table'
  | 'fact_box'
  | 'comparison_block'
  | 'timeline'
  | 'important_points';

export interface ShortNoteTableData {
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface ShortNoteFactBoxData {
  title: string;
  facts: string[];
  category?: string;
}

export interface ShortNoteComparisonData {
  headers: string[];
  rows: { aspect: string; left: string; right: string }[];
}

export interface ShortNoteTimelineEvent {
  timeOrYear: string;
  title: string;
  description: string;
}

export interface ShortNoteTimelineData {
  events: ShortNoteTimelineEvent[];
}

export interface ShortNoteImportantPointsData {
  points: string[];
  calloutType?: 'key' | 'warning' | 'tip';
}

export interface ShortNoteBlock {
  id: string;
  type: ShortNoteBlockType;
  resource_id: string;
  document_id?: string;
  page_number: number;
  order_index: number;
  text?: string;
  level?: 1 | 2 | 3;
  items?: string[];
  table?: ShortNoteTableData;
  factBox?: ShortNoteFactBoxData;
  comparison?: ShortNoteComparisonData;
  timeline?: ShortNoteTimelineData;
  importantPoints?: ShortNoteImportantPointsData;
}

export interface ShortNote {
  id: string;
  resourceId: string;
  documentId?: string;
  title: string;
  exam: string;
  subject: string;
  topic: string;
  tags: string[];
  description?: string;
  year?: number | null;
  language: 'en' | 'hi' | 'bilingual';
  visibility: ResourceVisibility;
  status: 'DRAFT' | 'PROCESSING' | 'REVIEW_REQUIRED' | 'PUBLISHED' | 'ARCHIVED';
  pageCount: number;
  blocks: ShortNoteBlock[];
  rawOcrText?: string;
  sourceFileUrl?: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  isReviewed?: boolean;
  isBookmarked?: boolean;
  progressPercentage?: number;
  lastPage?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShortNotesTopicNode {
  topic: string;
  notesCount: number;
  reviewedCount: number;
  notes: ShortNote[];
}

export interface ShortNotesSubjectNode {
  subject: string;
  topicsCount: number;
  notesCount: number;
  reviewedCount: number;
  topics: ShortNotesTopicNode[];
}

export interface ShortNotesHierarchyResponse {
  subjects: ShortNotesSubjectNode[];
  totalNotes: number;
  totalReviewed: number;
}

// ----------------------------------------------------
// EXAM-WISE TEST SERIES TYPES
// ----------------------------------------------------
export type TestSeriesStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type TestSeriesVisibility = 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
export type TestSeriesCategory = 'PRELIMS' | 'MAINS' | 'SECTIONAL' | 'INTEGRATED' | 'ALL';

export interface TestSeries {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  examId?: string | null;
  examCycle?: string | null;
  targetExam: string;
  category: string;
  language: string;
  totalTests: number;
  publishedTestCount: number;
  totalQuestions: number;
  mrp: number;
  salePrice: number;
  currency: string;
  isFree: boolean;
  previewTestCount: number;
  coverImage?: string | null;
  status: TestSeriesStatus;
  visibility: TestSeriesVisibility;
  displayOrder: number;
  durationDays: number;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  isEnrolled?: boolean;
}

export interface TestSeriesTest {
  id: string;
  testSeriesId: string;
  mockTestId: string;
  sequenceNumber: number;
  isFreePreview: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  // Hydrated mock test fields
  mockTest?: {
    id: string;
    title: string;
    displayName?: string;
    type: string;
    durationMinutes: number;
    totalQuestions: number;
    totalMarks: number;
    negativeMarkingRate: number;
    isPublished: boolean;
    sourceType?: string;
  };
  attemptSummary?: {
    attemptId: string;
    score: number;
    maxScore: number;
    accuracy: number;
    status: string;
    completedAt?: string;
  } | null;
}

export interface TestSeriesWithTests extends TestSeries {
  tests: TestSeriesTest[];
}

// ----------------------------------------------------
// MOBILE APP RELEASE & UPDATE DISTRIBUTION TYPES
// ----------------------------------------------------
export type AppReleaseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type AppUpdateType = 'MANDATORY' | 'OPTIONAL' | 'NONE';

export interface AppRelease {
  id: string;
  platform: 'android' | 'ios' | string;
  version_name: string;
  version_code: number;
  min_supported_version_code: number;
  apk_url: string;
  sha256_checksum: string;
  file_size_bytes: number;
  release_notes?: string | null;
  is_mandatory: boolean;
  status: AppReleaseStatus;
  created_at: string;
}

export interface AppVersionResponse {
  status: 'CURRENT' | 'UPDATE_AVAILABLE' | 'MANDATORY_UPDATE' | 'NO_RELEASE_AVAILABLE' | string;
  updateAvailable: boolean;
  updateRequired: boolean;
  updateType: AppUpdateType;
  latestVersion: string;
  latestBuildNumber: number;
  minimumSupportedVersion: string;
  minimumSupportedBuildNumber: number;
  updateUrl: string;
  apkUrl: string;
  downloadUrl: string;
  releaseNotes: string[];
  releaseNotesRaw: string;
  publishedAt: string;
  fileSizeBytes: number;
  sha256Checksum: string;
  platform: string;
  packageId: string;
  release?: AppRelease | null;
}

// ----------------------------------------------------
// UNIFIED PRELIMS + MAINS + INTERVIEW ENGINE TYPES
// ----------------------------------------------------
export type ExamStage = 'PRELIMS' | 'MAINS' | 'INTERVIEW';

export type QuestionOrigin =
  | 'OFFICIAL_COMMISSION'
  | 'ADMIN_IMPORTED'
  | 'IKSHOVIA_CREATED'
  | 'TEACHER_CREATED'
  | 'AI_GENERATED';

export interface ExamPaper {
  id: string;
  examId: string;
  name: string;
  code: string;
  totalMarks: number;
  stage: ExamStage;
  description?: string;
  orderNum?: number;
}

export interface MainsRubricDimension {
  name: string;
  maxMarks: number;
  description: string;
}

export interface MainsQuestionItem {
  id: string;
  subjectId: string;
  topicId: string;
  conceptId: string;
  type: string;
  stage: ExamStage;
  exam: string;
  paper: string;
  pyqYear?: number;
  questionNumber?: number;
  marks: number;
  wordLimit?: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  origin: QuestionOrigin;
  source?: string;
  isPyq?: boolean;
  verifiedStatus?: string;
  question: string;
  explanation?: string;
  rubric?: {
    dimensions?: string[];
  };
  modelStructure?: {
    intro?: string;
    body?: string;
    conclusion?: string;
  };
  modelAnswer?: string;
}

export type MainsSubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'EVALUATED' | 'ARCHIVED';
export type MainsSubmissionType = 'TYPED' | 'HANDWRITTEN_IMAGE' | 'HANDWRITTEN_PDF' | 'HYBRID';
export type MainsEvaluatorType = 'NONE' | 'AI' | 'TEACHER' | 'SELF' | 'PEER';

export interface MainsEvaluationBreakdown {
  marksObtained: number;
  maxMarks: number;
  dimensions?: {
    content?: number;
    structure?: number;
    analysis?: number;
    relevance?: number;
    factualAccuracy?: number;
    examplesData?: number;
    multidimensionality?: number;
    presentation?: number;
    conclusion?: number;
  };
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  missingDimensions: string[];
  actionableImprovement: string;
  evaluatorType: MainsEvaluatorType;
  evaluatedAt: string;
}

export interface MainsSubmissionItem {
  id: string;
  userId: string;
  questionId: string;
  paperId?: string;
  paper?: string;
  subjectId?: string;
  topicId?: string;
  conceptId?: string;
  attemptNumber: number;
  status: MainsSubmissionStatus;
  submissionType: MainsSubmissionType;
  answerText?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  wordCount: number;
  timeSpentSeconds: number;
  ocrExtractedText?: string;
  marksObtained?: number;
  maxMarks: number;
  percentage?: number;
  feedback?: string;
  strengths?: string;
  weaknesses?: string;
  missingDimensions?: string[];
  actionableImprovement?: string;
  evaluation?: MainsEvaluationBreakdown;
  evaluatorType?: MainsEvaluatorType;
  evaluatedBy?: string;
  evaluatedAt?: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  question?: MainsQuestionItem;
}

export interface InterviewProfile {
  userId: string;
  targetExam: string;
  graduationDegree?: string;
  graduationSubject?: string;
  optionalSubject?: string;
  hometown?: string;
  homeState?: string;
  workExperience?: string;
  hobbiesInterests?: string;
  achievements?: string;
  cadrePreferences?: string[];
  servicePreferences?: string[];
  dafSummary?: string;
  updatedAt?: string;
}

export type InterviewCategory =
  | 'DAF_PROFILE'
  | 'EDUCATION'
  | 'HOMETOWN'
  | 'STATE'
  | 'CURRENT_AFFAIRS'
  | 'GOVERNANCE'
  | 'ECONOMY'
  | 'SOCIETY'
  | 'ETHICS'
  | 'SITUATIONAL'
  | 'OPINION_ANALYSIS';

export interface InterviewQuestionItem {
  id: string;
  exam: string;
  category: InterviewCategory;
  topic: string;
  question: string;
  source?: string;
  origin: QuestionOrigin;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  suggestedDimensions?: string[];
  expectedCounterArguments?: string[];
  parentQuestionId?: string;
}

export interface InterviewTranscriptItem {
  step: number;
  speaker: 'PANEL' | 'CANDIDATE';
  questionId?: string;
  questionText?: string;
  answerText?: string;
  followUpToStep?: number;
  feedback?: string;
  timestamp: string;
}

export interface InterviewSessionEvaluation {
  overallScore: number;
  maxScore: number;
  marksBreakdown: {
    articulation?: number;
    factualDepth?: number;
    balanceOfOpinion?: number;
    situationalJudgment?: number;
    poiseAndEthics?: number;
  };
  strengths: string[];
  weaknesses: string[];
  bodyLanguageTips?: string[];
  actionableFeedback: string;
}

export interface InterviewSessionItem {
  id: string;
  userId: string;
  exam: string;
  boardName: string;
  mode: 'DAF_BASED' | 'TOPIC_BASED' | 'MOCK_BOARD' | 'CURRENT_AFFAIRS';
  status: 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  startedAt: string;
  completedAt?: string;
  currentStep: number;
  transcript: InterviewTranscriptItem[];
  evaluation?: InterviewSessionEvaluation;
}

export interface PrelimsStagePerformance {
  hasSufficientData: boolean;
  message?: string;
  totalAttempts: number;
  completedTests: number;
  accuracy: number | null;
  averageScore: number | null;
  attemptRate: number | null;
  timeEfficiencySeconds: number | null;
  negativeMarkImpact: number | null;
  subjectAccuracy: { subject: string; accuracy: number; attempts: number }[];
  topicAccuracy: { topic: string; subject: string; accuracy: number; attempts: number }[];
  strongestAreas: string[];
  weakestAreas: string[];
  recentTrend: { date: string; score: number; maxScore: number; accuracy: number }[];
}

export interface MainsStagePerformance {
  hasSufficientData: boolean;
  message?: string;
  totalAnswersWritten: number;
  evaluatedCount: number;
  draftsCount: number;
  averageScore: number | null;
  subjectPerformance: { subject: string; submitted: number; averageMarks: number }[];
  rubricAverages: {
    structure: number | null;
    analysis: number | null;
    relevance: number | null;
    factsAndData: number | null;
    presentation: number | null;
  };
  strengths: string[];
  weaknesses: string[];
}

export interface InterviewStagePerformance {
  hasSufficientData: boolean;
  message?: string;
  sessionsCompleted: number;
  averageBoardScore: number | null;
  maxBoardScore: number;
  categoryPerformance: { category: string; sessionCount: number; rating: number }[];
  topStrengths: string[];
  growthAreas: string[];
}

export interface CorrelatedSubjectProgress {
  subject: string;
  prelimsAccuracy: number | null;
  mainsAverageScore: number | null;
  interviewGovernanceScore: number | null;
  readinessLevel: 'NEEDS_FOCUS' | 'DEVELOPING' | 'STRONG' | 'EXEMPLARY' | 'INSUFFICIENT_DATA';
}

export interface UnifiedLearnerPerformance {
  userId: string;
  targetExam: string;
  lastUpdated: string;
  prelims: PrelimsStagePerformance;
  mains: MainsStagePerformance;
  interview: InterviewStagePerformance;
  correlatedSubjects?: CorrelatedSubjectProgress[];
  overallReadiness?: {
    score: number | null;
    label: string;
    summary: string;
  };
  crossStageInsights: {
    recurringGaps: {
      subjectOrTheme: string;
      evidence: {
        prelims?: string;
        mains?: string;
        interview?: string;
      };
      actionableRemedy: string;
    }[];
    confirmedStrengths: {
      subjectOrTheme: string;
      evidence: string;
    }[];
  };
}

