import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Trophy,
  Plus,
  ArrowRight,
  MapPin,
  Clock,
  Users,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import { getAllTournaments } from "../api/tournaments";
import { useAuth } from "../hooks/useAuth";
import {
  formatDate,
  formatEntryFee,
  statusClass,
  truncate,
} from "../lib/utils";
import type { TournamentResponse } from "../types";

/* ─── Decorative board corner ─────────────────────────────── */
function BoardCorner({ size = 220 }: { size?: number }) {
  const squares = Array.from({ length: 49 }, (_, i) => {
    const row = Math.floor(i / 7);
    const col = i % 7;
    return { isDark: (row + col) % 2 === 1, delay: (row + col) * 55 };
  });
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        width: `${size}px`,
        height: `${size}px`,
        opacity: 0,
        animation: "boardReveal 800ms ease 200ms forwards",
      }}
    >
      {squares.map((sq, i) => (
        <div
          key={i}
          style={{
            background: sq.isDark ? "var(--camel)" : "var(--coffee-600)",
            opacity: 0,
            animation: "squarePop 400ms ease forwards",
            animationDelay: `${sq.delay + 300}ms`,
            borderRadius: "1px",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Stat item ───────────────────────────────────────────── */
function StatItem({
  value,
  label,
  linkTo,
}: {
  value: string;
  label: string;
  linkTo?: string;
}) {
  const inner = (
    <>
      <span
        style={{
          fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
          fontWeight: 700,
          color: "var(--text-primary)",
          letterSpacing: "-0.04em",
          lineHeight: 1,
          display: "block",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: "0.8125rem",
          color: linkTo ? "var(--accent-cta)" : "var(--text-muted)",
          fontWeight: linkTo ? 600 : 400,
          marginTop: "0.25rem",
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
        }}
      >
        {label}
        {linkTo && <ChevronRight size={13} style={{ flexShrink: 0 }} />}
      </span>
    </>
  );

  if (linkTo) {
    return (
      <Link
        to={linkTo}
        style={{
          textDecoration: "none",
          padding: "1rem 1.25rem",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border)",
          background: "var(--bg-surface)",
          display: "flex",
          flexDirection: "column",
          transition:
            "border-color var(--transition-normal), box-shadow var(--transition-normal), transform var(--transition-normal)",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLAnchorElement;
          el.style.borderColor = "var(--accent-cta)";
          el.style.boxShadow = "0 0 0 3px rgba(187,148,87,0.12)";
          el.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLAnchorElement;
          el.style.borderColor = "var(--border)";
          el.style.boxShadow = "none";
          el.style.transform = "translateY(0)";
        }}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div
      style={{
        padding: "1rem 1.25rem",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-subtle)",
        background: "transparent",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {inner}
    </div>
  );
}

/* ─── Tournament card ─────────────────────────────────────── */
function TournamentCard({
  t,
  index,
}: {
  t: TournamentResponse;
  index: number;
}) {
  return (
    <Link
      to={`/tournaments/${t.tournamentId}`}
      style={{
        textDecoration: "none",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        overflow: "hidden",
        opacity: 0,
        animation: "cardSlideUp 400ms ease forwards",
        animationDelay: `${index * 100}ms`,
        transition:
          "border-color var(--transition-normal), box-shadow var(--transition-normal), transform var(--transition-normal)",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.borderColor = "var(--border-strong)";
        el.style.boxShadow = "var(--shadow-md)";
        el.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.borderColor = "var(--border)";
        el.style.boxShadow = "none";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* Card header accent */}
      <div
        style={{
          height: "3px",
          background: `linear-gradient(90deg, var(--accent-cta), var(--choc-400))`,
        }}
      />

      <div
        style={{
          padding: "1.375rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          flex: 1,
        }}
      >
        {/* Top row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "0.75rem",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                margin: 0,
                lineHeight: 1.35,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {t.tournamentName}
            </h3>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--text-muted)",
                margin: "0.25rem 0 0",
              }}
            >
              by {t.organizerName}
            </p>
          </div>
          <span
            className={`status-badge ${statusClass(t.status)}`}
            style={{ flexShrink: 0 }}
          >
            {t.status.toLowerCase()}
          </span>
        </div>

        {/* Description */}
        {t.description && (
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {truncate(t.description, 90)}
          </p>
        )}

        {/* Meta grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.625rem 1rem",
          }}
        >
          {[
            {
              icon: <CalendarDays size={13} />,
              text: formatDate(t.startDateTime),
            },
            { icon: <Clock size={13} />, text: t.timeControl },
            { icon: <MapPin size={13} />, text: truncate(t.location, 22) },
            {
              icon: <Users size={13} />,
              text: `${t.currentNumberOfParticipants} / ${t.maxParticipants}`,
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                color: "var(--text-muted)",
                fontSize: "0.8125rem",
              }}
            >
              <span style={{ color: "var(--camel-600)", flexShrink: 0 }}>
                {item.icon}
              </span>
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {item.text}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "0.875rem",
            borderTop: "1px solid var(--border-subtle)",
            marginTop: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                background: "var(--bg-elevated)",
                padding: "0.2rem 0.6rem",
                borderRadius: "4px",
                letterSpacing: "0.03em",
                textTransform: "uppercase",
              }}
            >
              {t.format}
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                background: "var(--bg-elevated)",
                padding: "0.2rem 0.6rem",
                borderRadius: "4px",
              }}
            >
              {t.numberOfRounds}R
            </span>
          </div>
          <span
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--accent-cta)",
            }}
          >
            {formatEntryFee(t.entryFee)}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─── Skeleton card ───────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        overflow: "hidden",
        padding: "1.375rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <div
        style={{
          height: "3px",
          background: "var(--border)",
          borderRadius: 0,
          margin: "-1.375rem -1.5rem 0",
          marginBottom: "1rem",
        }}
      />
      <div className="skeleton" style={{ height: "20px", width: "70%" }} />
      <div className="skeleton" style={{ height: "14px", width: "40%" }} />
      <div className="skeleton" style={{ height: "40px" }} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.625rem",
        }}
      >
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: "14px" }} />
        ))}
      </div>
    </div>
  );
}

/* ─── HomePage ────────────────────────────────────────────── */
export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Fetch upcoming tournaments — backend will filter by status once param is supported
  // TODO: when backend supports /api/tournaments?status=UPCOMING, this will auto-filter
  const { data: allTournaments, isLoading } = useQuery({
    queryKey: ["tournaments", "UPCOMING"],
    queryFn: () => getAllTournaments("UPCOMING"),
    staleTime: 60_000,
  });

  const upcomingTournaments = (allTournaments ?? []).slice(0, 3);

  function handleCreateTournament() {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    navigate("/dashboard");
  }

  return (
    <>
      <style>{`
        @keyframes boardReveal  { from { opacity:0; transform:scale(0.96) rotate(3deg); } to { opacity:1; transform:scale(1) rotate(3deg); } }
        @keyframes squarePop    { from { opacity:0; transform:scale(0.5); } to { opacity:0.22; transform:scale(1); } }
        @keyframes heroFadeUp   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes cardSlideUp  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pieceDrift   { 0%,100% { transform:translateY(0) rotate(-2deg); } 50% { transform:translateY(-10px) rotate(-2deg); } }

        .home-hero {
          position: relative;
          overflow: hidden;
          border-bottom: 1px solid var(--border-subtle);
          padding: 5rem 0 4rem;
        }
        .home-hero-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: center;
        }
        .hero-left {
          animation: heroFadeUp 500ms ease forwards;
        }
        .hero-right {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          animation: heroFadeUp 500ms ease 120ms forwards;
          opacity: 0;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }
        .cta-row {
          display: flex;
          gap: 0.875rem;
          flex-wrap: wrap;
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.8125rem 1.5rem;
          background: var(--accent-cta);
          color: var(--text-on-accent);
          border: none;
          border-radius: var(--radius-md);
          font-size: 0.9375rem;
          font-weight: 600;
          font-family: var(--font-sans);
          cursor: pointer;
          text-decoration: none;
          transition: background var(--transition-fast), transform var(--transition-fast);
          white-space: nowrap;
          min-height: 48px;
        }
        .btn-primary:hover  { background: var(--accent-hover); transform: translateY(-1px); color: var(--text-on-accent); }
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.8125rem 1.5rem;
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 0.9375rem;
          font-weight: 500;
          font-family: var(--font-sans);
          cursor: pointer;
          text-decoration: none;
          transition: border-color var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
          white-space: nowrap;
          min-height: 48px;
        }
        .btn-secondary:hover { border-color: var(--border-strong); color: var(--text-primary); transform: translateY(-1px); }

        .board-deco {
          position: absolute;
          top: -40px;
          right: -40px;
          pointer-events: none;
          z-index: 0;
        }
        .section-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.75rem;
        }
        .tournaments-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }

        /* ── Responsive ── */
        @media (max-width: 960px) {
          .home-hero-inner    { grid-template-columns: 1fr; gap: 2.5rem; padding-top: 0; }
          .hero-right         { order: -1; }
          .stats-grid         { grid-template-columns: repeat(3, 1fr); }
          .board-deco         { display: none; }
          .home-hero          { padding: 3rem 0 3rem; }
          .tournaments-grid   { grid-template-columns: repeat(2, 1fr); }
          .feature-grid       { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .home-hero          { padding: 2rem 0 2.5rem; }
          .stats-grid         { grid-template-columns: 1fr 1fr; }
          .cta-row            { flex-direction: column; }
          .cta-row .btn-primary,
          .cta-row .btn-secondary { width: 100%; justify-content: center; }
          .tournaments-grid   { grid-template-columns: 1fr; }
          .feature-grid       { grid-template-columns: 1fr; }
          .section-header     { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
        }
        @media (max-width: 380px) {
          .stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ══════════ HERO ══════════ */}
      <section className="home-hero">
        {/* Decorative rotated chess board — top-right corner */}
        <div className="board-deco">
          <BoardCorner size={260} />
        </div>

        {/* Ambient glow */}
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "30%",
            width: "500px",
            height: "500px",
            background:
              "radial-gradient(circle, rgba(187,148,87,0.07) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />

        <div className="home-hero-inner">
          {/* ── Left — brand ── */}
          <div className="hero-left">
            {/* Eyebrow */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.3rem 0.875rem",
                background: "var(--accent-subtle)",
                border: "1px solid var(--border)",
                borderRadius: "99px",
                marginBottom: "1.5rem",
              }}
            >
              <span style={{ fontSize: "0.875rem" }}>♟</span>
              <span
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--camel-400)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                FIDE-compliant
              </span>
            </div>

            <h1
              style={{
                fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
                marginBottom: "1.25rem",
              }}
            >
              Run tournaments
              <br />
              <span
                style={{
                  color: "var(--accent-cta)",
                  position: "relative",
                  display: "inline-block",
                }}
              >
                like a grandmaster.
                {/* Underline accent */}
                <span
                  style={{
                    position: "absolute",
                    bottom: "-4px",
                    left: 0,
                    right: 0,
                    height: "3px",
                    background:
                      "linear-gradient(90deg, var(--accent-cta), transparent)",
                    borderRadius: "2px",
                  }}
                />
              </span>
            </h1>

            <p
              style={{
                fontSize: "clamp(1rem, 2vw, 1.125rem)",
                color: "var(--text-secondary)",
                lineHeight: 1.7,
                marginBottom: "2.25rem",
                maxWidth: "480px",
              }}
            >
              OrgCheszer handles Swiss & Round-Robin pairings, live FIDE
              tiebreaker leaderboards, QR check-ins, and staff management — so
              you can focus on the game.
            </p>

            {/* CTAs */}
            <div className="cta-row">
              <button className="btn-primary" onClick={handleCreateTournament}>
                <Plus size={17} strokeWidth={2.5} />
                Create a tournament
              </button>
              <Link to="/tournaments" className="btn-secondary">
                <Trophy size={16} />
                Browse tournaments
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* ── Right — stats ── */}
          <div
            className="hero-right"
            style={{ position: "relative", zIndex: 1 }}
          >
            {/* Floating chess piece */}
            <div
              style={{
                fontSize: "5rem",
                lineHeight: 1,
                textAlign: "center",
                marginBottom: "0.5rem",
                animation: "pieceDrift 5s ease-in-out infinite",
                filter: "drop-shadow(0 12px 32px rgba(187,148,87,0.25))",
                userSelect: "none",
              }}
            >
              ♜
            </div>

            {/* Stats grid */}
            {/* TODO: replace placeholder values with real data from /api/stats once endpoint is ready */}
            <div className="stats-grid">
              <StatItem value="—" label="Total tournaments" />
              <StatItem value="—" label="Registered players" />
              <StatItem
                value="—"
                label="Active tournaments →"
                linkTo="/tournaments"
              />
            </div>

            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                textAlign: "center",
                marginTop: "0.25rem",
              }}
            >
              Live platform stats coming soon
            </p>
          </div>
        </div>
      </section>

      {/* ══════════ UPCOMING TOURNAMENTS ══════════ */}
      <section style={{ padding: "4rem 0" }}>
        <div
          style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}
        >
          <div className="section-header">
            <div>
              <h2
                style={{
                  fontSize: "clamp(1.25rem, 3vw, 1.625rem)",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.02em",
                  marginBottom: "0.25rem",
                }}
              >
                Upcoming tournaments
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                Open registrations — find your next game
              </p>
            </div>
            <Link
              to="/tournaments"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "var(--accent-cta)",
                textDecoration: "none",
                whiteSpace: "nowrap",
                padding: "0.4rem 0.75rem",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                transition:
                  "border-color var(--transition-fast), background var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = "var(--accent-cta)";
                el.style.background = "var(--accent-subtle)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = "var(--border)";
                el.style.background = "transparent";
              }}
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {/* Cards */}
          {isLoading ? (
            <div className="tournaments-grid">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : upcomingTournaments.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "4rem 1.5rem",
                background: "var(--bg-surface)",
                border: "1px dashed var(--border)",
                borderRadius: "var(--radius-xl)",
                color: "var(--text-muted)",
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>
                ♟
              </div>
              <p style={{ fontWeight: 500, color: "var(--text-secondary)" }}>
                No upcoming tournaments yet
              </p>
              <p style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
                Be the first to create one
              </p>
              <button
                className="btn-primary"
                onClick={handleCreateTournament}
                style={{ marginTop: "1.5rem" }}
              >
                <Plus size={16} />
                Create tournament
              </button>
            </div>
          ) : (
            <div className="tournaments-grid">
              {upcomingTournaments.map((t, i) => (
                <TournamentCard key={t.tournamentId} t={t} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════ FEATURE HIGHLIGHTS ══════════ */}
      <section
        style={{
          padding: "4rem 0 5rem",
          borderTop: "1px solid var(--border-subtle)",
          background: "var(--bg-surface)",
        }}
      >
        <div
          style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}
        >
          <div style={{ marginBottom: "2.5rem" }}>
            <h2
              style={{
                fontSize: "clamp(1.25rem, 3vw, 1.625rem)",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
                marginBottom: "0.25rem",
              }}
            >
              Everything you need to run a professional event
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              Built for serious chess organisers and competitive players
            </p>
          </div>

          <div className="feature-grid">
            {[
              {
                icon: "♛",
                title: "FIDE tiebreakers",
                desc: "Buchholz, Buchholz Cut-1, and Sonneborn-Berger computed automatically after every round.",
              },
              {
                icon: "⚙",
                title: "Swiss & Round-Robin",
                desc: "Automatic colour-balanced pairings following FIDE Dutch system rules.",
              },
              {
                icon: "▦",
                title: "QR check-in",
                desc: "Players show their QR ticket, staff scans or types the token — no paper lists.",
              },
              {
                icon: "♟",
                title: "Staff management",
                desc: "Generate one-time staff keys, share them with arbiters, revoke at any time.",
              },
              {
                icon: "◈",
                title: "Live leaderboard",
                desc: "Board-by-board pairings and standings update the moment a result is entered.",
              },
              {
                icon: "✦",
                title: "Player profiles",
                desc: "Every participant gets a tournament history with per-round opponent breakdown.",
              },
            ].map((f, i) => (
              <div
                key={f.title}
                style={{
                  padding: "1.5rem",
                  background: "var(--bg-base)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  opacity: 0,
                  animation: "cardSlideUp 400ms ease forwards",
                  animationDelay: `${i * 80}ms`,
                  transition: "border-color var(--transition-normal)",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.borderColor =
                    "var(--border-strong)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.borderColor =
                    "var(--border)")
                }
              >
                <div
                  style={{
                    fontSize: "1.5rem",
                    marginBottom: "0.875rem",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--accent-subtle)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  {f.icon}
                </div>
                <h3
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: "0.5rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-muted)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ BOTTOM CTA BANNER ══════════ */}
      <section style={{ padding: "4rem 0" }}>
        <div
          style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}
        >
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-2xl)",
              padding: "clamp(2rem, 5vw, 3.5rem)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "2rem",
              flexWrap: "wrap",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Background chess piece watermark */}
            <div
              style={{
                position: "absolute",
                right: "2rem",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "8rem",
                opacity: 0.04,
                pointerEvents: "none",
                userSelect: "none",
                lineHeight: 1,
              }}
            >
              ♔
            </div>

            <div style={{ position: "relative", zIndex: 1 }}>
              <h2
                style={{
                  fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.03em",
                  marginBottom: "0.5rem",
                }}
              >
                Ready to run your tournament?
              </h2>
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "var(--text-muted)",
                  margin: 0,
                }}
              >
                Free to organise. Free to join. Just bring your players.
              </p>
            </div>

            <div
              className="cta-row"
              style={{ position: "relative", zIndex: 1, flexWrap: "nowrap" }}
            >
              <button className="btn-primary" onClick={handleCreateTournament}>
                <Plus size={16} />
                Get started
              </button>
              <Link to="/tournaments" className="btn-secondary">
                Browse events
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
