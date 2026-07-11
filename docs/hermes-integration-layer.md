# Hermes Integration Layer — MotionOS Platform Architecture

> Production-grade orchestration for Bio Tracking, Wispr Voice Coach, Context Router, and Multimodal Inputs  
> Optimized for Coach SaaS · Marketplace · 48-hour Buildathon MVP

---

## 1. Full Hermes Agent Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HERMES FITNESS SUPERVISOR                                │
│                    (hermes-fitness-supervisor)                              │
│         Top-level orchestrator · Coach SaaS · Marketplace gateway           │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             │
┌───────────────────────────────────────┐        │
│         CONTEXT ROUTER ★              │        │
│         (context-router)              │        │
│  • Enrich with Hermes Memory          │        │
│  • Detect intents (Wispr registry)    │        │
│  • Route · Prioritize · Conflict resolve│        │
│  • Safety gating · Multimodal handoff │        │
└──────────────────┬────────────────────┘        │
                   │                              │
     ┌─────────────┴─────────────┐                │
     ▼                           ▼                │
┌─────────────────────────┐  ┌────────────────────────────────────────────┐
│ BIO MODELING SUPERVISOR │  │ PEER AGENTS (post-bio dispatch)            │
│ (bio-modeling-supervisor)│  │                                            │
├─────────────────────────┤  ├────────────────────────────────────────────┤
│ • Ingestion & Norm      │  │ • Workout Programming Agent                │
│ • Digital Twin Modeler ★│  │ • Nutrition Agent                          │
│ • Predictive Analytics  │  │ • Progress Analyst Agent                   │
│ • Recovery & Adaptation │  │ • Habit Coach (stub)                       │
│ • Anomaly & Risk        │  │ • Builder Studio (coach mode)              │
│ • Insight & Viz         │  │ • Assessment (onboarding)                    │
└─────────────────────────┘  └────────────────────────────────────────────┘
                   │
     ┌─────────────┴─────────────┐
     ▼                           ▼
┌─────────────────┐    ┌─────────────────────────┐
│ HERMES MEMORY   │    │ FITNESS PROOFING GATE   │
│ Long-term store │    │ Injury · Overload · HITL│
│ injuries · prefs│    │ Coach override          │
│ patterns · voice│    └─────────────────────────┘
└─────────────────┘

INPUT MODALITIES (all → Context Router):
  🎤 Voice (Wispr)  ⌚ Wearables  📷 Photos  🎥 Form Video
  ✏️ Manual Logs   💬 Text/Chat  👆 Touch Confirm
```

### Agent Responsibility Matrix

| Agent | Role | Tier | Wispr | Triggers |
|-------|------|------|-------|----------|
| Context Router | Middleware intelligence | All | ✅ | All inputs |
| Ingestion & Normalization | Data collector | Free | ✅ | Wearables, voice, manual |
| Digital Twin Modeler | Core physiology model | Pro | ✅ | Any bio sync |
| Recovery & Adaptation | Real-time adapter | Free | ✅ | Voice, HRV drop |
| Predictive Analytics | Forecast engine | Pro | — | Post-sync |
| Anomaly & Risk | Safety guard | Pro | — | Pattern deviation |
| Insight & Visualization | Client/coach UI | Free | ✅ | Pipeline end |
| Workout Programming | Session modifier | Free | ✅ | Soreness, time, travel |
| Nutrition | Meal/macros | Free | ✅ | Energy, cravings |
| Progress Analyst | Longitudinal trends | Pro | ✅ | Progress checks |

---

## 2. Context Router Specification

**Implementation:** `lib/hermes/context-router.ts`  
**Schema:** `schemas/hermes-context-router.schema.json`  
**Types:** `types/hermes-context.ts`

### Router Pipeline (5 Steps)

```
1. ENRICH    → Load Hermes Memory + bio snapshot into EnrichedHermesContext
2. DETECT    → Wispr intent registry + entity extraction
3. ROUTE     → Build AgentRoute[] with priority + parallel groups
4. SAFETY    → Evaluate SafetyGate (injury, halt_training, coach approval)
5. RESOLVE   → Conflict resolution → ContextRouterDecision
```

### Decision Object Schema

```typescript
ContextRouterDecision {
  system: 'HermesContextRouter_v1.0'
  decision_id: string
  correlation_id: string
  enriched_context: EnrichedHermesContext  // memory + bio + intent
  routing: {
    primary_supervisor: 'bio-modeling-supervisor' | 'hermes-fitness-supervisor'
    agent_routes: AgentRoute[]             // prioritized agent list
    execution_plan: 'sequential' | 'parallel_bio_then_peers' | 'peer_only'
  }
  safety: SafetyGate
  conflicts_resolved: ConflictRecord[]
  multimodal_handoff: { from, suggested_next, pending_confirmation }
  observability: { router_latency_ms, memory_entries_loaded }
}
```

### Routing Logic Rules

| Condition | Routes Added | Priority |
|-----------|--------------|----------|
| Any voice/wearable input | Bio pipeline (6 agents) | high |
| `knee_hurts`, `im_sore`, etc. | + workout-programming | high |
| `what_to_eat`, `craving_carbs` | + nutrition | normal |
| `progress_check` | + progress-analyst | high |
| `build_program` or coach mode | + builder-studio | high |
| Photo/video upload | + ingestion, progress-analyst | normal |
| Touch confirm | + recovery, workout (critical) | critical |
| High-severity injury + non-injury intent | halt_training | critical |

### Conflict Resolution Rules

| Conflict | Resolution | Winner |
|----------|------------|--------|
| Workout volume ↑ vs overtraining risk > 60% | `safety_overrides_performance` | Recovery |
| Injury intent + auto-apply workout | `defer_to_human` | Coach review |
| Coach override flag set | `coach_override_wins` | Human |

### Example Decision: "My knee hurts"

```json
{
  "system": "HermesContextRouter_v1.0",
  "enriched_context": {
    "detected_intent": "knee_hurts",
    "intent_confidence": 0.8,
    "input_modality": "voice",
    "memory": {
      "injury_flags": [{ "body_part": "knee", "severity": "medium" }],
      "snippets": ["[voice_context] knee_hurts: ..."]
    },
    "bio_state": { "recovery_score": 65, "soreness_level": 6 }
  },
  "routing": {
    "primary_supervisor": "bio-modeling-supervisor",
    "execution_plan": "parallel_bio_then_peers",
    "agent_routes": [
      { "agent_id": "ingestion-normalization", "priority": "high", "parallel_group": 1 },
      { "agent_id": "digital-twin-modeler", "priority": "high", "parallel_group": 1 },
      { "agent_id": "anomaly-risk-detection", "priority": "high", "parallel_group": 2 },
      { "agent_id": "recovery-adaptation", "priority": "high", "parallel_group": 3 },
      { "agent_id": "workout-programming", "priority": "high", "parallel_group": 5 }
    ]
  },
  "safety": {
    "passed": true,
    "requires_coach_approval": true,
    "medical_disclaimer_required": true,
    "injury_aware_routing": true
  },
  "conflicts_resolved": [{
    "conflict_type": "injury_auto_apply",
    "resolution": "defer_to_human",
    "rationale": "Coach approval required before workout changes"
  }],
  "multimodal_handoff": {
    "from": "voice",
    "suggested_next": ["touch"],
    "pending_confirmation": true
  }
}
```

---

## 3. End-to-End Flow: "My knee hurts"

```
┌─ USER ─────────────────────────────────────────────────────────────────────┐
│ 🎤 Wispr: "My knee hurts"                                                │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 ▼
┌─ MULTIMODAL HANDLER ──────────────────────────────────────────────────────┐
│ normalizeMultimodalInput() → modality: voice, intent: knee_hurts (0.8)  │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 ▼
┌─ CONTEXT ROUTER ─────────────────────────────────────────────────────────┐
│ Memory: prior knee flag? preferences? last adaptations?                 │
│ Safety: requires_coach_approval=true, medical_disclaimer=true           │
│ Routes: bio pipeline → workout-programming                              │
│ Handoff: suggest touch confirmation                                     │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 ▼
┌─ BIO MODELING SUPERVISOR ────────────────────────────────────────────────┐
│ Ingestion: log soreness=6, source=voice                                 │
│ Digital Twin: update recovery profile, injury flag                      │
│ Anomaly: elevated injury risk warning                                   │
│ Recovery: exercise_swap — remove squats/lunges                          │
│ Insight: "Knee concern flagged" coaching summary                        │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 ▼
┌─ FITNESS PROOFING ───────────────────────────────────────────────────────┐
│ Block auto-apply on major adaptation                                    │
│ Force coach_approval=true                                               │
│ Attach medical disclaimer                                               │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 ▼
┌─ WORKOUT PROGRAMMING AGENT ──────────────────────────────────────────────┐
│ Remove: squat, lunge, leg_press, box_jump                               │
│ Add: rdl, glute_bridge, hip_thrust                                       │
│ Action: modify_workout → requiresApproval: true                         │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 ▼
┌─ OUTPUT (Multi-Modal) ───────────────────────────────────────────────────┐
│ 🔊 Spoken: "I've flagged your knee concern and removed squatting         │
│             movements. Your coach will review alternatives."              │
│ 📱 Visual: adaptation_card + workout_card (pending coach badge)         │
│ 📊 Data: MotionOS document + adaptation_log entry                       │
│ 👆 Handoff: "Tap Confirm on adaptation card" (touch modality)           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Data Context Structures

### Cross-Agent Shared Context

| Structure | File | Used By |
|-----------|------|---------|
| `EnrichedHermesContext` | `types/hermes-context.ts` | Context Router, all agents |
| `ContextRouterDecision` | `types/hermes-context.ts` | Integration Layer, observability |
| `MotionOSBioDocument` | `types/motionos.ts` | Bio pipeline output |
| `WisprIntentResult` | `types/wispr.ts` | Voice layer |
| `BioTrackingContext` | `types/bio.ts` | Bio supervisor |
| `DigitalTwinState` | `types/bio.ts` | Twin modeler |
| `AgentContext` | `types/agent.ts` | All agents |

### Hermes Memory Categories

| Category | Stores | Never Resets |
|----------|--------|--------------|
| `preference` | Training style, equipment, schedule | ✅ Evolves |
| `injury_history` | Body parts, severity, restrictions | ✅ Accumulates |
| `pattern` | Bio readings, recovery trends | ✅ Rolling |
| `baseline` | Digital twin snapshots | ✅ Versioned |
| `voice_context` | Transcripts, intents, sessions | ✅ 7-day TTL |
| `adaptation_history` | Applied changes audit | ✅ Full log |
| `coach_note` | Human overrides | ✅ Permanent |

### JSON Schemas (Canonical)

```
schemas/motionos-bio-tracking.schema.json    # Bio document
schemas/wispr-intent.schema.json             # 22 voice intents
schemas/hermes-context-router.schema.json    # Router decisions
```

---

## 5. UI Integration Points

### Voice AI Coach Screen

```
┌─────────────────────────────────┐
│  ← Back          AI Coach       │
│                                 │
│         ╭─────────╮             │
│         │  Orb /  │  ← Wispr waveform
│         │Waveform │             │
│         ╰─────────╯             │
│  "How can I help you today?"    │
│                                 │
│      [ VoiceButton ]            │  → POST /api/hermes (multimodal voice)
│                                 │
│  ┌─ AdaptationCard ─────────┐  │  ← visual_updates: adaptation_card
│  │ ⚡ exercise_swap         │  │
│  │ [Confirm] [Adjust]       │  │  ← touch modality handoff
│  └──────────────────────────┘  │
│                                 │
│  [RecoveryGauge] [Load] [Risk]  │  ← visual_updates: recovery_gauge
└─────────────────────────────────┘
       [Floating VoiceButton]     │  ← all screens
```

### API → UI Mapping

| API Field | UI Component |
|-----------|--------------|
| `spoken_feedback` | AI Coach quote bubble |
| `visual_updates: recovery_gauge` | `RecoveryGauge` |
| `visual_updates: adaptation_card` | `AdaptationCard` |
| `visual_updates: workout_card` | Workout screen |
| `visual_updates: dashboard` | `BioDashboard` |
| `decision.multimodal_handoff` | Show Confirm/Adjust buttons |
| `decision.safety.medical_disclaimer_required` | Disclaimer on card |

### Integration Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/hermes` | Primary — multimodal or legacy intents |
| `POST /api/hermes/context` | Router-only (debug/preview) |
| `POST /api/bio/voice` | Voice-specific with multi-turn |
| `GET /api/hermes?preview_router=true` | Live routing preview |

---

## 6. MVP Roadmap (48-Hour Buildathon)

### Phase 1: Core Orchestration (0–12h) ✅

- [x] Hermes Fitness Supervisor
- [x] Bio Modeling Supervisor + 6 agents
- [x] Hermes Memory store
- [x] Fitness proofing gate

### Phase 2: Context Router + Wispr (12–24h) ✅

- [x] Context Router with decision objects
- [x] 22-intent Wispr registry
- [x] Multi-turn voice sessions
- [x] Multimodal input normalization

### Phase 3: Peer Agents + Integration (24–36h) ✅

- [x] Workout Programming Agent
- [x] Nutrition Agent
- [x] Progress Analyst Agent
- [x] Hermes Integration Layer (unified entry)
- [x] Peer agent dispatch post-bio

### Phase 4: Demo Polish (36–48h) — NEXT

- [ ] Touch confirmation UI on AdaptationCard
- [ ] Proactive coaching banner (Pattern E)
- [ ] Orchestration trace viewer for judges
- [ ] Postgres persistence for Hermes Memory
- [ ] Real Wispr SDK + TTS
- [ ] Marketplace digital twin report export

### Buildathon Demo Script (5 min)

```bash
# 1. Router preview
curl "http://localhost:3000/api/hermes?preview_router=true&utterance=My+knee+hurts"

# 2. Full multimodal voice flow
curl -X POST http://localhost:3000/api/hermes \
  -H "Content-Type: application/json" \
  -d '{
    "modality": "voice",
    "client_id": "demo_client",
    "session_id": "demo_1",
    "timestamp": "2026-07-11T13:00:00Z",
    "payload": { "type": "voice", "transcript": "My knee hurts" }
  }'

# 3. Wearable sync
curl -X POST http://localhost:3000/api/hermes \
  -d '{"modality":"wearable","client_id":"demo_client","session_id":"s1","timestamp":"...","payload":{"type":"wearable","source":"oura","readings":[{"key":"hrv","value":52}]}}'

# 4. Touch confirm adaptation
curl -X POST http://localhost:3000/api/hermes \
  -d '{"modality":"touch","client_id":"demo_client","session_id":"s1","timestamp":"...","payload":{"type":"touch","action":"confirm_adaptation","target":"adapt_001","confirmed":true}}'

# 5. Progress check
curl -X POST http://localhost:3000/api/hermes \
  -d '{"modality":"voice","client_id":"demo_client","session_id":"s2","timestamp":"...","payload":{"type":"voice","transcript":"How am I doing?"}}'
```

---

## Why This Showcases Hermes

| Strength | Demonstration |
|----------|---------------|
| **Hierarchical supervision** | Fitness Supervisor → Context Router → Bio Supervisor → 6 agents → 3 peer agents |
| **Specialized agent coordination** | Router dispatches only relevant agents per intent — no monolithic LLM |
| **Continuous bio adaptation** | Digital Twin updates on every input; plans evolve via Memory |
| **Real-world fitness complexity** | Injury + overtraining conflicts resolved with safety rules |
| **Multimodal native** | Voice → touch confirm → visual cards in one session |
| **Observable** | Every request produces `ContextRouterDecision` + `OrchestrationTrace` |
| **SaaS + Marketplace ready** | Tier gating, coach mode, coach override, audit logs |

---

## File Map

```
lib/hermes/
  integration-layer.ts     ← Primary entry point
  context-router.ts        ← Central intelligence
  multimodal.ts            ← Input normalization
  supervisor.ts            ← Fitness Supervisor
  memory.ts                ← Long-term store
  peer-agents/
    workout-agent.ts
    nutrition-agent.ts
    progress-analyst-agent.ts
types/hermes-context.ts
schemas/hermes-context-router.schema.json
docs/hermes-integration-layer.md
```
