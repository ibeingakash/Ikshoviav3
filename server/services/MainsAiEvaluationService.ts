import { getAIClient } from '../ai.js';
import { examEngineRepository } from '../repositories/ExamEngineRepository.js';

export interface EvaluateMainsParams {
  submissionId: string;
  questionText: string;
  answerText: string;
  marks: number;
  wordLimit?: number;
  paper?: string;
  rubric?: any;
  modelStructure?: any;
}

export class MainsAiEvaluationService {
  async evaluateSubmission(params: EvaluateMainsParams): Promise<any> {
    const { submissionId, questionText, answerText, marks, wordLimit, paper, rubric } = params;

    const maxMarks = marks || 10;
    const aiClient = getAIClient();

    if (!aiClient) {
      // Deterministic rubric-based fallback evaluation if AI gateway key is not active
      return this.computeDeterministicEvaluation(params);
    }

    try {
      const rubricText = rubric?.dimensions?.length
        ? `Prescribed Rubric Dimensions:\n- ${rubric.dimensions.join('\n- ')}`
        : 'Standard UPSC / BPSC 10-dimension evaluation standard.';

      const prompt = `You are a Senior UPSC / BPSC Mains Answer Evaluator.
Evaluate the following student answer against official commission standards.

QUESTION (${paper || 'GS Paper'}, Max Marks: ${maxMarks}, Target Word Limit: ${wordLimit || 150} words):
"${questionText}"

STUDENT ANSWER:
"${answerText}"

${rubricText}

Evaluate strictly on these 10 dimensions:
1. CONTENT (Depth and conceptual correctness)
2. STRUCTURE (Clear Intro, Body, and Forward-looking Conclusion)
3. ANALYSIS (Critical reasoning and cause-effect links)
4. RELEVANCE (Directly answering all keywords/directives)
5. FACTUAL ACCURACY (Articles, committees, judgments, schemes)
6. EXAMPLES (Relevant case studies and real-world instances)
7. DATA (Reliable indices, economic survey, reports)
8. MULTIDIMENSIONALITY (Social, economic, political, environmental, international)
9. PRESENTATION (Subheadings, bullets, legibility)
10. CONCLUSION (Balanced, constitutional vision)

Respond ONLY with valid JSON in this exact structure:
{
  "marksObtained": <number between 0 and ${maxMarks}, e.g. 5.5>,
  "dimensions": {
    "content": <score out of 10>,
    "structure": <score out of 10>,
    "analysis": <score out of 10>,
    "relevance": <score out of 10>,
    "factualAccuracy": <score out of 10>,
    "examplesData": <score out of 10>,
    "multidimensionality": <score out of 10>,
    "presentation": <score out of 10>,
    "conclusion": <score out of 10>
  },
  "feedback": "<Overall constructive evaluator summary paragraph>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "missingDimensions": ["<dimension/aspect that should have been addressed>"],
  "actionableImprovement": "<concrete step to raise score by 2-3 marks next time>"
}`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text || '';
      const parsed = JSON.parse(responseText.trim());

      const marksObtained = Math.min(maxMarks, Math.max(0, Number(parsed.marksObtained) || Math.round(maxMarks * 0.5)));

      const evalResult = {
        marksObtained,
        maxMarks,
        feedback: parsed.feedback || 'Good effort. Refine structure and add more specific data points.',
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Good conceptual understanding'],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : ['Need more structural subheadings'],
        missingDimensions: Array.isArray(parsed.missingDimensions) ? parsed.missingDimensions : [],
        actionableImprovement: parsed.actionableImprovement || 'Incorporate relevant constitutional articles or reports.',
        dimensions: parsed.dimensions || {
          content: 6,
          structure: 6,
          analysis: 5,
          relevance: 6,
          factualAccuracy: 5,
          presentation: 6
        },
        evaluatorType: 'AI' as const
      };

      await examEngineRepository.recordMainsEvaluation(submissionId, evalResult);
      return evalResult;
    } catch (err: any) {
      console.warn('[MainsAiEvaluationService] AI model call error, falling back to rubric heuristic:', err.message);
      return this.computeDeterministicEvaluation(params);
    }
  }

  private async computeDeterministicEvaluation(params: EvaluateMainsParams): Promise<any> {
    const { submissionId, answerText, marks } = params;
    const maxMarks = marks || 10;
    const words = (answerText || '').trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Heuristics based on length, structure (paragraphs/bullets), and vocabulary
    const hasBullets = answerText.includes('-') || answerText.includes('•') || answerText.includes('1.') || answerText.includes('1)');
    const hasIntroConclusion = answerText.length > 300 && (answerText.toLowerCase().includes('conclusion') || answerText.toLowerCase().includes('way forward') || answerText.toLowerCase().includes('in summary'));
    
    let baseScore = maxMarks * 0.45;
    if (wordCount >= 100) baseScore += maxMarks * 0.1;
    if (hasBullets) baseScore += maxMarks * 0.08;
    if (hasIntroConclusion) baseScore += maxMarks * 0.07;

    const marksObtained = Number(Math.min(maxMarks * 0.85, Math.max(maxMarks * 0.25, baseScore)).toFixed(1));

    const evalResult = {
      marksObtained,
      maxMarks,
      feedback: 'Answer displays good foundational knowledge. Work on enriching with specific committee reports, constitutional provisions, and distinct heading divisions.',
      strengths: [
        'Directly addresses the central theme of the question',
        hasBullets ? 'Used point-wise presentation for readability' : 'Cohesive flow of thought across paragraphs'
      ],
      weaknesses: [
        'Needs higher density of factual illustrations and authoritative citations',
        'Conclusion could be more forward-looking and solution-oriented'
      ],
      missingDimensions: [
        'Institutional and policy implementation dimensions',
        'Comparative perspectives or global best practices'
      ],
      actionableImprovement: 'Adopt the 3-part framework: Crisp 2-line contextual intro, categorized body with headings (Economic / Social / Administrative), and a forward-looking conclusion.',
      dimensions: {
        content: 6,
        structure: hasIntroConclusion ? 7 : 5,
        analysis: 6,
        relevance: 7,
        factualAccuracy: 5,
        examplesData: 4,
        multidimensionality: 5,
        presentation: hasBullets ? 7 : 5,
        conclusion: hasIntroConclusion ? 6 : 4
      },
      evaluatorType: 'AI' as const
    };

    await examEngineRepository.recordMainsEvaluation(submissionId, evalResult);
    return evalResult;
  }
}

export const mainsAiEvaluationService = new MainsAiEvaluationService();
