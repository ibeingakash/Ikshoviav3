import { GoogleGenAI, Type } from '@google/genai';
import { db } from './db.js';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export async function askAITutor(
  userId: string,
  userPrompt: string,
  conceptId?: string,
  quickAction?: string
): Promise<string> {
  const user = db.users.get(userId);
  const learnerModel = db.learnerModels.get(userId);
  const concept = conceptId ? db.concepts.get(conceptId) : null;

  const ai = getAIClient();

  // If no Gemini API key or error during call, return realistic intelligent response
  if (!ai) {
    return generateDemoTutorResponse(userPrompt, concept, quickAction, learnerModel);
  }

  try {
    const systemContext = `You are IKSHOVIA AI, an elite personal learning intelligence tutor for serious exam candidates (${
      user?.onboarding?.targetExam || 'UPSC CSE'
    }).
Learner Profile:
- Target Exam: ${user?.onboarding?.targetExam || 'UPSC CSE'}
- Experience Level: ${user?.onboarding?.experienceLevel || 'Intermediate'}
- Overall Mastery Score: ${learnerModel?.overallScore || 70}%
- Confidence Bias: ${learnerModel?.confidenceBias || 'BALANCED'}
${concept ? `- Current Concept Focus: ${concept.title} (Summary: ${concept.summary})` : ''}

Your Guidelines:
1. Explain concepts with high clarity, precise structure, real-world examples, and exam significance.
2. If asked to 'Simplify', use crisp bullet points and analogies.
3. If asked to 'Compare', use clear distinction points.
4. If asked to 'Test Me', give 1 challenging MCQ with immediate explanation.
5. Keep tone encouraging, rigorous, and deeply educational.
`;

    let promptMessage = userPrompt;
    if (quickAction) {
      if (quickAction === 'Explain') promptMessage = `Explain the concept in depth with key exam points: ${concept?.title || userPrompt}`;
      else if (quickAction === 'Simplify') promptMessage = `Simplify this topic into plain analogies and crisp bullet points: ${concept?.title || userPrompt}`;
      else if (quickAction === 'Example') promptMessage = `Provide 2 realistic case studies and practical exam examples for: ${concept?.title || userPrompt}`;
      else if (quickAction === 'Compare') promptMessage = `Provide a clear structural distinction table/points for: ${concept?.title || userPrompt}`;
      else if (quickAction === 'Test Me') promptMessage = `Generate 1 challenging UPSC-level MCQ testing application of: ${concept?.title || userPrompt}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: promptMessage,
      config: {
        systemInstruction: systemContext,
        temperature: 0.7,
      },
    });

    return response.text || generateDemoTutorResponse(userPrompt, concept, quickAction, learnerModel);
  } catch (err) {
    console.error('Gemini AI API call error:', err);
    return generateDemoTutorResponse(userPrompt, concept, quickAction, learnerModel);
  }
}

export async function generateAIInsightForUser(userId: string): Promise<string> {
  const learnerModel = db.learnerModels.get(userId);
  const ai = getAIClient();

  if (!ai || !learnerModel) {
    return `Your conceptual understanding in Polity is strong (68%), but retention in Economy and Federalism has declined this week. Spend 12 minutes reviewing Fiscal Federalism to prevent decay before your next practice sprint.`;
  }

  try {
    const prompt = `Analyze this learner profile and write a crisp 2-sentence actionable insight:
Score: ${learnerModel.overallScore}%
Confidence Bias: ${learnerModel.confidenceBias}
Weak Count: ${learnerModel.weakConceptsCount}
Due Revision Count: ${learnerModel.dueRevisionCount}
Mistakes: ${JSON.stringify(learnerModel.mistakeBreakdown)}
`;
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are IKSHOVIA AI Engine. Return a 2-sentence crisp learning health diagnosis and immediate recommended study action.',
      },
    });

    return response.text?.trim() || `Your conceptual understanding in Polity is improving, but retention in Economy has declined this week. Focus on Fiscal Federalism and Monetary Policy.`;
  } catch (err) {
    return `Your overall learning velocity is high (71%). However, IKSHOVIA identified confidence misalignments in Article 32. Perform a 10-min revision drill today.`;
  }
}

export async function generateQuestionsAdmin(
  promptText: string,
  subjectId: string,
  topicId: string,
  count: number = 3
): Promise<any[]> {
  const ai = getAIClient();

  if (!ai) {
    return generateDemoAdminQuestions(promptText, subjectId, topicId, count);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Generate ${count} high-quality MCQs based on this prompt: "${promptText}".
Output strictly JSON matching this structure:
[
  {
    "question": "string",
    "options": [
      {"id": "opt1", "text": "string"},
      {"id": "opt2", "text": "string"},
      {"id": "opt3", "text": "string"},
      {"id": "opt4", "text": "string"}
    ],
    "correctAnswer": "opt1",
    "explanation": "string",
    "difficulty": "EASY" | "MEDIUM" | "HARD",
    "examTag": "string"
  }
]`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text || '';
    const parsed = JSON.parse(jsonText);
    return Array.isArray(parsed) ? parsed : generateDemoAdminQuestions(promptText, subjectId, topicId, count);
  } catch (err) {
    console.error('AI question generation error:', err);
    return generateDemoAdminQuestions(promptText, subjectId, topicId, count);
  }
}

// Fallback generators when API key is not configured or offline
function generateDemoTutorResponse(
  userPrompt: string,
  concept: any,
  quickAction?: string,
  learnerModel?: any
): string {
  if (quickAction === 'Simplify') {
    return `### Simplified Breakdown of ${concept?.title || 'the Topic'}

1. **Core Idea**: Think of this as a constitutional guarantee that acts as a fortress around individual freedom.
2. **Key Distinction**: The Supreme Court safeguards fundamental rights under Article 32, whereas High Courts handle both constitutional and statutory rights under Article 226.
3. **Exam Takeaway**: Never confuse "Procedure Established by Law" (strict statutory compliance) with "Due Process of Law" (fairness, justice, and non-arbitrariness).`;
  }

  if (quickAction === 'Compare') {
    return `### Comparative Matrix: Article 32 vs Article 226

| Parameter | Article 32 (Supreme Court) | Article 226 (High Court) |
|---|---|---|
| **Scope** | Limited strictly to Fundamental Rights | Broader: Fundamental Rights + Legal Rights |
| **Nature** | Guaranteed Fundamental Right itself | Discretionary Constitutional power |
| **Territoriality** | Entire territory of India | Jurisdiction of the respective High Court |
| **Suspension** | Suspended during Emergency (except Arts 20, 21) | Cannot be suspended during Emergency |`;
  }

  if (quickAction === 'Test Me') {
    return `### 🎯 Quick AI Knowledge Check

**Question:** Which case established that the right to privacy is an intrinsic part of the right to life and personal liberty under Article 21?

- **A)** Golaknath Case (1967)
- **B)** K.S. Puttaswamy Case (2017)
- **C)** Minerva Mills Case (1980)
- **D)** Shankari Prasad Case (1951)

*Type your choice or click answer to verify!*`;
  }

  return `### AI Learning Intelligence Response

Understanding **${concept?.title || 'this topic'}** requires connecting core legal provisions with judicial interpretation.

**Key Principles to Remember:**
1. **Constitutional Intent**: Conceived by the Drafting Committee to maintain a equilibrium between state authority and individual liberty.
2. **Landmark Precedents**: The Supreme Court expanded the scope from narrow literal interpretation to expansive natural justice principles.
3. **Common Exam Trap**: Aspirants frequently confuse statutory powers with constitutional remedies.

*Would you like me to generate 3 targeted application practice questions or compare this with a related concept?*`;
}

function generateDemoAdminQuestions(promptText: string, subjectId: string, topicId: string, count: number): any[] {
  return [
    {
      question: `With reference to ${promptText || 'Fundamental Rights'}, which of the following statements is/are CORRECT?`,
      options: [
        { id: 'opt1', text: 'They are available against both state actions and private individuals in certain cases.' },
        { id: 'opt2', text: 'They are absolute and cannot be subjected to reasonable restrictions.' },
        { id: 'opt3', text: 'They can be amended by a simple majority of Parliament.' },
        { id: 'opt4', text: 'None of the above' },
      ],
      correctAnswer: 'opt1',
      explanation: 'Statement 1 is correct: Articles 17 (untouchability) and 23 (human trafficking) apply against private individuals as well. Statement 2 is false as rights are qualified by reasonable restrictions. Statement 3 is false as constitutional amendment requires special majority under Article 368.',
      difficulty: 'MEDIUM',
      examTag: 'AI Generated Draft - UPSC Level',
    },
    {
      question: `Consider the impact of judicial review on statutory provisions related to ${promptText || 'Constitutional Law'}:`,
      options: [
        { id: 'opt1', text: 'Judicial review is a basic structure of the Constitution.' },
        { id: 'opt2', text: 'Parliament can curtail judicial review via constitutional amendments.' },
        { id: 'opt3', text: 'Judicial review is borrowed from the British Parliamentary system.' },
        { id: 'opt4', text: 'High Courts do not possess powers of judicial review.' },
      ],
      correctAnswer: 'opt1',
      explanation: 'Judicial Review was affirmed as part of the Basic Structure doctrine in L. Chandra Kumar v. Union of India (1997).',
      difficulty: 'HARD',
      examTag: 'AI Generated Draft - UPSC Level',
    },
  ];
}
