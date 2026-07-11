export {
  detectWisprIntent,
  getWisprAdaptations,
  buildWisprVoiceLayer,
  wisprAdaptationsToRecommendations,
} from './voice-layer';
export { detectIntentFromRegistry } from './intent-detector';
export { INTENT_REGISTRY, getIntentDefinition, getIntentsByCategory } from './intent-registry';
export { processVoiceTurn, generateProactivePrompt, getVoiceSession } from './conversation';
export { processWisprVoice, getProactiveCoaching } from './pipeline';
