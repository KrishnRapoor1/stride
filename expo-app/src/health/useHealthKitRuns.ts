import { useCallback, useState } from 'react';
import {
  isHealthDataAvailableAsync,
  queryQuantitySamples,
  queryStatisticsForQuantity,
  queryWorkoutSamples,
  requestAuthorization,
  WorkoutActivityType,
  WorkoutTypeIdentifier,
} from '@kingstinct/react-native-healthkit';
import { Run } from '../types/Run';

const METERS_PER_MILE = 1609.344;
const VO2_MAX_WINDOW_MS = 24 * 60 * 60 * 1000;

export type AuthState = 'idle' | 'requesting' | 'granted' | 'error';

interface HealthKitRunsState {
  authState: AuthState;
  runs: Run[];
  isLoading: boolean;
  errorMessage?: string;
  requestAuthorizationAndLoad: () => Promise<void>;
  reload: () => Promise<void>;
}

function toMiles(quantity: number, unit: string): number {
  if (unit === 'mi') return quantity;
  if (unit === 'm') return quantity / METERS_PER_MILE;
  if (unit === 'km') return (quantity * 1000) / METERS_PER_MILE;
  return quantity / METERS_PER_MILE;
}

function toSeconds(quantity: number, unit: string): number {
  if (unit === 's') return quantity;
  if (unit === 'min') return quantity * 60;
  if (unit === 'hr') return quantity * 3600;
  return quantity;
}

export function useHealthKitRuns(): HealthKitRunsState {
  const [authState, setAuthState] = useState<AuthState>('idle');
  const [runs, setRuns] = useState<Run[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const loadRuns = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(undefined);
    try {
      const workouts = await queryWorkoutSamples({
        filter: { workoutActivityType: WorkoutActivityType.running },
        limit: 200,
        ascending: false,
      });

      // VO2max is recorded periodically (e.g. from an Apple Watch run), not
      // per-workout, so fetch it once and match the closest reading per run.
      const vo2Samples = await queryQuantitySamples('HKQuantityTypeIdentifierVO2Max', {
        limit: -1,
        ascending: true,
        unit: 'ml/(kg*min)',
      });

      const loaded: Run[] = [];
      for (const workout of workouts) {
        const distanceQuantity = workout.totalDistance;
        if (!distanceQuantity) continue;
        const distanceMiles = toMiles(distanceQuantity.quantity, distanceQuantity.unit);
        if (distanceMiles <= 0) continue;

        const durationSeconds = toSeconds(workout.duration.quantity, workout.duration.unit);

        let avgHeartRate: number | undefined;
        try {
          const stats = await queryStatisticsForQuantity(
            'HKQuantityTypeIdentifierHeartRate',
            ['discreteAverage'],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the typed workout proxy is structurally a WorkoutProxy at runtime
            { filter: { workout: workout as any }, unit: 'count/min' },
          );
          avgHeartRate = stats.averageQuantity?.quantity;
        } catch {
          avgHeartRate = undefined;
        }

        const workoutTime = workout.startDate.getTime();
        let closestVo2: number | undefined;
        let closestDiff = Infinity;
        for (const sample of vo2Samples) {
          const diff = Math.abs(sample.startDate.getTime() - workoutTime);
          if (diff < closestDiff && diff <= VO2_MAX_WINDOW_MS) {
            closestDiff = diff;
            closestVo2 = sample.quantity;
          }
        }

        loaded.push({
          id: workout.uuid,
          date: workout.startDate,
          distanceMiles,
          durationSeconds,
          avgHeartRate,
          vo2Max: closestVo2,
        });
      }

      loaded.sort((a, b) => b.date.getTime() - a.date.getTime());
      setRuns(loaded);
    } catch (error) {
      setErrorMessage(`Couldn't load your runs: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestAuthorizationAndLoad = useCallback(async () => {
    setAuthState('requesting');
    setErrorMessage(undefined);
    try {
      const available = await isHealthDataAvailableAsync();
      if (!available) {
        setErrorMessage("Health data isn't available on this device.");
        setAuthState('error');
        return;
      }
      await requestAuthorization({
        toRead: [
          WorkoutTypeIdentifier,
          'HKQuantityTypeIdentifierHeartRate',
          'HKQuantityTypeIdentifierVO2Max',
        ],
      });
      setAuthState('granted');
      await loadRuns();
    } catch (error) {
      setErrorMessage(`Couldn't get permission to read Health data: ${(error as Error).message}`);
      setAuthState('error');
    }
  }, [loadRuns]);

  return {
    authState,
    runs,
    isLoading,
    errorMessage,
    requestAuthorizationAndLoad,
    reload: loadRuns,
  };
}
