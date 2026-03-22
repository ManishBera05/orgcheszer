import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";
import {
  Trophy,
  LayoutDashboard,
  User,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  Shield,
} from "lucide-react";

/* ─── King SVG logo mark ──────────────────────────────────── */
function KingLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      {/* Crown base */}
      <rect x="6" y="22" width="20" height="5" rx="2" fill="var(--accent)" />
      {/* Crown body */}
      <polygon
        points="6,22 6,12 11,17 16,8 21,17 26,12 26,22"
        fill="var(--accent)"
      />
      {/* Cross top */}
      <rect x="14" y="3" width="4" height="8" rx="1" fill="var(--accent)" />
      <rect x="11" y="5" width="10" height="3" rx="1" fill="var(--accent)" />
    </svg>
  );
}

/* ─── Nav link helper ─────────────────────────────────────── */
interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

function NavItem({ to, icon, label, onClick }: NavItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150",
          isActive
            ? "bg-[var(--accent-subtle)] text-[var(--apricot)] border border-[var(--border)]"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-interactive)]",
        )
      }
    >
      <span className="w-4 h-4 shrink-0">{icon}</span>
      {label}
    </NavLink>
  );
}

/* ─── Layout ──────────────────────────────────────────────── */
export default function Layout() {
  const { isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Shadow nav when scrolled
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Sticky Navbar ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "var(--bg-surface)",
          borderBottom: `1px solid ${scrolled ? "var(--border)" : "var(--border-subtle)"}`,
          transition:
            "border-color var(--transition-normal), box-shadow var(--transition-normal)",
          boxShadow: scrolled ? "var(--shadow-md)" : "none",
        }}
      >
        <div className="container">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: "64px",
              gap: "1rem",
            }}
          >
            {/* Brand */}
            <Link
              to="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                textDecoration: "none",
                marginRight: "auto",
              }}
            >
              <KingLogo />
              <span
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: "var(--text-primary)",
                  lineHeight: 1,
                }}
              >
                Org<span style={{ color: "var(--accent)" }}>Cheszer</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav
              style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
              className="hidden md:flex"
            >
              <NavItem
                to="/tournaments"
                icon={<Trophy size={16} />}
                label="Tournaments"
              />

              {isAuthenticated && (
                <>
                  <NavItem
                    to="/dashboard"
                    icon={<LayoutDashboard size={16} />}
                    label="Dashboard"
                  />
                  <NavItem
                    to="/staff"
                    icon={<Shield size={16} />}
                    label="Staff"
                  />
                  <NavItem
                    to="/profile"
                    icon={<User size={16} />}
                    label="Profile"
                  />
                </>
              )}

              {/* Auth actions */}
              <div
                style={{
                  width: "1px",
                  height: "20px",
                  background: "var(--border-subtle)",
                  margin: "0 0.5rem",
                }}
              />
              {isAuthenticated ? (
                <button
                  onClick={logout}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--text-muted)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition:
                      "color var(--transition-fast), border-color var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "var(--danger)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "var(--danger)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "var(--text-muted)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "var(--border)";
                  }}
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              ) : (
                <>
                  <NavItem
                    to="/login"
                    icon={<LogIn size={16} />}
                    label="Login"
                  />
                  <Link
                    to="/register"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem 1rem",
                      borderRadius: "var(--radius-md)",
                      background: "var(--accent)",
                      color: "var(--text-on-accent)",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      textDecoration: "none",
                      transition: "background var(--transition-fast)",
                      letterSpacing: "0.01em",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLAnchorElement).style.background =
                        "var(--accent-hover)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLAnchorElement).style.background =
                        "var(--accent)")
                    }
                  >
                    <UserPlus size={15} />
                    Register
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile hamburger */}
            <button
              className="md:hidden"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileOpen && (
          <div
            style={{
              borderTop: "1px solid var(--border-subtle)",
              background: "var(--bg-surface)",
              padding: "0.75rem 1.5rem 1rem",
              animation: "fadeIn 150ms ease",
            }}
          >
            <nav
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              }}
            >
              <NavItem
                to="/tournaments"
                icon={<Trophy size={16} />}
                label="Tournaments"
                onClick={() => setMobileOpen(false)}
              />
              {isAuthenticated && (
                <>
                  <NavItem
                    to="/dashboard"
                    icon={<LayoutDashboard size={16} />}
                    label="Dashboard"
                    onClick={() => setMobileOpen(false)}
                  />
                  <NavItem
                    to="/staff"
                    icon={<Shield size={16} />}
                    label="Staff"
                    onClick={() => setMobileOpen(false)}
                  />
                  <NavItem
                    to="/profile"
                    icon={<User size={16} />}
                    label="Profile"
                    onClick={() => setMobileOpen(false)}
                  />
                </>
              )}
              <hr
                style={{
                  border: "none",
                  borderTop: "1px solid var(--border-subtle)",
                  margin: "0.5rem 0",
                }}
              />
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "var(--radius-md)",
                    border: "none",
                    background: "transparent",
                    color: "var(--danger)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "left",
                  }}
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              ) : (
                <>
                  <NavItem
                    to="/login"
                    icon={<LogIn size={16} />}
                    label="Login"
                    onClick={() => setMobileOpen(false)}
                  />
                  <NavItem
                    to="/register"
                    icon={<UserPlus size={16} />}
                    label="Register"
                    onClick={() => setMobileOpen(false)}
                  />
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* ── Page content ── */}
      <main style={{ flex: 1, paddingBottom: "4rem" }}>
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: "1.5rem 0",
          background: "var(--bg-surface)",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <KingLogo size={18} />
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              OrgCheszer — FIDE-compliant tournament management
            </span>
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            ♟ Built with Spring Boot + React
          </p>
        </div>
      </footer>

      {/* ── Toaster (Sonner) ── */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-sans)",
            fontSize: "0.875rem",
          },
        }}
      />
    </div>
  );
}
