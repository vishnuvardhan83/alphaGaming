const nodemailer = require("nodemailer");
const verifyEmailTemplate = require("./templates/verifyEmail");
const forgotPasswordTemplate = require("./templates/forgotPassword");
const bookingNotificationTemplate = require("./templates/bookingNotification");
const welcomeUserTemplate = require("./templates/welcomeUser");

function getSmtpConfig() {
  const host = (process.env.SMTP_HOST || process.env.EMAIL_HOST || "smtp.gmail.com").trim();
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
  const user = (process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
  const rawPass = (process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || "").trim();
  const pass = rawPass.replace(/["'\s]/g, "");
  const fromName = (process.env.SMTP_FROM_NAME || "AlphaQ Gaming").trim();

  return { host, port, user, pass, fromName };
}

function createTransporter() {
  const { host, port, user, pass } = getSmtpConfig();

  if (!user || !pass || pass.includes("PASTE_") || pass.includes("YOUR_") || pass.includes("<GMAIL_APP_PASSWORD>")) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      minVersion: "TLSv1.2",
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

function getFromAddress() {
  const { user, fromName } = getSmtpConfig();
  if (user && user.includes("@")) {
    return `"${fromName}" <${user}>`;
  }
  return `"${fromName}" <vishnuvardhan26112002@gmail.com>`;
}

function getAdminEmail() {
  return (
    process.env.ADMIN_EMAIL ||
    process.env.SMTP_USER ||
    process.env.EMAIL_USER ||
    "vishnuvardhan26112002@gmail.com"
  );
}

/**
 * Sends an email through Gmail SMTP using Nodemailer.
 */
async function sendEmail({ to, subject, text, html }) {
  const from = getFromAddress();
  const { host, port, user, pass } = getSmtpConfig();

  if (!user || !pass || pass.includes("PASTE_") || pass.includes("YOUR_") || pass.includes("<GMAIL_APP_PASSWORD>")) {
    console.log("\n=======================================================");
    console.log("[EMAIL SERVICE - DEV/MOCK MODE (Gmail SMTP password not configured)]");
    console.log(`Provider: Gmail SMTP (${host}:${port})`);
    console.log(`To:       ${to}`);
    console.log(`From:     ${from}`);
    console.log(`Subject:  ${subject}`);
    console.log("-------------------------------------------------------");
    console.log(text || html);
    console.log("=======================================================\n");
    return { messageId: `mock-${Date.now()}`, mocked: true };
  }

  const transporter = createTransporter();
  if (!transporter) {
    throw new Error("SMTP transporter could not be initialized");
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    console.log(`[Email Service] ✓ Email sent to ${to} via Gmail SMTP (ID: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error("Failed to send email:", error.message);
    throw new Error("Unable to send email");
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
  createTransporter,
  getSmtpConfig,
};
