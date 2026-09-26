// AlphaQ Gaming — Notification Settings Service
// Manages non-sensitive notification configuration stored in the database
// while strictly guarding provider secrets in server-side environment variables.

const { getSetting, setSetting } = require("../../db");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SUPPORTED_EMAIL_PROVIDERS = ["gmail", "smtp", "emailjs", "resend", "mock"];
const SUPPORTED_SMS_PROVIDERS = ["msg91", "twilio", "sns", "mock"];

function maskSecret(val) {
  if (!val) return "";
  return "••••••••••••";
}

function maskEmail(email) {
  if (!email || typeof email !== "string") return "";
  const parts = email.split("@");
  if (parts.length !== 2) return "••••••••••••";
  const user = parts[0];
  const domain = parts[1];
  if (user.length <= 3) {
    return `${user.charAt(0)}***@${domain}`;
  }
  return `${user.slice(0, 2)}***@${domain}`;
}

function getSafeEnvDefaults() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@example.com").trim().toLowerCase();
  const rawPhones = process.env.ADMIN_PHONES || "9573976462";
  const adminPhone = rawPhones.split(",")[0].trim();

  // Determine active provider hints from env
  let defaultEmailProvider = "gmail";
  if (process.env.EMAILJS_SERVICE_ID) {
    defaultEmailProvider = "emailjs";
  }

  const defaultSmsProvider = (process.env.SMS_PROVIDER || "msg91").trim().toLowerCase();

  return {
    email_enabled: true,
    sms_enabled: false, // Disabled: user does not have SMS API key; email only
    customer_email_otp_enabled: true,
    customer_sms_otp_enabled: false,
    booking_email_enabled: true,
    booking_sms_enabled: false,
    admin_booking_email_enabled: true,
    admin_booking_sms_enabled: false,
    admin_email: adminEmail,
    admin_phone: adminPhone.startsWith("+") ? adminPhone : `+91${adminPhone.replace(/^91/, "")}`,
    email_provider: defaultEmailProvider,
    sms_provider: "disabled",
    sms_mode: "disabled_email_only",
    otp_length: Number(process.env.OTP_LENGTH || 6),
    otp_expiry_minutes: Number(process.env.OTP_EXPIRY_MINUTES || 5),
    otp_max_attempts: Number(process.env.OTP_MAX_ATTEMPTS || 5),
    resend_cooldown_seconds: Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60),
  };
}

/**
 * Returns the non-sensitive notification settings merged with database overrides.
 */
async function getNotificationSettings() {
  const defaults = getSafeEnvDefaults();

  const [
    emailEnabledVal,
    smsEnabledVal,
    custEmailOtpVal,
    custSmsOtpVal,
    bookingEmailVal,
    bookingSmsVal,
    adminBookingEmailVal,
    adminBookingSmsVal,
    adminEmailVal,
    adminPhoneVal,
    emailProviderVal,
    smsProviderVal,
    otpLengthVal,
    otpExpiryVal,
    otpMaxAttemptsVal,
    resendCooldownVal,
  ] = await Promise.all([
    getSetting("notif_email_enabled", ""),
    getSetting("notif_sms_enabled", ""),
    getSetting("notif_customer_email_otp_enabled", ""),
    getSetting("notif_customer_sms_otp_enabled", ""),
    getSetting("notif_booking_email_enabled", ""),
    getSetting("notif_booking_sms_enabled", ""),
    getSetting("notif_admin_booking_email_enabled", ""),
    getSetting("notif_admin_booking_sms_enabled", ""),
    getSetting("notif_admin_email", ""),
    getSetting("notif_admin_phone", ""),
    getSetting("notif_email_provider", ""),
    getSetting("notif_sms_provider", ""),
    getSetting("notif_otp_length", ""),
    getSetting("notif_otp_expiry_minutes", ""),
    getSetting("notif_otp_max_attempts", ""),
    getSetting("notif_resend_cooldown_seconds", ""),
  ]);

  const parseBool = (val, fallback) => {
    if (val === "true" || val === "1") return true;
    if (val === "false" || val === "0") return false;
    return fallback;
  };

  const parseNum = (val, fallback, min, max) => {
    if (!val) return fallback;
    const n = Number(val);
    if (Number.isNaN(n) || n < min || n > max) return fallback;
    return n;
  };

  return {
    email_enabled: parseBool(emailEnabledVal, defaults.email_enabled),
    sms_enabled: parseBool(smsEnabledVal, false), // Default disabled (email only)
    customer_email_otp_enabled: parseBool(custEmailOtpVal, defaults.customer_email_otp_enabled),
    customer_sms_otp_enabled: parseBool(custSmsOtpVal, false), // Default disabled
    booking_email_enabled: parseBool(bookingEmailVal, defaults.booking_email_enabled),
    booking_sms_enabled: parseBool(bookingSmsVal, false), // Default disabled
    admin_booking_email_enabled: parseBool(adminBookingEmailVal, defaults.admin_booking_email_enabled),
    admin_booking_sms_enabled: parseBool(adminBookingSmsVal, false), // Default disabled
    admin_email: adminEmailVal ? adminEmailVal.trim().toLowerCase() : defaults.admin_email,
    admin_phone: adminPhoneVal ? adminPhoneVal.trim() : defaults.admin_phone,
    email_provider: emailProviderVal || defaults.email_provider,
    sms_provider: smsProviderVal || "disabled",
    sms_mode: "disabled_email_only",
    otp_length: parseNum(otpLengthVal, defaults.otp_length, 4, 10),
    otp_expiry_minutes: parseNum(otpExpiryVal, defaults.otp_expiry_minutes, 1, 60),
    otp_max_attempts: parseNum(otpMaxAttemptsVal, defaults.otp_max_attempts, 1, 10),
    resend_cooldown_seconds: parseNum(resendCooldownVal, defaults.resend_cooldown_seconds, 10, 300),
  };
}

/**
 * Validates and updates notification settings in the database.
 * NEVER writes secrets to database.
 */
async function updateNotificationSettings(input = {}) {
  const current = await getNotificationSettings();
  const updates = {};

  if (input.email_enabled !== undefined) {
    const val = Boolean(input.email_enabled);
    updates.notif_email_enabled = String(val);
  }

  if (input.sms_enabled !== undefined) {
    const val = Boolean(input.sms_enabled);
    updates.notif_sms_enabled = String(val);
  }

  if (input.customer_email_otp_enabled !== undefined) {
    const val = Boolean(input.customer_email_otp_enabled);
    updates.notif_customer_email_otp_enabled = String(val);
  }

  if (input.customer_sms_otp_enabled !== undefined) {
    const val = Boolean(input.customer_sms_otp_enabled);
    updates.notif_customer_sms_otp_enabled = String(val);
  }

  if (input.booking_email_enabled !== undefined) {
    const val = Boolean(input.booking_email_enabled);
    updates.notif_booking_email_enabled = String(val);
  }

  if (input.booking_sms_enabled !== undefined) {
    const val = Boolean(input.booking_sms_enabled);
    updates.notif_booking_sms_enabled = String(val);
  }

  if (input.admin_booking_email_enabled !== undefined) {
    const val = Boolean(input.admin_booking_email_enabled);
    updates.notif_admin_booking_email_enabled = String(val);
  }

  if (input.admin_booking_sms_enabled !== undefined) {
    const val = Boolean(input.admin_booking_sms_enabled);
    updates.notif_admin_booking_sms_enabled = String(val);
  }

  if (input.admin_email !== undefined) {
    const email = String(input.admin_email || "").trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      throw new Error("Invalid admin email address format.");
    }
    updates.notif_admin_email = email;
  }

  if (input.admin_phone !== undefined) {
    const phone = String(input.admin_phone || "").trim();
    if (phone.length < 8) {
      throw new Error("Admin phone number must be at least 8 digits.");
    }
    updates.notif_admin_phone = phone;
  }

  if (input.email_provider !== undefined) {
    const prov = String(input.email_provider).toLowerCase().trim();
    if (!SUPPORTED_EMAIL_PROVIDERS.includes(prov)) {
      throw new Error(`Unsupported email provider: ${prov}. Supported: ${SUPPORTED_EMAIL_PROVIDERS.join(", ")}`);
    }
    updates.notif_email_provider = prov;
  }

  if (input.sms_provider !== undefined) {
    const prov = String(input.sms_provider).toLowerCase().trim();
    if (!SUPPORTED_SMS_PROVIDERS.includes(prov)) {
      throw new Error(`Unsupported SMS provider: ${prov}. Supported: ${SUPPORTED_SMS_PROVIDERS.join(", ")}`);
    }
    updates.notif_sms_provider = prov;
  }

  if (input.otp_length !== undefined) {
    const n = Number(input.otp_length);
    if (!Number.isInteger(n) || n < 4 || n > 10) {
      throw new Error("OTP length must be an integer between 4 and 10.");
    }
    updates.notif_otp_length = String(n);
  }

  if (input.otp_expiry_minutes !== undefined) {
    const n = Number(input.otp_expiry_minutes);
    if (!Number.isInteger(n) || n < 1 || n > 60) {
      throw new Error("OTP expiry must be between 1 and 60 minutes.");
    }
    updates.notif_otp_expiry_minutes = String(n);
  }

  if (input.otp_max_attempts !== undefined) {
    const n = Number(input.otp_max_attempts);
    if (!Number.isInteger(n) || n < 1 || n > 10) {
      throw new Error("Maximum OTP attempts must be between 1 and 10.");
    }
    updates.notif_otp_max_attempts = String(n);
  }

  if (input.resend_cooldown_seconds !== undefined) {
    const n = Number(input.resend_cooldown_seconds);
    if (!Number.isInteger(n) || n < 10 || n > 300) {
      throw new Error("Resend cooldown must be between 10 and 300 seconds.");
    }
    updates.notif_resend_cooldown_seconds = String(n);
  }

  for (const [k, v] of Object.entries(updates)) {
    await setSetting(k, v);
  }

  return getNotificationSettings();
}

/**
 * Returns safe server-side provider status and masked credential metadata.
 * CRITICAL: NEVER returns actual passwords, API keys, or tokens.
 */
function getProviderSecretStatus() {
  // Check SMTP / Gmail credentials
  const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || "";
  const smtpPass = process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD || process.env.SMTP_APP_PASSWORD || "";
  const hasSmtpSecret = Boolean(smtpPass && smtpPass.trim().length > 0);

  // Check EmailJS credentials
  const emailJsServiceId = (process.env.EMAILJS_SERVICE_ID || "").trim();
  const hasEmailJs = Boolean(
    emailJsServiceId &&
    process.env.EMAILJS_TEMPLATE_ID &&
    process.env.EMAILJS_PUBLIC_KEY &&
    process.env.EMAILJS_PRIVATE_KEY
  );

  // Check MSG91 credentials
  const msg91AuthKey = process.env.MSG91_AUTH_KEY || process.env.SMS_API_KEY || "";
  const msg91SenderId = process.env.MSG91_SENDER_ID || process.env.SMS_SENDER_ID || "ALPHAQ";
  const hasMsg91Secret = Boolean(msg91AuthKey && msg91AuthKey.trim().length > 0);

  // Check Twilio credentials
  const twilioSid = process.env.TWILIO_ACCOUNT_SID || process.env.SMS_API_KEY || "";
  const twilioToken = process.env.TWILIO_AUTH_TOKEN || process.env.SMS_AUTH_TOKEN || "";
  const twilioFrom = process.env.TWILIO_FROM_NUMBER || process.env.SMS_SENDER_ID || "";
  const hasTwilioSecret = Boolean(twilioSid && twilioToken);

  // Check AWS SNS credentials
  const hasAwsSns = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

  return {
    email: {
      smtp: {
        configured: hasSmtpSecret,
        masked: true,
        host: smtpHost,
        port: smtpPort,
        user: maskEmail(smtpUser),
        secretMasked: hasSmtpSecret ? maskSecret(smtpPass) : "",
      },
      emailjs: {
        configured: hasEmailJs,
        masked: true,
        serviceId: emailJsServiceId ? `${emailJsServiceId.slice(0, 3)}***` : "",
        secretMasked: hasEmailJs ? "••••••••••••" : "",
      },
    },
    sms: {
      msg91: {
        configured: hasMsg91Secret,
        masked: true,
        senderId: msg91SenderId,
        secretMasked: hasMsg91Secret ? maskSecret(msg91AuthKey) : "",
      },
      twilio: {
        configured: hasTwilioSecret,
        masked: true,
        fromNumber: twilioFrom ? `${twilioFrom.slice(0, 4)}***` : "",
        secretMasked: hasTwilioSecret ? "••••••••••••" : "",
      },
      sns: {
        configured: hasAwsSns,
        masked: true,
        secretMasked: hasAwsSns ? "••••••••••••" : "",
      },
    },
    renderConfigNotice: "Provider credentials are securely loaded from backend environment variables (Render / Host). They are never sent to the browser or stored in the database.",
  };
}

module.exports = {
  getNotificationSettings,
  updateNotificationSettings,
  getProviderSecretStatus,
  SUPPORTED_EMAIL_PROVIDERS,
  SUPPORTED_SMS_PROVIDERS,
};
