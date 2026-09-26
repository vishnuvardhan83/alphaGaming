// AlphaQ Gaming — Twilio SMS Provider

const BaseSmsProvider = require("./baseSmsProvider");

class TwilioProvider extends BaseSmsProvider {
  constructor() {
    super("twilio");
  }

  getConfig() {
    const accountSid = (process.env.TWILIO_ACCOUNT_SID || process.env.SMS_API_KEY || "").trim();
    const authToken = (process.env.TWILIO_AUTH_TOKEN || process.env.SMS_AUTH_TOKEN || "").trim();
    const from = (process.env.TWILIO_FROM_NUMBER || process.env.SMS_SENDER_ID || "").trim();

    return {
      accountSid,
      authToken,
      from,
    };
  }

  isConfigured() {
    const cfg = this.getConfig();
    return Boolean(cfg.accountSid && cfg.authToken && cfg.from);
  }

  async sendSms({ to, message }) {
    if (!this.isConfigured()) {
      throw new Error(
        "Twilio is not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER in environment variables."
      );
    }

    const cfg = this.getConfig();
    let formattedTo = String(to || "").trim();
    if (!formattedTo.startsWith("+")) {
      formattedTo = `+${formattedTo.replace(/\D/g, "")}`;
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(cfg.accountSid)}/Messages.json`;
    const basicAuth = Buffer.from(`${cfg.accountSid}:${cfg.authToken}`).toString("base64");

    const params = new URLSearchParams();
    params.append("To", formattedTo);
    params.append("From", cfg.from);
    params.append("Body", message);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(`Twilio dispatch failed (${res.status}): ${data.message || JSON.stringify(data)}`);
    }

    console.log(`[Twilio] SMS dispatched to ${formattedTo} (SID: ${data.sid})`);

    return {
      success: true,
      provider: "twilio",
      messageId: data.sid,
      mocked: false,
    };
  }
}

module.exports = TwilioProvider;
