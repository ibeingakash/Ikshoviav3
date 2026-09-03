export type PyqQuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'STATEMENT_BASED' | 'MATCH_FOLLOWING' | 'ASSERTION_REASON' | 'MCQ';

export interface PyqStatementItem {
  id: string | number;
  text: string;
  textHi?: string;
}

export interface PyqMatchColumnItem {
  key: string;
  text: string;
  textHi?: string;
}

export interface PyqMatchCodeItem {
  label: string;
  mapping: string;
  mappingHi?: string;
}

export interface PyqMatchData {
  leftColumn: PyqMatchColumnItem[];
  rightColumn: PyqMatchColumnItem[];
  codes: PyqMatchCodeItem[];
  leftHeader?: string;
  rightHeader?: string;
  leftHeaderHi?: string;
  rightHeaderHi?: string;
}

export interface OfficialPyqQuestion {
  id?: string;
  paperId?: string;
  questionNumber: number;
  questionText: string;
  questionEn?: string;
  questionHi?: string;
  questionType?: PyqQuestionType;
  statements?: any[];
  statementsHi?: any[];
  matchData?: any;
  matchDataHi?: any;
  options: { id: string; text: string }[];
  optionsEn?: { id: string; text: string }[];
  optionsHi?: { id: string; text: string }[];
  officialAnswer: string;
  officialAnswerSource?: string;
  solution: string;
  solutionEn?: string;
  solutionHi?: string;
  solutionSource?: string;
  language?: string;
  topic?: string;
  subtopic?: string;
  subject?: string;
  subjectId?: string;
  gsPaper?: string;
  prelimsArea?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  sourcePage?: string;
  sourcePageNumber?: number;
  officialPaperUrl?: string;
  extractionMethod?: string;
  extractionConfidence?: number;
  validationStatus?: string;
  sourceVerificationStatus?: 'OFFICIAL_VERIFIED' | 'UNVERIFIED';
  answerVerificationStatus?: 'OFFICIAL_VERIFIED' | 'PENDING_OFFICIAL_KEY' | 'ANSWER_KEY_PENDING';
  verificationStatus?: 'OFFICIAL_VERIFIED' | 'UNVERIFIED';
}

export interface OfficialPyqPaper {
  id: string;
  exam: 'UPSC CSE' | 'BPSC';
  examName: string;
  year: number;
  examCycle: string;
  stage: string;
  paper: string;
  paperName: string;
  paperCode: string;
  officialSourceUrl: string;
  officialPaperUrl: string;
  sourceDomain: string;
  expectedQuestionCount: number;
  actualQuestionCount?: number;
  verifiedQuestionCount?: number;
  verificationStatus?: 'OFFICIAL_VERIFIED' | 'INCOMPLETE' | 'SOURCE_UNAVAILABLE';
  answerKeyStatus?: 'OFFICIAL_KEY_VERIFIED' | 'ANSWER_KEY_PENDING';
  language?: string;
  marksPerCorrect?: number;
  negativeMarking?: number;
  durationMinutes?: number;
  questions: OfficialPyqQuestion[];
}
