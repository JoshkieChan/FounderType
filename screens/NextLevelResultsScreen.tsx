import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FounderProfile } from '../types';
import { useHaptics } from '../hooks/useHaptics';

export default function NextLevelResultsScreen({ navigation, route }: { navigation: any; route?: any }) {
  const { light } = useHaptics();
  
  const profile = route?.params?.profile;
  const originalProfile = route?.params?.originalProfile;
  const originalAnswers = route?.params?.originalAnswers;
  const nextLevelAnswers = route?.params?.nextLevelAnswers;

  let founderProfile: FounderProfile | null = null;
  if (profile) {
    if (typeof profile === 'string') {
      try {
        founderProfile = JSON.parse(profile);
      } catch {
        founderProfile = null;
      }
    } else {
      founderProfile = profile as FounderProfile;
    }
  }

  const handleBackToHome = () => {
    light();
    navigation.navigate('landing');
  };

  const handleShareResults = () => {
    light();
    // TODO: Implement share functionality for next level results
    console.log('Share next level results');
  };

  const renderDimensionBar = (label: string, value?: number) => {
    const score = value || 0;
    return (
      <View style={styles.dimensionRow}>
        <Text style={styles.dimensionLabel}>{label}</Text>
        <View style={styles.dimensionBarContainer}>
          <View style={[styles.dimensionBar, { width: `${score}%` }]} />
        </View>
        <Text style={styles.dimensionValue}>{score}</Text>
      </View>
    );
  };

  if (!founderProfile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Something went wrong generating your Next Level profile. Please try again.
            </Text>
            <TouchableOpacity style={styles.errorButton} onPress={handleBackToHome}>
              <Text style={styles.errorButtonText}>Back to Home</Text>
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
  const archetypeComparison = founderProfile.archetypeComparison;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.label}>NEXT LEVEL PROFILE</Text>
            <Text style={styles.founderType}>{founderType}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deeper Profile Summary</Text>
            <Text style={styles.summaryText}>{profileSummary}</Text>
          </View>

          {archetypeComparison && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Evolution</Text>
              <View style={styles.comparisonContainer}>
                <View style={styles.comparisonItem}>
                  <Text style={styles.comparisonLabel}>Initial Type:</Text>
                  <Text style={styles.comparisonType}>{archetypeComparison.initialType}</Text>
                </View>
                <Text style={styles.evolutionArrow}>{"\u2192"}</Text>
                <View style={styles.comparisonItem}>
                  <Text style={styles.comparisonLabel}>Next Level Type:</Text>
                  <Text style={styles.comparisonType}>{archetypeComparison.nextLevelType}</Text>
                </View>
              </View>
              <Text style={styles.comparisonInsight}>{archetypeComparison.insight}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Refined Business Model Matches</Text>
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
                    <Text style={styles.warningLabel}>Challenge</Text>
                    <Text style={styles.warningText}>{model?.challenge || 'No challenge available.'}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.summaryText}>No business model matches found.</Text>
            )}
          </View>

          <TouchableOpacity style={styles.shareButton} onPress={handleShareResults}>
            <Text style={styles.shareButtonText}>Share Your Next Level Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.homeButton} onPress={handleBackToHome}>
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
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
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonLabel: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  comparisonType: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  evolutionArrow: {
    color: '#3B82F6',
    fontSize: 24,
    fontWeight: '700',
    marginHorizontal: 16,
  },
  comparisonInsight: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
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
  homeButton: {
    padding: 16,
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#888888',
    fontSize: 16,
    fontWeight: '500',
  },
});
