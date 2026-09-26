// AlphaQ Gaming — Base Email Provider Interface

class BaseEmailProvider {
  constructor(name) {
    this.name = name;
  }

  async sendEmail({ to, subject, text, html }) {
    throw new Error(`sendEmail not implemented on ${this.name}`);
  }

  isConfigured() {
    return false;
  }
}

module.exports = BaseEmailProvider;
