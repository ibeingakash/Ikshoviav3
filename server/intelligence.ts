import pool from './db/pool.js';
import { learnerRepository } from './repositories/LearnerRepository.js';
import { revisionRepository } from './repositories/RevisionRepository.js';
import {
  ConceptMastery,
  LearnerModel,
  NextBestAction,
  RevisionItem,
  MistakeCategory,
} from '../src/types/index.js';
import { PoolClient } from 'pg';

/**
 * Recalculates concept mastery for a user after a learning event or question attempt.
 */
export async function recordQuestionAttempt(
  userId: string,
  conceptId: string,
  isCorrect: boolean,
  timeSpentSeconds: number,
  confidenceRating: number, // 1 to 5
  mistakeCategory?: MistakeCategory,
  client?: PoolClient
): Promise<ConceptMastery> {
  let mastery = await learnerRepository.getConceptMastery(userId, conceptId, client);

  if (!mastery) {
    mastery = {
      conceptId,
      understanding: 60,
      retention: 60,
      application: 50,
      accuracy: 50,
      confidence: confidenceRating * 20,
      overallMastery: 55,
      attemptsCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      lastStudiedAt: new Date().toISOString(),
      lastReviewedAt: new Date().toISOString(),
      nextReviewDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
      timeSpentSeconds: 0,
    };
  }

  mastery.attemptsCount += 1;
  mastery.timeSpentSeconds += timeSpentSeconds;
  mastery.lastReviewedAt = new Date().toISOString();

  const userConfidencePct = confidenceRating * 20;
  mastery.confidence = Math.round(0.7 * mastery.confidence + 0.3 * userConfidencePct);

  if (isCorrect) {
    mastery.correctCount += 1;
    mastery.accuracy = Math.round((mastery.correctCount / mastery.attemptsCount) * 100);
    mastery.application = Math.min(100, mastery.application + 8);
    mastery.understanding = Math.min(100, mastery.understanding + 5);
    mastery.retention = Math.min(100, mastery.retention + 6);
    const daysToAdd = mastery.overallMastery > 80 ? 7 : 4;
    mastery.nextReviewDate = new Date(Date.now() + daysToAdd * 24 * 3600 * 1000).toISOString();
  } else {
    mastery.incorrectCount += 1;
    mastery.accuracy = Math.round((mastery.correctCount / mastery.attemptsCount) * 100);
    mastery.application = Math.max(10, mastery.application - 10);
    mastery.retention = Math.max(10, mastery.retention - 12);

    if (mistakeCategory === 'CONCEPT_GAP') {
      mastery.understanding = Math.max(10, mastery.understanding - 15);
    }

    mastery.nextReviewDate = new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString();
  }

  mastery.overallMastery = Math.round(
    0.3 * mastery.understanding +
    0.25 * mastery.application +
    0.25 * mastery.accuracy +
    0.2 * mastery.retention
  );

  await learnerRepository.saveConceptMastery(userId, conceptId, mastery, client);
  await learnerRepository.saveRetentionState(userId, conceptId, mastery.retention, 0.05, client);

  // Update revision item in PostgreSQL if needed
  const isOverdue = mastery.nextReviewDate ? new Date(mastery.nextReviewDate).getTime() < Date.now() : true;
  if (isOverdue || mastery.retention < 70) {
    await revisionRepository.upsertRevisionItem(
      {
        userId,
        conceptId,
        retention: mastery.retention,
        priority: mastery.retention < 60 ? 'HIGH' : mastery.retention < 75 ? 'MEDIUM' : 'LOW',
        lastReviewedAt: mastery.lastReviewedAt,
        nextReviewDate: mastery.nextReviewDate,
        status: 'PENDING',
        mistakeReason: mistakeCategory ? `Category: ${mistakeCategory}` : 'Periodic practice',
      },
      client
    );
  }

  // Re-calculate user's aggregate LearnerModel
  await updateLearnerModel(userId, client);

  return mastery;
}

/**
 * Aggregates all user interactions to update the global LearnerModel
 */
export async function updateLearnerModel(userId: string, client?: PoolClient): Promise<LearnerModel> {
  const model = await learnerRepository.getLearnerModel(userId, client);
  const userMasteryList = await learnerRepository.getUserMasteries(userId, client);

  if (userMasteryList.length === 0) {
    model.lastUpdated = new Date().toISOString();
    return await learnerRepository.saveLearnerModel(model, client);
  }

  let totalMasterySum = 0;
  let masteredCount = 0;
  let weakCount = 0;
  let dueCount = 0;
  let avgConfidence = 0;
  let avgAccuracy = 0;

  const subjectSums: Record<string, { sum: number; count: number }> = {};

  const executor = client || pool;
  const conceptIds = userMasteryList.map(m => m.conceptId);
  const conceptsRes = await executor.query(
    'SELECT id, subject_id FROM public.concepts WHERE id = ANY($1)',
    [conceptIds]
  );
  const conceptMap = new Map<string, { subject_id: string }>();
  conceptsRes.rows.forEach(r => conceptMap.set(r.id, { subject_id: r.subject_id }));

  userMasteryList.forEach(m => {
    totalMasterySum += m.overallMastery;
    avgConfidence += m.confidence;
    avgAccuracy += m.accuracy;

    if (m.overallMastery >= 80) masteredCount++;
    if (m.overallMastery < 65) weakCount++;

    const isOverdue = m.nextReviewDate ? new Date(m.nextReviewDate).getTime() < Date.now() : false;
    if (isOverdue || m.retention < 70) dueCount++;

    const concept = conceptMap.get(m.conceptId);
    if (concept && concept.subject_id) {
      if (!subjectSums[concept.subject_id]) {
        subjectSums[concept.subject_id] = { sum: 0, count: 0 };
      }
      subjectSums[concept.subject_id].sum += m.overallMastery;
      subjectSums[concept.subject_id].count += 1;
    }
  });

  const conceptCount = Math.max(1, userMasteryList.length);
  model.overallScore = Math.round(totalMasterySum / conceptCount);
  model.masteredConceptsCount = masteredCount;
  model.weakConceptsCount = weakCount;
  model.dueRevisionCount = dueCount;

  // Compute Confidence Bias
  const meanConf = avgConfidence / conceptCount;
  const meanAcc = avgAccuracy / conceptCount;
  if (meanConf - meanAcc > 15) {
    model.confidenceBias = 'OVERCONFIDENT';
  } else if (meanAcc - meanConf > 15) {
    model.confidenceBias = 'UNDERCONFIDENT';
  } else {
    model.confidenceBias = 'BALANCED';
  }

  // Compute Subject Mastery
  const subjectsRes = await executor.query('SELECT id FROM public.subjects');
  const subjectMasteryMap: Record<string, number> = {};
  subjectsRes.rows.forEach(s => {
    if (subjectSums[s.id]) {
      subjectMasteryMap[s.id] = Math.round(subjectSums[s.id].sum / subjectSums[s.id].count);
    } else {
      subjectMasteryMap[s.id] = 50;
    }
  });
  model.subjectMastery = subjectMasteryMap;
  model.lastUpdated = new Date().toISOString();

  return await learnerRepository.saveLearnerModel(model, client);
}

/**
 * CENTRAL INTELLIGENCE ENGINE: Determines the "Next Best Action" for a learner
 */
export async function getNextBestAction(userId: string): Promise<NextBestAction> {
  await updateLearnerModel(userId);
  const userMasteries = await learnerRepository.getUserMasteries(userId);

  const conceptIds = userMasteries.map(m => m.conceptId);
  const conceptsRes = conceptIds.length > 0
    ? await pool.query('SELECT * FROM public.concepts WHERE id = ANY($1)', [conceptIds])
    : { rows: [] };

  const conceptMap = new Map<string, any>();
  conceptsRes.rows.forEach(c => conceptMap.set(c.id, c));

  const prioritized = userMasteries.map(m => {
    const concept = conceptMap.get(m.conceptId);
    const isOverdue = m.nextReviewDate ? new Date(m.nextReviewDate).getTime() < Date.now() : false;
    const importanceWeight = concept?.importance === 'HIGH' ? 35 : concept?.importance === 'MEDIUM' ? 15 : 5;
    const mistakeWeight = m.incorrectCount * 8;
    const retentionWeight = (100 - m.retention) * 0.4;
    const overdueWeight = isOverdue ? 25 : 0;

    const priorityScore = retentionWeight + importanceWeight + mistakeWeight + overdueWeight;
    return { mastery: m, concept, priorityScore, isOverdue };
  }).sort((a, b) => b.priorityScore - a.priorityScore);

  if (prioritized.length > 0 && prioritized[0].concept) {
    const top = prioritized[0];
    const concept = top.concept;
    const m = top.mastery;

    if (top.isOverdue || m.retention < 65 || m.incorrectCount > 0) {
      return {
        id: `nba_${Date.now()}`,
        actionType: m.retention < 60 ? 'REVISE' : 'PRACTICE',
        title: `${m.retention < 60 ? 'Urgent Revision' : 'Targeted Practice'}: ${concept.title}`,
        description: `Retention decayed to ${m.retention}% with ${m.incorrectCount} recent mistake(s) in a High-Importance exam concept.`,
        reason: `Engine prioritized ${concept.title} because it combines High Exam Importance (${concept.importance}), Low Retention (${m.retention}%), and recent mistake history.`,
        estimatedMinutes: 12,
        subjectId: concept.subject_id,
        topicId: concept.topic_id,
        conceptId: concept.id,
        priority: 'URGENT',
        followUpAction: `Complete 5 targeted application MCQs on ${concept.title}.`,
      };
    }
  }

  // 2. Check for Concept Confusion or Overconfidence
  const confusedConcept = userMasteries.find(m => m.confusionPartners && m.confusionPartners.length > 0);
  if (confusedConcept) {
    const partnerId = confusedConcept.confusionPartners![0];
    const res2 = await pool.query('SELECT * FROM public.concepts WHERE id = ANY($1)', [[confusedConcept.conceptId, partnerId]]);
    const cMap2 = new Map(res2.rows.map(r => [r.id, r]));
    const conceptA = cMap2.get(confusedConcept.conceptId);
    const conceptB = cMap2.get(partnerId);

    if (conceptA && conceptB) {
      const cA = conceptA as any;
      const cB = conceptB as any;
      return {
        id: `nba_${Date.now()}`,
        actionType: 'PRACTICE',
        title: `Resolve Distinction: ${cA.title.split(':')[0]} vs ${cB.title.split(':')[0]}`,
        description: `You have repeatedly confused these two related concepts in past attempts.`,
        reason: `Mistake pattern intelligence identified a high error correlation between ${cA.title} and ${cB.title}.`,
        estimatedMinutes: 10,
        subjectId: cA.subject_id,
        conceptId: cA.id,
        priority: 'HIGH',
        followUpAction: `Complete a 5-question comparison drill to solidify the key differences.`,
      };
    }
  }

  // 3. Check for Weakest Subject / Concept
  const weakMastery = userMasteries.sort((a, b) => a.overallMastery - b.overallMastery)[0];
  if (weakMastery) {
    const res3 = await pool.query('SELECT * FROM public.concepts WHERE id = $1', [weakMastery.conceptId]);
    const concept = res3.rows[0];
    if (concept) {
      return {
        id: `nba_${Date.now()}`,
        actionType: 'PRACTICE',
        title: `Adaptive Practice: ${concept.title}`,
        description: `Your mastery in this core concept stands at ${weakMastery.overallMastery}%.`,
        reason: `Targeted practice will boost your application score and elevate your overall subject score.`,
        estimatedMinutes: 15,
        subjectId: concept.subject_id,
        conceptId: concept.id,
        priority: 'HIGH',
        followUpAction: `Review key points if accuracy remains below 70%.`,
      };
    }
  }

  // Fallback default recommendation from PostgreSQL
  const defaultRes = await pool.query('SELECT * FROM public.concepts WHERE id = $1 LIMIT 1', ['c_art21']);
  const defaultConcept = defaultRes.rows[0] || (await pool.query('SELECT * FROM public.concepts LIMIT 1')).rows[0];

  if (!defaultConcept) {
    return {
      id: `nba_${Date.now()}`,
      actionType: 'LEARN',
      title: 'Deep Dive: Core Concepts',
      description: 'Build strong foundational clarity.',
      reason: 'Regular concept learning keeps your knowledge graph connected and active.',
      estimatedMinutes: 15,
      subjectId: 'sub_polity',
      conceptId: 'c_art21',
      priority: 'MEDIUM',
      followUpAction: 'Attempt practice questions to build mastery.',
    };
  }

  return {
    id: `nba_${Date.now()}`,
    actionType: 'LEARN',
    title: `Deep Dive: ${defaultConcept.title}`,
    description: `Build strong foundational clarity on Part III Fundamental Rights.`,
    reason: `Regular concept learning keeps your knowledge graph connected and active.`,
    estimatedMinutes: 15,
    subjectId: defaultConcept.subject_id,
    conceptId: defaultConcept.id,
    priority: 'MEDIUM',
    followUpAction: `Rate your confidence and attempt 3 practice questions.`,
  };
}

/**
 * Returns the spaced-repetition revision queue for a user directly from PostgreSQL
 */
export async function getRevisionQueue(userId: string): Promise<RevisionItem[]> {
  return await revisionRepository.getRevisionQueue(userId);
}
