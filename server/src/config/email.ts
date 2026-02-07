/**
 * Email service configuration using Nodemailer
 */
import nodemailer from 'nodemailer';
import { logger } from './logger';

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS || '',
      }
    : undefined,
});

// Verify transporter configuration
transporter.verify((error) => {
  if (error) {
    logger.error('Email transporter verification failed:', error);
  } else {
    logger.info('Email transporter ready');
  }
});

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
  }>;
}

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const from = options.from || process.env.SMTP_FROM || 'noreply@pulsewatch.io';

  try {
    const info = await transporter.sendMail({
      from,
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    });

    logger.info({ messageId: info.messageId, to: options.to }, 'Email sent successfully');
  } catch (error) {
    logger.error({ error, to: options.to, subject: options.subject }, 'Failed to send email');
    throw error;
  }
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  resetUrl: string
): Promise<void> {
  const resetLink = `${resetUrl}?token=${resetToken}`;

  await sendEmail({
    to,
    subject: 'Reset Your PulseWatch Password',
    text: `Click the link to reset your password: ${resetLink}\n\nThis link will expire in 1 hour.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p>You requested a password reset for your PulseWatch account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetLink}" 
           style="display: inline-block; padding: 12px 24px; background-color: #007bff; 
                  color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Reset Password
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetLink}</p>
        <p style="color: #999; font-size: 12px;">This link will expire in 1 hour.</p>
        <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
  to: string,
  verificationToken: string,
  verifyUrl: string
): Promise<void> {
  const verifyLink = `${verifyUrl}?token=${verificationToken}`;

  await sendEmail({
    to,
    subject: 'Verify Your PulseWatch Email',
    text: `Click the link to verify your email: ${verifyLink}\n\nThis link will expire in 24 hours.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verify Your Email</h2>
        <p>Thank you for signing up for PulseWatch!</p>
        <p>Click the button below to verify your email address:</p>
        <a href="${verifyLink}" 
           style="display: inline-block; padding: 12px 24px; background-color: #28a745; 
                  color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Verify Email
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verifyLink}</p>
        <p style="color: #999; font-size: 12px;">This link will expire in 24 hours.</p>
      </div>
    `,
  });
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(to: string, firstName?: string): Promise<void> {
  const name = firstName || 'there';

  await sendEmail({
    to,
    subject: 'Welcome to PulseWatch!',
    text: `Hi ${name},\n\nWelcome to PulseWatch! We're excited to help you monitor your APIs and keep your services running smoothly.\n\nGet started by creating your first monitor.\n\nBest regards,\nThe PulseWatch Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to PulseWatch!</h2>
        <p>Hi ${name},</p>
        <p>We're excited to help you monitor your APIs and keep your services running smoothly.</p>
        <p>Get started by creating your first monitor:</p>
        <a href="${process.env.APP_URL}/monitors/new" 
           style="display: inline-block; padding: 12px 24px; background-color: #007bff; 
                  color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Create Your First Monitor
        </a>
        <p>Here are some things you can do with PulseWatch:</p>
        <ul>
          <li>Monitor HTTP/HTTPS endpoints</li>
          <li>Get instant alerts when services go down</li>
          <li>Track response times and uptime</li>
          <li>Create public status pages</li>
        </ul>
        <p>Best regards,<br>The PulseWatch Team</p>
      </div>
    `,
  });
}

export { transporter };
