import React, { useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Run, formatPace } from '../types/Run';
import { ScoredRun, scoreRuns } from '../scoring/fitnessScore';

interface HistoryScreenProps {
  runs: Run[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectRun: (scored: ScoredRun) => void;
}

export function HistoryScreen({ runs, isLoading, onRefresh, onSelectRun }: HistoryScreenProps) {
  const scoredRuns = useMemo(
    () => scoreRuns(runs).sort((a, b) => b.run.date.getTime() - a.run.date.getTime()),
    [runs],
  );

  if (scoredRuns.length === 0 && !isLoading) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No runs yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={scoredRuns}
      keyExtractor={(item) => item.run.id}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
      renderItem={({ item }) => <RunRow scored={item} onPress={() => onSelectRun(item)} />}
    />
  );
}

function RunRow({ scored, onPress }: { scored: ScoredRun; onPress: () => void }) {
  const { run } = scored;
  const dateLabel = run.date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={styles.dateText}>{dateLabel}</Text>
        <Text style={styles.subText}>
          {run.distanceMiles.toFixed(2)} mi · {formatPace(run)}
        </Text>
        {run.avgHeartRate !== undefined && (
          <Text style={styles.subText}>Avg HR {Math.round(run.avgHeartRate)} bpm</Text>
        )}
      </View>
      {scored.overallScore !== undefined && (
        <Text style={[styles.score, scoreColor(scored.overallScore)]}>
          {Math.round(scored.overallScore)}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function scoreColor(score: number) {
  if (score >= 85) return { color: '#34C759' };
  if (score >= 65) return { color: '#1C1C1E' };
  return { color: '#FF9500' };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
  },
  subText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  score: {
    fontSize: 20,
    fontWeight: '700',
  },
});
