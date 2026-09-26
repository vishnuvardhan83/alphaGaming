// AlphaQ Gaming — Unified Notification Service
// Orchestrates notification dispatch with dynamic admin settings, provider abstraction,
// decision flow gating, and safe test actions.

const { getNotificationSettings } = require("./notificationSettings");
const GmailProvider = require("./providers/email/gmailProvider");
const EmailJsProvider = require("./providers/email/emailJsProvider");
const MockEmailProvider = require("./providers/email/mockEmailProvider");

const Msg91Provider = require("./providers/sms/msg91Provider");
const TwilioProvider = require("./providers/sms/twilioProvider");
const MockSmsProvider = require("./providers/sms/mockSmsProvider");

const bookingNotificationTemplate = require("../email/templates/bookingNotification");

// Instantiate provider singletons
const emailProviders = {
  gmail: new GmailProvider(),
  smtp: new GmailProvider(),
  emailjs: new EmailJsProvider(),
  mock: new MockEmailProvider(),
};

const smsProviders = {
  msg91: new Msg91Provider(),
  twilio: new TwilioProvider(),
  mock: new MockSmsProvider(),
};

function getActiveEmailProvider(configuredName) {
  const name = (configuredName || "gmail").toLowerCase().trim();
  const provider = emailProviders[name];
  if (provider && provider.isConfigured()) {
    return provider;
  }
  // If explicitly selected provider is not configured, fallback to another configured one or mock
  if (emailProviders.gmail.isConfigured()) {
    return emailProviders.gmail;
  }
  if (emailProviders.emailjs.isConfigured()) {
    return emailProviders.emailjs;
  }
  return emailProviders.mock;
}

function getActiveSmsProvider(configuredName) {
  const name = (configuredName || "msg91").toLowerCase().trim();
  const provider = smsProviders[name];
  if (provider && provider.isConfigured()) {
    return provider;
  }
  if (smsProviders.msg91.isConfigured()) {
    return smsProviders.msg91;
  }
  if (smsProviders.twilio.isConfigured()) {
    return smsProviders.twilio;
  }
  return smsProviders.mock;
}

/**
 * Sends an email subject to admin settings configuration check.
 */
async function sendEmail({ to, subject, text, html, force = false }) {
  const settings = await getNotificationSettings();

  if (!force && !settings.email_enabled) {
    console.log(`[NotificationService] Email disabled in admin settings. Skipping email to: ${to}`);
    return { skipped: true, reason: "email_disabled", recipient: to };
  }

  const provider = getActiveEmailProvider(settings.email_provider);
  try {
    const res = await provider.sendEmail({ to, subject, text, html });
    return { ...res, recipient: to };
  } catch (err) {
    console.error(`[NotificationService] Failed sending email to ${to} via ${provider.name}:`, err.message);
    throw err;
  }
}

/**
 * Sends an SMS subject to admin settings configuration check.
 * If SMS is disabled (Email-only mode), dispatch is safely skipped.
 */
async function sendSms({ to, message, otp, templateId, force = false }) {
  const settings = await getNotificationSettings();

  if (!force && !settings.sms_enabled) {
    console.log(`[NotificationService] SMS disabled in settings (Email-only mode). Skipping SMS to: ${to}`);
    return { skipped: true, reason: "sms_disabled", recipient: to };
  }

  const provider = getActiveSmsProvider(settings.sms_provider);
  try {
    const res = await provider.sendSms({ to, message, otp, templateId });
    return { ...res, recipient: to };
  } catch (err) {
    console.error(`[NotificationService] Failed sending SMS to ${to} via ${provider.name}:`, err.message);
    throw err;
  }
}

/**
 * Executes Section 25.9 Notification Decision Flow for newly created bookings.
 */
async function handleBookingCreated({ booking, user }) {
  const settings = await getNotificationSettings();
  const results = {
    customerEmail: null,
    customerSms: null,
    adminEmail: null,
    adminSms: null,
  };

  const bookingId = booking.id;
  const platform = String(booking.platform || "").toUpperCase();
  const date = String(booking.date || "");
  const slot = String(booking.slot || "");
  const price = Number(booking.price || 0);

  // 1. Email Branch
  if (settings.email_enabled) {
    // Customer email
    const custEmail = (user && user.email) || "";
    if (settings.booking_email_enabled && custEmail) {
      try {
        const custSubject = `Booking #${bookingId} Confirmed — AlphaQ Gaming`;
        const custText = `Hello ${(user && user.name) || "Gamer"},\n\nYour booking #${bookingId} for ${platform} on ${date} at ${slot} (₹${price}) has been created.\nPlease complete any pending payment verification.\n\nSee you at the Arena!\nAlphaQ Gaming`;
        const custHtml = `<div style="font-family: sans-serif; background: #0f111a; color: #fff; padding: 24px; border-radius: 8px;">
          <h2 style="color: #6366f1;">Booking #${bookingId} Received</h2>
          <p>Hello <strong>${(user && user.name) || "Gamer"}</strong>,</p>
          <p>Your booking for <strong>${platform}</strong> on <strong>${date}</strong> (${slot}) is reserved.</p>
          <p>Amount: <strong>₹${price}</strong></p>
          <p>Thank you for choosing AlphaQ Gaming Arena!</p>
        </div>`;
        results.customerEmail = await sendEmail({
          to: custEmail,
          subject: custSubject,
          text: custText,
          html: custHtml,
        });
      } catch (err) {
        console.error(`[NotificationService] Failed to send customer booking email #${bookingId}:`, err.message);
      }
    }

    // Admin email
    if (settings.admin_booking_email_enabled && settings.admin_email) {
      try {
        const tpl = bookingNotificationTemplate({ booking, user });
        results.adminEmail = await sendEmail({
          to: settings.admin_email,
          subject: tpl.subject,
          text: tpl.text,
          html: tpl.html,
        });
      } catch (err) {
        console.error(`[NotificationService] Failed to send admin booking email #${bookingId}:`, err.message);
      }
    }
  }

  // 2. SMS Branch
  if (settings.sms_enabled) {
    // Customer SMS
    const custPhone = booking.phone || (user && user.phone);
    if (settings.booking_sms_enabled && custPhone) {
      try {
        const smsMsg = `AlphaQ Gaming: Your booking #${bookingId} (${platform} on ${date} @ ${slot}) is received. Amount: Rs.${price}.`;
        results.customerSms = await sendSms({
          to: custPhone,
          message: smsMsg,
        });
      } catch (err) {
        console.error(`[NotificationService] Failed to send customer booking SMS #${bookingId}:`, err.message);
      }
    }

    // Admin SMS
    if (settings.admin_booking_sms_enabled && settings.admin_phone) {
      try {
        const adminSmsMsg = `[AlphaQ Alert] New Booking #${bookingId} received! Platform: ${platform}, Slot: ${slot}, Customer: ${booking.phone || (user && user.phone) || ""}. Amount: Rs.${price}.`;
        results.adminSms = await sendSms({
          to: settings.admin_phone,
          message: adminSmsMsg,
        });
      } catch (err) {
        console.error(`[NotificationService] Failed to send admin booking SMS #${bookingId}:`, err.message);
      }
    }
  }

  return results;
}

/**
 * Admin action: Sends a test email using currently configured provider.
 * Returns safe success/failure response without exposing secrets.
 */
async function sendTestEmail({ to }) {
  const settings = await getNotificationSettings();
  const recipient = (to || settings.admin_email || "").trim().toLowerCase();

  if (!recipient) {
    throw new Error("No recipient email specified and no admin email configured.");
  }

  const provider = getActiveEmailProvider(settings.email_provider);
  const subject = `[Test Notification] AlphaQ Gaming Notification System`;
  const text = `This is a test notification from AlphaQ Gaming Admin Portal.\n\nProvider: ${provider.name.toUpperCase()}\nStatus: Active & Operational\nTimestamp: ${new Date().toISOString()}\n\nNo sensitive secrets were transmitted.`;
  const html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0c0e17; color: #f1f5f9; padding: 32px; border-radius: 12px; border: 1px solid #1e293b; max-width: 500px; margin: 0 auto;">
    <h2 style="color: #6366f1; margin-top: 0;">Test Notification Dispatch</h2>
    <p>This is a safe test email sent from the AlphaQ Gaming Admin Dashboard.</p>
    <div style="background: #181c2f; border-left: 4px solid #6366f1; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 4px 0;"><strong>Active Provider:</strong> ${provider.name.toUpperCase()}</p>
      <p style="margin: 4px 0;"><strong>Recipient:</strong> ${recipient}</p>
      <p style="margin: 4px 0;"><strong>Dispatched At:</strong> ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
    </div>
    <p style="color: #94a3b8; font-size: 13px;">Security note: Provider credentials remain securely hosted on your backend server and are never exposed in the browser.</p>
  </div>`;

  const result = await provider.sendEmail({
    to: recipient,
    subject,
    text,
    html,
  });

  return {
    success: true,
    message: `Test email successfully sent to ${recipient}`,
    provider: provider.name,
    recipient,
    mocked: !!result.mocked,
    messageId: result.messageId,
  };
}

/**
 * Admin action: Sends a test SMS using currently configured provider.
 * Returns safe success/failure response without exposing secrets.
 */
async function sendTestSms({ to }) {
  const settings = await getNotificationSettings();
  if (!settings.sms_enabled) {
    return {
      success: false,
      message: "SMS service is disabled because no SMS API key is configured. AlphaQ Arena operates exclusively on Email notifications.",
      provider: "disabled",
      recipient: to || "N/A",
    };
  }

  const recipient = (to || settings.admin_phone || "").trim();
  const provider = getActiveSmsProvider(settings.sms_provider);
  const message = `[AlphaQ Test] Notification system test SMS via ${provider.name.toUpperCase()} at ${new Date().toLocaleTimeString("en-IN")}. All systems operational.`;

  const result = await provider.sendSms({
    to: recipient,
    message,
    otp: "123456",
  });

  return {
    success: true,
    message: `Test SMS successfully dispatched to ${recipient}`,
    provider: provider.name,
    recipient,
    mocked: !!result.mocked,
    messageId: result.messageId,
  };
}

module.exports = {
  sendEmail,
  sendSms,
  handleBookingCreated,
  sendTestEmail,
  sendTestSms,
  getActiveEmailProvider,
  getActiveSmsProvider,
};
