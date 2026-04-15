// --- START OF FILE src/components/layout/Layout.tsx ---
import { useState, useEffect } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Toaster } from "sonner";
import { useAuth } from "../../hooks/useAuth";
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
  Sparkles,
  Mail,
  Users,
} from "lucide-react";

function KingLogo({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="6"
        y="22"
        width="20"
        height="5"
        rx="2"
        fill="var(--accent-cta)"
      />
      <polygon
        points="6,22 6,12 11,17 16,8 21,17 26,12 26,22"
        fill="var(--accent-cta)"
      />
      <rect x="14" y="3" width="4" height="8" rx="1" fill="var(--accent-cta)" />
      <rect
        x="11"
        y="5"
        width="10"
        height="3"
        rx="1"
        fill="var(--accent-cta)"
      />
    </svg>
  );
}

export default function Layout() {
  const { isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  function scrollToFeatures() {
    setMobileOpen(false);
    if (isHome)
      document
        .getElementById("features")
        ?.scrollIntoView({ behavior: "smooth" });
    else {
      navigate("/");
      setTimeout(() => {
        document
          .getElementById("features")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }
  }

  return (
    <>
      <style>{`
        @keyframes mobileMenuIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        .nav-header { position: sticky; top: 0; z-index: 50; background: var(--bg-surface); border-bottom: 1px solid var(--border-subtle); transition: border-color 200ms ease, box-shadow 200ms ease; }
        .nav-header.scrolled { border-bottom-color: var(--border); box-shadow: var(--shadow-md); }
        .nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; height: 64px; display: flex; align-items: center; gap: 0; }
        .nav-brand { display: flex; align-items: center; gap: 0.5rem; text-decoration: none; flex-shrink: 0; margin-right: auto; }
        .nav-brand-text { font-size: 1.0625rem; font-weight: 700; letter-spacing: -0.03em; color: var(--text-primary); white-space: nowrap; }
        .nav-desktop { display: flex; align-items: center; gap: 0.125rem; }
        .nav-link { display: flex; align-items: center; gap: 0.375rem; padding: 0.4375rem 0.6875rem; border-radius: 6px; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); text-decoration: none; background: transparent; border: none; cursor: pointer; font-family: var(--font-sans); white-space: nowrap; line-height: 1; transition: color 120ms ease, background 120ms ease; flex-shrink: 0; }
        .nav-link:hover { color: var(--text-primary); background: var(--bg-interactive); }
        .nav-link.active { color: var(--apricot-100); background: var(--accent-subtle); border: 1px solid var(--border); }
        .nav-divider { width: 1px; height: 18px; background: var(--border-subtle); margin: 0 0.5rem; flex-shrink: 0; }
        .nav-btn-register { display: flex; align-items: center; gap: 0.375rem; padding: 0.4375rem 0.875rem; background: var(--accent-cta); color: var(--text-on-accent); border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 600; font-family: var(--font-sans); cursor: pointer; text-decoration: none; white-space: nowrap; line-height: 1; flex-shrink: 0; transition: background 120ms ease; }
        .nav-btn-register:hover { background: var(--accent-hover); color: var(--text-on-accent); }
        .nav-hamburger { display: none; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--text-secondary); cursor: pointer; flex-shrink: 0; margin-left: 0.5rem; }
        .nav-mobile-drawer { border-top: 1px solid var(--border-subtle); background: var(--bg-surface); animation: mobileMenuIn 150ms ease; }
        .nav-mobile-inner { max-width: 1200px; margin: 0 auto; padding: 0.625rem 1.25rem 1rem; display: flex; flex-direction: column; gap: 0.125rem; }
        .nav-mobile-link { display: flex; align-items: center; gap: 0.5rem; padding: 0.625rem 0.75rem; border-radius: 6px; font-size: 0.9375rem; font-weight: 500; color: var(--text-secondary); text-decoration: none; background: transparent; border: none; cursor: pointer; font-family: var(--font-sans); width: 100%; text-align: left; line-height: 1.4; transition: color 120ms ease, background 120ms ease; }
        .nav-mobile-link:hover, .nav-mobile-link.active { color: var(--text-primary); background: var(--bg-interactive); }
        .nav-mobile-divider { height: 1px; background: var(--border-subtle); margin: 0.375rem 0; border: none; }
        .nav-mobile-danger { color: var(--danger) !important; }
        .nav-mobile-danger:hover { background: var(--danger-bg) !important; }
        .nav-mobile-register { background: var(--accent-cta) !important; color: var(--text-on-accent) !important; font-weight: 600; margin-top: 0.25rem; }
        .nav-mobile-register:hover { background: var(--accent-hover) !important; }
        .app-footer { border-top: 1px solid var(--border-subtle); background: var(--bg-surface); padding: 1.25rem 0; }
        .app-footer-inner { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; }
        @media (max-width: 960px) { .nav-desktop { display: none; } .nav-hamburger { display: flex; } }
        @media (min-width: 961px) { .nav-mobile-drawer { display: none; } }
        @media (max-width: 480px) { .nav-inner { padding: 0 1rem; } .nav-brand-text { font-size: 0.9375rem; } .app-footer-inner { padding: 0 1rem; flex-direction: column; align-items: flex-start; } }
      `}</style>

      <div
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        <header className={`nav-header${scrolled ? " scrolled" : ""}`}>
          <div className="nav-inner">
            <Link to="/" className="nav-brand">
              <KingLogo />
              <span className="nav-brand-text">
                Org<span style={{ color: "var(--accent-cta)" }}>Cheszer</span>
              </span>
            </Link>

            <nav className="nav-desktop" aria-label="Main navigation">
              <NavLink
                to="/tournaments"
                className={({ isActive }) =>
                  `nav-link${isActive ? " active" : ""}`
                }
              >
                <Trophy size={15} />
                Tournaments
              </NavLink>

              {/* NEW: CLUBS TAB */}
              {isAuthenticated && (
                <NavLink
                  to="/clubs"
                  className={({ isActive }) =>
                    `nav-link${isActive ? " active" : ""}`
                  }
                >
                  <Users size={15} />
                  Clubs
                </NavLink>
              )}

              <button
                className="nav-link"
                onClick={scrollToFeatures}
                type="button"
              >
                <Sparkles size={15} />
                Features
              </button>
              <NavLink
                to="/contact"
                className={({ isActive }) =>
                  `nav-link${isActive ? " active" : ""}`
                }
              >
                <Mail size={15} />
                Contact
              </NavLink>

              {isAuthenticated && (
                <>
                  <div className="nav-divider" aria-hidden="true" />
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                      `nav-link${isActive ? " active" : ""}`
                    }
                  >
                    <LayoutDashboard size={15} />
                    Dashboard
                  </NavLink>
                  <NavLink
                    to="/staff"
                    className={({ isActive }) =>
                      `nav-link${isActive ? " active" : ""}`
                    }
                  >
                    <Shield size={15} />
                    Staff
                  </NavLink>
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      `nav-link${isActive ? " active" : ""}`
                    }
                  >
                    <User size={15} />
                    Profile
                  </NavLink>
                </>
              )}

              <div className="nav-divider" aria-hidden="true" />

              {isAuthenticated ? (
                <button
                  type="button"
                  className="nav-link"
                  onClick={logout}
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "var(--danger)";
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "var(--danger-bg)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "var(--text-muted)";
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "transparent";
                  }}
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              ) : (
                <>
                  <NavLink
                    to="/login"
                    className={({ isActive }) =>
                      `nav-link${isActive ? " active" : ""}`
                    }
                  >
                    <LogIn size={15} />
                    Login
                  </NavLink>
                  <Link to="/register" className="nav-btn-register">
                    <UserPlus size={14} />
                    Register
                  </Link>
                </>
              )}
            </nav>

            <button
              type="button"
              className="nav-hamburger"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {mobileOpen && (
            <div className="nav-mobile-drawer">
              <div className="nav-mobile-inner">
                <NavLink
                  to="/tournaments"
                  className={({ isActive }) =>
                    `nav-mobile-link${isActive ? " active" : ""}`
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  <Trophy size={16} />
                  Tournaments
                </NavLink>
                {isAuthenticated && (
                  <NavLink
                    to="/clubs"
                    className={({ isActive }) =>
                      `nav-mobile-link${isActive ? " active" : ""}`
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    <Users size={16} />
                    Clubs
                  </NavLink>
                )}
                <button
                  type="button"
                  className="nav-mobile-link"
                  onClick={scrollToFeatures}
                >
                  <Sparkles size={16} />
                  Features
                </button>
                <NavLink
                  to="/contact"
                  className={({ isActive }) =>
                    `nav-mobile-link${isActive ? " active" : ""}`
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  <Mail size={16} />
                  Contact
                </NavLink>

                {isAuthenticated && (
                  <>
                    <hr className="nav-mobile-divider" />
                    <NavLink
                      to="/dashboard"
                      className={({ isActive }) =>
                        `nav-mobile-link${isActive ? " active" : ""}`
                      }
                      onClick={() => setMobileOpen(false)}
                    >
                      <LayoutDashboard size={16} />
                      Dashboard
                    </NavLink>
                    <NavLink
                      to="/staff"
                      className={({ isActive }) =>
                        `nav-mobile-link${isActive ? " active" : ""}`
                      }
                      onClick={() => setMobileOpen(false)}
                    >
                      <Shield size={16} />
                      Staff
                    </NavLink>
                    <NavLink
                      to="/profile"
                      className={({ isActive }) =>
                        `nav-mobile-link${isActive ? " active" : ""}`
                      }
                      onClick={() => setMobileOpen(false)}
                    >
                      <User size={16} />
                      Profile
                    </NavLink>
                  </>
                )}

                <hr className="nav-mobile-divider" />

                {isAuthenticated ? (
                  <button
                    type="button"
                    className="nav-mobile-link nav-mobile-danger"
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                ) : (
                  <>
                    <NavLink
                      to="/login"
                      className={({ isActive }) =>
                        `nav-mobile-link${isActive ? " active" : ""}`
                      }
                      onClick={() => setMobileOpen(false)}
                    >
                      <LogIn size={16} />
                      Login
                    </NavLink>
                    <NavLink
                      to="/register"
                      className="nav-mobile-link nav-mobile-register"
                      onClick={() => setMobileOpen(false)}
                    >
                      <UserPlus size={16} />
                      Register
                    </NavLink>
                  </>
                )}
              </div>
            </div>
          )}
        </header>

        <main style={{ flex: 1 }}>
          <Outlet />
        </main>

        <footer className="app-footer">
          <div className="app-footer-inner">
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <KingLogo size={16} />
              <span
                style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}
              >
                OrgCheszer — FIDE-compliant tournament management
              </span>
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}
            >
              <button
                type="button"
                onClick={scrollToFeatures}
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--text-muted)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  padding: 0,
                  transition: "color 120ms ease",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.color =
                    "var(--camel-400)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.color =
                    "var(--text-muted)")
                }
              >
                Features
              </button>
              <Link
                to="/contact"
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  transition: "color 120ms ease",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color =
                    "var(--camel-400)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color =
                    "var(--text-muted)")
                }
              >
                Contact
              </Link>
              <span
                style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}
              >
                ♟ Spring Boot + React
              </span>
            </div>
          </div>
        </footer>

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
    </>
  );
}
// --- END OF FILE src/components/layout/Layout.tsx ---
