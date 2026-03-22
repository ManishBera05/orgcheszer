import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { login } from "../api/auth";
import { useAuth } from "../hooks/useAuth";
import type { ApiError } from "../types";

/* ─── Decorative chess board ─────────────────────────────── */
function ChessPattern() {
  const squares = Array.from({ length: 64 }, (_, i) => {
    const row = Math.floor(i / 8);
    const col = i % 8;
    return { isDark: (row + col) % 2 === 1, delay: (row * 8 + col) * 18 };
  });
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(8, 1fr)",
        width: "100%",
        height: "100%",
        opacity: 0.18,
      }}
    >
      {squares.map((sq, i) => (
        <div
          key={i}
          style={{
            background: sq.isDark ? "var(--camel)" : "transparent",
            animation: "squareFadeIn 600ms ease forwards",
            animationDelay: `${sq.delay}ms`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Field ───────────────────────────────────────────────── */
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
  rightSlot?: React.ReactNode;
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
  rightSlot,
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
      </label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
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
            transition:
              "border-color var(--transition-fast), box-shadow var(--transition-fast)",
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
              color: "var(--text-muted)",
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
    </div>
  );
}

/* ─── LoginPage ───────────────────────────────────────────── */
export default function LoginPage() {
  const { login: authLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      toast.success(data.message || "Welcome back!");
      authLogin(data.token, "/");
    },
    onError: (err: ApiError) => {
      toast.error(
        err.message || "Login failed. Please check your credentials.",
      );
    },
  });

  function validate(): boolean {
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Enter a valid email address.";
    if (!password) next.password = "Password is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate({ email: email.trim(), password });
  }

  return (
    <>
      <style>{`
        @keyframes squareFadeIn { from { opacity:0; transform:scale(0.85); } to { opacity:1; transform:scale(1); } }
        @keyframes panelSlideIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes logoFloat    { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
        @keyframes spin         { to { transform:rotate(360deg); } }

        .login-root {
          min-height: calc(100vh - 64px);
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        .login-left {
          position: relative;
          background: var(--bg-surface);
          border-right: 1px solid var(--border);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
        }
        .login-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          animation: panelSlideIn 400ms ease forwards;
        }
        .login-form-inner {
          width: 100%;
          max-width: 400px;
        }
        .login-mobile-brand { display: none; }

        /* Tablet — shrink left panel, keep it visible */
        @media (max-width: 900px) {
          .login-left  { padding: 2rem; }
          .login-right { padding: 2rem 1.5rem; }
        }

        /* Mobile — single column, hide decorative panel */
        @media (max-width: 640px) {
          .login-root {
            grid-template-columns: 1fr;
          }
          .login-left { display: none; }
          .login-right {
            align-items: flex-start;
            justify-content: center;
            padding: 2.5rem 1.25rem 3rem;
            min-height: calc(100vh - 64px);
          }
          .login-form-inner {
            max-width: 100%;
          }
          .login-mobile-brand {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1.75rem;
          }
        }

        @media (max-width: 380px) {
          .login-right { padding: 2rem 1rem 2.5rem; }
        }
      `}</style>

      <div className="login-root">
        {/* ── Left — decorative (hidden on mobile) ── */}
        <div className="login-left">
          <div style={{ position: "absolute", inset: 0 }}>
            <ChessPattern />
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at center, transparent 30%, var(--bg-surface) 75%)",
            }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              textAlign: "center",
              maxWidth: "360px",
            }}
          >
            <div
              style={{
                fontSize: "6rem",
                lineHeight: 1,
                marginBottom: "1.5rem",
                animation: "logoFloat 4s ease-in-out infinite",
                filter: "drop-shadow(0 8px 24px rgba(187,148,87,0.3))",
              }}
            >
              ♔
            </div>
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "0.75rem",
                letterSpacing: "-0.03em",
              }}
            >
              Your tournament,
              <br />
              <span style={{ color: "var(--accent-cta)" }}>your rules.</span>
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.9375rem",
                lineHeight: 1.6,
              }}
            >
              Organise or join chess tournaments with FIDE-compliant pairings,
              live leaderboards, and QR check-ins — all in one place.
            </p>
            <div
              style={{
                display: "flex",
                gap: "1.375rem",
                justifyContent: "center",
                marginTop: "2.5rem",
                paddingTop: "2rem",
                borderTop: "1px solid var(--border-subtle)",
              }}
            >
              {[
                { value: "FIDE", label: "Tiebreakers" },
                { value: "Join", label: "Tournaments" },
                { value: "QR", label: "Check-in" },
                { value: "Live", label: "Leaderboard" },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: "var(--accent-cta)",
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      marginTop: "0.125rem",
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right — form ── */}
        <div className="login-right">
          <div className="login-form-inner">
            {/* Brand shown only on mobile (replaces the hidden left panel) */}
            <div className="login-mobile-brand">
              <span style={{ fontSize: "1.75rem" }}>♔</span>
              <span
                style={{
                  fontSize: "1.0625rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                Org<span style={{ color: "var(--accent-cta)" }}>Cheszer</span>
              </span>
            </div>

            <div style={{ marginBottom: "1.75rem" }}>
              <h1
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.03em",
                  marginBottom: "0.375rem",
                }}
              >
                Sign in
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>
                Welcome back to OrgCheszer
              </p>
            </div>

            <div
              style={{
                height: "2px",
                width: "48px",
                background: "var(--accent-cta)",
                borderRadius: "1px",
                marginBottom: "1.75rem",
              }}
            />

            <form
              onSubmit={handleSubmit}
              noValidate
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              <Field
                label="Email"
                id="email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="magnus@example.com"
                autoComplete="email"
                required
                error={errors.email}
              />

              <Field
                label="Password"
                id="password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                error={errors.password}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
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
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              <button
                type="submit"
                disabled={mutation.isPending}
                style={{
                  marginTop: "0.25rem",
                  width: "100%",
                  minHeight: "48px",
                  padding: "0.8125rem 1rem",
                  background: mutation.isPending
                    ? "var(--border)"
                    : "var(--accent-cta)",
                  color: mutation.isPending
                    ? "var(--text-muted)"
                    : "var(--text-on-accent)",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  fontSize: "1rem",
                  fontWeight: 600,
                  fontFamily: "var(--font-sans)",
                  cursor: mutation.isPending ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  transition: "background var(--transition-fast)",
                  letterSpacing: "0.01em",
                }}
                onMouseEnter={(e) => {
                  if (!mutation.isPending)
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "var(--accent-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!mutation.isPending)
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "var(--accent-cta)";
                }}
              >
                {mutation.isPending ? (
                  <>
                    <span
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid var(--border)",
                        borderTopColor: "var(--text-muted)",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                        display: "inline-block",
                      }}
                    />
                    Signing in…
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    Sign in
                  </>
                )}
              </button>
            </form>

            <p
              style={{
                marginTop: "1.75rem",
                textAlign: "center",
                fontSize: "0.875rem",
                color: "var(--text-muted)",
              }}
            >
              Don't have an account?{" "}
              <Link
                to="/register"
                style={{ color: "var(--accent-cta)", fontWeight: 500 }}
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
