import OpenAI from 'openai';
import { env } from '../config/env.js';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: env.OPENROUTER_API_KEY,
});

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

  const response = await openai.chat.completions.create({
    model: 'google/gemini-2.5-flash',
    messages: [
      { role: 'system', content: 'You are an engineering leadership AI assistant.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'sprint_analytics_schema',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            sprintSummary: { type: 'string' },
            inactiveContributors: {
              type: 'array',
              items: { type: 'string' }
            },
            bottlenecks: {
              type: 'array',
              items: { type: 'string' }
            },
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  priority: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
                  actionItem: { type: 'string' }
                },
                required: ['priority', 'actionItem'],
                additionalProperties: false
              }
            }
          },
          required: ['sprintSummary', 'inactiveContributors', 'bottlenecks', 'recommendations'],
          additionalProperties: false
        }
      }
    }
  });

  return JSON.parse(response.choices[0].message.content);
}
