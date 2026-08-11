import { db } from './db.js';
import {
  ConceptMastery,
  LearnerModel,
  NextBestAction,
  QuestionAttempt,
  RevisionItem,
  MistakeCategory,
} from '../src/types/index.js';

/**
 * Recalculates concept mastery for a user after a learning event or question attempt.
 */
export function recordQuestionAttempt(
  userId: string,
  conceptId: string,
  isCorrect: boolean,
  timeSpentSeconds: number,
  confidenceRating: number, // 1 to 5
  mistakeCategory?: MistakeCategory
): ConceptMastery {
  const key = `${userId}_${conceptId}`;
  let mastery = db.mastery.get(key);

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
    // Boost application, accuracy, understanding, retention
    mastery.accuracy = Math.round((mastery.correctCount / mastery.attemptsCount) * 100);
    mastery.application = Math.min(100, mastery.application + 8);
    mastery.understanding = Math.min(100, mastery.understanding + 5);
    mastery.retention = Math.min(100, mastery.retention + 6);
    // Push next review date further (spaced repetition expansion)
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

    // Schedule review urgently (tomorrow or in 2 days)
    mastery.nextReviewDate = new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString();
  }

  // Overall mastery weighted formula:
  // 30% Understanding + 25% Application + 25% Accuracy + 20% Retention
  mastery.overallMastery = Math.round(
    0.3 * mastery.understanding +
    0.25 * mastery.application +
    0.25 * mastery.accuracy +
    0.2 * mastery.retention
  );

  db.mastery.set(key, mastery);

  // Re-calculate user's aggregate LearnerModel
  updateLearnerModel(userId);

  return mastery;
}

/**
 * Aggregates all user interactions to update the global LearnerModel
 */
export function updateLearnerModel(userId: string): LearnerModel {
  let model = db.learnerModels.get(userId);
  if (!model) {
    model = {
      userId,
      overallScore: 60,
      totalStudyTimeMinutes: 0,
      currentStreak: 1,
      highestStreak: 1,
      activeDaysCount: 1,
      confidenceBias: 'BALANCED',
      mistakeBreakdown: {
        CONCEPT_GAP: 0,
        RECALL_FAILURE: 0,
        CONCEPT_CONFUSION: 0,
        MISINTERPRETATION: 0,
        CARELESS_ERROR: 0,
        TIME_PRESSURE: 0,
      },
      subjectMastery: {},
      masteredConceptsCount: 0,
      weakConceptsCount: 0,
      dueRevisionCount: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  // Calculate subject mastery and counts from user's concept mastery records
  const userMasteryList: ConceptMastery[] = [];
  db.mastery.forEach((m, key) => {
    if (key.startsWith(`${userId}_`)) {
      userMasteryList.push(m);
    }
  });

  let totalMasterySum = 0;
  let masteredCount = 0;
  let weakCount = 0;
  let dueCount = 0;
  let avgConfidence = 0;
  let avgAccuracy = 0;

  const subjectSums: Record<string, { sum: number; count: number }> = {};

  userMasteryList.forEach(m => {
    totalMasterySum += m.overallMastery;
    avgConfidence += m.confidence;
    avgAccuracy += m.accuracy;

    if (m.overallMastery >= 80) masteredCount++;
    if (m.overallMastery < 65) weakCount++;

    if (m.nextReviewDate && new Date(m.nextReviewDate).getTime() < Date.now()) {
      dueCount++;
    }

    const concept = db.concepts.get(m.conceptId);
    if (concept) {
      if (!subjectSums[concept.subjectId]) {
        subjectSums[concept.subjectId] = { sum: 0, count: 0 };
      }
      subjectSums[concept.subjectId].sum += m.overallMastery;
      subjectSums[concept.subjectId].count += 1;
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
  const subjectMasteryMap: Record<string, number> = {};
  db.subjects.forEach(s => {
    if (subjectSums[s.id]) {
      subjectMasteryMap[s.id] = Math.round(subjectSums[s.id].sum / subjectSums[s.id].count);
    } else {
      subjectMasteryMap[s.id] = 50; // default initial baseline
    }
  });
  model.subjectMastery = subjectMasteryMap;
  model.lastUpdated = new Date().toISOString();

  db.learnerModels.set(userId, model);
  return model;
}

/**
 * CENTRAL INTELLIGENCE ENGINE: Determines the "Next Best Action" for a learner
 */
export function getNextBestAction(userId: string): NextBestAction {
  const model = db.learnerModels.get(userId) || updateLearnerModel(userId);
  const userMasteries: ConceptMastery[] = [];
  db.mastery.forEach((m, key) => {
    if (key.startsWith(`${userId}_`)) {
      userMasteries.push(m);
    }
  });

  // 1. Check for Overdue Revision (Priority 1)
  const overdueMasteries = userMasteries.filter(m => {
    return m.nextReviewDate && new Date(m.nextReviewDate).getTime() < Date.now();
  }).sort((a, b) => a.retention - b.retention); // lowest retention first

  if (overdueMasteries.length > 0) {
    const worstConceptMastery = overdueMasteries[0];
    const concept = db.concepts.get(worstConceptMastery.conceptId);
    if (concept) {
      return {
        id: `nba_${Date.now()}`,
        actionType: 'REVISE',
        title: `Revise: ${concept.title}`,
        description: `Your retention for this concept has decayed to ${worstConceptMastery.retention}%.`,
        reason: `Spaced repetition algorithm flagged this concept because it was last reviewed ${Math.round((Date.now() - new Date(worstConceptMastery.lastReviewedAt || Date.now()).getTime()) / (1000 * 3600 * 24))} days ago and shows retention decay.`,
        estimatedMinutes: 12,
        subjectId: concept.subjectId,
        topicId: concept.topicId,
        conceptId: concept.id,
        priority: 'URGENT',
        followUpAction: `Attempt 5 targeted application questions on ${concept.title}.`,
      };
    }
  }

  // 2. Check for Concept Confusion or Overconfidence
  const confusedConcept = userMasteries.find(m => m.confusionPartners && m.confusionPartners.length > 0);
  if (confusedConcept) {
    const conceptA = db.concepts.get(confusedConcept.conceptId);
    const partnerId = confusedConcept.confusionPartners![0];
    const conceptB = db.concepts.get(partnerId);

    if (conceptA && conceptB) {
      return {
        id: `nba_${Date.now()}`,
        actionType: 'PRACTICE',
        title: `Resolve Distinction: ${conceptA.title.split(':')[0]} vs ${conceptB.title.split(':')[0]}`,
        description: `You have repeatedly confused these two related concepts in past attempts.`,
        reason: `Mistake pattern intelligence identified a high error correlation between ${conceptA.title} and ${conceptB.title}.`,
        estimatedMinutes: 10,
        subjectId: conceptA.subjectId,
        conceptId: conceptA.id,
        priority: 'HIGH',
        followUpAction: `Complete a 5-question comparison drill to solidify the key differences.`,
      };
    }
  }

  // 3. Check for Weakest Subject / Concept
  const weakMastery = userMasteries.sort((a, b) => a.overallMastery - b.overallMastery)[0];
  if (weakMastery) {
    const concept = db.concepts.get(weakMastery.conceptId);
    if (concept) {
      return {
        id: `nba_${Date.now()}`,
        actionType: 'PRACTICE',
        title: `Adaptive Practice: ${concept.title}`,
        description: `Your mastery in this core concept stands at ${weakMastery.overallMastery}%.`,
        reason: `Targeted practice will boost your application score and elevate your overall subject score.`,
        estimatedMinutes: 15,
        subjectId: concept.subjectId,
        conceptId: concept.id,
        priority: 'HIGH',
        followUpAction: `Review key points if accuracy remains below 70%.`,
      };
    }
  }

  // Fallback default recommendation
  const defaultConcept = db.concepts.get('c_art21') || Array.from(db.concepts.values())[0];
  return {
    id: `nba_${Date.now()}`,
    actionType: 'LEARN',
    title: `Deep Dive: ${defaultConcept.title}`,
    description: `Build strong foundational clarity on Part III Fundamental Rights.`,
    reason: `Regular concept learning keeps your knowledge graph connected and active.`,
    estimatedMinutes: 15,
    subjectId: defaultConcept.subjectId,
    conceptId: defaultConcept.id,
    priority: 'MEDIUM',
    followUpAction: `Rate your confidence and attempt 3 practice questions.`,
  };
}

/**
 * Returns the spaced-repetition revision queue for a user
 */
export function getRevisionQueue(userId: string): RevisionItem[] {
  const queue: RevisionItem[] = [];

  db.mastery.forEach((m, key) => {
    if (key.startsWith(`${userId}_`)) {
      const concept = db.concepts.get(m.conceptId);
      if (concept) {
        const daysSinceLast = m.lastReviewedAt
          ? Math.max(0, Math.round((Date.now() - new Date(m.lastReviewedAt).getTime()) / (1000 * 3600 * 24)))
          : 5;

        const isOverdue = m.nextReviewDate ? new Date(m.nextReviewDate).getTime() < Date.now() : true;

        if (isOverdue || m.retention < 70) {
          const subject = db.subjects.get(concept.subjectId);
          queue.push({
            conceptId: concept.id,
            conceptTitle: concept.title,
            subjectName: subject?.name || 'General',
            retention: m.retention,
            priority: m.retention < 60 ? 'HIGH' : m.retention < 75 ? 'MEDIUM' : 'LOW',
            daysSinceLastReview: daysSinceLast,
            estimatedMinutes: 10,
            mistakeReason: m.confusionPartners && m.confusionPartners.length > 0
              ? `Confusing with ${db.concepts.get(m.confusionPartners[0])?.title || 'related concept'}`
              : m.retention < 60
              ? 'Retention decay over time'
              : 'Periodic refresher',
          });
        }
      }
    }
  });

  return queue.sort((a, b) => a.retention - b.retention);
}
