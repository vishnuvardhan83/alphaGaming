// AlphaQ Gaming — Reusable Email Service
// Sends OTP emails through EmailJS HTTPS API.
// Login OTP and Reset Password OTP use the same EmailJS template.

const verifyEmailTemplate = require("./templates/verifyEmail");
const forgotPasswordTemplate = require("./templates/forgotPassword");
const bookingNotificationTemplate = require("./templates/bookingNotification");
const welcomeUserTemplate = require("./templates/welcomeUser");

const EMAILJS_API_URL = "https://api.emailjs.com/api/v1.0/email/send";

function getEmailJsConfig() {
  const serviceId = (process.env.EMAILJS_SERVICE_ID || "").trim();
  const templateId = (process.env.EMAILJS_TEMPLATE_ID || "").trim();
  const publicKey = (process.env.EMAILJS_PUBLIC_KEY || "").trim();
  const privateKey = (process.env.EMAILJS_PRIVATE_KEY || "").trim();

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    return null;
  }

  return {
    serviceId,
    templateId,
    publicKey,
    privateKey,
  };
}

function getAdminEmail() {
  return process.env.ADMIN_EMAIL || "";
}

/**
 * Sends an email through EmailJS.
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
}) {
  const config = getEmailJsConfig();

  if (!config) {
    console.log("\n=======================================================");
    console.log("[EMAIL SERVICE - DEV/MOCK MODE (EmailJS not configured)]");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log("-------------------------------------------------------");
    console.log(text || html);
    console.log("=======================================================\n");

    return {
      messageId: `mock-${Date.now()}`,
      mocked: true,
    };
  }

  try {
    const response = await fetch(EMAILJS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service_id: config.serviceId,
        template_id: config.templateId,
        user_id: config.publicKey,
        accessToken: config.privateKey,


        template_params: {
          to_email: to,
          name,
          title,
          message,
          passcode,
          time,
        },
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(
        `EmailJS request failed (${response.status}): ${responseText}`
      );
    }

    console.log(`[EmailJS] Sent to ${to}`);

    return {
      messageId: `emailjs-${Date.now()}`,
      mocked: false,
    };
  } catch (err) {
    console.error(
      `[EmailJS Error] Failed sending to ${to}:`,
      err.message
    );

    throw err;
  }
}

/**
 * User registration email verification with OTP.
 */
async function sendVerificationEmail({
  email,
  name,
  otp,
  expiryMinutes = 5,
}) {
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
    message:
      "Use the verification code below to securely continue with your AlphaQ Gaming account.",
    passcode: otp,
    time: `${expiryMinutes} minutes`,
  });
}

/**
 * Forgot password verification with OTP.
 */
async function sendForgotPasswordEmail({
  email,
  name,
  otp,
  expiryMinutes = 5,
}) {
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
    message:
      "Use the verification code below to reset your AlphaQ Gaming password.",
    passcode: otp,
    time: `${expiryMinutes} minutes`,
  });
}

/**
 * Admin notification when a booking is created.
 *
 * This remains available but is not using the OTP template.
 * We will handle the booking template separately.
 */
async function sendBookingAdminNotification({ booking, user }) {
  const adminEmail = getAdminEmail();

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
 * Admin creates a new user:
 * sends welcome email with verification OTP.
 */
async function sendWelcomeUserEmail({
  email,
  name,
  otp,
  role = "customer",
  expiryMinutes = 5,
}) {
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
    message:
      "Use the verification code below to securely activate your AlphaQ Gaming account.",
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
