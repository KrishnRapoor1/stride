export type DistanceBucket = 'short' | 'medium' | 'long';

export function bucketForDistance(miles: number): DistanceBucket {
  if (miles < 3) return 'short';
  if (miles <= 6) return 'medium';
  return 'long';
}

export const distanceBucketLabel: Record<DistanceBucket, string> = {
  short: 'Short (<3mi)',
  medium: 'Medium (3-6mi)',
  long: 'Long (>6mi)',
};

export interface Run {
  id: string;
  date: Date;
  distanceMiles: number;
  durationSeconds: number;
  avgHeartRate?: number;
  vo2Max?: number;
}

export function paceMinutesPerMile(run: Run): number {
  if (run.distanceMiles <= 0) return 0;
  return run.durationSeconds / 60 / run.distanceMiles;
}

export function speedMph(run: Run): number {
  if (run.durationSeconds <= 0) return 0;
  return run.distanceMiles / (run.durationSeconds / 3600);
}

/** Speed per heart-rate beat, scaled for readability. Higher = more efficient. */
export function efficiencyIndex(run: Run): number | undefined {
  if (!run.avgHeartRate || run.avgHeartRate <= 0) return undefined;
  return (speedMph(run) / run.avgHeartRate) * 100;
}

export function distanceBucket(run: Run): DistanceBucket {
  return bucketForDistance(run.distanceMiles);
}

export function formatPace(run: Run): string {
  const pace = paceMinutesPerMile(run);
  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} /mi`;
}
