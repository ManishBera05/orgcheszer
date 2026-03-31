// --- START OF FILE src/pages/RegisterPage.tsx ---
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  UserPlus,
  ChevronRight,
  ChevronLeft,
  Check,
  KeyRound,
} from "lucide-react";
import { initiateRegistration, verifyRegistration } from "../api/auth";
import { useAuth } from "../hooks/useAuth";
import type { ApiError } from "../types";

interface FieldProps {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  rightSlot?: React.ReactNode;
  maxLength?: number;
  styleOverrides?: React.CSSProperties;
}

function Field({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  error,
  hint,
  rightSlot,
  maxLength,
  styleOverrides,
}: FieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <label
        htmlFor={id}
        style={{
          fontSize: "0.8125rem",
          fontWeight: 500,
          color: "var(--text-secondary)",
          letterSpacing: "0.02em",
        }}
      >
        {label}
        {required && (
          <span style={{ color: "var(--accent-cta)", marginLeft: "0.25rem" }}>
            *
          </span>
        )}
        {!required && (
          <span
            style={{
              color: "var(--text-muted)",
              marginLeft: "0.375rem",
              fontWeight: 400,
            }}
          >
            (optional)
          </span>
        )}
      </label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          style={{
            width: "100%",
            padding: "0.75rem 0.875rem",
            paddingRight: rightSlot ? "2.75rem" : "0.875rem",
            background: "var(--bg-base)",
            border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`,
            borderRadius: "var(--radius-md)",
            color: "var(--text-primary)",
            fontSize: "1rem",
            fontFamily: "var(--font-sans)",
            outline: "none",
            transition: "border-color 150ms ease, box-shadow 150ms ease",
            ...styleOverrides,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-cta)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(187,148,87,0.15)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error
              ? "var(--danger)"
              : "var(--border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        {rightSlot && (
          <div
            style={{
              position: "absolute",
              right: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            {rightSlot}
          </div>
        )}
      </div>
      {error && (
        <p style={{ fontSize: "0.75rem", color: "var(--danger)", margin: 0 }}>
          {error}
        </p>
      )}
      {hint && !error && (
        <p
          style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  mobileNo: string;
  dob: string;
  fideId: string;
  otp: string;
}
type Errors = Partial<Record<keyof FormState, string>>;
const EMPTY: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  mobileNo: "",
  dob: "",
  fideId: "",
  otp: "",
};

export default function RegisterPage() {
  const { login: authLogin } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  function set(field: keyof FormState) {
    return (v: string) => {
      setForm((f) => ({ ...f, [field]: v }));
      if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
    };
  }

  function validateStep(s: number): boolean {
    const next: Errors = {};
    if (s === 0) {
      if (!form.firstName.trim()) next.firstName = "First name is required.";
      if (!form.lastName.trim()) next.lastName = "Last name is required.";
      if (!form.email.trim()) next.email = "Email is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        next.email = "Enter a valid email.";
    }
    if (s === 1) {
      if (!form.password) next.password = "Password is required.";
      else if (form.password.length < 8)
        next.password = "At least 8 characters.";
      if (!form.confirmPassword)
        next.confirmPassword = "Please confirm your password.";
      else if (form.password !== form.confirmPassword)
        next.confirmPassword = "Passwords do not match.";
    }
    if (s === 2) {
      if (!form.mobileNo.trim()) next.mobileNo = "Mobile number is required.";
      if (!form.dob) next.dob = "Date of birth is required.";
      if (form.fideId && !/^\d+$/.test(form.fideId))
        next.fideId = "FIDE ID should be numeric.";
    }
    if (s === 3) {
      if (!form.otp.trim()) next.otp = "OTP is required.";
      else if (!/^\d{6}$/.test(form.otp.trim()))
        next.otp = "OTP must be exactly 6 digits.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const initiateMut = useMutation({
    mutationFn: initiateRegistration,
    onSuccess: (data) => {
      toast.success(data.message || "OTP sent to your email!");
      setStep(3); // Advance to OTP step
    },
    onError: (err: ApiError) =>
      toast.error(err.message || "Failed to initiate registration."),
  });

  const verifyMut = useMutation({
    mutationFn: verifyRegistration,
    onSuccess: (data) => {
      toast.success("Account created successfully! Welcome.");
      authLogin(data.token, "/");
    },
    onError: (err: ApiError) =>
      toast.error(err.message || "Invalid or expired OTP."),
  });

  function next() {
    if (validateStep(step)) {
      if (step === 2) {
        // Submit profile data to get OTP
        initiateMut.mutate({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password,
          mobileNo: form.mobileNo.trim(),
          dob: form.dob,
          fideId: form.fideId.trim() || undefined,
        });
      } else {
        setStep((s) => s + 1);
      }
    }
  }

  function back() {
    setStep((s) => s - 1);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 3 && validateStep(3)) {
      // Submit OTP to finalize
      verifyMut.mutate({ email: form.email.trim(), otp: form.otp.trim() });
    } else {
      next();
    }
  }

  // Added "Verify" to the progression steps
  const steps = ["Account", "Password", "Profile", "Verify"];

  const pwToggleBtn = (show: boolean, toggle: () => void) => (
    <button
      type="button"
      onClick={toggle}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "0.25rem",
        color: "var(--text-muted)",
        display: "flex",
        alignItems: "center",
        borderRadius: "4px",
      }}
      aria-label={show ? "Hide" : "Show"}
    >
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  const stepContent = [
    <div
      key="s0"
      className="reg-step-grid"
      style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}
    >
      <div
        className="reg-name-row"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
      >
        <Field
          label="First name"
          id="firstName"
          value={form.firstName}
          onChange={set("firstName")}
          placeholder="Magnus"
          autoComplete="given-name"
          required
          error={errors.firstName}
        />
        <Field
          label="Last name"
          id="lastName"
          value={form.lastName}
          onChange={set("lastName")}
          placeholder="Carlsen"
          autoComplete="family-name"
          required
          error={errors.lastName}
        />
      </div>
      <Field
        label="Email"
        id="email"
        type="email"
        value={form.email}
        onChange={set("email")}
        placeholder="magnus@example.com"
        autoComplete="email"
        required
        error={errors.email}
      />
    </div>,

    <div
      key="s1"
      style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}
    >
      <Field
        label="Password"
        id="password"
        type={showPw ? "text" : "password"}
        value={form.password}
        onChange={set("password")}
        placeholder="••••••••"
        autoComplete="new-password"
        required
        hint="Minimum 8 characters"
        error={errors.password}
        rightSlot={pwToggleBtn(showPw, () => setShowPw((v) => !v))}
      />
      <Field
        label="Confirm password"
        id="confirmPassword"
        type={showCpw ? "text" : "password"}
        value={form.confirmPassword}
        onChange={set("confirmPassword")}
        placeholder="••••••••"
        autoComplete="new-password"
        required
        error={errors.confirmPassword}
        rightSlot={pwToggleBtn(showCpw, () => setShowCpw((v) => !v))}
      />
    </div>,

    <div
      key="s2"
      style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}
    >
      <Field
        label="Mobile number"
        id="mobileNo"
        type="tel"
        value={form.mobileNo}
        onChange={set("mobileNo")}
        placeholder="+91 98765 43210"
        autoComplete="tel"
        required
        error={errors.mobileNo}
      />
      <Field
        label="Date of birth"
        id="dob"
        type="date"
        value={form.dob}
        onChange={set("dob")}
        autoComplete="bday"
        required
        error={errors.dob}
      />
      <Field
        label="FIDE ID"
        id="fideId"
        value={form.fideId}
        onChange={set("fideId")}
        placeholder="1503014"
        hint="Your official FIDE ID, if you have one"
        error={errors.fideId}
      />
    </div>,

    // NEW STEP 3: OTP Verification
    <div
      key="s3"
      style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}
    >
      <div
        style={{
          padding: "1rem",
          background: "var(--accent-subtle)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          display: "flex",
          gap: "0.75rem",
        }}
      >
        <KeyRound
          size={20}
          style={{
            color: "var(--accent-cta)",
            flexShrink: 0,
            marginTop: "2px",
          }}
        />
        <div>
          <h4
            style={{
              margin: "0 0 0.25rem",
              color: "var(--text-primary)",
              fontSize: "0.9375rem",
            }}
          >
            Check your email
          </h4>
          <p
            style={{
              margin: 0,
              color: "var(--text-muted)",
              fontSize: "0.8125rem",
            }}
          >
            We sent a 6-digit code to <strong>{form.email}</strong>. Enter it
            below to verify your account.
          </p>
        </div>
      </div>
      <Field
        label="6-Digit OTP"
        id="otp"
        value={form.otp}
        onChange={set("otp")}
        placeholder="123456"
        maxLength={6}
        required
        error={errors.otp}
        styleOverrides={{
          textAlign: "center",
          letterSpacing: "0.5em",
          fontSize: "1.25rem",
          fontWeight: 600,
        }}
      />
    </div>,
  ];

  return (
    <>
      <style>{`
        @keyframes panelSlideIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes stepIn       { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }
        @keyframes spin         { to { transform:rotate(360deg); } }

        .reg-outer { min-height: calc(100vh - 64px); display: flex; align-items: center; justify-content: center; padding: 3rem 1.5rem; box-sizing: border-box; }
        .reg-card { position: relative; width: 100%; max-width: 480px; background: var(--bg-surface); border: 1px solid var(--border); border-radius: 16px; padding: 2.5rem; box-shadow: var(--shadow-lg); animation: panelSlideIn 400ms ease forwards; box-sizing: border-box; }
        .reg-name-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .reg-nav { display: flex; gap: 0.75rem; margin-top: 2rem; }
        .reg-btn-back { flex: 0 0 auto; padding: 0.75rem 1rem; background: transparent; border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-secondary); font-size: 1rem; font-family: var(--font-sans); cursor: pointer; display: flex; align-items: center; gap: 0.375rem; transition: border-color var(--transition-fast), color var(--transition-fast); min-height: 48px; }
        .reg-btn-back:hover { border-color: var(--border-strong); color: var(--text-primary); }
        .reg-btn-primary { flex: 1; padding: 0.75rem 1rem; background: var(--accent-cta); border: none; border-radius: var(--radius-md); color: var(--text-on-accent); font-size: 1rem; font-weight: 600; font-family: var(--font-sans); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background var(--transition-fast); min-height: 48px; }
        .reg-btn-primary:hover  { background: var(--accent-hover); }
        .reg-btn-primary:disabled { background: var(--border); color: var(--text-muted); cursor: not-allowed; }

        @media (max-width: 520px) {
          .reg-outer { align-items: flex-start; padding: 1.5rem 1rem 3rem; }
          .reg-card { padding: 1.75rem 1.25rem; border-radius: 12px; max-width: 100%; }
          .reg-name-row { grid-template-columns: 1fr; gap: 1.125rem; }
        }
        @media (max-width: 380px) {
          .reg-outer  { padding: 1rem 0.75rem 2.5rem; }
          .reg-card   { padding: 1.5rem 1rem; }
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(187,148,87,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div className="reg-outer">
        <div className="reg-card" style={{ zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              marginBottom: "0.375rem",
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>♟</span>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.03em",
              }}
            >
              Create account
            </h1>
          </div>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.875rem",
              marginBottom: "1.75rem",
            }}
          >
            Join OrgCheszer and start organising
          </p>

          <div style={{ display: "flex", gap: 0, marginBottom: "0.5rem" }}>
            {steps.map((s, i) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.375rem",
                  position: "relative",
                }}
              >
                {i < steps.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "14px",
                      left: "calc(50% + 14px)",
                      right: "calc(-50% + 14px)",
                      height: "2px",
                      background:
                        i < step ? "var(--accent-cta)" : "var(--border)",
                      transition: "background var(--transition-normal)",
                      zIndex: 0,
                    }}
                  />
                )}
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background:
                      i < step ? "var(--accent-cta)" : "var(--bg-base)",
                    border: `2px solid ${i <= step ? "var(--accent-cta)" : "var(--border)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1,
                    position: "relative",
                    transition: "all var(--transition-normal)",
                  }}
                >
                  {i < step ? (
                    <Check
                      size={14}
                      color="var(--text-on-accent)"
                      strokeWidth={2.5}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color:
                          i === step
                            ? "var(--accent-cta)"
                            : "var(--text-muted)",
                      }}
                    >
                      {i + 1}
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    color:
                      i === step ? "var(--accent-cta)" : "var(--text-muted)",
                    fontWeight: i === step ? 600 : 400,
                    transition: "color var(--transition-normal)",
                  }}
                >
                  {s}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              height: "1px",
              background: "var(--border-subtle)",
              margin: "1.25rem 0 1.75rem",
            }}
          />

          <div key={step} style={{ animation: "stepIn 250ms ease forwards" }}>
            {stepContent[step]}
          </div>

          <div className="reg-nav">
            {step > 0 && (
              <button
                type="button"
                className="reg-btn-back"
                onClick={back}
                disabled={initiateMut.isPending || verifyMut.isPending}
              >
                <ChevronLeft size={16} /> Back
              </button>
            )}

            {step < steps.length - 1 ? (
              <button
                type="button"
                className="reg-btn-primary"
                onClick={next}
                disabled={initiateMut.isPending}
              >
                {initiateMut.isPending ? (
                  <>
                    <span
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "var(--text-on-accent)",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                        display: "inline-block",
                      }}
                    />{" "}
                    Sending OTP…
                  </>
                ) : (
                  <>
                    Continue <ChevronRight size={16} />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                className="reg-btn-primary"
                disabled={verifyMut.isPending}
                onClick={handleSubmit as unknown as React.MouseEventHandler}
              >
                {verifyMut.isPending ? (
                  <>
                    <span
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "var(--text-on-accent)",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                        display: "inline-block",
                      }}
                    />{" "}
                    Verifying…
                  </>
                ) : (
                  <>
                    <UserPlus size={16} /> Create account
                  </>
                )}
              </button>
            )}
          </div>

          <p
            style={{
              marginTop: "1.5rem",
              textAlign: "center",
              fontSize: "0.875rem",
              color: "var(--text-muted)",
            }}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              style={{ color: "var(--accent-cta)", fontWeight: 500 }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
// --- END OF FILE src/pages/RegisterPage.tsx ---
