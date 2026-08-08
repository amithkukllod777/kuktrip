import { Injectable, ServiceUnavailableException } from '@nestjs/common';

export interface TripPlanInput {
  destination: string;
  startDate?: string;
  endDate?: string;
  dayCount?: number;
  travelers?: { adults?: number; children?: number; notes?: string };
  budget?: number;
  currency?: string;
  interests?: string[];
  pace?: 'relaxed' | 'balanced' | 'packed';
  notes?: string;
}

export interface TripPlanProposal {
  title: string;
  destination: string;
  summary: string;
  currency: string;
  estimatedTotal: number | null;
  days: Array<{
    dayNumber: number;
    date: string | null;
    title: string;
    estimatedCost: number | null;
    activities: Array<{
      name: string;
      category: string;
      startTime: string | null;
      durationMinutes: number | null;
      area: string | null;
      notes: string | null;
      estimatedCost: number | null;
    }>;
  }>;
  assumptions: string[];
  warnings: string[];
}

interface AiProvider {
  readonly id: string;
  generateTripPlan(input: TripPlanInput): Promise<TripPlanProposal>;
}

const tripPlanSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'destination', 'summary', 'currency', 'estimatedTotal', 'days', 'assumptions', 'warnings'],
  properties: {
    title: { type: 'string' },
    destination: { type: 'string' },
    summary: { type: 'string' },
    currency: { type: 'string' },
    estimatedTotal: { type: ['number', 'null'] },
    days: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['dayNumber', 'date', 'title', 'estimatedCost', 'activities'],
        properties: {
          dayNumber: { type: 'integer' },
          date: { type: ['string', 'null'] },
          title: { type: 'string' },
          estimatedCost: { type: ['number', 'null'] },
          activities: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['name', 'category', 'startTime', 'durationMinutes', 'area', 'notes', 'estimatedCost'],
              properties: {
                name: { type: 'string' },
                category: { type: 'string' },
                startTime: { type: ['string', 'null'] },
                durationMinutes: { type: ['integer', 'null'] },
                area: { type: ['string', 'null'] },
                notes: { type: ['string', 'null'] },
                estimatedCost: { type: ['number', 'null'] },
              },
            },
          },
        },
      },
    },
    assumptions: { type: 'array', items: { type: 'string' } },
    warnings: { type: 'array', items: { type: 'string' } },
  },
} as const;

class GeminiTripProvider implements AiProvider {
  readonly id = 'gemini';
  private readonly apiKey = process.env.GEMINI_API_KEY?.trim();
  private readonly model = process.env.KUKTRIP_GEMINI_MODEL?.trim() || 'gemini-3.6-flash';

  async generateTripPlan(input: TripPlanInput): Promise<TripPlanProposal> {
    if (!this.apiKey) throw new ServiceUnavailableException('KukTrip AI is not configured');

    const prompt = [
      'You are KukTrip AI, a travel planning assistant.',
      'Create a practical itinerary proposal. Do not claim live availability, guaranteed prices, opening hours, visa rules, weather, or transport schedules unless they were provided in the request.',
      'Estimated costs are planning estimates only. Put uncertainty or missing information in assumptions/warnings.',
      'Respect the requested budget, traveler composition, pace and interests. Avoid unsafe or age-inappropriate activities for children.',
      'Return only the requested structured response.',
      `Trip request: ${JSON.stringify(input)}`,
    ].join('\n');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseFormat: {
              text: {
                mimeType: 'application/json',
                schema: tripPlanSchema,
              },
            },
          },
        }),
        signal: AbortSignal.timeout(45_000),
      },
    );

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error('[KukTripAI] Gemini request failed', response.status, body.slice(0, 500));
      throw new ServiceUnavailableException('KukTrip AI is temporarily unavailable');
    }

    const payload = await response.json() as any;
    const text = payload?.candidates?.[0]?.content?.parts?.find((part: any) => typeof part?.text === 'string')?.text;
    if (!text) throw new ServiceUnavailableException('KukTrip AI returned no itinerary');

    try {
      return JSON.parse(text) as TripPlanProposal;
    } catch {
      throw new ServiceUnavailableException('KukTrip AI returned an invalid itinerary');
    }
  }
}

@Injectable()
export class AiTripService {
  private readonly provider: AiProvider;

  constructor() {
    // Provider selection is centralized here. Product feature code never calls Gemini directly.
    this.provider = new GeminiTripProvider();
  }

  async generateTripPlan(input: TripPlanInput) {
    const proposal = await this.provider.generateTripPlan(input);
    return {
      provider: this.provider.id,
      proposal,
      mutationApplied: false,
      requiresReview: true,
    };
  }
}
