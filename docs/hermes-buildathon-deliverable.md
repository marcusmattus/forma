# MotionOS Bio Tracking — Hermes Buildathon Deliverable

> **System:** `MotionOS_BioTracking_v1.0`  
> **Orchestration:** Hermes → BioModelingSupervisor → 6 Agents  
> **Voice:** Wispr intent detection + spoken coaching feedback  
> **Schema:** `schemas/motionos-bio-tracking.schema.json`

---

## 1. Complete Expanded JSON Schema

The canonical schema lives at **`schemas/motionos-bio-tracking.schema.json`**.

TypeScript mirror: **`types/motionos.ts`**

### Root Document Structure

```json
{
  "system": "MotionOS_BioTracking_v1.0",
  "client_id": "user_abc123",
  "timestamp": "2026-07-11T13:45:00Z",
  "orchestration": {
    "layer": "Hermes",
    "supervisor": "BioModelingSupervisor",
    "main_orchestrator": "FitnessSupervisor",
    "memory_store": "HermesLongTermMemory",
    "context_sharing": "structured_context_passing",
    "correlation_id": "corr_1783772502068",
    "pipeline_status": "completed"
  },
  "voice_layer": {
    "provider": "Wispr",
    "session_id": "wispr_session_42",
    "transcript": "My knee hurts and I'm traveling this week",
    "detected_intent": "knee_hurts",
    "confidence": 0.8,
    "spoken_feedback": "I've flagged your knee concern and removed squatting movements...",
    "capabilities": [
      "natural_language_updates",
      "real_time_adaptation_triggers",
      "spoken_coaching_feedback",
      "intent_detection"
    ]
  },
  "bio_profile": {
    "structural": {
      "weight_kg": 78.5,
      "body_fat_pct": 14.2,
      "measurements": { "chest_cm": 102, "waist_cm": 82 }
    },
    "performance": {
      "strength_trend": 12,
      "weekly_volume_sets": 84,
      "avg_rpe": 7.5,
      "volume_tolerance_pct": 72,
      "plateau_risk_pct": 25
    },
    "recovery": {
      "hrv": 68,
      "hrv_baseline": 72,
      "sleep_score": 82,
      "sleep_duration_hours": 7.2,
      "sleep_debt_hours": 1.5,
      "soreness": 3,
      "stress": 4,
      "recovery_score": 76,
      "readiness_score": 74
    },
    "contextual": {
      "injuries": [
        {
          "id": "inj_knee_01",
          "body_part": "knee",
          "severity": "medium",
          "detected_at": "2026-07-11T13:45:00Z",
          "source": "voice",
          "resolved": false,
          "restricted_movements": ["squat", "lunge", "leg_press"]
        }
      ],
      "travel": true,
      "menstrual_phase": null,
      "voice_notes": [
        {
          "transcript": "My knee hurts",
          "intent": "knee_hurts",
          "recorded_at": "2026-07-11T13:45:00Z"
        }
      ]
    }
  },
  "digital_twin": {
    "status": "active",
    "version": 3,
    "last_synced": "2026-07-11T13:45:00Z",
    "model_confidence": 0.82,
    "unified_scores": [
      { "key": "recovery_score", "value": 76, "scale": "0-100", "confidence": 0.85, "explanation": "..." },
      { "key": "load_score", "value": 58, "scale": "0-100", "confidence": 0.78, "explanation": "..." },
      { "key": "overtraining_risk", "value": 22, "scale": "0-100", "confidence": 0.75, "explanation": "..." }
    ],
    "predictions": [
      {
        "id": "pred_super_01",
        "type": "supercompensation",
        "confidence": 0.75,
        "timeline": "next 3-5 days",
        "description": "Recovery markers indicate super-compensation window",
        "actionable_by": "client",
        "recommended_actions": ["Schedule key workout in next 48h"]
      }
    ],
    "simulations": [
      {
        "id": "sim_vol_01",
        "name": "training_volume +30%",
        "projected_outcome": { "recovery_score": 62, "overtraining_risk": 55 },
        "confidence": 0.65,
        "influences_agents": ["workout-programming", "nutrition"]
      }
    ]
  },
  "adaptation_log": [
    {
      "id": "log_wispr_knee_01",
      "type": "exercise_swap",
      "description": "Remove squats, lunges — substitute hip-dominant alternatives",
      "magnitude": "major",
      "trigger": "voice_intent",
      "voice_intent": "knee_hurts",
      "auto_applied": false,
      "requires_coach_approval": true,
      "safety_check_passed": true,
      "medical_disclaimer_shown": true,
      "applied_at": "2026-07-11T13:45:01Z",
      "affected_domains": ["workout", "recovery"],
      "rationale": "Knee pain reported — injury-aware exercise removal"
    }
  ],
  "fitness_proofing": {
    "safety_mechanisms": {
      "human_coach_override": true,
      "medical_disclaimer_on_adaptations": true,
      "progressive_overload_limits": {
        "max_weekly_volume_increase_pct": 10,
        "max_intensity_increase_pct": 5
      },
      "injury_history_weighting": 0.85
    },
    "robustness": {
      "offline_mode_fallback": true,
      "data_validation": true,
      "multi_source_cross_checking": true,
      "confidence_scoring_on_all_predictions": true
    },
    "halt_training": false,
    "blocked_adaptations": []
  },
  "downstream_actions": [
    {
      "target_agent": "workout-programming",
      "action_type": "adapt_exercise_swap",
      "payload": { "remove": ["squat", "lunge"], "add": ["rdl", "glute_bridge"] },
      "priority": "high",
      "requires_approval": true
    }
  ]
}
```

---

## 2. Hermes Agent Orchestration Pseudocode

### Voice Intent Flow Through Hermes

```
FUNCTION handleWisprVoice(clientId, transcript, sessionId):

  // ── Layer 1: Hermes Fitness Supervisor ──
  ctx = createBioContext(clientId, trigger="voice_command")
  correlationId = createCorrelationId()
  trace = new OrchestrationTrace(correlationId)

  // ── Layer 2: Wispr Intent Detection (pre-pipeline) ──
  intentMatch = Wispr.detectIntent(transcript)
  // → { intent: "knee_hurts", confidence: 0.8, keywords: ["knee", "hurts"] }

  voiceLayer = Wispr.buildVoiceLayer(transcript, sessionId, intentMatch)
  // → spoken_feedback, detected_intent, confidence

  STORE HermesMemory(clientId, category="voice_context", intentMatch)

  // ── Layer 3: Bio Modeling Supervisor Pipeline ──
  trace.step("ingestion-normalization")
    readings = IngestionAgent.run({
      source: "voice",
      voiceTranscript: transcript,
      bioUpdates: Wispr.getBioUpdates(intentMatch.intent)  // soreness, stress, etc.
    })
    readings = HermesMemory.imputeMissing(clientId, readings)

  trace.step("digital-twin-modeler")
    twin = DigitalTwinAgent.run({ clientId, readings })
    twin = UPDATE profiles (structural, performance, recovery, metabolic)
    twin.unifiedScores = computeAllUnifiedScores(readings, twin)
    HermesMemory.store(twin)

  PARALLEL:
    trace.step("predictive-analytics")
      predictions = PredictiveAgent.run({ twin, readings })
      // → plateau, overtraining, supercompensation forecasts

    trace.step("anomaly-risk-detection")
      anomalies = AnomalyAgent.run({ twin, readings })
      IF anomalies.critical → ESCALATE to coach, HALT training

  trace.step("recovery-adaptation")
    wisprAdapts = Wispr.getAdaptations(intentMatch.intent)
    bioAdapts = RecoveryAgent.analyzeRecoveryMarkers(twin)
    bioAdapts += RecoveryAgent.deriveFromPredictions(predictions)
    allAdapts = MERGE(wisprAdapts, bioAdapts)

    // ── Fitness Proofing Gate ──
    proofing = FitnessProofing.apply(allAdapts, twin, {
      trigger: "voice_intent",
      voiceIntent: intentMatch.intent
    })
    // → approved[], blocked[], modified[]
    // → caps volume at 10% max increase
    // → forces coach approval on major adaptations
    // → halts training on high-severity injuries

  trace.step("insight-visualization")
    insights = InsightAgent.run({ twin, predictions, proofing.approved, anomalies })
    coachingSummary = InsightAgent.buildCoachingSummary(...)

  // ── Layer 4: Downstream Agent Dispatch ──
  downstreamActions = []
  FOR EACH adapt IN proofing.approved:
    IF adapt.autoApply AND NOT adapt.requiresCoachApproval:
      FOR EACH domain IN adapt.affectedDomains:
        downstreamActions.PUSH({
          target: MAP(domain → agent),  // workout → workout-programming
          payload: adapt,
          priority: adapt.magnitude
        })

  // ── Layer 5: Build MotionOS Document ──
  document = buildMotionOSDocument(ctx, twin, proofing, voiceLayer, trace)

  RETURN {
    document,                          // MotionOS_BioTracking_v1.0 JSON
    spokenFeedback: voiceLayer.spoken_feedback,
    downstreamActions,
    trace
  }

  // ── Async: Notify peer agents ──
  DISPATCH downstreamActions TO:
    - Workout Programming Agent  (modify_workout, exercise_swap)
    - Nutrition Agent            (adjust_nutrition)
    - Habit Coach Agent          (schedule_deload, sleep_hygiene)
```

### Agent Registry Under BioModelingSupervisor

| Agent | Hermes Role | Wispr | Triggers | Outputs To |
|-------|-------------|-------|----------|------------|
| IngestionAgent | DataCollector | ✅ | wearable, manual, voice | DigitalTwinModeler |
| DigitalTwinModeler | CorePhysiologyModel | ✅ | any data sync | Predictive, Anomaly, Recovery |
| PredictiveAnalyticsAgent | ForecastEngine | — | scheduled, post-sync | RecoveryAdapter |
| RecoveryAdapterAgent | RealTimeAdapter | ✅ | voice_intent, hrv_drop, soreness_spike | Workout, Nutrition, Habit |
| AnomalyDetector | SafetyGuard | — | pattern deviation | Coach escalation |
| InsightGenerator | ClientCoach | ✅ | pipeline complete | Dashboard UI |

---

## 3. Sample Voice → Adaptation Flows (5 Examples)

### Flow 1: "I'm sore"

```
Voice: "I'm sore"
  → Wispr intent: im_sore (confidence: 0.65)
  → Bio update: soreness = 7
  → Adaptations:
      • volume: Reduce training volume 20% + mobility finisher [auto-apply]
      • exercise_swap: Lower-stress alternatives [auto-apply]
  → Spoken: "Got it — I've reduced today's volume and added mobility work."
  → Downstream: workout-programming (volume -20%), habit-coach (mobility reminder)
  → Proofing: PASSED (minor/moderate magnitude)
```

### Flow 2: "I'm traveling this week"

```
Voice: "I'm traveling this week"
  → Wispr intent: traveling_this_week (confidence: 0.8)
  → Context update: travel = true, constraint added
  → Adaptations:
      • exercise_swap: Hotel-friendly bodyweight workout [auto-apply]
      • schedule: Shift to 3x/week travel sessions [auto-apply]
  → Spoken: "Travel mode activated. Hotel-friendly workouts ready."
  → Downstream: workout-programming (swap program), habit-coach (consistency nudge)
  → Digital Twin: constraint.type = "travel" added to contextual
```

### Flow 3: "I only have 20 minutes"

```
Voice: "I only have 20 minutes"
  → Wispr intent: only_20_minutes (confidence: 0.8)
  → Extracted: available_minutes = 20
  → Adaptations:
      • schedule: Compress to 20min supersets, maintain intensity [auto-apply]
  → Spoken: "20-minute power session ready. Paired exercises, cut rest periods."
  → Downstream: workout-programming (condense today's session)
  → Proofing: PASSED
```

### Flow 4: "My knee hurts"

```
Voice: "My knee hurts"
  → Wispr intent: knee_hurts (confidence: 0.8)
  → Bio update: soreness = 6
  → Injury flag: { body_part: "knee", severity: "medium", source: "voice" }
  → Adaptations:
      • exercise_swap: Remove squats/lunges/leg press [REQUIRES COACH APPROVAL]
  → Spoken: "I've flagged your knee concern. Coach will review alternatives."
  → Downstream: workout-programming (remove restricted movements)
  → Proofing: MODIFIED — autoApply=false, requiresCoachApproval=true
  → Medical disclaimer shown: YES
```

### Flow 5: "I'm feeling really low energy"

```
Voice: "I'm feeling really low energy"
  → Wispr intent: feeling_low_energy (confidence: 0.65)
  → Bio update: stress = 6
  → Cross-check: HRV vs baseline, sleep debt, caloric balance
  → Adaptations:
      • intensity: Reduce 25%, check HRV/sleep [auto-apply]
      • nutrition: Review caloric intake [REQUIRES COACH APPROVAL]
  → Spoken: "Energy's low — dialed back intensity. Checking nutrition targets."
  → Downstream: workout-programming, nutrition, habit-coach
  → If HRV < 70% baseline: additional anomaly warning triggered
```

---

## 4. UI Component Specs (MotionOS Dark Purple Design)

Design tokens: `types/motionos.ts` → `MOTIONOS_DESIGN_TOKENS`

| Token | Value | Usage |
|-------|-------|-------|
| Primary Purple | `#7C3AED` | Buttons, active states, ring accents |
| Accent Cyan | `#22D3EE` | Voice waveform, secondary highlights |
| Success Green | `#22C55E` | Recovery rings, positive metrics |
| Warn Amber | `#F59E0B` | Moderate adaptations, risk indicators |
| Alert Pink | `#F43F5E` | Critical alerts, major adaptations |
| BG Primary | `#0F0F16` | Screen background |
| BG Card | `#1A1A2E` | Card surfaces |
| Font | Satoshi | All text |

### RecoveryGauge (`components/motionos/recovery-gauge.tsx`)

- **Screen:** Dashboard → Daily Progress section
- **Layout:** 4 circular ring gauges in a row (Workouts, Nutrition, Steps, Sleep / Recovery, Load, Risk)
- **Ring:** SVG circle, 7px stroke, glow drop-shadow matching metric color
- **Center:** Bold numeric score (0-100)
- **Label:** Icon + text below ring
- **Animation:** 700ms ease-out stroke transition on value change

### AdaptationCard (`components/motionos/adaptation-card.tsx`)

- **Screen:** Dashboard, Workout (pre-session), AI Coach
- **Layout:** Card with left accent icon, type badge, magnitude pill
- **States:** Auto-applied (green check) vs Coach review (amber clock)
- **Spoken feedback:** Italic quote block with purple tint background
- **Medical disclaimer:** Amber warning icon + 10px disclaimer text for injury-related adaptations
- **Magnitude colors:** minor=cyan, moderate=amber, major=pink

### VoiceButton (`components/motionos/voice-button.tsx`)

- **Screen:** AI Coach (center), floating on all screens
- **Sizes:** sm=48px, md=64px, lg=80px
- **Idle:** Cyan→purple gradient, mic icon, purple glow shadow
- **Listening:** Pink→purple gradient, stop icon, ping animation ring
- **Floating variant:** Fixed bottom-right, "Talk to Coach" label
- **Entry points:** AI Coach screen center + floating mic on Dashboard/Workout/Profile

### BioTrendsChart (`components/motionos/bio-trends-chart.tsx`)

- **Screen:** Dashboard → Weekly Summary
- **Layout:** Horizontal bar chart, 7-day window
- **Bars:** Gradient fill (color→color80), rounded top, glow shadow
- **Labels:** Day abbreviation below, value above
- **Use cases:** Recovery trend, workout volume, calories burned

### AI Coach Screen Layout

```
┌─────────────────────────────┐
│  ← Back          AI Coach   │
│                             │
│      ╭─────────────╮        │
│      │  Purple Orb  │        │  ← pulsing waveform (existing .orb CSS)
│      │  (waveform)  │        │
│      ╰─────────────╯        │
│                             │
│  "I'm your AI Coach.        │
│   How can I help today?"    │
│                             │
│      [ VoiceButton lg ]     │
│       Tap to speak          │
│                             │
│  ┌─ AdaptationCard ─────┐   │  ← appears after voice intent
│  │ 🔧 Volume -20%       │   │
│  └──────────────────────┘   │
│                             │
│  [RecoveryGauge] [Gauge]    │  ← bio context strip
└─────────────────────────────┘
```

---

## 5. MVP Implementation Steps (<48 Hours)

### Phase 1: Foundation (Hours 0–8) ✅ DONE

- [x] JSON schema + TypeScript types
- [x] Hermes Memory store
- [x] 6 bio agents + BioModelingSupervisor
- [x] API routes (`/api/bio/*`, `/api/hermes`)
- [x] Score normalization engine

### Phase 2: Wispr + Proofing (Hours 8–16) ✅ DONE

- [x] Wispr intent detection (5 intents)
- [x] Spoken coaching feedback per intent
- [x] Fitness proofing gate (overload limits, injury weighting, coach approval)
- [x] MotionOS document builder
- [x] Wispr pipeline (`lib/wispr/pipeline.ts`)

### Phase 3: UI Demo (Hours 16–24) ✅ DONE

- [x] RecoveryGauge, AdaptationCard, VoiceButton, BioTrendsChart
- [x] Bio dashboard with floating voice button
- [x] AI Coach screen mock with orb waveform
- [x] Demo data seeding endpoint

### Phase 4: Integration (Hours 24–36) — NEXT

- [ ] Expo mobile app with `npx expo start --tunnel` for Expo Go
- [ ] Wire real Wispr SDK (replace text input fallback)
- [ ] Gemini narratives in InsightGenerator
- [ ] WebSocket push for real-time adaptation confirmations
- [ ] Builder Studio bio context injection endpoint

### Phase 5: Demo Polish (Hours 36–48) — NEXT

- [ ] End-to-end demo script (5 voice flows)
- [ ] Orchestration trace viewer for judges
- [ ] Marketplace "Digital Twin Report" export
- [ ] Coach override UI toggle

### Demo Script for Judges

```bash
# 1. Seed bio data
curl -X POST http://localhost:3000/api/bio/demo

# 2. View digital twin
curl "http://localhost:3000/api/bio/twin?clientId=demo_client&tier=pro"

# 3. Voice: "I'm sore" → volume reduction
curl -X POST http://localhost:3000/api/bio/insights \
  -H "Content-Type: application/json" \
  -d '{"clientId":"demo_client","transcript":"I am sore","tier":"pro"}'

# 4. Voice: "My knee hurts" → coach approval required
curl -X POST http://localhost:3000/api/bio/insights \
  -d '{"clientId":"demo_client","transcript":"My knee hurts","tier":"pro"}'

# 5. Full Hermes orchestration
curl -X POST http://localhost:3000/api/hermes \
  -d '{"clientId":"demo_client","intent":"full_pipeline","tier":"pro"}'
```

---

## File Map

```
schemas/motionos-bio-tracking.schema.json   ← Canonical JSON Schema
types/motionos.ts                          ← TypeScript contract + design tokens
lib/wispr/voice-layer.ts                   ← Intent detection + adaptation map
lib/wispr/pipeline.ts                      ← Wispr → Hermes → Document pipeline
lib/bio/fitness-proofing.ts                ← Safety guardrails
lib/bio/document.ts                        ← MotionOS document builder
components/motionos/                       ← UI components (4)
docs/hermes-buildathon-deliverable.md      ← This file
```
