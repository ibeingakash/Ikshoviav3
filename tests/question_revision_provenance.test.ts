import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pool from '../server/db/pool.js';
import { resolveCanonicalSourceOrigin } from '../server/utils/provenance.js';
import { MockTestRepository } from '../server/repositories/MockTestRepository.js';

describe('Question Revision Provenance & Audit Integrity Suite', () => {
  const mockTestRepo = new MockTestRepository();
  const testQuestionIds: string[] = [];

  afterAll(async () => {
    // Cleanup any created test questions and revisions
    if (testQuestionIds.length > 0) {
      await pool.query('DELETE FROM public.question_revisions WHERE question_id = ANY($1)', [testQuestionIds]);
      await pool.query('DELETE FROM public.questions WHERE id = ANY($1)', [testQuestionIds]);
    }
  });

  describe('1. Canonical Origin Resolution & Semantic Boundary Invariants', () => {
    it('resolves OFFICIAL_COMMISSION from canonical metadata', () => {
      expect(resolveCanonicalSourceOrigin({ id: 'q1', source_type: 'OFFICIAL_COMMISSION' })).toBe('OFFICIAL_COMMISSION');
      expect(resolveCanonicalSourceOrigin({ id: 'q2', source_origin: 'OFFICIAL_COMMISSION' })).toBe('OFFICIAL_COMMISSION');
      expect(resolveCanonicalSourceOrigin({ id: 'q3', source: 'OFFICIAL_COMMISSION' })).toBe('OFFICIAL_COMMISSION');
      expect(resolveCanonicalSourceOrigin({ id: 'q4', source: 'OFFICIAL_COMMISSION_ARCHIVE' })).toBe('OFFICIAL_COMMISSION');
    });

    it('resolves ADMIN_IMPORTED from canonical metadata', () => {
      expect(resolveCanonicalSourceOrigin({ id: 'q5', source_type: 'ADMIN_IMPORTED' })).toBe('ADMIN_IMPORTED');
      expect(resolveCanonicalSourceOrigin({ id: 'q6', source_origin: 'ADMIN_IMPORTED' })).toBe('ADMIN_IMPORTED');
      expect(resolveCanonicalSourceOrigin({ id: 'q7', source: 'OCR_VERIFIED_IMPORT' })).toBe('ADMIN_IMPORTED');
      expect(resolveCanonicalSourceOrigin({ id: 'q8', source: 'ADMIN_ADDED' })).toBe('ADMIN_IMPORTED');
      expect(resolveCanonicalSourceOrigin({ id: 'q9', source_job_id: 'job_ocr_99' })).toBe('ADMIN_IMPORTED');
    });

    it('resolves IKSHOVIA_CREATED from canonical metadata', () => {
      expect(resolveCanonicalSourceOrigin({ id: 'q10', source_type: 'IKSHOVIA_CREATED' })).toBe('IKSHOVIA_CREATED');
      expect(resolveCanonicalSourceOrigin({ id: 'q11', source_origin: 'IKSHOVIA_CREATED' })).toBe('IKSHOVIA_CREATED');
      expect(resolveCanonicalSourceOrigin({ id: 'q12', source: 'IKSHOVIA_CREATED' })).toBe('IKSHOVIA_CREATED');
      expect(resolveCanonicalSourceOrigin({ id: 'q13', source: 'IKSHOVIA' })).toBe('IKSHOVIA_CREATED');
    });

    it('never guesses origin from exam name or year, and fails safely if origin is missing', () => {
      // Legacy question without authoritative provenance must throw instead of inventing OFFICIAL_COMMISSION
      expect(() => {
        resolveCanonicalSourceOrigin({
          id: 'legacy_unmapped_1',
          exam: 'UPSC CSE',
          exam_tag: 'UPSC CSE 2024 Prelims GS 1',
          pyq_year: 2024,
          source_type: null,
          source: null,
          source_origin: null,
          source_job_id: null,
        });
      }).toThrow(/Cannot determine canonical source_origin/);
    });

    it('preserves strict separation: ADMIN_IMPORTED cannot be classified as OFFICIAL_COMMISSION', () => {
      const adminQ = {
        id: 'admin_q_1',
        source_type: 'ADMIN_IMPORTED',
        exam: 'UPSC CSE',
        pyq_year: 2024,
      };
      expect(resolveCanonicalSourceOrigin(adminQ)).toBe('ADMIN_IMPORTED');
      expect(resolveCanonicalSourceOrigin(adminQ)).not.toBe('OFFICIAL_COMMISSION');
    });
  });

  describe('2. updateQuestionWithAudit Database Integration', () => {
    it('creates revision with source_origin = OFFICIAL_COMMISSION for official questions', async () => {
      const qId = `test_q_off_${Date.now()}`;
      testQuestionIds.push(qId);

      await pool.query(`
        INSERT INTO public.questions (
          id, subject_id, topic_id, concept_id, question, options, correct_answer, explanation,
          source_type, status, is_published
        ) VALUES (
          $1, 'sub_polity', 'top_rights', 'c_art21', 'Original Official Question Text',
          '[{"id":"A","text":"Option 1"},{"id":"B","text":"Option 2"}]'::jsonb,
          'A', 'Original Official Explanation', 'OFFICIAL_COMMISSION', 'PUBLISHED', true
        )
      `, [qId]);

      const result = await mockTestRepo.updateQuestionWithAudit(
        qId,
        {
          question: 'Corrected Official Question Text',
          correct_answer: 'B',
          explanation: 'Corrected Official Explanation',
        },
        'Admin Tester',
        'Official paper errata update'
      );

      expect(result.question.question).toBe('Corrected Official Question Text');
      expect(result.question.correctAnswer).toBe('B');
      expect(result.revision).toBeDefined();
      expect(result.revision.source_origin).toBe('OFFICIAL_COMMISSION');
      expect(result.revision.field_changed).toBe('QUESTION_TEXT');
      expect(result.revision.revision_num).toBe(1);

      // Verify directly in question_revisions table
      const revRows = await mockTestRepo.getQuestionRevisions(qId);
      expect(revRows.length).toBe(1);
      expect(revRows[0].source_origin).toBe('OFFICIAL_COMMISSION');
      expect(revRows[0].changed_by).toBe('Admin Tester');
      expect(revRows[0].reason).toBe('Official paper errata update');
    });

    it('creates revision with source_origin = ADMIN_IMPORTED for admin imported questions', async () => {
      const qId = `test_q_adm_${Date.now()}`;
      testQuestionIds.push(qId);

      await pool.query(`
        INSERT INTO public.questions (
          id, subject_id, topic_id, concept_id, question, options, correct_answer, explanation,
          source_type, status, is_published
        ) VALUES (
          $1, 'sub_polity', 'top_rights', 'c_art21', 'Original Admin Imported Text',
          '[{"id":"A","text":"Option 1"},{"id":"B","text":"Option 2"}]'::jsonb,
          'A', 'Original Admin Explanation', 'ADMIN_IMPORTED', 'PUBLISHED', true
        )
      `, [qId]);

      const result = await mockTestRepo.updateQuestionWithAudit(
        qId,
        {
          explanation: 'Updated Admin Imported Explanation',
        },
        'Quality Admin',
        'Refined explanation clarity'
      );

      expect(result.revision).toBeDefined();
      expect(result.revision.source_origin).toBe('ADMIN_IMPORTED');
      expect(result.revision.field_changed).toBe('EXPLANATION');

      const revRows = await mockTestRepo.getQuestionRevisions(qId);
      expect(revRows.length).toBe(1);
      expect(revRows[0].source_origin).toBe('ADMIN_IMPORTED');
    });

    it('creates revision with source_origin = IKSHOVIA_CREATED for Ikshovia created questions', async () => {
      const qId = `test_q_iksh_${Date.now()}`;
      testQuestionIds.push(qId);

      await pool.query(`
        INSERT INTO public.questions (
          id, subject_id, topic_id, concept_id, question, options, correct_answer, explanation,
          source_type, status, is_published
        ) VALUES (
          $1, 'sub_polity', 'top_rights', 'c_art21', 'Original Ikshovia Text',
          '[{"id":"A","text":"Option 1"},{"id":"B","text":"Option 2"}]'::jsonb,
          'A', 'Original Ikshovia Explanation', 'IKSHOVIA_CREATED', 'PUBLISHED', true
        )
      `, [qId]);

      const result = await mockTestRepo.updateQuestionWithAudit(
        qId,
        {
          correct_answer: 'B',
        },
        'Content Creator',
        'Fixed answer key error'
      );

      expect(result.revision).toBeDefined();
      expect(result.revision.source_origin).toBe('IKSHOVIA_CREATED');
      expect(result.revision.field_changed).toBe('CORRECT_ANSWER');

      const revRows = await mockTestRepo.getQuestionRevisions(qId);
      expect(revRows.length).toBe(1);
      expect(revRows[0].source_origin).toBe('IKSHOVIA_CREATED');
    });

    it('does not create duplicate revisions on retry when fields are unchanged', async () => {
      const qId = `test_q_retry_${Date.now()}`;
      testQuestionIds.push(qId);

      await pool.query(`
        INSERT INTO public.questions (
          id, subject_id, topic_id, concept_id, question, options, correct_answer, explanation,
          source_type, status, is_published
        ) VALUES (
          $1, 'sub_polity', 'top_rights', 'c_art21', 'Static Question Text',
          '[{"id":"A","text":"Option 1"},{"id":"B","text":"Option 2"}]'::jsonb,
          'A', 'Static Explanation', 'ADMIN_IMPORTED', 'PUBLISHED', true
        )
      `, [qId]);

      // First change: updates explanation
      const firstRes = await mockTestRepo.updateQuestionWithAudit(
        qId,
        { explanation: 'Updated Explanation' },
        'Admin',
        'First edit'
      );
      expect(firstRes.revision).not.toBeNull();

      // Retry with identical content
      const retryRes = await mockTestRepo.updateQuestionWithAudit(
        qId,
        { explanation: 'Updated Explanation' },
        'Admin',
        'Retry click with same content'
      );
      expect(retryRes.revision).toBeNull();

      const revRows = await mockTestRepo.getQuestionRevisions(qId);
      expect(revRows.length).toBe(1); // exactly 1 revision exists
    });

    it('rolls back atomically and leaves question untouched if origin cannot be derived', async () => {
      const qId = `test_q_norun_${Date.now()}`;
      testQuestionIds.push(qId);

      await pool.query(`
        INSERT INTO public.questions (
          id, subject_id, topic_id, concept_id, question, options, correct_answer, explanation,
          source_type, source, status, is_published
        ) VALUES (
          $1, 'sub_polity', 'top_rights', 'c_art21', 'Original Untouched Text',
          '[{"id":"A","text":"Option 1"}]'::jsonb,
          'A', 'Original Untouched Explanation', NULL, NULL, 'PUBLISHED', true
        )
      `, [qId]);

      // Attempting to update a question whose origin cannot be authoritatively derived must throw
      await expect(
        mockTestRepo.updateQuestionWithAudit(
          qId,
          { question: 'Attempted Malformed Text Update' },
          'Admin',
          'Should fail due to missing origin'
        )
      ).rejects.toThrow(/Cannot determine canonical source_origin/);

      // Verify question was NOT modified in the database
      const checkQ = await pool.query('SELECT question FROM public.questions WHERE id = $1', [qId]);
      expect(checkQ.rows[0].question).toBe('Original Untouched Text');

      // Verify no revision was written
      const checkRev = await pool.query('SELECT * FROM public.question_revisions WHERE question_id = $1', [qId]);
      expect(checkRev.rows.length).toBe(0);
    });
  });
});
