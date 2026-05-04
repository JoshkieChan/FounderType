// Streak System for FounderType
// Tracks user streaks, achievements, and gamification elements

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  emoji: string;
  unlockedAt?: Date;
  category: 'streak' | 'commitment' | 'social' | 'milestone';
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCheckIn: Date | null;
  streakHistory: Date[];
  achievements: Achievement[];
}

export class StreakSystem {
  private static readonly STORAGE_KEY = 'streak_data';
  private static readonly ACHIEVEMENTS = {
    // Streak achievements
    'first_week': {
      id: 'first_week',
      title: 'First Week Complete',
      description: 'Completed your first 7-day streak',
      icon: 'flame',
      emoji: '🔥',
      category: 'streak' as const,
    },
    'two_weeks': {
      id: 'two_weeks',
      title: 'Two Week Warrior',
      description: 'Maintained a 14-day streak',
      icon: 'flame',
      emoji: '🔥🔥',
      category: 'streak' as const,
    },
    'one_month': {
      id: 'one_month',
      title: 'Monthly Master',
      description: 'Achieved a 30-day streak',
      icon: 'flame',
      emoji: '🔥🔥🔥',
      category: 'streak' as const,
    },
    'streak_legend': {
      id: 'streak_legend',
      title: 'Streak Legend',
      description: 'Maintained a 100-day streak',
      icon: 'crown',
      emoji: '👑',
      category: 'streak' as const,
    },
    
    // Commitment achievements
    'first_commitment': {
      id: 'first_commitment',
      title: 'First Step',
      description: 'Posted your first commitment',
      icon: 'flag',
      emoji: '🚩',
      category: 'commitment' as const,
    },
    'commitment_completed': {
      id: 'commitment_completed',
      title: 'Finisher',
      description: 'Completed your first 30-day commitment',
      icon: 'checkmark',
      emoji: '✅',
      category: 'commitment' as const,
    },
    'multiple_commitments': {
      id: 'multiple_commitments',
      title: 'Serial Founder',
      description: 'Completed 5 commitments',
      icon: 'star',
      emoji: '⭐',
      category: 'commitment' as const,
    },
    
    // Social achievements
    'first_support': {
      id: 'first_support',
      title: 'Supportive Founder',
      description: 'Supported another founder',
      icon: 'heart',
      emoji: '❤️',
      category: 'social' as const,
    },
    'community_leader': {
      id: 'community_leader',
      title: 'Community Leader',
      description: 'Supported 25 founders',
      icon: 'people',
      emoji: '👥',
      category: 'social' as const,
    },
    
    // Milestone achievements
    'early_bird': {
      id: 'early_bird',
      title: 'Early Bird',
      description: 'Checked in before 8 AM for a week',
      icon: 'time',
      emoji: '🌅',
      category: 'milestone' as const,
    },
    'night_owl': {
      id: 'night_owl',
      title: 'Night Owl',
      description: 'Checked in after 10 PM for a week',
      icon: 'moon',
      emoji: '🌙',
      category: 'milestone' as const,
    },
  };

  static async getStreakData(): Promise<StreakData> {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(StreakSystem.STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          return {
            ...data,
            lastCheckIn: data.lastCheckIn ? new Date(data.lastCheckIn) : null,
            streakHistory: data.streakHistory.map((date: string) => new Date(date)),
            achievements: data.achievements.map((achievement: any) => ({
              ...achievement,
              unlockedAt: achievement.unlockedAt ? new Date(achievement.unlockedAt) : undefined,
            })),
          };
        }
      }
    } catch (error) {
      console.error('Failed to load streak data:', error);
    }
    
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCheckIn: null,
      streakHistory: [],
      achievements: [],
    };
  }

  static async saveStreakData(data: StreakData): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const serialized = {
          ...data,
          lastCheckIn: data.lastCheckIn?.toISOString(),
          streakHistory: data.streakHistory.map(date => date.toISOString()),
          achievements: data.achievements.map(achievement => ({
            ...achievement,
            unlockedAt: achievement.unlockedAt?.toISOString(),
          })),
        };
        localStorage.setItem(StreakSystem.STORAGE_KEY, JSON.stringify(serialized));
      }
    } catch (error) {
      console.error('Failed to save streak data:', error);
    }
  }

  static calculateStreak(checkIns: string[]): number {
    if (!checkIns || checkIns.length === 0) return 0;
    
    const sortedDates = checkIns
      .map(date => new Date(date))
      .sort((a, b) => a.getTime() - b.getTime());
    
    let streak = 1;
    let maxStreak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const current = sortedDates[i];
      const previous = sortedDates[i - 1];
      const diffDays = Math.floor((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else if (diffDays > 1) {
        streak = 1;
      }
    }
    
    return maxStreak;
  }

  static getStreakEmoji(days: number): string {
    if (days >= 100) return '👑';
    if (days >= 50) return '🔥🔥🔥🔥🔥';
    if (days >= 30) return '🔥🔥🔥';
    if (days >= 21) return '🔥🔥';
    if (days >= 14) return '🔥';
    if (days >= 7) return '⚡';
    if (days >= 3) return '💪';
    return '🌱';
  }

  static getStreakColor(days: number): string {
    if (days >= 30) return '#ef4444'; // red
    if (days >= 21) return '#f97316'; // orange
    if (days >= 14) return '#f59e0b'; // amber
    if (days >= 7) return '#10b981'; // emerald
    if (days >= 3) return '#3b82f6'; // blue
    return '#6b7280'; // gray
  }

  static async checkAchievements(streakData: StreakData): Promise<StreakData> {
    const newAchievements: Achievement[] = [];
    const unlockedIds = new Set(streakData.achievements.map(a => a.id));

    // Check streak achievements
    if (streakData.currentStreak >= 7 && !unlockedIds.has('first_week')) {
      newAchievements.push({ ...StreakSystem.ACHIEVEMENTS.first_week, unlockedAt: new Date() });
    }
    if (streakData.currentStreak >= 14 && !unlockedIds.has('two_weeks')) {
      newAchievements.push({ ...StreakSystem.ACHIEVEMENTS.two_weeks, unlockedAt: new Date() });
    }
    if (streakData.currentStreak >= 30 && !unlockedIds.has('one_month')) {
      newAchievements.push({ ...StreakSystem.ACHIEVEMENTS.one_month, unlockedAt: new Date() });
    }
    if (streakData.currentStreak >= 100 && !unlockedIds.has('streak_legend')) {
      newAchievements.push({ ...StreakSystem.ACHIEVEMENTS.streak_legend, unlockedAt: new Date() });
    }

    return {
      ...streakData,
      achievements: [...streakData.achievements, ...newAchievements],
    };
  }

  static async updateStreak(checkInDate: Date): Promise<StreakData> {
    const data = await StreakSystem.getStreakData();
    
    // Update streak history
    data.streakHistory.push(checkInDate);
    data.lastCheckIn = checkInDate;
    
    // Calculate current streak
    data.currentStreak = StreakSystem.calculateStreak(data.streakHistory.map(d => d.toISOString()));
    data.longestStreak = Math.max(data.longestStreak, data.currentStreak);
    
    // Check for new achievements
    const updatedData = await StreakSystem.checkAchievements(data);
    
    await StreakSystem.saveStreakData(updatedData);
    return updatedData;
  }

  static async unlockAchievement(achievementId: string): Promise<StreakData> {
    const data = await StreakSystem.getStreakData();
    const achievement = StreakSystem.ACHIEVEMENTS[achievementId as keyof typeof StreakSystem.ACHIEVEMENTS];
    
    if (!achievement || data.achievements.some(a => a.id === achievementId)) {
      return data;
    }
    
    const updatedData = {
      ...data,
      achievements: [...data.achievements, { ...achievement, unlockedAt: new Date() }],
    };
    
    await StreakSystem.saveStreakData(updatedData);
    return updatedData;
  }

  static getStreakProgress(streakData: StreakData): {
    current: number;
    target: number;
    nextMilestone: number;
    progress: number;
  } {
    const milestones = [7, 14, 21, 30, 50, 100];
    const nextMilestone = milestones.find(m => m > streakData.currentStreak) || 100;
    
    return {
      current: streakData.currentStreak,
      target: nextMilestone,
      nextMilestone,
      progress: Math.min((streakData.currentStreak / nextMilestone) * 100, 100),
    };
  }

  static getRecentAchievements(streakData: StreakData, limit: number = 5): Achievement[] {
    return streakData.achievements
      .sort((a, b) => {
        const aTime = a.unlockedAt?.getTime() || 0;
        const bTime = b.unlockedAt?.getTime() || 0;
        return bTime - aTime;
      })
      .slice(0, limit);
  }

  static getTotalAchievements(streakData: StreakData): number {
    return streakData.achievements.length;
  }

  static getAchievementsByCategory(streakData: StreakData): Record<string, Achievement[]> {
    const categorized: Record<string, Achievement[]> = {};
    
    Object.values(StreakSystem.ACHIEVEMENTS).forEach(achievement => {
      if (!categorized[achievement.category]) {
        categorized[achievement.category] = [];
      }
      
      const unlocked = streakData.achievements.find(a => a.id === achievement.id);
      if (unlocked) {
        categorized[achievement.category].push(unlocked);
      } else {
        categorized[achievement.category].push({ ...achievement, unlockedAt: undefined });
      }
    });
    
    return categorized;
  }
}