// Smart Suggestions System for FounderType
// AI-powered commitment suggestions based on user behavior and founder type

export interface SuggestionContext {
  founderType: string;
  currentStreak: number;
  completionRate: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  dayOfWeek: string;
  previousCommitments: string[];
  userGoals: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
}

export interface Suggestion {
  id: string;
  text: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // in minutes
  confidence: number; // 0-1
  reasoning: string;
  tags: string[];
  founderTypes: string[];
}

export class SmartSuggestions {
  private static instance: SmartSuggestions;
  private suggestionHistory: Map<string, Suggestion[]> = new Map();
  private userPreferences: Map<string, any> = new Map();

  static getInstance(): SmartSuggestions {
    if (!SmartSuggestions.instance) {
      SmartSuggestions.instance = new SmartSuggestions();
    }
    return SmartSuggestions.instance;
  }

  constructor() {
    this.initializeSuggestions();
  }

  // Initialize suggestion database
  private initializeSuggestions(): void {
    const suggestions: Suggestion[] = [
      // Visionary suggestions
      {
        id: 'visionary_1',
        text: 'Outline 3 key milestones for my big vision',
        category: 'planning',
        difficulty: 'medium',
        estimatedTime: 15,
        confidence: 0.9,
        reasoning:
          'Visionaries need to break down big ideas into actionable steps',
        tags: ['planning', 'vision', 'strategy'],
        founderTypes: ['Visionary'],
      },
      {
        id: 'visionary_2',
        text: 'Share my vision with one potential collaborator',
        category: 'networking',
        difficulty: 'medium',
        estimatedTime: 20,
        confidence: 0.8,
        reasoning: 'Visionaries benefit from sharing and refining their ideas',
        tags: ['networking', 'communication', 'vision'],
        founderTypes: ['Visionary'],
      },
      {
        id: 'visionary_3',
        text: 'Create a visual representation of my future state',
        category: 'creative',
        difficulty: 'easy',
        estimatedTime: 10,
        confidence: 0.85,
        reasoning: 'Visual thinking helps visionaries clarify their ideas',
        tags: ['creative', 'visualization', 'vision'],
        founderTypes: ['Visionary'],
      },

      // Builder suggestions
      {
        id: 'builder_1',
        text: 'Complete one small feature or improvement',
        category: 'development',
        difficulty: 'medium',
        estimatedTime: 30,
        confidence: 0.9,
        reasoning: 'Builders thrive on tangible progress and creation',
        tags: ['development', 'coding', 'creation'],
        founderTypes: ['Builder'],
      },
      {
        id: 'builder_2',
        text: 'Refactor one piece of code or process',
        category: 'optimization',
        difficulty: 'medium',
        estimatedTime: 25,
        confidence: 0.85,
        reasoning: 'Builders enjoy improving and optimizing systems',
        tags: ['optimization', 'refactoring', 'quality'],
        founderTypes: ['Builder'],
      },
      {
        id: 'builder_3',
        text: 'Test and validate one assumption',
        category: 'validation',
        difficulty: 'easy',
        estimatedTime: 15,
        confidence: 0.8,
        reasoning: 'Builders need to validate their work with real feedback',
        tags: ['testing', 'validation', 'feedback'],
        founderTypes: ['Builder'],
      },

      // Hustler suggestions
      {
        id: 'hustler_1',
        text: 'Reach out to 3 potential customers or partners',
        category: 'sales',
        difficulty: 'medium',
        estimatedTime: 20,
        confidence: 0.9,
        reasoning: 'Hustlers excel at taking action and creating opportunities',
        tags: ['sales', 'outreach', 'networking'],
        founderTypes: ['Hustler'],
      },
      {
        id: 'hustler_2',
        text: 'Follow up with 5 warm leads',
        category: 'followup',
        difficulty: 'easy',
        estimatedTime: 15,
        confidence: 0.85,
        reasoning: 'Hustlers understand the importance of persistence',
        tags: ['followup', 'persistence', 'sales'],
        founderTypes: ['Hustler'],
      },
      {
        id: 'hustler_3',
        text: 'Create one new sales or marketing asset',
        category: 'marketing',
        difficulty: 'medium',
        estimatedTime: 25,
        confidence: 0.8,
        reasoning:
          'Hustlers are resourceful and create their own opportunities',
        tags: ['marketing', 'creation', 'sales'],
        founderTypes: ['Hustler'],
      },

      // Strategist suggestions
      {
        id: 'strategist_1',
        text: 'Analyze one competitor or market trend',
        category: 'research',
        difficulty: 'medium',
        estimatedTime: 20,
        confidence: 0.9,
        reasoning:
          'Strategists excel at market analysis and competitive intelligence',
        tags: ['research', 'analysis', 'strategy'],
        founderTypes: ['Strategist'],
      },
      {
        id: 'strategist_2',
        text: 'Update my strategic roadmap based on new insights',
        category: 'planning',
        difficulty: 'medium',
        estimatedTime: 15,
        confidence: 0.85,
        reasoning: 'Strategists continuously refine their plans based on data',
        tags: ['planning', 'strategy', 'refinement'],
        founderTypes: ['Strategist'],
      },
      {
        id: 'strategist_3',
        text: 'Identify one strategic risk and mitigation plan',
        category: 'risk',
        difficulty: 'hard',
        estimatedTime: 30,
        confidence: 0.8,
        reasoning: 'Strategists excel at risk assessment and planning',
        tags: ['risk', 'planning', 'strategy'],
        founderTypes: ['Strategist'],
      },

      // Innovator suggestions
      {
        id: 'innovator_1',
        text: 'Brainstorm 3 solutions to one current problem',
        category: 'ideation',
        difficulty: 'easy',
        estimatedTime: 15,
        confidence: 0.9,
        reasoning: 'Innovators thrive on creative problem-solving',
        tags: ['ideation', 'creativity', 'problem-solving'],
        founderTypes: ['Innovator'],
      },
      {
        id: 'innovator_2',
        text: 'Test one new approach or methodology',
        category: 'experimentation',
        difficulty: 'medium',
        estimatedTime: 25,
        confidence: 0.85,
        reasoning: 'Innovators love experimenting with new ideas',
        tags: ['experimentation', 'innovation', 'testing'],
        founderTypes: ['Innovator'],
      },
      {
        id: 'innovator_3',
        text: 'Research one emerging technology or trend',
        category: 'research',
        difficulty: 'easy',
        estimatedTime: 20,
        confidence: 0.8,
        reasoning: 'Innovators stay ahead by exploring new possibilities',
        tags: ['research', 'technology', 'trends'],
        founderTypes: ['Innovator'],
      },

      // Universal suggestions
      {
        id: 'universal_1',
        text: "Review and reflect on yesterday's progress",
        category: 'reflection',
        difficulty: 'easy',
        estimatedTime: 10,
        confidence: 0.7,
        reasoning: 'Daily reflection helps all founder types improve',
        tags: ['reflection', 'review', 'improvement'],
        founderTypes: [
          'Visionary',
          'Builder',
          'Hustler',
          'Strategist',
          'Innovator',
        ],
      },
      {
        id: 'universal_2',
        text: "Plan tomorrow's top priority",
        category: 'planning',
        difficulty: 'easy',
        estimatedTime: 5,
        confidence: 0.8,
        reasoning: 'Planning ahead improves focus for all founders',
        tags: ['planning', 'focus', 'priority'],
        founderTypes: [
          'Visionary',
          'Builder',
          'Hustler',
          'Strategist',
          'Innovator',
        ],
      },
      {
        id: 'universal_3',
        text: 'Learn one new skill or concept',
        category: 'learning',
        difficulty: 'medium',
        estimatedTime: 20,
        confidence: 0.75,
        reasoning: 'Continuous learning benefits all founder types',
        tags: ['learning', 'growth', 'skills'],
        founderTypes: [
          'Visionary',
          'Builder',
          'Hustler',
          'Strategist',
          'Innovator',
        ],
      },
    ];

    suggestions.forEach((suggestion) => {
      if (!this.suggestionHistory.has(suggestion.category)) {
        this.suggestionHistory.set(suggestion.category, []);
      }
      this.suggestionHistory.get(suggestion.category)?.push(suggestion);
    });
  }

  // Get smart suggestions based on context
  getSuggestions(context: SuggestionContext, count: number = 5): Suggestion[] {
    const allSuggestions = this.getAllSuggestions();
    const scoredSuggestions = allSuggestions.map((suggestion) => ({
      ...suggestion,
      score: this.calculateSuggestionScore(suggestion, context),
    }));

    // Sort by score and return top suggestions
    return scoredSuggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(({ score, ...suggestion }) => suggestion);
  }

  // Calculate suggestion score based on context
  private calculateSuggestionScore(
    suggestion: Suggestion,
    context: SuggestionContext
  ): number {
    let score = suggestion.confidence;

    // Founder type matching
    if (suggestion.founderTypes.includes(context.founderType)) {
      score += 0.3;
    }

    // Difficulty adjustment based on streak
    if (context.currentStreak < 3 && suggestion.difficulty === 'easy') {
      score += 0.2;
    } else if (context.currentStreak >= 7 && suggestion.difficulty === 'hard') {
      score += 0.2;
    }

    // Time of day preferences
    if (context.timeOfDay === 'morning' && suggestion.category === 'planning') {
      score += 0.1;
    } else if (
      context.timeOfDay === 'afternoon' &&
      suggestion.category === 'development'
    ) {
      score += 0.1;
    } else if (
      context.timeOfDay === 'evening' &&
      suggestion.category === 'reflection'
    ) {
      score += 0.1;
    }

    // Day of week preferences
    if (context.dayOfWeek === 'Monday' && suggestion.category === 'planning') {
      score += 0.1;
    } else if (
      context.dayOfWeek === 'Friday' &&
      suggestion.category === 'reflection'
    ) {
      score += 0.1;
    }

    // Avoid repetition
    const recentCommitments = context.previousCommitments.slice(-5);
    const isRecent = recentCommitments.some((commitment) =>
      commitment
        .toLowerCase()
        .includes(suggestion.text.toLowerCase().split(' ')[0])
    );
    if (isRecent) {
      score -= 0.3;
    }

    // Category preference
    if (context.category && suggestion.category === context.category) {
      score += 0.2;
    }

    // User goals alignment
    if (
      context.userGoals.some((goal) =>
        suggestion.tags.some((tag) =>
          goal.toLowerCase().includes(tag.toLowerCase())
        )
      )
    ) {
      score += 0.15;
    }

    return Math.max(0, Math.min(1, score));
  }

  // Get all suggestions
  private getAllSuggestions(): Suggestion[] {
    const allSuggestions: Suggestion[] = [];
    this.suggestionHistory.forEach((categorySuggestions) => {
      allSuggestions.push(...categorySuggestions);
    });
    return allSuggestions;
  }

  // Get suggestions by category
  getSuggestionsByCategory(category: string, count: number = 3): Suggestion[] {
    const categorySuggestions = this.suggestionHistory.get(category) || [];
    return categorySuggestions.slice(0, count);
  }

  // Get suggestions by difficulty
  getSuggestionsByDifficulty(
    difficulty: 'easy' | 'medium' | 'hard',
    count: number = 3
  ): Suggestion[] {
    const allSuggestions = this.getAllSuggestions();
    return allSuggestions
      .filter((suggestion) => suggestion.difficulty === difficulty)
      .slice(0, count);
  }

  // Get suggestions for specific founder type
  getSuggestionsForFounderType(
    founderType: string,
    count: number = 5
  ): Suggestion[] {
    const allSuggestions = this.getAllSuggestions();
    return allSuggestions
      .filter((suggestion) => suggestion.founderTypes.includes(founderType))
      .slice(0, count);
  }

  // Record user feedback on suggestions
  recordFeedback(
    userId: string,
    suggestionId: string,
    feedback: 'positive' | 'negative'
  ): void {
    const userKey = `${userId}_feedback`;
    if (!this.userPreferences.has(userKey)) {
      this.userPreferences.set(userKey, {});
    }

    const preferences = this.userPreferences.get(userKey);
    if (!preferences[suggestionId]) {
      preferences[suggestionId] = { positive: 0, negative: 0 };
    }

    if (feedback === 'positive') {
      preferences[suggestionId].positive++;
    } else {
      preferences[suggestionId].negative++;
    }
  }

  // Get personalized suggestions based on user history
  getPersonalizedSuggestions(
    userId: string,
    context: SuggestionContext,
    count: number = 5
  ): Suggestion[] {
    const userKey = `${userId}_feedback`;
    const preferences = this.userPreferences.get(userKey) || {};

    const allSuggestions = this.getAllSuggestions();
    const scoredSuggestions = allSuggestions.map((suggestion) => {
      let score = this.calculateSuggestionScore(suggestion, context);

      // Add personalization based on feedback
      const feedback = preferences[suggestion.id];
      if (feedback) {
        const totalFeedback = feedback.positive + feedback.negative;
        if (totalFeedback > 0) {
          const positiveRatio = feedback.positive / totalFeedback;
          score += (positiveRatio - 0.5) * 0.4; // Boost or penalize based on feedback
        }
      }

      return { ...suggestion, score };
    });

    return scoredSuggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(({ score, ...suggestion }) => suggestion);
  }

  // Get suggestion analytics
  getSuggestionAnalytics(): {
    totalSuggestions: number;
    categories: string[];
    difficulties: string[];
    founderTypes: string[];
    averageConfidence: number;
  } {
    const allSuggestions = this.getAllSuggestions();

    const categories = [...new Set(allSuggestions.map((s) => s.category))];
    const difficulties = [...new Set(allSuggestions.map((s) => s.difficulty))];
    const founderTypes = [
      ...new Set(allSuggestions.flatMap((s) => s.founderTypes)),
    ];

    const averageConfidence =
      allSuggestions.reduce((sum, s) => sum + s.confidence, 0) /
      allSuggestions.length;

    return {
      totalSuggestions: allSuggestions.length,
      categories,
      difficulties,
      founderTypes,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
    };
  }

  // Add custom suggestion
  addCustomSuggestion(suggestion: Suggestion): void {
    if (!this.suggestionHistory.has(suggestion.category)) {
      this.suggestionHistory.set(suggestion.category, []);
    }
    this.suggestionHistory.get(suggestion.category)?.push(suggestion);
  }

  // Get trending suggestions (based on recent usage)
  getTrendingSuggestions(count: number = 3): Suggestion[] {
    // This would normally use actual usage data
    // For now, return high-confidence suggestions
    const allSuggestions = this.getAllSuggestions();
    return allSuggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, count);
  }

  // Get context-aware suggestions
  getContextAwareSuggestions(context: SuggestionContext): Suggestion[] {
    const suggestions = this.getSuggestions(context, 3);

    // Add context-specific reasoning
    return suggestions.map((suggestion) => ({
      ...suggestion,
      reasoning: this.enhanceReasoning(suggestion, context),
    }));
  }

  // Enhance reasoning with context
  private enhanceReasoning(
    suggestion: Suggestion,
    context: SuggestionContext
  ): string {
    let enhancedReasoning = suggestion.reasoning;

    if (context.currentStreak === 0) {
      enhancedReasoning += ' Perfect for starting your journey!';
    } else if (context.currentStreak >= 30) {
      enhancedReasoning += ' Challenge yourself with this advanced task!';
    }

    if (context.timeOfDay === 'morning') {
      enhancedReasoning += ' Great way to start your day!';
    } else if (context.timeOfDay === 'evening') {
      enhancedReasoning += ' Perfect for winding down productively!';
    }

    return enhancedReasoning;
  }
}
