// AlphaQ Gaming — Email Template: Admin Booking Notification

function bookingNotificationTemplate({ booking, user }) {
  const customerName = (user && user.name) || "Customer";
  const customerEmail = (user && user.email) || "Not provided";
  const customerPhone = booking.phone || (user && user.phone) || "Not provided";
  const bookingId = String(booking.id || "");
  const platform = String(booking.platform || "").toUpperCase();
  const date = String(booking.date || "");
  const slot = String(booking.slot || "");
  const duration = String(booking.duration_label || booking.durationLabel || "");
  const price = Number(booking.price || 0);
  const players = Number(booking.players || 1);
  const status = String(booking.status || "awaiting_payment");
  const createdAtFormatted = booking.created_at || booking.createdAt
    ? new Date(Number(booking.created_at || booking.createdAt)).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : new Date().toLocaleString();

  const text = `New Booking Received!

Booking ID: #${bookingId}
Created At: ${createdAtFormatted}
Status: ${status}

Customer Details:
Name: ${customerName}
Email: ${customerEmail}
Phone: +${customerPhone}

Booking Details:
Platform: ${platform}
Date: ${date}
Time Slot: ${slot}
Duration: ${duration}
Players: ${players}
Amount: ₹${price}

Please log in to the admin dashboard to review or approve the payment.`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Booking #${bookingId} — AlphaQ Gaming</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #090a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #090a0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #11131f; border: 1px solid #1f2438; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0e111d 0%, #151a2e 100%); padding: 28px 32px; border-bottom: 1px solid #1f2438;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px; color: #10b981;">⚡ NEW BOOKING RECEIVED</h1>
                    <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">Booking ID: <strong style="color: #ffffff;">#${bookingId}</strong></p>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: #064e3b; color: #34d399; font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 20px; text-transform: uppercase;">${status}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 28px 32px;">
              <!-- Customer Section -->
              <h3 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; color: #38bdf8;">Customer Info</h3>
              <table width="100%" border="0" cellspacing="0" cellpadding="8" style="background-color: #0c0e18; border-radius: 10px; margin-bottom: 24px; font-size: 14px;">
                <tr>
                  <td width="35%" style="color: #94a3b8; border-bottom: 1px solid #1a1e2e;">Name</td>
                  <td style="color: #ffffff; font-weight: 600; border-bottom: 1px solid #1a1e2e;">${customerName}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; border-bottom: 1px solid #1a1e2e;">Email</td>
                  <td style="color: #ffffff; border-bottom: 1px solid #1a1e2e;">${customerEmail}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8;">Phone</td>
                  <td style="color: #ffffff; font-weight: 600;">+${customerPhone}</td>
                </tr>
              </table>

              <!-- Booking Section -->
              <h3 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; color: #38bdf8;">Booking Info</h3>
              <table width="100%" border="0" cellspacing="0" cellpadding="8" style="background-color: #0c0e18; border-radius: 10px; margin-bottom: 24px; font-size: 14px;">
                <tr>
                  <td width="35%" style="color: #94a3b8; border-bottom: 1px solid #1a1e2e;">Platform / Setup</td>
                  <td style="color: #ffffff; font-weight: 700; border-bottom: 1px solid #1a1e2e;">${platform}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; border-bottom: 1px solid #1a1e2e;">Date</td>
                  <td style="color: #ffffff; border-bottom: 1px solid #1a1e2e;">${date}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; border-bottom: 1px solid #1a1e2e;">Time Slot</td>
                  <td style="color: #ffffff; border-bottom: 1px solid #1a1e2e;">${slot}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; border-bottom: 1px solid #1a1e2e;">Duration</td>
                  <td style="color: #ffffff; border-bottom: 1px solid #1a1e2e;">${duration}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; border-bottom: 1px solid #1a1e2e;">Players</td>
                  <td style="color: #ffffff; border-bottom: 1px solid #1a1e2e;">${players}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8;">Total Amount</td>
                  <td style="color: #10b981; font-size: 16px; font-weight: 800;">₹${price}</td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 12px; color: #64748b;">
                Received on: ${createdAtFormatted}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0b0d16; padding: 18px 32px; text-align: center; border-top: 1px solid #1a1e2e;">
              <p style="margin: 0; font-size: 12px; color: #475569;">
                AlphaQ Gaming Notification Service · Automated alert
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
    subject: `[AlphaQ] New Booking #${bookingId} - ${customerName} (${platform})`,
    text,
    html,
  };
}

module.exports = bookingNotificationTemplate;
