# Stride (Expo / React Native)

A React Native port of Stride: reads your running workouts from Apple
Health and scores whether your running fitness is improving, without
needing a Mac to build it (via EAS Build).

Same scoring logic as the native Swift version in the repo root — see
`src/scoring/fitnessScore.ts` and `../README.md` for how the score works
(self-relative pace-for-heart-rate efficiency, bucketed by distance, blended
with VO2max when available).

## Why this needs a custom build (not Expo Go)

HealthKit access comes from `@kingstinct/react-native-healthkit`, a native
module. Expo Go can't load custom native code, so this app only runs in a
**development build** (or a full build) — never inside the plain Expo Go
app. The good news: EAS Build compiles the iOS app in the cloud, so you
don't need Xcode or a Mac to produce an installable build.

You do still need:
- A physical iPhone (HealthKit workout/heart-rate/VO2max data doesn't
  exist in the iOS Simulator).
- A free or paid Apple Developer account (free works for `eas build` with
  `internal` distribution + registering your device's UDID; paid ($99/yr)
  removes the 7-day resign requirement and lets you use TestFlight).
- An Expo account (free) to run EAS Build.

## One-time setup

```bash
cd expo-app
npm install
npm install -g eas-cli   # or use `npx eas-cli`
eas login
eas build:configure      # links this project to your Expo account
```

## Build and install a development client

```bash
eas build --profile development --platform ios
```

This produces a `.ipa`. EAS will prompt you to register your iPhone (via
its UDID) the first time — follow the prompt, it handles provisioning for
you. Once the build finishes, install it on your phone via the QR code /
link EAS gives you.

## Run the app

```bash
npx expo start --dev-client
```

Scan the QR code (or open the dev-client app already on your phone) to
load the JS bundle. On first launch, Stride will ask for Health
permission to read workouts, heart rate, and VO2max.

## Iterating

Once the development client is installed, you only need to re-run
`eas build` if you change native dependencies (e.g. add another
HealthKit-adjacent package). Plain JS/TSX changes reload instantly via
`expo start --dev-client`, same as any Expo app.

## Project structure

```
App.tsx                          Navigation root + Health auth gate
src/
  types/Run.ts                   Run model + pace/speed/efficiency math
  health/useHealthKitRuns.ts     HealthKit auth + fetching workouts, HR, VO2max
  scoring/fitnessScore.ts        Self-relative scoring logic
  components/TrendChart.tsx      Minimal SVG line chart (no chart library needed)
  screens/DashboardScreen.tsx    Score, trend chart, VO2max chart, stats
  screens/HistoryScreen.tsx      List of past runs
  screens/RunDetailScreen.tsx    Single run breakdown
```
