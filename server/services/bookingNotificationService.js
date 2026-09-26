// AlphaQ Gaming — Booking Notification Service
// Triggers the Section 25.9 Notification Decision Flow asynchronously after a booking commits.

const { handleBookingCreated } = require("./notifications/notificationService");

async function notifyAdminNewBooking({ booking, user }) {
  try {
    await handleBookingCreated({ booking, user });
  } catch (err) {
    // Log error cleanly: booking remains 100% successful even if notification provider is temporarily unavailable
    console.error(
      `[Booking Notification Flow Error] Failed processing notifications for booking #${booking?.id}:`,
      err.message,
    );
  }
}

module.exports = {
  notifyAdminNewBooking,
};
