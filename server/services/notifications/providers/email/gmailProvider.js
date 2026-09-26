// AlphaQ Gaming — Gmail / SMTP Email Provider using Nodemailer

const nodemailer = require("nodemailer");
const BaseEmailProvider = require("./baseEmailProvider");

class GmailProvider extends BaseEmailProvider {
  constructor() {
    super("gmail");
    this._transporter = null;
  }

  getConfig() {
    const host = process.env.SMTP_HOST || process.env.EMAIL_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
    const user = (process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
    const pass = (process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD || process.env.SMTP_APP_PASSWORD || "").trim();
    const secure = process.env.EMAIL_SECURE === "true" || port === 465;
    const fromName = process.env.SMTP_FROM_NAME || "AlphaQ Gaming";
    const from = process.env.EMAIL_FROM || (user ? `"${fromName}" <${user}>` : `"${fromName}" <no-reply@alphaq.gg>`);

    return {
      host,
      port,
      secure,
      user,
      pass,
      from,
    };
  }

  isConfigured() {
    const cfg = this.getConfig();
    return Boolean(cfg.user && cfg.pass);
  }

  getTransporter() {
    const cfg = this.getConfig();
    if (!this.isConfigured()) {
      throw new Error(
        "Gmail / SMTP is not configured. Please set SMTP_USER and SMTP_PASSWORD / SMTP_APP_PASSWORD in environment variables."
      );
    }

    if (!this._transporter) {
      this._transporter = nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure,
        auth: {
          user: cfg.user,
          pass: cfg.pass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
    }

    return this._transporter;
  }

  async sendEmail({ to, subject, text, html }) {
    const cfg = this.getConfig();
    const transporter = this.getTransporter();

    const mailOptions = {
      from: cfg.from,
      to,
      subject,
      text: text || undefined,
      html: html || undefined,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Gmail/SMTP] Email dispatched to ${to} (Message ID: ${info.messageId})`);

    return {
      success: true,
      provider: "gmail",
      messageId: info.messageId,
      mocked: false,
    };
  }
}

module.exports = GmailProvider;
