// AlphaQ Gaming — Mock SMS Provider (Dev/Testing fallback)

const BaseSmsProvider = require("./baseSmsProvider");

class MockSmsProvider extends BaseSmsProvider {
  constructor() {
    super("mock");
  }

  isConfigured() {
    return true;
  }

  async sendSms({ to, message, otp }) {
    const timestamp = Date.now();
    const id = `mock-sms-${timestamp}`;

    console.log("\n=======================================================");
    console.log("[SMS SERVICE — SAFE DEV/MOCK DISPATCH]");
    console.log(`To:      ${to}`);
    if (otp) console.log(`OTP:     ${otp}`);
    console.log("-------------------------------------------------------");
    console.log(message || "(No message body)");
    console.log("=======================================================\n");

    return {
      success: true,
      provider: "mock",
      messageId: id,
      mocked: true,
    };
  }
}

module.exports = MockSmsProvider;
