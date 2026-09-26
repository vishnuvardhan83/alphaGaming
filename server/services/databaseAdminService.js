// AlphaQ Gaming — Database Admin Service
// Inspect tables, execute SQL queries, insert rows, and delete rows from Admin UI.

/**
 * Validates table or column identifier to avoid SQL injection in identifier positions.
 */
function sanitizeIdentifier(ident) {
  const str = String(ident || "").trim();
  if (!/^[a-zA-Z0-9_]+$/.test(str)) {
    throw new Error(`Invalid identifier name: "${str}"`);
  }
  return str;
}

/**
 * Lists all tables in the database with schema columns and row counts.
 */
async function listTables(db) {
  const isMysql = db.kind === "mysql";
  let tables = [];

  if (isMysql) {
    const rawTables = await db.all("SHOW TABLES");
    tables = rawTables.map((r) => Object.values(r)[0]).filter(Boolean);
  } else {
    const rawTables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC",
    );
    tables = rawTables.map((r) => r.name);
  }

  const results = [];
  for (const t of tables) {
    const safeTable = sanitizeIdentifier(t);
    let count = 0;
    try {
      const cRow = await db.get(`SELECT COUNT(*) AS total FROM \`${safeTable}\``);
      count = Number(cRow?.total || 0);
    } catch {
      count = 0;
    }

    let columns = [];
    try {
      if (isMysql) {
        const cols = await db.all(`DESCRIBE \`${safeTable}\``);
        columns = cols.map((c) => ({
          name: c.Field,
          type: c.Type,
          nullable: c.Null === "YES",
          key: c.Key,
          default: c.Default,
          extra: c.Extra,
        }));
      } else {
        const cols = await db.all(`PRAGMA table_info(\`${safeTable}\`)`);
        columns = cols.map((c) => ({
          name: c.name,
          type: c.type,
          nullable: !c.notnull,
          key: c.pk ? "PRI" : "",
          default: c.dflt_value,
          extra: "",
        }));
      }
    } catch {
      columns = [];
    }

    results.push({
      name: safeTable,
      rowCount: count,
      columns,
    });
  }

  return results;
}

/**
 * Fetches rows from a specific table with pagination and ordering.
 */
async function getTableRows(db, tableName, { page = 1, limit = 50, sortBy = "", sortDir = "DESC" } = {}) {
  const safeTable = sanitizeIdentifier(tableName);
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(Math.max(1, Number(limit) || 50), 200);
  const offset = (p - 1) * l;

  // Get columns
  const isMysql = db.kind === "mysql";
  let columns = [];
  if (isMysql) {
    const cols = await db.all(`DESCRIBE \`${safeTable}\``);
    columns = cols.map((c) => ({
      name: c.Field,
      type: c.Type,
      nullable: c.Null === "YES",
      key: c.Key,
      default: c.Default,
    }));
  } else {
    const cols = await db.all(`PRAGMA table_info(\`${safeTable}\`)`);
    columns = cols.map((c) => ({
      name: c.name,
      type: c.type,
      nullable: !c.notnull,
      key: c.pk ? "PRI" : "",
      default: c.dflt_value,
    }));
  }

  const totalRow = await db.get(`SELECT COUNT(*) AS total FROM \`${safeTable}\``);
  const total = Number(totalRow?.total || 0);

  let orderClause = "";
  if (sortBy && columns.some((c) => c.name === sortBy)) {
    const dir = String(sortDir).toUpperCase() === "ASC" ? "ASC" : "DESC";
    orderClause = `ORDER BY \`${sanitizeIdentifier(sortBy)}\` ${dir}`;
  } else {
    const pk = columns.find((c) => c.key === "PRI");
    if (pk) {
      orderClause = `ORDER BY \`${pk.name}\` DESC`;
    }
  }

  const query = `SELECT * FROM \`${safeTable}\` ${orderClause} LIMIT ${l} OFFSET ${offset}`;
  const rows = await db.all(query);

  return {
    tableName: safeTable,
    total,
    page: p,
    limit: l,
    totalPages: Math.ceil(total / l) || 1,
    columns,
    rows,
  };
}

/**
 * Executes an arbitrary SQL query entered by admin.
 */
async function executeSql(db, queryStr) {
  const raw = String(queryStr || "").trim();
  if (!raw) {
    throw new Error("Query cannot be empty.");
  }

  // Security guard against disastrous commands
  const upper = raw.toUpperCase();
  if (upper.includes("DROP DATABASE") || upper.includes("DROP SCHEMA")) {
    throw new Error("Action blocked: Dropping the entire database is disallowed for security.");
  }

  const isSelect = /^(SELECT|SHOW|DESCRIBE|EXPLAIN|PRAGMA)\b/i.test(raw);
  const start = Date.now();

  if (isSelect) {
    const rows = await db.all(raw);
    const durationMs = Date.now() - start;
    const firstRow = rows && rows[0] ? rows[0] : null;
    const columns = firstRow ? Object.keys(firstRow) : [];

    return {
      type: "select",
      columns,
      rows: rows || [],
      rowCount: (rows || []).length,
      durationMs,
    };
  } else {
    const result = await db.run(raw);
    const durationMs = Date.now() - start;

    return {
      type: "mutation",
      changes: result.changes,
      lastInsertRowid: result.lastInsertRowid,
      durationMs,
      message: `Query executed successfully. Affected rows: ${result.changes ?? 0}${
        result.lastInsertRowid ? `, Insert ID: ${result.lastInsertRowid}` : ""
      }`,
    };
  }
}

/**
 * Inserts a single record into a table.
 */
async function insertTableRow(db, tableName, rowData) {
  const safeTable = sanitizeIdentifier(tableName);
  if (!rowData || typeof rowData !== "object" || Object.keys(rowData).length === 0) {
    throw new Error("No data provided to insert.");
  }

  const keys = Object.keys(rowData).map(sanitizeIdentifier);
  const values = Object.values(rowData);
  const placeholders = keys.map(() => "?").join(", ");
  const colList = keys.map((k) => `\`${k}\``).join(", ");

  const sql = `INSERT INTO \`${safeTable}\` (${colList}) VALUES (${placeholders})`;
  const res = await db.run(sql, values);

  return {
    ok: true,
    lastInsertRowid: res.lastInsertRowid,
    changes: res.changes,
  };
}

/**
 * Deletes a record from a table by primary key.
 */
async function deleteTableRow(db, tableName, primaryKey, idValue) {
  const safeTable = sanitizeIdentifier(tableName);
  const safePk = sanitizeIdentifier(primaryKey);

  const sql = `DELETE FROM \`${safeTable}\` WHERE \`${safePk}\` = ?`;
  const res = await db.run(sql, [idValue]);

  return {
    ok: true,
    changes: res.changes,
  };
}

module.exports = {
  sanitizeIdentifier,
  listTables,
  getTableRows,
  executeSql,
  insertTableRow,
  deleteTableRow,
};
