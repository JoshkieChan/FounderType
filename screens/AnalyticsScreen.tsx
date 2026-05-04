import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { BrowserStorage } from '../lib/clientCache';

const { width: screenWidth } = Dimensions.get('window');

interface AnalyticsData {
  totalCommitments: number;
  completedCommitments: number;
  abandonedCommitments: number;
  averageCompletionRate: number;
  pageLoadTimes: number[];
  apiResponseTimes: number[];
}

export default function AnalyticsScreen({
  navigation,
}: {
  navigation: { goBack: () => void };
}) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = () => {
    try {
      const pageMetrics = BrowserStorage.get('page_metrics') || [];
      const apiMetrics = BrowserStorage.get('api_metrics') || [];

      // Simulate commitment data (in real app, this would come from your database)
      const mockData: AnalyticsData = {
        totalCommitments: 150,
        completedCommitments: 90,
        abandonedCommitments: 60,
        averageCompletionRate: 60,
        pageLoadTimes: pageMetrics.map((m: any) => m.loadTime || 1000),
        apiResponseTimes: apiMetrics.map((m: any) => m.duration || 500),
      };

      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearAnalyticsData = () => {
    BrowserStorage.remove('page_metrics');
    BrowserStorage.remove('api_metrics');
    loadAnalyticsData();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!analyticsData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load analytics data</Text>
        </View>
      </SafeAreaView>
    );
  }

  const commitmentData = [
    {
      name: 'Completed',
      value: analyticsData.completedCommitments,
      color: '#22C55E',
    },
    {
      name: 'Abandoned',
      value: analyticsData.abandonedCommitments,
      color: '#EF4444',
    },
  ];

  const chartConfig = {
    backgroundColor: '#1A1A1A',
    backgroundGradientFrom: '#1A1A1A',
    backgroundGradientTo: '#2A2A2A',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#3B82F6',
    },
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Analytics</Text>
        <TouchableOpacity onPress={clearAnalyticsData}>
          <Text style={styles.clearButton}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Commitment Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {analyticsData.totalCommitments}
              </Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#22C55E' }]}>
                {analyticsData.completedCommitments}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#EF4444' }]}>
                {analyticsData.abandonedCommitments}
              </Text>
              <Text style={styles.statLabel}>Abandoned</Text>
            </View>
          </View>
          <View style={styles.completionRate}>
            <Text style={styles.completionRateText}>
              {analyticsData.averageCompletionRate}% Completion Rate
            </Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Commitment Status</Text>
          <BarChart
            data={{
              labels: commitmentData.map((d) => d.name),
              datasets: [
                {
                  data: commitmentData.map((d) => d.value),
                },
              ],
            }}
            width={screenWidth - 32}
            height={220}
            yAxisLabel=""
            chartConfig={chartConfig}
            style={styles.chart}
          />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <Text style={styles.chartSubtitle}>Page Load Times (ms)</Text>
          <LineChart
            data={{
              labels: analyticsData.pageLoadTimes
                .slice(-10)
                .map((_, i) => `${i + 1}`),
              datasets: [
                {
                  data: analyticsData.pageLoadTimes.slice(-10),
                  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                  strokeWidth: 2,
                },
              ],
            }}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
          />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartSubtitle}>API Response Times (ms)</Text>
          <LineChart
            data={{
              labels: analyticsData.apiResponseTimes
                .slice(-10)
                .map((_, i) => `${i + 1}`),
              datasets: [
                {
                  data: analyticsData.apiResponseTimes.slice(-10),
                  color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                  strokeWidth: 2,
                },
              ],
            }}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  backButton: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  clearButton: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
  },
  statsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  completionRate: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completionRateText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  chartContainer: {
    marginBottom: 24,
  },
  chartSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});
