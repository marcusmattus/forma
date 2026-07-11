# MotionOS Bio Tracking & Agentic Side Modeling — Implementation Blueprint

> Hermes Fit · AI Fitness Coaching OS  
> Production-ready architecture · 48-hour hackathon MVP scope

---

## 1. Agent Specifications & Responsibilities

### Hierarchy

```
Hermes Fitness Supervisor (hermes-fitness-supervisor)
└── Bio Modeling Supervisor (bio-modeling-supervisor)
    ├── Ingestion & Normalization Agent
    ├── Digital Twin Modeler Agent ★ Core
    ├── Predictive Analytics Agent
    ├── Recovery & Adaptation Agent
    ├── Anomaly & Risk Detection Agent
    └── Insight & Visualization Agent
```

**Peer agents** (integration targets): Assessment, Workout Programming, Nutrition, Progress Analyst, Habit Coach, Builder Studio.

### Agent Details

| Agent | ID | Tier | Responsibility |
|-------|-----|------|----------------|
| **Ingestion & Normalization** | `ingestion-normalization` | Free | Ingest Oura/Whoop/Apple Health/Garmin/manual/voice/photos. Normalize to unified scores. Impute missing data via Hermes Memory. |
| **Digital Twin Modeler** | `digital-twin-modeler` | Pro | Maintain living physiological model. Track structural, performance, recovery, metabolic variables. Run what-if simulations. |
| **Predictive Analytics** | `predictive-analytics` | Pro | Forecast plateaus, overtraining, super-compensation, body comp changes. Confidence scores + timelines. |
| **Recovery & Adaptation** | `recovery-adaptation` | Free | Analyze HRV/sleep/soreness/stress. Auto-trigger volume/intensity/nutrition adaptations. Wispr voice integration. |
| **Anomaly & Risk Detection** | `anomaly-risk-detection` | Pro | Flag HRV drops, sleep debt, injury risk. Escalate to coach. Halt training on critical health signals. |
| **Insight & Visualization** | `insight-visualization` | Free | Plain-language summaries, ring charts, bar charts, coaching reports. Tiered free vs pro insights. |

**Implementation:** `lib/bio/agents/*.ts`

---

## 2. Data Schemas / Context Structures

### Core Types (`types/bio.ts`)

```typescript
BioReading        → Point-in-time metric (hrv, sleep, steps, soreness, etc.)
UnifiedScore      → Normalized 0-100 scores (recovery, load, body_comp_delta, overtraining_risk)
DigitalTwinState  → Living model: structural + performance + recovery + metabolic profiles
Prediction        → Forecast with confidence, timeline, recommended actions
AdaptationRecommendation → Closed-loop action (volume, deload, nutrition, schedule)
AnomalyAlert      → Risk flag with severity + escalation
BioInsight        → Client/coach-facing narrative + visualization specs
BioTrackingContext → Full agent-shared context bundle
```

### Hermes Memory (`lib/hermes/memory.ts`)

| Category | Purpose |
|----------|---------|
| `preference` | Client training/nutrition preferences |
| `injury_history` | Past and active injury flags |
| `pattern` | Historical biometric patterns + reading store |
| `baseline` | Digital twin snapshots |
| `coach_note` | Human-in-the-loop overrides |
| `voice_context` | Wispr transcripts + parsed intents |
| `adaptation_history` | Applied adaptations audit trail |
| `missing_data_imputation` | Fallback values for gaps |

### Unified Score Formulas (`lib/bio/scores.ts`)

- **Recovery Score** = weighted(HRV vs baseline, sleep score, inverse soreness, readiness)
- **Load Score** = weighted(strain, steps, active calories)
- **Body Comp Delta** = % change vs baseline weight/body fat
- **Overtraining Risk** = f(load/recovery ratio, soreness, sleep debt)

---

## 3. Agent Interaction Flow Diagrams

### Closed-Loop Adaptation Pipeline

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Data Sources│────▶│ Ingestion Agent  │────▶│ Normalized      │
│ Wearables   │     │ + Memory Impute  │     │ BioReadings     │
│ Manual/Voice│     └──────────────────┘     └────────┬────────┘
└─────────────┘                                        │
                                                       ▼
                              ┌────────────────────────────────────┐
                              │     Digital Twin Modeler Agent     │
                              │  Update profiles · Compute scores  │
                              │  Run what-if simulations (Pro)     │
                              └──────────────┬─────────────────────┘
                                             │
                        ┌────────────────────┼────────────────────┐
                        ▼                    ▼                    ▼
              ┌─────────────────┐ ┌───────────────┐ ┌──────────────────┐
              │ Predictive      │ │ Anomaly & Risk│ │ Recovery &       │
              │ Analytics       │ │ Detection     │ │ Adaptation       │
              │ (Pro)           │ │ (Pro)         │ │ (Voice-aware)    │
              └────────┬────────┘ └───────┬───────┘ └────────┬─────────┘
                       │                  │                   │
                       └──────────────────┼───────────────────┘
                                          ▼
                              ┌───────────────────────┐
                              │ Insight & Viz Agent   │
                              │ Dashboards · Summaries│
                              └───────────┬───────────┘
                                          │
                        ┌─────────────────┼─────────────────┐
                        ▼                 ▼                 ▼
                 ┌───────────┐    ┌────────────┐    ┌──────────────┐
                 │ Client UI │    │ Coach UI   │    │ Downstream   │
                 │ Rings/Charts│  │ Builder    │    │ Agents       │
                 └───────────┘    │ Studio     │    │ Workout ·    │
                                  └────────────┘    │ Nutrition    │
                                                    └──────────────┘
```

### Voice-Driven Adaptation (Wispr)

```
User: "I'm sore and only have 20 minutes"
         │
         ▼
POST /api/bio/insights  { transcript, clientId }
         │
         ▼
Recovery Agent → parseVoiceInput()
  ├─ intent: sore → exercise_swap adaptation
  └─ intent: time_limited → schedule condensation
         │
         ▼
Auto-apply actions → workout-programming agent
Store voice_context in Hermes Memory
```

### Builder Studio Integration

```
Coach creates program in Builder Studio
         │
         ▼
POST /api/hermes  { intent: "builder_insights", clientId }
         │
         ▼
Bio Supervisor → audience: "coach"
         │
         ▼
Returns: twin state, predictions, constraints, injury flags
         │
         ▼
Builder Studio injects bio context into program generation prompt
```

---

## 4. Key Code Structure

```
types/
  agent.ts          # Hermes agent framework types
  bio.ts            # Bio domain schemas

lib/hermes/
  agent-base.ts     # BaseAgent class, tier gating
  memory.ts         # Long-term client memory store
  supervisor.ts     # Hermes Fitness Supervisor

lib/bio/
  scores.ts         # Normalization + unified score computation
  engine.ts         # Public API (ingest, voice, dashboard, what-if)
  supervisor.ts     # Bio Modeling Supervisor (pipeline orchestrator)
  agents/
    ingestion-agent.ts
    digital-twin-agent.ts
    predictive-agent.ts
    recovery-agent.ts
    anomaly-agent.ts
    insight-agent.ts

app/api/
  hermes/route.ts           # Top-level orchestration
  bio/ingest/route.ts       # Data ingestion
  bio/twin/route.ts         # Digital twin dashboard
  bio/recovery/route.ts     # Recovery scores + adaptations
  bio/insights/route.ts     # Insights + voice adaptation
```

### Usage Examples

```typescript
// Ingest wearable data
import { ingestBioData } from '@/lib/bio/engine';

const result = await ingestBioData({
  clientId: 'user_123',
  source: 'oura',
  readings: [
    { metricKey: 'hrv', value: 45 },
    { metricKey: 'sleep_score', value: 82 },
    { metricKey: 'readiness', value: 78 },
  ],
}, 'pro');

// Voice adaptation
import { processVoiceAdaptation } from '@/lib/bio/engine';

await processVoiceAdaptation({
  clientId: 'user_123',
  transcript: "I'm sore and travelling, only have 20 minutes",
  sessionId: 'voice_session_1',
});

// What-if simulation (Pro)
import { runWhatIfSimulation } from '@/lib/bio/engine';

await runWhatIfSimulation('user_123', [
  { variable: 'training_volume', currentValue: 100, proposedValue: 130, durationDays: 7 },
]);
```

---

## 5. MVP Implementation Roadmap (48-Hour Hackathon)

### Hour 0–8: Foundation ✅ (Implemented)
- [x] Type schemas (`types/bio.ts`, `types/agent.ts`)
- [x] Hermes Memory store
- [x] Score normalization engine
- [x] All 6 bio agents with core logic
- [x] Bio Modeling Supervisor pipeline
- [x] API routes

### Hour 8–16: Demo & UI
- [ ] Bio dashboard component with progress rings (matches Figma)
- [ ] Seed demo client with sample Oura data
- [ ] Wire dashboard to `/api/bio/twin`
- [ ] Voice input demo button

### Hour 16–24: Integration Stubs
- [ ] Mock wearable webhook adapter (Oura format)
- [ ] Builder Studio bio context injection endpoint
- [ ] Downstream agent action bus (workout-programming mock)

### Hour 24–36: Pro Features
- [ ] What-if simulation UI for coaches
- [ ] Anomaly escalation notifications
- [ ] Tier gating in API responses

### Hour 36–48: Polish & Demo
- [ ] Gemini-powered insight narratives (wire `@google/genai`)
- [ ] Observability: pipeline trace viewer
- [ ] Marketplace "Digital Twin Report" export stub
- [ ] End-to-end demo script

### MVP Demo Flow
1. POST sample Oura data → see recovery/load rings update
2. Say "I'm sore" via voice endpoint → see workout adaptation
3. View coach insights with overtraining prediction
4. Run what-if: "What if I increase volume 30%?"

---

## 6. How This Showcases Hermes Orchestration

| Strength | Demonstration |
|----------|---------------|
| **Hierarchical supervision** | Hermes Fitness Supervisor delegates to Bio Modeling Supervisor, which coordinates 6 specialized agents in parallel where possible |
| **Shared memory** | All agents read/write Hermes Memory — imputation, voice context, twin baselines, adaptation history |
| **Closed-loop adaptation** | Data → model → prediction → action → feedback, with auto-apply vs coach-approval gates |
| **Voice-native** | Recovery Agent parses Wispr transcripts into structured adaptations in real time |
| **Tiered intelligence** | Free tier gets basic scores; Pro unlocks predictions, anomalies, what-if simulations |
| **Observability** | Every pipeline run produces an `OrchestrationTrace` with per-agent timing and status |
| **Human-in-the-loop** | Critical adaptations require coach approval; anomaly escalations route to coach |
| **Cross-agent actions** | Downstream `AgentAction[]` dispatched to Workout Programming, Nutrition, Builder Studio |
| **Marketplace-ready** | Digital Twin reports and advanced insights gated behind Pro tier |

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/hermes` | POST | Top-level orchestration (all intents) |
| `/api/hermes` | GET | Architecture metadata |
| `/api/bio/ingest` | POST | Ingest biometric readings |
| `/api/bio/twin` | GET | Digital twin + unified scores |
| `/api/bio/recovery` | GET | Recovery state + adaptations |
| `/api/bio/insights` | GET | Insights, predictions, anomalies |
| `/api/bio/insights` | POST | Voice-driven adaptation |

---

## Tier Access Matrix

| Feature | Free | Pro | Coach |
|---------|------|-----|-------|
| Basic bio ingestion | ✅ | ✅ | ✅ |
| Recovery + Load scores | ✅ | ✅ | ✅ |
| Voice adaptations | ✅ | ✅ | ✅ |
| Predictions | Basic | Full | Full |
| Anomaly detection | ❌ | ✅ | ✅ |
| What-if simulations | ❌ | ✅ | ✅ |
| Digital twin reports | ❌ | Marketplace | ✅ |
| Coach escalation | ❌ | ✅ | ✅ |

---

## Next Steps for Production

1. **Persistence** — Replace in-memory store with Postgres/Firestore
2. **Wearable OAuth** — Oura, Whoop, Apple Health, Garmin adapters
3. **Gemini narratives** — LLM-generated coaching summaries in Insight Agent
4. **LangGraph migration** — Port supervisor pipeline to LangGraph state machine
5. **Real-time** — WebSocket push for anomaly alerts and adaptation confirmations
6. **Builder Studio** — Inject `BioTrackingContext` into program generation prompts
