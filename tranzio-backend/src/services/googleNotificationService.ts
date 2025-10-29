import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Google API configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';

export interface GoogleNotificationData {
  userId: string;
  transactionId?: string;
  type: 'TRANSACTION_UPDATE' | 'PAYMENT' | 'SHIPPING' | 'DELIVERY' | 'DISPUTE' | 'SYSTEM' | 'MESSAGE' | 'WALLET';
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  metadata?: {
    transactionStatus?: string;
    amount?: number;
    currency?: string;
    counterpartyName?: string;
    actionRequired?: boolean;
  };
}

class GoogleNotificationService {
  private oauth2Client: OAuth2Client;
  private gmail: any;

  constructor() {
    this.oauth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );
  }

  // Initialize Gmail API
  private async initializeGmail() {
    if (!this.gmail) {
      this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    }
  }

  // Send notification via Gmail
  async sendEmailNotification(
    userEmail: string,
    notification: GoogleNotificationData,
    accessToken?: string
  ): Promise<boolean> {
    try {
      if (accessToken) {
        this.oauth2Client.setCredentials({ access_token: accessToken });
      }

      await this.initializeGmail();

      const subject = `[Tranzio] ${notification.title}`;
      const htmlContent = this.generateEmailHTML(notification);
      const textContent = this.generateEmailText(notification);

      const message = this.createEmailMessage(
        userEmail,
        subject,
        htmlContent,
        textContent
      );

      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message,
        },
      });

      console.log(`✅ Google email notification sent to ${userEmail}: ${notification.title}`);
      return true;
    } catch (error) {
      console.error('Failed to send Google email notification:', error);
      return false;
    }
  }

  // Generate HTML email content
  private generateEmailHTML(notification: GoogleNotificationData): string {
    const priorityColor = this.getPriorityColor(notification.priority);
    const icon = this.getNotificationIcon(notification.type);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notification.title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
          .priority-${notification.priority.toLowerCase()} { background: ${priorityColor}; color: white; }
          .icon { font-size: 24px; margin-right: 10px; }
          .message { font-size: 16px; margin: 20px 0; }
          .metadata { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1><span class="icon">${icon}</span>Tranzio Notification</h1>
            <span class="priority-badge priority-${notification.priority.toLowerCase()}">${notification.priority}</span>
          </div>
          <div class="content">
            <h2>${notification.title}</h2>
            <div class="message">${notification.message}</div>
            
            ${notification.metadata ? `
              <div class="metadata">
                <h3>Transaction Details</h3>
                ${notification.metadata.transactionStatus ? `<p><strong>Status:</strong> ${notification.metadata.transactionStatus}</p>` : ''}
                ${notification.metadata.amount ? `<p><strong>Amount:</strong> $${notification.metadata.amount}</p>` : ''}
                ${notification.metadata.counterpartyName ? `<p><strong>Counterparty:</strong> ${notification.metadata.counterpartyName}</p>` : ''}
                ${notification.metadata.actionRequired ? `<p><strong>Action Required:</strong> Yes</p>` : ''}
              </div>
            ` : ''}
            
            ${notification.transactionId ? `
              <a href="${process.env.FRONTEND_URL}/app/transactions/${notification.transactionId}" class="button">
                View Transaction
              </a>
            ` : ''}
            
            <div class="footer">
              <p>This is an automated notification from Tranzio. Please do not reply to this email.</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate plain text email content
  private generateEmailText(notification: GoogleNotificationData): string {
    let text = `${notification.title}\n\n`;
    text += `${notification.message}\n\n`;
    
    if (notification.metadata) {
      text += `Transaction Details:\n`;
      if (notification.metadata.transactionStatus) {
        text += `Status: ${notification.metadata.transactionStatus}\n`;
      }
      if (notification.metadata.amount) {
        text += `Amount: $${notification.metadata.amount}\n`;
      }
      if (notification.metadata.counterpartyName) {
        text += `Counterparty: ${notification.metadata.counterpartyName}\n`;
      }
      if (notification.metadata.actionRequired) {
        text += `Action Required: Yes\n`;
      }
      text += `\n`;
    }
    
    if (notification.transactionId) {
      text += `View Transaction: ${process.env.FRONTEND_URL}/app/transactions/${notification.transactionId}\n\n`;
    }
    
    text += `This is an automated notification from Tranzio.\n`;
    text += `If you have any questions, please contact our support team.`;
    
    return text;
  }

  // Create email message in Gmail format
  private createEmailMessage(to: string, subject: string, htmlContent: string, textContent: string): string {
    const boundary = '----=_Part_' + Math.random().toString(36).substr(2, 9);
    
    let message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      ``,
      textContent,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      htmlContent,
      ``,
      `--${boundary}--`
    ].join('\n');

    return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  // Get priority color
  private getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      'LOW': '#28a745',
      'MEDIUM': '#007bff',
      'HIGH': '#fd7e14',
      'URGENT': '#dc3545'
    };
    return colors[priority] || '#007bff';
  }

  // Get notification icon
  private getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      'TRANSACTION_UPDATE': '📦',
      'PAYMENT': '💳',
      'SHIPPING': '🚚',
      'DELIVERY': '📬',
      'DISPUTE': '⚠️',
      'SYSTEM': '🔔',
      'MESSAGE': '💬',
      'WALLET': '💰'
    };
    return icons[type] || '🔔';
  }

  // Send bulk notifications
  async sendBulkNotifications(
    notifications: Array<{ email: string; notification: GoogleNotificationData; accessToken?: string }>
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    const promises = notifications.map(async ({ email, notification, accessToken }) => {
      try {
        const result = await this.sendEmailNotification(email, notification, accessToken);
        if (result) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Failed to send notification to ${email}:`, error);
        failed++;
      }
    });

    await Promise.allSettled(promises);

    return { success, failed };
  }
}

export const googleNotificationService = new GoogleNotificationService();
