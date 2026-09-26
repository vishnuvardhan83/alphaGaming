import { useState, useEffect } from "react";
import {
  KeyRound,
  ShieldCheck,
  Check,
  X,
  Copy,
  Loader2,
  Eye,
  EyeOff,
  Search,
  Sparkles,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  cryptoVerifyPassword,
  cryptoHashPassword,
  cryptoInspectHash,
  cryptoCheckUserPassword,
  cryptoInspectOtp,
  listUsers,
  type AdminUser,
  type HashMeta,
} from "@/lib/db";

const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
const labelCls = "text-xs font-semibold uppercase tracking-widest text-muted-foreground";
const primaryBtn =
  "rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5";

export function CryptoTab() {
  // Mode selection
  const [activeTool, setActiveTool] = useState<"check_user" | "verify" | "hash" | "otp">("check_user");

  // Users list for dropdown
  const [users, setUsers] = useState<AdminUser[]>([]);
  useEffect(() => {
    void listUsers().then(setUsers).catch(() => {});
  }, []);

  // Tool 1: Check User Password
  const [userQuery, setUserQuery] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [showUserPass, setShowUserPass] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);
  const [userCheckResult, setUserCheckResult] = useState<any | null>(null);

  // Tool 2: Verify Password vs Hash
  const [plainInput, setPlainInput] = useState("");
  const [hashInput, setHashInput] = useState("");
  const [showPlain, setShowPlain] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any | null>(null);

  // Tool 3: Hash Password
  const [genPassInput, setGenPassInput] = useState("");
  const [genRounds, setGenRounds] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [hashResult, setHashResult] = useState<any | null>(null);

  // Tool 4: OTP Inspector
  const [otpEmail, setOtpEmail] = useState("");
  const [testOtpCode, setTestOtpCode] = useState("");
  const [inspectingOtp, setInspectingOtp] = useState(false);
  const [otpResult, setOtpResult] = useState<any | null>(null);

  async function handleCheckUser(e: React.FormEvent) {
    e.preventDefault();
    if (!userQuery.trim()) {
      toast.error("Enter user name, email, or phone.");
      return;
    }
    if (!userPassword) {
      toast.error("Enter password to test.");
      return;
    }
    setCheckingUser(true);
    setUserCheckResult(null);
    try {
      const res = await cryptoCheckUserPassword(userQuery.trim(), userPassword);
      setUserCheckResult(res);
      if (res.match) {
        toast.success(`Password matches account for ${res.user.name}!`);
      } else {
        toast.error(`Password does NOT match account for ${res.user.name}.`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to check user password.");
    } finally {
      setCheckingUser(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!plainInput) {
      toast.error("Enter plaintext password.");
      return;
    }
    if (!hashInput.trim()) {
      toast.error("Enter bcrypt hash.");
      return;
    }
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await cryptoVerifyPassword(plainInput, hashInput.trim());
      setVerifyResult(res);
      if (res.match) {
        toast.success("Password MATCHES hash!");
      } else {
        toast.error("Password does NOT match hash.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to verify password.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleHash(e: React.FormEvent) {
    e.preventDefault();
    if (!genPassInput) {
      toast.error("Enter password to hash.");
      return;
    }
    setGenerating(true);
    try {
      const res = await cryptoHashPassword(genPassInput, genRounds);
      setHashResult(res);
      toast.success("Bcrypt hash generated successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate hash.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleInspectOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otpEmail.trim()) {
      toast.error("Enter email to look up.");
      return;
    }
    setInspectingOtp(true);
    try {
      const res = await cryptoInspectOtp(otpEmail.trim(), testOtpCode.trim());
      setOtpResult(res);
      if (res.found) {
        toast.success(`Found ${res.verifications.length} verification record(s).`);
      } else {
        toast.info("No active verifications found for this email.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to inspect OTP.");
    } finally {
      setInspectingOtp(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="font-display text-2xl font-bold flex items-center gap-2.5">
            <KeyRound className="h-6 w-6 text-primary" /> Crypto & Password Tool
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Verify passwords against stored hashes, test user credentials, inspect bcrypt hashes, and check OTPs.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex rounded-lg border border-border p-1 bg-card text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTool("check_user")}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTool === "check_user" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Check User Pass
          </button>
          <button
            type="button"
            onClick={() => setActiveTool("verify")}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTool === "verify" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Verify Plain vs Hash
          </button>
          <button
            type="button"
            onClick={() => setActiveTool("hash")}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTool === "hash" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Generate Hash
          </button>
          <button
            type="button"
            onClick={() => setActiveTool("otp")}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTool === "otp" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            OTP Inspector
          </button>
        </div>
      </div>

      {/* TOOL 1: Check User Password */}
      {activeTool === "check_user" && (
        <div className="rounded-xl border border-border bg-card p-6 card-glow space-y-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold">Check User Password</h3>
              <p className="text-xs text-muted-foreground">
                Validate whether a suspected password matches a specific user account in the database.
              </p>
            </div>
          </div>

          <form onSubmit={handleCheckUser} className="space-y-4 max-w-xl">
            <div>
              <label className={labelCls}>User Identifier (Email, Phone, or ID)</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  className={inputCls}
                  placeholder="e.g. vishnuvadlamudi2003@gmail.com, 889977665544, or User ID"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  required
                />
                {users.length > 0 && (
                  <select
                    className="rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary max-w-[160px]"
                    onChange={(e) => {
                      if (e.target.value) setUserQuery(e.target.value);
                    }}
                    value=""
                  >
                    <option value="">Select User...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.email || u.phone}>
                        {u.name} ({u.email || u.phone})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div>
              <label className={labelCls}>Plaintext Password to Test</label>
              <div className="relative mt-1">
                <input
                  type={showUserPass ? "text" : "password"}
                  className={`${inputCls} pr-10`}
                  placeholder="Enter password to test"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowUserPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showUserPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={checkingUser} className={`${primaryBtn} px-5 py-2`}>
              {checkingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Test User Password
            </button>
          </form>

          {/* Result Card */}
          {userCheckResult && (
            <div
              className={`rounded-lg border p-4 space-y-3 mt-4 ${
                userCheckResult.match
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-red-500/30 bg-red-500/10 text-red-300"
              }`}
            >
              <div className="flex items-center gap-2 font-display text-base font-bold">
                {userCheckResult.match ? (
                  <>
                    <Check className="h-5 w-5 text-emerald-400" />
                    <span className="text-emerald-400">PASSWORD MATCHES!</span>
                  </>
                ) : (
                  <>
                    <X className="h-5 w-5 text-red-400" />
                    <span className="text-red-400">PASSWORD INCORRECT</span>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 border-t border-border/40 text-foreground">
                <div>
                  <span className="text-muted-foreground block">Name:</span>
                  <span className="font-semibold">{userCheckResult.user.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Phone:</span>
                  <span className="font-semibold">{userCheckResult.user.phone}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Email:</span>
                  <span className="font-semibold">{userCheckResult.user.email || "None"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Role:</span>
                  <span className="font-semibold uppercase">{userCheckResult.user.role}</span>
                </div>
              </div>

              <div className="text-xs pt-1 text-muted-foreground space-y-1">
                <p>
                  <span className="font-semibold text-foreground">Stored Hash: </span>
                  <code className="bg-background/80 px-1.5 py-0.5 rounded text-[11px] font-mono break-all">
                    {userCheckResult.passwordHash}
                  </code>
                </p>
                <p>
                  Bcrypt Cost: {userCheckResult.hashMeta?.rounds ?? 10} rounds | Version:{" "}
                  {userCheckResult.hashMeta?.version ?? "2b"}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TOOL 2: Verify Plain vs Hash */}
      {activeTool === "verify" && (
        <div className="rounded-xl border border-border bg-card p-6 card-glow space-y-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold">Verify Plaintext vs Hash</h3>
              <p className="text-xs text-muted-foreground">
                Paste any bcrypt hash (e.g. $2a$10$...) and plaintext to test if they match.
              </p>
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-4 max-w-xl">
            <div>
              <label className={labelCls}>Plaintext Password</label>
              <div className="relative mt-1">
                <input
                  type={showPlain ? "text" : "password"}
                  className={`${inputCls} pr-10`}
                  placeholder="e.g. vishnu9908"
                  value={plainInput}
                  onChange={(e) => setPlainInput(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPlain((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPlain ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className={labelCls}>Bcrypt Hash</label>
              <input
                type="text"
                className={`${inputCls} font-mono text-xs`}
                placeholder="$2b$10$..."
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={verifying} className={`${primaryBtn} px-5 py-2`}>
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Verify Hash Match
            </button>
          </form>

          {verifyResult && (
            <div
              className={`rounded-lg border p-4 space-y-2 max-w-xl ${
                verifyResult.match
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/30 bg-red-500/10 text-red-400"
              }`}
            >
              <div className="flex items-center gap-2 font-display text-base font-bold">
                {verifyResult.match ? (
                  <>
                    <Check className="h-5 w-5" /> MATCHES
                  </>
                ) : (
                  <>
                    <X className="h-5 w-5" /> DOES NOT MATCH
                  </>
                )}
              </div>
              {verifyResult.hashMeta && (
                <p className="text-xs text-muted-foreground">
                  Valid Bcrypt: {verifyResult.hashMeta.valid ? "Yes" : "No"} | Cost:{" "}
                  {verifyResult.hashMeta.rounds} rounds | Version: {verifyResult.hashMeta.version}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* TOOL 3: Generate Bcrypt Hash */}
      {activeTool === "hash" && (
        <div className="rounded-xl border border-border bg-card p-6 card-glow space-y-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold">Generate Bcrypt Hash</h3>
              <p className="text-xs text-muted-foreground">
                Hash any plaintext password using bcrypt with custom cost factor.
              </p>
            </div>
          </div>

          <form onSubmit={handleHash} className="space-y-4 max-w-xl">
            <div>
              <label className={labelCls}>Password to Hash</label>
              <input
                type="text"
                className={inputCls}
                placeholder="Enter password"
                value={genPassInput}
                onChange={(e) => setGenPassInput(e.target.value)}
                required
              />
            </div>

            <div>
              <label className={labelCls}>Cost / Salt Rounds (Default: 10)</label>
              <select
                className={inputCls}
                value={genRounds}
                onChange={(e) => setGenRounds(Number(e.target.value))}
              >
                <option value={8}>8 (Fastest - Testing)</option>
                <option value={10}>10 (Recommended Production)</option>
                <option value={12}>12 (High Security)</option>
              </select>
            </div>

            <button type="submit" disabled={generating} className={`${primaryBtn} px-5 py-2`}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Generate Hash
            </button>
          </form>

          {hashResult && (
            <div className="rounded-lg border border-border bg-background/80 p-4 space-y-3 max-w-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Generated Hash:</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(hashResult.hash);
                    toast.success("Hash copied to clipboard!");
                  }}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </button>
              </div>
              <code className="block bg-card p-3 rounded border border-border font-mono text-xs break-all text-foreground">
                {hashResult.hash}
              </code>
              <p className="text-[11px] text-muted-foreground">
                Algorithm: bcrypt ($2b$) | Rounds: {hashResult.rounds} | Length: {hashResult.hash.length} chars
              </p>
            </div>
          )}
        </div>
      )}

      {/* TOOL 4: OTP Inspector */}
      {activeTool === "otp" && (
        <div className="rounded-xl border border-border bg-card p-6 card-glow space-y-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Search className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold">OTP & Verification Inspector</h3>
              <p className="text-xs text-muted-foreground">
                View active email verification hashes in the database and test candidate OTP codes.
              </p>
            </div>
          </div>

          <form onSubmit={handleInspectOtp} className="space-y-4 max-w-xl">
            <div>
              <label className={labelCls}>Email Address</label>
              <input
                type="email"
                className={inputCls}
                placeholder="e.g. vishnuvadlamudi2003@gmail.com"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className={labelCls}>Test OTP Code (Optional)</label>
              <input
                type="text"
                maxLength={6}
                className={inputCls}
                placeholder="6-digit code to test"
                value={testOtpCode}
                onChange={(e) => setTestOtpCode(e.target.value)}
              />
            </div>

            <button type="submit" disabled={inspectingOtp} className={`${primaryBtn} px-5 py-2`}>
              {inspectingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Inspect OTPs
            </button>
          </form>

          {otpResult && (
            <div className="space-y-3 max-w-2xl">
              <h4 className="font-semibold text-sm">
                Records for {otpResult.email} ({otpResult.verifications.length})
              </h4>
              {otpResult.verifications.length === 0 ? (
                <p className="text-xs text-muted-foreground">No verifications found in database.</p>
              ) : (
                <div className="space-y-2">
                  {otpResult.verifications.map((v: any) => (
                    <div
                      key={v.id}
                      className="rounded-lg border border-border bg-background/60 p-3 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold uppercase tracking-wider text-primary">
                          {v.purpose} (ID: {v.id})
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            v.expired ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          {v.expired ? "EXPIRED" : "ACTIVE"}
                        </span>
                      </div>
                      <p className="text-muted-foreground break-all">
                        <span className="text-foreground">HMAC-SHA256 Hash: </span>
                        <code>{v.otpHash}</code>
                      </p>
                      {v.testedOtpMatch !== null && (
                        <div
                          className={`p-2 rounded mt-1 font-semibold flex items-center gap-1.5 ${
                            v.testedOtpMatch
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {v.testedOtpMatch ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                          Code "{testOtpCode}" {v.testedOtpMatch ? "MATCHES THIS OTP RECORD!" : "Does not match"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
