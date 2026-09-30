import pool from '../db/pool.js';
import {
  UnifiedLearnerPerformance,
  PrelimsStagePerformance,
  MainsStagePerformance,
  InterviewStagePerformance
} from '../../src/types/index.js';

export class UnifiedPerformanceService {
  async getUnifiedPerformance(userId: string): Promise<UnifiedLearnerPerformance> {
    // 1. Fetch user target exam
    const userRes = await pool.query(
      `SELECT u.id, p.target_exam
       FROM public.users u
       LEFT JOIN public.user_profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [userId]
    );
    const targetExam = userRes.rows[0]?.target_exam || 'UPSC CSE';

    // 2. Compute Prelims Performance from REAL attempts
    const prelims = await this.computePrelimsPerformance(userId);

    // 3. Compute Mains Performance from REAL submissions
    const mains = await this.computeMainsPerformance(userId);

    // 4. Compute Interview Performance from REAL sessions
    const interview = await this.computeInterviewPerformance(userId);

    // 5. Synthesize Cross-Stage Insights based on real evidence
    const crossStageInsights = this.synthesizeCrossStageInsights(prelims, mains, interview);

    // 6. Correlate Subject Knowledge across Prelims, Mains, and Interview
    const correlatedSubjects = this.computeCorrelatedSubjects(prelims, mains, interview);

    // 7. Overall Readiness Indicator
    const overallReadiness = this.computeOverallReadiness(prelims, mains, interview);

    return {
      userId,
      targetExam,
      lastUpdated: new Date().toISOString(),
      prelims,
      mains,
      interview,
      correlatedSubjects,
      overallReadiness,
      crossStageInsights
    };
  }

  private async computePrelimsPerformance(userId: string): Promise<PrelimsStagePerformance> {
    // Check individual question attempts
    const qAttRes = await pool.query(
      `SELECT qa.id, qa.is_correct, qa.time_spent_seconds, qa.timestamp,
              q.subject_id, s.name as subject_name,
              q.topic_id, t.name as topic_name
       FROM public.question_attempts qa
       JOIN public.questions q ON qa.question_id = q.id
       LEFT JOIN public.subjects s ON q.subject_id = s.id
       LEFT JOIN public.topics t ON q.topic_id = t.id
       WHERE qa.user_id = $1
       ORDER BY qa.timestamp DESC`,
      [userId]
    );

    // Check full mock attempts
    const mockRes = await pool.query(
      `SELECT ma.id, ma.score, ma.max_score as total_marks, ma.accuracy, ma.created_at, ma.time_taken_seconds
       FROM public.mock_attempts ma
       WHERE ma.user_id = $1 AND ma.status = 'SUBMITTED'
       ORDER BY ma.created_at DESC`,
      [userId]
    );

    const totalAttempts = qAttRes.rows.length;
    const completedTests = mockRes.rows.length;

    // Minimum data requirement: at least 5 question attempts or 1 completed mock
    if (totalAttempts < 5 && completedTests === 0) {
      return {
        hasSufficientData: false,
        message: 'Not enough data yet. Complete at least 5 practice questions or 1 mock test to unlock Prelims performance analytics.',
        totalAttempts,
        completedTests,
        accuracy: null,
        averageScore: null,
        attemptRate: null,
        timeEfficiencySeconds: null,
        negativeMarkImpact: null,
        subjectAccuracy: [],
        topicAccuracy: [],
        strongestAreas: [],
        weakestAreas: [],
        recentTrend: []
      };
    }

    const correctCount = qAttRes.rows.filter(r => r.is_correct).length;
    const incorrectCount = totalAttempts - correctCount;
    const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

    // Calculate subject-wise accuracy
    const subjectMap: Record<string, { attempts: number; correct: number; name: string }> = {};
    const topicMap: Record<string, { attempts: number; correct: number; name: string; subject: string }> = {};

    for (const row of qAttRes.rows) {
      const sId = row.subject_id || 'Other';
      const sName = row.subject_name || row.subject_id || 'General Studies';
      if (!subjectMap[sId]) {
        subjectMap[sId] = { attempts: 0, correct: 0, name: sName };
      }
      subjectMap[sId].attempts += 1;
      if (row.is_correct) subjectMap[sId].correct += 1;

      const tId = row.topic_id || 'General';
      const tName = row.topic_name || row.topic_id || 'General Topic';
      if (!topicMap[tId]) {
        topicMap[tId] = { attempts: 0, correct: 0, name: tName, subject: sName };
      }
      topicMap[tId].attempts += 1;
      if (row.is_correct) topicMap[tId].correct += 1;
    }

    const subjectAccuracy = Object.values(subjectMap).map(s => ({
      subject: s.name,
      accuracy: Math.round((s.correct / s.attempts) * 100),
      attempts: s.attempts
    })).sort((a, b) => b.accuracy - a.accuracy);

    const topicAccuracy = Object.values(topicMap).map(t => ({
      topic: t.name,
      subject: t.subject,
      accuracy: Math.round((t.correct / t.attempts) * 100),
      attempts: t.attempts
    })).sort((a, b) => b.accuracy - a.accuracy);

    const strongestAreas = subjectAccuracy.filter(s => s.accuracy >= 65 && s.attempts >= 3).map(s => s.subject);
    const weakestAreas = subjectAccuracy.filter(s => s.accuracy < 50 && s.attempts >= 3).map(s => s.subject);

    // Negative mark impact calculation (approx 0.66 marks lost per incorrect prelims question)
    const negativeMarkImpact = Number((incorrectCount * 0.66).toFixed(1));

    // Time efficiency
    const totalTimeSpent = qAttRes.rows.reduce((acc, r) => acc + (r.time_spent_seconds || 0), 0);
    const timeEfficiencySeconds = totalAttempts > 0 ? Math.round(totalTimeSpent / totalAttempts) : 0;

    // Recent trend from mocks
    const recentTrend = mockRes.rows.slice(0, 10).map(m => ({
      date: new Date(m.created_at).toLocaleDateString(),
      score: Number(m.score) || 0,
      maxScore: Number(m.total_marks) || 200,
      accuracy: Math.round(m.accuracy || 0)
    }));

    const avgScore = completedTests > 0
      ? Math.round(mockRes.rows.reduce((acc, m) => acc + (Number(m.score) || 0), 0) / completedTests)
      : null;

    return {
      hasSufficientData: true,
      totalAttempts,
      completedTests,
      accuracy,
      averageScore: avgScore,
      attemptRate: 100,
      timeEfficiencySeconds,
      negativeMarkImpact,
      subjectAccuracy,
      topicAccuracy,
      strongestAreas,
      weakestAreas,
      recentTrend
    };
  }

  private async computeMainsPerformance(userId: string): Promise<MainsStagePerformance> {
    const subRes = await pool.query(
      `SELECT s.id, s.status, s.marks_obtained, s.max_marks, s.percentage,
              s.evaluation, s.paper, s.subject_id, s.strengths, s.weaknesses,
              sub.name as subject_name
       FROM public.mains_submissions s
       LEFT JOIN public.subjects sub ON s.subject_id = sub.id
       WHERE s.user_id = $1`,
      [userId]
    );

    const totalAnswersWritten = subRes.rows.filter(r => r.status !== 'DRAFT').length;
    const evaluatedRows = subRes.rows.filter(r => r.status === 'EVALUATED' && r.marks_obtained != null);
    const evaluatedCount = evaluatedRows.length;
    const draftsCount = subRes.rows.filter(r => r.status === 'DRAFT').length;

    if (evaluatedCount === 0 && totalAnswersWritten === 0) {
      return {
        hasSufficientData: false,
        message: 'Not enough data yet. Complete and submit Mains answers to view answer writing evaluation and rubric breakdown.',
        totalAnswersWritten: 0,
        evaluatedCount: 0,
        draftsCount,
        averageScore: null,
        subjectPerformance: [],
        rubricAverages: {
          structure: null,
          analysis: null,
          relevance: null,
          factsAndData: null,
          presentation: null
        },
        strengths: [],
        weaknesses: []
      };
    }

    const avgScore = evaluatedCount > 0
      ? Math.round(evaluatedRows.reduce((acc, r) => acc + (Number(r.marks_obtained) || 0), 0) / evaluatedCount * 10) / 10
      : null;

    // Subject breakdown
    const subjectMap: Record<string, { submitted: number; totalMarks: number; count: number; name: string }> = {};
    const strengthsSet = new Set<string>();
    const weaknessesSet = new Set<string>();

    let sumStructure = 0, countStructure = 0;
    let sumAnalysis = 0, countAnalysis = 0;
    let sumRelevance = 0, countRelevance = 0;
    let sumFacts = 0, countFacts = 0;
    let sumPres = 0, countPres = 0;

    for (const row of evaluatedRows) {
      const sId = row.subject_id || row.paper || 'General Studies';
      const sName = row.subject_name || row.paper || 'General Studies';
      if (!subjectMap[sId]) {
        subjectMap[sId] = { submitted: 0, totalMarks: 0, count: 0, name: sName };
      }
      subjectMap[sId].submitted += 1;
      if (row.marks_obtained != null) {
        subjectMap[sId].totalMarks += Number(row.marks_obtained);
        subjectMap[sId].count += 1;
      }

      if (row.strengths) {
        row.strengths.split(';').map((s: string) => s.trim()).filter(Boolean).forEach((s: string) => strengthsSet.add(s));
      }
      if (row.weaknesses) {
        row.weaknesses.split(';').map((w: string) => w.trim()).filter(Boolean).forEach((w: string) => weaknessesSet.add(w));
      }

      const evalData = row.evaluation;
      if (evalData?.dimensions) {
        const dims = evalData.dimensions;
        if (dims.structure != null) { sumStructure += dims.structure; countStructure++; }
        if (dims.analysis != null) { sumAnalysis += dims.analysis; countAnalysis++; }
        if (dims.relevance != null) { sumRelevance += dims.relevance; countRelevance++; }
        if (dims.factualAccuracy != null || dims.examplesData != null) {
          sumFacts += (dims.factualAccuracy || 0) + (dims.examplesData || 0);
          countFacts++;
        }
        if (dims.presentation != null) { sumPres += dims.presentation; countPres++; }
      }
    }

    const subjectPerformance = Object.values(subjectMap).map(s => ({
      subject: s.name,
      submitted: s.submitted,
      averageMarks: s.count > 0 ? Number((s.totalMarks / s.count).toFixed(1)) : 0
    }));

    return {
      hasSufficientData: evaluatedCount > 0,
      totalAnswersWritten,
      evaluatedCount,
      draftsCount,
      averageScore: avgScore,
      subjectPerformance,
      rubricAverages: {
        structure: countStructure > 0 ? Math.round(sumStructure / countStructure) : null,
        analysis: countAnalysis > 0 ? Math.round(sumAnalysis / countAnalysis) : null,
        relevance: countRelevance > 0 ? Math.round(sumRelevance / countRelevance) : null,
        factsAndData: countFacts > 0 ? Math.round(sumFacts / countFacts) : null,
        presentation: countPres > 0 ? Math.round(sumPres / countPres) : null
      },
      strengths: Array.from(strengthsSet).slice(0, 5),
      weaknesses: Array.from(weaknessesSet).slice(0, 5)
    };
  }

  private async computeInterviewPerformance(userId: string): Promise<InterviewStagePerformance> {
    const sessRes = await pool.query(
      `SELECT id, status, mode, evaluation, started_at, completed_at
       FROM public.interview_sessions
       WHERE user_id = $1 AND status = 'COMPLETED'`,
      [userId]
    );

    const completed = sessRes.rows;
    if (completed.length === 0) {
      return {
        hasSufficientData: false,
        message: 'Not enough data yet. Complete an interactive Interview board session to receive comprehensive personality and articulation analysis.',
        sessionsCompleted: 0,
        averageBoardScore: null,
        maxBoardScore: 275,
        categoryPerformance: [],
        topStrengths: [],
        growthAreas: []
      };
    }

    let totalScore = 0;
    const catMap: Record<string, { count: number; totalScore: number }> = {};
    const strengthsSet = new Set<string>();
    const growthSet = new Set<string>();

    for (const sess of completed) {
      const ev = sess.evaluation;
      if (ev?.overallScore) {
        totalScore += ev.overallScore;
      }
      const mode = sess.mode || 'MOCK_BOARD';
      if (!catMap[mode]) catMap[mode] = { count: 0, totalScore: 0 };
      catMap[mode].count += 1;
      catMap[mode].totalScore += ev?.overallScore || 150;

      if (Array.isArray(ev?.strengths)) {
        ev.strengths.forEach((s: string) => strengthsSet.add(s));
      }
      if (Array.isArray(ev?.weaknesses)) {
        ev.weaknesses.forEach((w: string) => growthSet.add(w));
      }
    }

    const avgBoardScore = Math.round(totalScore / completed.length);
    const categoryPerformance = Object.entries(catMap).map(([mode, data]) => ({
      category: mode.replace('_', ' '),
      sessionCount: data.count,
      rating: Math.round(data.totalScore / data.count)
    }));

    return {
      hasSufficientData: true,
      sessionsCompleted: completed.length,
      averageBoardScore: avgBoardScore,
      maxBoardScore: 275,
      categoryPerformance,
      topStrengths: Array.from(strengthsSet).slice(0, 4),
      growthAreas: Array.from(growthSet).slice(0, 4)
    };
  }

  private synthesizeCrossStageInsights(
    prelims: PrelimsStagePerformance,
    mains: MainsStagePerformance,
    interview: InterviewStagePerformance
  ) {
    const recurringGaps: {
      subjectOrTheme: string;
      evidence: { prelims?: string; mains?: string; interview?: string };
      actionableRemedy: string;
    }[] = [];

    const confirmedStrengths: {
      subjectOrTheme: string;
      evidence: string;
    }[] = [];

    // Check for real evidence in Prelims weakest areas
    if (prelims.hasSufficientData && prelims.weakestAreas.length > 0) {
      for (const weakSub of prelims.weakestAreas) {
        const pAcc = prelims.subjectAccuracy.find(s => s.subject === weakSub)?.accuracy || 0;
        const mPerf = mains.subjectPerformance.find(s => s.subject.toLowerCase().includes(weakSub.toLowerCase()));

        if (mPerf && mPerf.averageMarks < 5.0) {
          recurringGaps.push({
            subjectOrTheme: weakSub,
            evidence: {
              prelims: `Prelims question accuracy is ${pAcc}%`,
              mains: `Mains average score in ${mPerf.subject} is ${mPerf.averageMarks}/10 with structural gaps`,
              interview: interview.growthAreas[0] ? `Interview board flagged: ${interview.growthAreas[0]}` : undefined
            },
            actionableRemedy: `Focus on foundational concept revision for ${weakSub} followed by high-yield answer writing drill.`
          });
        } else if (pAcc < 50) {
          recurringGaps.push({
            subjectOrTheme: weakSub,
            evidence: {
              prelims: `Prelims accuracy is currently ${pAcc}% across attempted questions`
            },
            actionableRemedy: `Revise official PYQs and standard reference chapters for ${weakSub}.`
          });
        }
      }
    }

    // Check for confirmed strengths
    if (prelims.hasSufficientData && prelims.strongestAreas.length > 0) {
      for (const strongSub of prelims.strongestAreas) {
        const pAcc = prelims.subjectAccuracy.find(s => s.subject === strongSub)?.accuracy || 0;
        confirmedStrengths.push({
          subjectOrTheme: strongSub,
          evidence: `Prelims accuracy is strong at ${pAcc}%. Maintain regular revision rhythm.`
        });
      }
    }

    return { recurringGaps, confirmedStrengths };
  }

  private computeCorrelatedSubjects(
    prelims: PrelimsStagePerformance,
    mains: MainsStagePerformance,
    interview: InterviewStagePerformance
  ) {
    const canonicalSubjects = [
      { key: 'polity', name: 'Indian Polity & Governance', interviewProxy: 'Governance & Constitution' },
      { key: 'economy', name: 'Economy & Development', interviewProxy: 'Economic Policy' },
      { key: 'history', name: 'Indian History & Heritage', interviewProxy: 'Culture & Heritage' },
      { key: 'geography', name: 'Geography & Environment', interviewProxy: 'Environmental Issues' },
      { key: 'bihar', name: 'Bihar Special & State Governance', interviewProxy: 'State Administration' }
    ];

    return canonicalSubjects.map(sub => {
      // 1. Prelims accuracy
      const pMatch = prelims.subjectAccuracy.find(s => s.subject.toLowerCase().includes(sub.key));
      const prelimsAccuracy = pMatch ? pMatch.accuracy : null;

      // 2. Mains average score
      const mMatch = mains.subjectPerformance.find(s => s.subject.toLowerCase().includes(sub.key));
      const mainsAverageScore = mMatch ? mMatch.averageMarks : null;

      // 3. Interview governance proxy
      let interviewGovernanceScore: number | null = null;
      if (interview.hasSufficientData && interview.averageBoardScore != null) {
        interviewGovernanceScore = Math.round((interview.averageBoardScore / interview.maxBoardScore) * 100);
      }

      // Compute readinessLevel
      let readinessLevel: 'NEEDS_FOCUS' | 'DEVELOPING' | 'STRONG' | 'EXEMPLARY' | 'INSUFFICIENT_DATA' = 'INSUFFICIENT_DATA';
      if (prelimsAccuracy !== null || mainsAverageScore !== null) {
        const pScore = prelimsAccuracy !== null ? prelimsAccuracy : 50;
        const mScore = mainsAverageScore !== null ? (mainsAverageScore * 10) : 50;
        const combined = (pScore * 0.5) + (mScore * 0.5);

        if (combined >= 75) readinessLevel = 'EXEMPLARY';
        else if (combined >= 62) readinessLevel = 'STRONG';
        else if (combined >= 48) readinessLevel = 'DEVELOPING';
        else readinessLevel = 'NEEDS_FOCUS';
      }

      return {
        subject: sub.name,
        prelimsAccuracy,
        mainsAverageScore,
        interviewGovernanceScore,
        readinessLevel
      };
    });
  }

  private computeOverallReadiness(
    prelims: PrelimsStagePerformance,
    mains: MainsStagePerformance,
    interview: InterviewStagePerformance
  ) {
    const hasP = prelims.hasSufficientData;
    const hasM = mains.hasSufficientData;
    const hasI = interview.hasSufficientData;

    if (!hasP && !hasM && !hasI) {
      return {
        score: null,
        label: 'Insufficient data',
        summary: 'Not enough data yet. Complete at least 5 Prelims questions and submit 1 Mains descriptive answer to activate readiness scoring.'
      };
    }

    let weightedScore = 0;
    let totalWeight = 0;

    if (hasP && prelims.accuracy !== null) {
      weightedScore += prelims.accuracy * 0.40;
      totalWeight += 0.40;
    }
    if (hasM && mains.averageScore !== null) {
      weightedScore += (mains.averageScore * 10) * 0.45;
      totalWeight += 0.45;
    }
    if (hasI && interview.averageBoardScore !== null) {
      weightedScore += ((interview.averageBoardScore / interview.maxBoardScore) * 100) * 0.15;
      totalWeight += 0.15;
    }

    const normalized = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 50;

    let label = 'Foundational Phase';
    if (hasP && hasM && hasI) {
      label = normalized >= 75 ? 'Commission Ready (All Stages)' : 'Multi-Stage Active Preparation';
    } else if (hasP && hasM) {
      label = normalized >= 70 ? 'Mains Caliber Preparation' : 'Prelims + Mains Co-Development';
    } else if (hasP) {
      label = 'Prelims Focused Phase';
    } else if (hasM) {
      label = 'Mains Answer Writing Focused';
    }

    const summary = hasP && hasM
      ? `Active cross-stage preparation with ${prelims.totalAttempts} Prelims attempts and ${mains.totalAnswersWritten} Mains written answers.`
      : hasP
      ? `Strong Prelims foundation with ${prelims.totalAttempts} attempts. Now integrate Mains descriptive writing.`
      : `Mains answer writing active. Supplement with timed Prelims objective drilling.`;

    return {
      score: normalized,
      label,
      summary
    };
  }
}

export const unifiedPerformanceService = new UnifiedPerformanceService();
