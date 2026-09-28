import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Run } from '../types/Run';
import { currentScore, scoreRuns } from '../scoring/fitnessScore';
import { TrendChart } from '../components/TrendChart';

interface DashboardScreenProps {
  runs: Run[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function DashboardScreen({ runs, isLoading, onRefresh }: DashboardScreenProps) {
  const scoredRuns = useMemo(() => scoreRuns(runs), [runs]);
  const score = useMemo(() => currentScore(scoredRuns), [scoredRuns]);

  const last30Days = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return runs.filter((r) => r.date.getTime() >= cutoff);
  }, [runs]);

  const scoreTrendPoints = useMemo(
    () =>
      scoredRuns
        .filter((s) => s.overallScore !== undefined)
        .sort((a, b) => a.run.date.getTime() - b.run.date.getTime())
        .map((s) => ({ x: s.run.date.getTime(), y: s.overallScore as number })),
    [scoredRuns],
  );

  const vo2TrendPoints = useMemo(
    () =>
      runs
        .filter((r) => r.vo2Max !== undefined)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((r) => ({ x: r.date.getTime(), y: r.vo2Max as number })),
    [runs],
  );

  const avgPace = useMemo(() => {
    const withPace = last30Days.filter((r) => r.distanceMiles > 0);
    if (withPace.length === 0) return '–';
    const avg = withPace.reduce((sum, r) => sum + r.durationSeconds / 60 / r.distanceMiles, 0) / withPace.length;
    const minutes = Math.floor(avg);
    const seconds = Math.round((avg - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [last30Days]);

  const avgHeartRate = useMemo(() => {
    const withHR = last30Days.map((r) => r.avgHeartRate).filter((v): v is number => v !== undefined);
    if (withHR.length === 0) return '–';
    return `${Math.round(withHR.reduce((a, b) => a + b, 0) / withHR.length)}`;
  }, [last30Days]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
    >
      {runs.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No running workouts found in Health yet.</Text>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Running Fitness Score</Text>
            {score !== undefined ? (
              <>
                <Text style={styles.scoreValue}>{Math.round(score)}</Text>
                <Text style={styles.caption}>
                  Based on your last few runs vs. your personal best pace-for-heart-rate
                </Text>
              </>
            ) : (
              <Text style={styles.caption}>Needs a run with heart rate data</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Fitness Trend</Text>
            <TrendChart points={scoreTrendPoints} minY={0} maxY={100} />
          </View>

          <View style={styles.statsRow}>
            <StatTile title="Runs (30d)" value={`${last30Days.length}`} />
            <StatTile title="Avg Pace" value={avgPace} />
            <StatTile title="Avg HR" value={avgHeartRate} />
          </View>

          {vo2TrendPoints.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>VO2 Max</Text>
              <TrendChart points={vo2TrendPoints} color="#3478F6" height={140} />
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function StatTile({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  emptyState: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 15,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center',
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 4,
  },
  caption: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statTitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
});
