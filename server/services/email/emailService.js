// AlphaQ Gaming — Reusable Email Service
// Bridges email template generation with the unified NotificationService provider abstraction.

const verifyEmailTemplate = require("./templates/verifyEmail");
const forgotPasswordTemplate = require("./templates/forgotPassword");
const bookingNotificationTemplate = require("./templates/bookingNotification");
const welcomeUserTemplate = require("./templates/welcomeUser");
const { getNotificationSettings } = require("../notifications/notificationSettings");
const { sendEmail: dispatchEmail } = require("../notifications/notificationService");

function getAdminEmail() {
  return process.env.ADMIN_EMAIL || "admin@example.com";
}

/**
 * Sends an email through the active provider in NotificationService.
 */
async function sendEmail({
  to,
  subject,
  text,
  html,
  name = "",
  title = "",
  message = "",
  passcode = "",
  time = "",
  force = false,
}) {
  return dispatchEmail({
    to,
    subject,
    text,
    html,
    force,
  });
}

/**
 * User registration email verification with OTP.
 * Gated by customer_email_otp_enabled in admin settings.
 */
async function sendVerificationEmail({
  email,
  name,
  otp,
  expiryMinutes = 5,
}) {
  const settings = await getNotificationSettings();
  if (!settings.email_enabled || !settings.customer_email_otp_enabled) {
    console.log(`[Email Service] Customer Email OTP is disabled in admin settings. Skipping verification email to ${email}.`);
    return {
      messageId: `skipped-${Date.now()}`,
      mocked: true,
      skipped: true,
    };
  }

  const tpl = verifyEmailTemplate({
    name,
    otp,
    expiryMinutes,
  });

  return sendEmail({
    to: email,
    subject: tpl.subject,
    text: tpl.text,
    html: tpl.html,
    name,
    title: "Verify your account",
    message: "Use the verification code below to securely continue with your AlphaQ Gaming account.",
    passcode: otp,
    time: `${expiryMinutes} minutes`,
  });
}

/**
 * Forgot password verification with OTP.
 * Gated by customer_email_otp_enabled in admin settings.
 */
async function sendForgotPasswordEmail({
  email,
  name,
  otp,
  expiryMinutes = 5,
}) {
  const settings = await getNotificationSettings();
  if (!settings.email_enabled || !settings.customer_email_otp_enabled) {
    console.log(`[Email Service] Customer Email OTP is disabled in admin settings. Skipping reset password email to ${email}.`);
    return {
      messageId: `skipped-${Date.now()}`,
      mocked: true,
      skipped: true,
    };
  }

  const tpl = forgotPasswordTemplate({
    name,
    otp,
    expiryMinutes,
  });

  return sendEmail({
    to: email,
    subject: tpl.subject,
    text: tpl.text,
    html: tpl.html,
    name,
    title: "Reset your password",
    message: "Use the verification code below to reset your AlphaQ Gaming password.",
    passcode: otp,
    time: `${expiryMinutes} minutes`,
  });
}

/**
 * Admin notification when a booking is created.
 */
async function sendBookingAdminNotification({ booking, user }) {
  const settings = await getNotificationSettings();
  const adminEmail = settings.admin_email || getAdminEmail();

  if (!settings.email_enabled || !settings.admin_booking_email_enabled) {
    console.log(`[Email Service] Admin booking email is disabled in settings. Skipping alert for booking #${booking?.id}.`);
    return {
      messageId: `skipped-${Date.now()}`,
      mocked: true,
      skipped: true,
    };
  }

  const tpl = bookingNotificationTemplate({
    booking,
    user,
  });

  return sendEmail({
    to: adminEmail,
    subject: tpl.subject,
    text: tpl.text,
    html: tpl.html,
    name: "Admin",
    title: tpl.subject,
    message: tpl.text,
  });
}

/**
 * Admin creates a new user: sends welcome email with verification OTP.
 */
async function sendWelcomeUserEmail({
  email,
  name,
  otp,
  role = "customer",
  expiryMinutes = 5,
}) {
  const settings = await getNotificationSettings();
  if (!settings.email_enabled) {
    console.log(`[Email Service] Email is disabled in admin settings. Skipping welcome email to ${email}.`);
    return {
      messageId: `skipped-${Date.now()}`,
      mocked: true,
      skipped: true,
    };
  }

  const tpl = welcomeUserTemplate({
    name,
    otp,
    role,
    expiryMinutes,
  });

  return sendEmail({
    to: email,
    subject: tpl.subject,
    text: tpl.text,
    html: tpl.html,
    name,
    title: "Verify your account",
    message: "Use the verification code below to securely activate your AlphaQ Gaming account.",
    passcode: otp,
    time: `${expiryMinutes} minutes`,
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
