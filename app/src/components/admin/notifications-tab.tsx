import { useState, useEffect } from "react";
import {
  Bell,
  Mail,
  Shield,
  ShieldCheck,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  RefreshCw,
  Save,
  Server,
  Key,
} from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/modal";
import {
  getNotificationSettings,
  updateNotificationSettings,
  sendTestEmail,
  type NotificationSettings,
  type ProviderSecretStatus,
  type TestNotificationResult,
} from "@/lib/db";

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary";
const selectCls =
  "w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary";
const labelCls = "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

interface ToggleCardProps {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (val: boolean) => void;
  icon?: typeof Mail;
  disabled?: boolean;
}

function ToggleCard({
  title,
  description,
  enabled,
  onChange,
  icon: Icon,
  disabled = false,
}: ToggleCardProps) {
  return (
    <div
      onClick={() => !disabled && onChange(!enabled)}
      className={`group relative flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
        enabled
          ? "border-primary/40 bg-primary/5 shadow-sm shadow-primary/5 hover:border-primary/60"
          : "border-border bg-card/60 hover:border-border hover:bg-card"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <div className="flex items-start gap-3.5">
        {Icon && (
          <div
            className={`mt-0.5 rounded-lg p-2 transition ${
              enabled ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-semibold text-foreground">
              {title}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) onChange(!enabled);
        }}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          enabled ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-md ring-0 transition duration-200 ease-in-out ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export function NotificationsTab() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [providerStatus, setProviderStatus] = useState<ProviderSecretStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Test Action State (Email Only)
  const [testEmailModal, setTestEmailModal] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState("");
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<TestNotificationResult | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getNotificationSettings();
      setSettings(res.settings);
      setProviderStatus(res.providerStatus);
      setTestEmailTo(res.settings.admin_email || "");
      setHasChanges(false);
    } catch (err: any) {
      toast.error("Failed to load notification settings: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const updateField = <K extends keyof NotificationSettings>(
    key: K,
    val: NotificationSettings[K]
  ) => {
    if (!settings) return;
    setSettings((prev) => (prev ? { ...prev, [key]: val } : prev));
    setHasChanges(true);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      const res = await updateNotificationSettings({
        email_enabled: settings.email_enabled,
        sms_enabled: false, // Enforce false (email only)
        customer_email_otp_enabled: settings.customer_email_otp_enabled,
        customer_sms_otp_enabled: false,
        booking_email_enabled: settings.booking_email_enabled,
        booking_sms_enabled: false,
        admin_booking_email_enabled: settings.admin_booking_email_enabled,
        admin_booking_sms_enabled: false,
        admin_email: settings.admin_email,
        admin_phone: settings.admin_phone,
        email_provider: settings.email_provider,
        sms_provider: "disabled",
        otp_length: settings.otp_length,
        otp_expiry_minutes: settings.otp_expiry_minutes,
        otp_max_attempts: settings.otp_max_attempts,
        resend_cooldown_seconds: settings.resend_cooldown_seconds,
      });

      setSettings(res.settings);
      setProviderStatus(res.providerStatus);
      setHasChanges(false);
      toast.success("Notification settings saved successfully.");
    } catch (err: any) {
      toast.error("Failed to save settings: " + (err.message || "Validation error"));
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    setSendingTestEmail(true);
    setTestEmailResult(null);
    try {
      const res = await sendTestEmail(testEmailTo || undefined);
      setTestEmailResult(res);
      toast.success(res.message || "Test email dispatched successfully!");
    } catch (err: any) {
      toast.error("Test email failed: " + (err.message || "Provider error"));
    } finally {
      setSendingTestEmail(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex min-h-[350px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading notification configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Status Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Bell className="h-5 w-5" />
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Notification Settings (Email Only)
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure automated customer &amp; admin email alerts. SMS option is removed (no SMS API key required).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary/50 hover:text-foreground cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reload
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving || !hasChanges}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save Settings
          </button>
        </div>
      </div>

      {/* Backend Security Architecture Banner */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-5 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="mt-0.5 rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-sm font-bold text-foreground">
                Secure Email Provider Active
              </h3>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400 uppercase">
                Zero Leakage Active
              </span>
              <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary uppercase">
                Email-Only Mode
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              SMS is completely disabled because no SMS API key is configured. All OTP authentications, booking receipts, and admin alerts are dispatched exclusively via your configured Email Provider. Credentials remain strictly server-side.
            </p>

            {/* Provider Status Cards */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Gmail / SMTP */}
              <div className="rounded-lg border border-border bg-background/60 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    Gmail / SMTP
                  </span>
                  {providerStatus?.email?.smtp?.configured ? (
                    <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                      CONNECTED
                    </span>
                  ) : (
                    <span className="rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-400">
                      ENV UNSET
                    </span>
                  )}
                </div>
                <div className="mt-2 space-y-1 text-[11px] font-mono text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Host:</span>
                    <span className="text-foreground">{providerStatus?.email?.smtp?.host || "smtp.gmail.com"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>User:</span>
                    <span className="text-foreground">{providerStatus?.email?.smtp?.user || "Not configured"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Password:</span>
                    <span className="text-emerald-400">
                      {providerStatus?.email?.smtp?.configured ? "••••••••••••" : "Missing"}
                    </span>
                  </div>
                </div>
              </div>

              {/* EmailJS Card */}
              <div className="rounded-lg border border-border bg-background/60 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    EmailJS API
                  </span>
                  {providerStatus?.email?.emailjs?.configured ? (
                    <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                      CONNECTED
                    </span>
                  ) : (
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
                      STANDBY
                    </span>
                  )}
                </div>
                <div className="mt-2 space-y-1 text-[11px] font-mono text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Service:</span>
                    <span className="text-foreground">{providerStatus?.email?.emailjs?.serviceId || "Not set"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Key:</span>
                    <span className="text-emerald-400">
                      {providerStatus?.email?.emailjs?.configured ? "••••••••••••" : "Missing"}
                    </span>
                  </div>
                </div>
              </div>

              {/* SMS Mode Card */}
              <div className="rounded-lg border border-border bg-background/60 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                    SMS Channel
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
                    DISABLED
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                  SMS option is disabled. No external SMS provider or paid balance required.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Master Email Switch */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-foreground">
              1. Master Delivery Channel
            </h3>
            <span className="text-xs text-muted-foreground">
              Master switch controlling all outgoing emails
            </span>
          </div>

          <ToggleCard
            title="Email Notifications"
            description="Globally enable or disable all outgoing email messages across the arena"
            enabled={settings.email_enabled}
            onChange={(v) => updateField("email_enabled", v)}
            icon={Mail}
          />
        </div>

        {/* Section 2: Triggers */}
        <div>
          <div className="mb-3">
            <h3 className="font-display text-base font-bold text-foreground">
              2. Email Notification Triggers &amp; Flow
            </h3>
            <p className="text-xs text-muted-foreground">
              Fine-tune which transactional events trigger automatic communications
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ToggleCard
              title="Customer Email OTP"
              description="Send 6-digit verification code to user email during registration and password reset"
              enabled={settings.customer_email_otp_enabled}
              onChange={(v) => updateField("customer_email_otp_enabled", v)}
              disabled={!settings.email_enabled}
              icon={Mail}
            />
            <ToggleCard
              title="Booking Confirmation Email"
              description="Send automated confirmation receipt to customer upon booking creation"
              enabled={settings.booking_email_enabled}
              onChange={(v) => updateField("booking_email_enabled", v)}
              disabled={!settings.email_enabled}
              icon={Mail}
            />
            <ToggleCard
              title="Admin Booking Email"
              description="Send instant alert email to Admin when a customer places a new booking"
              enabled={settings.admin_booking_email_enabled}
              onChange={(v) => updateField("admin_booking_email_enabled", v)}
              disabled={!settings.email_enabled}
              icon={Mail}
            />
          </div>
        </div>

        {/* Section 3: Admin Recipient & Provider */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Admin Email */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Admin Notification Recipient
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Designated administrative inbox for booking notifications
            </p>

            <div className="mt-4">
              <label className={labelCls}>Admin Email</label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={settings.admin_email}
                  onChange={(e) => updateField("admin_email", e.target.value)}
                  placeholder="admin@example.com"
                  className={`${inputCls} pl-9`}
                  required
                />
              </div>
              <span className="mt-1 block text-[11px] text-muted-foreground">
                Receives instant booking alerts and test dispatches
              </span>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              Active Email Provider
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Select which backend dispatch engine handles outgoing emails
            </p>

            <div className="mt-4">
              <label className={labelCls}>Email Provider</label>
              <select
                value={settings.email_provider}
                onChange={(e) => updateField("email_provider", e.target.value)}
                className={`mt-1.5 ${selectCls}`}
              >
                <option value="gmail">Gmail (Nodemailer / App Password)</option>
                <option value="smtp">Custom SMTP Server</option>
                <option value="emailjs">EmailJS REST API</option>
                <option value="mock">Mock Provider (Safe Dev / Console)</option>
              </select>
              <span className="mt-1 block text-[11px] text-muted-foreground">
                Credentials configured in server environment (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD)
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: OTP Parameters */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div>
            <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              OTP &amp; Authentication Security Parameters
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Govern passcode generation, expiration windows, and brute-force defenses
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={labelCls}>OTP Length</label>
              <input
                type="number"
                min={4}
                max={10}
                value={settings.otp_length}
                onChange={(e) => updateField("otp_length", Number(e.target.value))}
                className={`mt-1.5 ${inputCls}`}
                required
              />
              <span className="mt-1 block text-[11px] text-muted-foreground">
                Between 4 and 10 digits (Default: 6)
              </span>
            </div>

            <div>
              <label className={labelCls}>Expiry Window (Minutes)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={settings.otp_expiry_minutes}
                onChange={(e) => updateField("otp_expiry_minutes", Number(e.target.value))}
                className={`mt-1.5 ${inputCls}`}
                required
              />
              <span className="mt-1 block text-[11px] text-muted-foreground">
                Code validity window (Default: 5 min)
              </span>
            </div>

            <div>
              <label className={labelCls}>Max Attempts</label>
              <input
                type="number"
                min={1}
                max={10}
                value={settings.otp_max_attempts}
                onChange={(e) => updateField("otp_max_attempts", Number(e.target.value))}
                className={`mt-1.5 ${inputCls}`}
                required
              />
              <span className="mt-1 block text-[11px] text-muted-foreground">
                Failed tries before lockout (Default: 5)
              </span>
            </div>

            <div>
              <label className={labelCls}>Resend Cooldown (Seconds)</label>
              <input
                type="number"
                min={10}
                max={300}
                value={settings.resend_cooldown_seconds}
                onChange={(e) => updateField("resend_cooldown_seconds", Number(e.target.value))}
                className={`mt-1.5 ${inputCls}`}
                required
              />
              <span className="mt-1 block text-[11px] text-muted-foreground">
                Cooldown between resends (Default: 60s)
              </span>
            </div>
          </div>
        </div>

        {/* Section 5: Testing Action */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                Live Channel Diagnostics
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Validate email delivery safely without exposing backend passwords
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setTestEmailModal(true);
                setTestEmailResult(null);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20 cursor-pointer"
            >
              <Mail className="h-3.5 w-3.5" />
              Send Test Email
            </button>
          </div>
        </div>
      </form>

      {/* Test Email Modal */}
      <Modal
        open={testEmailModal}
        onClose={() => setTestEmailModal(false)}
        title="Send Test Email Transmissions"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Dispatches a verification email using the active provider (<strong>{settings.email_provider}</strong>).
          </p>

          <div>
            <label className={labelCls}>Recipient Email</label>
            <input
              type="email"
              value={testEmailTo}
              onChange={(e) => setTestEmailTo(e.target.value)}
              placeholder="recipient@example.com"
              className={`mt-1.5 ${inputCls}`}
              required
            />
          </div>

          {testEmailResult && (
            <div
              className={`rounded-lg border p-3 text-xs ${
                testEmailResult.success
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-red-500/30 bg-red-500/10 text-red-300"
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {testEmailResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                )}
                <span>{testEmailResult.message}</span>
              </div>
              {testEmailResult.provider && (
                <div className="mt-1 font-mono text-[11px] opacity-80">
                  Provider: {testEmailResult.provider} · ID: {testEmailResult.messageId || "N/A"}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setTestEmailModal(false)}
              className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={sendingTestEmail || !testEmailTo.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {sendingTestEmail ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Send Email
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
