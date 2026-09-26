// AlphaQ Gaming — Base SMS Provider Interface

class BaseSmsProvider {
  constructor(name) {
    this.name = name;
  }

  async sendSms({ to, message, otp, templateId }) {
    throw new Error(`sendSms not implemented on ${this.name}`);
  }

  isConfigured() {
    return false;
  }
}

module.exports = BaseSmsProvider;
