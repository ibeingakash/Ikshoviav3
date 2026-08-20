import { getAIClient } from '../ai.js';
import { currentAffairsRepository, CurrentAffairRecord } from '../repositories/CurrentAffairsRepository.js';
import { questionRepository } from '../repositories/QuestionRepository.js';

export interface EnrichmentResult {
  success: boolean;
  article: CurrentAffairRecord;
  generatedQuestionId?: string;
  error?: string;
}

export class CurrentAffairsAiService {
  async enrichArticle(articleId: string, autoPublish = true): Promise<EnrichmentResult> {
    const article = await currentAffairsRepository.getArticleById(articleId);
    if (!article) {
      throw new Error(`Current Affair article ${articleId} not found.`);
    }

    const ai = getAIClient();
    if (!ai) {
      // Gemini API key unavailable; mark for review without losing original source content
      const updated = await currentAffairsRepository.updateArticle(articleId, {
        status: 'REVIEW_REQUIRED',
        isPublished: autoPublish,
      });
      return {
        success: false,
        article: updated || article,
        error: 'Gemini API key is not configured. Article saved in raw state for manual review.',
      };
    }

    const prompt = `
You are an elite Civil Services Exam Expert analyzing a current event for UPSC CSE and BPSC (Bihar Public Service Commission).

ARTICLE TO ANALYZE:
Title: ${article.title}
Source: ${article.source} (${article.sourceUrl || 'N/A'})
Content: ${article.rawContent || article.background || article.summary}

TASK:
Extract structured exam intelligence from this article and output valid JSON ONLY with no markdown backticks.

REQUIRED JSON FORMAT:
{
  "summary": "2-3 sentence crisp exam-oriented summary.",
  "background": "Why it matters and contextual background.",
  "category": "One of: Polity & Governance, Economy, International Relations, Environment, Science & Tech, Internal Security, Social Issues, Bihar Current Affairs, Reports & Indices",
  "subtopic": "Specific subtopic e.g. Fundamental Rights, Monetary Policy, River Linking",
  "examRelevance": "UPSC, BPSC, or BOTH",
  "prelimsRelevance": "HIGH, MEDIUM, or LOW",
  "mainsRelevance": "HIGH, MEDIUM, or LOW",
  "biharRelevance": "Provide specific Bihar context/relevance if applicable (e.g. for BPSC), else null",
  "prelimsPointers": [
    "Constitutional provisions/Articles involved",
    "Institutions/Bodies mentioned",
    "Geographical locations or rivers",
    "Key figures/dates/thresholds"
  ],
  "mainsDimensions": {
    "background": "Contextual origin",
    "significance": "Key importance for governance/economy",
    "challenges": "Primary concerns or bottlenecks",
    "wayForward": "Actionable policy suggestions"
  },
  "keyFacts": ["Fact 1", "Fact 2", "Fact 3"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "relatedSubject": "sub_polity, sub_economy, sub_env, sub_st, or sub_history",
  "relatedConceptIds": ["c_art32", "c_mpc"],
  "generatedQuestion": {
    "question": "A high-quality Prelims statement-based or direct MCQ based on this article.",
    "options": [
      {"id": "0", "text": "Option A"},
      {"id": "1", "text": "Option B"},
      {"id": "2", "text": "Option C"},
      {"id": "3", "text": "Option D"}
    ],
    "correctAnswer": "0",
    "explanation": "Detailed explanation grounding the correct answer in the article facts."
  }
}
`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text?.trim() || '';
      const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
      const parsed = JSON.parse(cleanJson);

      const updates: Partial<CurrentAffairRecord> = {
        summary: parsed.summary || article.summary,
        background: parsed.background || article.background,
        category: parsed.category || article.category,
        subtopic: parsed.subtopic || article.subtopic,
        examRelevance: (['UPSC', 'BPSC', 'BOTH'].includes(parsed.examRelevance) ? parsed.examRelevance : 'BOTH') as any,
        prelimsRelevance: parsed.prelimsRelevance || 'HIGH',
        mainsRelevance: parsed.mainsRelevance || 'HIGH',
        biharRelevance: parsed.biharRelevance || undefined,
        prelimsPointers: Array.isArray(parsed.prelimsPointers) ? parsed.prelimsPointers : [],
        mainsDimensions: typeof parsed.mainsDimensions === 'object' ? parsed.mainsDimensions : {},
        keyFacts: Array.isArray(parsed.keyFacts) ? parsed.keyFacts : [],
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        relatedSubject: parsed.relatedSubject || 'sub_polity',
        relatedConceptIds: Array.isArray(parsed.relatedConceptIds) ? parsed.relatedConceptIds : [],
        status: autoPublish ? 'PUBLISHED' : 'REVIEW_REQUIRED',
        isPublished: autoPublish,
      };

      const updatedArticle = await currentAffairsRepository.updateArticle(articleId, updates);

      // Handle generated MCQ persistence if present
      let generatedQuestionId: string | undefined;
      if (parsed.generatedQuestion && parsed.generatedQuestion.question) {
        const gq = parsed.generatedQuestion;
        const qId = `q_ca_${articleId}_${Date.now()}`;
        await questionRepository.create({
          id: qId,
          subjectId: updates.relatedSubject || 'sub_polity',
          topicId: 'top_current_affairs',
          conceptId: updates.relatedConceptIds?.[0] || 'c_ca_general',
          type: 'MCQ',
          question: gq.question,
          options: gq.options || [
            { id: '0', text: 'Statement 1 only' },
            { id: '1', text: 'Statement 2 only' },
            { id: '2', text: 'Both 1 and 2' },
            { id: '3', text: 'Neither 1 nor 2' },
          ],
          correctAnswer: String(gq.correctAnswer ?? '0'),
          explanation: gq.explanation || `Based on current affairs article: ${article.title}`,
          difficulty: 'MEDIUM',
          examTag: updates.examRelevance === 'BPSC' ? 'BPSC Prelims' : 'UPSC CSE Prelims',
          isPublished: true,
          status: 'PUBLISHED',
          source: 'AI_GENERATED',
          currentAffairId: articleId,
        });
        generatedQuestionId = qId;
      }

      return {
        success: true,
        article: updatedArticle || article,
        generatedQuestionId,
      };
    } catch (err: any) {
      console.warn(`[CurrentAffairsAiService] AI Enrichment bypassed or quota exhausted for article ${articleId}: ${err.message}. Preserving original article.`);
      return {
        success: false,
        article,
        error: `AI Enrichment bypassed: ${err.message}`,
      };
    }
  }

  async batchEnrichIngestedArticles(): Promise<{ processedCount: number; successCount: number; failCount: number }> {
    const unEnriched = await currentAffairsRepository.listArticles({
      status: 'INGESTED',
      isPublished: false,
      limit: 20,
    });

    let successCount = 0;
    let failCount = 0;

    for (const art of unEnriched) {
      const res = await this.enrichArticle(art.id, true);
      if (res.success) successCount++;
      else failCount++;
    }

    return {
      processedCount: unEnriched.length,
      successCount,
      failCount,
    };
  }
}

export const currentAffairsAiService = new CurrentAffairsAiService();
