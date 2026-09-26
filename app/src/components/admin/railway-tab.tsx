import { useState, useEffect } from "react";
import {
  Sliders,
  Server,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertCircle,
  Save,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/modal";
import {
  getRailwayVariables,
  setRailwayVariable,
  deleteRailwayVariable,
  type RailwayVariablesResult,
} from "@/lib/db";

const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary font-mono";
const labelCls = "text-xs font-semibold uppercase tracking-widest text-muted-foreground";
const primaryBtn =
  "rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5";
const ghostBtn =
  "rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground transition hover:border-primary/50 hover:text-primary flex items-center gap-1";
const dangerBtn =
  "rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground transition hover:border-destructive/50 hover:text-destructive flex items-center gap-1";

export function RailwayTab() {
  const [data, setData] = useState<RailwayVariablesResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showAllValues, setShowAllValues] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});

  // Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [varName, setVarName] = useState("");
  const [varValue, setVarValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deleteModalKey, setDeleteModalKey] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchVariables = () => {
    setLoading(true);
    getRailwayVariables()
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        toast.error("Failed to fetch Railway variables: " + err.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVariables();
  }, []);

  const toggleReveal = (key: string) => {
    setRevealedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  function openCreateModal(defaultKey: string = "", defaultValue: string = "") {
    setVarName(defaultKey);
    setVarValue(defaultValue);
    setIsEditing(false);
    setEditModalOpen(true);
  }

  function openEditModal(key: string, value: string) {
    setVarName(key);
    setVarValue(value);
    setIsEditing(true);
    setEditModalOpen(true);
  }

  async function handleSaveVariable(e: React.FormEvent) {
    e.preventDefault();
    const cleanKey = varName.trim().toUpperCase();
    if (!cleanKey) {
      toast.error("Variable name is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await setRailwayVariable(cleanKey, varValue);
      toast.success(res.message);
      setEditModalOpen(false);
      fetchVariables();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update Railway variable.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteVariable() {
    if (!deleteModalKey) return;
    setDeleting(true);
    try {
      await deleteRailwayVariable(deleteModalKey);
      toast.success(`Variable ${deleteModalKey} deleted.`);
      setDeleteModalKey(null);
      fetchVariables();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete variable.");
    } finally {
      setDeleting(false);
    }
  }

  const variables = data?.variables || {};
  const entries = Object.entries(variables).sort(([a], [b]) => a.localeCompare(b));
  const filtered = entries.filter(
    ([k, v]) =>
      k.toLowerCase().includes(search.toLowerCase()) ||
      String(v).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="font-display text-2xl font-bold flex items-center gap-2.5">
            <Sliders className="h-6 w-6 text-primary" /> Railway Variables & Environment
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage environment variables in Railway directly from the admin UI.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchVariables}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => openCreateModal()}
            className={primaryBtn}
          >
            <Plus className="h-3.5 w-3.5" /> Add Variable
          </button>
        </div>
      </div>

      {/* Info Card */}
      {data && (
        <div className="rounded-xl border border-border bg-card p-4 card-glow grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground block">Sync Source:</span>
            <span className="font-semibold uppercase text-primary font-mono">{data.source}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Project ID:</span>
            <span className="font-mono text-[11px] truncate block" title={data.projectId}>
              {data.projectId}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block">Environment ID:</span>
            <span className="font-mono text-[11px] truncate block" title={data.environmentId}>
              {data.environmentId}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block">Service ID:</span>
            <span className="font-mono text-[11px] truncate block" title={data.serviceId}>
              {data.serviceId}
            </span>
          </div>
        </div>
      )}

      {/* Quick Setup Presets */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2 card-glow">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Quick Preset Variables:
        </span>
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            "EMAILJS_SERVICE_ID",
            "EMAILJS_TEMPLATE_ID",
            "EMAILJS_PUBLIC_KEY",
            "EMAILJS_PRIVATE_KEY",
            "ADMIN_EMAIL",
            "ADMIN_PHONES",
            "ADMIN_PASSWORD",
            "JWT_SECRET",
          ].map((key) => {
            const isSet = variables[key] !== undefined;
            return (
              <button
                key={key}
                type="button"
                onClick={() => openCreateModal(key, variables[key] || "")}
                className={`px-2.5 py-1 rounded text-xs font-mono transition flex items-center gap-1.5 border ${
                  isSet
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    : "border-border bg-background hover:border-primary/50 text-muted-foreground"
                }`}
              >
                {isSet ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                {key}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Bulk Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            className={`${inputCls} pl-9 text-xs`}
            placeholder="Search variables by name or value..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowAllValues((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          {showAllValues ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showAllValues ? "Mask all values" : "Reveal all values"}
        </button>
      </div>

      {/* Variables Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden card-glow">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-muted/80 uppercase text-[10px] font-bold text-muted-foreground border-b border-border">
              <tr>
                <th className="p-3 w-1/3">Variable Name</th>
                <th className="p-3">Value</th>
                <th className="p-3 text-right w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-muted-foreground">
                    No variables match your search.
                  </td>
                </tr>
              ) : (
                filtered.map(([key, val]) => {
                  const isVisible = showAllValues || !!revealedKeys[key];
                  return (
                    <tr key={key} className="border-b border-border/40 hover:bg-muted/30">
                      <td className="p-3 font-mono font-semibold text-foreground">
                        {key}
                      </td>
                      <td className="p-3 font-mono text-xs">
                        <div className="flex items-center gap-2 max-w-md">
                          <span className="truncate">
                            {isVisible ? String(val) : "••••••••••••••••"}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleReveal(key)}
                            className="text-muted-foreground hover:text-foreground shrink-0"
                            title={isVisible ? "Hide" : "Show"}
                          >
                            {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(String(val));
                              toast.success(`Copied ${key} to clipboard!`);
                            }}
                            className="text-muted-foreground hover:text-foreground shrink-0"
                            title="Copy value"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(key, String(val))}
                            className={ghostBtn}
                            title="Edit variable"
                          >
                            <Edit2 className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteModalKey(key)}
                            className={dangerBtn}
                            title="Delete variable"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Variable Modal */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={isEditing ? `Edit ${varName}` : "Add Environment Variable"}
      >
        <form onSubmit={handleSaveVariable} className="space-y-4">
          <div>
            <label className={labelCls}>Variable Name</label>
            <input
              type="text"
              disabled={isEditing}
              className={`${inputCls} mt-1 ${isEditing ? "opacity-60" : ""}`}
              placeholder="e.g. EMAILJS_SERVICE_ID"
              value={varName}
              onChange={(e) => setVarName(e.target.value.toUpperCase())}
              required
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Must use uppercase letters, numbers, and underscores.
            </p>
          </div>

          <div>
            <label className={labelCls}>Variable Value</label>
            <textarea
              rows={3}
              className={`${inputCls} mt-1`}
              placeholder="Value"
              value={varValue}
              onChange={(e) => setVarValue(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className={primaryBtn}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isEditing ? "Update Variable" : "Save Variable"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={Boolean(deleteModalKey)} onClose={() => setDeleteModalKey(null)} title="Delete Variable">
        {deleteModalKey && (
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Are you sure you want to delete the variable{" "}
              <strong className="text-primary font-mono">{deleteModalKey}</strong> from Railway?
            </p>
            <p className="text-xs text-muted-foreground">
              This will remove the variable and trigger a reload or redeploy if configured.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalKey(null)}
                className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteVariable}
                className="rounded-md bg-destructive px-3.5 py-1.5 text-xs font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete Variable
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
