// AlphaQ Gaming — Migration 003: Rewards Redeem Options & Promotional Offers
// Creates reward_options and offers tables, and seeds initial catalog items.

module.exports = {
  id: "003_rewards_and_offers",
  async up(db) {
    if (db.kind === "sqlite") {
      // 1. Reward Options table (SQLite)
      await db.exec(`
        CREATE TABLE IF NOT EXISTS reward_options (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          points_cost INTEGER NOT NULL DEFAULT 50,
          reward_type TEXT NOT NULL DEFAULT 'discount_voucher',
          discount_amount INTEGER NOT NULL DEFAULT 0,
          badge TEXT NOT NULL DEFAULT '',
          icon TEXT NOT NULL DEFAULT 'gift',
          active INTEGER NOT NULL DEFAULT 1,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_reward_options_active ON reward_options(active, sort_order);
      `);

      // 2. Promotional Offers table (SQLite)
      await db.exec(`
        CREATE TABLE IF NOT EXISTS offers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          code TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          discount_type TEXT NOT NULL DEFAULT 'percentage',
          discount_value INTEGER NOT NULL DEFAULT 20,
          min_hours INTEGER NOT NULL DEFAULT 1,
          applicable_platform TEXT NOT NULL DEFAULT 'all',
          valid_until TEXT NOT NULL DEFAULT 'Ongoing',
          badge TEXT NOT NULL DEFAULT '',
          active INTEGER NOT NULL DEFAULT 1,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_offers_code ON offers(code);
        CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(active);
      `);
    } else {
      // 1. Reward Options table (MySQL)
      await db.exec(`
        CREATE TABLE IF NOT EXISTS reward_options (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description VARCHAR(500) NOT NULL DEFAULT '',
          points_cost INT NOT NULL DEFAULT 50,
          reward_type VARCHAR(50) NOT NULL DEFAULT 'discount_voucher',
          discount_amount INT NOT NULL DEFAULT 0,
          badge VARCHAR(50) NOT NULL DEFAULT '',
          icon VARCHAR(50) NOT NULL DEFAULT 'gift',
          active TINYINT NOT NULL DEFAULT 1,
          sort_order INT NOT NULL DEFAULT 0,
          created_at BIGINT NOT NULL,
          INDEX idx_reward_options_active (active, sort_order)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // 2. Promotional Offers table (MySQL)
      await db.exec(`
        CREATE TABLE IF NOT EXISTS offers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          code VARCHAR(50) NOT NULL,
          description VARCHAR(500) NOT NULL DEFAULT '',
          discount_type VARCHAR(50) NOT NULL DEFAULT 'percentage',
          discount_value INT NOT NULL DEFAULT 20,
          min_hours INT NOT NULL DEFAULT 1,
          applicable_platform VARCHAR(50) NOT NULL DEFAULT 'all',
          valid_until VARCHAR(50) NOT NULL DEFAULT 'Ongoing',
          badge VARCHAR(50) NOT NULL DEFAULT '',
          active TINYINT NOT NULL DEFAULT 1,
          created_at BIGINT NOT NULL,
          INDEX idx_offers_code (code),
          INDEX idx_offers_active (active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    }

    // Seed initial Reward Options if table is empty
    const existingOptions = await db.all("SELECT COUNT(*) AS c FROM reward_options");
    const countOpt = Number(existingOptions[0]?.c || 0);
    if (countOpt === 0) {
      const now = Date.now();
      const defaultOptions = [
        {
          title: "₹50 Café Voucher",
          description: "Get ₹50 flat discount on snacks, energy drinks & coffee at our arena café.",
          points_cost: 50,
          reward_type: "cafe_discount",
          discount_amount: 50,
          badge: "Café Perk",
          icon: "coffee",
          sort_order: 1,
        },
        {
          title: "1 Free Gaming Hour",
          description: "Redeem 1 free hour on any PC or Console gaming station.",
          points_cost: 100,
          reward_type: "gaming_hour",
          discount_amount: 100,
          badge: "Most Popular",
          icon: "clock",
          sort_order: 2,
        },
        {
          title: "₹100 Booking Voucher",
          description: "Instant ₹100 discount coupon applicable on any station booking.",
          points_cost: 150,
          reward_type: "booking_discount",
          discount_amount: 100,
          badge: "Save ₹100",
          icon: "tag",
          sort_order: 3,
        },
        {
          title: "VIP Tournament Pass",
          description: "Free VIP tournament registration pass for any upcoming esports event.",
          points_cost: 200,
          reward_type: "vip_pass",
          discount_amount: 250,
          badge: "VIP Elite",
          icon: "crown",
          sort_order: 4,
        },
        {
          title: "Gamer Snack & Drink Combo",
          description: "Enjoy a free combo of Red Bull / Cold Beverage + premium snack.",
          points_cost: 80,
          reward_type: "snack_combo",
          discount_amount: 80,
          badge: "Combo Deal",
          icon: "sparkles",
          sort_order: 5,
        },
      ];

      for (const opt of defaultOptions) {
        await db.run(
          `INSERT INTO reward_options (title, description, points_cost, reward_type, discount_amount, badge, icon, active, sort_order, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
          [
            opt.title,
            opt.description,
            opt.points_cost,
            opt.reward_type,
            opt.discount_amount,
            opt.badge,
            opt.icon,
            opt.sort_order,
            now,
          ],
        );
      }
    }

    // Seed initial Offers if table is empty
    const existingOffers = await db.all("SELECT COUNT(*) AS c FROM offers");
    const countOffers = Number(existingOffers[0]?.c || 0);
    if (countOffers === 0) {
      const now = Date.now();
      const defaultOffers = [
        {
          title: "Happy Hours 25% Off",
          code: "HAPPY25",
          description: "Play during weekdays (12 PM – 5 PM) and get 25% off all hourly station bookings.",
          discount_type: "percentage",
          discount_value: 25,
          min_hours: 1,
          applicable_platform: "all",
          valid_until: "Ongoing",
          badge: "Weekday Special",
        },
        {
          title: "Buy 2 Hours Get 1 Free",
          code: "PLAYMORE",
          description: "Book 3 or more continuous hours and get 1 free hour discount (₹100 flat off).",
          discount_type: "flat",
          discount_value: 100,
          min_hours: 3,
          applicable_platform: "pc",
          valid_until: "Ongoing",
          badge: "Best Value",
        },
        {
          title: "Night Owl All-Nighter",
          code: "NIGHTOWL",
          description: "Midnight gaming marathon from 11 PM to 6 AM with 30% off station rate + café discount.",
          discount_type: "percentage",
          discount_value: 30,
          min_hours: 4,
          applicable_platform: "all",
          valid_until: "Ongoing",
          badge: "Midnight Pass",
        },
        {
          title: "5v5 Esports Squad Discount",
          code: "SQUAD5",
          description: "Full team 5-seat LAN booking gets instant 20% discount on team matches.",
          discount_type: "percentage",
          discount_value: 20,
          min_hours: 2,
          applicable_platform: "pc",
          valid_until: "Ongoing",
          badge: "Esports Squad",
        },
        {
          title: "PS5 4K Couch Co-op Deal",
          code: "PS5PRO",
          description: "Grab your squad for PS5 FIFA/Tekken sessions. Flat ₹50 off 2+ hours reservation.",
          discount_type: "flat",
          discount_value: 50,
          min_hours: 2,
          applicable_platform: "ps5",
          valid_until: "Ongoing",
          badge: "Console Promo",
        },
      ];

      for (const off of defaultOffers) {
        await db.run(
          `INSERT INTO offers (title, code, description, discount_type, discount_value, min_hours, applicable_platform, valid_until, badge, active, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
          [
            off.title,
            off.code,
            off.description,
            off.discount_type,
            off.discount_value,
            off.min_hours,
            off.applicable_platform,
            off.valid_until,
            off.badge,
            now,
          ],
        );
      }
    }
  },
};
