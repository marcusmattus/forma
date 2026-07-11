# MotionOS Voice Interaction Patterns
## Wispr + Hermes AI Coach

> Conversational · Context-Aware · Action-Oriented · Multi-Modal

---

## Core Voice Philosophy

| Principle | Implementation |
|-----------|----------------|
| **Conversational** | Spoken responses use coach tone, not robotic confirmations |
| **Context-Aware** | Every turn pulls Hermes Memory + Digital Twin bio state |
| **Action-Oriented** | Voice triggers real adaptations via BioModelingSupervisor |
| **Multi-Modal** | Voice in → spoken + visual cards + data updates out |

**Schema:** `schemas/wispr-intent.schema.json`  
**Registry:** `lib/wispr/intent-registry.ts` (22 intents)  
**Multi-turn:** `lib/wispr/conversation.ts`  
**API:** `POST /api/bio/voice`

---

## 1. Full Voice Flow Diagram

### Master Flow: User Utterance → Hermes Action

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER (Wispr Mic)                                │
│              "I'm sore" / "20 minutes" / "How am I doing?"              │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  WISPR LAYER                                                            │
│  ├─ Speech-to-text                                                      │
│  ├─ detectIntentFromRegistry()                                          │
│  ├─ extractEntities() — body parts, minutes, sleep hours, weight        │
│  └─ Load VoiceSessionState from Hermes Memory                           │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │ awaiting_clarification? │
                    └────────────┬────────────┘
                          YES    │    NO
                    ┌────────────┴────────────┐
                    ▼                         ▼
         ┌──────────────────┐      ┌──────────────────────┐
         │ MULTI-TURN       │      │ PATTERN ROUTER         │
         │ "Where exactly?" │      │ A/B/C/D/E              │
         │ User: "Quads"    │      └──────────┬─────────────┘
         │ → targeted adapt │                 │
         └────────┬─────────┘                 ▼
                  │              ┌──────────────────────────────┐
                  └─────────────▶│ HERMES FitnessSupervisor      │
                                 │   └─ BioModelingSupervisor    │
                                 │       ├─ IngestionAgent       │
                                 │       ├─ DigitalTwinModeler   │
                                 │       ├─ Predictive ∥ Anomaly │
                                 │       ├─ RecoveryAdapter      │
                                 │       └─ InsightGenerator     │
                                 └──────────┬───────────────────┘
                                            │
                                 ┌──────────┴──────────┐
                                 ▼                     ▼
                      ┌─────────────────┐   ┌─────────────────┐
                      │ FitnessProofing │   │ Peer Agents      │
                      │ overload caps   │   │ Workout          │
                      │ coach approval  │   │ Nutrition        │
                      │ medical disclaim│   │ Habit Coach      │
                      └────────┬────────┘   │ Builder Studio   │
                               │            └─────────────────┘
                               ▼
                      ┌─────────────────────────────────┐
                      │ OUTPUT (Multi-Modal)             │
                      │ • spoken_response (Wispr TTS)    │
                      │ • visual_updates (UI cards)      │
                      │ • data_updates (bio log)         │
                      │ • follow_up_prompt (optional)    │
                      └─────────────────────────────────┘
```

### Pattern A: Status Update & Instant Adaptation

```
User: "I'm sore today"
  → Intent: im_sore | Pattern: status_update_adaptation
  → Clarification needed? → "Where exactly?"
  → User: "Quads and lower back"
  → Intent: injury_location_followup
  → Agents: Ingestion → RecoveryAdapter → Workout
  → Bio: log soreness=7, body_parts=[quads, lower back]
  → Adapt: volume -20%, targeted exercise swap
  → Spoken: "Got it. I've reduced volume on lower body...
             Recovery score is now 68. Want me to adjust tomorrow too?"
  → Visual: adaptation_card + recovery_gauge + workout_card
```

### Pattern B: Constraint-Based Planning

```
User: "I only have 20 minutes"
  → Intent: only_20_minutes | Pattern: constraint_based_planning
  → Agents: DigitalTwin (check energy) → Workout (compress)
  → Bio: available_minutes=20 extracted
  → Adapt: supersets, minimal rest, maintain intensity
  → Spoken: "20-minute power session ready — check your screen."
  → Visual: workout_card updated
```

### Pattern C: Progress & Motivation

```
User: "How am I doing?"
  → Intent: progress_check | Pattern: progress_motivation
  → Agents: InsightGenerator + ProgressAnalyst + DigitalTwin
  → Spoken: "This week: 4 workouts, recovery averaging 76%..."
  → Visual: dashboard refresh + recovery_gauge
```

### Pattern D: Deep Query

```
User: "Why is my HRV low?"
  → Intent: why_hrv_low | Pattern: deep_query
  → Agents: Predictive + Recovery + Insight
  → Cross-ref: sleep debt, load score, HRV vs baseline
  → Spoken: "HRV is 15% below baseline. Likely: 4h sleep debt..."
  → Visual: recovery_gauge + adaptation_card (recovery protocol)
```

### Pattern E: Proactive Coaching

```
[System-initiated — GET /api/bio/voice?proactive=true]
  → Trigger: sleep < 6.5h OR HRV drop > 20%
  → Intent: proactive_recovery | Pattern: proactive_coaching
  → Spoken: "Your sleep was only 6.2 hours. Want a recovery protocol?"
  → Visual: recovery_gauge + adaptation_card
  → Follow-up: User says "yes" → confirm_adaptation
```

### Hybrid Voice + Touch

```
User speaks → AdaptationCard appears → User taps [Confirm] / [Adjust]
  → confirm_adaptation intent → apply_adaptation downstream action
```

---

## 2. Voice Command Categories + Hermes Flow

| Category | Example Utterances | Pattern | Triggered Agents | Output |
|----------|-------------------|---------|------------------|--------|
| Health / Soreness | "I'm sore", "Knee hurts", "Back is tight" | A | Ingestion → Recovery → Workout | Adaptation + visual |
| Time / Schedule | "Only 20 min", "Quick session" | B | DigitalTwin → Workout | Compressed workout |
| Travel / Environment | "I'm traveling", "Hotel workout" | B | Recovery → Workout → Habit | Travel program |
| Progress Check | "How's my progress?", "Update me" | C | Insight → Progress → Twin | Spoken + dashboard |
| Nutrition | "What should I eat?", "Craving carbs" | D | Nutrition → Bio Model | Meal card |
| Data Logging | "I slept 8 hours", "Weighed 82kg" | A | Ingestion → Twin | Confirmation |
| Program Creation | "Build me a 4 week plan" | B | Builder Studio → Twin | Program gen |
| Recovery Deep Dive | "Why am I tired?", "Why HRV low?" | D | Predictive → Recovery | Explanation |
| Proactive | [System] sleep/HRV alert | E | Anomaly → Recovery | Offer protocol |
| Confirmation | "Yes", "Adjust tomorrow" | Hybrid | Recovery → Workout | Apply/schedule |

---

## 3. Sample Dialog Scripts (10 Scenarios)

### Script 1: Soreness with Multi-Turn (Pattern A)

```
User:  "I'm sore today"
Coach: "Where exactly are you sore?"
User:  "Quads and lower back"
Coach: "Thanks — I've applied targeted adaptations for quads and lower back.
        Avoid aggravating movements today. Recovery score: 68.
        Want me to adjust tomorrow too?"
User:  "Yes, adjust tomorrow"
Coach: "Tomorrow's session adjusted to match today's recovery plan."
```

### Script 2: Knee Pain (Pattern A + Proofing)

```
User:  "My knee hurts"
Coach: "I've reduced lower-body volume and swapped squats for Romanian deadlifts.
        Your coach will review. Recovery score: 65.
        [Medical disclaimer shown on adaptation card]"
```

### Script 3: Time Constraint (Pattern B)

```
User:  "I only have 20 minutes"
Coach: "20-minute power session ready — supersets, minimal rest.
        Visual workout updated on your screen."
```

### Script 4: Travel Week (Pattern B)

```
User:  "I'm traveling this week"
Coach: "Travel mode on. Hotel-friendly bodyweight program loaded.
        Bio model checked your energy — good for moderate intensity."
```

### Script 5: Progress Check (Pattern C)

```
User:  "How am I doing?"
Coach: "This week: 4 workouts, recovery averaging 76%.
        Strength trend is improving. Dashboard updated."
```

### Script 6: HRV Deep Dive (Pattern D)

```
User:  "Why is my HRV low?"
Coach: "HRV is 72% of baseline. Likely causes: 4h sleep debt, recent high load.
        I recommend an extra rest day and earlier bedtime."
```

### Script 7: Nutrition Query (Pattern D)

```
User:  "What should I eat after this workout?"
Coach: "Based on today's workout and 450 kcal remaining:
        lean protein + complex carbs. Nutrition card updated."
```

### Script 8: Data Logging (Pattern A)

```
User:  "I slept 8 hours last night"
Coach: "Logged 8 hours of sleep. Recovery score updated to 82."
```

### Script 9: Builder Studio — Coach Mode (Pattern B)

```
Coach: "Build me a 12-week program for women over 40"
AI:    "Opening Builder Studio with bio profile context.
        I'll factor in recovery, injuries, and goals. Describe any specifics?"
```

### Script 10: Proactive Recovery (Pattern E)

```
AI:    "Your sleep was only 6.2 hours last night.
        Would you like a quick recovery protocol?"
User:  "Yes"
Coach: "Done — adaptation applied. Light mobility + reduced intensity today."
```

---

## 4. Wispr Intent Schema (Implementation)

**File:** `schemas/wispr-intent.schema.json`

22 intent IDs across 10 categories. Each intent defines:

- `keywords` — detection triggers
- `pattern` — A/B/C/D/E routing
- `hermes_routing.triggered_agents` — agent chain
- `spoken_response_template` — with `{recovery_score}` interpolation
- `requires_clarification` — multi-turn flag

**Runtime types:** `types/wispr.ts`  
**Detection:** `lib/wispr/intent-detector.ts`  
**Response:** `lib/wispr/response-builder.ts`

### API Usage

```bash
# Single voice turn
curl -X POST http://localhost:3000/api/bio/voice \
  -H "Content-Type: application/json" \
  -d '{"clientId":"demo_client","transcript":"I am sore","sessionId":"sess_1"}'

# Multi-turn follow-up (same sessionId)
curl -X POST http://localhost:3000/api/bio/voice \
  -d '{"clientId":"demo_client","transcript":"Quads and lower back","sessionId":"sess_1"}'

# Proactive coaching (Pattern E)
curl "http://localhost:3000/api/bio/voice?clientId=demo_client&proactive=true"
```

### Response Shape

```json
{
  "intentResult": {
    "system": "MotionOS_WisprIntent_v1.0",
    "intent_id": "im_sore",
    "pattern": "multi_turn_clarification",
    "awaiting_clarification": true,
    "output": {
      "spoken_response": "Where exactly are you sore?",
      "visual_updates": [],
      "follow_up_prompt": "Where exactly are you sore?"
    },
    "hermes_routing": {
      "triggered_agents": ["ingestion-normalization", "recovery-adaptation", "workout-programming"]
    }
  }
}
```

---

## 5. UI Integration (Voice Patterns Visualized)

| Screen | Voice Entry | Visual Output |
|--------|-------------|---------------|
| **Dashboard** | Floating mic button | RecoveryGauge rings update |
| **AI Coach** | Center VoiceButton + orb waveform | Spoken text + AdaptationCards |
| **Workout** | "Log set" / "Skip exercise" | Workout card modifications |
| **Profile** | "Update me on progress" | Dashboard refresh |

### Component Mapping

| Visual Update Flag | Component |
|--------------------|-----------|
| `recovery_gauge` | `RecoveryGauge` |
| `adaptation_card` | `AdaptationCard` |
| `workout_card` | Workout interface (mobile mockup) |
| `dashboard` | `BioDashboard` + `BioTrendsChart` |
| `nutrition_card` | Nutrition screen (future) |
| `builder_studio` | Builder Studio (future) |

---

## Coach Mode vs Client Mode

| Mode | Example | Routing |
|------|---------|---------|
| **Client** | "I'm sore", "How am I doing?" | BioModelingSupervisor → client-facing agents |
| **Coach** | "Build 12-week program for women over 40" | Builder Studio + full bio context, audience=coach |

Pass `mode: "coach"` in `POST /api/bio/voice` for Builder Studio voice commands.

---

## Implementation Status

| Feature | Status |
|---------|--------|
| 22 intent registry | ✅ |
| Patterns A–E | ✅ |
| Multi-turn clarification | ✅ |
| Proactive coaching API | ✅ |
| Hermes bio pipeline integration | ✅ |
| Fitness proofing on voice adaptations | ✅ |
| Visual update flags in response | ✅ |
| Real Wispr SDK / TTS | 🔜 |
| Hybrid touch confirmation UI | 🔜 |
| Figma screen updates | 🔜 |
