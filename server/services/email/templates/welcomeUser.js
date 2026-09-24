// AlphaQ Gaming — Email Template: Admin Created New User Welcome & Verification OTP

function welcomeUserTemplate({ name, otp, role = "customer", expiryMinutes = 5 }) {
  const safeName = name ? String(name).trim() : "Gamer";
  const safeOtp = String(otp).trim();
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  const text = `Welcome to AlphaQ Gaming!

Hello ${safeName},

An account (${roleLabel}) has been created for you by an administrator at AlphaQ Gaming.

Your email verification code is: ${safeOtp}

This code expires in ${expiryMinutes} minutes.

To protect your security, passwords are never sent via email. If you need to set or update your password, use the "Forgot Password" feature on the sign-in page.

If you did not expect this account, please contact the administrator.

Best regards,
The AlphaQ Gaming Team`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to AlphaQ Gaming</title>
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
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 2px; color: #38bdf8;">ALPHAQ GAMING</h1>
              <p style="margin: 6px 0 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 3px; color: #94a3b8;">Account Created</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 32px 24px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #e2e8f0;">Welcome <strong style="color: #ffffff;">${safeName}</strong>!</p>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 22px; color: #94a3b8;">
                An account with <strong>${roleLabel}</strong> access has been created for you by an administrator at AlphaQ Gaming.
              </p>

              <!-- OTP Box -->
              <div style="background-color: #0c0e18; border: 1px dashed #38bdf8; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                <span style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #38bdf8; margin-bottom: 8px;">Your Email Verification Code</span>
                <span style="display: inline-block; font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #ffffff;">${safeOtp}</span>
                <span style="display: block; font-size: 12px; color: #f59e0b; margin-top: 10px;">⏱ This code expires in ${expiryMinutes} minutes</span>
              </div>

              <div style="background-color: #171a29; border-left: 4px solid #38bdf8; padding: 14px 16px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; line-height: 18px; color: #cbd5e1;">
                  For security, initial passwords are not transmitted in emails. If you need to set your password, click "Forgot Password" on the login screen.
                </p>
              </div>

              <p style="margin: 16px 0 0; font-size: 13px; line-height: 20px; color: #64748b;">
                If you did not expect this account, please contact the administrator.
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
    subject: `Welcome to AlphaQ Gaming — Your verification code is ${safeOtp}`,
    text,
    html,
  };
}

module.exports = welcomeUserTemplate;
