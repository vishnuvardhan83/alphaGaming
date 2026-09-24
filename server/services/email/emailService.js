const dns = require("dns").promises;
const nodemailer = require("nodemailer");
const verifyEmailTemplate = require("./templates/verifyEmail");
const forgotPasswordTemplate = require("./templates/forgotPassword");
const bookingNotificationTemplate = require("./templates/bookingNotification");
const welcomeUserTemplate = require("./templates/welcomeUser");

async function resolveIpv4Host(host) {
  try {
    const ips = await dns.resolve4(host);
    if (ips && ips.length > 0) return ips[0];
  } catch (err) {
    console.warn(`[Email DNS Warning] Failed resolving IPv4 for ${host}: ${err.message}. Using hostname.`);
  }
  return host;
}

async function createTransportConfig(port = 465) {
  const rawHost = (process.env.EMAIL_HOST || "smtp.gmail.com").trim();
  const domainHost = rawHost.includes("gmail") ? "smtp.gmail.com" : rawHost;
  const user = (process.env.EMAIL_USER || "").trim();
  const rawPass = (process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || "").trim();
  const pass = rawPass.replace(/\s+/g, "");

  if (!user || !pass) return null;

  const hostIp = await resolveIpv4Host(domainHost);
  const is465 = port === 465;

  return nodemailer.createTransport({
    host: hostIp,
    port,
    secure: is465, // true for 465 (SSL direct), false for 587 (STARTTLS)
    auth: {
      user,
      pass,
    },
    tls: {
      servername: domainHost, // Matches SSL certificate with original hostname
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
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
 * Binds directly to IPv4 to prevent ENETUNREACH in cloud container networks without IPv6 routes.
 */
async function sendEmail({ to, subject, text, html }) {
  const from = getFromAddress();
  const startTime = Date.now();

  // 1. If RESEND_API_KEY is configured, send over HTTPS Port 443 (completely bypasses cloud SMTP port blocks)
  if (process.env.RESEND_API_KEY) {
    try {
      console.log(`[Email Service] Dispatching to ${to} via Resend HTTPS API (Subject: "${subject}")...`);
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || process.env.EMAIL_FROM || "AlphaQ Gaming <onboarding@resend.dev>",
          to: [to],
          subject,
          html: html || text,
          text,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || JSON.stringify(resData));
      }

      console.log(`[Email Service] ✓ Sent via Resend HTTPS to ${to} in ${Date.now() - startTime}ms (ID: ${resData.id})`);
      return { messageId: resData.id };
    } catch (resendErr) {
      console.error(`[Email Service Resend Error]:`, resendErr.message);
      console.warn(`[Email Service Warning] Falling back to direct SMTP...`);
    }
  }

  const user = (process.env.EMAIL_USER || "").trim();
  const rawPass = (process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || "").trim();

  if (!user || !rawPass) {
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

  console.log(`[Email Service] Dispatching email to ${to} via SMTP (Subject: "${subject}")...`);

  // Attempt Port 465 (Direct SSL IPv4)
  try {
    const mailer465 = await createTransportConfig(465);
    const info = await mailer465.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    console.log(`[Email Service] ✓ Sent to ${to} via Port 465 in ${Date.now() - startTime}ms (ID: ${info.messageId})`);
    return info;
  } catch (err465) {
    console.warn(`[Email Service Warning] Port 465 send to ${to} failed (${err465.message}). Retrying on Port 587...`);

    // Fallback to Port 587 (STARTTLS IPv4)
    try {
      const mailer587 = await createTransportConfig(587);
      const fallbackInfo = await mailer587.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      console.log(`[Email Service] ✓ Fallback send (Port 587) to ${to} succeeded in ${Date.now() - startTime}ms (ID: ${fallbackInfo.messageId})`);
      return fallbackInfo;
    } catch (fallbackErr) {
      console.error(`[Email Service Error] Both SMTP ports (465 & 587) failed sending to ${to}:`, fallbackErr.message);
      console.warn(`[Cloud Notice] If hosted on Railway, outbound SMTP ports 25, 465, and 587 are blocked platform-wide to prevent spam. Set RESEND_API_KEY in Railway to send via HTTPS Port 443.`);
      throw fallbackErr;
    }
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
