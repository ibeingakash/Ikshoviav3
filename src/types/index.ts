export type UserRole = 'USER' | 'ADMIN';

export interface UserOnboardingData {
  targetExam: string;
  selectedSubjects: string[];
  dailyGoalMinutes: number;
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  goalStatement: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  isOnboarded: boolean;
  onboarding?: UserOnboardingData;
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
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  examTag?: string;
  pyqYear?: number;
  isPublished: boolean;
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
}

export interface CurrentAffairArticle {
  id: string;
  title: string;
  date: string;
  category: string;
  summary: string;
  background: string;
  keyFacts: string[];
  prelimsRelevance: string;
  mainsRelevance: string;
  relatedConceptIds: string[];
  source: string;
  isPublished: boolean;
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  quickActions?: string[];
  relatedConceptIds?: string[];
}

export interface ChatConversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}

export interface AIContentDraft {
  id: string;
  type: 'MCQ' | 'CONCEPT' | 'SUMMARY';
  prompt: string;
  subjectId: string;
  topicId?: string;
  conceptId?: string;
  generatedData: any;
  status: 'DRAFT' | 'APPROVED' | 'REJECTED';
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
