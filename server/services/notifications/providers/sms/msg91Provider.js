// AlphaQ Gaming — MSG91 SMS Provider

const BaseSmsProvider = require("./baseSmsProvider");

class Msg91Provider extends BaseSmsProvider {
  constructor() {
    super("msg91");
  }

  getConfig() {
    const authKey = (process.env.MSG91_AUTH_KEY || process.env.SMS_API_KEY || "").trim();
    const senderId = (process.env.MSG91_SENDER_ID || process.env.SMS_SENDER_ID || "ALPHAQ").trim();
    const templateId = (process.env.MSG91_TEMPLATE_ID || "").trim();

    return {
      authKey,
      senderId,
      templateId,
    };
  }

  isConfigured() {
    const cfg = this.getConfig();
    return Boolean(cfg.authKey);
  }

  async sendSms({ to, message, otp, templateId }) {
    if (!this.isConfigured()) {
      throw new Error(
        "MSG91 is not configured. Please set MSG91_AUTH_KEY (or SMS_API_KEY) in environment variables."
      );
    }

    const cfg = this.getConfig();
    const cleanPhone = String(to || "").replace(/\D/g, "");
    const activeTemplate = templateId || cfg.templateId;

    // MSG91 Flow API
    const response = await fetch("https://control.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: cfg.authKey,
      },
      body: JSON.stringify({
        template_id: activeTemplate || "default_flow",
        sender: cfg.senderId,
        short_url: "0",
        mobiles: cleanPhone,
        var1: message || "",
        otp: otp || "",
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`MSG91 dispatch failed (${response.status}): ${responseText}`);
    }

    console.log(`[MSG91] SMS successfully dispatched to ${cleanPhone}`);

    return {
      success: true,
      provider: "msg91",
      messageId: `msg91-${Date.now()}`,
      mocked: false,
    };
  }
}

module.exports = Msg91Provider;
