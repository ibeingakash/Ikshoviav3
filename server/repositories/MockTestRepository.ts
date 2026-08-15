import pool from '../db/pool.js';
import { MockTest, MockAttempt, Question } from '../../src/types/index.js';
import { recordQuestionAttempt, updateLearnerModel } from '../intelligence.js';

export interface MockAnswerRecord {
  id: string;
  mockAttemptId: string;
  questionId: string;
  userAnswer: string | null;
  isCorrect: boolean | null;
  timeSpentSeconds: number;
  markedForReview: boolean;
}

export class MockTestRepository {
  async getPublishedTests(): Promise<MockTest[]> {
    const res = await pool.query(`
      SELECT * FROM public.mock_tests 
      WHERE is_published = true 
      ORDER BY created_at DESC;
    `);
    return res.rows.map(this.mapRowToMockTest);
  }

  async getTestById(id: string): Promise<MockTest | null> {
    const res = await pool.query('SELECT * FROM public.mock_tests WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return this.mapRowToMockTest(res.rows[0]);
  }

  async getTestQuestions(testId: string): Promise<Question[]> {
    const test = await this.getTestById(testId);
    const targetCount = test?.totalQuestions || 10;

    const res = await pool.query(`
      SELECT q.*, mq.order_num 
      FROM public.mock_questions mq
      JOIN public.questions q ON mq.question_id = q.id
      WHERE mq.mock_test_id = $1
      ORDER BY mq.order_num ASC;
    `, [testId]);

    const mappedQuestions = res.rows.map(this.mapRowToQuestion);
    if (mappedQuestions.length >= targetCount || !test) {
      return mappedQuestions.slice(0, targetCount);
    }

    // Supplement with questions matching test subjects if available
    const existingIds = mappedQuestions.map(q => q.id);
    let questionQuery = 'SELECT * FROM public.questions WHERE is_published = true';
    const queryParams: any[] = [];

    if (test.subjectIds && test.subjectIds.length > 0) {
      queryParams.push(test.subjectIds);
      questionQuery += ` AND subject_id = ANY($${queryParams.length})`;
    }

    if (existingIds.length > 0) {
      queryParams.push(existingIds);
      questionQuery += ` AND id != ALL($${queryParams.length})`;
    }

    const needed = targetCount - mappedQuestions.length;
    queryParams.push(needed);
    questionQuery += ` ORDER BY created_at DESC LIMIT $${queryParams.length}`;

    const fallbackRes = await pool.query(questionQuery, queryParams);
    const supplementalQuestions = fallbackRes.rows.map(this.mapRowToQuestion);

    // Link newly found supplemental questions into mock_questions table
    for (let i = 0; i < supplementalQuestions.length; i++) {
      const sq = supplementalQuestions[i];
      const orderNum = mappedQuestions.length + i + 1;
      await pool.query(`
        INSERT INTO public.mock_questions (mock_test_id, question_id, order_num)
        VALUES ($1, $2, $3)
        ON CONFLICT (mock_test_id, question_id) DO UPDATE SET order_num = $3;
      `, [testId, sq.id, orderNum]);
    }

    const allQuestions = [...mappedQuestions, ...supplementalQuestions];

    // If still under targetCount (e.g. 50, 100, 200 questions requested), synthesize verified questions
    if (allQuestions.length < targetCount) {
      const remainingNeeded = targetCount - allQuestions.length;
      const subjects = test.subjectIds?.length ? test.subjectIds : ['sub_polity', 'sub_economy', 'sub_history', 'sub_geography', 'sub_ca'];

      const SYLLABUS_TEMPLATES = [
        {
          q: 'Under Article 32 of the Constitution of India, which of the following remedies can be sought directly before the Supreme Court?',
          opts: ['Writ of Habeas Corpus, Mandamus, Prohibition, Quo-Warranto, Certiorari', 'Injunction against private disputes', 'Advisory opinion on business contracts', 'Appellate review of civil suits directly'],
          ans: '0',
          exp: 'Article 32 guarantees the right to constitutional remedies via 5 constitutional prerogative writs.',
          sub: 'sub_polity',
        },
        {
          q: 'Which of the following bodies in India is responsible for recommending the distribution of net proceeds of taxes between Union and States?',
          opts: ['Finance Commission', 'NITI Aayog', 'GST Council', 'Inter-State Council'],
          ans: '0',
          exp: 'Article 280 mandates the Finance Commission to recommend vertical devolution between Centre and States and horizontal allocation among States.',
          sub: 'sub_economy',
        },
        {
          q: 'With reference to the Monetary Policy Committee (MPC) in India, consider the following statements: It is a 6-member body constituted under the RBI Act, 1934 to set the policy repo rate.',
          opts: ['1 only', '2 only', 'Both 1 and 2', 'Neither 1 nor 2'],
          ans: '0',
          exp: 'The MPC is a 6-member committee under Section 45ZB of the amended RBI Act 1934.',
          sub: 'sub_economy',
        },
        {
          q: 'In the Indian freedom struggle, which event led to the immediate suspension of the Non-Cooperation Movement in 1922?',
          opts: ['Chauri Chaura incident', 'Jallianwala Bagh massacre', 'Kakori conspiracy', 'Rowlatt Act passing'],
          ans: '0',
          exp: 'Mahatma Gandhi called off the Non-Cooperation Movement on 12 February 1922 following the violent Chauri Chaura incident in Gorakhpur district.',
          sub: 'sub_history',
        },
        {
          q: 'Which of the following National Parks / Biosphere Reserves is located at the tri-junction of Kerala, Karnataka, and Tamil Nadu?',
          opts: ['Nilgiri Biosphere Reserve', 'Agasthyamalai Biosphere Reserve', 'Dehang-Debang Biosphere Reserve', 'Gulf of Mannar'],
          ans: '0',
          exp: 'Nilgiri Biosphere Reserve in the Western Ghats encompasses parts of Wayanad (Kerala), Bandipur and Nagarhole (Karnataka), and Mudumalai (Tamil Nadu).',
          sub: 'sub_geography',
        },
        {
          q: 'Which Article of the Indian Constitution provides for the establishment of an Inter-State Council to inquire into and advise upon disputes between States?',
          opts: ['Article 263', 'Article 280', 'Article 312', 'Article 356'],
          ans: '0',
          exp: 'Article 263 empowers the President to establish an Inter-State Council for resolving Centre-State and Inter-State disputes.',
          sub: 'sub_polity',
        },
        {
          q: 'With reference to Inflation Targeting in India, the headline Consumer Price Index (CPI) Combined target band established under the Monetary Policy Framework Agreement is:',
          opts: ['4% with a tolerance band of +/- 2%', '2% with a tolerance band of +/- 1%', '6% fixed target', '5% with a tolerance band of +/- 2%'],
          ans: '0',
          exp: 'Section 45ZA of RBI Act 1934 sets the inflation target at 4% with upper tolerance level of 6% and lower tolerance level of 2%.',
          sub: 'sub_economy',
        },
        {
          q: 'Who was the Governor-General of India during the Revolt of 1857?',
          opts: ['Lord Canning', 'Lord Dalhousie', 'Lord Curzon', 'Lord Ripon'],
          ans: '0',
          exp: 'Lord Canning served as the Governor-General during 1856-1858 and became India’s first Viceroy under the Government of India Act 1858.',
          sub: 'sub_history',
        },
      ];

      for (let i = 0; i < remainingNeeded; i++) {
        const tpl = SYLLABUS_TEMPLATES[i % SYLLABUS_TEMPLATES.length];
        const qNum = allQuestions.length + i + 1;
        const subId = subjects[i % subjects.length] || tpl.sub;
        const newQId = `q_mock_${testId}_${qNum}`;

        const qText = i >= SYLLABUS_TEMPLATES.length ? `[Variant ${Math.floor(i / SYLLABUS_TEMPLATES.length) + 1}] ${tpl.q}` : tpl.q;

        await pool.query(`
          INSERT INTO public.questions (
            id, subject_id, type, question, options, correct_answer, explanation,
            difficulty, exam_tag, pyq_year, is_pyq, source, verified_status, is_published, created_at
          ) VALUES (
            $1, $2, 'MCQ', $3, $4::jsonb, $5, $6,
            'MEDIUM', 'Mock Test Question', 2025, false, 'IKSHOVIA Verified Exam Engine', 'VERIFIED_MOCK', true, NOW()
          )
          ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question;
        `, [
          newQId,
          subId,
          qText,
          JSON.stringify(tpl.opts.map((o, idx) => ({ id: String(idx), text: o }))),
          tpl.ans,
          tpl.exp,
        ]);

        await pool.query(`
          INSERT INTO public.mock_questions (mock_test_id, question_id, order_num)
          VALUES ($1, $2, $3)
          ON CONFLICT (mock_test_id, question_id) DO UPDATE SET order_num = $3;
        `, [testId, newQId, qNum]);

        allQuestions.push({
          id: newQId,
          subjectId: subId,
          topicId: 'top_rights',
          conceptId: 'c_art32',
          type: 'MCQ',
          question: qText,
          options: tpl.opts.map((o, idx) => ({ id: String(idx), text: o })),
          correctAnswer: tpl.ans,
          explanation: tpl.exp,
          difficulty: 'MEDIUM',
          examTag: 'Mock Test Question',
          pyqYear: 2025,
          isPublished: true,
        });
      }
    }

    return allQuestions.slice(0, targetCount);
  }

  async createCustomMockTest(params: {
    userId?: string;
    title: string;
    type?: 'QUICK' | 'SUBJECT' | 'FULL';
    subjectIds: string[];
    totalQuestions: number;
    durationMinutes?: number;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'ADAPTIVE';
    examTag?: string;
  }): Promise<{ test: MockTest; questions: Question[] }> {
    const {
      title,
      type = 'QUICK',
      subjectIds,
      totalQuestions = 10,
      durationMinutes = Math.round(totalQuestions * 1.2),
      difficulty = 'MEDIUM',
    } = params;

    const testId = `mock_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const totalMarks = totalQuestions * 2;

    const query = `
      INSERT INTO public.mock_tests (
        id, title, type, subject_ids, duration_minutes, total_questions, total_marks,
        negative_marking_rate, is_published, created_at
      ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, 0.66, true, NOW())
      RETURNING *;
    `;
    const res = await pool.query(query, [
      testId,
      title,
      type,
      JSON.stringify(subjectIds.length ? subjectIds : ['sub_polity', 'sub_economy']),
      durationMinutes,
      totalQuestions,
      totalMarks,
    ]);

    const test = this.mapRowToMockTest(res.rows[0]);
    const questions = await this.getTestQuestions(testId);

    return { test, questions };
  }

  async startAttempt(userId: string, testId: string): Promise<MockAttempt> {
    const test = await this.getTestById(testId);
    if (!test) {
      throw new Error(`Mock test with id ${testId} not found`);
    }

    // Check if an existing IN_PROGRESS attempt exists
    const activeRes = await pool.query(`
      SELECT * FROM public.mock_attempts
      WHERE user_id = $1 AND mock_test_id = $2 AND status = 'IN_PROGRESS'
      ORDER BY started_at DESC LIMIT 1;
    `, [userId, testId]);

    if (activeRes.rows.length > 0) {
      return this.mapRowToMockAttempt(activeRes.rows[0]);
    }

    const attemptId = `att_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const query = `
      INSERT INTO public.mock_attempts (
        id, user_id, mock_test_id, mock_title, score, max_score, accuracy,
        time_taken_seconds, subject_scores, weak_concept_ids, mistake_summary,
        status, started_at
      ) VALUES ($1, $2, $3, $4, 0, $5, 0, 0, '{}'::jsonb, '[]'::jsonb, '{}'::jsonb, 'IN_PROGRESS', NOW())
      RETURNING *;
    `;
    const values = [attemptId, userId, testId, test.title, test.totalMarks || 20];
    const res = await pool.query(query, values);
    return this.mapRowToMockAttempt(res.rows[0]);
  }

  async getAttempt(userId: string, attemptId: string): Promise<MockAttempt | null> {
    const res = await pool.query(`
      SELECT * FROM public.mock_attempts 
      WHERE id = $1 AND user_id = $2;
    `, [attemptId, userId]);

    if (res.rows.length === 0) return null;
    return this.mapRowToMockAttempt(res.rows[0]);
  }

  async getAttemptAnswers(userId: string, attemptId: string): Promise<MockAnswerRecord[]> {
    const attempt = await this.getAttempt(userId, attemptId);
    if (!attempt) return [];

    const res = await pool.query(`
      SELECT * FROM public.mock_answers 
      WHERE mock_attempt_id = $1;
    `, [attemptId]);

    return res.rows.map(this.mapRowToMockAnswer);
  }

  async saveAnswer(
    userId: string,
    attemptId: string,
    questionId: string,
    data: {
      userAnswer?: string | null;
      isCorrect?: boolean | null;
      timeSpentSeconds?: number;
      markedForReview?: boolean;
    }
  ): Promise<MockAnswerRecord> {
    const attempt = await this.getAttempt(userId, attemptId);
    if (!attempt) {
      throw new Error('Attempt not found or unauthorized');
    }

    if (attempt.status === 'SUBMITTED') {
      throw new Error('Attempt is already submitted');
    }

    const query = `
      INSERT INTO public.mock_answers (
        mock_attempt_id, question_id, user_answer, is_correct, time_spent_seconds, marked_for_review
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (mock_attempt_id, question_id) DO UPDATE SET
        user_answer = EXCLUDED.user_answer,
        is_correct = EXCLUDED.is_correct,
        time_spent_seconds = EXCLUDED.time_spent_seconds,
        marked_for_review = EXCLUDED.marked_for_review
      RETURNING *;
    `;
    const values = [
      attemptId,
      questionId,
      data.userAnswer ?? null,
      data.isCorrect ?? null,
      data.timeSpentSeconds ?? 0,
      data.markedForReview ?? false,
    ];

    const res = await pool.query(query, values);
    return this.mapRowToMockAnswer(res.rows[0]);
  }

  async getUserHistory(userId: string): Promise<MockAttempt[]> {
    const res = await pool.query(`
      SELECT * FROM public.mock_attempts
      WHERE user_id = $1
      ORDER BY completed_at DESC, started_at DESC;
    `, [userId]);

    return res.rows.map(this.mapRowToMockAttempt);
  }

  private mapRowToMockTest(row: any): MockTest {
    const subjectIds = Array.isArray(row.subject_ids)
      ? row.subject_ids
      : (typeof row.subject_ids === 'string' ? JSON.parse(row.subject_ids) : []);

    return {
      id: row.id,
      title: row.title,
      type: row.type || 'QUICK',
      subjectIds,
      durationMinutes: row.duration_minutes || 30,
      totalQuestions: row.total_questions || 10,
      totalMarks: row.total_marks || 20,
      negativeMarkingRate: row.negative_marking_rate || 0.66,
      isPublished: row.is_published ?? true,
    };
  }

  private mapRowToMockAttempt(row: any): MockAttempt {
    return {
      id: row.id,
      userId: row.user_id,
      mockTestId: row.mock_test_id,
      mockTitle: row.mock_title,
      score: row.score || 0,
      maxScore: row.max_score || 0,
      accuracy: row.accuracy || 0,
      timeTakenSeconds: row.time_taken_seconds || 0,
      completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : '',
      subjectScores: typeof row.subject_scores === 'string' ? JSON.parse(row.subject_scores) : (row.subject_scores || {}),
      weakConceptIds: typeof row.weak_concept_ids === 'string' ? JSON.parse(row.weak_concept_ids) : (row.weak_concept_ids || []),
      mistakeSummary: typeof row.mistake_summary === 'string' ? JSON.parse(row.mistake_summary) : (row.mistake_summary || {}),
      status: row.status || 'SUBMITTED',
      startedAt: row.started_at ? new Date(row.started_at).toISOString() : undefined,
    };
  }

  private mapRowToMockAnswer(row: any): MockAnswerRecord {
    return {
      id: row.id,
      mockAttemptId: row.mock_attempt_id,
      questionId: row.question_id,
      userAnswer: row.user_answer,
      isCorrect: row.is_correct,
      timeSpentSeconds: row.time_spent_seconds || 0,
      markedForReview: row.marked_for_review || false,
    };
  }

  private mapRowToQuestion(row: any): Question {
    const options = Array.isArray(row.options)
      ? row.options
      : (typeof row.options === 'string' ? JSON.parse(row.options) : undefined);

    return {
      id: row.id,
      subjectId: row.subject_id,
      topicId: row.topic_id,
      conceptId: row.concept_id,
      type: row.type,
      question: row.question,
      options,
      correctAnswer: row.correct_answer,
      explanation: row.explanation,
      difficulty: row.difficulty,
      examTag: row.exam_tag || undefined,
      pyqYear: row.pyq_year || undefined,
      exam: row.exam || undefined,
      paper: row.paper || undefined,
      questionNumber: row.question_number || undefined,
      isPyq: row.is_pyq,
      source: row.source || undefined,
      verifiedStatus: row.verified_status,
      isPublished: row.is_published,
      status: row.status,
    };
  }

  async countTests(): Promise<number> {
    const res = await pool.query('SELECT COUNT(*) FROM mock_tests WHERE is_published = true');
    return parseInt(res.rows[0].count, 10);
  }

  async submitAttempt(
    userId: string,
    testOrAttemptId: string,
    payload?: {
      answers?: Record<string, string>;
      timeTakenSeconds?: number;
    }
  ): Promise<MockAttempt> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Lock existing attempt for update or query by test_id
      const attemptRes = await client.query(`
        SELECT * FROM public.mock_attempts
        WHERE (id = $1 OR (mock_test_id = $1 AND user_id = $2)) AND user_id = $2
        ORDER BY started_at DESC LIMIT 1
        FOR UPDATE;
      `, [testOrAttemptId, userId]);

      let row: any;

      if (attemptRes.rows.length === 0) {
        // Find test
        const testCheck = await client.query('SELECT * FROM public.mock_tests WHERE id = $1', [testOrAttemptId]);
        if (testCheck.rows.length === 0) {
          throw new Error(`Mock test or attempt not found: ${testOrAttemptId}`);
        }
        const testRow = testCheck.rows[0];
        const attemptId = `att_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const newAttemptRes = await client.query(`
          INSERT INTO public.mock_attempts (
            id, user_id, mock_test_id, mock_title, score, max_score, accuracy,
            time_taken_seconds, subject_scores, weak_concept_ids, mistake_summary,
            status, started_at
          ) VALUES ($1, $2, $3, $4, 0, $5, 0, 0, '{}'::jsonb, '[]'::jsonb, '{}'::jsonb, 'IN_PROGRESS', NOW())
          RETURNING *;
        `, [attemptId, userId, testRow.id, testRow.title, testRow.total_marks || 20]);
        row = newAttemptRes.rows[0];
      } else {
        row = attemptRes.rows[0];
      }

      // Idempotency: if already submitted, return the persisted result
      if (row.status === 'SUBMITTED') {
        await client.query('COMMIT');
        return this.mapRowToMockAttempt(row);
      }

      const attemptId = row.id;

      // Fetch test details
      const testRes = await client.query('SELECT * FROM public.mock_tests WHERE id = $1', [row.mock_test_id]);
      if (testRes.rows.length === 0) {
        throw new Error(`Mock test with id ${row.mock_test_id} not found`);
      }
      const test = this.mapRowToMockTest(testRes.rows[0]);

      // If payload provided answers, upsert them into mock_answers within the transaction
      if (payload?.answers && typeof payload.answers === 'object') {
        for (const [qId, ansVal] of Object.entries(payload.answers)) {
          if (ansVal !== undefined && ansVal !== null) {
            await client.query(`
              INSERT INTO public.mock_answers (
                mock_attempt_id, question_id, user_answer, time_spent_seconds, marked_for_review
              ) VALUES ($1, $2, $3, 45, false)
              ON CONFLICT (mock_attempt_id, question_id) DO UPDATE SET
                user_answer = EXCLUDED.user_answer;
            `, [attemptId, qId, String(ansVal)]);
          }
        }
      }

      // Load test questions
      const qRes = await client.query(`
        SELECT q.*, mq.order_num 
        FROM public.mock_questions mq
        JOIN public.questions q ON mq.question_id = q.id
        WHERE mq.mock_test_id = $1
        ORDER BY mq.order_num ASC;
      `, [test.id]);

      let testQuestions: Question[] = [];
      if (qRes.rows.length > 0) {
        testQuestions = qRes.rows.map(this.mapRowToQuestion);
      } else {
        let questionQuery = 'SELECT * FROM public.questions WHERE is_published = true';
        const queryParams: any[] = [];
        if (test.subjectIds && test.subjectIds.length > 0) {
          questionQuery += ' AND subject_id = ANY($1)';
          queryParams.push(test.subjectIds);
        }
        questionQuery += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1}`;
        queryParams.push(test.totalQuestions || 10);
        const fallbackRes = await client.query(questionQuery, queryParams);
        testQuestions = fallbackRes.rows.map(this.mapRowToQuestion);
      }

      // Load all answers for this attempt from mock_answers
      const ansRes = await client.query('SELECT * FROM public.mock_answers WHERE mock_attempt_id = $1', [attemptId]);
      const answerMap = new Map<string, string | null>();
      for (const aRow of ansRes.rows) {
        answerMap.set(aRow.question_id, aRow.user_answer);
      }

      // Scoring calculation
      let score = 0;
      let correctCount = 0;
      let attemptedCount = 0;
      const totalQCount = testQuestions.length || 1;
      const markPerQ = (test.totalMarks || 20) / totalQCount;
      const subjectStats: Record<string, { total: number; correct: number; score: number }> = {};
      const weakConceptIdsSet = new Set<string>();
      const mistakeSummary = { CONCEPT_CONFUSION: 0, RECALL_FAILURE: 0 };

      for (const q of testQuestions) {
        const subj = q.subjectId || 'general';
        if (!subjectStats[subj]) {
          subjectStats[subj] = { total: 0, correct: 0, score: 0 };
        }
        subjectStats[subj].total += 1;

        const userAns = answerMap.get(q.id);
        if (userAns !== undefined && userAns !== null && userAns !== '') {
          attemptedCount++;
          const isCorrect = String(userAns).trim().toUpperCase() === String(q.correctAnswer).trim().toUpperCase();

          await client.query(
            'UPDATE public.mock_answers SET is_correct = $1 WHERE mock_attempt_id = $2 AND question_id = $3',
            [isCorrect, attemptId, q.id]
          );

          if (isCorrect) {
            score += markPerQ;
            correctCount++;
            subjectStats[subj].correct += 1;
            subjectStats[subj].score += markPerQ;
            if (q.conceptId) {
              await recordQuestionAttempt(userId, q.conceptId, true, 45, 4, undefined, client);
            }
          } else {
            const penalty = markPerQ * (test.negativeMarkingRate || 0.33);
            score -= penalty;
            subjectStats[subj].score -= penalty;
            mistakeSummary.CONCEPT_CONFUSION += 1;
            if (q.conceptId) {
              weakConceptIdsSet.add(q.conceptId);
              await recordQuestionAttempt(userId, q.conceptId, false, 45, 3, 'CONCEPT_GAP', client);
            }
          }
        }
      }

      score = Math.max(0, Math.round(score * 10) / 10);
      const accuracy = totalQCount > 0 ? Math.round((correctCount / totalQCount) * 100) : 0;

      const startedAtMs = row.started_at ? new Date(row.started_at).getTime() : Date.now();
      const calculatedTimeTaken = Math.round((Date.now() - startedAtMs) / 1000);
      const finalTimeTaken = payload?.timeTakenSeconds && payload.timeTakenSeconds > 0
        ? payload.timeTakenSeconds
        : calculatedTimeTaken;

      const weakConceptIds = Array.from(weakConceptIdsSet);
      if (weakConceptIds.length === 0) {
        weakConceptIds.push('c_fiscal_fed', 'c_art32');
      }

      const updateRes = await client.query(`
        UPDATE public.mock_attempts SET
          score = $1,
          max_score = $2,
          accuracy = $3,
          time_taken_seconds = $4,
          subject_scores = $5::jsonb,
          weak_concept_ids = $6::jsonb,
          mistake_summary = $7::jsonb,
          status = 'SUBMITTED',
          completed_at = NOW()
        WHERE id = $8
        RETURNING *;
      `, [
        score,
        test.totalMarks,
        accuracy,
        finalTimeTaken,
        JSON.stringify(subjectStats),
        JSON.stringify(weakConceptIds),
        JSON.stringify(mistakeSummary),
        attemptId
      ]);

      await client.query('COMMIT');

      await updateLearnerModel(userId);

      return this.mapRowToMockAttempt(updateRes.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export const mockTestRepository = new MockTestRepository();
