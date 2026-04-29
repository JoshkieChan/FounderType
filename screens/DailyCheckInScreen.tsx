import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import MilestoneModal from '../components/MilestoneModal';
import { checkMilestones } from '../lib/milestones';

const CHECK_IN_KEY = 'foundertype_daily_checkin';

interface CheckInData {
  currentDay: number;
  completedDays: number[];
  streak: number;
  lastCheckInDate: string | null;
}

export default function DailyCheckInScreen({ navigation }: { navigation: any }) {
  const [checkInData, setCheckInData] = useState<CheckInData>({
    currentDay: 1,
    completedDays: [],
    streak: 0,
    lastCheckInDate: null,
  });
  const [todayAction, setTodayAction] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showMilestone, setShowMilestone] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<any>(null);

  useEffect(() => {
    loadCheckInData();
    loadTodayAction();
  }, []);

  const loadCheckInData = async () => {
    try {
      const stored = await AsyncStorage.getItem(CHECK_IN_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const today = new Date().toDateString();
        const lastDate = data.lastCheckInDate;
        
        // Check if streak should be reset
        if (lastDate && lastDate !== today) {
          const lastCheckIn = new Date(lastDate);
          const daysDiff = Math.floor((new Date().getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff > 1) {
            // Reset streak if missed more than 1 day
            data.streak = 0;
          }
        }
        
        setCheckInData(data);
      }
    } catch (error) {
      console.error('Error loading check-in data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTodayAction = async () => {
    try {
      const storedProfile = await AsyncStorage.getItem('foundertype_latest_profile');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        const day = checkInData.currentDay;
        const weekIndex = Math.floor((day - 1) / 7);
        const dayInWeek = ((day - 1) % 7) + 1;
        
        if (profile.weeks && profile.weeks[weekIndex] && profile.weeks[weekIndex].days[dayInWeek - 1]) {
          setTodayAction(profile.weeks[weekIndex].days[dayInWeek - 1]);
        }
      }
    } catch (error) {
      console.error('Error loading today action:', error);
    }
  };

  const saveCheckInData = async (newData: CheckInData) => {
    try {
      await AsyncStorage.setItem(CHECK_IN_KEY, JSON.stringify(newData));
      setCheckInData(newData);
    } catch (error) {
      console.error('Error saving check-in data:', error);
    }
  };

  const handleDoneToday = async () => {
    const today = new Date().toDateString();
    const newCompletedDays = [...checkInData.completedDays, checkInData.currentDay];
    const newStreak = checkInData.streak + 1;
    const nextDay = checkInData.currentDay + 1;
    
    const newData: CheckInData = {
      currentDay: nextDay > 30 ? 30 : nextDay,
      completedDays: newCompletedDays,
      streak: newStreak,
      lastCheckInDate: today,
    };
    
    await saveCheckInData(newData);
    
    // Check for milestones
    const newMilestones = await checkMilestones(newCompletedDays);
    if (newMilestones.length > 0) {
      // Show the first new milestone
      const milestoneId = newMilestones[0];
      const milestone = {
        id: milestoneId,
        icon: milestoneId === 'FIRST_ACTION_COMPLETE' ? ' ' : 
              milestoneId === 'WEEK_1_COMPLETE' ? ' ' : 
              milestoneId === 'FULL_30_DAYS_COMPLETE' ? ' ' : ' ',
        headline: milestoneId === 'FIRST_ACTION_COMPLETE' ? 'Day 1 done.' :
                 milestoneId === 'WEEK_1_COMPLETE' ? 'One week in.' :
                 milestoneId === 'FULL_30_DAYS_COMPLETE' ? 'You finished.' : '',
        subtext: milestoneId === 'FIRST_ACTION_COMPLETE' ? 'That\'s more than 80% of people who downloaded this app.' :
                milestoneId === 'WEEK_1_COMPLETE' ? 'You\'re building real momentum. Most people quit by now.' :
                milestoneId === 'FULL_30_DAYS_COMPLETE' ? '30 days of consistent action. You\'re not the same founder you were when you started.' : '',
        showShareButton: milestoneId === 'FULL_30_DAYS_COMPLETE'
      };
      setCurrentMilestone(milestone);
      setShowMilestone(true);
    }
    
    if (nextDay > 30) {
      Alert.alert(
        'Congratulations!', 
        'You\'ve completed your 30-day action plan! Your streak: ' + newStreak + ' days',
        [{ text: 'OK', onPress: () => navigation.navigate('nextLevel') }]
      );
    } else {
      Alert.alert('Great job!', 'Come back tomorrow for your next action!');
    }
  };

  const handleDoItTomorrow = () => {
    Alert.alert('No problem!', 'Come back tomorrow to complete this action.');
  };

  const renderDayGrid = () => {
    const days = [];
    for (let i = 1; i <= 30; i++) {
      const isCompleted = checkInData.completedDays.includes(i);
      const isCurrent = i === checkInData.currentDay;
      
      days.push(
        <View
          key={i}
          style={[
            styles.daySquare,
            isCompleted && styles.completedDay,
            isCurrent && styles.currentDay,
          ]}
        >
          <Text style={[
            styles.dayNumber,
            isCompleted && styles.completedDayText,
          ]}>
            {i}
          </Text>
        </View>
      );
    }
    return days;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.navigate('landing')} style={styles.backButton}>
          <Text style={styles.backText}>×</Text>
        </TouchableOpacity>

        <Text style={styles.header}>Day {checkInData.currentDay} of 30</Text>

        <View style={styles.actionContainer}>
          <Text style={styles.actionLabel}>Today's Action</Text>
          <Text style={styles.actionText}>{todayAction || 'No action available'}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.doneButton} onPress={handleDoneToday}>
            <Text style={styles.doneButtonText}> Done Today</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tomorrowButton} onPress={handleDoItTomorrow}>
            <Text style={styles.tomorrowButtonText}> Do It Tomorrow</Text>
          </TouchableOpacity>
        </View>

        {checkInData.streak > 1 && (
          <Text style={styles.streakText}> {checkInData.streak} day streak</Text>
        )}

        <View style={styles.gridContainer}>
          <Text style={styles.gridLabel}>30-Day Progress</Text>
          <View style={styles.dayGrid}>
            {renderDayGrid()}
          </View>
        </View>
      </ScrollView>
      
      {/* Milestone Modal */}
      {currentMilestone && (
        <MilestoneModal
          visible={showMilestone}
          onClose={() => setShowMilestone(false)}
          icon={currentMilestone.icon}
          headline={currentMilestone.headline}
          subtext={currentMilestone.subtext}
          milestoneId={currentMilestone.id}
          showShareButton={currentMilestone.showShareButton}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3B82F6',
    textAlign: 'center',
    marginBottom: 30,
  },
  actionContainer: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
  },
  actionLabel: {
    fontSize: 16,
    color: '#888888',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 20,
    color: '#FFFFFF',
    lineHeight: 28,
  },
  buttonContainer: {
    marginBottom: 30,
  },
  doneButton: {
    backgroundColor: '#3B82F6',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tomorrowButton: {
    backgroundColor: '#2A2A2A',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  tomorrowButtonText: {
    color: '#888888',
    fontSize: 18,
    fontWeight: 'bold',
  },
  streakText: {
    fontSize: 18,
    color: '#FF6B35',
    textAlign: 'center',
    marginBottom: 20,
  },
  gridContainer: {
    marginTop: 20,
  },
  gridLabel: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 15,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  daySquare: {
    width: 40,
    height: 40,
    backgroundColor: '#2A2A2A',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  completedDay: {
    backgroundColor: '#3B82F6',
  },
  currentDay: {
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  dayNumber: {
    fontSize: 12,
    color: '#888888',
    fontWeight: 'bold',
  },
  completedDayText: {
    color: '#FFFFFF',
  },
});
