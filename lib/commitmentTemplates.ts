// Commitment Templates for FounderType
// Pre-built templates organized by category and founder type

export interface CommitmentTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  founderTypes: string[];
  duration: number;
  dailyAction: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

export const COMMITMENT_TEMPLATES: CommitmentTemplate[] = [
  // Product Builder Templates
  {
    id: 'mvp_launch',
    title: 'Launch MVP',
    description:
      'Build and launch the minimum viable product for my startup idea',
    category: 'Product Builder',
    founderTypes: ['Product Builder', 'Visionary', 'Innovator'],
    duration: 30,
    dailyAction: 'Work on MVP development for at least 2 hours',
    difficulty: 'hard',
    tags: ['development', 'launch', 'startup'],
  },
  {
    id: 'user_feedback',
    title: 'Get User Feedback',
    description: 'Collect and analyze user feedback on my product every day',
    category: 'Product Builder',
    founderTypes: ['Product Builder', 'Analyst', 'Customer Obsessed'],
    duration: 30,
    dailyAction: 'Talk to at least 3 users about my product',
    difficulty: 'medium',
    tags: ['feedback', 'users', 'research'],
  },
  {
    id: 'feature_ship',
    title: 'Ship a Feature',
    description: 'Complete and ship at least one new feature every week',
    category: 'Product Builder',
    founderTypes: ['Product Builder', 'Executor', 'Systems Thinker'],
    duration: 30,
    dailyAction: 'Make progress on feature development',
    difficulty: 'medium',
    tags: ['development', 'shipping', 'features'],
  },

  // Content Creator Templates
  {
    id: 'daily_content',
    title: 'Daily Content Creation',
    description: 'Create and publish one piece of content every single day',
    category: 'Content Creator',
    founderTypes: ['Content Creator', 'Communicator', 'Visionary'],
    duration: 30,
    dailyAction: 'Write, record, or create content for my audience',
    difficulty: 'medium',
    tags: ['content', 'creation', 'consistency'],
  },
  {
    id: 'audience_growth',
    title: 'Audience Growth',
    description: 'Grow my audience by 100 new followers/subscribers this month',
    category: 'Content Creator',
    founderTypes: ['Content Creator', 'Growth Hacker', 'Networker'],
    duration: 30,
    dailyAction: 'Engage in audience growth activities',
    difficulty: 'medium',
    tags: ['growth', 'audience', 'marketing'],
  },
  {
    id: 'content_series',
    title: 'Content Series',
    description: 'Create a complete content series with 7+ connected pieces',
    category: 'Content Creator',
    founderTypes: ['Content Creator', 'Storyteller', 'Educator'],
    duration: 30,
    dailyAction: 'Work on my content series',
    difficulty: 'hard',
    tags: ['series', 'content', 'planning'],
  },

  // Sales & Marketing Templates
  {
    id: 'daily_outreach',
    title: 'Daily Outreach',
    description: 'Reach out to 10 potential customers or partners every day',
    category: 'Sales & Marketing',
    founderTypes: ['Sales Expert', 'Networker', 'Communicator'],
    duration: 30,
    dailyAction: 'Make sales outreach calls or send messages',
    difficulty: 'hard',
    tags: ['sales', 'outreach', 'networking'],
  },
  {
    id: 'marketing_campaign',
    title: 'Marketing Campaign',
    description: 'Execute a complete marketing campaign from start to finish',
    category: 'Sales & Marketing',
    founderTypes: ['Growth Hacker', 'Visionary', 'Storyteller'],
    duration: 30,
    dailyAction: 'Work on marketing campaign tasks',
    difficulty: 'medium',
    tags: ['marketing', 'campaign', 'growth'],
  },
  {
    id: 'content_marketing',
    title: 'Content Marketing',
    description: 'Create and distribute marketing content every business day',
    category: 'Sales & Marketing',
    founderTypes: ['Content Creator', 'Communicator', 'Educator'],
    duration: 30,
    dailyAction: 'Create marketing content',
    difficulty: 'medium',
    tags: ['marketing', 'content', 'distribution'],
  },

  // Personal Development Templates
  {
    id: 'skill_learning',
    title: 'Learn a New Skill',
    description: 'Dedicate time every day to learning a new valuable skill',
    category: 'Personal Development',
    founderTypes: ['Lifelong Learner', 'Analyst', 'Innovator'],
    duration: 30,
    dailyAction: 'Practice or study my chosen skill',
    difficulty: 'medium',
    tags: ['learning', 'skills', 'development'],
  },
  {
    id: 'habit_building',
    title: 'Build a New Habit',
    description:
      'Establish a positive new habit through consistent daily practice',
    category: 'Personal Development',
    founderTypes: ['Systems Thinker', 'Executor', 'Planner'],
    duration: 30,
    dailyAction: 'Practice my new habit',
    difficulty: 'easy',
    tags: ['habits', 'discipline', 'routine'],
  },
  {
    id: 'health_fitness',
    title: 'Health & Fitness',
    description:
      'Improve my physical health through daily exercise and nutrition',
    category: 'Personal Development',
    founderTypes: ['Athlete', 'Disciplined', 'Executor'],
    duration: 30,
    dailyAction: 'Exercise for 30 minutes and eat healthy',
    difficulty: 'medium',
    tags: ['health', 'fitness', 'wellness'],
  },

  // Business Operations Templates
  {
    id: 'financial_tracking',
    title: 'Financial Tracking',
    description: 'Track and analyze business finances every single day',
    category: 'Business Operations',
    founderTypes: ['Analyst', 'Systems Thinker', 'Planner'],
    duration: 30,
    dailyAction: 'Review and update financial records',
    difficulty: 'easy',
    tags: ['finance', 'tracking', 'business'],
  },
  {
    id: 'process_improvement',
    title: 'Process Improvement',
    description:
      'Identify and implement one business process improvement daily',
    category: 'Business Operations',
    founderTypes: ['Systems Thinker', 'Innovator', 'Optimizer'],
    duration: 30,
    dailyAction: 'Work on improving business processes',
    difficulty: 'medium',
    tags: ['process', 'improvement', 'efficiency'],
  },
  {
    id: 'team_building',
    title: 'Team Building',
    description: 'Strengthen team relationships and communication daily',
    category: 'Business Operations',
    founderTypes: ['Communicator', 'Networker', 'Leader'],
    duration: 30,
    dailyAction: 'Engage in team building activities',
    difficulty: 'easy',
    tags: ['team', 'communication', 'leadership'],
  },

  // Innovation Templates
  {
    id: 'idea_generation',
    title: 'Daily Idea Generation',
    description: 'Generate and document 10 new business or product ideas daily',
    category: 'Innovation',
    founderTypes: ['Visionary', 'Innovator', 'Creative'],
    duration: 30,
    dailyAction: 'Brainstorm and record new ideas',
    difficulty: 'medium',
    tags: ['ideas', 'creativity', 'innovation'],
  },
  {
    id: 'experiment_testing',
    title: 'Run Daily Experiments',
    description: 'Design and run small experiments to test assumptions',
    category: 'Innovation',
    founderTypes: ['Scientist', 'Analyst', 'Data Driven'],
    duration: 30,
    dailyAction: 'Conduct a business experiment',
    difficulty: 'medium',
    tags: ['experiments', 'testing', 'data'],
  },
  {
    id: 'prototype_building',
    title: 'Rapid Prototyping',
    description: 'Build and test a new prototype every single day',
    category: 'Innovation',
    founderTypes: ['Maker', 'Product Builder', 'Innovator'],
    duration: 30,
    dailyAction: 'Create and test a prototype',
    difficulty: 'hard',
    tags: ['prototyping', 'building', 'testing'],
  },
];

export class CommitmentTemplateService {
  static getTemplatesByCategory(category: string): CommitmentTemplate[] {
    return COMMITMENT_TEMPLATES.filter(
      (template) => template.category === category
    );
  }

  static getTemplatesByFounderType(founderType: string): CommitmentTemplate[] {
    return COMMITMENT_TEMPLATES.filter((template) =>
      template.founderTypes.includes(founderType)
    );
  }

  static getTemplatesByDifficulty(
    difficulty: 'easy' | 'medium' | 'hard'
  ): CommitmentTemplate[] {
    return COMMITMENT_TEMPLATES.filter(
      (template) => template.difficulty === difficulty
    );
  }

  static getTemplatesByTag(tag: string): CommitmentTemplate[] {
    return COMMITMENT_TEMPLATES.filter((template) =>
      template.tags.includes(tag)
    );
  }

  static searchTemplates(query: string): CommitmentTemplate[] {
    const lowercaseQuery = query.toLowerCase();
    return COMMITMENT_TEMPLATES.filter(
      (template) =>
        template.title.toLowerCase().includes(lowercaseQuery) ||
        template.description.toLowerCase().includes(lowercaseQuery) ||
        template.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  static getRandomTemplate(): CommitmentTemplate {
    const randomIndex = Math.floor(Math.random() * COMMITMENT_TEMPLATES.length);
    return COMMITMENT_TEMPLATES[randomIndex];
  }

  static getRecommendedTemplates(
    founderType: string,
    interests: string[] = []
  ): CommitmentTemplate[] {
    // Start with founder type matches
    let recommended = this.getTemplatesByFounderType(founderType);

    // Add matches based on interests/tags
    interests.forEach((interest) => {
      const matches = this.getTemplatesByTag(interest);
      recommended = [...recommended, ...matches];
    });

    // Remove duplicates and sort by relevance
    const uniqueTemplates = Array.from(
      new Map(recommended.map((template) => [template.id, template])).values()
    );

    // Sort by difficulty (easier first for new users)
    return uniqueTemplates.sort((a, b) => {
      const difficultyOrder: Record<CommitmentTemplate['difficulty'], number> =
        {
          easy: 0,
          medium: 1,
          hard: 2,
        };
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    });
  }

  static getAllTemplates(): CommitmentTemplate[] {
    return [...COMMITMENT_TEMPLATES];
  }

  static getAllCategories(): string[] {
    const categories = Array.from(
      new Set(COMMITMENT_TEMPLATES.map((template) => template.category))
    ).sort();
    return categories;
  }

  static getAllTags(): string[] {
    const allTags = COMMITMENT_TEMPLATES.flatMap((template) => template.tags);
    const uniqueTags = Array.from(new Set(allTags)).sort();
    return uniqueTags;
  }

  static createCustomTemplate(
    template: Omit<CommitmentTemplate, 'id'>
  ): CommitmentTemplate {
    return {
      ...template,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }
}
