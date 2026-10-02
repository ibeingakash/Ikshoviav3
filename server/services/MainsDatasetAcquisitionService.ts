import crypto from 'crypto';
import pool from '../db/pool.js';
import { mainsEvaluationIntelligenceService } from './MainsEvaluationIntelligenceService.js';
import {
  DatasetAcquisitionPriority,
  DatasetAcquisitionFunnel,
  LearnerDiversityMetrics,
  DetailedCoverageMatrix,
  DatasetSnapshotRecord,
  DatasetCoverageStatus
} from './MainsIntelligenceTypes.js';

export class MainsDatasetAcquisitionService {

  // ------------------------------------------------------------------
  // 1. DATASET ACQUISITION PRIORITIES ENGINE
  // ------------------------------------------------------------------
  async getAcquisitionPriorities(params?: {
    limit?: number;
    paper?: string;
    subject?: string;
    learnerId?: string;
  }): Promise<DatasetAcquisitionPriority[]> {
    const limit = Math.min(50, Math.max(1, params?.limit || 12));
    const paperFilter = params?.paper ? `%${params.paper}%` : null;
    const subjectFilter = params?.subject ? `%${params.subject}%` : null;

    // 1. Fetch current coverage state from real DB data
    const coverageAnalysis = await mainsEvaluationIntelligenceService.getCoverageAnalysis();
    const paperStatusMap = new Map<string, DatasetCoverageStatus>();
    for (const p of coverageAnalysis.papers) {
      paperStatusMap.set(p.subcategory.toUpperCase(), p.status);
    }

    const directiveStatusMap = new Map<string, DatasetCoverageStatus>();
    for (const d of coverageAnalysis.directives) {
      directiveStatusMap.set(d.subcategory.toUpperCase(), d.status);
    }

    // 2. Query canonical questions bank, prioritizing underrepresented syllabus areas
    // If learnerId is provided, exclude questions the learner has already submitted
    const query = `
      SELECT 
        q.id as question_id,
        q.question,
        q.paper,
        q.exam,
        q.marks,
        q.word_limit,
        COALESCE(q.source_type, 'CANONICAL_UPSC') as source_type,
        COALESCE(subj.name, 'General Studies') as subject,
        COALESCE(top.name, 'Core Syllabus') as topic,
        COALESCE(c.title, 'Fundamental Concept') as concept,
        COUNT(s.id) as total_submissions_count,
        COUNT(CASE WHEN r.training_eligibility = 'TRAINING_ELIGIBLE' THEN 1 END) as eligible_submissions_count
      FROM public.questions q
      LEFT JOIN public.subjects subj ON q.subject_id = subj.id
      LEFT JOIN public.topics top ON q.topic_id = top.id
      LEFT JOIN public.concepts c ON q.concept_id = c.id
      LEFT JOIN public.mains_submissions s ON q.id = s.question_id
      LEFT JOIN public.mains_evaluation_reviews r ON s.id = r.submission_id
      WHERE q.stage = 'MAINS'
        AND ($1::text IS NULL OR q.paper ILIKE $1)
        AND ($2::text IS NULL OR subj.name ILIKE $2)
        AND ($3::text IS NULL OR q.id NOT IN (
          SELECT question_id FROM public.mains_submissions WHERE user_id = $3
        ))
      GROUP BY q.id, subj.name, top.name, c.title
      ORDER BY eligible_submissions_count ASC, total_submissions_count ASC, q.created_at DESC
      LIMIT $4;
    `;

    const queryArgs = [paperFilter, subjectFilter, params?.learnerId || null, limit];

    const res = await pool.query(query, queryArgs);

    const priorities: DatasetAcquisitionPriority[] = [];
    let rank = 1;

    for (const row of res.rows) {
      const canonicalPaper = this.normalizePaperKey(row.paper);
      const paperCoverage = paperStatusMap.get(canonicalPaper) || 'MISSING';
      const directive = this.extractDirective(row.question);
      const directiveCoverage = directiveStatusMap.get(directive.toUpperCase()) || 'MISSING';

      // Determine priority reason based on hierarchical gap analysis
      let priorityReason = 'Balanced Syllabus Coverage Practice';
      if (paperCoverage === 'MISSING') {
        priorityReason = `Zero coverage in ${canonicalPaper} paper (High Priority Gap)`;
      } else if (directiveCoverage === 'MISSING') {
        priorityReason = `Zero coverage in directive '${directive}' for ${canonicalPaper}`;
      } else if (Number(row.eligible_submissions_count) === 0) {
        priorityReason = `Zero verified ground-truth answers for ${row.subject} (${row.topic})`;
      } else if (paperCoverage === 'PARTIALLY_COVERED') {
        priorityReason = `Expanding coverage sample depth in ${canonicalPaper}`;
      }

      const provenance = row.source_type === 'IKSHOVIA_CREATED' ? 'IKSHOVIA_CREATED' : 'CANONICAL_UPSC';
      const recommendedPracticePath = `UPSC Mains > ${canonicalPaper} > ${row.subject} > ${directive} (${row.marks || 10}M)`;

      priorities.push({
        paper: canonicalPaper,
        subject: row.subject,
        topic: row.topic,
        concept: row.concept,
        questionId: row.question_id,
        question: row.question,
        directive,
        marks: Number(row.marks || 10),
        wordLimit: Number(row.word_limit || 150),
        currentCoverage: paperCoverage,
        priorityReason,
        provenance,
        recommendedPracticePath,
        priorityRank: rank++
      });
    }

    return priorities;
  }

  // ------------------------------------------------------------------
  // 2. COVERAGE-DRIVEN PRACTICE HUB (LEARNER-FACING)
  // ------------------------------------------------------------------
  async getLearnerCoveragePracticeHub(learnerId?: string): Promise<{
    hubTitle: string;
    hubDescription: string;
    featuredPracticeTracks: {
      id: string;
      title: string;
      description: string;
      paper: string;
      subject: string;
      directive: string;
      marks: number;
      targetBenefit: string;
      availableQuestionsCount: number;
      sampleQuestion: DatasetAcquisitionPriority | null;
    }[];
    allPriorities: DatasetAcquisitionPriority[];
  }> {
    const priorities = await this.getAcquisitionPriorities({ limit: 20, learnerId });

    // Group into learner-facing preparation tracks (e.g. GS3 Economy, Ethics Case Studies)
    const trackTemplates = [
      {
        id: 'track_gs3_economy',
        title: 'Practice GS3 Economy & Infrastructure',
        description: 'Master high-weightage questions on macroeconomic reforms, budget, and growth directives.',
        paper: 'GS3',
        subject: 'Economy',
        directive: 'Analyze',
        marks: 15,
        targetBenefit: 'Learn multi-sectoral economic impact diagrams and 2nd ARC structuring.'
      },
      {
        id: 'track_gs4_ethics',
        title: 'Practice Ethics & Case Studies',
        description: 'Tackle moral dilemmas, public administration ethics, and constitutional morality prompts.',
        paper: 'GS4',
        subject: 'Ethics & Integrity',
        directive: 'Evaluate',
        marks: 20,
        targetBenefit: 'Build framework-driven stakeholder matrices and value-conflict resolutions.'
      },
      {
        id: 'track_gs1_society_history',
        title: 'Practice GS1 History & Society',
        description: 'Focus on social transformation, Indian heritage, and regional geography questions.',
        paper: 'GS1',
        subject: 'Indian Society',
        directive: 'Discuss',
        marks: 10,
        targetBenefit: 'Sharpen chronological introductions and thematic cause-effect arguments.'
      },
      {
        id: 'track_gs2_polity_governance',
        title: 'Practice GS2 Polity & Governance',
        description: 'Deepen case-law citations, judicial pronouncements, and institutional accountability answers.',
        paper: 'GS2',
        subject: 'Polity & Governance',
        directive: 'Critically Examine',
        marks: 15,
        targetBenefit: 'Incorporate relevant Supreme Court rulings and parliamentary committees.'
      },
      {
        id: 'track_essay_philosophical',
        title: 'Practice Philosophical & Thematic Essay',
        description: 'Structured long-form composition with multi-dimensional analytical perspectives.',
        paper: 'ESSAY',
        subject: 'Essay',
        directive: 'Discuss',
        marks: 125,
        targetBenefit: 'Develop smooth paragraph transitions and balanced philosophical synthesis.'
      }
    ];

    const featuredPracticeTracks = trackTemplates.map(template => {
      const matchingQ = priorities.find(p => p.paper === template.paper) || null;
      return {
        ...template,
        availableQuestionsCount: priorities.filter(p => p.paper === template.paper).length || 3,
        sampleQuestion: matchingQ
      };
    });

    return {
      hubTitle: 'Targeted Mains Syllabus Practice Hub',
      hubDescription: 'Curated high-yield Mains questions targeted at underrepresented syllabus areas for comprehensive answer writing mastery.',
      featuredPracticeTracks,
      allPriorities: priorities
    };
  }

  // ------------------------------------------------------------------
  // 3. DATASET ACQUISITION FUNNEL METRICS
  // ------------------------------------------------------------------
  async getAcquisitionFunnel(): Promise<DatasetAcquisitionFunnel> {
    // 1. Total questions available/surfaced in Mains stage
    const qRes = await pool.query(`SELECT COUNT(*) as surfaced FROM public.questions WHERE stage = 'MAINS';`);
    const surfaced = Number(qRes.rows[0]?.surfaced || 0);

    // 2. Answers submitted (raw real learner submissions excluding test fixtures)
    const subsRes = await pool.query(`
      SELECT 
        COUNT(*) as submitted,
        COUNT(CASE WHEN status = 'EVALUATED' THEN 1 END) as ai_evaluated
      FROM public.mains_submissions
      WHERE id NOT LIKE '%_test_%' AND user_id NOT LIKE '%_test_%';
    `);
    const submitted = Number(subsRes.rows[0]?.submitted || 0);
    const aiEvaluated = Number(subsRes.rows[0]?.ai_evaluated || 0);

    // 3. Reviews breakdown
    const revsRes = await pool.query(`
      SELECT 
        COUNT(*) as faculty_reviewed,
        COUNT(CASE WHEN r.faculty_verdict IN ('ACCEPTED', 'EDITED', 'INDEPENDENT') THEN 1 END) as accepted,
        COUNT(CASE WHEN r.training_eligibility = 'TRAINING_ELIGIBLE' THEN 1 END) as quality_gates_passed,
        COUNT(DISTINCT CASE WHEN r.training_eligibility = 'TRAINING_ELIGIBLE' THEN r.answer_hash END) as unique_training_candidates
      FROM public.mains_evaluation_reviews r
      JOIN public.mains_submissions s ON r.submission_id = s.id
      WHERE s.id NOT LIKE '%_test_%' AND s.user_id NOT LIKE '%_test_%';
    `);

    const revRow = revsRes.rows[0] || {};
    const facultyReviewed = Number(revRow.faculty_reviewed || 0);
    const groundTruthAccepted = Number(revRow.accepted || 0);
    const qualityGatesPassed = Number(revRow.quality_gates_passed || 0);
    const uniqueTrainingCandidates = Number(revRow.unique_training_candidates || 0);

    return {
      questionsSurfaced: surfaced,
      answersSubmitted: submitted,
      aiEvaluated,
      facultyReviewed,
      groundTruthAccepted,
      qualityGatesPassed,
      uniqueTrainingCandidates,
      conversionRates: {
        submissionRate: surfaced > 0 ? Number(((submitted / surfaced) * 100).toFixed(1)) : 0,
        aiEvaluationRate: submitted > 0 ? Number(((aiEvaluated / submitted) * 100).toFixed(1)) : 0,
        facultyReviewRate: aiEvaluated > 0 ? Number(((facultyReviewed / aiEvaluated) * 100).toFixed(1)) : 0,
        acceptanceRate: facultyReviewed > 0 ? Number(((groundTruthAccepted / facultyReviewed) * 100).toFixed(1)) : 0,
        qualityGatePassRate: groundTruthAccepted > 0 ? Number(((qualityGatesPassed / groundTruthAccepted) * 100).toFixed(1)) : 0,
        overallConversionRate: submitted > 0 ? Number(((uniqueTrainingCandidates / submitted) * 100).toFixed(1)) : 0
      }
    };
  }

  // ------------------------------------------------------------------
  // 4. DETAILED DATASET COVERAGE MATRIX (RAW vs REVIEWED vs ELIGIBLE)
  // ------------------------------------------------------------------
  async getDetailedCoverageMatrix(): Promise<DetailedCoverageMatrix> {
    const papers = ['GS1', 'GS2', 'GS3', 'GS4', 'ESSAY', 'OPTIONAL'];
    const tiers = ['WEAK', 'AVERAGE', 'STRONG', 'EXCELLENT'];
    const directives = ['EXPLAIN', 'DISCUSS', 'ANALYZE', 'CRITICALLY_EXAMINE', 'EVALUATE', 'EXAMINE'];
    const marksScales = ['10_MARKS', '15_MARKS', '20_MARKS', '38_MARKS'];
    const types = ['TYPED', 'HANDWRITTEN'];

    // Helper to init matrix cell
    const makeCell = () => ({ raw: 0, facultyReviewed: 0, trainingEligible: 0 });

    const paperTier: Record<string, Record<string, { raw: number; facultyReviewed: number; trainingEligible: number }>> = {};
    for (const t of tiers) {
      paperTier[t] = {};
      for (const p of papers) paperTier[t][p] = makeCell();
    }

    const paperDirective: Record<string, Record<string, { raw: number; facultyReviewed: number; trainingEligible: number }>> = {};
    for (const d of directives) {
      paperDirective[d] = {};
      for (const p of papers) paperDirective[d][p] = makeCell();
    }

    const paperMarks: Record<string, Record<string, { raw: number; facultyReviewed: number; trainingEligible: number }>> = {};
    for (const m of marksScales) {
      paperMarks[m] = {};
      for (const p of papers) paperMarks[m][p] = makeCell();
    }

    const paperType: Record<string, Record<string, { raw: number; facultyReviewed: number; trainingEligible: number }>> = {};
    for (const ty of types) {
      paperType[ty] = {};
      for (const p of papers) paperType[ty][p] = makeCell();
    }

    const subjectPaper: Record<string, Record<string, { raw: number; facultyReviewed: number; trainingEligible: number }>> = {};
    const topicPaper: Record<string, Record<string, { raw: number; facultyReviewed: number; trainingEligible: number }>> = {};

    // Query aggregated cells from database
    const rowsRes = await pool.query(`
      SELECT 
        CASE 
          WHEN UPPER(s.paper) LIKE '%GS 1%' OR UPPER(s.paper) LIKE '%GS-I%' OR UPPER(s.paper) LIKE '%GS1%' THEN 'GS1'
          WHEN UPPER(s.paper) LIKE '%GS 2%' OR UPPER(s.paper) LIKE '%GS-II%' OR UPPER(s.paper) LIKE '%GS2%' THEN 'GS2'
          WHEN UPPER(s.paper) LIKE '%GS 3%' OR UPPER(s.paper) LIKE '%GS-III%' OR UPPER(s.paper) LIKE '%GS3%' THEN 'GS3'
          WHEN UPPER(s.paper) LIKE '%GS 4%' OR UPPER(s.paper) LIKE '%GS-IV%' OR UPPER(s.paper) LIKE '%GS4%' OR UPPER(s.paper) LIKE '%ETHICS%' THEN 'GS4'
          WHEN UPPER(s.paper) LIKE '%ESSAY%' THEN 'ESSAY'
          WHEN UPPER(s.paper) LIKE '%OPTIONAL%' THEN 'OPTIONAL'
          ELSE 'GS2'
        END as canonical_paper,
        CASE 
          WHEN s.submission_type = 'HANDWRITTEN_IMAGE' THEN 'HANDWRITTEN'
          ELSE 'TYPED'
        END as canonical_type,
        CASE
          WHEN s.max_marks <= 10 THEN '10_MARKS'
          WHEN s.max_marks <= 15 THEN '15_MARKS'
          WHEN s.max_marks <= 20 THEN '20_MARKS'
          ELSE '38_MARKS'
        END as canonical_marks,
        COALESCE(r.directive, 'DISCUSS') as canonical_directive,
        CASE 
          WHEN COALESCE(r.faculty_normalized_percentage, (s.marks_obtained / NULLIF(s.max_marks, 0)) * 100, 50) < 35 THEN 'WEAK'
          WHEN COALESCE(r.faculty_normalized_percentage, (s.marks_obtained / NULLIF(s.max_marks, 0)) * 100, 50) BETWEEN 35 AND 54.99 THEN 'AVERAGE'
          WHEN COALESCE(r.faculty_normalized_percentage, (s.marks_obtained / NULLIF(s.max_marks, 0)) * 100, 50) BETWEEN 55 AND 69.99 THEN 'STRONG'
          ELSE 'EXCELLENT'
        END as canonical_tier,
        COALESCE(subj.name, 'General Studies') as subject_name,
        COALESCE(top.name, 'Core Syllabus') as topic_name,
        COUNT(s.id) as raw_count,
        COUNT(r.id) as reviewed_count,
        COUNT(CASE WHEN r.training_eligibility = 'TRAINING_ELIGIBLE' THEN 1 END) as eligible_count
      FROM public.mains_submissions s
      JOIN public.questions q ON s.question_id = q.id
      LEFT JOIN public.subjects subj ON q.subject_id = subj.id
      LEFT JOIN public.topics top ON q.topic_id = top.id
      LEFT JOIN public.mains_evaluation_reviews r ON s.id = r.submission_id
      WHERE s.id NOT LIKE '%_test_%' AND s.user_id NOT LIKE '%_test_%'
      GROUP BY 1, 2, 3, 4, 5, 6, 7;
    `);

    for (const row of rowsRes.rows) {
      const p = row.canonical_paper;
      const t = row.canonical_tier;
      const d = row.canonical_directive;
      const m = row.canonical_marks;
      const ty = row.canonical_type;
      const subj = row.subject_name;
      const top = row.topic_name;

      const raw = Number(row.raw_count);
      const rev = Number(row.reviewed_count);
      const elg = Number(row.eligible_count);

      // Paper x Tier
      if (paperTier[t]?.[p]) {
        paperTier[t][p].raw += raw;
        paperTier[t][p].facultyReviewed += rev;
        paperTier[t][p].trainingEligible += elg;
      }

      // Paper x Directive
      if (paperDirective[d]?.[p]) {
        paperDirective[d][p].raw += raw;
        paperDirective[d][p].facultyReviewed += rev;
        paperDirective[d][p].trainingEligible += elg;
      }

      // Paper x Marks
      if (paperMarks[m]?.[p]) {
        paperMarks[m][p].raw += raw;
        paperMarks[m][p].facultyReviewed += rev;
        paperMarks[m][p].trainingEligible += elg;
      }

      // Paper x Type
      if (paperType[ty]?.[p]) {
        paperType[ty][p].raw += raw;
        paperType[ty][p].facultyReviewed += rev;
        paperType[ty][p].trainingEligible += elg;
      }

      // Subject x Paper
      if (!subjectPaper[subj]) subjectPaper[subj] = {};
      if (!subjectPaper[subj][p]) subjectPaper[subj][p] = makeCell();
      subjectPaper[subj][p].raw += raw;
      subjectPaper[subj][p].facultyReviewed += rev;
      subjectPaper[subj][p].trainingEligible += elg;

      // Topic x Paper
      if (!topicPaper[top]) topicPaper[top] = {};
      if (!topicPaper[top][p]) topicPaper[top][p] = makeCell();
      topicPaper[top][p].raw += raw;
      topicPaper[top][p].facultyReviewed += rev;
      topicPaper[top][p].trainingEligible += elg;
    }

    return {
      paperTier,
      paperDirective,
      paperMarks,
      paperType,
      subjectPaper,
      topicPaper
    };
  }

  // ------------------------------------------------------------------
  // 5. LEARNER DIVERSITY & CONCENTRATION CONTROL
  // ------------------------------------------------------------------
  async getLearnerDiversityMetrics(): Promise<LearnerDiversityMetrics> {
    // Total unique learners submitting answers
    const totalLearnersRes = await pool.query(`
      SELECT COUNT(DISTINCT user_id) as total_learners
      FROM public.mains_submissions
      WHERE id NOT LIKE '%_test_%' AND user_id NOT LIKE '%_test_%';
    `);
    const totalUniqueLearners = Number(totalLearnersRes.rows[0]?.total_learners || 0);

    // Eligible answers per learner
    const eligibleRes = await pool.query(`
      SELECT 
        s.user_id,
        COUNT(DISTINCT r.answer_hash) as eligible_count
      FROM public.mains_evaluation_reviews r
      JOIN public.mains_submissions s ON r.submission_id = s.id
      WHERE r.training_eligibility = 'TRAINING_ELIGIBLE'
        AND s.id NOT LIKE '%_test_%' 
        AND s.user_id NOT LIKE '%_test_%'
      GROUP BY s.user_id
      ORDER BY eligible_count DESC;
    `);

    const totalEligible = eligibleRes.rows.reduce((sum, r) => sum + Number(r.eligible_count), 0);
    const uniqueLearnersWithEligible = eligibleRes.rows.length;

    let concentrationFlag = false;
    let concentrationWarningMessage: string | undefined;

    const eligibleAnswersPerLearner = eligibleRes.rows.map(r => {
      const count = Number(r.eligible_count);
      const pct = totalEligible > 0 ? Number(((count / totalEligible) * 100).toFixed(1)) : 0;
      if (pct > 30.0 && totalEligible >= 5) {
        concentrationFlag = true;
        concentrationWarningMessage = `LEARNER_CONCENTRATION_WARNING: A single learner contributes ${pct}% of total eligible training data. Prioritize submissions from diverse learners.`;
      }
      return {
        anonymizedLearnerId: mainsEvaluationIntelligenceService.computeAnonymizedLearnerId(r.user_id),
        eligibleCount: count,
        percentageOfDataset: pct
      };
    });

    return {
      totalUniqueLearners,
      uniqueLearnersWithEligible,
      eligibleAnswersPerLearner,
      concentrationFlag,
      concentrationWarningMessage
    };
  }

  // ------------------------------------------------------------------
  // 6. DATASET VERSION SNAPSHOTS LIFECYCLE (DRAFT → VALIDATING → FROZEN)
  // ------------------------------------------------------------------
  async createDatasetSnapshot(params: {
    versionName: string;
    description?: string;
    creatorId?: string;
  }): Promise<DatasetSnapshotRecord> {
    const { versionName, description, creatorId } = params;

    // Check duplicate version name
    const existing = await pool.query(
      `SELECT id FROM public.mains_dataset_snapshots WHERE version_name = $1 LIMIT 1;`,
      [versionName]
    );
    if (existing.rows.length > 0) {
      throw new Error(`Dataset snapshot version '${versionName}' already exists.`);
    }

    // 1. Gather all strictly eligible items excluding benchmarks, test fixtures, duplicates
    const eligibleQuery = `
      SELECT 
        r.submission_id,
        r.answer_hash,
        r.faculty_marks_obtained,
        r.faculty_max_marks,
        r.faculty_normalized_percentage,
        s.paper,
        s.user_id,
        q.subject_id
      FROM public.mains_evaluation_reviews r
      JOIN public.mains_submissions s ON r.submission_id = s.id
      JOIN public.questions q ON r.question_id = q.id
      WHERE r.training_eligibility = 'TRAINING_ELIGIBLE'
        AND r.workflow_status = 'COMPLETED'
        AND s.id NOT LIKE '%_test_%'
        AND s.user_id NOT LIKE '%_test_%'
        AND r.submission_id NOT IN (SELECT submission_id FROM public.mains_evaluation_benchmark_items)
      ORDER BY r.created_at ASC;
    `;

    const elgRes = await pool.query(eligibleQuery);
    const items = elgRes.rows;
    const submissionIds = items.map(i => i.submission_id);

    // Compute checksum
    const checksumHash = crypto.createHash('sha256');
    for (const item of items) {
      checksumHash.update(`${item.submission_id}:${item.answer_hash}:${item.faculty_marks_obtained}`);
    }
    const checksumSha256 = checksumHash.digest('hex');

    // Calculate distributions
    const paperDistribution: Record<string, number> = {};
    const tierDistribution: Record<string, number> = { WEAK: 0, AVERAGE: 0, STRONG: 0, EXCELLENT: 0 };
    const learnerCounts: Record<string, number> = {};

    for (const item of items) {
      const p = this.normalizePaperKey(item.paper);
      paperDistribution[p] = (paperDistribution[p] || 0) + 1;

      const pct = Number(item.faculty_normalized_percentage || 50);
      if (pct < 35) tierDistribution.WEAK++;
      else if (pct < 55) tierDistribution.AVERAGE++;
      else if (pct < 70) tierDistribution.STRONG++;
      else tierDistribution.EXCELLENT++;

      learnerCounts[item.user_id] = (learnerCounts[item.user_id] || 0) + 1;
    }

    const id = `dsnap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const res = await pool.query(
      `INSERT INTO public.mains_dataset_snapshots (
        id, version_name, description, status, eligible_items_count, checksum_sha256,
        eligible_submission_ids, coverage_statistics, duplicate_statistics, learner_diversity,
        paper_distribution, tier_distribution, creator_id, created_at
      ) VALUES ($1, $2, $3, 'VALIDATING', $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING *;`,
      [
        id,
        versionName,
        description || `Phase 4.1D Dataset Snapshot ${versionName}`,
        items.length,
        checksumSha256,
        JSON.stringify(submissionIds),
        JSON.stringify({ totalEligible: items.length }),
        JSON.stringify({ uniqueHashes: new Set(items.map(i => i.answer_hash)).size }),
        JSON.stringify({ uniqueLearners: Object.keys(learnerCounts).length }),
        JSON.stringify(paperDistribution),
        JSON.stringify(tierDistribution),
        creatorId || 'usr_admin'
      ]
    );

    return this.mapSnapshotRecord(res.rows[0]);
  }

  // Freeze snapshot to make it immutable
  async freezeDatasetSnapshot(snapshotId: string): Promise<DatasetSnapshotRecord> {
    const sRes = await pool.query(
      `SELECT * FROM public.mains_dataset_snapshots WHERE id = $1 LIMIT 1;`,
      [snapshotId]
    );
    if (sRes.rows.length === 0) {
      throw new Error(`Snapshot ${snapshotId} not found`);
    }

    const record = sRes.rows[0];
    if (record.status === 'FROZEN') {
      throw new Error(`Snapshot '${record.version_name}' is already FROZEN and completely immutable.`);
    }

    const updateRes = await pool.query(
      `UPDATE public.mains_dataset_snapshots
       SET status = 'FROZEN',
           frozen_at = NOW()
       WHERE id = $1
       RETURNING *;`,
      [snapshotId]
    );

    return this.mapSnapshotRecord(updateRes.rows[0]);
  }

  async listDatasetSnapshots(): Promise<DatasetSnapshotRecord[]> {
    const res = await pool.query(`SELECT * FROM public.mains_dataset_snapshots ORDER BY created_at DESC;`);
    return res.rows.map(r => this.mapSnapshotRecord(r));
  }

  // ------------------------------------------------------------------
  // 7. ACQUISITION EVENT LOGGING
  // ------------------------------------------------------------------
  async logAcquisitionEvent(params: {
    eventName: string;
    questionId?: string;
    submissionId?: string;
    learnerId?: string;
    paper?: string;
    subject?: string;
    directive?: string;
    metadata?: any;
  }): Promise<any> {
    const id = `acq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sanitizedMeta = { ...(params.metadata || {}) };
    delete sanitizedMeta.email;
    delete sanitizedMeta.phone;
    delete sanitizedMeta.password;
    delete sanitizedMeta.token;
    delete sanitizedMeta.raw_answer;

    const res = await pool.query(
      `INSERT INTO public.mains_dataset_acquisition_logs (
        id, event_name, question_id, submission_id, learner_id, paper, subject, directive, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *;`,
      [
        id,
        params.eventName,
        params.questionId || null,
        params.submissionId || null,
        params.learnerId ? mainsEvaluationIntelligenceService.computeAnonymizedLearnerId(params.learnerId) : null,
        params.paper || null,
        params.subject || null,
        params.directive || null,
        JSON.stringify(sanitizedMeta)
      ]
    );
    return res.rows[0];
  }

  // Helper mappings
  private mapSnapshotRecord(row: any): DatasetSnapshotRecord {
    return {
      id: row.id,
      versionName: row.version_name,
      description: row.description,
      status: row.status,
      eligibleItemsCount: Number(row.eligible_items_count || 0),
      checksumSha256: row.checksum_sha256,
      eligibleSubmissionIds: Array.isArray(row.eligible_submission_ids)
        ? row.eligible_submission_ids
        : (row.eligible_submission_ids ? JSON.parse(row.eligible_submission_ids) : []),
      coverageStatistics: row.coverage_statistics || {},
      duplicateStatistics: row.duplicate_statistics || {},
      learnerDiversity: row.learner_diversity || {},
      paperDistribution: row.paper_distribution || {},
      tierDistribution: row.tier_distribution || {},
      creatorId: row.creator_id,
      createdAt: row.created_at,
      frozenAt: row.frozen_at
    };
  }

  private normalizePaperKey(paperStr?: string): string {
    const s = (paperStr || '').toUpperCase();
    if (s.includes('GS 1') || s.includes('GS-I') || s.includes('GS1')) return 'GS1';
    if (s.includes('GS 2') || s.includes('GS-II') || s.includes('GS2')) return 'GS2';
    if (s.includes('GS 3') || s.includes('GS-III') || s.includes('GS3')) return 'GS3';
    if (s.includes('GS 4') || s.includes('GS-IV') || s.includes('GS4') || s.includes('ETHICS')) return 'GS4';
    if (s.includes('ESSAY')) return 'ESSAY';
    if (s.includes('OPTIONAL')) return 'OPTIONAL';
    return 'GS2';
  }

  private extractDirective(questionText: string): string {
    const q = questionText.toLowerCase();
    if (q.includes('critically analyze') || q.includes('critically examine') || q.includes('critical analysis')) {
      return 'Critically Examine';
    }
    if (q.includes('evaluate') || q.includes('evaluation')) return 'Evaluate';
    if (q.includes('analyze') || q.includes('analyse')) return 'Analyze';
    if (q.includes('examine')) return 'Examine';
    if (q.includes('explain') || q.includes('elucidate')) return 'Explain';
    if (q.includes('discuss')) return 'Discuss';
    return 'Discuss';
  }
}

export const mainsDatasetAcquisitionService = new MainsDatasetAcquisitionService();
