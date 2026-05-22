import { GoogleGenAI, Type } from '@google/genai';
import { env } from '../config/env.js';

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

export async function generateSprintAnalytics(repoMetadata, activity) {
  const prompt = `
Analyze this GitHub sprint activity data for engineering leadership.

Rules:
- Use only the supplied JSON data.
- Identify bottlenecks from PR cycle time, inactive contributors, issue closing velocity, and commit/change distribution.
- Treat contributors with zero commits or only low-impact commits as inactive or at risk when supported by the data.
- Keep recommendations concrete, prioritized, and action-oriented.

Repository Data:
${JSON.stringify(repoMetadata)}

Activity Data:
${JSON.stringify(activity)}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: prompt,
    config: {
      temperature: 0,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sprintSummary: { type: Type.STRING },
          inactiveContributors: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          bottlenecks: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                priority: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] },
                actionItem: { type: Type.STRING }
              },
              required: ['priority', 'actionItem']
            }
          }
        },
        required: ['sprintSummary', 'inactiveContributors', 'bottlenecks', 'recommendations']
      }
    }
  });

  return JSON.parse(response.text);
}
