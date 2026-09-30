export type CanonicalSourceOrigin = 'OFFICIAL_COMMISSION' | 'ADMIN_IMPORTED' | 'IKSHOVIA_CREATED';

export const VALID_CANONICAL_ORIGINS: readonly CanonicalSourceOrigin[] = [
  'OFFICIAL_COMMISSION',
  'ADMIN_IMPORTED',
  'IKSHOVIA_CREATED',
] as const;

/**
 * Derives the canonical source_origin for a question from its existing database provenance.
 * 
 * Rules:
 * 1. Derives exclusively from canonical question metadata (source_type, source_origin, source, source_job_id).
 * 2. Strictly adheres to the 3 canonical origins:
 *    - OFFICIAL_COMMISSION
 *    - ADMIN_IMPORTED
 *    - IKSHOVIA_CREATED
 * 3. Never guesses origin from exam name, year, or client payload.
 * 4. Fails safely with a descriptive Error if origin cannot be determined authoritatively,
 *    preventing any NULL insertion into question_revisions.source_origin.
 */
export function resolveCanonicalSourceOrigin(question: {
  id?: string;
  source_origin?: string | null;
  sourceOrigin?: string | null;
  source_type?: string | null;
  sourceType?: string | null;
  source?: string | null;
  source_job_id?: string | null;
  sourceJobId?: string | null;
  [key: string]: any;
}): CanonicalSourceOrigin {
  // 1. Check explicit source_origin / sourceOrigin
  const rawOrigin = (question.source_origin || question.sourceOrigin || '').trim().toUpperCase();
  if (rawOrigin === 'OFFICIAL_COMMISSION') return 'OFFICIAL_COMMISSION';
  if (rawOrigin === 'ADMIN_IMPORTED') return 'ADMIN_IMPORTED';
  if (rawOrigin === 'IKSHOVIA_CREATED') return 'IKSHOVIA_CREATED';
  if (rawOrigin === 'IKSHOVIA') return 'IKSHOVIA_CREATED';
  if (rawOrigin === 'ADMIN_ADDED' || rawOrigin === 'OCR_IMPORTED' || rawOrigin === 'OCR_VERIFIED_IMPORT') return 'ADMIN_IMPORTED';
  if (rawOrigin === 'OFFICIAL_COMMISSION_ARCHIVE') return 'OFFICIAL_COMMISSION';

  // 2. Check explicit source_type / sourceType
  const rawType = (question.source_type || question.sourceType || '').trim().toUpperCase();
  if (rawType === 'OFFICIAL_COMMISSION') return 'OFFICIAL_COMMISSION';
  if (rawType === 'ADMIN_IMPORTED') return 'ADMIN_IMPORTED';
  if (rawType === 'IKSHOVIA_CREATED') return 'IKSHOVIA_CREATED';
  if (rawType === 'IKSHOVIA') return 'IKSHOVIA_CREATED';
  if (rawType === 'ADMIN_ADDED' || rawType === 'OCR_IMPORTED' || rawType === 'OCR_VERIFIED_IMPORT') return 'ADMIN_IMPORTED';
  if (rawType === 'OFFICIAL_COMMISSION_ARCHIVE') return 'OFFICIAL_COMMISSION';

  // 3. Check authoritative source field
  const rawSource = (question.source || '').trim().toUpperCase();
  if (rawSource === 'OFFICIAL_COMMISSION') return 'OFFICIAL_COMMISSION';
  if (rawSource === 'ADMIN_IMPORTED') return 'ADMIN_IMPORTED';
  if (rawSource === 'IKSHOVIA_CREATED' || rawSource === 'IKSHOVIA') return 'IKSHOVIA_CREATED';
  if (rawSource === 'OCR_VERIFIED_IMPORT' || rawSource === 'OCR_IMPORTED' || rawSource === 'ADMIN_ADDED') return 'ADMIN_IMPORTED';
  if (rawSource === 'OFFICIAL_COMMISSION_ARCHIVE') return 'OFFICIAL_COMMISSION';

  // 4. Check linked OCR source job (imported by admin via OCR pipeline)
  if (question.source_job_id || question.sourceJobId) {
    return 'ADMIN_IMPORTED';
  }

  // 5. Explicit failure safety: Never guess from exam name or year, never invent OFFICIAL_COMMISSION
  throw new Error(
    `Cannot determine canonical source_origin for question '${question.id || 'unknown'}'. ` +
    `Provenance must authoritatively resolve to OFFICIAL_COMMISSION, ADMIN_IMPORTED, or IKSHOVIA_CREATED.`
  );
}
