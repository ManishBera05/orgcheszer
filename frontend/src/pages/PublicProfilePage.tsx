import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Trophy,
  Swords,
  BarChart2,
  Users,
  Star,
} from "lucide-react";
import { getPublicProfile } from "../api/users";
import { initials } from "../lib/utils";

/* ─── Stat card ───────────────────────────────────────────── */
function StatCard({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: `1px solid ${accent ? "var(--border)" : "var(--border-subtle)"}`,
        borderRadius: "12px",
        padding: "1.125rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.375rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          color: "var(--camel-600)",
        }}
      >
        {icon}
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontSize: "1.625rem",
          fontWeight: 800,
          color: accent ? "var(--accent-cta)" : "var(--text-primary)",
          letterSpacing: "-0.04em",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ─── Win-rate bar ────────────────────────────────────────── */
function WinRateBar({
  wins,
  draws,
  losses,
}: {
  wins: number;
  draws: number;
  losses: number;
}) {
  const total = wins + draws + losses;
  if (total === 0) return null;
  const wPct = (wins / total) * 100;
  const dPct = (draws / total) * 100;
  const lPct = (losses / total) * 100;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.8125rem",
        }}
      >
        <span style={{ color: "var(--success)", fontWeight: 600 }}>
          {wins}W
        </span>
        <span style={{ color: "var(--camel-400)", fontWeight: 600 }}>
          {draws}D
        </span>
        <span style={{ color: "var(--danger)", fontWeight: 600 }}>
          {losses}L
        </span>
      </div>
      <div
        style={{
          height: "8px",
          borderRadius: "99px",
          overflow: "hidden",
          display: "flex",
          background: "var(--bg-elevated)",
        }}
      >
        {wPct > 0 && (
          <div
            style={{
              width: `${wPct}%`,
              background: "var(--success)",
              transition: "width 600ms ease",
            }}
          />
        )}
        {dPct > 0 && (
          <div
            style={{
              width: `${dPct}%`,
              background: "var(--camel-400)",
              transition: "width 600ms ease",
            }}
          />
        )}
        {lPct > 0 && (
          <div
            style={{
              width: `${lPct}%`,
              background: "var(--danger)",
              transition: "width 600ms ease",
            }}
          />
        )}
      </div>
      <p
        style={{
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          margin: 0,
          textAlign: "right",
        }}
      >
        {total > 0 ? `${Math.round(wPct)}% win rate` : ""}
      </p>
    </div>
  );
}

/* ─── Skeleton ────────────────────────────────────────────── */
function ProfileSkeleton() {
  return (
    <div
      style={{ maxWidth: "720px", margin: "0 auto", padding: "2.5rem 1.5rem" }}
    >
      <div
        className="skeleton"
        style={{
          height: "80px",
          width: "80px",
          borderRadius: "50%",
          marginBottom: "1rem",
        }}
      />
      <div
        className="skeleton"
        style={{ height: "28px", width: "200px", marginBottom: "0.5rem" }}
      />
      <div
        className="skeleton"
        style={{ height: "16px", width: "120px", marginBottom: "2rem" }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
        }}
      >
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: "90px", borderRadius: "12px" }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── PublicProfilePage ───────────────────────────────────── */
export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();

  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["public-profile", userId],
    queryFn: () => getPublicProfile(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });

  if (isLoading) return <ProfileSkeleton />;

  if (isError || !profile) {
    return (
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "5rem 1.5rem",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>👤</div>
        <h2 style={{ color: "var(--text-primary)", marginBottom: "0.5rem" }}>
          Player not found
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
          This profile may not exist or the link is invalid.
        </p>
        <Link
          to="/tournaments"
          style={{
            color: "var(--accent-cta)",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          ← Browse tournaments
        </Link>
      </div>
    );
  }

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const winRate =
    profile.gamesPlayed > 0
      ? Math.round((profile.gamesWon / profile.gamesPlayed) * 100)
      : 0;

  return (
    <>
      <style>{`
        @keyframes pp-fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .pp-page  { max-width: 720px; margin: 0 auto; padding: 2.5rem 1.5rem 5rem; animation: pp-fadeIn 300ms ease forwards; }
        .pp-grid  { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.875rem; }
        .pp-grid2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.875rem; }
        @media (max-width: 540px) {
          .pp-page  { padding: 1.5rem 1rem 4rem; }
          .pp-grid  { grid-template-columns: repeat(2, 1fr); }
          .pp-grid2 { grid-template-columns: 1fr; }
        }
        @media (max-width: 380px) {
          .pp-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="pp-page">
        {/* ── Back ── */}
        <button
          onClick={() => history.back()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            fontSize: "0.875rem",
            cursor: "pointer",
            padding: "0 0 1.5rem",
            fontFamily: "var(--font-sans)",
            transition: "color 150ms ease",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color =
              "var(--text-primary)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color =
              "var(--text-muted)")
          }
        >
          <ArrowLeft size={15} /> Back
        </button>

        {/* ── Player hero ── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "1.25rem",
            marginBottom: "2rem",
            flexWrap: "wrap",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "var(--accent-subtle)",
              border: "2px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--accent-cta)",
              flexShrink: 0,
            }}
          >
            {initials(fullName)}
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontSize: "clamp(1.375rem, 4vw, 1.875rem)",
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "-0.04em",
                margin: 0,
                marginBottom: "0.375rem",
              }}
            >
              {fullName}
            </h1>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.625rem",
                alignItems: "center",
              }}
            >
              {profile.fideId && (
                <span
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--text-muted)",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "99px",
                  }}
                >
                  FIDE {profile.fideId}
                </span>
              )}
              {profile.eloRating > 0 && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "var(--accent-cta)",
                  }}
                >
                  <Star size={13} style={{ fill: "var(--accent-cta)" }} />
                  {profile.eloRating} ELO
                </span>
              )}
              {profile.gamesPlayed > 0 && (
                <span
                  style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}
                >
                  {winRate}% win rate
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Tournament involvement ── */}
        <h2
          style={{
            fontSize: "0.8125rem",
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "0.875rem",
          }}
        >
          Tournaments
        </h2>
        <div className="pp-grid" style={{ marginBottom: "1.5rem" }}>
          <StatCard
            icon={<Trophy size={13} />}
            label="Played"
            value={profile.tournamentsPlayed}
            accent
          />
          <StatCard
            icon={<Users size={13} />}
            label="Organised"
            value={profile.tournamentsOrganized}
          />
          <StatCard
            icon={<BarChart2 size={13} />}
            label="Staffed"
            value={profile.tournamentsStaffed}
          />
        </div>

        {/* ── Game stats ── */}
        <h2
          style={{
            fontSize: "0.8125rem",
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "0.875rem",
          }}
        >
          Game record
        </h2>
        <div className="pp-grid" style={{ marginBottom: "1.25rem" }}>
          <StatCard
            icon={<Swords size={13} />}
            label="Played"
            value={profile.gamesPlayed}
          />
          <StatCard
            icon={<Swords size={13} />}
            label="Won"
            value={profile.gamesWon}
            accent
          />
          <StatCard
            icon={<Swords size={13} />}
            label="Drawn"
            value={profile.gamesDrawn}
          />
          <StatCard
            icon={<Swords size={13} />}
            label="Lost"
            value={profile.gamesLost}
          />
        </div>

        {/* Win-rate bar */}
        {profile.gamesPlayed > 0 && (
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "1.125rem 1.25rem",
              marginBottom: "1.5rem",
            }}
          >
            <p
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: "0.875rem",
              }}
            >
              Win / Draw / Loss breakdown
            </p>
            <WinRateBar
              wins={Number(profile.gamesWon)}
              draws={Number(profile.gamesDrawn)}
              losses={Number(profile.gamesLost)}
            />
          </div>
        )}
      </div>
    </>
  );
}
