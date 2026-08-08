import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { listDays } from '../../services/dayService';
import { listPlaces } from '../../services/placeService';
import { getTrip } from '../../services/tripService';

export type CopilotAction = {
  type: 'add' | 'remove' | 'reschedule' | 'replace' | 'warning' | 'tip';
  title: string;
  reason: string;
  dayNumber: number | null;
  placeName: string | null;
  suggestedTime: string | null;
  estimatedCostImpact: number | null;
};

export type CopilotProposal = {
  summary: string;
  actions: CopilotAction[];
  assumptions: string[];
  warnings: string[];
};

const schema = {
  type: 'object', additionalProperties: false,
  required: ['summary','actions','assumptions','warnings'],
  properties: {
    summary: { type: 'string' },
    actions: { type: 'array', items: {
      type: 'object', additionalProperties: false,
      required: ['type','title','reason','dayNumber','placeName','suggestedTime','estimatedCostImpact'],
      properties: {
        type: { type: 'string', enum: ['add','remove','reschedule','replace','warning','tip'] },
        title: { type: 'string' }, reason: { type: 'string' },
        dayNumber: { type: ['integer','null'] }, placeName: { type: ['string','null'] },
        suggestedTime: { type: ['string','null'] }, estimatedCostImpact: { type: ['number','null'] },
      },
    }},
    assumptions: { type: 'array', items: { type: 'string' } },
    warnings: { type: 'array', items: { type: 'string' } },
  },
} as const;

@Injectable()
export class AiCopilotService {
  async suggest(userId: number, tripId: number, request: string, suppliedContext?: Record<string, unknown>) {
    const trip = getTrip(tripId, userId);
    if (!trip) throw new NotFoundException('Trip not found');
    const { days } = listDays(tripId);
    const places = listPlaces(String(tripId), {});

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) throw new ServiceUnavailableException('KukTrip AI is not configured');
    const model = process.env.KUKTRIP_GEMINI_MODEL?.trim() || 'gemini-3.6-flash';

    const compactContext = {
      trip: {
        id: trip.id, title: trip.title, startDate: trip.start_date, endDate: trip.end_date,
        currency: trip.currency,
      },
      days: days.slice(0, 60).map((d: any) => ({ id: d.id, dayNumber: d.day_number, date: d.date, title: d.title })),
      places: places.slice(0, 250).map((p: any) => ({ id: p.id, name: p.name, address: p.address, price: p.price, currency: p.currency, time: p.place_time, durationMinutes: p.duration_minutes })),
      suppliedContext: suppliedContext || {},
    };

    const prompt = [
      'You are KukTrip Copilot. Analyze an EXISTING trip and propose changes; never claim you changed anything.',
      'Do not invent live weather, prices, opening hours, availability, visa rules, traffic, delays, or booking status. Use live/context facts only when present in suppliedContext.',
      'Keep suggestions practical, concise, budget-aware and age-appropriate. If evidence is missing, state it in assumptions or warnings.',
      'Every action is review-only. The user must explicitly approve a later deterministic mutation.',
      `User request: ${request}`,
      `Current trip context: ${JSON.stringify(compactContext)}`,
    ].join('\n');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseFormat: { text: { mimeType: 'application/json', schema } } } }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error('[KukTripCopilot] Gemini request failed', response.status, body.slice(0, 500));
      throw new ServiceUnavailableException('KukTrip Copilot is temporarily unavailable');
    }
    const payload = await response.json() as any;
    const text = payload?.candidates?.[0]?.content?.parts?.find((part: any) => typeof part?.text === 'string')?.text;
    if (!text) throw new ServiceUnavailableException('KukTrip Copilot returned no proposal');
    let proposal: CopilotProposal;
    try { proposal = JSON.parse(text) as CopilotProposal; }
    catch { throw new ServiceUnavailableException('KukTrip Copilot returned an invalid proposal'); }

    return { provider: 'gemini', proposal, mutationApplied: false, requiresReview: true };
  }
}
