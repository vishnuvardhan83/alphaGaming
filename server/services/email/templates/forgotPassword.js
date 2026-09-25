// AlphaQ Gaming — Email Template: Forgot Password OTP

function forgotPasswordTemplate({ name, otp, expiryMinutes = 5 }) {
  const safeName = name ? String(name).trim() : "Gamer";
  const safeOtp = String(otp).trim();

  const text = `Hello ${safeName},

We received a request to reset your AlphaQ Gaming account password.

Your password reset code is: ${safeOtp}

This code expires in ${expiryMinutes} minutes.

If you did not request a password reset, please ignore this email or contact support if you suspect unauthorized activity.

Best regards,
The AlphaQ Gaming Team`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset your password — AlphaQ Gaming</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #090a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #090a0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="560" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #11131f; border: 1px solid #1f2438; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0e111d 0%, #151a2e 100%); padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #1f2438;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 2px; color: #f43f5e;">ALPHAQ GAMING</h1>
              <p style="margin: 6px 0 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 3px; color: #94a3b8;">Password Reset Request</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 32px 24px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #e2e8f0;">Hello <strong style="color: #ffffff;">${safeName}</strong>,</p>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 22px; color: #94a3b8;">
                We received a request to reset your AlphaQ Gaming account password. Enter the 6-digit code below to set your new password.
              </p>

              <!-- OTP Box -->
              <div style="background-color: #0c0e18; border: 1px dashed #f43f5e; border-radius: 12px; padding: 24px; text-align: center; margin: 28px 0;">
                <span style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #f43f5e; margin-bottom: 8px;">Password Reset Code</span>
                <span style="display: inline-block; font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #ffffff;">${safeOtp}</span>
                <span style="display: block; font-size: 12px; color: #f59e0b; margin-top: 10px;">⏱ This code expires in ${expiryMinutes} minutes</span>
              </div>

              <div style="background-color: #171a29; border-left: 4px solid #f43f5e; padding: 14px 16px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; line-height: 18px; color: #cbd5e1;">
                  If you didn't ask to reset your password, you can safely ignore this email. Your current password remains secure.
                </p>
              </div>

              <p style="margin: 16px 0 0; font-size: 13px; line-height: 20px; color: #64748b;">
                Never share this verification code with anyone.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #0b0d16; padding: 20px 32px; text-align: center; border-top: 1px solid #1a1e2e;">
              <p style="margin: 0; font-size: 12px; color: #475569;">
                &copy; ${new Date().getFullYear()} AlphaQ Gaming Arena. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject: `${safeOtp} is your AlphaQ password reset code`,
    text,
    html,
  };
}

module.exports = forgotPasswordTemplate;
