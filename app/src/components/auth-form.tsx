import { useEffect, useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Lock,
  Phone,
  User as UserIcon,
  Mail,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  Clock,
  RefreshCw,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { SetupNotice } from "./setup-notice";

type Mode = "login" | "register" | "verify" | "forgot";
type ForgotStep = "email" | "otp" | "password" | "success";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthForm({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  const {
    user,
    configured,
    login,
    register,
    verifyEmail,
    resendVerificationOtp,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
  } = useAuth();
  const navigate = useNavigate();

  // Mode state
  const [mode, setMode] = useState<Mode>("login");
  const [forgotStep, setForgotStep] = useState<ForgotStep>("email");

  // Form fields
  const [identifier, setIdentifier] = useState(""); // phone or email for login
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Expiration countdown (5 minutes = 300 seconds)
  const [expirySeconds, setExpirySeconds] = useState<number>(300);
  // Resend cooldown countdown (60 seconds)
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  const expiryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Redirect if already authenticated and verified
  useEffect(() => {
    if (user && user.emailVerified !== false && mode !== "verify") {
      if (redirectTo.includes("#") || redirectTo.includes("?")) {
        window.location.href = redirectTo;
      } else {
        navigate({ to: redirectTo as any });
      }
    }
  }, [user, navigate, redirectTo, mode]);

  // Handle countdown timers
  useEffect(() => {
    if (mode === "verify" || (mode === "forgot" && forgotStep === "otp")) {
      // Start 5-minute countdown
      setExpirySeconds(300);
      if (expiryTimerRef.current) clearInterval(expiryTimerRef.current);
      expiryTimerRef.current = setInterval(() => {
        setExpirySeconds((prev) => {
          if (prev <= 1) {
            if (expiryTimerRef.current) clearInterval(expiryTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Start 60-second resend cooldown
      setCooldownSeconds(60);
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
      cooldownTimerRef.current = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (expiryTimerRef.current) clearInterval(expiryTimerRef.current);
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, [mode, forgotStep]);

  if (!configured) return <SetupNotice feature="Accounts & sign-in" />;

  function formatTimer(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  // --- Handlers ---

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    const idVal = identifier.trim();
    if (!idVal) {
      setError("Please enter your phone number or email.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setBusy(true);
    try {
      const res: any = await login({ identifier: idVal, password });
      if (res?.requiresVerification) {
        if (res.email) setEmail(res.email);
        setOtp("");
        setRegistrationToken(null);
        setMode("verify");
        setSuccessMsg(
          res.message || "Please enter the 6-digit verification code sent to your email to sign in."
        );
        return;
      }
      if (redirectTo.includes("#") || redirectTo.includes("?")) {
        window.location.href = redirectTo;
      } else {
        navigate({ to: redirectTo as any });
      }
    } catch (err: any) {
      if (err?.requiresVerification || err?.data?.requiresVerification) {
        const targetEmail = err.email || err.data?.email || (idVal.includes("@") ? idVal : "");
        if (targetEmail) setEmail(targetEmail);
        setOtp("");
        setRegistrationToken(null);
        setMode("verify");
        setSuccessMsg(
          err.message ||
          err.data?.error ||
          "Please enter the verification code sent to your email to log in."
        );
        return;
      }
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const normPhone = phone.trim();
    const normName = name.trim();
    const normEmail = email.trim().toLowerCase();

    if (!normPhone) {
      setError("Please enter your phone number.");
      return;
    }
    if (!normName) {
      setError("Please enter your name.");
      return;
    }
    if (!normEmail) {
      setError("Email address is required.");
      return;
    }
    if (!EMAIL_REGEX.test(normEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const res = await register({
        phone: normPhone,
        name: normName,
        email: normEmail,
        password,
        confirmPassword,
      });

      if (res.registrationToken) {
        setRegistrationToken(res.registrationToken);
      }
      // Switch to verify screen
      setOtp("");
      setMode("verify");
      setSuccessMsg(
        `We've sent a 6-digit verification code to ${normEmail}. Please enter the code below to complete creating and signing into your account.`,
      );
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }
    if (expirySeconds <= 0) {
      setError("Your verification code has expired. Please request a new code.");
      return;
    }

    setBusy(true);
    try {
      const res = await verifyEmail({
        email: email.trim().toLowerCase(),
        otp: cleanOtp,
        registrationToken,
      });
      setSuccessMsg(res.message || "Email verified successfully! Logging you in...");

      setTimeout(() => {
        if (redirectTo.includes("#") || redirectTo.includes("?")) {
          window.location.href = redirectTo;
        } else {
          navigate({ to: redirectTo as any });
        }
      }, 800);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleResendCode() {
    if (cooldownSeconds > 0) return;
    setError(null);
    setSuccessMsg(null);
    setResending(true);

    const targetEmail = email.trim().toLowerCase();
    try {
      if (mode === "verify") {
        const res = await resendVerificationOtp(targetEmail);
        setSuccessMsg(res.message);
      } else if (mode === "forgot") {
        const res = await forgotPassword(targetEmail);
        setSuccessMsg(res.message);
      }

      // Reset timers
      setExpirySeconds(300);
      setCooldownSeconds(60);
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
      cooldownTimerRef.current = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setResending(false);
    }
  }

  async function handleForgotSubmitEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail || !EMAIL_REGEX.test(targetEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setBusy(true);
    try {
      const res = await forgotPassword(targetEmail);
      setSuccessMsg(res.message);
      setForgotStep("otp");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    if (expirySeconds <= 0) {
      setError("The verification code has expired. Please request a new one.");
      return;
    }

    setBusy(true);
    try {
      const res = await verifyResetOtp({
        email: email.trim().toLowerCase(),
        otp: cleanOtp,
      });
      setResetToken(res.resetToken);
      setForgotStep("password");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const res = await resetPassword({
        email: email.trim().toLowerCase(),
        resetToken,
        otp,
        newPassword: password,
        confirmPassword,
      });
      setSuccessMsg(res.message);
      setForgotStep("success");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-6 card-glow">
      {/* Tab Switcher (Only shown on Login / Register modes) */}
      {(mode === "login" || mode === "register") && (
        <div className="mb-5 flex rounded-lg border border-border p-1 text-sm">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 rounded-md px-3 py-2 font-medium transition cursor-pointer ${mode === m
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {m === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>
      )}

      {/* ======================================================== LOGIN FORM */}
      {mode === "login" && (
        <form className="space-y-3" onSubmit={handleLogin}>
          <Field icon={<UserIcon className="h-4 w-4" />}>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Phone number or email"
              autoComplete="username"
              required
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </Field>

          <Field icon={<Lock className="h-4 w-4" />}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              required
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-muted-foreground hover:text-foreground transition p-0.5 cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </Field>

          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                setForgotStep("email");
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-xs text-primary hover:underline transition cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60 cursor-pointer shadow-md"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </button>
        </form>
      )}

      {/* ===================================================== REGISTER FORM */}
      {mode === "register" && (
        <form className="space-y-3" onSubmit={handleRegister}>
          <Field icon={<Phone className="h-4 w-4" />}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number (e.g. 9100000000)"
              autoComplete="tel"
              required
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </Field>

          <Field icon={<UserIcon className="h-4 w-4" />}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              autoComplete="name"
              required
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </Field>

          <Field icon={<Mail className="h-4 w-4 text-primary" />}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address * (required)"
              autoComplete="email"
              required
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </Field>

          <Field icon={<Lock className="h-4 w-4" />}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              autoComplete="new-password"
              required
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-muted-foreground hover:text-foreground transition p-0.5 cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </Field>

          <Field icon={<Lock className="h-4 w-4" />}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              autoComplete="new-password"
              required
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="text-muted-foreground hover:text-foreground transition p-0.5 cursor-pointer"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </Field>

          <p className="text-[11px] text-muted-foreground">
            A 6-digit verification code will be sent to your email address.
          </p>

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60 cursor-pointer shadow-md"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Create account
          </button>
        </form>
      )}

      {/* ================================================= EMAIL VERIFICATION */}
      {mode === "verify" && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/30">
              <Mail className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-foreground">
              Verify your email
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Enter the 6-digit verification code sent to{" "}
              <span className="font-semibold text-foreground">{email}</span>
            </p>
          </div>

          <form onSubmit={handleVerifyEmail} className="space-y-4">
            <div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="• • • • • •"
                autoComplete="one-time-code"
                required
                className="w-full text-center text-2xl font-mono font-bold tracking-[0.5em] py-3 rounded-lg border border-input bg-background focus:border-primary outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Countdown timer */}
            <div className="flex items-center justify-center gap-1.5 text-xs">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              {expirySeconds > 0 ? (
                <span className="text-muted-foreground">
                  Code expires in{" "}
                  <strong className="text-amber-400 font-mono">
                    {formatTimer(expirySeconds)}
                  </strong>
                </span>
              ) : (
                <span className="text-destructive font-semibold">
                  Code expired. Please request a new code.
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={busy || otp.length !== 6 || expirySeconds <= 0}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-md"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {registrationToken ? "Verify & Create Account" : "Verify & Sign In"}
            </button>
          </form>

          {/* Resend Cooldown Button */}
          <div className="text-center pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1.5">
              Didn't receive the code?
            </p>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={cooldownSeconds > 0 || resending}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {resending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {cooldownSeconds > 0
                ? `Resend code in ${cooldownSeconds}s`
                : "Resend Code"}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccessMsg(null);
              }}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition cursor-pointer"
            >
              <ArrowLeft className="h-3 w-3" /> Back to sign in
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== FORGOT PASSWORD */}
      {mode === "forgot" && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/30">
              <KeyRound className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-foreground">
              {forgotStep === "email" && "Forgot password"}
              {forgotStep === "otp" && "Enter verification code"}
              {forgotStep === "password" && "Set new password"}
              {forgotStep === "success" && "Password reset complete"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {forgotStep === "email" &&
                "Enter your registered email and we'll send you an OTP."}
              {forgotStep === "otp" &&
                `We've sent a 6-digit code to ${email}`}
              {forgotStep === "password" &&
                "Create a strong password for your account."}
              {forgotStep === "success" &&
                "Your password has been successfully updated."}
            </p>
          </div>

          {/* Step 1: Request OTP */}
          {forgotStep === "email" && (
            <form onSubmit={handleForgotSubmitEmail} className="space-y-3">
              <Field icon={<Mail className="h-4 w-4" />}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Registered email address"
                  autoComplete="email"
                  required
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </Field>

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60 cursor-pointer shadow-md"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Send Verification Code
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3" /> Back to sign in
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Verify OTP */}
          {forgotStep === "otp" && (
            <form onSubmit={handleForgotVerifyOtp} className="space-y-4">
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • • • •"
                  autoComplete="one-time-code"
                  required
                  className="w-full text-center text-2xl font-mono font-bold tracking-[0.5em] py-3 rounded-lg border border-input bg-background focus:border-primary outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="flex items-center justify-center gap-1.5 text-xs">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                {expirySeconds > 0 ? (
                  <span className="text-muted-foreground">
                    Code expires in{" "}
                    <strong className="text-amber-400 font-mono">
                      {formatTimer(expirySeconds)}
                    </strong>
                  </span>
                ) : (
                  <span className="text-destructive font-semibold">
                    Code expired. Please request a new code.
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={busy || otp.length !== 6 || expirySeconds <= 0}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-md"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Verify Code
              </button>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setForgotStep("email")}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3" /> Change email
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={cooldownSeconds > 0 || resending}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {resending && <Loader2 className="h-3 w-3 animate-spin" />}
                  {cooldownSeconds > 0
                    ? `Resend in ${cooldownSeconds}s`
                    : "Resend code"}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Enter New Password */}
          {forgotStep === "password" && (
            <form onSubmit={handleForgotResetPassword} className="space-y-3">
              <Field icon={<Lock className="h-4 w-4" />}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password (min 6 characters)"
                  autoComplete="new-password"
                  required
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-muted-foreground hover:text-foreground transition p-0.5 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </Field>

              <Field icon={<Lock className="h-4 w-4" />}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  required
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="text-muted-foreground hover:text-foreground transition p-0.5 cursor-pointer"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </Field>

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60 cursor-pointer shadow-md"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Reset Password
              </button>
            </form>
          )}

          {/* Step 4: Success Message */}
          {forgotStep === "success" && (
            <div className="space-y-4 text-center py-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <p className="text-sm text-foreground">
                Your password has been reset successfully.
              </p>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setIdentifier(email);
                  setPassword("");
                  setError(null);
                  setSuccessMsg("Please sign in with your new password.");
                }}
                className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 cursor-pointer shadow-md"
              >
                Sign in now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Success and Error messages */}
      {successMsg && (
        <div className="mt-3.5 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-400">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
          {error}
        </p>
      )}

      {/* Mode footnote */}
      {(mode === "login" || mode === "register") && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          {mode === "login"
            ? "New to AlphaQ? Switch to Create account above."
            : "We verify your email with a secure OTP to protect your account."}
        </p>
      )}
    </div>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2.5 focus-within:border-primary transition">
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </div>
  );
}

function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("email-already-in-use") || msg.includes("account with this email address already exists"))
    return "An account with this email address already exists. Try signing in or reset your password.";
  if (msg.includes("account with this number already exists") || msg.includes("account with this phone number already exists"))
    return "An account with this phone number already exists. Try signing in.";
  if (msg.includes("invalid-credential") || msg.includes("wrong-password") || msg.includes("Incorrect login credentials"))
    return "Incorrect phone number, email, or password.";
  if (msg.includes("user-not-found"))
    return "No account found. Create one first.";
  if (msg.includes("weak-password"))
    return "Password must be at least 6 characters.";
  if (msg.includes("too-many-requests"))
    return "Too many attempts. Please wait a moment and try again.";
  return msg;
}
