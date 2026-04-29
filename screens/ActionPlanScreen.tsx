import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { generateActionPlan } from '../lib/gemini';
import { useHaptics } from '../hooks/useHaptics';
import { RootStackParamList } from '../navigation/AppNavigator';

type ActionPlanScreenNavigationProp = StackNavigationProp<RootStackParamList, 'actionPlan'>;
type ActionPlanScreenRouteProp = RouteProp<RootStackParamList, 'actionPlan'>;

interface WeekAction {
  id: string;
  text: string;
  completed: boolean;
}

interface WeekPlan {
  week: number;
  title: string;
  days: string;
  actions: WeekAction[];
  expanded: boolean;
}

interface ActionPlan {
  founderType: string;
  weeks: WeekPlan[];
}

const ACTION_PLAN_KEY = 'foundertype_action_plan';

export default function ActionPlanScreen({ 
  route, 
  navigation 
}: { 
  route: ActionPlanScreenRouteProp; 
  navigation: ActionPlanScreenNavigationProp 
}) {
  const { answers, founderType, topMatch } = route.params || {};
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { medium, light } = useHaptics();

  useEffect(() => {
    loadActionPlan();
  }, []);

  const loadActionPlan = async () => {
    try {
      // Try to load from AsyncStorage first
      const savedPlan = await AsyncStorage.getItem(ACTION_PLAN_KEY);
      if (savedPlan) {
        const parsed = JSON.parse(savedPlan);
        setActionPlan(parsed);
        setLoading(false);
        return;
      }

      // Generate new plan if not saved
      const plan = await generateActionPlan(answers, founderType, topMatch);
      if (plan) {
        setActionPlan(plan);
        await AsyncStorage.setItem(ACTION_PLAN_KEY, JSON.stringify(plan));
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error loading action plan:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleWeek = (weekIndex: number) => {
    light();
    setActionPlan(prev => {
      if (!prev) return null;
      const newWeeks = [...prev.weeks];
      newWeeks[weekIndex] = {
        ...newWeeks[weekIndex],
        expanded: !newWeeks[weekIndex].expanded
      };
      return { ...prev, weeks: newWeeks };
    });
  };

  const toggleAction = (weekIndex: number, actionIndex: number) => {
    medium();
    setActionPlan(prev => {
      if (!prev) return null;
      const newWeeks = [...prev.weeks];
      const newActions = [...newWeeks[weekIndex].actions];
      newActions[actionIndex] = {
        ...newActions[actionIndex],
        completed: !newActions[actionIndex].completed
      };
      newWeeks[weekIndex] = {
        ...newWeeks[weekIndex],
        actions: newActions
      };
      
      const updatedPlan = { ...prev, weeks: newWeeks };
      // Save to AsyncStorage
      AsyncStorage.setItem(ACTION_PLAN_KEY, JSON.stringify(updatedPlan));
      return updatedPlan;
    });
  };

  const calculateProgress = () => {
    if (!actionPlan) return 0;
    const totalActions = actionPlan.weeks.reduce((sum, week) => sum + week.actions.length, 0);
    const completedActions = actionPlan.weeks.reduce((sum, week) => 
      sum + week.actions.filter(action => action.completed).length, 0
    );
    return totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
  };

  const resetPlan = async () => {
    medium();
    await AsyncStorage.removeItem(ACTION_PLAN_KEY);
    setLoading(true);
    setError(false);
    loadActionPlan();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Creating your personalized action plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !actionPlan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Couldn't generate your action plan</Text>
          <Text style={styles.errorText}>Please try again.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={resetPlan}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const progress = calculateProgress();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('results')} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>30-Day Action Plan</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>
          Your plan is based on: <Text style={styles.founderType}>{actionPlan.founderType}</Text>
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{progress}% Complete</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {actionPlan.weeks.map((week, weekIndex) => (
          <View key={week.week} style={styles.weekCard}>
            <TouchableOpacity 
              style={styles.weekHeader}
              onPress={() => toggleWeek(weekIndex)}
            >
              <Text style={styles.weekTitle}>{week.title}</Text>
              <Text style={styles.weekDays}>{week.days}</Text>
              <Text style={styles.expandIcon}>{week.expanded ? '×' : '+'}</Text>
            </TouchableOpacity>

            {week.expanded && (
              <View style={styles.actionsContainer}>
                {week.actions.map((action, actionIndex) => (
                  <TouchableOpacity
                    key={action.id}
                    style={styles.actionItem}
                    onPress={() => toggleAction(weekIndex, actionIndex)}
                  >
                    <View style={[
                      styles.checkbox,
                      action.completed && styles.checkboxCompleted
                    ]}>
                      {action.completed && <Text style={styles.checkmark}>×</Text>}
                    </View>
                    <Text style={[
                      styles.actionText,
                      action.completed && styles.actionTextCompleted
                    ]}>
                      {action.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.resetButton} onPress={resetPlan}>
          <Text style={styles.resetButtonText}>Reset Plan</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorText: {
    color: '#888888',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#888888',
    fontSize: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 60,
  },
  subtitleContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  subtitle: {
    color: '#888888',
    fontSize: 16,
    textAlign: 'center',
  },
  founderType: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressText: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  weekCard: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  weekTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  weekDays: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginRight: 16,
  },
  expandIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '300',
  },
  actionsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxCompleted: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  checkmark: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  actionTextCompleted: {
    color: 'rgba(255, 255, 255, 0.5)',
    textDecorationLine: 'line-through',
  },
  resetButton: {
    backgroundColor: '#333333',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
