import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { distanceBucketLabel, distanceBucket, formatPace } from '../types/Run';
import { ScoredRun } from '../scoring/fitnessScore';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export function RunDetailScreen({ scored }: { scored: ScoredRun }) {
  const { run } = scored;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Section title="Run">
        <Row label="Date" value={run.date.toLocaleString()} />
        <Row label="Distance" value={`${run.distanceMiles.toFixed(2)} mi`} />
        <Row label="Duration" value={formatDuration(run.durationSeconds)} />
        <Row label="Pace" value={formatPace(run)} />
        {run.avgHeartRate !== undefined && (
          <Row label="Avg Heart Rate" value={`${Math.round(run.avgHeartRate)} bpm`} />
        )}
        {run.vo2Max !== undefined && <Row label="VO2 Max" value={`${run.vo2Max.toFixed(1)} mL/kg/min`} />}
        <Row label="Distance Bucket" value={distanceBucketLabel[distanceBucket(run)]} />
      </Section>

      <Section title="Fitness Score">
        {scored.efficiencyScore !== undefined && (
          <Row label="Pace-for-HR Score" value={`${Math.round(scored.efficiencyScore)}`} />
        )}
        {scored.vo2Score !== undefined && <Row label="VO2 Max Score" value={`${Math.round(scored.vo2Score)}`} />}
        {scored.overallScore !== undefined && (
          <Row label="Overall Score" value={`${Math.round(scored.overallScore)}`} bold />
        )}
        <Text style={styles.footnote}>
          Scores compare this run against your personal best at a similar distance, so a 100 means this run
          matched your best-ever effort in that range.
        </Text>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.rowValueBold]}>{value}</Text>
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
    gap: 20,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  rowLabel: {
    fontSize: 15,
  },
  rowValue: {
    fontSize: 15,
    color: '#8E8E93',
  },
  rowValueBold: {
    fontWeight: '700',
    color: '#1C1C1E',
  },
  footnote: {
    fontSize: 12,
    color: '#8E8E93',
    paddingVertical: 12,
  },
});
