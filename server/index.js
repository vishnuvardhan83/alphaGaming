require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

// AlphaQ Gaming — Express API (normal login, bookings, UPI approval, food,
// tournaments, reviews, gallery, rewards, admin settings).
// Backed by MySQL (production) or SQLite (fallback) — see db.js.
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const {
  db,
  init,
  now,
  normalizePhone,
  getSetting,
  setSetting,
  allSettings,
  addReward,
  UPLOAD_DIR,
} = require("./db");

const {
  registerUser,
  verifyEmail,
  loginUser,
  resendVerificationOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  adminCreateUser,
  publicUser,
} = require("./services/authService");
const { notifyAdminNewBooking } = require("./services/bookingNotificationService");
const { startPeriodicCleanup } = require("./services/otpService");
const crypto = require("crypto");
const cryptoService = require("./services/cryptoService");
const dbAdminService = require("./services/databaseAdminService");
const railwayService = require("./services/railwayService");
const {
  getNotificationSettings,
  updateNotificationSettings,
  getProviderSecretStatus,
} = require("./services/notifications/notificationSettings");
const {
  sendTestEmail,
  sendTestSms,
} = require("./services/notifications/notificationService");

const JWT_SECRET = process.env.JWT_SECRET || "alphaq-dev-secret-change-me";
const PORT = process.env.PORT || 4000;
const ADMIN_PHONES = (process.env.ADMIN_PHONES || "9573976462")
  .split(",")
  .map(normalizePhone)
  .filter(Boolean);

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

/* --------------------------------------------------------- serializers --- */

const toBooking = (b) => ({
  id: String(b.id),
  userId: String(b.user_id),
  phone: b.phone,
  platform: b.platform,
  date: b.date,
  slot: b.slot,
  durationLabel: b.duration_label,
  price: b.price,
  players: b.players,
  status: b.status,
  upiRef: b.upi_ref || null,
  decisionReason: b.decision_reason || null,
  createdAt: b.created_at,
});

const toGame = (g) => ({
  id: String(g.id),
  title: g.title,
  platform: JSON.parse(g.platform || "[]"),
  tags: JSON.parse(g.tags || "[]"),
  active: !!g.active,
  sortOrder: g.sort_order,
});

const toFood = (f) => ({
  id: String(f.id),
  name: f.name,
  category: f.category,
  price: f.price,
  image: f.image || "",
  active: !!f.active,
  sortOrder: f.sort_order,
});

const toTournament = (t) => ({
  id: String(t.id),
  game: t.game,
  format: t.format,
  date: t.date,
  prize: t.prize,
  status: t.status,
  description: t.description,
  capacity: Number(t.capacity || 0),
  registeredCount: Number(t.registered_count || t.registeredCount || 0),
  createdAt: t.created_at,
});

const toReview = (r) => ({
  id: String(r.id),
  name: r.name,
  handle: r.handle || "",
  rating: r.rating,
  body: r.body,
  verified: !!r.verified,
  approved: !!r.approved,
  createdAt: r.created_at,
});

const toGallery = (g) => ({
  id: String(g.id),
  url: g.url,
  caption: g.caption,
  sortOrder: g.sort_order,
});

const toFoodOrder = (o) => ({
  id: String(o.id),
  userId: String(o.user_id),
  phone: o.phone,
  bookingId: String(o.booking_id),
  setupLabel: o.setup_label,
  items: JSON.parse(o.items || "[]"),
  total: o.total,
  payWith: o.pay_with,
  status: o.status,
  createdAt: o.created_at,
});

/* ------------------------------------------------------------- auth mw --- */

function auth(required = true) {
  return async (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      if (required) return res.status(401).json({ error: "Sign in required." });
      return next();
    }
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const u = await db.get("SELECT * FROM users WHERE id = ?", [payload.id]);
      if (!u) return res.status(401).json({ error: "Session expired." });
      if (u.blocked) return res.status(403).json({ error: "Your account has been suspended. Please contact AlphaQ staff." });
      if (u.email && !u.email_verified && u.role !== "admin") {
        return res.status(403).json({
          error: "Please verify your email address to access your account.",
          requiresVerification: true,
          email: u.email,
        });
      }
      req.user = u;
      next();
    } catch {
      if (required) return res.status(401).json({ error: "Invalid session." });
      next();
    }
  };
}

function admin(req, res, next) {
  if (!req.user || req.user.role !== "admin")
    return res.status(403).json({ error: "Admins only." });
  next();
}

const adminOnly = [auth(), admin];

const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message || "Request failed." });
  }
};

function sign(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "30d" });
}

/* --------------------------------------------------------------- auth ---- */

app.post(
  "/api/auth/register",
  wrap(async (req, res) => {
    const result = await registerUser(req.body);
    res.json(result);
  }),
);

app.post(
  "/api/auth/verify-email",
  wrap(async (req, res) => {
    const result = await verifyEmail(req.body);
    res.json(result);
  }),
);

app.post(
  "/api/auth/resend-verification-otp",
  wrap(async (req, res) => {
    const result = await resendVerificationOtp(req.body);
    res.json(result);
  }),
);

app.post(
  "/api/auth/forgot-password",
  wrap(async (req, res) => {
    const result = await forgotPassword(req.body);
    res.json(result);
  }),
);

app.post(
  "/api/auth/verify-reset-otp",
  wrap(async (req, res) => {
    const result = await verifyResetOtp(req.body);
    res.json(result);
  }),
);

app.post(
  "/api/auth/reset-password",
  wrap(async (req, res) => {
    const result = await resetPassword(req.body);
    res.json(result);
  }),
);

app.post(
  "/api/auth/login",
  wrap(async (req, res) => {
    try {
      const result = await loginUser(req.body);
      res.json(result);
    } catch (err) {
      if (err.requiresVerification) {
        return res.status(err.status || 403).json({
          error: err.message,
          requiresVerification: true,
          email: err.email,
        });
      }
      throw err;
    }
  }),
);

app.get("/api/auth/me", auth(), (req, res) => {
  res.json({ user: publicUser(req.user) });
});

/* ------------------------------------------------------------- public ---- */

const PUBLIC_SETTING_KEYS = [
  "brandName", "whatsapp", "phone", "email", "instagram", "city", "hours", "upiId", "upiName", "upiPhone",
  "arenaImage", "appBg", "pcCount", "ps5Count", "racingCount",
  "pcPrice30m", "pcPrice1h", "pcPriceDay",
  "ps5Price30m", "ps5Price1h", "ps5PriceDay",
  "racingPrice30m", "racingPrice1h", "racingPriceDay",
  "statSetups", "statRefresh", "statPing", "statTitles", "address",
];

app.get(
  "/api/settings",
  wrap(async (req, res) => {
    const all = await allSettings();
    const out = {};
    for (const k of PUBLIC_SETTING_KEYS) out[k] = all[k] || "";
    res.json(out);
  }),
);

app.get(
  "/api/games",
  wrap(async (req, res) => {
    const rows = await db.all("SELECT * FROM games ORDER BY sort_order, title");
    const list = rows.map(toGame).filter((g) => (req.query.active ? g.active : true));
    res.json(list);
  }),
);

app.get(
  "/api/food",
  wrap(async (req, res) => {
    const rows = await db.all("SELECT * FROM food ORDER BY sort_order, name");
    const list = rows.map(toFood).filter((f) => (req.query.active ? f.active : true));
    res.json(list);
  }),
);

app.get(
  "/api/tournaments",
  wrap(async (req, res) => {
    const rows = await db.all(`
      SELECT t.*, (SELECT COUNT(*) FROM registrations r WHERE r.tournament_id = t.id) AS registered_count
      FROM tournaments t
      ORDER BY t.created_at DESC
    `);
    res.json(rows.map(toTournament));
  }),
);

app.get(
  "/api/reviews",
  wrap(async (req, res) => {
    const rows = await db.all("SELECT * FROM reviews WHERE approved = 1 ORDER BY created_at DESC");
    res.json(rows.map(toReview));
  }),
);

app.get(
  "/api/gallery",
  wrap(async (req, res) => {
    const rows = await db.all("SELECT * FROM gallery ORDER BY sort_order, id");
    res.json(rows.map(toGallery));
  }),
);

app.get(
  "/api/availability",
  wrap(async (req, res) => {
    const platform = String(req.query.platform || "");
    const date = String(req.query.date || "");
    const row = await db.get(
      "SELECT COUNT(*) c FROM bookings WHERE platform = ? AND date = ? AND status NOT IN ('cancelled','rejected')",
      [platform, date],
    );
    res.json({ platform, date, booked: row.c });
  }),
);

/* ----------------------------------------------------------- bookings ---- */

app.post(
  "/api/bookings",
  auth(),
  wrap(async (req, res) => {
    const b = req.body || {};
    const platform = b.platform === "ps5" ? "ps5" : b.platform === "racing" ? "racing" : "pc";
    const info = await db.run(
      `INSERT INTO bookings(user_id, phone, platform, date, slot, duration_label, price, players, status, created_at)
       VALUES(?,?,?,?,?,?,?,?, 'awaiting_payment', ?)`,
      [
        req.user.id,
        req.user.phone,
        platform,
        String(b.date || ""),
        String(b.slot || ""),
        String(b.durationLabel || ""),
        Number(b.price || 0),
        Number(b.players || 1),
        now(),
      ],
    );
    const row = await db.get("SELECT * FROM bookings WHERE id = ?", [info.lastInsertRowid]);
    setImmediate(() => {
      void notifyAdminNewBooking({ booking: row, user: req.user });
    });
    res.json(toBooking(row));
  }),
);

app.get(
  "/api/bookings/mine",
  auth(),
  wrap(async (req, res) => {
    const rows = await db.all(
      "SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id],
    );
    res.json(rows.map(toBooking));
  }),
);

app.post(
  "/api/bookings/:id/pay",
  auth(),
  wrap(async (req, res) => {
    const row = await db.get("SELECT * FROM bookings WHERE id = ?", [req.params.id]);
    if (!row || row.user_id !== req.user.id) throw new Error("Booking not found.");
    const upiRef = String(req.body.upiRef || "").trim();
    if (!upiRef) throw new Error("Enter the UPI reference number you paid with.");
    await db.run("UPDATE bookings SET upi_ref = ?, status = 'pending' WHERE id = ?", [
      upiRef,
      row.id,
    ]);
    res.json(toBooking(await db.get("SELECT * FROM bookings WHERE id = ?", [row.id])));
  }),
);

app.post(
  "/api/bookings/:id/cancel",
  auth(),
  wrap(async (req, res) => {
    const row = await db.get("SELECT * FROM bookings WHERE id = ?", [req.params.id]);
    if (!row || (row.user_id !== req.user.id && req.user.role !== "admin" && req.user.role !== "staff"))
      throw new Error("Booking not found.");
    const reason = req.body.reason ? String(req.body.reason) : (row.user_id === req.user.id ? "Cancelled by customer" : "Cancelled by staff");
    await db.run("UPDATE bookings SET status = 'cancelled', decision_reason = ? WHERE id = ?", [reason, row.id]);
    res.json(toBooking(await db.get("SELECT * FROM bookings WHERE id = ?", [row.id])));
  }),
);

/* --------------------------------------------------------- food orders --- */

app.post(
  "/api/food-orders",
  auth(),
  wrap(async (req, res) => {
    const bookingId = req.body.bookingId;
    const booking = await db.get("SELECT * FROM bookings WHERE id = ?", [bookingId]);
    if (!booking || booking.user_id !== req.user.id)
      throw new Error("You need an active booking to order food.");
    if (!["awaiting_payment", "pending", "confirmed"].includes(booking.status))
      throw new Error("This booking is not active.");
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (items.length === 0) throw new Error("Your cart is empty.");
    const total = items.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);
    const payWith = ["counter", "points", "online"].includes(req.body.payWith)
      ? req.body.payWith
      : "counter";
    if (payWith === "points") {
      if (req.user.reward_points < total)
        throw new Error("Not enough reward points for this order.");
      await addReward(req.user.id, -total, `Food order redemption`);
    }
    const info = await db.run(
      `INSERT INTO food_orders(user_id, phone, booking_id, setup_label, items, total, pay_with, status, created_at)
       VALUES(?,?,?,?,?,?,?, 'placed', ?)`,
      [
        req.user.id,
        req.user.phone,
        booking.id,
        String(req.body.setupLabel || `${booking.platform.toUpperCase()} · ${booking.slot}`),
        JSON.stringify(items),
        total,
        payWith,
        now(),
      ],
    );
    res.json(toFoodOrder(await db.get("SELECT * FROM food_orders WHERE id = ?", [info.lastInsertRowid])));
  }),
);

app.get(
  "/api/food-orders/mine",
  auth(),
  wrap(async (req, res) => {
    const rows = await db.all(
      "SELECT * FROM food_orders WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id],
    );
    res.json(rows.map(toFoodOrder));
  }),
);

/* --------------------------------------------------------- tournaments --- */

app.get(
  "/api/tournaments/:id/registrations",
  auth(false),
  wrap(async (req, res) => {
    const isAdmin = req.user && req.user.role === "admin";
    const rows = await db.all(
      "SELECT * FROM registrations WHERE tournament_id = ? ORDER BY created_at ASC",
      [req.params.id],
    );
    res.json(
      rows.map((r) => ({
        id: String(r.id),
        tournamentId: String(r.tournament_id),
        playerName: r.player_name,
        teamName: r.team_name || "",
        phone: isAdmin ? r.phone : undefined,
        createdAt: r.created_at,
      })),
    );
  }),
);

app.post(
  "/api/tournaments/:id/register",
  auth(),
  wrap(async (req, res) => {
    const t = await db.get("SELECT * FROM tournaments WHERE id = ?", [req.params.id]);
    if (!t) throw new Error("Tournament not found.");
    if (t.status === "closed") throw new Error("This tournament is closed.");
    if (t.status === "full") throw new Error("This tournament is full.");

    if (t.capacity > 0) {
      const countRow = await db.get(
        "SELECT COUNT(*) as count FROM registrations WHERE tournament_id = ?",
        [t.id],
      );
      if (countRow && countRow.count >= t.capacity) {
        throw new Error("Tournament registration is full.");
      }
    }

    const existing = await db.get(
      "SELECT 1 FROM registrations WHERE tournament_id = ? AND user_id = ?",
      [t.id, req.user.id],
    );
    if (existing) throw new Error("You're already registered for this tournament.");
    await db.run(
      "INSERT INTO registrations(tournament_id, user_id, phone, player_name, team_name, created_at) VALUES(?,?,?,?,?,?)",
      [
        t.id,
        req.user.id,
        req.user.phone,
        String(req.body.playerName || req.user.name),
        String(req.body.teamName || ""),
        now(),
      ],
    );

    if (t.capacity > 0) {
      const countRow = await db.get(
        "SELECT COUNT(*) as count FROM registrations WHERE tournament_id = ?",
        [t.id],
      );
      if (countRow && countRow.count >= t.capacity) {
        await db.run("UPDATE tournaments SET status = 'full' WHERE id = ?", [t.id]);
      }
    }

    res.json({ ok: true });
  }),
);

app.get(
  "/api/registrations/mine",
  auth(),
  wrap(async (req, res) => {
    const rows = await db.all("SELECT * FROM registrations WHERE user_id = ?", [req.user.id]);
    res.json(
      rows.map((r) => ({
        id: String(r.id),
        tournamentId: String(r.tournament_id),
        playerName: r.player_name,
        teamName: r.team_name || "",
        createdAt: r.created_at,
      })),
    );
  }),
);

/* --------------------------------------------------------- group quotes --- */

function toGroupQuote(r) {
  return {
    id: String(r.id),
    userId: r.user_id ? String(r.user_id) : null,
    name: r.name,
    phone: r.phone,
    email: r.email || "",
    groupSize: Number(r.group_size),
    eventType: r.event_type,
    preferredDate: r.preferred_date || "",
    platform: r.platform || "pc",
    addFood: Boolean(r.add_food),
    addTournament: Boolean(r.add_tournament),
    message: r.message || "",
    status: r.status || "pending",
    createdAt: r.created_at,
  };
}

// Submit a group/birthday quote request (auth optional — guests can submit too)
app.post(
  "/api/group-quotes",
  auth(false),
  wrap(async (req, res) => {
    const b = req.body;
    if (!b.name || !b.phone) throw new Error("Name and phone are required.");
    const info = await db.run(
      `INSERT INTO group_quotes(user_id, name, phone, email, group_size, event_type, preferred_date, platform, add_food, add_tournament, message, status, created_at)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        req.user?.id ?? null,
        String(b.name),
        String(b.phone),
        String(b.email || ""),
        Number(b.groupSize) || 1,
        String(b.eventType || "group"),
        String(b.preferredDate || ""),
        String(b.platform || "pc"),
        b.addFood ? 1 : 0,
        b.addTournament ? 1 : 0,
        String(b.message || ""),
        "pending",
        now(),
      ],
    );
    const row = await db.get("SELECT * FROM group_quotes WHERE id = ?", [info.lastInsertRowid]);
    res.json(toGroupQuote(row));
  }),
);

// Admin: list all group quotes
app.get(
  "/api/admin/group-quotes",
  ...adminOnly,
  wrap(async (req, res) => {
    const rows = await db.all("SELECT * FROM group_quotes ORDER BY created_at DESC");
    res.json(rows.map(toGroupQuote));
  }),
);

// Admin: update quote status (support both PATCH and PUT)
const updateQuoteStatusHandler = wrap(async (req, res) => {
  const { status } = req.body;
  await db.run("UPDATE group_quotes SET status = ? WHERE id = ?", [String(status), req.params.id]);
  const row = await db.get("SELECT * FROM group_quotes WHERE id = ?", [req.params.id]);
  if (!row) throw new Error("Not found.");
  res.json(toGroupQuote(row));
});
app.patch("/api/admin/group-quotes/:id", ...adminOnly, updateQuoteStatusHandler);
app.put("/api/admin/group-quotes/:id", ...adminOnly, updateQuoteStatusHandler);

/* ------------------------------------------------------------- rewards & offers --- */

function formatRewardOption(r) {
  return {
    id: r.id,
    title: r.title,
    description: r.description || "",
    pointsCost: Number(r.points_cost || 0),
    rewardType: r.reward_type || "discount_voucher",
    discountAmount: Number(r.discount_amount || 0),
    badge: r.badge || "",
    icon: r.icon || "gift",
    active: Boolean(r.active),
    sortOrder: Number(r.sort_order || 0),
    createdAt: Number(r.created_at || 0),
  };
}

function formatOffer(o) {
  return {
    id: o.id,
    title: o.title,
    code: (o.code || "").toUpperCase(),
    description: o.description || "",
    discountType: o.discount_type || "percentage",
    discountValue: Number(o.discount_value || 0),
    minHours: Number(o.min_hours || 1),
    applicablePlatform: o.applicable_platform || "all",
    validUntil: o.valid_until || "Ongoing",
    badge: o.badge || "",
    active: Boolean(o.active),
    createdAt: Number(o.created_at || 0),
  };
}

// User: View personal rewards ledger & points
app.get(
  "/api/rewards/me",
  auth(),
  wrap(async (req, res) => {
    const rows = await db.all(
      "SELECT * FROM rewards_ledger WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id],
    );
    const ledger = rows.map((l) => ({
      id: String(l.id),
      delta: l.delta,
      reason: l.reason,
      createdAt: l.created_at,
    }));
    res.json({ points: req.user.reward_points, ledger });
  }),
);

// Public / User: View active reward redeem options
app.get(
  "/api/rewards/options",
  wrap(async (req, res) => {
    const rows = await db.all(
      "SELECT * FROM reward_options WHERE active = 1 ORDER BY sort_order ASC, points_cost ASC",
    );
    res.json(rows.map(formatRewardOption));
  }),
);

// Redeem reward points for discounts, coupons, and vouchers
app.post(
  "/api/rewards/redeem",
  auth(),
  wrap(async (req, res) => {
    let points = 0;
    let rewardType = "discount_voucher";
    let itemTitle = "";
    let discountAmount = 0;

    if (req.body.optionId) {
      const optId = Number(req.body.optionId);
      const option = await db.get("SELECT * FROM reward_options WHERE id = ?", [optId]);
      if (!option) throw new Error("Reward option not found.");
      if (!option.active) throw new Error("This reward option is currently not active.");
      points = Number(option.points_cost);
      rewardType = option.reward_type;
      itemTitle = option.title;
      discountAmount = Number(option.discount_amount);
    } else {
      points = Math.floor(Number(req.body.points));
      rewardType = String(req.body.rewardType || "discount_voucher");
      if (rewardType === "gaming_hour") itemTitle = "1 Free Gaming Hour Voucher";
      else if (rewardType === "vip_pass") itemTitle = "VIP Tournament Pass Voucher";
      else if (rewardType === "snack_combo") itemTitle = "Gamer Snack & Drink Combo Voucher";
      else itemTitle = `₹${points} Café / Booking Discount`;
      discountAmount = points;
    }

    if (!points || isNaN(points) || points <= 0) {
      throw new Error("Points to redeem must be greater than 0.");
    }
    const currentPoints = req.user.reward_points || 0;
    if (currentPoints < points) {
      throw new Error(`Insufficient reward points. You currently have ${currentPoints} points, but need ${points} points.`);
    }

    const voucherCode = `ALPHAQ-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const reason = `Redeemed ${points} pts for ${itemTitle} [Code: ${voucherCode}]`;

    await addReward(req.user.id, -points, reason);

    const updatedUser = await db.get("SELECT * FROM users WHERE id = ?", [req.user.id]);
    res.json({
      ok: true,
      voucherCode,
      rewardType,
      itemTitle,
      discountAmount,
      pointsRedeemed: points,
      remainingPoints: updatedUser.reward_points,
      reason,
      message: `Successfully redeemed ${points} points! Your voucher code is ${voucherCode}`,
    });
  }),
);

// Public / User: View active promotional offers
app.get(
  "/api/offers",
  wrap(async (req, res) => {
    const rows = await db.all(
      "SELECT * FROM offers WHERE active = 1 ORDER BY id ASC",
    );
    res.json(rows.map(formatOffer));
  }),
);

// Public / User: Validate promo / coupon code
app.post(
  "/api/offers/validate",
  wrap(async (req, res) => {
    const rawCode = String(req.body.code || "").trim().toUpperCase();
    if (!rawCode) throw new Error("Coupon code is required.");
    const offer = await db.get("SELECT * FROM offers WHERE UPPER(code) = ? AND active = 1", [rawCode]);
    if (!offer) {
      return res.status(400).json({ valid: false, message: "Invalid or expired promo code." });
    }

    const platform = String(req.body.platform || "all").toLowerCase();
    if (offer.applicable_platform !== "all" && offer.applicable_platform !== platform) {
      return res.status(400).json({
        valid: false,
        message: `This offer is only valid for ${offer.applicable_platform.toUpperCase()} bookings.`,
      });
    }

    const hours = Number(req.body.hours || 1);
    if (hours < offer.min_hours) {
      return res.status(400).json({
        valid: false,
        message: `This offer requires a minimum booking of ${offer.min_hours} hour(s).`,
      });
    }

    const amount = Number(req.body.amount || 0);
    let discount = 0;
    if (offer.discount_type === "percentage") {
      discount = Math.round((amount * offer.discount_value) / 100);
    } else {
      discount = Math.min(amount, offer.discount_value);
    }
    const finalAmount = Math.max(0, amount - discount);

    res.json({
      valid: true,
      code: offer.code,
      title: offer.title,
      discountType: offer.discount_type,
      discountValue: offer.discount_value,
      discountAmount: discount,
      finalAmount,
      message: `Promo code ${offer.code} applied! Saved ₹${discount}.`,
      offer: formatOffer(offer),
    });
  }),
);

/* ------------------------------------------------------------- reviews --- */

app.post(
  "/api/reviews",
  auth(),
  wrap(async (req, res) => {
    const rating = Math.max(1, Math.min(5, Number(req.body.rating || 5)));
    const body = String(req.body.body || "").trim();
    if (!body) throw new Error("Please write your review.");
    await db.run(
      "INSERT INTO reviews(user_id, name, handle, rating, body, verified, approved, created_at) VALUES(?,?,?,?,?,1,1,?)",
      [req.user.id, req.user.name, "@" + req.user.phone.slice(-4), rating, body, now()],
    );
    res.json({ ok: true, message: "Thanks! Your review is now live." });
  }),
);

/* =========================================================== ADMIN ======= */

app.get(
  "/api/admin/bookings",
  ...adminOnly,
  wrap(async (req, res) => {
    const status = req.query.status;
    const rows = status
      ? await db.all("SELECT * FROM bookings WHERE status = ? ORDER BY created_at DESC", [status])
      : await db.all("SELECT * FROM bookings ORDER BY created_at DESC");
    res.json(rows.map(toBooking));
  }),
);

app.post(
  "/api/admin/bookings/:id/approve",
  ...adminOnly,
  wrap(async (req, res) => {
    const b = await db.get("SELECT * FROM bookings WHERE id = ?", [req.params.id]);
    if (!b) throw new Error("Booking not found.");
    await db.run("UPDATE bookings SET status = 'confirmed', decision_reason = NULL WHERE id = ?", [b.id]);
    await addReward(b.user_id, Math.max(1, Math.floor(b.price * 0.1)), "Booking confirmed");
    res.json(toBooking(await db.get("SELECT * FROM bookings WHERE id = ?", [b.id])));
  }),
);

app.post(
  "/api/admin/bookings/:id/reject",
  ...adminOnly,
  wrap(async (req, res) => {
    const b = await db.get("SELECT * FROM bookings WHERE id = ?", [req.params.id]);
    if (!b) throw new Error("Booking not found.");
    await db.run("UPDATE bookings SET status = 'rejected', decision_reason = ? WHERE id = ?", [
      String(req.body.reason || "Rejected by staff"),
      b.id,
    ]);
    res.json(toBooking(await db.get("SELECT * FROM bookings WHERE id = ?", [b.id])));
  }),
);

app.post(
  "/api/admin/bookings/:id/cancel",
  ...adminOnly,
  wrap(async (req, res) => {
    const b = await db.get("SELECT * FROM bookings WHERE id = ?", [req.params.id]);
    if (!b) throw new Error("Booking not found.");
    const reason = req.body.reason ? String(req.body.reason) : "Cancelled by staff";
    await db.run("UPDATE bookings SET status = 'cancelled', decision_reason = ? WHERE id = ?", [
      reason,
      b.id,
    ]);
    res.json(toBooking(await db.get("SELECT * FROM bookings WHERE id = ?", [b.id])));
  }),
);

app.post(
  "/api/admin/bookings/:id/complete",
  ...adminOnly,
  wrap(async (req, res) => {
    const b = await db.get("SELECT * FROM bookings WHERE id = ?", [req.params.id]);
    if (!b) throw new Error("Booking not found.");
    await db.run("UPDATE bookings SET status = 'completed' WHERE id = ?", [b.id]);
    res.json(toBooking(await db.get("SELECT * FROM bookings WHERE id = ?", [b.id])));
  }),
);

// Admin: update booking UPI reference
const updateBookingUpiRefHandler = wrap(async (req, res) => {
  const b = await db.get("SELECT * FROM bookings WHERE id = ?", [req.params.id]);
  if (!b) throw new Error("Booking not found.");
  const upiRef = String(req.body.upiRef || "").trim();
  await db.run("UPDATE bookings SET upi_ref = ? WHERE id = ?", [upiRef || null, b.id]);
  res.json(toBooking(await db.get("SELECT * FROM bookings WHERE id = ?", [b.id])));
});
app.post("/api/admin/bookings/:id/upi-ref", ...adminOnly, updateBookingUpiRefHandler);
app.put("/api/admin/bookings/:id/upi-ref", ...adminOnly, updateBookingUpiRefHandler);

// Games CRUD
app.post(
  "/api/admin/games",
  ...adminOnly,
  wrap(async (req, res) => {
    const g = req.body;
    const info = await db.run(
      "INSERT INTO games(title, platform, tags, active, sort_order) VALUES(?,?,?,?,?)",
      [
        String(g.title || ""),
        JSON.stringify(g.platform || []),
        JSON.stringify(g.tags || []),
        g.active === false ? 0 : 1,
        Number(g.sortOrder || 0),
      ],
    );
    res.json(toGame(await db.get("SELECT * FROM games WHERE id = ?", [info.lastInsertRowid])));
  }),
);
app.put(
  "/api/admin/games/:id",
  ...adminOnly,
  wrap(async (req, res) => {
    const g = req.body;
    const cur = await db.get("SELECT * FROM games WHERE id = ?", [req.params.id]);
    if (!cur) throw new Error("Not found.");
    await db.run("UPDATE games SET title=?, platform=?, tags=?, active=?, sort_order=? WHERE id=?", [
      g.title ?? cur.title,
      JSON.stringify(g.platform ?? JSON.parse(cur.platform)),
      JSON.stringify(g.tags ?? JSON.parse(cur.tags)),
      g.active === undefined ? cur.active : g.active ? 1 : 0,
      g.sortOrder ?? cur.sort_order,
      cur.id,
    ]);
    res.json(toGame(await db.get("SELECT * FROM games WHERE id = ?", [cur.id])));
  }),
);
app.delete(
  "/api/admin/games/:id",
  ...adminOnly,
  wrap(async (req, res) => {
    await db.run("DELETE FROM games WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  }),
);

// Food CRUD
app.post(
  "/api/admin/food",
  ...adminOnly,
  wrap(async (req, res) => {
    const f = req.body;
    const info = await db.run(
      "INSERT INTO food(name, category, price, image, active, sort_order) VALUES(?,?,?,?,?,?)",
      [
        String(f.name || ""),
        String(f.category || "Other"),
        Number(f.price || 0),
        String(f.image || ""),
        f.active === false ? 0 : 1,
        Number(f.sortOrder || 0),
      ],
    );
    res.json(toFood(await db.get("SELECT * FROM food WHERE id = ?", [info.lastInsertRowid])));
  }),
);
app.put(
  "/api/admin/food/:id",
  ...adminOnly,
  wrap(async (req, res) => {
    const f = req.body;
    const cur = await db.get("SELECT * FROM food WHERE id = ?", [req.params.id]);
    if (!cur) throw new Error("Not found.");
    await db.run(
      "UPDATE food SET name=?, category=?, price=?, image=?, active=?, sort_order=? WHERE id=?",
      [
        f.name ?? cur.name,
        f.category ?? cur.category,
        f.price ?? cur.price,
        f.image ?? cur.image ?? "",
        f.active === undefined ? cur.active : f.active ? 1 : 0,
        f.sortOrder ?? cur.sort_order,
        cur.id,
      ],
    );
    res.json(toFood(await db.get("SELECT * FROM food WHERE id = ?", [cur.id])));
  }),
);
app.delete(
  "/api/admin/food/:id",
  ...adminOnly,
  wrap(async (req, res) => {
    await db.run("DELETE FROM food WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  }),
);

// Tournaments CRUD
app.post(
  "/api/admin/tournaments",
  ...adminOnly,
  wrap(async (req, res) => {
    const t = req.body;
    const info = await db.run(
      "INSERT INTO tournaments(game, format, date, prize, status, description, capacity, created_at) VALUES(?,?,?,?,?,?,?,?)",
      [
        String(t.game || ""),
        String(t.format || ""),
        String(t.date || ""),
        String(t.prize || ""),
        String(t.status || "soon"),
        String(t.description || ""),
        Number(t.capacity || 0),
        now(),
      ],
    );
    res.json(toTournament(await db.get("SELECT * FROM tournaments WHERE id = ?", [info.lastInsertRowid])));
  }),
);
app.put(
  "/api/admin/tournaments/:id",
  ...adminOnly,
  wrap(async (req, res) => {
    const t = req.body;
    const cur = await db.get("SELECT * FROM tournaments WHERE id = ?", [req.params.id]);
    if (!cur) throw new Error("Not found.");
    await db.run(
      "UPDATE tournaments SET game=?, format=?, date=?, prize=?, status=?, description=?, capacity=? WHERE id=?",
      [
        t.game ?? cur.game,
        t.format ?? cur.format,
        t.date ?? cur.date,
        t.prize ?? cur.prize,
        t.status ?? cur.status,
        t.description ?? cur.description,
        t.capacity ?? cur.capacity,
        cur.id,
      ],
    );
    res.json(toTournament(await db.get("SELECT * FROM tournaments WHERE id = ?", [cur.id])));
  }),
);
app.delete(
  "/api/admin/tournaments/:id",
  ...adminOnly,
  wrap(async (req, res) => {
    await db.run("DELETE FROM registrations WHERE tournament_id = ?", [req.params.id]);
    await db.run("DELETE FROM tournaments WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  }),
);
app.delete(
  "/api/admin/registrations/:id",
  ...adminOnly,
  wrap(async (req, res) => {
    await db.run("DELETE FROM registrations WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  }),
);

// Food orders admin
app.get(
  "/api/admin/food-orders",
  ...adminOnly,
  wrap(async (req, res) => {
    const rows = await db.all("SELECT * FROM food_orders ORDER BY created_at DESC");
    res.json(rows.map(toFoodOrder));
  }),
);
app.put(
  "/api/admin/food-orders/:id",
  ...adminOnly,
  wrap(async (req, res) => {
    const status = String(req.body.status || "");
    if (!["placed", "preparing", "delivered", "cancelled"].includes(status))
      throw new Error("Invalid status.");
    await db.run("UPDATE food_orders SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ ok: true });
  }),
);

// Reviews admin
app.get(
  "/api/admin/reviews",
  ...adminOnly,
  wrap(async (req, res) => {
    const rows = await db.all("SELECT * FROM reviews ORDER BY created_at DESC");
    res.json(rows.map(toReview));
  }),
);
app.post(
  "/api/admin/reviews",
  ...adminOnly,
  wrap(async (req, res) => {
    const r = req.body;
    const info = await db.run(
      "INSERT INTO reviews(name, handle, rating, body, verified, approved, created_at) VALUES(?,?,?,?,?,1,?)",
      [
        String(r.name || "Guest"),
        String(r.handle || ""),
        Math.max(1, Math.min(5, Number(r.rating || 5))),
        String(r.body || ""),
        r.verified === false ? 0 : 1,
        now(),
      ],
    );
    res.json(toReview(await db.get("SELECT * FROM reviews WHERE id = ?", [info.lastInsertRowid])));
  }),
);
app.put(
  "/api/admin/reviews/:id",
  ...adminOnly,
  wrap(async (req, res) => {
    const cur = await db.get("SELECT * FROM reviews WHERE id = ?", [req.params.id]);
    if (!cur) throw new Error("Not found.");
    await db.run("UPDATE reviews SET approved = ? WHERE id = ?", [req.body.approved ? 1 : 0, cur.id]);
    res.json(toReview(await db.get("SELECT * FROM reviews WHERE id = ?", [cur.id])));
  }),
);
app.delete(
  "/api/admin/reviews/:id",
  ...adminOnly,
  wrap(async (req, res) => {
    await db.run("DELETE FROM reviews WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  }),
);

// Gallery admin (image upload)
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || ".jpg") || ".jpg";
      cb(null, `g_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
});

app.post(
  "/api/admin/gallery",
  ...adminOnly,
  upload.single("image"),
  wrap(async (req, res) => {
    if (!req.file) throw new Error("No image uploaded.");
    const url = `/uploads/${req.file.filename}`;
    const info = await db.run(
      "INSERT INTO gallery(url, caption, sort_order, created_at) VALUES(?,?,?,?)",
      [url, String(req.body.caption || ""), Number(req.body.sortOrder || 0), now()],
    );
    res.json(toGallery(await db.get("SELECT * FROM gallery WHERE id = ?", [info.lastInsertRowid])));
  }),
);
app.delete(
  "/api/admin/gallery/:id",
  ...adminOnly,
  wrap(async (req, res) => {
    const g = await db.get("SELECT * FROM gallery WHERE id = ?", [req.params.id]);
    if (g && g.url.startsWith("/uploads/")) {
      const fp = path.join(UPLOAD_DIR, path.basename(g.url));
      fs.existsSync(fp) && fs.unlinkSync(fp);
    }
    await db.run("DELETE FROM gallery WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  }),
);

// Generic image upload (food photos, etc.) — returns the served URL.
app.post(
  "/api/admin/upload",
  ...adminOnly,
  upload.single("image"),
  wrap(async (req, res) => {
    if (!req.file) throw new Error("No image uploaded.");
    res.json({ url: `/uploads/${req.file.filename}` });
  }),
);

// App/dashboard background image — admin uploads/replaces it.
app.post(
  "/api/admin/app-bg",
  ...adminOnly,
  upload.single("image"),
  wrap(async (req, res) => {
    if (!req.file) throw new Error("No image uploaded.");
    const prev = await getSetting("appBg", "");
    if (prev.startsWith("/uploads/")) {
      const fp = path.join(UPLOAD_DIR, path.basename(prev));
      fs.existsSync(fp) && fs.unlinkSync(fp);
    }
    const url = `/uploads/${req.file.filename}`;
    await setSetting("appBg", url);
    res.json({ appBg: url });
  }),
);

// Arena image (the "Inside the AlphaQ arena" photo) — admin uploads/replaces it.
app.post(
  "/api/admin/arena-image",
  ...adminOnly,
  upload.single("image"),
  wrap(async (req, res) => {
    if (!req.file) throw new Error("No image uploaded.");
    const prev = await getSetting("arenaImage", "");
    if (prev.startsWith("/uploads/")) {
      const fp = path.join(UPLOAD_DIR, path.basename(prev));
      fs.existsSync(fp) && fs.unlinkSync(fp);
    }
    const url = `/uploads/${req.file.filename}`;
    await setSetting("arenaImage", url);
    res.json({ arenaImage: url });
  }),
);

// Settings admin
app.get(
  "/api/admin/settings",
  ...adminOnly,
  wrap(async (req, res) => {
    res.json(await allSettings());
  }),
);
app.put(
  "/api/admin/settings",
  ...adminOnly,
  wrap(async (req, res) => {
    const body = req.body || {};
    for (const [k, v] of Object.entries(body)) {
      if (typeof v === "string") await setSetting(k, v);
    }
    res.json(await allSettings());
  }),
);

// Section 25: Admin Notification Settings & Test APIs
app.get(
  "/api/admin/notifications/settings",
  ...adminOnly,
  wrap(async (req, res) => {
    const settings = await getNotificationSettings();
    const providerStatus = getProviderSecretStatus();
    res.json({ settings, providerStatus });
  }),
);

app.put(
  "/api/admin/notifications/settings",
  ...adminOnly,
  wrap(async (req, res) => {
    const updated = await updateNotificationSettings(req.body);
    const providerStatus = getProviderSecretStatus();
    res.json({ settings: updated, providerStatus });
  }),
);

app.post(
  "/api/admin/notifications/test-email",
  ...adminOnly,
  wrap(async (req, res) => {
    const { to } = req.body || {};
    const result = await sendTestEmail({ to });
    res.json(result);
  }),
);

app.post(
  "/api/admin/notifications/test-sms",
  ...adminOnly,
  wrap(async (req, res) => {
    const { to } = req.body || {};
    const result = await sendTestSms({ to });
    res.json(result);
  }),
);

// Users + manual reward adjustments
app.get(
  "/api/admin/users",
  ...adminOnly,
  wrap(async (req, res) => {
    const rows = await db.all("SELECT * FROM users ORDER BY created_at DESC");
    res.json(rows.map(publicUser));
  }),
);

// Create a user (optionally an admin/staff account). Email is mandatory.
app.post(
  "/api/admin/users",
  ...adminOnly,
  wrap(async (req, res) => {
    const user = await adminCreateUser(req.body);
    res.json(user);
  }),
);

// Change a user's role (admin, staff, customer).
app.post(
  "/api/admin/users/:id/role",
  ...adminOnly,
  wrap(async (req, res) => {
    const allowed = ["admin", "staff", "customer"];
    const role = allowed.includes(req.body.role) ? req.body.role : "customer";
    const u = await db.get("SELECT * FROM users WHERE id = ?", [req.params.id]);
    if (!u) throw new Error("User not found.");
    if (u.id === req.user.id && role !== "admin")
      throw new Error("You cannot remove your own admin access.");
    await db.run("UPDATE users SET role = ? WHERE id = ?", [role, u.id]);
    res.json(publicUser(await db.get("SELECT * FROM users WHERE id = ?", [u.id])));
  }),
);

// Block or unblock a user.
app.post(
  "/api/admin/users/:id/block",
  ...adminOnly,
  wrap(async (req, res) => {
    const u = await db.get("SELECT * FROM users WHERE id = ?", [req.params.id]);
    if (!u) throw new Error("User not found.");
    if (u.id === req.user.id)
      throw new Error("You cannot block your own admin account.");
    const blocked = req.body.blocked === undefined ? (u.blocked ? 0 : 1) : req.body.blocked ? 1 : 0;
    await db.run("UPDATE users SET blocked = ? WHERE id = ?", [blocked, u.id]);
    res.json(publicUser(await db.get("SELECT * FROM users WHERE id = ?", [u.id])));
  }),
);

// Delete a user.
app.delete(
  "/api/admin/users/:id",
  ...adminOnly,
  wrap(async (req, res) => {
    const u = await db.get("SELECT * FROM users WHERE id = ?", [req.params.id]);
    if (!u) throw new Error("User not found.");
    if (u.id === req.user.id)
      throw new Error("You cannot delete your own admin account.");
    await db.run("DELETE FROM rewards_ledger WHERE user_id = ?", [u.id]).catch(() => {});
    await db.run("DELETE FROM registrations WHERE user_id = ?", [u.id]).catch(() => {});
    await db.run("DELETE FROM food_orders WHERE user_id = ?", [u.id]).catch(() => {});
    await db.run("DELETE FROM bookings WHERE user_id = ?", [u.id]).catch(() => {});
    await db.run("DELETE FROM reviews WHERE user_id = ?", [u.id]).catch(() => {});
    await db.run("DELETE FROM users WHERE id = ?", [u.id]);
    res.json({ ok: true });
  }),
);
app.post(
  "/api/admin/rewards",
  ...adminOnly,
  wrap(async (req, res) => {
    const userId = Number(req.body.userId);
    const delta = Number(req.body.delta);
    const u = await db.get("SELECT * FROM users WHERE id = ?", [userId]);
    if (!u) throw new Error("User not found.");
    await addReward(userId, delta, String(req.body.reason || "Manual adjustment"));
    res.json(publicUser(await db.get("SELECT * FROM users WHERE id = ?", [userId])));
  }),
);

/* ------------------------------------------- admin: rewards options & offers --- */

// List all reward options for admin (including inactive)
app.get(
  "/api/admin/rewards/options",
  ...adminOnly,
  wrap(async (req, res) => {
    const rows = await db.all("SELECT * FROM reward_options ORDER BY sort_order ASC, id ASC");
    res.json(rows.map(formatRewardOption));
  }),
);

// Create a new reward option
app.post(
  "/api/admin/rewards/options",
  ...adminOnly,
  wrap(async (req, res) => {
    const title = String(req.body.title || "").trim();
    if (!title) throw new Error("Title is required for reward option.");
    const pointsCost = Math.max(1, Math.floor(Number(req.body.pointsCost || 50)));
    const description = String(req.body.description || "").trim();
    const rewardType = String(req.body.rewardType || "discount_voucher");
    const discountAmount = Math.max(0, Math.floor(Number(req.body.discountAmount || 0)));
    const badge = String(req.body.badge || "").trim();
    const icon = String(req.body.icon || "gift").trim();
    const active = req.body.active === undefined ? 1 : req.body.active ? 1 : 0;
    const sortOrder = Number(req.body.sortOrder || 0);

    const result = await db.run(
      `INSERT INTO reward_options (title, description, points_cost, reward_type, discount_amount, badge, icon, active, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, pointsCost, rewardType, discountAmount, badge, icon, active, sortOrder, Date.now()],
    );

    const created = await db.get("SELECT * FROM reward_options WHERE id = ?", [result.lastInsertRowid]);
    res.json(formatRewardOption(created));
  }),
);

// Update a reward option
app.put(
  "/api/admin/rewards/options/:id",
  ...adminOnly,
  wrap(async (req, res) => {
    const opt = await db.get("SELECT * FROM reward_options WHERE id = ?", [req.params.id]);
    if (!opt) throw new Error("Reward option not found.");

    const title = req.body.title !== undefined ? String(req.body.title).trim() : opt.title;
    const description = req.body.description !== undefined ? String(req.body.description).trim() : opt.description;
    const pointsCost = req.body.pointsCost !== undefined ? Math.max(1, Math.floor(Number(req.body.pointsCost))) : opt.points_cost;
    const rewardType = req.body.rewardType !== undefined ? String(req.body.rewardType) : opt.reward_type;
    const discountAmount = req.body.discountAmount !== undefined ? Math.max(0, Math.floor(Number(req.body.discountAmount))) : opt.discount_amount;
    const badge = req.body.badge !== undefined ? String(req.body.badge).trim() : opt.badge;
    const icon = req.body.icon !== undefined ? String(req.body.icon).trim() : opt.icon;
    const active = req.body.active !== undefined ? (req.body.active ? 1 : 0) : opt.active;
    const sortOrder = req.body.sortOrder !== undefined ? Number(req.body.sortOrder) : opt.sort_order;

    await db.run(
      `UPDATE reward_options SET title = ?, description = ?, points_cost = ?, reward_type = ?, discount_amount = ?, badge = ?, icon = ?, active = ?, sort_order = ?
       WHERE id = ?`,
      [title, description, pointsCost, rewardType, discountAmount, badge, icon, active, sortOrder, opt.id],
    );

    const updated = await db.get("SELECT * FROM reward_options WHERE id = ?", [opt.id]);
    res.json(formatRewardOption(updated));
  }),
);

// Delete a reward option
app.delete(
  "/api/admin/rewards/options/:id",
  ...adminOnly,
  wrap(async (req, res) => {
    await db.run("DELETE FROM reward_options WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  }),
);

// List all promotional offers for admin (including inactive)
app.get(
  "/api/admin/offers",
  ...adminOnly,
  wrap(async (req, res) => {
    const rows = await db.all("SELECT * FROM offers ORDER BY id DESC");
    res.json(rows.map(formatOffer));
  }),
);

// Create a new offer
app.post(
  "/api/admin/offers",
  ...adminOnly,
  wrap(async (req, res) => {
    const title = String(req.body.title || "").trim();
    if (!title) throw new Error("Offer title is required.");
    const code = String(req.body.code || "").trim().toUpperCase();
    if (!code) throw new Error("Offer coupon code is required.");
    const description = String(req.body.description || "").trim();
    const discountType = String(req.body.discountType || "percentage");
    const discountValue = Math.max(1, Math.floor(Number(req.body.discountValue || 10)));
    const minHours = Math.max(1, Math.floor(Number(req.body.minHours || 1)));
    const applicablePlatform = String(req.body.applicablePlatform || "all");
    const validUntil = String(req.body.validUntil || "Ongoing").trim();
    const badge = String(req.body.badge || "").trim();
    const active = req.body.active === undefined ? 1 : req.body.active ? 1 : 0;

    const result = await db.run(
      `INSERT INTO offers (title, code, description, discount_type, discount_value, min_hours, applicable_platform, valid_until, badge, active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, code, description, discountType, discountValue, minHours, applicablePlatform, validUntil, badge, active, Date.now()],
    );

    const created = await db.get("SELECT * FROM offers WHERE id = ?", [result.lastInsertRowid]);
    res.json(formatOffer(created));
  }),
);

// Update an offer
app.put(
  "/api/admin/offers/:id",
  ...adminOnly,
  wrap(async (req, res) => {
    const off = await db.get("SELECT * FROM offers WHERE id = ?", [req.params.id]);
    if (!off) throw new Error("Offer not found.");

    const title = req.body.title !== undefined ? String(req.body.title).trim() : off.title;
    const code = req.body.code !== undefined ? String(req.body.code).trim().toUpperCase() : off.code;
    const description = req.body.description !== undefined ? String(req.body.description).trim() : off.description;
    const discountType = req.body.discountType !== undefined ? String(req.body.discountType) : off.discount_type;
    const discountValue = req.body.discountValue !== undefined ? Math.max(1, Math.floor(Number(req.body.discountValue))) : off.discount_value;
    const minHours = req.body.minHours !== undefined ? Math.max(1, Math.floor(Number(req.body.minHours))) : off.min_hours;
    const applicablePlatform = req.body.applicablePlatform !== undefined ? String(req.body.applicablePlatform) : off.applicable_platform;
    const validUntil = req.body.validUntil !== undefined ? String(req.body.validUntil).trim() : off.valid_until;
    const badge = req.body.badge !== undefined ? String(req.body.badge).trim() : off.badge;
    const active = req.body.active !== undefined ? (req.body.active ? 1 : 0) : off.active;

    await db.run(
      `UPDATE offers SET title = ?, code = ?, description = ?, discount_type = ?, discount_value = ?, min_hours = ?, applicable_platform = ?, valid_until = ?, badge = ?, active = ?
       WHERE id = ?`,
      [title, code, description, discountType, discountValue, minHours, applicablePlatform, validUntil, badge, active, off.id],
    );

    const updated = await db.get("SELECT * FROM offers WHERE id = ?", [off.id]);
    res.json(formatOffer(updated));
  }),
);

// Delete an offer
app.delete(
  "/api/admin/offers/:id",
  ...adminOnly,
  wrap(async (req, res) => {
    await db.run("DELETE FROM offers WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  }),
);

// Admin: Direct password update for any user
app.post(
  "/api/admin/users/:id/password",
  ...adminOnly,
  wrap(async (req, res) => {
    const newPass = String(req.body.password || "").trim();
    if (!newPass || newPass.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }
    const u = await db.get("SELECT * FROM users WHERE id = ?", [req.params.id]);
    if (!u) throw new Error("User not found.");

    const hash = bcrypt.hashSync(newPass, 10);
    await db.run("UPDATE users SET password_hash = ? WHERE id = ?", [hash, u.id]);
    res.json({
      ok: true,
      message: `Password updated successfully for ${u.name} (${u.phone || u.email}).`,
      user: publicUser(await db.get("SELECT * FROM users WHERE id = ?", [u.id])),
    });
  }),
);

/* ----------------------------------------------------------- crypto tool -- */

app.post(
  "/api/admin/crypto/verify-password",
  ...adminOnly,
  wrap(async (req, res) => {
    const { password, hash } = req.body;
    const result = cryptoService.verifyPassword(password, hash);
    res.json(result);
  }),
);

app.post(
  "/api/admin/crypto/hash-password",
  ...adminOnly,
  wrap(async (req, res) => {
    const { password, rounds } = req.body;
    const result = cryptoService.hashPassword(password, rounds);
    res.json(result);
  }),
);

app.post(
  "/api/admin/crypto/inspect-hash",
  ...adminOnly,
  wrap(async (req, res) => {
    const { hash } = req.body;
    res.json(cryptoService.inspectHash(hash));
  }),
);

app.post(
  "/api/admin/crypto/check-user-password",
  ...adminOnly,
  wrap(async (req, res) => {
    const { identifier, password } = req.body;
    const result = await cryptoService.checkUserPassword(db, identifier, password);
    res.json(result);
  }),
);

app.post(
  "/api/admin/crypto/inspect-otp",
  ...adminOnly,
  wrap(async (req, res) => {
    const { email, otp } = req.body;
    const result = await cryptoService.inspectDbOtp(db, email, otp);
    res.json(result);
  }),
);

/* ----------------------------------------------------- database admin -- */

app.get(
  "/api/admin/database/tables",
  ...adminOnly,
  wrap(async (req, res) => {
    const tables = await dbAdminService.listTables(db);
    res.json({ dbKind: db.kind, tables });
  }),
);

app.get(
  "/api/admin/database/table/:name",
  ...adminOnly,
  wrap(async (req, res) => {
    const { page, limit, sortBy, sortDir } = req.query;
    const result = await dbAdminService.getTableRows(db, req.params.name, {
      page,
      limit,
      sortBy,
      sortDir,
    });
    res.json(result);
  }),
);

app.post(
  "/api/admin/database/query",
  ...adminOnly,
  wrap(async (req, res) => {
    const { sql } = req.body;
    const result = await dbAdminService.executeSql(db, sql);
    res.json(result);
  }),
);

app.post(
  "/api/admin/database/table/:name/insert",
  ...adminOnly,
  wrap(async (req, res) => {
    const { row } = req.body;
    const result = await dbAdminService.insertTableRow(db, req.params.name, row);
    res.json(result);
  }),
);

app.delete(
  "/api/admin/database/table/:name/row",
  ...adminOnly,
  wrap(async (req, res) => {
    const { primaryKey, id } = req.body;
    const result = await dbAdminService.deleteTableRow(db, req.params.name, primaryKey, id);
    res.json(result);
  }),
);

/* --------------------------------------------------- railway variables -- */

app.get(
  "/api/admin/railway/variables",
  ...adminOnly,
  wrap(async (req, res) => {
    const vars = await railwayService.getVariables();
    res.json(vars);
  }),
);

app.post(
  "/api/admin/railway/variables",
  ...adminOnly,
  wrap(async (req, res) => {
    const { name, value } = req.body;
    const result = await railwayService.setVariable(name, value);
    res.json(result);
  }),
);

app.delete(
  "/api/admin/railway/variables/:name",
  ...adminOnly,
  wrap(async (req, res) => {
    const result = await railwayService.deleteVariable(req.params.name);
    res.json(result);
  }),
);

/* ----------------------------------------------------------- static ----- */

app.use("/uploads", express.static(UPLOAD_DIR));

// Serve the built frontend in production (single deployable server).
const DIST = path.join(__dirname, "..", "app", "dist");
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get(/^(?!\/api|\/uploads).*/, (req, res) => res.sendFile(path.join(DIST, "index.html")));
}

// Run migrations, seed, start periodic OTP cleanup, then listen.
init()
  .then((kind) => {
    startPeriodicCleanup(db);
    app.listen(PORT, () =>
      console.log(`AlphaQ API listening on http://localhost:${PORT} (db: ${kind})`),
    );
  })
  .catch((e) => {
    console.error("Failed to start — database init error:", e);
    process.exit(1);
  });
