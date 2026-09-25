// AlphaQ Gaming — Booking Notification Service
// Sends email alert to configured ADMIN_EMAIL asynchronously after booking commits.

const { sendBookingAdminNotification } = require("./email/emailService");

async function notifyAdminNewBooking({ booking, user }) {
  try {
    await sendBookingAdminNotification({ booking, user });
  } catch (err) {
    // Log error cleanly: booking remains 100% successful even if email provider is temporarily unavailable
    console.error(
      `[Admin Booking Notification Error] Failed to send email for booking #${booking.id}:`,
      err.message,
    );
  }
}

module.exports = {
  notifyAdminNewBooking,
};
