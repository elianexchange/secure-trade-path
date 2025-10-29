import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Email configuration
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Create email transporter
const createTransporter = () => {
  // For localhost development, we'll use Gmail SMTP
  // You can also use Ethereal Email for testing (no real credentials needed)
  const config: EmailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    }
  };

  // If no SMTP credentials are provided, use Ethereal Email for testing
  if (!config.auth.user || !config.auth.pass) {
    console.log('⚠️  No SMTP credentials found. Using Ethereal Email for testing...');
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    });
  }

  return nodemailer.createTransport(config);
};

// Email templates
const emailTemplates = {
  transactionCreated: (data: any) => ({
    subject: `New Transaction Created - ${data.description}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Tranzio</h1>
          <p style="margin: 10px 0 0 0;">Secure Escrow Trading Platform</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">New Transaction Created</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #374151; margin-top: 0;">Transaction Details</h3>
            <p><strong>Description:</strong> ${data.description}</p>
            <p><strong>Amount:</strong> ${data.currency} ${data.price}</p>
            <p><strong>Fee:</strong> ${data.currency} ${data.fee}</p>
            <p><strong>Total:</strong> ${data.currency} ${data.total}</p>
            <p><strong>Status:</strong> ${data.status}</p>
            <p><strong>Created:</strong> ${new Date(data.createdAt).toLocaleString()}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:8081'}/app/transactions/${data.id}" 
               style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Transaction
            </a>
          </div>
        </div>
        
        <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
          <p>This is an automated message from Tranzio. Please do not reply to this email.</p>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      </div>
    `
  }),

  transactionJoined: (data: any) => ({
    subject: `Transaction Joined - ${data.description}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Tranzio</h1>
          <p style="margin: 10px 0 0 0;">Secure Escrow Trading Platform</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Transaction Joined Successfully</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #374151; margin-top: 0;">Transaction Details</h3>
            <p><strong>Description:</strong> ${data.description}</p>
            <p><strong>Amount:</strong> ${data.currency} ${data.price}</p>
            <p><strong>Status:</strong> ${data.status}</p>
            <p><strong>Joined:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:8081'}/app/transactions/${data.id}" 
               style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Transaction
            </a>
          </div>
        </div>
        
        <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
          <p>This is an automated message from Tranzio. Please do not reply to this email.</p>
        </div>
      </div>
    `
  }),

  paymentReleased: (data: any) => ({
    subject: `Payment Released - ${data.description}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Tranzio</h1>
          <p style="margin: 10px 0 0 0;">Secure Escrow Trading Platform</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Payment Released</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #374151; margin-top: 0;">Transaction Details</h3>
            <p><strong>Description:</strong> ${data.description}</p>
            <p><strong>Amount Released:</strong> ${data.currency} ${data.price}</p>
            <p><strong>Status:</strong> ${data.status}</p>
            <p><strong>Released:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:8081'}/app/transactions/${data.id}" 
               style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Transaction
            </a>
          </div>
        </div>
        
        <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
          <p>This is an automated message from Tranzio. Please do not reply to this email.</p>
        </div>
      </div>
    `
  }),

  verificationComplete: (data: any) => ({
    subject: `Identity Verification Complete - ${data.verificationLevel}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Tranzio</h1>
          <p style="margin: 10px 0 0 0;">Secure Escrow Trading Platform</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Identity Verification Complete</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #374151; margin-top: 0;">Verification Details</h3>
            <p><strong>Verification Level:</strong> ${data.verificationLevel}</p>
            <p><strong>Trust Score:</strong> ${data.trustScore}/100</p>
            <p><strong>Status:</strong> ${data.isVerified ? 'Verified' : 'Pending'}</p>
            <p><strong>Completed:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:8081'}/app/verification" 
               style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Verification Status
            </a>
          </div>
        </div>
        
        <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
          <p>This is an automated message from Tranzio. Please do not reply to this email.</p>
        </div>
      </div>
    `
  }),

  generalNotification: (data: any) => ({
    subject: data.title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Tranzio</h1>
          <p style="margin: 10px 0 0 0;">Secure Escrow Trading Platform</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">${data.title}</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="color: #374151; margin: 0;">${data.message}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:8081'}/app/dashboard" 
               style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
        </div>
        
        <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
          <p>This is an automated message from Tranzio. Please do not reply to this email.</p>
        </div>
      </div>
    `
  }),

  passwordReset: (data: any) => ({
    subject: 'Reset Your Tranzio Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Tranzio</h1>
          <p style="margin: 10px 0 0 0;">Secure Escrow Trading Platform</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Password Reset Request</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="color: #374151; margin-bottom: 16px;">Hello ${data.firstName || 'there'},</p>
            <p style="color: #374151; margin-bottom: 16px;">
              We received a request to reset your password for your Tranzio account. 
              If you made this request, click the button below to reset your password.
            </p>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 12px; margin: 16px 0;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>Security Notice:</strong> This link will expire in 1 hour for your security.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin: 16px 0 0 0;">
              If you didn't request this password reset, please ignore this email. 
              Your password will remain unchanged.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:8081'}/reset-password?token=${data.resetToken}" 
               style="background: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
              Reset My Password
            </a>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="color: #3b82f6; font-size: 12px; margin: 4px 0 0 0; word-break: break-all;">
              ${process.env.FRONTEND_URL || 'http://localhost:8081'}/reset-password?token=${data.resetToken}
            </p>
          </div>
        </div>
        
        <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
          <p style="margin: 0 0 8px 0;">This is an automated message from Tranzio. Please do not reply to this email.</p>
          <p style="margin: 0;">If you have any questions, please contact our support team.</p>
        </div>
      </div>
    `
  })
};

// Email service class
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = createTransporter();
  }

  // Send email
  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'Tranzio <noreply@tranzio.com>',
        to,
        subject,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      // If using Ethereal Email, log the preview URL
      if (info.messageId && info.messageId.includes('ethereal')) {
        console.log('📧 Email sent (Ethereal):', nodemailer.getTestMessageUrl(info));
      } else {
        console.log('📧 Email sent successfully:', info.messageId);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  // Send transaction created email
  async sendTransactionCreatedEmail(transactionId: string, userEmail: string): Promise<boolean> {
    try {
      const transaction = await prisma.escrowTransaction.findUnique({
        where: { id: transactionId },
        include: {
          creator: { select: { firstName: true, lastName: true } }
        }
      });

      if (!transaction) {
        console.error('Transaction not found for email:', transactionId);
        return false;
      }

      const template = emailTemplates.transactionCreated(transaction);
      return await this.sendEmail(userEmail, template.subject, template.html);
    } catch (error) {
      console.error('Error sending transaction created email:', error);
      return false;
    }
  }

  // Send transaction joined email
  async sendTransactionJoinedEmail(transactionId: string, userEmail: string): Promise<boolean> {
    try {
      const transaction = await prisma.escrowTransaction.findUnique({
        where: { id: transactionId }
      });

      if (!transaction) {
        console.error('Transaction not found for email:', transactionId);
        return false;
      }

      const template = emailTemplates.transactionJoined(transaction);
      return await this.sendEmail(userEmail, template.subject, template.html);
    } catch (error) {
      console.error('Error sending transaction joined email:', error);
      return false;
    }
  }

  // Send payment released email
  async sendPaymentReleasedEmail(transactionId: string, userEmail: string): Promise<boolean> {
    try {
      const transaction = await prisma.escrowTransaction.findUnique({
        where: { id: transactionId }
      });

      if (!transaction) {
        console.error('Transaction not found for email:', transactionId);
        return false;
      }

      const template = emailTemplates.paymentReleased(transaction);
      return await this.sendEmail(userEmail, template.subject, template.html);
    } catch (error) {
      console.error('Error sending payment released email:', error);
      return false;
    }
  }

  // Send verification complete email
  async sendVerificationCompleteEmail(userEmail: string, verificationData: any): Promise<boolean> {
    try {
      const template = emailTemplates.verificationComplete(verificationData);
      return await this.sendEmail(userEmail, template.subject, template.html);
    } catch (error) {
      console.error('Error sending verification complete email:', error);
      return false;
    }
  }

  // Send general notification email
  async sendNotificationEmail(userEmail: string, notificationData: any): Promise<boolean> {
    try {
      const template = emailTemplates.generalNotification(notificationData);
      return await this.sendEmail(userEmail, template.subject, template.html);
    } catch (error) {
      console.error('Error sending notification email:', error);
      return false;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(userEmail: string, resetToken: string, firstName?: string): Promise<boolean> {
    try {
      const template = emailTemplates.passwordReset({
        firstName,
        resetToken
      });
      
      return await this.sendEmail(userEmail, template.subject, template.html);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  // Test email configuration
  async testEmailConfiguration(): Promise<boolean> {
    try {
      const testEmail = process.env.TEST_EMAIL || 'test@example.com';
      const template = emailTemplates.generalNotification({
        title: 'Email Configuration Test',
        message: 'This is a test email to verify that email notifications are working correctly.'
      });
      
      return await this.sendEmail(testEmail, template.subject, template.html);
    } catch (error) {
      console.error('Error testing email configuration:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
