// AlphaQ Gaming - Gmail SMTP Diagnostic Tester
// Usage: node test-email.js [recipient_email]

require("dotenv").config();
const nodemailer = require("nodemailer");

async function main() {
  const host = (process.env.SMTP_HOST || process.env.EMAIL_HOST || "smtp.gmail.com").trim();
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
  const user = (process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
  const rawPass = (process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || "").trim();
  const pass = rawPass.replace(/["'\s]/g, "");
  const fromName = (process.env.SMTP_FROM_NAME || "AlphaQ Gaming").trim();

  const recipient = process.argv[2] || user || "vishnuvardhan26112002@gmail.com";
  const from = `"${fromName}" <${user || "vishnuvardhan26112002@gmail.com"}>`;

  console.log("=================================================");
  console.log("       AlphaQ Gmail SMTP Diagnostic Tester       ");
  console.log("=================================================");
  console.log(`Service:  Gmail SMTP`);
  console.log(`Host:     ${host}`);
  console.log(`Port:     ${port} (STARTTLS: ${port === 587}, SSL: ${port === 465})`);
  console.log(`User:     ${user || "(NOT SET)"}`);
  console.log(`Password: ${pass ? "******** (Configured)" : "(NOT SET)"}`);
  console.log(`From:     ${from}`);
  console.log(`To:       ${recipient}`);
  console.log("-------------------------------------------------");

  if (!user || !pass || pass.includes("PASTE_") || pass.includes("YOUR_") || pass.includes("<GMAIL_APP_PASSWORD>")) {
    console.error("❌ ERROR: SMTP_USER or SMTP_PASSWORD is not set or contains placeholder.");
    console.error("   Please ensure SMTP_USER and SMTP_PASSWORD (Google App Password) are set in .env");
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      minVersion: "TLSv1.2",
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  console.log("Verifying connection & credentials with Gmail SMTP server...");
  try {
    await transporter.verify();
    console.log("✅ SUCCESS: Gmail SMTP connection & credentials verified!");
  } catch (err) {
    console.error("❌ SMTP VERIFICATION FAILED:", err.message);
    process.exit(1);
  }

  console.log(`\nSending test email from ${from} to ${recipient}...`);
  try {
    const info = await transporter.sendMail({
      from,
      to: recipient,
      subject: "AlphaQ Gaming - SMTP Verification Test",
      text: "Hello! This is a test email sent using Gmail SMTP (port 587) for AlphaQ Gaming.",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #090a0f; color: #f3f4f6; border-radius: 12px; max-width: 560px;">
          <h2 style="color: #38bdf8; margin-top: 0;">ALPHAQ GAMING</h2>
          <p style="color: #94a3b8;">Email service is working via <strong>Gmail SMTP (port 587)</strong>!</p>
          <div style="background-color: #11131f; border: 1px dashed #38bdf8; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
            <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #38bdf8;">TEST-OK</span>
          </div>
          <p style="color: #64748b; font-size: 13px;">Host: ${host} | Port: ${port} | To: ${recipient}</p>
        </div>
      `,
    });
    console.log("🎉 EMAIL SENT SUCCESSFULLY!");
    console.log(`Message ID: ${info.messageId}`);
    console.log("Response:  ", info.response);
  } catch (sendErr) {
    console.error("❌ SEND FAILED:", sendErr.message);
    process.exit(1);
  }
}

main();
