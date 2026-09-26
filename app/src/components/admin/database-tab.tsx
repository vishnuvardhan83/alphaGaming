import { useState, useEffect } from "react";
import {
  Database,
  Table as TableIcon,
  Play,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Code,
  Check,
  AlertCircle,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/modal";
import {
  listDbTables,
  getDbTableRows,
  executeDbQuery,
  insertDbTableRow,
  deleteDbTableRow,
  type TableInfo,
  type TableRowsResult,
  type SqlQueryResult,
} from "@/lib/db";

const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
const labelCls = "text-xs font-semibold uppercase tracking-widest text-muted-foreground";
const primaryBtn =
  "rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5";
const dangerBtn =
  "rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground transition hover:border-destructive/50 hover:text-destructive flex items-center gap-1";

export function DatabaseTab() {
  const [dbKind, setDbKind] = useState("mysql");
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tableData, setTableData] = useState<TableRowsResult | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);

  // SQL Console state
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM users LIMIT 25;");
  const [executing, setExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState<SqlQueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Insert Row Modal
  const [insertModalOpen, setInsertModalOpen] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, string>>({});
  const [inserting, setInserting] = useState(false);

  // Delete Row Modal
  const [deleteModalRow, setDeleteModalRow] = useState<Record<string, any> | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTables = () => {
    setLoadingTables(true);
    listDbTables()
      .then((res) => {
        setDbKind(res.dbKind);
        setTables(res.tables);
        if (res.tables.length > 0 && !selectedTable) {
          setSelectedTable(res.tables[0].name);
        }
      })
      .catch((err) => {
        toast.error("Failed to load tables: " + err.message);
      })
      .finally(() => setLoadingTables(false));
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const loadTableRows = (tableName: string, p: number = 1, l: number = 25) => {
    if (!tableName) return;
    setLoadingRows(true);
    getDbTableRows(tableName, { page: p, limit: l })
      .then((data) => {
        setTableData(data);
        setPage(data.page);
        setLimit(data.limit);
      })
      .catch((err) => {
        toast.error(`Failed to load ${tableName}: ` + err.message);
      })
      .finally(() => setLoadingRows(false));
  };

  useEffect(() => {
    if (selectedTable) {
      loadTableRows(selectedTable, 1, limit);
    }
  }, [selectedTable]);

  async function handleExecuteSql(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!sqlQuery.trim()) {
      toast.error("Enter SQL query to execute.");
      return;
    }
    setExecuting(true);
    setQueryError(null);
    setQueryResult(null);
    try {
      const res = await executeDbQuery(sqlQuery.trim());
      setQueryResult(res);
      toast.success(res.type === "select" ? `Fetched ${res.rowCount} row(s)` : res.message || "Query executed");
      // Refresh tables and current table rows if mutation query
      if (res.type === "mutation") {
        fetchTables();
        if (selectedTable) loadTableRows(selectedTable, page, limit);
      }
    } catch (err: any) {
      setQueryError(err?.message || "SQL Execution Error");
      toast.error(err?.message || "SQL Execution Error");
    } finally {
      setExecuting(false);
    }
  }

  async function handleInsertRow(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTable) return;
    setInserting(true);
    try {
      // Filter out empty strings for auto-increment fields if not set
      const cleanRow: Record<string, any> = {};
      for (const [k, v] of Object.entries(newRowData)) {
        if (v !== "") cleanRow[k] = v;
      }
      await insertDbTableRow(selectedTable, cleanRow);
      toast.success(`Inserted new record into ${selectedTable}!`);
      setInsertModalOpen(false);
      setNewRowData({});
      fetchTables();
      loadTableRows(selectedTable, page, limit);
    } catch (err: any) {
      toast.error(err?.message || "Failed to insert record.");
    } finally {
      setInserting(false);
    }
  }

  async function handleDeleteRow() {
    if (!selectedTable || !deleteModalRow || !tableData) return;
    const pkCol = tableData.columns.find((c) => c.key === "PRI") || tableData.columns[0];
    if (!pkCol) {
      toast.error("No primary key found to delete record.");
      return;
    }
    const idVal = deleteModalRow[pkCol.name];
    setDeleting(true);
    try {
      await deleteDbTableRow(selectedTable, pkCol.name, idVal);
      toast.success(`Deleted record ${pkCol.name}=${idVal} from ${selectedTable}`);
      setDeleteModalRow(null);
      fetchTables();
      loadTableRows(selectedTable, page, limit);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete record.");
    } finally {
      setDeleting(false);
    }
  }

  const currentCols = tableData?.columns || [];
  const pkColumn = currentCols.find((c) => c.key === "PRI") || currentCols[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="font-display text-2xl font-bold flex items-center gap-2.5">
            <Database className="h-6 w-6 text-primary" /> Database & SQL Explorer
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Engine: <span className="font-semibold uppercase text-primary">{dbKind}</span> · {tables.length} tables ·
            Direct SQL commands, row insertion, and table browsing from the UI.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchTables();
            if (selectedTable) loadTableRows(selectedTable, page, limit);
          }}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loadingTables || loadingRows ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* SQL Console Section */}
      <div className="rounded-xl border border-border bg-card p-5 card-glow space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-bold flex items-center gap-2">
            <Code className="h-4 w-4 text-primary" /> SQL Query Console
          </h3>
          <div className="flex flex-wrap gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setSqlQuery("SELECT * FROM users LIMIT 25;")}
              className="px-2 py-1 rounded bg-background border border-border hover:border-primary/50 text-[11px]"
            >
              users
            </button>
            <button
              type="button"
              onClick={() => setSqlQuery("SELECT * FROM bookings ORDER BY id DESC LIMIT 25;")}
              className="px-2 py-1 rounded bg-background border border-border hover:border-primary/50 text-[11px]"
            >
              bookings
            </button>
            <button
              type="button"
              onClick={() => setSqlQuery("SELECT * FROM email_verifications ORDER BY id DESC LIMIT 10;")}
              className="px-2 py-1 rounded bg-background border border-border hover:border-primary/50 text-[11px]"
            >
              verifications
            </button>
            <button
              type="button"
              onClick={() => setSqlQuery("SELECT * FROM rewards_ledger ORDER BY id DESC LIMIT 25;")}
              className="px-2 py-1 rounded bg-background border border-border hover:border-primary/50 text-[11px]"
            >
              rewards
            </button>
          </div>
        </div>

        <form onSubmit={handleExecuteSql} className="space-y-3">
          <textarea
            rows={3}
            className={`${inputCls} font-mono text-xs`}
            placeholder="Write SQL query (SELECT, INSERT, UPDATE, DELETE)..."
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Tip: Supports parameterized and direct queries on MySQL/SQLite.
            </span>
            <button type="submit" disabled={executing} className={`${primaryBtn} px-4 py-1.5`}>
              {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              Execute Query
            </button>
          </div>
        </form>

        {/* Query Error */}
        {queryError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <pre className="font-mono whitespace-pre-wrap">{queryError}</pre>
          </div>
        )}

        {/* Query Result */}
        {queryResult && (
          <div className="rounded-lg border border-border bg-background/60 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {queryResult.type === "select"
                  ? `Returned ${queryResult.rowCount} rows`
                  : `Affected ${queryResult.changes ?? 0} rows`}{" "}
                in <strong className="text-foreground">{queryResult.durationMs}ms</strong>
              </span>
              {queryResult.lastInsertRowid && (
                <span className="text-primary font-semibold">
                  Last Insert ID: {queryResult.lastInsertRowid}
                </span>
              )}
            </div>

            {queryResult.type === "select" && queryResult.rows && queryResult.rows.length > 0 && (
              <div className="overflow-x-auto max-h-72 border border-border rounded">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-card uppercase tracking-wider text-[10px] text-muted-foreground border-b border-border sticky top-0">
                    <tr>
                      {queryResult.columns?.map((c) => (
                        <th key={c} className="p-2 border-r border-border font-semibold">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.rows.map((r, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/40 font-mono text-[11px]">
                        {queryResult.columns?.map((c) => (
                          <td key={c} className="p-2 border-r border-border/50 max-w-[200px] truncate">
                            {r[c] === null ? (
                              <span className="text-muted-foreground italic">NULL</span>
                            ) : typeof r[c] === "object" ? (
                              JSON.stringify(r[c])
                            ) : (
                              String(r[c])
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tables & Data Browser */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Table Selector (Left) */}
        <div className="md:col-span-1 rounded-xl border border-border bg-card p-4 space-y-3 card-glow">
          <h4 className="font-display text-sm font-bold flex items-center justify-between">
            <span>Tables ({tables.length})</span>
            {loadingTables && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
          </h4>
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {tables.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => setSelectedTable(t.name)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold transition text-left ${
                  selectedTable === t.name
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <TableIcon className="h-3.5 w-3.5 shrink-0" />
                  {t.name}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    selectedTable === t.name ? "bg-black/20 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {t.rowCount}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Table Rows Explorer (Right) */}
        <div className="md:col-span-3 rounded-xl border border-border bg-card p-5 card-glow space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <TableIcon className="h-5 w-5 text-primary" /> {selectedTable || "No Table Selected"}
              </h3>
              <p className="text-xs text-muted-foreground">
                Showing {tableData?.rows.length ?? 0} of {tableData?.total ?? 0} rows
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setNewRowData({});
                  setInsertModalOpen(true);
                }}
                disabled={!selectedTable}
                className={primaryBtn}
              >
                <Plus className="h-3.5 w-3.5" /> Insert Row
              </button>
            </div>
          </div>

          {/* Table Data */}
          {loadingRows ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !tableData || tableData.rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Table is empty. Click "Insert Row" to create records.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="overflow-x-auto max-h-[450px] border border-border rounded-lg">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted/80 uppercase text-[10px] font-bold text-muted-foreground border-b border-border sticky top-0">
                    <tr>
                      <th className="p-2 border-r border-border w-16">Action</th>
                      {tableData.columns.map((c) => (
                        <th key={c.name} className="p-2 border-r border-border font-semibold whitespace-nowrap">
                          {c.name}
                          {c.key === "PRI" && (
                            <span className="ml-1 text-[9px] text-primary font-bold">(PK)</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.rows.map((row, idx) => (
                      <tr key={idx} className="border-b border-border/40 hover:bg-muted/30 font-mono text-[11px]">
                        <td className="p-2 border-r border-border/40">
                          <button
                            type="button"
                            onClick={() => setDeleteModalRow(row)}
                            className={dangerBtn}
                            title="Delete this row"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </td>
                        {tableData.columns.map((c) => (
                          <td key={c.name} className="p-2 border-r border-border/40 max-w-[240px] truncate">
                            {row[c.name] === null ? (
                              <span className="text-muted-foreground italic">NULL</span>
                            ) : typeof row[c.name] === "object" ? (
                              JSON.stringify(row[c.name])
                            ) : (
                              String(row[c.name])
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>
                  Page {tableData.page} of {tableData.totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1 || loadingRows}
                    onClick={() => loadTableRows(selectedTable, page - 1, limit)}
                    className="p-1 rounded border border-border disabled:opacity-30 hover:bg-muted"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={page >= tableData.totalPages || loadingRows}
                    onClick={() => loadTableRows(selectedTable, page + 1, limit)}
                    className="p-1 rounded border border-border disabled:opacity-30 hover:bg-muted"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Insert Row Modal */}
      <Modal open={insertModalOpen} onClose={() => setInsertModalOpen(false)} title={`Insert into ${selectedTable}`}>
        <form onSubmit={handleInsertRow} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {currentCols.map((c) => (
            <div key={c.name}>
              <div className="flex items-center justify-between">
                <label className={labelCls}>
                  {c.name} {c.key === "PRI" && <span className="text-primary">(PK)</span>}
                </label>
                <span className="text-[10px] text-muted-foreground">{c.type}</span>
              </div>
              <input
                type="text"
                className={`${inputCls} mt-1`}
                placeholder={c.key === "PRI" ? "Auto-assigned if left blank" : `Value for ${c.name}`}
                value={newRowData[c.name] || ""}
                onChange={(e) => setNewRowData({ ...newRowData, [c.name]: e.target.value })}
              />
            </div>
          ))}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setInsertModalOpen(false)}
              className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button type="submit" disabled={inserting} className={primaryBtn}>
              {inserting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Insert Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Row Confirmation Modal */}
      <Modal open={Boolean(deleteModalRow)} onClose={() => setDeleteModalRow(null)} title="Delete Record">
        {deleteModalRow && pkColumn && (
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Are you sure you want to permanently delete this record from{" "}
              <strong className="text-primary">{selectedTable}</strong>?
            </p>
            <div className="rounded bg-muted/40 p-3 font-mono text-xs border border-border">
              {pkColumn.name}: <strong>{String(deleteModalRow[pkColumn.name])}</strong>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalRow(null)}
                className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteRow}
                className="rounded-md bg-destructive px-3.5 py-1.5 text-xs font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete Record
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
