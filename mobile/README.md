# MotionOS Mobile (Expo Go)

Bio Tracking demo app for the Hermes Buildathon.

## Expo Go Compatibility

This app uses **Expo SDK 54** to match the App Store / Play Store version of Expo Go.

If you see *"Project is incompatible with this version of Expo Go"*:
- Update Expo Go from the App Store / Play Store, **or**
- Ensure this project stays on SDK 54 (`expo ~54.0.0` in `package.json`)

SDK 57+ requires a newer Expo Go that may not yet be on the App Store.

```bash
# 1. Start the Next.js API (from repo root)
npm run dev

# 2. Start Expo with tunnel (from this directory)
npm install
npm run tunnel
```

Scan the QR code with **Expo Go** on your phone. Tunnel mode works across networks without LAN.

### Environment

Copy `.env.example` to `.env` and set your API URL:

```
EXPO_PUBLIC_API_URL=http://YOUR_MACHINE_IP:3000
```

For tunnel mode, use your machine's public IP or a deployed API URL.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run tunnel` | Expo Go with ngrok tunnel |
| `npm start` | Local LAN mode |
| `npm run android` | Android emulator |
| `npm run ios` | iOS simulator (macOS only) |

## Screens

- Daily Progress rings (Recovery, Load, Risk)
- Wispr voice input → adaptations
- AI Coach spoken feedback
