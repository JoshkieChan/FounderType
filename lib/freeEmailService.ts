// Free email service integration
// Uses Resend (100 emails/day free) for transactional emails

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export interface EmailTemplate {
  commitmentCompleted: {
    subject: string;
    html: string;
  };
  dailyReminder: {
    subject: string;
    html: string;
  };
  milestoneAchieved: {
    subject: string;
    html: string;
  };
}

export class FreeEmailService {
  private static readonly RESEND_API_URL = 'https://api.resend.com/emails';
  private static readonly DEFAULT_FROM = 'noreply@foundertype.app';

  // Send email using Resend API
  static async sendEmail(
    options: EmailOptions
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const apiKey = process.env.EXPO_PUBLIC_RESEND_API_KEY;

      if (!apiKey) {
        console.warn('Resend API key not found, email not sent');
        return { success: false, error: 'API key not configured' };
      }

      const response = await fetch(this.RESEND_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: options.from || this.DEFAULT_FROM,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Failed to send email',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Email templates
  static getTemplates(): EmailTemplate {
    return {
      commitmentCompleted: {
        subject: '🎉 Congratulations! You Completed Your Commitment!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #10b981; margin-bottom: 10px;">🎉 Amazing Work!</h1>
              <p style="color: #6b7280; font-size: 18px;">You've successfully completed your 30-day commitment!</p>
            </div>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #1f2937; margin-bottom: 15px;">What's Next?</h2>
              <ul style="color: #4b5563; line-height: 1.6;">
                <li>Share your success on the FounderType feed</li>
                <li>Start a new commitment to keep the momentum going</li>
                <li>Reflect on what you learned during this journey</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="https://foundertype.app" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Your Profile
              </a>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
              <p>Keep building, keep growing. You've got this! 🚀</p>
            </div>
          </div>
        `,
      },
      dailyReminder: {
        subject: '⏰ Daily Check-in Reminder',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin-bottom: 10px;">⏰ Time to Check In!</h1>
              <p style="color: #6b7280; font-size: 18px;">How did you do on your commitment today?</p>
            </div>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #1f2937; margin-bottom: 15px;">Quick Check-in</h2>
              <p style="color: #4b5563; line-height: 1.6;">
                Take 30 seconds to log your progress. Consistency is key to building lasting habits!
              </p>
            </div>
            
            <div style="text-align: center;">
              <a href="https://foundertype.app/checkin" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Check In Now
              </a>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
              <p>Every day counts. You're doing great! 💪</p>
            </div>
          </div>
        `,
      },
      milestoneAchieved: {
        subject: '🏆 Milestone Reached! Keep Going!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fef3c7;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #f59e0b; margin-bottom: 10px;">🏆 Incredible Milestone!</h1>
              <p style="color: #92400e; font-size: 18px;">You've hit a major milestone in your journey!</p>
            </div>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #1f2937; margin-bottom: 15px;">Why This Matters</h2>
              <p style="color: #4b5563; line-height: 1.6;">
                Reaching milestones like this shows real dedication. You're building habits that will last a lifetime and proving to yourself that you can follow through on your commitments.
              </p>
            </div>
            
            <div style="text-align: center;">
              <a href="https://foundertype.app" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Share Your Success
              </a>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #92400e; font-size: 12px;">
              <p>Keep pushing forward. The best is yet to come! 🌟</p>
            </div>
          </div>
        `,
      },
    };
  }

  // Send commitment completion email
  static async sendCompletionEmail(
    userEmail: string,
    userName: string
  ): Promise<void> {
    const template = this.getTemplates().commitmentCompleted;
    const personalizedHtml = template.html.replace(
      /You've successfully/,
      `${userName || 'You'}ve successfully`
    );

    await this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: personalizedHtml,
    });
  }

  // Send daily reminder email
  static async sendDailyReminder(
    userEmail: string,
    userName: string
  ): Promise<void> {
    const template = this.getTemplates().dailyReminder;

    await this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
    });
  }

  // Send milestone achievement email
  static async sendMilestoneEmail(
    userEmail: string,
    userName: string,
    milestone: string
  ): Promise<void> {
    const template = this.getTemplates().milestoneAchieved;
    const personalizedHtml = template.html.replace(
      /You've hit a major milestone/,
      `${userName || 'You'}ve hit a major milestone: ${milestone}`
    );

    await this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: personalizedHtml,
    });
  }

  // Check daily email limit (100 emails/day for Resend free tier)
  static async checkDailyLimit(): Promise<{
    canSend: boolean;
    sentToday: number;
    remaining: number;
  }> {
    try {
      // This would typically involve checking your own database
      // For now, we'll use localStorage as a simple tracker
      const today = new Date().toDateString();
      const sentCount = localStorage.getItem(`emails_sent_${today}`) || '0';
      const sent = parseInt(sentCount, 10);
      const remaining = Math.max(0, 100 - sent);

      return {
        canSend: remaining > 0,
        sentToday: sent,
        remaining,
      };
    } catch (error) {
      console.error('Error checking email limit:', error);
      return { canSend: true, sentToday: 0, remaining: 100 };
    }
  }

  // Track email sent for limit management
  static async trackEmailSent(): Promise<void> {
    try {
      const today = new Date().toDateString();
      const sentCount = localStorage.getItem(`emails_sent_${today}`) || '0';
      const sent = parseInt(sentCount, 10) + 1;
      localStorage.setItem(`emails_sent_${today}`, sent.toString());
    } catch (error) {
      console.error('Error tracking email sent:', error);
    }
  }

  // Send email with limit checking
  static async sendEmailWithLimit(
    options: EmailOptions
  ): Promise<{ success: boolean; error?: string }> {
    const limitCheck = await this.checkDailyLimit();

    if (!limitCheck.canSend) {
      return {
        success: false,
        error: `Daily email limit reached. ${limitCheck.remaining} emails remaining.`,
      };
    }

    const result = await this.sendEmail(options);

    if (result.success) {
      await this.trackEmailSent();
    }

    return result;
  }
}

// Email service hooks for React components
export function useEmailService() {
  const sendCompletionEmail = async (userEmail: string, userName: string) => {
    return await FreeEmailService.sendCompletionEmail(userEmail, userName);
  };

  const sendDailyReminder = async (userEmail: string, userName: string) => {
    return await FreeEmailService.sendDailyReminder(userEmail, userName);
  };

  const sendMilestoneEmail = async (
    userEmail: string,
    userName: string,
    milestone: string
  ) => {
    return await FreeEmailService.sendMilestoneEmail(
      userEmail,
      userName,
      milestone
    );
  };

  const checkLimit = async () => {
    return await FreeEmailService.checkDailyLimit();
  };

  return {
    sendCompletionEmail,
    sendDailyReminder,
    sendMilestoneEmail,
    checkLimit,
  };
}
