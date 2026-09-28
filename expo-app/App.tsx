import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useHealthKitRuns } from './src/health/useHealthKitRuns';
import { scoreRuns } from './src/scoring/fitnessScore';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { RunDetailScreen } from './src/screens/RunDetailScreen';

const Tab = createBottomTabNavigator();
const HistoryStack = createNativeStackNavigator();

export default function App() {
  const { authState, runs, isLoading, errorMessage, requestAuthorizationAndLoad, reload } = useHealthKitRuns();

  useEffect(() => {
    if (authState === 'idle') {
      requestAuthorizationAndLoad();
    }
  }, [authState, requestAuthorizationAndLoad]);

  if (authState !== 'granted') {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Stride</Text>
        <Text style={styles.subtitle}>
          Stride reads your running workouts from Apple Health to show whether your running fitness is
          improving over time.
        </Text>
        {authState === 'requesting' && <ActivityIndicator style={{ marginTop: 16 }} />}
        {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
        {authState !== 'requesting' && (
          <Button title="Connect to Health" onPress={requestAuthorizationAndLoad} />
        )}
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Dashboard">
          {() => <DashboardScreen runs={runs} isLoading={isLoading} onRefresh={reload} />}
        </Tab.Screen>
        <Tab.Screen name="History">
          {() => <HistoryStackScreen runs={runs} isLoading={isLoading} onRefresh={reload} />}
        </Tab.Screen>
      </Tab.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

function HistoryStackScreen({
  runs,
  isLoading,
  onRefresh,
}: {
  runs: ReturnType<typeof useHealthKitRuns>['runs'];
  isLoading: boolean;
  onRefresh: () => void;
}) {
  const scoredRuns = useMemo(() => scoreRuns(runs), [runs]);

  return (
    <HistoryStack.Navigator>
      <HistoryStack.Screen name="History List" options={{ title: 'History' }}>
        {({ navigation }) => (
          <HistoryScreen
            runs={runs}
            isLoading={isLoading}
            onRefresh={onRefresh}
            onSelectRun={(scored) => navigation.navigate('Run Detail', { runId: scored.run.id })}
          />
        )}
      </HistoryStack.Screen>
      <HistoryStack.Screen name="Run Detail" options={{ title: 'Run Details' }}>
        {({ route }) => {
          const { runId } = route.params as { runId: string };
          const scored = scoredRuns.find((s) => s.run.id === runId);
          if (!scored) return null;
          return <RunDetailScreen scored={scored} />;
        }}
      </HistoryStack.Screen>
    </HistoryStack.Navigator>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
  },
  error: {
    color: '#FF3B30',
    fontSize: 13,
    textAlign: 'center',
  },
});
