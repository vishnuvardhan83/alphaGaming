// AlphaQ Gaming — Reusable Email Service
// Sends emails using Nodemailer with SMTP configuration from environment variables.
// In dev or when SMTP is not configured, provides a mock fallback that logs to console.

const nodemailer = require("nodemailer");
const verifyEmailTemplate = require("./templates/verifyEmail");
const forgotPasswordTemplate = require("./templates/forgotPassword");
const bookingNotificationTemplate = require("./templates/bookingNotification");
const welcomeUserTemplate = require("./templates/welcomeUser");

let transporter = null;
let isConfigured = false;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const rawPass = process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.trim() : "";
  const pass = rawPass.replace(/\s+/g, "");
  const port = Number(process.env.EMAIL_PORT || 587);
  const secure =
    String(process.env.EMAIL_SECURE).toLowerCase() === "true" || port === 465;

  if (host && user && pass) {
    isConfigured = true;
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      // Timeout settings to avoid hanging requests if SMTP provider is unreachable
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  } else {
    isConfigured = false;
  }

  return transporter;
}

function getFromAddress() {
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  if (process.env.EMAIL_USER) return `"AlphaQ Gaming" <${process.env.EMAIL_USER}>`;
  if (process.env.ADMIN_EMAIL) return `"AlphaQ Gaming" <${process.env.ADMIN_EMAIL}>`;
  return '"AlphaQ Gaming" <noreply@alphaqgaming.com>';
}

function getAdminEmail() {
  return (
    process.env.ADMIN_EMAIL ||
    process.env.EMAIL_USER ||
    ""
  );
}

/**
 * Sends a generic email through configured SMTP or logs in dev.
 */
async function sendEmail({ to, subject, text, html }) {
  const mailer = getTransporter();
  const from = getFromAddress();

  if (!mailer || !isConfigured) {
    console.log("\n=======================================================");
    console.log("[EMAIL SERVICE - DEV/MOCK MODE (SMTP not configured)]");
    console.log(`To:      ${to}`);
    console.log(`From:    ${from}`);
    console.log(`Subject: ${subject}`);
    console.log("-------------------------------------------------------");
    console.log(text || html);
    console.log("=======================================================\n");
    return { messageId: `mock-${Date.now()}`, mocked: true };
  }

  try {
    const info = await mailer.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    console.log(`[Email Service] Sent to ${to} (ID: ${info.messageId})`);
    return info;
  } catch (err) {
    console.error(`[Email Service Error] Failed sending to ${to}:`, err.message);
    throw err;
  }
}

/**
 * User registration email verification with OTP.
 */
async function sendVerificationEmail({ email, name, otp, expiryMinutes = 5 }) {
  const tpl = verifyEmailTemplate({ name, otp, expiryMinutes });
  return sendEmail({
    to: email,
    subject: tpl.subject,
    text: tpl.text,
    html: tpl.html,
  });
}

/**
 * Forgot password verification with OTP.
 */
async function sendForgotPasswordEmail({ email, name, otp, expiryMinutes = 5 }) {
  const tpl = forgotPasswordTemplate({ name, otp, expiryMinutes });
  return sendEmail({
    to: email,
    subject: tpl.subject,
    text: tpl.text,
    html: tpl.html,
  });
}

/**
 * Admin notification when a booking is created.
 */
async function sendBookingAdminNotification({ booking, user }) {
  const adminEmail = getAdminEmail();
  const tpl = bookingNotificationTemplate({ booking, user });
  return sendEmail({
    to: adminEmail,
    subject: tpl.subject,
    text: tpl.text,
    html: tpl.html,
  });
}

/**
 * Admin creates a new user: sends welcome email with verification OTP.
 */
async function sendWelcomeUserEmail({ email, name, otp, role = "customer", expiryMinutes = 5 }) {
  const tpl = welcomeUserTemplate({ name, otp, role, expiryMinutes });
  return sendEmail({
    to: email,
    subject: tpl.subject,
    text: tpl.text,
    html: tpl.html,
  });
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendForgotPasswordEmail,
  sendBookingAdminNotification,
  sendWelcomeUserEmail,
  getAdminEmail,
};
