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

function isResendMode() {
  const host = (process.env.EMAIL_HOST || "").toLowerCase();
  const user = (process.env.EMAIL_USER || "").toLowerCase();
  const pass = (process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || process.env.RESEND_API_KEY || "").trim();
  const service = (process.env.EMAIL_SERVICE || "").toLowerCase();

  return (
    service === "resend" ||
    service === "resend_smtp" ||
    host.includes("resend") ||
    user === "resend" ||
    pass.startsWith("re_") ||
    Boolean(process.env.RESEND_API_KEY && (!process.env.EMAIL_HOST || process.env.EMAIL_HOST.includes("resend")))
  );
}

async function createTransportConfig(portOverride = null) {
  const isResend = isResendMode();

  let domainHost;
  let user;
  let pass;

  if (isResend) {
    domainHost = "smtp.resend.com";
    user = "resend";
    const rawPass = (process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || process.env.RESEND_API_KEY || "").trim();
    pass = rawPass.replace(/["'\s]/g, "");
  } else {
    const rawHost = (process.env.EMAIL_HOST || "smtp.gmail.com").trim();
    domainHost = rawHost.includes("gmail") ? "smtp.gmail.com" : rawHost;
    user = (process.env.EMAIL_USER || process.env.ADMIN_EMAIL || "v9347976462@gmail.com").trim();
    const rawPass = (process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || "").trim();
    pass = rawPass.replace(/["'\s]/g, "");
  }

  if (!user || !pass) return null;

  const defaultPort = isResend ? 465 : (parseInt(process.env.EMAIL_PORT, 10) || 465);
  const port = portOverride || parseInt(process.env.EMAIL_PORT, 10) || defaultPort;
  const isSecure = port === 465 || port === 2465 || process.env.EMAIL_SECURE === "true";

  const hostIp = await resolveIpv4Host(domainHost);

  return nodemailer.createTransport({
    host: hostIp,
    port,
    secure: isSecure,
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

function createGmailServiceTransport() {
  const user = (process.env.EMAIL_USER || process.env.ADMIN_EMAIL || "v9347976462@gmail.com").trim();
  const rawPass = (process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || "").trim();
  const pass = rawPass.replace(/["'\s]/g, "");

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
  });
}

function getFromAddress() {
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  if (process.env.RESEND_FROM) return process.env.RESEND_FROM;

  const isResend = isResendMode();
  if (isResend) {
    return '"AlphaQ Gaming" <onboarding@resend.dev>';
  }

  const user = (process.env.EMAIL_USER || process.env.ADMIN_EMAIL || "v9347976462@gmail.com").trim();
  if (user && user.includes("@") && user.toLowerCase() !== "resend") {
    return `"AlphaQ Gaming" <${user}>`;
  }
  return '"AlphaQ Gaming" <v9347976462@gmail.com>';
}

function getAdminEmail() {
  return (
    process.env.ADMIN_EMAIL ||
    (process.env.EMAIL_USER && process.env.EMAIL_USER.toLowerCase() !== "resend" ? process.env.EMAIL_USER : "") ||
    "v9347976462@gmail.com"
  );
}

/**
 * Sends an email through configured SMTP (Resend SMTP or Gmail SMTP) with automatic port failover.
 */
async function sendEmail({ to, subject, text, html }) {
  const from = getFromAddress();
  const startTime = Date.now();
  const isResend = isResendMode();

  const user = isResend ? "resend" : (process.env.EMAIL_USER || process.env.ADMIN_EMAIL || "v9347976462@gmail.com").trim();
  const rawPass = (process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || process.env.RESEND_API_KEY || "").trim();
  const pass = rawPass.replace(/["'\s]/g, "");

  if (!user || !pass || pass.includes("PASTE_") || pass.includes("YOUR_")) {
    console.log("\n=======================================================");
    console.log("[EMAIL SERVICE - DEV/MOCK MODE (Password/Key not configured)]");
    console.log(`Provider: ${isResend ? "Resend SMTP (smtp.resend.com)" : `Gmail SMTP (${user})`}`);
    console.log(`To:       ${to}`);
    console.log(`From:     ${from}`);
    console.log(`Subject:  ${subject}`);
    console.log("-------------------------------------------------------");
    console.log(text || html);
    console.log("=======================================================\n");
    return { messageId: `mock-${Date.now()}`, mocked: true };
  }

  const preferredPort = parseInt(process.env.EMAIL_PORT, 10) || 465;
  const fallbackPort = preferredPort === 465 ? 587 : 465;
  const providerLabel = isResend ? "Resend SMTP (smtp.resend.com)" : `Gmail SMTP (${user})`;

  console.log(`[Email Service] Dispatching email to ${to} via ${providerLabel} on Port ${preferredPort}...`);

  // Attempt 1: Preferred Port (Port 465 direct SSL)
  try {
    const mailer = await createTransportConfig(preferredPort);
    const info = await mailer.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    console.log(`[Email Service] ✓ Sent to ${to} via ${providerLabel} (Port ${preferredPort}) in ${Date.now() - startTime}ms (ID: ${info.messageId})`);
    return info;
  } catch (errPrimary) {
    console.warn(`[Email Service Warning] ${providerLabel} Port ${preferredPort} failed (${errPrimary.message}). Retrying on Port ${fallbackPort}...`);

    // Check for Resend free tier recipient restriction
    if (errPrimary.message && errPrimary.message.includes("only send testing emails to your own email address")) {
      console.warn(`\n⚠️  [Resend Free Domain Notice]:`);
      console.warn(`   Resend testing sender (onboarding@resend.dev) can only deliver to your Resend account email (v9347976462@gmail.com).`);
      console.warn(`   To send to any recipient, verify your domain at https://resend.com/domains\n`);
      throw errPrimary;
    }

    // Attempt 2: Fallback to alternate port (Port 587 STARTTLS)
    try {
      const mailerFallback = await createTransportConfig(fallbackPort);
      const fallbackInfo = await mailerFallback.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      console.log(`[Email Service] ✓ Fallback send via ${providerLabel} (Port ${fallbackPort}) to ${to} succeeded in ${Date.now() - startTime}ms (ID: ${fallbackInfo.messageId})`);
      return fallbackInfo;
    } catch (fallbackErr) {
      if (isResend) {
        console.warn(`[Email Service Warning] Resend SMTP ports failed or blocked by cloud network. Attempting Resend HTTPS API (Port 443)...`);
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${pass}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from,
              to: [to],
              subject,
              html: html || text,
              text,
            }),
          });
          const resData = await res.json();
          if (!res.ok) {
            throw new Error(resData.message || JSON.stringify(resData));
          }
          console.log(`[Email Service] ✓ Sent to ${to} via Resend HTTPS fallback in ${Date.now() - startTime}ms (ID: ${resData.id})`);
          return { messageId: resData.id };
        } catch (resendHttpErr) {
          console.error(`[Email Service Resend HTTPS Error]:`, resendHttpErr.message);
          throw resendHttpErr;
        }
      }

      console.error(`[Email Service Error] Both SMTP ports (${preferredPort} & ${fallbackPort}) failed sending to ${to}:`, fallbackErr.message);
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
