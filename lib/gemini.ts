import { GoogleGenerativeAI } from '@google/generative-ai';
import * as Sentry from '@sentry/react-native';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// Circuit breaker to stop hammering API when it's clearly down
let circuitBreakerOpen = false;
let circuitBreakerTime = 0;
const CIRCUIT_BREAKER_DURATION = 5 * 60 * 1000; // 5 minutes

function shouldUseCircuitBreaker(): boolean {
  if (circuitBreakerOpen && Date.now() - circuitBreakerTime > CIRCUIT_BREAKER_DURATION) {
    circuitBreakerOpen = false;
    console.log('Circuit breaker reset');
  }
  return circuitBreakerOpen;
}

function tripCircuitBreaker() {
  circuitBreakerOpen = true;
  circuitBreakerTime = Date.now();
  console.log('Circuit breaker tripped - stopping requests for 5 minutes');
}

function extractJsonFromResponse(text: string): any | null {
  // Try to find JSON inside markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // fall through
    }
  }

  // Try to find the first JSON object in the text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // fall through
    }
  }

  // Try parsing the whole text
  try {
    return JSON.parse(text.trim());
  } catch {
    return null;
  }
}

async function callGeminiWithRetry(
  model: any,
  prompt: string,
  maxRetries = 5
): Promise<any | null> {
  // Check circuit breaker first
  if (shouldUseCircuitBreaker()) {
    return {
      error: "AI_SERVICE_UNAVAILABLE",
      message: "Our AI service is temporarily unavailable. Please try again in a few minutes."
    };
  }

  let consecutive503s = 0;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log('Raw Gemini response:', JSON.stringify(result).substring(0, 500));
      console.log(`Gemini raw response (attempt ${attempt}):`, text.substring(0, 500));

      const parsed = extractJsonFromResponse(text);
      if (parsed) {
        return parsed;
      }

      console.warn(`Attempt ${attempt}: Could not extract valid JSON`);
    } catch (error: any) {
      console.log('=== GEMINI ERROR ===');
      console.log('Error type:', typeof error);
      console.log('Error message:', error?.message);
      console.log('Error details:', JSON.stringify(error));
      const status = error?.status || error?.message?.match(/\[(\d+)/)?.[1];
      console.warn(`Attempt ${attempt} failed:`, status || error.message);
      Sentry.captureException(error);

      if (status === '503' || error?.message?.includes('high demand')) {
        consecutive503s++;
        
        if (attempt === maxRetries) {
          // Trip circuit breaker if all retries are 503s
          if (consecutive503s === maxRetries) {
            tripCircuitBreaker();
          }
          console.error('All retry attempts exhausted');
          return {
            error: "AI_SERVICE_UNAVAILABLE", 
            message: "Our AI service is temporarily unavailable. Please try again in a few minutes."
          };
        }
        
        // Exponential backoff: 2s, 4s, 8s, 16s with random jitter
        const baseDelay = Math.pow(2, attempt) * 1000;
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;
        console.log(`Retrying in ${Math.round(delay)}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      if (attempt === maxRetries) {
        console.error('All retry attempts exhausted');
        return null;
      }
    }
  }
  return null;
}

export async function generateFounderProfile(answers: Record<number, string>) {
  console.log('=== GEMINI DEBUG ===');
  console.log('API Key exists:', !!process.env.EXPO_PUBLIC_GEMINI_API_KEY);
  console.log('API Key prefix:', process.env.EXPO_PUBLIC_GEMINI_API_KEY?.substring(0, 12));
  console.log('Answers received:', JSON.stringify(answers));
  console.log('Answers count:', Object.keys(answers).length);

  if (!apiKey) {
    console.error('Gemini API key not found');
    return null;
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  console.log('Sending answers to Gemini:', JSON.stringify(answers, null, 2));

  const prompt = `
You're a brutally honest mentor who's seen thousands of founders succeed and fail. I need you to analyze this person's situation and tell them the uncomfortable truth about who they really are as a builder.

Here are their raw answers about themselves:
${JSON.stringify(answers, null, 2)}

CRITICAL: Do NOT quote their answers. Never say things like "You said 'I lost interest when results didn't come fast enough'." Instead, interpret what their answers reveal about them as a person. Speak like a mentor who's reviewed their entire situation and is giving them direct, uncomfortably accurate feedback.

Your summary should sound like this: "You've walked away from things before when traction didn't come quickly. That pattern will define whether you succeed at this venture - not your skills or your ideas."

Rules:
1. NEVER use single quotes around their answers. Interpret the meaning behind their responses.
2. Speak in natural, human language. No clinical analysis or psychological jargon.
3. Be direct and uncomfortably accurate about their patterns and tendencies.
4. The scores must reflect their actual situation - if they need income fast, score time-to-revenue accordingly.
5. Use these dimensions: skillMatch, lifestyleFit, toleranceFit, timeToRevenue, growthCeiling (0-100 each).

Return ONLY this JSON structure:
{
  "founderType": "string - their actual archetype",
  "summary": "string - brutally honest assessment without quoted answers",
  "matches": [
    {
      "model": "string - specific business model",
      "overallScore": number,
      "dimensions": {
        "skillMatch": number,
        "lifestyleFit": number,
        "toleranceFit": number,
        "timeToRevenue": number,
        "growthCeiling": number
      },
      "challenge": "string - their biggest obstacle with this model"
    }
  ]
}
    `;

  return await callGeminiWithRetry(model, prompt);
}

export async function generateNextLevelProfile(
  originalAnswers: Record<number, string>,
  nextLevelAnswers: Record<number, string>
) {
  if (!apiKey) {
    console.error('Gemini API key not found');
    return null;
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  console.log('Sending Next Level answers to Gemini:', {
    original: originalAnswers,
    nextLevel: nextLevelAnswers
  });

  const prompt = `
You're a brutally honest mentor who's seen thousands of founders succeed and fail. I need you to analyze this person's situation at a deeper level using both their initial assessment and their Next Level answers.

Here are their initial assessment answers (7 questions):
${JSON.stringify(originalAnswers, null, 2)}

Here are their Next Level answers (5 harder questions):
${JSON.stringify(nextLevelAnswers, null, 2)}

CRITICAL: Do NOT quote their answers. Never say things like "You said 'I lost interest when results didn't come fast enough'." Instead, interpret what their answers reveal about them as a person. Speak like a mentor who's reviewed their entire situation and is giving them direct, uncomfortably accurate feedback.

The Next Level answers reveal deeper patterns about their past failures, vision for success, risk tolerance, discomfort zones, and actual barriers to action. Use these to provide a more precise and nuanced assessment.

Your summary should sound like this: "You've walked away from things before when traction didn't come quickly. That pattern will define whether you succeed at this venture - not your skills or your ideas. Your Next Level answers show you've invested significant time in past attempts but struggle with..."

Rules:
1. NEVER use single quotes around their answers. Interpret the meaning behind their responses.
2. Speak in natural, human language. No clinical analysis or psychological jargon.
3. Be direct and uncomfortably accurate about their patterns and tendencies.
4. The scores must reflect their actual situation - if they need income fast, score time-to-revenue accordingly.
5. Use these dimensions: skillMatch, lifestyleFit, toleranceFit, timeToRevenue, growthCeiling (0-100 each).
6. The Next Level assessment should be more precise and nuanced than the initial assessment.

Return ONLY this JSON structure:
{
  "founderType": "string - their actual archetype (more precise than initial)",
  "summary": "string - brutally honest assessment without quoted answers, incorporating insights from both assessment rounds",
  "matches": [
    {
      "model": "string - specific business model",
      "overallScore": number,
      "dimensions": {
        "skillMatch": number,
        "lifestyleFit": number,
        "toleranceFit": number,
        "timeToRevenue": number,
        "growthCeiling": number
      },
      "challenge": "string - their biggest obstacle with this model (more specific based on Next Level answers)"
    }
  ],
  "archetypeComparison": {
    "initialType": "string - their initial FounderType",
    "nextLevelType": "string - their refined Next Level FounderType",
    "insight": "string - explanation of how the deeper assessment refined their type"
  }
}
  `;

  return await callGeminiWithRetry(model, prompt);
}

export async function generateActionPlan(answers: Record<number, string>, founderType: string, topMatch: any) {
  if (!apiKey) {
    console.error('Gemini API key not found');
    return null;
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  console.log('Generating action plan for:', { founderType, topMatch, answers });

  const prompt = `
You're creating a personalized 30-day action plan for a founder. Based on their profile:

Founder Type: ${founderType}
Top Business Model Match: ${topMatch.model || 'Unknown'}

Their answers reveal their patterns:
${JSON.stringify(answers, null, 2)}

Generate a 4-week action plan with 3 specific, measurable actions per week. Each action must be:
- Specific to their FounderType and business model
- Completable within that week
- Measurable (they know when it's done)
- Based on their actual answers and tendencies

CRITICAL: Do NOT quote their answers. Interpret what their answers mean and create actions accordingly.

Structure your response as JSON:
{
  "founderType": "${founderType}",
  "weeks": [
    {
      "week": 1,
      "title": "Week 1 - Validate (days 1-7)",
      "days": "days 1-7",
      "actions": [
        {
          "id": "week1_action1",
          "text": "Specific measurable action for validation phase",
          "completed": false
        },
        {
          "id": "week1_action2", 
          "text": "Another specific measurable action",
          "completed": false
        },
        {
          "id": "week1_action3",
          "text": "Third specific measurable action",
          "completed": false
        }
      ],
      "expanded": true
    },
    {
      "week": 2,
      "title": "Week 2 - Build (days 8-14)",
      "days": "days 8-14",
      "actions": [
        {
          "id": "week2_action1",
          "text": "Specific measurable action for build phase",
          "completed": false
        },
        {
          "id": "week2_action2",
          "text": "Another specific measurable action",
          "completed": false
        },
        {
          "id": "week2_action3",
          "text": "Third specific measurable action",
          "completed": false
        }
      ],
      "expanded": false
    },
    {
      "week": 3,
      "title": "Week 3 - Launch (days 15-21)",
      "days": "days 15-21",
      "actions": [
        {
          "id": "week3_action1",
          "text": "Specific measurable action for launch phase",
          "completed": false
        },
        {
          "id": "week3_action2",
          "text": "Another specific measurable action",
          "completed": false
        },
        {
          "id": "week3_action3",
          "text": "Third specific measurable action",
          "completed": false
        }
      ],
      "expanded": false
    },
    {
      "week": 4,
      "title": "Week 4 - Grow (days 22-30)",
      "days": "days 22-30",
      "actions": [
        {
          "id": "week4_action1",
          "text": "Specific measurable action for growth phase",
          "completed": false
        },
        {
          "id": "week4_action2",
          "text": "Another specific measurable action",
          "completed": false
        },
        {
          "id": "week4_action3",
          "text": "Third specific measurable action",
          "completed": false
        }
      ],
      "expanded": false
    }
  ]
}

Make the actions specific to their situation. If they need income fast, focus on revenue-generating actions. If they work best alone, focus on solo activities. If they struggle with consistency, include accountability measures.
  `;

  return await callGeminiWithRetry(model, prompt);
}
