// AlphaQ Gaming — EmailJS Email Provider

const BaseEmailProvider = require("./baseEmailProvider");

const EMAILJS_API_URL = "https://api.emailjs.com/api/v1.0/email/send";

class EmailJsProvider extends BaseEmailProvider {
  constructor() {
    super("emailjs");
  }

  getConfig() {
    const serviceId = (process.env.EMAILJS_SERVICE_ID || "").trim();
    const templateId = (process.env.EMAILJS_TEMPLATE_ID || "").trim();
    const publicKey = (process.env.EMAILJS_PUBLIC_KEY || "").trim();
    const privateKey = (process.env.EMAILJS_PRIVATE_KEY || "").trim();

    return {
      serviceId,
      templateId,
      publicKey,
      privateKey,
    };
  }

  isConfigured() {
    const cfg = this.getConfig();
    return Boolean(cfg.serviceId && cfg.templateId && cfg.publicKey && cfg.privateKey);
  }

  async sendEmail({ to, subject, text, html, name = "", title = "", message = "", passcode = "", time = "" }) {
    if (!this.isConfigured()) {
      throw new Error(
        "EmailJS is not configured. Please set EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, and EMAILJS_PRIVATE_KEY."
      );
    }

    const cfg = this.getConfig();

    const response = await fetch(EMAILJS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service_id: cfg.serviceId,
        template_id: cfg.templateId,
        user_id: cfg.publicKey,
        accessToken: cfg.privateKey,
        template_params: {
          to_email: to,
          name: name || "Customer",
          title: title || subject,
          message: message || text || "",
          passcode: passcode || "",
          time: time || "",
        },
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`EmailJS request failed (${response.status}): ${responseText}`);
    }

    console.log(`[EmailJS] Sent to ${to}`);

    return {
      success: true,
      provider: "emailjs",
      messageId: `emailjs-${Date.now()}`,
      mocked: false,
    };
  }
}

module.exports = EmailJsProvider;
