import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import {
  SmartSuggestions,
  Suggestion,
  SuggestionContext,
} from '../lib/smartSuggestions';
import { MobilePolish } from '../lib/mobilePolish';

interface SmartSuggestionsProps {
  founderType: string;
  currentStreak: number;
  onSelectSuggestion: (suggestion: string) => void;
  maxSuggestions?: number;
}

export const SmartSuggestionsComponent: React.FC<SmartSuggestionsProps> = ({
  founderType,
  currentStreak,
  onSelectSuggestion,
  maxSuggestions = 3,
}) => {
  const { colors } = useTheme();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuggestions();
  }, [founderType, currentStreak]);

  const loadSuggestions = async () => {
    setLoading(true);

    try {
      const smartSuggestions = SmartSuggestions.getInstance();

      // Create context for suggestions
      const context: SuggestionContext = {
        founderType,
        currentStreak,
        completionRate: 0.8, // Would calculate from user data
        timeOfDay: getTimeOfDay(),
        dayOfWeek: getDayOfWeek(),
        previousCommitments: [], // Would fetch from user data
        userGoals: [], // Would fetch from user profile
        difficulty:
          currentStreak < 3 ? 'easy' : currentStreak >= 7 ? 'hard' : 'medium',
      };

      const smartSuggestionsList = smartSuggestions.getSuggestions(
        context,
        maxSuggestions
      );
      setSuggestions(smartSuggestionsList);
    } catch (error) {
      console.error('Failed to load smart suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  const getDayOfWeek = (): string => {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return days[new Date().getDay()];
  };

  const handleSuggestionPress = (suggestion: Suggestion) => {
    // Trigger haptic feedback
    if (Platform.OS !== 'web') {
      MobilePolish.triggerTouchFeedback();
    }

    onSelectSuggestion(suggestion.text);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return colors.success || '#4CAF50';
      case 'medium':
        return colors.warning || '#FF9800';
      case 'hard':
        return colors.error || '#F44336';
      default:
        return colors.primary;
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'Easy';
      case 'medium':
        return 'Medium';
      case 'hard':
        return 'Challenging';
      default:
        return difficulty;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          Loading suggestions...
        </Text>
      </View>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Smart Suggestions for {founderType}
      </Text>

      <View style={styles.suggestionsContainer}>
        {suggestions.map((suggestion) => (
          <TouchableOpacity
            key={suggestion.id}
            style={[
              styles.suggestionCard,
              {
                backgroundColor: colors.background,
                borderColor: getDifficultyColor(suggestion.difficulty),
              },
            ]}
            onPress={() => handleSuggestionPress(suggestion)}
            activeOpacity={0.8}
          >
            <View style={styles.suggestionHeader}>
              <Text style={[styles.category, { color: colors.secondary }]}>
                {suggestion.category}
              </Text>
              <View
                style={[
                  styles.difficultyBadge,
                  {
                    backgroundColor: getDifficultyColor(suggestion.difficulty),
                  },
                ]}
              >
                <Text style={styles.difficultyText}>
                  {getDifficultyLabel(suggestion.difficulty)}
                </Text>
              </View>
            </View>

            <Text style={[styles.suggestionText, { color: colors.text }]}>
              {suggestion.text}
            </Text>

            <View style={styles.suggestionFooter}>
              <Text style={[styles.estimatedTime, { color: colors.secondary }]}>
                ~{suggestion.estimatedTime}min
              </Text>
              <Text style={[styles.confidence, { color: colors.secondary }]}>
                {Math.round(suggestion.confidence * 100)}% match
              </Text>
            </View>

            <Text style={[styles.reasoning, { color: colors.secondary }]}>
              {suggestion.reasoning}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  suggestionsContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  suggestionCard: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  difficultyText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 20,
  },
  suggestionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  estimatedTime: {
    fontSize: 12,
  },
  confidence: {
    fontSize: 12,
  },
  reasoning: {
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 16,
  },
});
