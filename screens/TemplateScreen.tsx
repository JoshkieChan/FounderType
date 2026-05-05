import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  CommitmentTemplateService,
  CommitmentTemplate,
} from '../lib/commitmentTemplates';

interface TemplateScreenProps {
  navigation?: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
}

export default function TemplateScreen({ navigation }: TemplateScreenProps) {
  const [templates, setTemplates] = useState<CommitmentTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<
    CommitmentTemplate[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] =
    useState<CommitmentTemplate | null>(null);

  const categories = ['all', ...CommitmentTemplateService.getAllCategories()];

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, selectedCategory, searchQuery]);

  const loadTemplates = () => {
    setTemplates(CommitmentTemplateService.getAllTemplates());
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (selectedCategory !== 'all') {
      filtered =
        CommitmentTemplateService.getTemplatesByCategory(selectedCategory);
    }

    if (searchQuery) {
      filtered = CommitmentTemplateService.searchTemplates(searchQuery);
    }

    setFilteredTemplates(filtered);
  };

  const handleTemplateSelect = (template: CommitmentTemplate) => {
    setSelectedTemplate(template);
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;

    Alert.alert(
      'Use Template',
      `Start a 30-day commitment: "${selectedTemplate.title}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Commitment',
          onPress: () => {
            if (navigation) {
              navigation.navigate('commitment', {
                initialText: selectedTemplate.title,
                initialDailyAction: selectedTemplate.dailyAction,
              });
            }
          },
        },
      ]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#10b981';
      case 'medium':
        return '#f59e0b';
      case 'hard':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getDifficultyEmoji = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'hard':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const Container = Platform.OS === 'web' ? View : SafeAreaView;

  return (
    <Container style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Commitment Templates</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#6b7280"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search templates..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === category &&
                  styles.categoryButtonTextActive,
              ]}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Templates List */}
      <ScrollView
        style={styles.templatesList}
        showsVerticalScrollIndicator={false}
      >
        {filteredTemplates.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={[
              styles.templateCard,
              selectedTemplate?.id === template.id &&
                styles.templateCardSelected,
            ]}
            onPress={() => handleTemplateSelect(template)}
          >
            <View style={styles.templateHeader}>
              <View style={styles.templateTitleContainer}>
                <Text style={styles.templateTitle}>{template.title}</Text>
                <View style={styles.templateMeta}>
                  <View
                    style={[
                      styles.difficultyBadge,
                      {
                        backgroundColor: getDifficultyColor(
                          template.difficulty
                        ),
                      },
                    ]}
                  >
                    <Text style={styles.difficultyText}>
                      {getDifficultyEmoji(template.difficulty)}{' '}
                      {template.difficulty}
                    </Text>
                  </View>
                  <Text style={styles.durationText}>
                    {template.duration} days
                  </Text>
                </View>
              </View>
              <Ionicons
                name={
                  selectedTemplate?.id === template.id
                    ? 'checkmark-circle'
                    : 'radio-button-off'
                }
                size={24}
                color={
                  selectedTemplate?.id === template.id ? '#10b981' : '#d1d5db'
                }
              />
            </View>
            <Text style={styles.templateDescription}>
              {template.description}
            </Text>
            <View style={styles.templateFooter}>
              <Text style={styles.categoryText}>{template.category}</Text>
              <View style={styles.tagContainer}>
                {template.tags.slice(0, 2).map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
                {template.tags.length > 2 && (
                  <Text style={styles.moreTagsText}>
                    +{template.tags.length - 2}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Selected Template Action */}
      {selectedTemplate && (
        <View style={styles.selectedTemplateContainer}>
          <View style={styles.selectedTemplateInfo}>
            <Text style={styles.selectedTemplateTitle}>
              Selected: {selectedTemplate.title}
            </Text>
            <Text style={styles.selectedTemplateDescription}>
              {selectedTemplate.dailyAction}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.useTemplateButton}
            onPress={handleUseTemplate}
          >
            <Text style={styles.useTemplateButtonText}>Start Commitment</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 12,
  },
  categoryScroll: {
    marginTop: 16,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },
  templatesList: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  templateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  templateCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f9ff',
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  templateTitleContainer: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  templateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  durationText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  templateDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  tagContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  tag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#6b7280',
  },
  moreTagsText: {
    fontSize: 10,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  selectedTemplateContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedTemplateInfo: {
    flex: 1,
  },
  selectedTemplateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  selectedTemplateDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  useTemplateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  useTemplateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
