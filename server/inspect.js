// Quick DB inspector: `npm run db` prints row counts and the users/bookings so
// you can eyeball the data without a SQL tool. Works with MySQL or SQLite.
const { db, init } = require("./db");

const TABLES = [
  "users", "bookings", "games", "food", "food_orders",
  "tournaments", "registrations", "reviews", "gallery",
  "rewards_ledger", "settings",
];

async function main() {
  await init();
  console.log(`\nDatabase driver: ${db.kind}`);

  const counts = [];
  for (const name of TABLES) {
    const row = await db.get(`SELECT COUNT(*) c FROM ${name}`);
    counts.push({ table: name, rows: Number(row.c) });
  }
  console.log("\nRow counts:");
  console.table(counts);

  console.log("\nusers (passwords are bcrypt-hashed):");
  console.table(
    await db.all(
      "SELECT id, phone, name, password_hash AS passwordHash, role, reward_points AS points FROM users ORDER BY id",
    ),
  );

  console.log("\nbookings:");
  console.table(
    await db.all(
      "SELECT id, phone, platform, date, slot, price, status, upi_ref AS upiRef FROM bookings ORDER BY id DESC LIMIT 25",
    ),
  );

  const arg = process.argv[2];
  if (arg && TABLES.includes(arg)) {
    console.log(`\nAll rows of "${arg}":`);
    console.table(await db.all(`SELECT * FROM ${arg}`));
  } else if (arg) {
    console.log(`\nUnknown table "${arg}". Known: ${TABLES.join(", ")}`);
  }

  await db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
