import nodemailer from "nodemailer";
import type { MailOptions } from "../types/mail.types.js";

/**
 * Mail service for sending emails
 */
class MailService {
  private transporter!: nodemailer.Transporter;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Initialize the nodemailer transporter
   */
  private initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: "ecohavest.org",
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAILER_EMAIL,
        pass: process.env.MAILER_PASSWORD,
      },
      logger: process.env.NODE_ENV !== "production",
      debug: process.env.NODE_ENV !== "production",
    });
  }

  /**
   * Send an email
   */
  async sendMail({ to, subject, text, html }: MailOptions): Promise<void> {
    const mailOptions = {
      from: process.env.MAILER_EMAIL,
      to,
      subject,
      text,
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to send email: ${error.message}`);
      }
      throw new Error("Failed to send email");
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    const subject = "Reset your password";
    const { text, html } = this.getPasswordResetTemplate(resetUrl);

    await this.sendMail({
      to: email,
      subject,
      text,
      html,
    });
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(
    email: string,
    verificationUrl: string
  ): Promise<void> {
    const subject = "Verify your email address";
    const { text, html } = this.getVerificationEmailTemplate(verificationUrl);

    await this.sendMail({
      to: email,
      subject,
      text,
      html,
    });
  }

  /**
   * Get the base email template layout
   */
  private getBaseTemplate(content: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light">
      <meta name="supported-color-schemes" content="light">
      <title>EcoHarvest</title>
      <style>
        /* Base styles */
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #1e293b;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        /* Container */
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        
        /* Header */
        .header {
          background-color: #16a34a;
          padding: 24px 0;
          text-align: center;
        }
        
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        
        .logo {
          max-height: 50px;
          margin-bottom: 12px;
        }
        
        /* Content */
        .content {
          padding: 32px 24px;
          background-color: #ffffff;
        }
        
        /* Button */
        .button {
          display: inline-block;
          background-color: #16a34a;
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
          margin: 24px 0;
          text-align: center;
          transition: background-color 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .button:hover {
          background-color: #15803d;
        }
        
        /* Info box */
        .info-box {
          background-color: #f0fdf4;
          border-left: 4px solid #16a34a;
          padding: 16px;
          margin: 24px 0;
          border-radius: 4px;
        }
        
        /* Alert box */
        .alert-box {
          background-color: #fef2f2;
          border-left: 4px solid #ef4444;
          padding: 16px;
          margin: 24px 0;
          border-radius: 4px;
        }
        
        /* Status indicators */
        .status {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .status-approved {
          background-color: #dcfce7;
          color: #166534;
        }
        
        .status-pending {
          background-color: #fef9c3;
          color: #854d0e;
        }
        
        .status-rejected, .status-failed, .status-cancelled {
          background-color: #fee2e2;
          color: #b91c1c;
        }
        
        .status-completed {
          background-color: #dbeafe;
          color: #1e40af;
        }
        
        /* Amount */
        .amount {
          font-size: 32px;
          font-weight: 700;
          text-align: center;
          margin: 24px 0;
          color: #334155;
        }
        
        /* Plan */
        .plan {
          text-align: center;
          font-size: 20px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 16px;
        }
        
        /* Footer */
        .footer {
          padding: 24px;
          text-align: center;
          font-size: 14px;
          color: #64748b;
          background-color: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }
        
        .social-links {
          margin: 16px 0;
        }
        
        .social-link {
          display: inline-block;
          margin: 0 8px;
        }
        
        /* Responsive */
        @media only screen and (max-width: 600px) {
          .container {
            width: 100% !important;
            border-radius: 0;
          }
          
          .content {
            padding: 24px 16px;
          }
          
          .amount {
            font-size: 28px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://ecohavest.org/images/ecoharvest-logo-2-removebg-preview.png" alt="EcoHarvest" class="logo" onerror="this.style.display='none'">
          <h1>EcoHarvest</h1>
        </div>
        
        ${content}
        
        <div class="footer">
          <div class="social-links">
            <!-- Replace with actual social media links -->
            <a href="https://twitter.com/ecohavest" class="social-link">Twitter</a>
            <a href="https://facebook.com/ecohavest" class="social-link">Facebook</a>
            <a href="https://instagram.com/ecohavest" class="social-link">Instagram</a>
          </div>
          <p>&copy; ${new Date().getFullYear()} EcoHarvest. All rights reserved.</p>
          <p>Sustainable Investments for a Greener Future</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Get password reset email template
   */
  private getPasswordResetTemplate(resetUrl: string): {
    text: string;
    html: string;
  } {
    const text = `Reset your password for EcoHarvest. Click the link to reset your password: ${resetUrl}`;

    const content = `
    <div class="content">
      <h2>Reset Your Password</h2>
      <p>We received a request to reset the password for your EcoHarvest account. Please click the button below to create a new password.</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      
      <div class="info-box">
        <p><strong>Important:</strong> This link will expire in 30 minutes for security reasons.</p>
      </div>
      
      <p>If you didn't request a password reset, you can safely ignore this email. Your account is secure.</p>
      
      <p>If you're having trouble with the button above, copy and paste the URL below into your web browser:</p>
      <p style="word-break: break-all; font-size: 14px; color: #64748b; background-color: #f8fafc; padding: 12px; border-radius: 4px;">${resetUrl}</p>
      
      <p>Need help? Contact our support team at <a href="mailto:support@ecohavest.org">support@ecohavest.org</a></p>
    </div>
    `;

    const html = this.getBaseTemplate(content);
    return { text, html };
  }

  /**
   * Get verification email template
   */
  private getVerificationEmailTemplate(verificationUrl: string): {
    text: string;
    html: string;
  } {
    const text = `Welcome to EcoHarvest! Please verify your email address by clicking the following link: ${verificationUrl}`;

    const content = `
    <div class="content">
      <h2>Welcome to EcoHarvest!</h2>
      <p>Thank you for joining our sustainable investment platform. To get started, please verify your email address by clicking the button below.</p>
      
      <div style="text-align: center;">
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </div>
      
      <div class="info-box">
        <p>By verifying your email, you'll have full access to all EcoHarvest features and investment opportunities.</p>
      </div>
      
      <p>If you're having trouble with the button above, copy and paste the URL below into your web browser:</p>
      <p style="word-break: break-all; font-size: 14px; color: #64748b; background-color: #f8fafc; padding: 12px; border-radius: 4px;">${verificationUrl}</p>
      
      <p>If you didn't create an account with EcoHarvest, please disregard this email.</p>
    </div>
    `;

    const html = this.getBaseTemplate(content);
    return { text, html };
  }

  /**
   * Send deposit notification email
   */
  async sendDepositNotification(
    email: string,
    amount: string,
    currency: string,
    status: string
  ): Promise<void> {
    let subject = "";
    if (status === "PENDING") {
      subject = `Your ${currency} deposit has been received`;
    } else {
      subject = `Your ${currency} deposit is now ${status.toLowerCase()}`;
    }

    const { text, html } = this.getDepositTemplate(amount, currency, status);

    await this.sendMail({
      to: email,
      subject,
      text,
      html,
    });
  }

  /**
   * Send withdrawal notification email
   */
  async sendWithdrawalNotification(
    email: string,
    amount: string,
    currency: string,
    status: string,
    rejectionReason?: string
  ): Promise<void> {
    let subject = "";
    if (status === "PENDING") {
      subject = `Your ${currency} withdrawal request has been received`;
    } else {
      subject = `Your ${currency} withdrawal is now ${status.toLowerCase()}`;
    }

    const { text, html } = this.getWithdrawalTemplate(
      amount,
      currency,
      status,
      rejectionReason
    );

    await this.sendMail({
      to: email,
      subject,
      text,
      html,
    });
  }

  /**
   * Send investment notification email
   */
  async sendInvestmentNotification(
    email: string,
    amount: string,
    planType: string,
    currency: string,
    status: string
  ): Promise<void> {
    let subject = "";
    if (status === "ACTIVE") {
      subject = `Your ${planType} investment has been activated`;
    } else if (status === "COMPLETED") {
      subject = `Your ${planType} investment is now complete`;
    } else {
      subject = `Your ${planType} investment status is now ${status.toLowerCase()}`;
    }

    const { text, html } = this.getInvestmentTemplate(
      amount,
      planType,
      currency,
      status
    );

    await this.sendMail({
      to: email,
      subject,
      text,
      html,
    });
  }

  /**
   * Get deposit email template
   */
  private getDepositTemplate(
    amount: string,
    currency: string,
    status: string
  ): { text: string; html: string } {
    let statusMessage = "";
    let buttonText = "";
    let buttonUrl = process.env.FRONTEND_URL || "https://ecohavest.org";
    let additionalInfo = "";

    if (status === "PENDING") {
      statusMessage =
        "Your deposit is being processed and will be credited to your account once confirmed.";
      buttonText = "Track Deposit";
      additionalInfo =
        "Deposits typically take 10-30 minutes to confirm, depending on network conditions.";
    } else if (status === "APPROVED") {
      statusMessage =
        "Your deposit has been approved and credited to your account. You can now use these funds for investments.";
      buttonText = "View Dashboard";
    } else if (status === "REJECTED") {
      statusMessage =
        "Unfortunately, your deposit has been rejected. This may be due to compliance issues or transaction errors.";
      buttonText = "Contact Support";
      additionalInfo =
        "Our support team is ready to assist you in resolving this issue.";
    } else if (status === "FAILED") {
      statusMessage =
        "Your deposit transaction has failed. This could be due to network issues or insufficient funds.";
      buttonText = "Try Again";
      additionalInfo =
        "If you continue experiencing issues, please contact our support team.";
    }

    const text = `
    Deposit Notification
    
    Amount: ${amount} ${currency}
    Status: ${status}
    
    ${statusMessage}
    
    ${additionalInfo}
    
    Visit our website to view your deposit details: ${buttonUrl}
    `;

    const statusClass =
      status === "APPROVED"
        ? "status-approved"
        : status === "PENDING"
        ? "status-pending"
        : "status-rejected";

    const content = `
    <div class="content">
      <h2>Deposit Notification</h2>
      
      <div class="amount">${amount} ${currency}</div>
      
      <div style="text-align: center; margin: 24px 0;">
        <span class="${statusClass} status">${status}</span>
      </div>
      
      <p>${statusMessage}</p>
      
      ${
        additionalInfo
          ? `<div class="info-box"><p>${additionalInfo}</p></div>`
          : ""
      }
      
      <div style="text-align: center;">
        <a href="${buttonUrl}" class="button">${buttonText}</a>
      </div>
      
      <p>Need assistance? Our support team is available 24/7 at <a href="mailto:support@ecohavest.org">support@ecohavest.org</a></p>
    </div>
    `;

    const html = this.getBaseTemplate(content);
    return { text, html };
  }

  /**
   * Get withdrawal email template
   */
  private getWithdrawalTemplate(
    amount: string,
    currency: string,
    status: string,
    rejectionReason?: string
  ): { text: string; html: string } {
    let statusMessage = "";
    let buttonText = "";
    let buttonUrl = process.env.FRONTEND_URL || "https://ecohavest.org";
    let additionalInfo = "";

    if (status === "PENDING") {
      statusMessage = "Your withdrawal request is being processed by our team.";
      buttonText = "Track Withdrawal";
      additionalInfo =
        "Withdrawal requests are typically processed within 24 hours.";
    } else if (status === "APPROVED") {
      statusMessage =
        "Your withdrawal has been approved and funds are being sent to your wallet.";
      buttonText = "View Transaction";
      additionalInfo =
        "The funds should arrive in your wallet shortly, depending on network congestion.";
    } else if (status === "REJECTED") {
      statusMessage = "Your withdrawal request has been rejected.";
      buttonText = "Contact Support";
    }

    const text = `
    Withdrawal Notification
    
    Amount: ${amount} ${currency}
    Status: ${status}
    ${rejectionReason ? `Rejection Reason: ${rejectionReason}` : ""}
    
    ${statusMessage}
    
    ${additionalInfo}
    
    Visit our website to view your withdrawal details: ${buttonUrl}
    `;

    const statusClass =
      status === "APPROVED"
        ? "status-approved"
        : status === "PENDING"
        ? "status-pending"
        : "status-rejected";

    const content = `
    <div class="content">
      <h2>Withdrawal Notification</h2>
      
      <div class="amount">${amount} ${currency}</div>
      
      <div style="text-align: center; margin: 24px 0;">
        <span class="${statusClass} status">${status}</span>
      </div>
      
      <p>${statusMessage}</p>
      
      ${
        rejectionReason
          ? `
      <div class="alert-box">
        <p><strong>Reason for rejection:</strong> ${rejectionReason}</p>
      </div>
      `
          : ""
      }
      
      ${
        additionalInfo
          ? `<div class="info-box"><p>${additionalInfo}</p></div>`
          : ""
      }
      
      <div style="text-align: center;">
        <a href="${buttonUrl}" class="button">${buttonText}</a>
      </div>
      
      <p>For any questions about your withdrawal, please contact us at <a href="mailto:support@ecohavest.org">support@ecohavest.org</a></p>
    </div>
    `;

    const html = this.getBaseTemplate(content);
    return { text, html };
  }

  /**
   * Get investment email template
   */
  private getInvestmentTemplate(
    amount: string,
    planType: string,
    currency: string,
    status: string
  ): { text: string; html: string } {
    let statusMessage = "";
    let buttonText = "";
    let buttonUrl = process.env.FRONTEND_URL || "https://ecohavest.org";
    let additionalInfo = "";

    if (status === "ACTIVE") {
      statusMessage = `Your ${planType} investment has been activated and is now generating returns.`;
      buttonText = "View Investment";
      additionalInfo =
        "You can track your investment performance and returns in real-time from your dashboard.";
    } else if (status === "COMPLETED") {
      statusMessage = `Your ${planType} investment has successfully completed its term. All returns have been credited to your account.`;
      buttonText = "View Returns";
      additionalInfo =
        "Thank you for investing with EcoHarvest. We hope you'll consider reinvesting with us.";
    } else if (status === "CANCELLED") {
      statusMessage = `Your ${planType} investment has been cancelled.`;
      buttonText = "Contact Support";
    } else {
      statusMessage = `Your ${planType} investment status has been updated to ${status}.`;
      buttonText = "View Investment";
    }

    const text = `
    Investment Notification
    
    Plan: ${planType}
    Amount: ${amount} ${currency}
    Status: ${status}
    
    ${statusMessage}
    
    ${additionalInfo}
    
    Visit our website to view your investment details: ${buttonUrl}
    `;

    const statusClass =
      status === "ACTIVE"
        ? "status-approved"
        : status === "PENDING"
        ? "status-pending"
        : status === "COMPLETED"
        ? "status-completed"
        : "status-cancelled";

    const content = `
    <div class="content">
      <h2>Investment Notification</h2>
      
      <div class="plan">${planType} Plan</div>
      <div class="amount">${amount} ${currency}</div>
      
      <div style="text-align: center; margin: 24px 0;">
        <span class="${statusClass} status">${status}</span>
      </div>
      
      <p>${statusMessage}</p>
      
      ${
        additionalInfo
          ? `<div class="info-box"><p>${additionalInfo}</p></div>`
          : ""
      }
      
      <div style="text-align: center;">
        <a href="${buttonUrl}" class="button">${buttonText}</a>
      </div>
      
      ${
        status === "COMPLETED"
          ? `
      <div style="margin-top: 24px; text-align: center; padding: 16px; background-color: #f0fdf4; border-radius: 8px;">
        <p style="font-weight: 600; margin-bottom: 8px;">Ready to grow your investments further?</p>
        <a href="${process.env.FRONTEND_URL}/investments" style="color: #16a34a; font-weight: 600;">Explore more investment plans →</a>
      </div>
      `
          : ""
      }
      
      <p>For any questions about your investment, please contact our investment advisors at <a href="mailto:investments@ecohavest.org">investments@ecohavest.org</a></p>
    </div>
    `;

    const html = this.getBaseTemplate(content);
    return { text, html };
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const subject = `Welcome to EcoHarvest, ${firstName}!`;
    const { text, html } = this.getWelcomeEmailTemplate(firstName);

    await this.sendMail({
      to: email,
      subject,
      text,
      html,
    });
  }

  /**
   * Get welcome email template
   */
  private getWelcomeEmailTemplate(firstName: string): {
    text: string;
    html: string;
  } {
    const dashboardUrl = `${
      process.env.FRONTEND_URL || "https://ecohavest.org"
    }/dashboard`;
    const servicesUrl = `${
      process.env.FRONTEND_URL || "https://ecohavest.org"
    }/services`;
    const contactUrl = `${
      process.env.FRONTEND_URL || "https://ecohavest.org"
    }/contact`;
    const faqsUrl = `${
      process.env.FRONTEND_URL || "https://ecohavest.org"
    }/faqs`;
    const aboutUrl = `${
      process.env.FRONTEND_URL || "https://ecohavest.org"
    }/about`;
    const supportEmail = "support@ecohavest.org";
    const websiteUrl = "https://ecohavest.org";
    const logoUrl =
      "https://ecohavest.org/images/ecoharvest-logo-2-removebg-preview.png";

    const text = `
    Welcome to EcoHarvest, ${firstName}!

    We're thrilled to have you join our community. Whether you're here to make good for the future or simply to explore, we're here to support you every step of the way.

    Here's what you can do next:
    - Complete your profile: ${dashboardUrl}
    - Explore our features: ${servicesUrl}
    - Get help or support: ${contactUrl}

    Useful Links:
    - FAQs: ${faqsUrl}
    - About Us: ${aboutUrl}
    
    Useful Documents:
    - Ecoharvest Lightpaper: ${websiteUrl}/docs/Lightpaper-ecoharvest.pdf
    - Articles of Incorporation: ${websiteUrl}/docs/Articles%20of%20Incorporation%20ecoharvest.pdf
    - Certificate of Incorporation: ${websiteUrl}/docs/Certificate%20of%20Incorporation%20ecoharvest.pdf
    - LLC Registration: ${websiteUrl}/docs/ecoharvest-II-reg.pdf
    - LLC Formation: ${websiteUrl}/docs/Certificate%20of%20Formation%20-%20Domestic%20Limited%20Liability%20Company%20ECOHARVEST%20Limited%20Liability%20Company.pdf
    - Liability Insurance: ${websiteUrl}/docs/ecoharvest-usa-Acord%20certificate%20of%20insurance.pdf
    - Ecoharvest EIN: ${websiteUrl}/docs/ecoharvest-ein.pdf
    - Initial Return: ${websiteUrl}/docs/ON%20-%20Initial%20Return%20ecoharvest.pdf
    - Extra Provincial Registration: ${websiteUrl}/docs/ON%20-%20Extra%20Provincial%20Registration%20ecoharvest.pdf
    - Corporation Information Sheet: ${websiteUrl}/docs/Information%20Sheet%20ecoharvest.pdf
    - Ecoharvest Business Plan: ${websiteUrl}/docs/ecoharvest-business-plan.pdf

    If you have any questions or need assistance, don't hesitate to reach out to our support team at ${supportEmail} or visit our contact page: ${contactUrl}

    Thank you for choosing EcoHarvest. We're excited to have you on board!

    Best regards,
    The EcoHarvest Team
    WhatsApp: https://wa.me/+447904016379
    Website: ${websiteUrl}
    `;

    const content = `
    <div class="content">
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="${logoUrl}" alt="EcoHarvest Logo" style="max-height: 80px;">
      </div>
    
      <h2>Welcome to EcoHarvest, ${firstName}! 🎉</h2>
      
      <p>We're thrilled to have you join our community. Whether you're here to make good for the future or simply to explore, we're here to support you every step of the way.</p>
      
      <h3 style="margin-top: 32px; margin-bottom: 16px; font-weight: 600; font-size: 18px;">Here's what you can do next:</h3>
      <ul style="list-style: none; padding-left: 0; margin-bottom: 24px;">
        <li style="margin-bottom: 12px;"><strong>Complete your profile:</strong> <a href="${dashboardUrl}" style="color: #16a34a; text-decoration: none;">Dashboard</a></li>
        <li style="margin-bottom: 12px;"><strong>Explore our features:</strong> <a href="${servicesUrl}" style="color: #16a34a; text-decoration: none;">Services</a></li>
        <li style="margin-bottom: 12px;"><strong>Get help or support:</strong> <a href="${contactUrl}" style="color: #16a34a; text-decoration: none;">Contact</a></li>
      </ul>
      
      <div class="info-box" style="margin-top: 32px;">
        <h4 style="margin-top: 0; margin-bottom: 12px; font-weight: 600;">Useful Links:</h4>
        <ul style="list-style: none; padding-left: 0; margin: 0;">
          <li style="margin-bottom: 8px;"><a href="${faqsUrl}" style="color: #16a34a; text-decoration: none;">FAQs</a></li>
          <li style="margin-bottom: 8px;"><a href="${aboutUrl}" style="color: #16a34a; text-decoration: none;">About Us</a></li>
        </ul>
      </div>

      <div class="info-box" style="margin-top: 24px; background-color: #eef2ff; border-left-color: #4f46e5;">
        <h4 style="margin-top: 0; margin-bottom: 12px; font-weight: 600; color: #3730a3;">Useful Documents:</h4>
        <ul style="list-style: none; padding-left: 0; margin: 0; font-size: 14px;">
          <li style="margin-bottom: 6px;"><a href="${websiteUrl}/docs/Ecoharvest Light Paper_2025.pdf" style="color: #4f46e5; text-decoration: none;">Ecoharvest Lightpaper 2025</a></li>
          <li style="margin-bottom: 6px;"><a href="${websiteUrl}/docs/Ecotoken.pdf" style="color: #4f46e5; text-decoration: none;">Ecotoken</a></li>
          <li style="margin-bottom: 6px;"><a href="${websiteUrl}/docs/Ecoharvest-Business-Plan_2025.pdf" style="color: #4f46e5; text-decoration: none;">Ecoharvest Business Plan 2025</a></li>
          <li style="margin-bottom: 6px;"><a href="${websiteUrl}/docs/Articles%20of%20Incorporation%20ecoharvest.pdf" style="color: #4f46e5; text-decoration: none;">Articles of Incorporation</a></li>
          <li style="margin-bottom: 6px;"><a href="${websiteUrl}/docs/Certificate%20of%20Incorporation%20ecoharvest.pdf" style="color: #4f46e5; text-decoration: none;">Certificate of Incorporation</a></li>
          <li style="margin-bottom: 6px;"><a href="${websiteUrl}/docs/ecoharvest-II-reg.pdf" style="color: #4f46e5; text-decoration: none;">LLC Registration</a></li>
          <li style="margin-bottom: 6px;"><a href="${websiteUrl}/docs/Certificate%20of%20Formation%20-%20Domestic%20Limited%20Liability%20Company%20ECOHARVEST%20Limited%20Liability%20Company.pdf" style="color: #4f46e5; text-decoration: none;">LLC Formation</a></li>
          <li style="margin-bottom: 6px;"><a href="${websiteUrl}/docs/ecoharvest-usa-Acord%20certificate%20of%20insurance.pdf" style="color: #4f46e5; text-decoration: none;">Liability Insurance</a></li>
          <li style="margin-bottom: 6px;"><a href="${websiteUrl}/docs/ecoharvest-ein.pdf" style="color: #4f46e5; text-decoration: none;">Ecoharvest EIN</a></li>
          <li style="margin-bottom: 6px;"><a href="${websiteUrl}/docs/ON%20-%20Initial%20Return%20ecoharvest.pdf" style="color: #4f46e5; text-decoration: none;">Initial Return</a></li>
          <li style="margin-bottom: 6px;"><a href="${websiteUrl}/docs/ON%20-%20Extra%20Provincial%20Registration%20ecoharvest.pdf" style="color: #4f46e5; text-decoration: none;">Extra Provincial Registration</a></li>
          <li><a href="${websiteUrl}/docs/Information%20Sheet%20ecoharvest.pdf" style="color: #4f46e5; text-decoration: none;">Corporation Information Sheet</a></li>
        </ul>
      </div>
      
      <p style="margin-top: 32px;">If you have any questions or need assistance, don't hesitate to reach out to our support team at <a href="mailto:${supportEmail}" style="color: #16a34a; text-decoration: none;">${supportEmail}</a> or visit our <a href="${contactUrl}" style="color: #16a34a; text-decoration: none;">contact page</a>.</p>
      
      <p>Thank you for choosing EcoHarvest. We're excited to have you on board!</p>
      
      <p style="margin-top: 24px;">Best regards,<br>The EcoHarvest Team</p>
      
      <p style="font-size: 14px; color: #64748b;">
        <a href="https://wa.me/+447904016379" style="color: #64748b; text-decoration: none;">WhatsApp</a> | 
        <a href="${websiteUrl}" style="color: #64748b; text-decoration: none;">Website</a>
      </p>
    </div>
    `;

    const html = this.getBaseTemplate(content);
    return { text, html };
  }
}

// Export a singleton instance
export const mailService = new MailService();
