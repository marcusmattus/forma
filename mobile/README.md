# FORMA Mobile (Expo Go)

Voice-first AI fitness coach — powered by Wispr + Hermes + MotionOS.

## Features

| Screen | Description |
|--------|-------------|
| **Voice Onboarding** | AI coach builds your profile via conversation |
| **Home** | Today's workout, weekly volume, proactive coach check-ins |
| **Live Workout** | Rep ring, timer, real-time AI cues + waveform |
| **Vision Tracking** | Camera pairing + form analysis status |
| **Progress** | Strength score, volume stats, recovery trends |
| **Profile** | Goals, experience, equipment, voice coach style |

Voice agent is the base layer — floating mic on every screen, `/api/bio/voice` for multi-turn coaching.

## Expo Go Compatibility

This app uses **Expo SDK 54** to match the App Store / Play Store version of Expo Go.

```bash
# 1. Start the Next.js API (from repo root)
npm run dev

# 2. Start Expo with tunnel (from this directory)
npm install
npm run tunnel
```

Scan the QR code with **Expo Go** on your phone.

### Environment

```
EXPO_PUBLIC_API_URL=http://YOUR_PUBLIC_API_URL:3000
```

`localhost` won't work on a physical device — use a deployed API or tunneled backend.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run tunnel` | Expo Go with ngrok tunnel |
| `npm start` | Local LAN mode |
