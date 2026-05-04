import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';

interface AnalyticsData {
  overview: {
    totalCommitments: number;
    completedCommitments: number;
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
    totalDaysActive: number;
  };
  weeklyProgress: {
    labels: string[];
    data: number[];
  };
  categoryBreakdown: {
    labels: string[];
    data: number[];
    colors: string[];
  };
  monthlyTrends: {
    labels: string[];
    data: number[];
  };
  achievements: {
    title: string;
    description: string;
    date: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[];
}

const Container = Platform.OS === 'web' ? View : SafeAreaView;

export default function UserAnalyticsScreen() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const netInfo = useNetInfo();

  const screenWidth = Dimensions.get('window').width - 40;

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Simulate API call - in real app, fetch from your backend
      const mockData: AnalyticsData = {
        overview: {
          totalCommitments: 12,
          completedCommitments: 8,
          currentStreak: 7,
          longestStreak: 21,
          completionRate: 67,
          totalDaysActive: 45,
        },
        weeklyProgress: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          data: [1, 1, 0, 1, 1, 1, 1],
        },
        categoryBreakdown: {
          labels: ['Health', 'Business', 'Learning', 'Creative'],
          data: [30, 25, 20, 25],
          colors: ['#10b981', '#6366f1', '#8b5cf6', '#f59e0b'],
        },
        monthlyTrends: {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          data: [4, 5, 6, 7],
        },
        achievements: [
          {
            title: 'First Week Complete',
            description: 'Completed your first 7-day streak',
            date: '2024-01-15',
            icon: 'trophy-outline',
          },
          {
            title: 'Consistency Champion',
            description: '21-day streak achieved',
            date: '2024-01-20',
            icon: 'flame-outline',
          },
          {
            title: 'Goal Getter',
            description: 'Completed 10 commitments',
            date: '2024-01-25',
            icon: 'checkmark-circle-outline',
          },
        ],
      };

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
  };

  const getStreakEmoji = (days: number) => {
    if (days >= 30) return '🔥🔥🔥';
    if (days >= 21) return '🔥🔥';
    if (days >= 14) return '🔥';
    if (days >= 7) return '⚡';
    if (days >= 3) return '💪';
    return '🌱';
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return '#10b981';
    if (rate >= 60) return '#f59e0b';
    return '#ef4444';
  };

  if (loading && !analyticsData) {
    return (
      <Container style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="analytics-outline" size={48} color="#6b7280" />
          <Text style={styles.loadingText}>Loading your analytics...</Text>
        </View>
      </Container>
    );
  }

  if (!analyticsData) {
    return (
      <Container style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="wifi-off" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Unable to load analytics</Text>
          <TouchableOpacity onPress={loadAnalyticsData} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </Container>
    );
  }

  return (
    <Container style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Analytics</Text>
          <View style={styles.periodSelector}>
            {(['week', 'month', 'year'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === period && styles.periodButtonTextActive,
                  ]}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Overview Cards */}
        <View style={styles.overviewSection}>
          <View style={styles.overviewCard}>
            <View style={styles.overviewHeader}>
              <Text style={styles.overviewTitle}>Current Streak</Text>
              <Text style={styles.overviewEmoji}>
                {getStreakEmoji(analyticsData.overview.currentStreak)}
              </Text>
            </View>
            <Text style={styles.overviewValue}>
              {analyticsData.overview.currentStreak} days
            </Text>
            <Text style={styles.overviewSubtitle}>
              Longest: {analyticsData.overview.longestStreak} days
            </Text>
          </View>

          <View style={styles.overviewCard}>
            <View style={styles.overviewHeader}>
              <Text style={styles.overviewTitle}>Completion Rate</Text>
              <Ionicons name="trending-up-outline" size={20} color="#10b981" />
            </View>
            <Text 
              style={[
                styles.overviewValue,
                { color: getCompletionRateColor(analyticsData.overview.completionRate) }
              ]}
            >
              {analyticsData.overview.completionRate}%
            </Text>
            <Text style={styles.overviewSubtitle}>
              {analyticsData.overview.completedCommitments}/{analyticsData.overview.totalCommitments} completed
            </Text>
          </View>

          <View style={styles.overviewCard}>
            <View style={styles.overviewHeader}>
              <Text style={styles.overviewTitle}>Days Active</Text>
              <Ionicons name="calendar-outline" size={20} color="#6366f1" />
            </View>
            <Text style={styles.overviewValue}>
              {analyticsData.overview.totalDaysActive}
            </Text>
            <Text style={styles.overviewSubtitle}>
              Total active days
            </Text>
          </View>
        </View>

        {/* Weekly Progress Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Weekly Check-ins</Text>
          <LineChart
            data={{
              labels: analyticsData.weeklyProgress.labels,
              datasets: [{
                data: analyticsData.weeklyProgress.data,
                color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                strokeWidth: 2,
              }],
            }}
            width={screenWidth}
            height={200}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#6366f1',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>

        {/* Category Breakdown */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Commitment Categories</Text>
          <PieChart
            data={analyticsData.categoryBreakdown.labels.map((label, index) => ({
              name: label,
              population: analyticsData.categoryBreakdown.data[index],
              color: analyticsData.categoryBreakdown.colors[index],
              legendFontColor: '#374151',
              legendFontSize: 12,
            }))}
            width={screenWidth}
            height={200}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 10]}
            absolute
            style={styles.chart}
          />
        </View>

        {/* Monthly Trends */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Monthly Trends</Text>
          <BarChart
            data={{
              labels: analyticsData.monthlyTrends.labels,
              datasets: [{
                data: analyticsData.monthlyTrends.data,
              }],
            }}
            width={screenWidth}
            height={200}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            style={styles.chart}
          />
        </View>

        {/* Recent Achievements */}
        <View style={styles.achievementsSection}>
          <Text style={styles.achievementsTitle}>Recent Achievements</Text>
          {analyticsData.achievements.map((achievement, index) => (
            <View key={index} style={styles.achievementCard}>
              <View style={styles.achievementIcon}>
                <Ionicons 
                  name={achievement.icon} 
                  size={24} 
                  color="#6366f1" 
                />
              </View>
              <View style={styles.achievementContent}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDescription}>
                  {achievement.description}
                </Text>
                <Text style={styles.achievementDate}>{achievement.date}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Keep up the great work! Every check-in builds momentum.
          </Text>
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 2,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#1f2937',
    fontWeight: '600',
  },
  overviewSection: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  overviewTitle: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  overviewEmoji: {
    fontSize: 16,
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  overviewSubtitle: {
    fontSize: 11,
    color: '#9ca3af',
  },
  chartSection: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  achievementsSection: {
    padding: 20,
  },
  achievementsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});