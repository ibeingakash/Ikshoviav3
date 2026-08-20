export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

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
  answer: FieldConfidenceLevel;
  explanation: FieldConfidenceLevel;
}

export type OCRDocumentLanguage = 'EN' | 'HI' | 'BILINGUAL' | 'AUTO';
export type OCRExtractionStrategy = 'TEXT_EXTRACTION' | 'VISION_OCR' | 'HYBRID_PAGE_BY_PAGE';

export interface Question {
  id: string;
  subjectId: string;
  topicId: string;
  conceptId: string;
  type: QuestionType;
  question: string;
  options?: QuestionOption[];
  correctAnswer: string; // Option ID or exact text
  explanation: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'BEGINNER' | 'ADVANCED';
  examTag?: string;
  pyqYear?: number;
  exam?: string;
  paper?: string;
  questionNumber?: number;
  isPyq?: boolean;
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
  questionNum?: number;
  pageNumber?: number;
  hasVisualContent?: boolean;
  fieldConfidence?: FieldConfidence;
  validationErrors?: string[];

  // Bilingual Support
  question_en?: string;
  question_hi?: string;
  options_en?: QuestionOption[];
  options_hi?: QuestionOption[];
  explanation_en?: string;
  explanation_hi?: string;
  availableLanguages?: ('en' | 'hi')[];
  isAITranslated?: boolean;
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
  type: 'QUICK' | 'SUBJECT' | 'FULL';
  subjectIds: string[];
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  negativeMarkingRate: number;
  isPublished: boolean;
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

export interface LearningResource {
  id: string;
  title: string;
  type: 'NOTE' | 'PDF' | 'BOOK' | 'ARTICLE' | 'VIDEO' | 'PYQ';
  subjectId: string;
  conceptId?: string;
  url: string;
  summary: string;
  readTimeMinutes: number;
  examTag?: string;
  isBookmarked?: boolean;
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
  type: 'REVISION' | 'STREAK' | 'INSIGHT' | 'GOAL';
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}
