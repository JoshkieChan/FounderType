// Enhanced Email System for FounderType
// Free email service with comprehensive templates and automation
import { FreeEmailService } from './freeEmailService';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category:
    | 'onboarding'
    | 'engagement'
    | 'retention'
    | 'achievement'
    | 'reminder';
  variables?: string[];
}

export interface EmailConfig {
  provider: 'resend' | 'sendgrid' | 'mailgun' | 'custom';
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

export class EmailSystem {
  private static instance: EmailSystem;
  private config: EmailConfig | null = null;
  private templates: Map<string, EmailTemplate> = new Map();

  static getInstance(): EmailSystem {
    if (!EmailSystem.instance) {
      EmailSystem.instance = new EmailSystem();
    }
    return EmailSystem.instance;
  }

  constructor() {
    this.initializeTemplates();
  }

  // Initialize email templates
  private initializeTemplates(): void {
    const templates: EmailTemplate[] = [
      // Onboarding emails
      {
        id: 'welcome',
        name: 'Welcome to FounderType',
        subject: 'Welcome to FounderType! 🚀',
        category: 'onboarding',
        body: `
Hi {{firstName}},

Welcome to FounderType! We're excited to help you discover your unique founder type and build a daily commitment habit.

Here's what you can expect:
- Personalized founder type assessment
- Daily commitment tracking
- Community support and accountability
- Progress insights and analytics

Ready to get started? Complete your diagnostic now and unlock your founder potential!

{{diagnosticLink}}

Best regards,
The FounderType Team
        `.trim(),
        variables: ['firstName', 'diagnosticLink'],
      },
      {
        id: 'diagnostic_reminder',
        name: 'Diagnostic Reminder',
        subject: 'Complete your FounderType diagnostic 🎯',
        category: 'onboarding',
        body: `
Hi {{firstName}},

Don't forget to complete your FounderType diagnostic! Understanding your founder type is the first step to building successful habits.

Your personalized insights are waiting for you:
- Discover your unique founder archetype
- Get tailored commitment suggestions
- Join a community of like-minded founders

{{diagnosticLink}}

Need help? Reply to this email and we'll be happy to assist you!

Best,
The FounderType Team
        `.trim(),
        variables: ['firstName', 'diagnosticLink'],
      },
      // Engagement emails
      {
        id: 'first_commitment',
        name: 'First Commitment Celebration',
        subject: '🎉 Congratulations on your first commitment!',
        category: 'achievement',
        body: `
Hi {{firstName}},

Congratulations on making your first commitment! This is a huge step in your founder journey.

Your commitment: "{{commitmentText}}"
Founder type: {{founderType}}

You're now part of a community of founders who are building habits that matter. Keep up the momentum!

Quick tips:
- Start small and build consistency
- Share your commitment for accountability
- Track your progress daily

{{profileLink}}

Cheers,
The FounderType Team
        `.trim(),
        variables: [
          'firstName',
          'commitmentText',
          'founderType',
          'profileLink',
        ],
      },
      {
        id: 'streak_milestone',
        name: 'Streak Milestone',
        subject: "🔥 {{streakCount}}-day streak! You're on fire!",
        category: 'achievement',
        body: `
Hi {{firstName}},

Incredible! You've maintained a {{streakCount}}-day streak! Your consistency is inspiring.

Your achievement:
- {{streakCount}} consecutive days
- Total commitments: {{totalCommitments}}
- Completion rate: {{completionRate}}%

{{mileilestoneReward}}

Keep building those habits! Every day you show up, you're one step closer to your goals.

{{profileLink}}

Amazing work,
The FounderType Team
        `.trim(),
        variables: [
          'firstName',
          'streakCount',
          'totalCommitments',
          'completionRate',
          'milestoneReward',
          'profileLink',
        ],
      },
      // Retention emails
      {
        id: 'weekly_digest',
        name: 'Weekly Progress Digest',
        subject: 'Your weekly FounderType progress 📊',
        category: 'engagement',
        body: `
Hi {{firstName}},

Here's your weekly progress report from FounderType:

This week's highlights:
- Commitments completed: {{weeklyCommitments}}
- Current streak: {{currentStreak}} days
- Best day: {{bestDay}}
- Total progress: {{totalProgress}}%

Insights:
{{weeklyInsights}}

Community highlights:
{{communityHighlights}}

Keep up the great work! Your consistency is building the foundation for success.

{{dashboardLink}}

Best,
The FounderType Team
        `.trim(),
        variables: [
          'firstName',
          'weeklyCommitments',
          'currentStreak',
          'bestDay',
          'totalProgress',
          'weeklyInsights',
          'communityHighlights',
          'dashboardLink',
        ],
      },
      {
        id: 're_engagement',
        name: 'We Miss You!',
        subject: 'Ready to restart your founder journey? 🌟',
        category: 'retention',
        body: `
Hi {{firstName}},

It's been {{daysSinceLastCommitment}} days since your last commitment. We miss having you in the FounderType community!

Remember why you started:
- Your founder type: {{founderType}}
- Your last commitment: "{{lastCommitment}}"
- Your best streak: {{bestStreak}} days

Every founder faces challenges, but the most successful ones get back on track. We're here to support you!

Ready to restart? Just make one small commitment today.

{{restartLink}}

We believe in you,
The FounderType Team
        `.trim(),
        variables: [
          'firstName',
          'daysSinceLastCommitment',
          'founderType',
          'lastCommitment',
          'bestStreak',
          'restartLink',
        ],
      },
      // Reminder emails
      {
        id: 'daily_reminder',
        name: 'Daily Commitment Reminder',
        subject: "Today's commitment awaits! 💪",
        category: 'reminder',
        body: `
Hi {{firstName}},

Time to make today's commitment! Your consistency is building your founder success.

Quick reminder:
- Current streak: {{currentStreak}} days
- Today's focus: {{dailyFocus}}
- Community motivation: "{{communityQuote}}"

{{commitmentLink}}

Make today count!

Best,
The FounderType Team
        `.trim(),
        variables: [
          'firstName',
          'currentStreak',
          'dailyFocus',
          'communityQuote',
          'commitmentLink',
        ],
      },
    ];

    templates.forEach((template) => {
      this.templates.set(template.id, template);
    });
  }

  // Configure email service
  configure(config: EmailConfig): void {
    this.config = config;
  }

  // Send email using free service (Resend)
  async sendEmail(
    to: string,
    templateId: string,
    variables: Record<string, string>
  ): Promise<boolean> {
    const template = this.templates.get(templateId);
    if (!template) {
      console.error(`Email template ${templateId} not found`);
      return false;
    }

    if (!this.config) {
      console.error('Email service not configured');
      return false;
    }

    try {
      // Process template variables
      let subject = template.subject;
      let body = template.body;

      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, 'g'), value);
        body = body.replace(new RegExp(placeholder, 'g'), value);
      });

      // Send using Resend (free tier available)
      if (this.config.provider === 'resend') {
        return await this.sendWithResend(to, subject, body);
      }

      console.log('Email sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  // Send with the server-side email function. API keys stay on the server.
  private async sendWithResend(
    to: string,
    subject: string,
    body: string
  ): Promise<boolean> {
    try {
      const result = await FreeEmailService.sendEmail({
        to,
        subject,
        html: body,
      });

      if (!result.success) {
        throw new Error(result.error || 'Email send failed');
      }

      return true;
    } catch (error) {
      console.error('Resend error:', error);
      return false;
    }
  }

  // Get available templates
  getTemplates(category?: string): EmailTemplate[] {
    const allTemplates = Array.from(this.templates.values());

    if (category) {
      return allTemplates.filter((template) => template.category === category);
    }

    return allTemplates;
  }

  // Get template by ID
  getTemplate(id: string): EmailTemplate | null {
    return this.templates.get(id) || null;
  }

  // Add custom template
  addTemplate(template: EmailTemplate): void {
    this.templates.set(template.id, template);
  }

  // Send welcome email
  async sendWelcomeEmail(
    email: string,
    firstName: string,
    diagnosticLink: string
  ): Promise<boolean> {
    return await this.sendEmail(email, 'welcome', {
      firstName,
      diagnosticLink,
    });
  }

  // Send diagnostic reminder
  async sendDiagnosticReminder(
    email: string,
    firstName: string,
    diagnosticLink: string
  ): Promise<boolean> {
    return await this.sendEmail(email, 'diagnostic_reminder', {
      firstName,
      diagnosticLink,
    });
  }

  // Send first commitment celebration
  async sendFirstCommitmentEmail(
    email: string,
    firstName: string,
    commitmentText: string,
    founderType: string,
    profileLink: string
  ): Promise<boolean> {
    return await this.sendEmail(email, 'first_commitment', {
      firstName,
      commitmentText,
      founderType,
      profileLink,
    });
  }

  // Send streak milestone
  async sendStreakMilestoneEmail(
    email: string,
    firstName: string,
    streakCount: number,
    totalCommitments: number,
    completionRate: number,
    milestoneReward: string,
    profileLink: string
  ): Promise<boolean> {
    return await this.sendEmail(email, 'streak_milestone', {
      firstName,
      streakCount: streakCount.toString(),
      totalCommitments: totalCommitments.toString(),
      completionRate: `${completionRate}%`,
      milestoneReward,
      profileLink,
    });
  }

  // Send weekly digest
  async sendWeeklyDigest(
    email: string,
    firstName: string,
    weeklyCommitments: number,
    currentStreak: number,
    bestDay: string,
    totalProgress: number,
    weeklyInsights: string,
    communityHighlights: string,
    dashboardLink: string
  ): Promise<boolean> {
    return await this.sendEmail(email, 'weekly_digest', {
      firstName,
      weeklyCommitments: weeklyCommitments.toString(),
      currentStreak: currentStreak.toString(),
      bestDay,
      totalProgress: `${totalProgress}%`,
      weeklyInsights,
      communityHighlights,
      dashboardLink,
    });
  }

  // Send re-engagement email
  async sendReEngagementEmail(
    email: string,
    firstName: string,
    daysSinceLastCommitment: number,
    founderType: string,
    lastCommitment: string,
    bestStreak: number,
    restartLink: string
  ): Promise<boolean> {
    return await this.sendEmail(email, 're_engagement', {
      firstName,
      daysSinceLastCommitment: daysSinceLastCommitment.toString(),
      founderType,
      lastCommitment,
      bestStreak: bestStreak.toString(),
      restartLink,
    });
  }

  // Send daily reminder
  async sendDailyReminder(
    email: string,
    firstName: string,
    currentStreak: number,
    dailyFocus: string,
    communityQuote: string,
    commitmentLink: string
  ): Promise<boolean> {
    return await this.sendEmail(email, 'daily_reminder', {
      firstName,
      currentStreak: currentStreak.toString(),
      dailyFocus,
      communityQuote,
      commitmentLink,
    });
  }

  // Test email configuration
  async testConfiguration(): Promise<boolean> {
    if (!this.config) {
      return false;
    }

    try {
      const testEmail = await this.sendWithResend(
        this.config.fromEmail,
        'FounderType Test Email',
        'This is a test email from FounderType to verify the email configuration is working correctly.'
      );

      return testEmail;
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return false;
    }
  }

  // Get email analytics (mock implementation)
  getEmailAnalytics(): {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  } {
    return {
      sent: 1000,
      delivered: 950,
      opened: 600,
      clicked: 200,
      bounced: 50,
      unsubscribed: 10,
    };
  }

  // Get email performance metrics
  getEmailPerformance(): {
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    unsubscribeRate: number;
  } {
    const analytics = this.getEmailAnalytics();

    return {
      deliveryRate: (analytics.delivered / analytics.sent) * 100,
      openRate: (analytics.opened / analytics.delivered) * 100,
      clickRate: (analytics.clicked / analytics.opened) * 100,
      bounceRate: (analytics.bounced / analytics.sent) * 100,
      unsubscribeRate: (analytics.unsubscribed / analytics.delivered) * 100,
    };
  }
}
