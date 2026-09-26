// AlphaQ Gaming — Mock Email Provider (Dev/Testing/Offline fallback)

const BaseEmailProvider = require("./baseEmailProvider");

class MockEmailProvider extends BaseEmailProvider {
  constructor() {
    super("mock");
  }

  isConfigured() {
    return true;
  }

  async sendEmail({ to, subject, text, html }) {
    const timestamp = Date.now();
    const id = `mock-email-${timestamp}`;

    console.log("\n=======================================================");
    console.log("[EMAIL SERVICE — SAFE DEV/MOCK DISPATCH]");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log("-------------------------------------------------------");
    console.log(text || html || "(No message body)");
    console.log("=======================================================\n");

    return {
      success: true,
      provider: "mock",
      messageId: id,
      mocked: true,
    };
  }
}

module.exports = MockEmailProvider;
