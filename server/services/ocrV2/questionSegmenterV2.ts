import { OcrV2ExtractedQuestion } from './ocrTypes.js';

export interface ParseQuestionsOptions {
  totalExpectedQuestions?: number;
  exam: 'UPSC CSE' | 'BPSC';
  documentLanguage?: 'EN' | 'HI' | 'BILINGUAL' | 'AUTO';
  externalAnswerMap?: Record<number, { correctOption: string; explanation?: string }>;
}

export class QuestionSegmenterV2 {
  private static instance: QuestionSegmenterV2;

  public static getInstance(): QuestionSegmenterV2 {
    if (!QuestionSegmenterV2.instance) {
      QuestionSegmenterV2.instance = new QuestionSegmenterV2();
    }
    return QuestionSegmenterV2.instance;
  }

  /**
   * Clean common OCR artifacts and commission headers/footers.
   */
  public cleanOcrText(rawText: string): string {
    return rawText
      .replace(/\r\n/g, '\n')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\x0C/g, '\n') // Remove form-feed page markers
      .replace(/\[P\.T\.O\.?\]/gi, '')
      .replace(/\[\s*Turn\s+Over\s*\]/gi, '')
      .replace(/SPACE\s+FOR\s+ROUGH\s+WORK.*/gi, '')
      .replace(/कच्चे\s+काम\s+के\s+लिए\s+जगह.*/gi, '')
      .replace(/CONCEPT\s+FLT/gi, '')
      .replace(/@\)\s*WALLAH/gi, '')
      .replace(/BPSC\s+CONCEPT/gi, '')
      // Standardize common OCR misrecognitions of option labels
      .replace(/(?:^|\n)\s*([A-Ea-e1-5])[\.\:\)]\s*/g, '\n($1) ')
      .replace(/(?:^|\n)\s*(?:©|\(CO\)|CO\))\s*/g, '\n(C) ')
      .replace(/(?:^|\n)\s*(?:®|BO\))\s*/g, '\n(B) ')
      .trim();
  }

  /**
   * Segment and parse questions with sequential canonical numbering protection.
   */
  public parseQuestions(
    pagesText: Array<{ pageNum: number; text: string }>,
    options: ParseQuestionsOptions
  ): {
    questions: OcrV2ExtractedQuestion[];
    detectedCount: number;
    answerMatchedCount: number;
    reviewRequiredCount: number;
  } {
    const { totalExpectedQuestions = 150, exam, externalAnswerMap = {} } = options;

    // Combine page texts into line stream with page markers
    const linesWithPage: Array<{ text: string; pageNum: number }> = [];
    for (const page of pagesText) {
      const cleaned = this.cleanOcrText(page.text);
      const lines = cleaned.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length > 0) {
          linesWithPage.push({ text: trimmed, pageNum: page.pageNum });
        }
      }
    }

    interface RawQuestionUnit {
      qNum: number;
      startPage: number;
      stemLines: string[];
      optionLines: Array<{ letter: string; text: string }>;
      solOption?: string;
      solLines: string[];
      hasOptionE: boolean;
    }

    const units: RawQuestionUnit[] = [];
    let currentUnit: RawQuestionUnit | null = null;
    let currentSection: 'STEM' | 'OPTIONS' | 'SOLUTION' = 'STEM';
    let expectedNextQNum = 1;

    for (let i = 0; i < linesWithPage.length; i++) {
      const { text: line, pageNum } = linesWithPage[i];

      // 1. Check if this line is a top-level Question Header
      // Matches: Q1, Q.1, Q01:, 1., 1), 01:, प्रश्न 1., Question 1.
      const qHeaderMatch = line.match(
        /^(?:(?:Q(?:uestion)?|प्र(?:श्न)?|प्रश्न)[\s\.\:\-]*0*(\d{1,3})|0*(\d{1,3})\s*[\.\:\-\)])\s*(.*)/i
      );

      let isNewQuestion = false;
      let candidateQNum = 0;
      let remainderText = '';

      if (qHeaderMatch) {
        const numStr = qHeaderMatch[1] || qHeaderMatch[2];
        candidateQNum = parseInt(numStr, 10);
        remainderText = (qHeaderMatch[3] || '').replace(/^[\.\:\-\s]+/, '').trim();

        // Sequence Continuity Protection:
        // Distinguishes top-level question numbers from statement numbers (1., 2.),
        // list items, or Roman numerals.
        if (candidateQNum >= 1 && candidateQNum <= totalExpectedQuestions + 10) {
          if (!currentUnit) {
            // First question: must be question 1 (or 2 if 1 missing)
            if (candidateQNum >= 1 && candidateQNum <= 3) {
              isNewQuestion = true;
            }
          } else {
            const currentQ: number = currentUnit.qNum ?? 0;
            // The next question should be currentQ + 1, or skip of at most 3
            if (candidateQNum > currentQ && candidateQNum <= currentQ + 3) {
              isNewQuestion = true;
            } else if (candidateQNum === currentQ + 1) {
              isNewQuestion = true;
            }
          }
        }
      }

      if (isNewQuestion) {
        if (currentUnit) {
          units.push(currentUnit);
        }
        currentUnit = {
          qNum: candidateQNum,
          startPage: pageNum,
          stemLines: remainderText ? [remainderText] : [],
          optionLines: [],
          solLines: [],
          hasOptionE: false,
        };
        currentSection = 'STEM';
        expectedNextQNum = candidateQNum + 1;
        continue;
      }

      // If we haven't encountered any question header yet, skip header/preamble noise
      if (!currentUnit) {
        continue;
      }

      // 2. Check for Solution / Answer Key marker
      // Matches: Answer: C, Ans. B, Correct Option: A, उत्तर: B, Explanation:, व्याख्या:
      const solOptionMatch = line.match(
        /^(?:Ans(?:wer)?|Correct\s+(?:Option|Answer)|उत्तर|सही\s*विकल्प)\s*[\:\-\=]\s*\(?([A-Ea-e1-5क-ङ])\)?(?:\s*[\:\-\(]?\s*(.*))?/i
      );
      const solExplMarkerMatch = line.match(
        /^(?:Explanation|Detailed\s+Explanation|विवरण|व्याख्या|Solution|समाधान)\s*[\:\-\=]?\s*(.*)/i
      );

      if (solOptionMatch) {
        currentSection = 'SOLUTION';
        let rawLetter = solOptionMatch[1].toUpperCase();
        // Normalize Hindi or numeric option letters
        if (rawLetter === '1' || rawLetter === 'क') rawLetter = 'A';
        else if (rawLetter === '2' || rawLetter === 'ख') rawLetter = 'B';
        else if (rawLetter === '3' || rawLetter === 'ग') rawLetter = 'C';
        else if (rawLetter === '4' || rawLetter === 'घ') rawLetter = 'D';
        else if (rawLetter === '5' || rawLetter === 'ङ') rawLetter = 'E';

        currentUnit.solOption = rawLetter;
        const rest = (solOptionMatch[2] || '').trim();
        if (rest && rest.length > 1) {
          currentUnit.solLines.push(rest.replace(/^\)+/, '').trim());
        }
        continue;
      }

      if (solExplMarkerMatch) {
        currentSection = 'SOLUTION';
        const rest = solExplMarkerMatch[1].trim();
        if (rest) {
          currentUnit.solLines.push(rest);
        }
        continue;
      }

      // 3. Check for Option marker (only when NOT already in SOLUTION section)
      if (currentSection !== 'SOLUTION') {
        const optMatch = line.match(
          /^\s*(?:\(?([A-Ea-e1-5क-ङ])\)?|([A-Ea-e])[\.\:\)])\s+(.+)$/i
        );

        if (optMatch) {
          let letter = (optMatch[1] || optMatch[2]).toUpperCase();
          const optText = optMatch[3].trim();

          if (letter === '1' || letter === 'क') letter = 'A';
          else if (letter === '2' || letter === 'ख') letter = 'B';
          else if (letter === '3' || letter === 'ग') letter = 'C';
          else if (letter === '4' || letter === 'घ') letter = 'D';
          else if (letter === '5' || letter === 'ङ') letter = 'E';

          // Ensure it's a valid option letter A-E
          if (['A', 'B', 'C', 'D', 'E'].includes(letter)) {
            currentSection = 'OPTIONS';
            if (letter === 'E') {
              currentUnit.hasOptionE = true;
            }
            // Check if this option letter is already present in current question
            const existingIdx = currentUnit.optionLines.findIndex(o => o.letter === letter);
            if (existingIdx >= 0) {
              currentUnit.optionLines[existingIdx].text += ' ' + optText;
            } else {
              currentUnit.optionLines.push({ letter, text: optText });
            }
            continue;
          }
        }
      }

      // 4. Content line routing based on current section
      if (currentSection === 'STEM') {
        currentUnit.stemLines.push(line);
      } else if (currentSection === 'OPTIONS') {
        if (currentUnit.optionLines.length > 0) {
          const lastOpt = currentUnit.optionLines[currentUnit.optionLines.length - 1];
          lastOpt.text += ' ' + line;
        } else {
          currentUnit.stemLines.push(line);
        }
      } else if (currentSection === 'SOLUTION') {
        currentUnit.solLines.push(line);
      }
    }

    if (currentUnit) {
      units.push(currentUnit);
    }

    // Now format into structured OcrV2ExtractedQuestion records
    const questions: OcrV2ExtractedQuestion[] = [];
    let answerMatchedCount = 0;
    let reviewRequiredCount = 0;

    for (const u of units) {
      const stemText = u.stemLines.join(' ').replace(/\s{2,}/g, ' ').trim();
      const explanationText = u.solLines.join(' ').replace(/\s{2,}/g, ' ').trim();

      // Options assembly
      const optionsList = u.optionLines
        .sort((a, b) => a.letter.localeCompare(b.letter))
        .map(o => ({
          id: o.letter,
          text: o.text.replace(/\s{2,}/g, ' ').trim(),
        }));

      // If BPSC and Option E is not present in optionsList but the text mentions Option E
      // or if it's BPSC paper and source has it:
      const hasOptionE = u.hasOptionE || optionsList.some(o => o.id === 'E');

      // Canonical Answer Key Binding:
      // Priority 1: In-document embedded solution for Question N
      // Priority 2: External answer key mapped by question number (NEVER by array index)
      let correctAnswer = u.solOption || '';
      let finalExplanation = explanationText;

      const extEntry = externalAnswerMap[u.qNum];
      if (!correctAnswer && extEntry && extEntry.correctOption) {
        correctAnswer = extEntry.correctOption;
        if (!finalExplanation && extEntry.explanation) {
          finalExplanation = extEntry.explanation;
        }
      }

      const validationErrors: string[] = [];
      if (optionsList.length < 3) {
        validationErrors.push(`Fewer than 3 options detected (${optionsList.length} found).`);
      }
      if (!stemText || stemText.length < 8) {
        validationErrors.push('Question stem is too short or empty.');
      }
      if (!correctAnswer) {
        validationErrors.push('Correct answer is not bound.');
      }

      const isComplete = validationErrors.length === 0;
      if (correctAnswer) {
        answerMatchedCount++;
      }
      if (!isComplete) {
        reviewRequiredCount++;
      }

      // Classify question type
      let questionType: 'SINGLE_CHOICE' | 'STATEMENT_BASED' | 'MATCH_FOLLOWING' = 'SINGLE_CHOICE';
      const statements: string[] = [];
      const lowerStem = stemText.toLowerCase();

      if (lowerStem.includes('match list') || lowerStem.includes('list-i') || lowerStem.includes('सूची')) {
        questionType = 'MATCH_FOLLOWING';
      } else if (lowerStem.includes('consider the following') || lowerStem.includes('निम्नलिखित कथनों')) {
        questionType = 'STATEMENT_BASED';
        const stmtMatches = stemText.matchAll(/(?:^|\s+)([1-4])[\.\)]\s+([^\n]+)/g);
        for (const sm of stmtMatches) {
          statements.push(`${sm[1]}) ${sm[2].trim()}`);
        }
      }

      questions.push({
        questionNumber: u.qNum,
        questionText: stemText,
        questionEn: stemText,
        options: optionsList,
        optionsEn: optionsList,
        correctAnswer: correctAnswer || undefined,
        explanation: finalExplanation || undefined,
        explanationEn: finalExplanation || undefined,
        hasOptionE,
        pageNumber: u.startPage,
        confidence: isComplete ? 0.95 : 0.75,
        status: isComplete ? 'READY_TO_PUBLISH' : 'NEEDS_REVIEW',
        answerKeyStatus: correctAnswer ? 'ANSWER_BOUND' : 'ANSWER_PENDING',
        validationErrors,
        questionType,
        statements: statements.length > 0 ? statements : undefined,
      });
    }

    return {
      questions,
      detectedCount: questions.length,
      answerMatchedCount,
      reviewRequiredCount,
    };
  }
}

export const questionSegmenterV2 = QuestionSegmenterV2.getInstance();
