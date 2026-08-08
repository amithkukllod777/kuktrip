# KukTrip AI Provider Architecture

## Decision
KukTrip uses a provider-neutral AI layer. Google Gemini is a supported candidate/provider, not a hard dependency.

## Why
Travel AI needs a mix of:
- structured itinerary generation
- reasoning over constraints and budgets
- multimodal/document understanding
- grounded/current destination information
- low-latency in-trip assistance
- predictable JSON/tool outputs
- cost controls

No single provider should be embedded directly into product feature code.

## Internal service boundary
Feature code calls KukTrip/Kuklabs AI capabilities such as:

- `generateTripPlan(input)`
- `suggestItineraryChange(input)`
- `explainTrip(input)`
- `extractBooking(input)`
- `recommendNearby(input)`
- `summarizeTripContext(input)`

The provider router decides the model/provider.

## Provider adapter contract
Each provider adapter implements:
- text generation
- structured JSON output
- tool/function calls where supported
- multimodal input where supported
- token/cost telemetry
- timeouts/retries
- safety/error normalization

Potential adapters:
- Kuklabs shared AI gateway
- Google Gemini
- OpenAI
- other approved providers

## Gemini use cases
Gemini is worth evaluating for:
- multimodal travel document understanding
- destination/places-oriented assistance when grounding is available
- itinerary generation
- long-context trip history

Do not send provider keys to web/mobile clients. Credentials stay server-side/platform-side.

## Tool/action model
The model never writes arbitrary data directly. It emits typed proposed actions, for example:

```json
{
  "action": "itinerary.add_place",
  "tripId": 123,
  "dayId": 8,
  "place": {
    "name": "Tegalalang Rice Terrace",
    "startTime": "16:30"
  }
}
```

The server validates:
- authenticated Kuklabs user
- trip access/permission
- schema
- business rules
- current state/conflicts

Then the user reviews/applies actions when required.

## Grounding and freshness
Travel claims that can change (opening hours, weather, prices, transport schedules, availability) must carry source/freshness metadata when available and must not be represented as guaranteed booking availability unless returned by an authoritative provider.

## Privacy
Minimize provider payloads. Do not send secrets, unrelated documents, precise location, identity fields or other travelers' private data unless required for the requested feature and permitted by policy/consent.

## Cost controls
- per-feature model routing
- request/token budgets
- caching where safe
- smaller models for extraction/classification
- premium models only when quality benefit is justified
- usage telemetry by product/feature, not a separate billing system

## Fallbacks
Provider errors degrade to:
1. alternate approved provider when safe
2. deterministic/non-AI feature path
3. clear user-visible failure

Never silently invent itinerary facts because a provider failed.
