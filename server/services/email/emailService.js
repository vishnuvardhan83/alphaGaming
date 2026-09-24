// AlphaQ Gaming — Reusable Email Service
// Sends emails using Nodemailer with SMTP configuration from environment variables.
// In dev or when SMTP is not configured, provides a mock fallback that logs to console.

const dns = require("dns");
if (dns.setDefaultResultOrder) {
  try {
    dns.setDefaultResultOrder("ipv4first");
  } catch (e) {}
}

const nodemailer = require("nodemailer");
const verifyEmailTemplate = require("./templates/verifyEmail");
const forgotPasswordTemplate = require("./templates/forgotPassword");
const bookingNotificationTemplate = require("./templates/bookingNotification");
const welcomeUserTemplate = require("./templates/welcomeUser");

let transporter = null;
let isConfigured = false;

function createTransportConfig(port = 465) {
  const host = (process.env.EMAIL_HOST || "smtp.gmail.com").trim();
  const user = (process.env.EMAIL_USER || "").trim();
  const rawPass = (process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || "").trim();
  const pass = rawPass.replace(/\s+/g, "");

  if (!user || !pass) return null;

  const is465 = port === 465;
  return nodemailer.createTransport({
    host: host.includes("gmail") ? "smtp.gmail.com" : host,
    port,
    secure: is465, // true for 465 (SSL direct), false for 587 (STARTTLS)
    family: 4, // Force IPv4 to prevent IPv6 DNS timeout in cloud containers & local networks
    lookup: (hostname, options, callback) => {
      dns.lookup(hostname, { family: 4 }, callback);
    },
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

function getTransporter() {
  if (transporter) return transporter;

  const user = (process.env.EMAIL_USER || "").trim();
  const rawPass = (process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || "").trim();
  const pass = rawPass.replace(/\s+/g, "");

  if (user && pass) {
    isConfigured = true;
    const defaultPort = Number(process.env.EMAIL_PORT) === 587 ? 587 : 465;
    transporter = createTransportConfig(defaultPort);
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
 * Automatically tries port 465 (SSL) and falls back to port 587 (TLS) if a timeout occurs.
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

  const startTime = Date.now();
  console.log(`[Email Service] Dispatching email to ${to} (Subject: "${subject}")...`);

  try {
    const info = await mailer.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    console.log(`[Email Service] ✓ Sent to ${to} in ${Date.now() - startTime}ms (ID: ${info.messageId})`);
    return info;
  } catch (err) {
    console.warn(`[Email Service Warning] Primary send to ${to} failed (${err.message}). Retrying on alternate port...`);
    transporter = null; // Invalidate broken transporter socket

    // Alternate port retry (if tried 465 -> try 587; if tried 587 -> try 465)
    try {
      const fallbackPort = Number(process.env.EMAIL_PORT) === 587 ? 465 : 587;
      const fallbackMailer = createTransportConfig(fallbackPort);
      if (fallbackMailer) {
        const fallbackInfo = await fallbackMailer.sendMail({
          from,
          to,
          subject,
          text,
          html,
        });
        console.log(`[Email Service] ✓ Fallback send (port ${fallbackPort}) to ${to} succeeded in ${Date.now() - startTime}ms (ID: ${fallbackInfo.messageId})`);
        transporter = fallbackMailer;
        return fallbackInfo;
      }
    } catch (fallbackErr) {
      console.error(`[Email Service Error] Both SMTP ports failed sending to ${to}:`, fallbackErr.message);
      transporter = null;
      throw fallbackErr;
    }

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
