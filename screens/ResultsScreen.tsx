import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import ShareableProfileCard from '../components/ShareableProfileCard';
import MilestoneModal from '../components/MilestoneModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { FounderProfile } from '../types';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useShareProfile } from '../hooks/useShareProfile';
import { useHaptics } from '../hooks/useHaptics';
import { saveProfile, loadProfile, getCurrentUserId } from '../lib/storage';
import { useProgressPersistence } from '../hooks/useProgressPersistence';
import { MILESTONES, hasMilestoneBeenShown } from '../lib/milestones';
import { scheduleWeeklyInsight } from '../lib/notifications';
import { getInsightForType } from '../lib/insights';

const { saveProgress, clearProgress } = useProgressPersistence();
  const { shareProfile } = useShareProfile();

type ResultsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'results'>;
type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'results'>;

export default function ResultsScreen({ route, navigation, currentProfile, currentAnswers }: { 
  route: ResultsScreenRouteProp; 
  navigation: ResultsScreenNavigationProp;
  currentProfile: any;
  currentAnswers: any;
}) {
  // Use props from App state, fall back to route params for backward compatibility
  const profile = currentProfile || route?.params?.profile;
  const answers = currentAnswers || route?.params?.answers;
  
  const { shareResults, shareSummary } = useShareProfile();
  const [previousProfiles, setPreviousProfiles] = useState<any[]>([]);
  const [showGrowth, setShowGrowth] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<any>(null);
  const [weeklyInsight, setWeeklyInsight] = useState<string>('');
  const { light, medium } = useHaptics();

  let founderProfile: FounderProfile | null = null;
  try {
    founderProfile = profile ? JSON.parse(profile) : null;
  } catch {
    founderProfile = null;
  }

  useEffect(() => {
    if (founderProfile) {
      Sentry.addBreadcrumb({
        message: 'profile_generated',
        level: 'info'
      });
      saveProfileToSupabase();
      // Store profile for action plan using new storage system
      const saveProfileData = async () => {
        if (answers && founderProfile) {
          const parsedAnswers = JSON.parse(answers);
          const userId = await getCurrentUserId();
          if (userId) {
            await saveProfile(userId, parsedAnswers, founderProfile);
            
            // Store founderType for weekly insights
            await AsyncStorage.setItem('foundertype_founder_type', founderType || '');
            
            // Schedule weekly insights
            try {
              await scheduleWeeklyInsight(founderType || '');
            } catch (error) {
              console.error('Error scheduling weekly insights:', error);
            }
            
            // Check if assessment complete milestone should be shown
            const hasBeenShown = await hasMilestoneBeenShown(MILESTONES.ASSESSMENT_COMPLETE.id);
            if (!hasBeenShown) {
              setCurrentMilestone(MILESTONES.ASSESSMENT_COMPLETE);
              setShowMilestone(true);
            }
          }
        }
      };
      
      saveProfileData();
    }
  }, [founderProfile]);

  useEffect(() => {
    loadPreviousProfiles();
    loadWeeklyInsight();
  }, []);

  const loadWeeklyInsight = async () => {
    try {
      const storedFounderType = await AsyncStorage.getItem('foundertype_founder_type');
      if (storedFounderType) {
        const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
        const insight = getInsightForType(storedFounderType, weekNumber);
        setWeeklyInsight(insight);
      }
    } catch (error) {
      console.error('Error loading weekly insight:', error);
    }
  };

  const loadPreviousProfiles = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .order('assessed_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading previous profiles:', error);
        return;
      }

      if (data && data.length > 1) {
        setPreviousProfiles(data);
        setShowGrowth(true);
      }
    } catch (error) {
      console.error('Error loading previous profiles:', error);
    }
  };

  const handleUpgrade = () => {
    medium();
    navigation.navigate('upgrade', { 
      profile: profile, 
      answers: answers 
    });
  };

  const handleRestart = () => {
    light();
    navigation.navigate('questions');
  };

  const handleShareResults = async () => {
    if (!founderProfile) return;
    
    light();
    const result = await shareResults(founderProfile);
    
    if (result?.success) {
      console.log('Profile shared successfully!');
    } else {
      console.log('Failed to share profile');
    }
  };

  const handleShareSummary = async () => {
    if (!founderProfile) return;
    
    light();
    const result = await shareSummary(founderProfile);
    
    if (result?.success) {
      console.log('Summary shared successfully!');
    } else {
      console.log('Failed to share summary');
    }
  };

  const handleShareProfile = async () => {
    if (!founderProfile) return;
    
    light();
    const result = await shareProfile({ profile: founderProfile, includeDetails: true });
    
    if (result?.success) {
      console.log('Profile shared successfully!');
    } else {
      console.log('Failed to share profile');
    }
  };

  const handleRetake = async () => {
    Alert.alert(
      'Retake Assessment?',
      'Your current results will be cleared. You\'ll start fresh from Question 1.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Retake', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all stored data
              await clearProgress();
              
              // Navigate back to questions screen
              navigation.navigate('questions');
            } catch (error) {
              console.error('Failed to clear progress:', error);
            }
          }
        }
      ]
    );
  };

  const saveProfileToSupabase = async () => {
    if (!founderProfile) return;

    try {
      const userId = await getCurrentUserId();
      if (!userId) return;
      
      await saveProfile(userId, answers, founderProfile);
      console.log('Profile saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  // Show error if profile data is missing or invalid
  if (!founderProfile || !founderProfile.founderType) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.errorContent}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorText}>
              Something went wrong generating your profile. Please try again.
            </Text>
            <TouchableOpacity style={styles.errorButton} onPress={handleRestart}>
              <Text style={styles.errorButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Null-safe access to profile properties
  const founderType = founderProfile.founderType || 'Unknown Type';
  const profileSummary = founderProfile.summary || 'No summary available.';
  const businessModels = founderProfile.matches || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.label}>YOUR FOUNDERTYPE</Text>
            <Text style={styles.founderType}>{founderType}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Summary</Text>
            <Text style={styles.summaryText}>{profileSummary}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business Model Matches</Text>
            {businessModels.length > 0 ? (
              businessModels.map((model: any, index: number) => (
                <View key={index} style={styles.modelCard}>
                  <View style={styles.modelHeader}>
                    <Text style={styles.modelName}>{model?.model || 'Unknown'}</Text>
                    <View style={styles.scoreBadge}>
                      <Text style={styles.scoreText}>{model?.overallScore || 0}%</Text>
                    </View>
                  </View>

                  <View style={styles.dimensionsContainer}>
                    {renderDimensionBar('Skill Match', model?.dimensions?.skillMatch)}
                    {renderDimensionBar('Lifestyle Fit', model?.dimensions?.lifestyleFit)}
                    {renderDimensionBar('Tolerance Fit', model?.dimensions?.toleranceFit)}
                    {renderDimensionBar('Time to Revenue', model?.dimensions?.timeToRevenue)}
                    {renderDimensionBar('Growth Ceiling', model?.dimensions?.growthCeiling)}
                  </View>

                  <View style={styles.warningContainer}>
                    <Text style={styles.warningLabel}>⚠️ Challenge</Text>
                    <Text style={styles.warningText}>{model?.challenge || 'No challenge available.'}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.summaryText}>No business model matches found.</Text>
            )}
          </View>

          {weeklyInsight && (
            <View style={styles.weeklyInsightSection}>
              <Text style={styles.weeklyInsightLabel}>This week's insight for {founderType}</Text>
              <View style={styles.weeklyInsightCard}>
                <Text style={styles.weeklyInsightText}>"{weeklyInsight}"</Text>
              </View>
            </View>
          )}

          {showGrowth && previousProfiles.length > 1 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Growth</Text>
              <View style={styles.growthContainer}>
                <View style={styles.growthItem}>
                  <Text style={styles.previousType}>
                    {JSON.parse(previousProfiles[1].profile).founderType}
                  </Text>
                </View>
                <Text style={styles.growthArrow}>{"\u2192"}</Text>
                <View style={styles.growthItem}>
                  <Text style={styles.currentType}>
                    {founderType}
                  </Text>
                </View>
              </View>
              <Text style={styles.growthCaption}>
                You've evolved. Here's what changed.
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.shareButton} onPress={handleShareProfile}>
            <Text style={styles.shareButtonText}>Share Your FounderType</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
            <Text style={styles.retakeText}>Not accurate? Retake the assessment</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('nextLevel')}>
            <Text style={styles.goDeeperText}>Go Deeper →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
            <Text style={styles.upgradeButtonText}>Get Your 30-Day Action Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
            <Text style={styles.restartText}>Start Over</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
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


function renderDimensionBar(label: string, value: number | undefined) {
  const score = value || 0;
  return (
    <View style={styles.dimensionRow}>
      <Text style={styles.dimensionLabel}>{label}</Text>
      <View style={styles.dimensionBarContainer}>
        <View style={[styles.dimensionBar, { width: `${score}%` }]} />
      </View>
      <Text style={styles.dimensionValue}>{score}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingTop: 20,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  label: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
  founderType: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryText: {
    color: '#CCCCCC',
    fontSize: 16,
    lineHeight: 24,
  },
  modelCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modelName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  scoreBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  warningContainer: {
    backgroundColor: '#1A0A0A',
    borderRadius: 8,
    padding: 12,
  },
  warningLabel: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  warningText: {
    color: '#AAAAAA',
    fontSize: 14,
    lineHeight: 20,
  },
  dimensionsContainer: {
    marginBottom: 16,
    gap: 10,
  },
  dimensionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dimensionLabel: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '500',
    width: 100,
  },
  dimensionBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  dimensionBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  dimensionValue: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    width: 30,
    textAlign: 'right',
  },
  upgradeButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  shareButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  restartButton: {
    padding: 16,
    alignItems: 'center',
  },
  restartText: {
    color: '#888888',
    fontSize: 16,
    fontWeight: '500',
  },
  retakeButton: {
    backgroundColor: 'transparent',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retakeText: {
    color: '#888888',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorText: {
    color: '#888888',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  errorButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  growthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  growthItem: {
    flex: 1,
    alignItems: 'center',
  },
  previousType: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  growthArrow: {
    fontSize: 24,
    color: '#3B82F6',
    marginHorizontal: 16,
  },
  currentType: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  growthCaption: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  weeklyInsightSection: {
    marginBottom: 24,
  },
  weeklyInsightLabel: {
    color: '#888888',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  weeklyInsightCard: {
    backgroundColor: '#1A1A1A',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
  },
  weeklyInsightText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
    textAlign: 'center',
  },
  goDeeperText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
});
