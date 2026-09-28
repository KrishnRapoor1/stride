# Stride

A simple iOS app that reads your running workouts from Apple Health and
tells you whether your running fitness is actually improving.

This repo has two implementations of the same app:
- **`Stride/` + `Stride.xcodeproj`** — native Swift/SwiftUI, built with Xcode.
- **`expo-app/`** — React Native/Expo, built via EAS Build (no Mac needed
  to produce an installable build — see `expo-app/README.md`).

Both use the same scoring logic described below.

## What it shows

- **Fitness Score (0–100)** — a single number, averaged over your last 4
  runs, that tells you if you're trending up or down.
- **History** — every running workout from Health, with distance, pace,
  average heart rate, and a per-run score.
- **VO2 Max trend** — plotted over time when Health has readings (from an
  Apple Watch run, for example).

## How the score works

Rather than scoring you against generic age/max-heart-rate tables, Stride
scores you against **your own best performances**:

1. For every run it computes an **efficiency index**: speed (mph) per
   heart-rate beat. Running faster at a lower heart rate is a direct sign
   of aerobic fitness.
2. Since heart rate naturally climbs on longer runs (cardiac drift), runs
   are grouped into three distance buckets — short (<3mi), medium
   (3–6mi), long (>6mi) — and each run is compared only to your personal
   best efficiency *in the same bucket*.
3. If Health has VO2max data, it's scored the same way (relative to your
   personal best VO2max) and blended in (60% pace-for-heart-rate, 40%
   VO2max).

A score of 100 means a run matched your best-ever effort at that
distance. Watching the trend line over weeks/months answers "am I
getting fitter?" far better than any single run's raw numbers.

## Project structure

```
Stride/
  StrideApp.swift              App entry point
  ContentView.swift            Health authorization + tab navigation
  Models/Run.swift             Run model + pace/speed/efficiency math
  Health/HealthKitManager.swift  HealthKit auth + fetching workouts, HR, VO2max
  Scoring/FitnessScoreCalculator.swift  The scoring logic described above
  Views/DashboardView.swift    Score, trend chart, VO2max chart, stats
  Views/HistoryView.swift      List of past runs
  Views/RunDetailView.swift    Single run breakdown
```

## Running it

1. Open `Stride.xcodeproj` in Xcode (15.3+ recommended).
2. Select your Apple ID under Signing & Capabilities (needed for the
   HealthKit entitlement to work on a real device — HealthKit isn't
   available in the Simulator's Health app for real workout data, so a
   physical iPhone is the best way to test).
3. Build and run. On first launch it'll ask for Health permission to read
   workouts, heart rate, and VO2max.

No third-party dependencies — HealthKit, SwiftUI, and Swift Charts only.
