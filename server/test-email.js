// AlphaQ Gaming - SMTP Diagnostic Tester (Resend & Gmail)
// Usage: node test-email.js [recipient_email]

require("dotenv").config();
const nodemailer = require("nodemailer");

async function main() {
  const host = (process.env.EMAIL_HOST || "smtp.resend.com").trim();
  const rawKey = (process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || process.env.RESEND_API_KEY || "").trim();
  const pass = rawKey.replace(/["'\s]/g, "");
  const isResend = host.includes("resend") || pass.startsWith("re_");

  const user = isResend ? "resend" : (process.env.EMAIL_USER || process.env.ADMIN_EMAIL || "v9347976462@gmail.com").trim();
  const defaultRecipient = isResend ? (process.env.ADMIN_EMAIL || "v9347976462@gmail.com") : "vishnuvardhan26112002@gmail.com";
  const recipient = process.argv[2] || defaultRecipient;
  const from = isResend ? "AlphaQ Gaming <onboarding@resend.dev>" : (process.env.EMAIL_FROM || `"AlphaQ Gaming" <${user}>`).trim();
  const port = parseInt(process.env.EMAIL_PORT, 10) || 465;

  console.log("=================================================");
  console.log("          SMTP Email Diagnostic Tester           ");
  console.log("=================================================");
  console.log(`Service:  ${isResend ? "Resend SMTP (smtp.resend.com)" : "Gmail SMTP"}`);
  console.log(`Host:     ${host}`);
  console.log(`Port:     ${port} (secure: ${port === 465})`);
  console.log(`User:     ${user}`);
  console.log(`Key:      ${pass ? pass.substring(0, 6) + "..." + pass.slice(-4) : "(NOT SET)"}`);
  console.log(`From:     ${from}`);
  console.log(`To:       ${recipient}`);
  console.log("-------------------------------------------------");

  if (!pass || pass.includes("PASTE_")) {
    console.error("❌ ERROR: EMAIL_PASSWORD is missing or placeholder in server/.env");
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: {
      servername: host,
      rejectUnauthorized: false,
    },
  });

  console.log("Testing connection & credentials with SMTP server...");
  try {
    await transporter.verify();
    console.log("✅ SUCCESS: SMTP server connection & credentials verified!");
  } catch (err) {
    console.error("❌ SMTP VERIFICATION FAILED:", err.message);
    process.exit(1);
  }

  console.log(`\nSending test email from ${from} to ${recipient}...`);
  try {
    const info = await transporter.sendMail({
      from,
      to: recipient,
      subject: "AlphaQ Gaming - Verification Code Test",
      text: "Hello! This is a test email sent using Resend SMTP for AlphaQ Gaming.",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #090a0f; color: #f3f4f6; border-radius: 12px; max-width: 560px;">
          <h2 style="color: #38bdf8; margin-top: 0;">ALPHAQ GAMING</h2>
          <p style="color: #94a3b8;">Email service is working via <strong>Resend SMTP</strong>!</p>
          <div style="background-color: #11131f; border: 1px dashed #38bdf8; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
            <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #38bdf8;">656137</span>
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
    if (sendErr.message && sendErr.message.includes("only send testing emails to your own email address")) {
      console.log("\n💡 Notice: Resend testing domain (onboarding@resend.dev) restricts delivery to your account email (v9347976462@gmail.com).");
      console.log("   To send to any recipient, add a custom domain at https://resend.com/domains");
    }
    process.exit(1);
  }
}

main();
