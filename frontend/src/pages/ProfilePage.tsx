// --- START OF FILE src/pages/ProfilePage.tsx ---
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  // User,
  Mail,
  Phone,
  Calendar,
  Trophy,
  Swords,
  Shield,
  Loader2,
  ChevronRight,
} from "lucide-react";
import {
  getMyProfile,
  getPublicProfile,
  getMyTournamentHistory,
} from "../api/users";
import { initials } from "../lib/utils";
import type { MyTournamentDTO } from "../types";

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
        border: `1px solid ${accent ? "var(--accent-cta)" : "var(--border)"}`,
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
          color: accent ? "var(--accent-cta)" : "var(--camel-600)",
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
          color: "var(--text-primary)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function ProfilePage() {
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [page, setPage] = useState(0);
  const [historyList, setHistoryList] = useState<MyTournamentDTO[]>([]);

  // 1. Fetch Me
  const { data: me, isLoading: loadingMe } = useQuery({
    queryKey: ["my-profile"],
    queryFn: getMyProfile,
  });

  // 2. Fetch Public Stats
  const { data: stats } = useQuery({
    queryKey: ["public-profile", me?.userId],
    queryFn: () => getPublicProfile(me!.userId),
    enabled: !!me?.userId,
  });

  // 3. Fetch Tournament History
  const { data: historyPage, isFetching: loadingHistory } = useQuery({
    queryKey: ["my-history", roleFilter, page],
    queryFn: () => getMyTournamentHistory({ role: roleFilter, page, size: 10 }),
  });

  // FIX: Robust state synchronization for filtering and pagination
  useEffect(() => {
    if (historyPage) {
      setHistoryList((prev) => {
        if (page === 0) return historyPage.content;
        const existing = new Set(prev.map((t) => t.tournamentId));
        const newItems = historyPage.content.filter(
          (t) => !existing.has(t.tournamentId),
        );
        return [...prev, ...newItems];
      });
    }
  }, [historyPage, page, roleFilter]);

  const handleRoleChange = (role: string) => {
    if (role === roleFilter) return;
    setRoleFilter(role);
    setPage(0);
    setHistoryList([]); // Clear immediately for UX
  };

  if (loadingMe)
    return (
      <div style={{ textAlign: "center", padding: "5rem" }}>
        <Loader2
          className="animate-spin text-muted"
          size={24}
          style={{ margin: "0 auto" }}
        />
      </div>
    );
  if (!me) return null;

  return (
    <>
      <style>{`
        .prof-page { max-width: 1000px; margin: 0 auto; padding: 2.5rem 1.5rem 5rem; }
        
        .prof-user-card { display: flex; gap: 1.5rem; alignItems: center; background: var(--bg-surface); border: 1px solid var(--border); border-radius: 16px; padding: 2rem; marginBottom: 2rem; }
        .prof-user-details { display: flex; flex-wrap: wrap; gap: 1rem; }
        
        .prof-tab-container { display: flex; gap: 0.25rem; background: var(--bg-elevated); padding: 0.25rem; border-radius: 99px; border: 1px solid var(--border); overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; }
        .prof-tab-container::-webkit-scrollbar { display: none; }
        .prof-tab { padding: 0.5rem 1rem; font-size: 0.8125rem; font-weight: 500; color: var(--text-muted); border: 1px solid transparent; border-radius: 99px; background: transparent; cursor: pointer; transition: all 150ms; white-space: nowrap; }
        .prof-tab.active { background: var(--accent-subtle); color: var(--accent-cta); border-color: var(--accent-cta); font-weight: 600; }
        
        .prof-history-card { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px; text-decoration: none; transition: 150ms; gap: 1rem; }
        .prof-history-card:hover { border-color: var(--accent-cta); background: var(--bg-interactive); transform: translateY(-1px); }
        .prof-history-meta { display: flex; alignItems: center; gap: 0.75rem; fontSize: 0.8125rem; color: var(--text-muted); flex-wrap: wrap; }

        @media (max-width: 640px) {
          .prof-page { padding: 1.5rem 1rem 4rem; }
          .prof-user-card { flex-direction: column; align-items: flex-start; gap: 1rem; padding: 1.5rem; }
          .prof-user-details { flex-direction: column; gap: 0.5rem; }
          .prof-history-card { flex-direction: column; align-items: flex-start; }
          .prof-history-card > svg { display: none; } /* Hide arrow on mobile to save space */
        }
      `}</style>
      <div className="prof-page">
        {/* User Card */}
        <div className="prof-user-card">
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "var(--accent-subtle)",
              border: "2px solid var(--accent-cta)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              fontWeight: 800,
              color: "var(--accent-cta)",
              flexShrink: 0,
            }}
          >
            {initials(`${me.firstName} ${me.lastName}`)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontSize: "clamp(1.5rem, 4vw, 1.875rem)",
                fontWeight: 800,
                color: "var(--text-primary)",
                margin: "0 0 0.5rem",
              }}
            >
              {me.firstName} {me.lastName}
            </h1>
            <div className="prof-user-details">
              {me.fideId && (
                <span
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <Trophy size={14} /> FIDE: {me.fideId}
                </span>
              )}
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                <Mail size={14} /> {me.email}
              </span>
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                <Phone size={14} /> {me.mobileNo}
              </span>
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                <Calendar size={14} /> Born: {me.date_of_birth}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div style={{ marginBottom: "3rem" }}>
            <h3
              style={{
                fontSize: "1.125rem",
                color: "var(--text-primary)",
                marginBottom: "1rem",
              }}
            >
              Lifetime Statistics
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "1rem",
              }}
            >
              <StatCard
                icon={<Trophy size={16} />}
                label="Tournaments Played"
                value={stats.tournamentsPlayed}
                accent
              />
              <StatCard
                icon={<Swords size={16} />}
                label="Games Played"
                value={stats.gamesPlayed}
              />
              <StatCard
                icon={<Swords size={16} />}
                label="Won"
                value={stats.gamesWon}
              />
              <StatCard
                icon={<Swords size={16} />}
                label="Drawn"
                value={stats.gamesDrawn}
              />
              <StatCard
                icon={<Swords size={16} />}
                label="Lost"
                value={stats.gamesLost}
              />
              <StatCard
                icon={<Shield size={16} />}
                label="Organized / Staffed"
                value={stats.tournamentsOrganized + stats.tournamentsStaffed}
              />
            </div>
          </div>
        )}

        {/* My Tournaments */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <h3
              style={{
                fontSize: "1.25rem",
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              My Tournaments
            </h3>
            <div className="prof-tab-container">
              {["ALL", "PLAYER", "ORGANIZER", "STAFF"].map((r) => (
                <button
                  key={r}
                  onClick={() => handleRoleChange(r)}
                  className={`prof-tab ${roleFilter === r ? "active" : ""}`}
                >
                  {r === "ALL" ? "All Roles" : r}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {historyList.length === 0 && !loadingHistory ? (
              <div
                style={{
                  padding: "3rem",
                  textAlign: "center",
                  border: "1px dashed var(--border)",
                  borderRadius: "12px",
                  background: "var(--bg-surface)",
                }}
              >
                <p style={{ color: "var(--text-muted)", margin: 0 }}>
                  No tournaments found for this role.
                </p>
              </div>
            ) : (
              historyList.map((t) => (
                <Link
                  key={t.tournamentId}
                  to={`/users/${me.userId}/tournaments/${t.tournamentId}`}
                  className="prof-history-card"
                >
                  <div style={{ minWidth: 0, width: "100%" }}>
                    <h4
                      style={{
                        margin: "0 0 0.375rem",
                        fontSize: "1rem",
                        color: "var(--text-primary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {t.tournamentName}
                    </h4>
                    <div className="prof-history-meta">
                      <span
                        style={{ fontWeight: 600, color: "var(--camel-400)" }}
                      >
                        {t.role}
                      </span>
                      <span>•</span>
                      <span>{t.format.replace("_", " ")}</span>
                      <span>•</span>
                      <span
                        style={{
                          color:
                            t.status === "ONGOING"
                              ? "var(--success)"
                              : "inherit",
                        }}
                      >
                        {t.status}
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    style={{ color: "var(--border-strong)", flexShrink: 0 }}
                  />
                </Link>
              ))
            )}

            {loadingHistory && page === 0 && (
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <Loader2
                  className="animate-spin text-muted"
                  size={20}
                  style={{ margin: "0 auto" }}
                />
              </div>
            )}

            {historyPage && !historyPage.last && (
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={loadingHistory}
                style={{
                  padding: "0.875rem",
                  marginTop: "0.5rem",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "150ms",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "var(--accent-cta)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "var(--border)")
                }
              >
                {loadingHistory ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                    style={{ margin: "0 auto" }}
                  />
                ) : (
                  "Load More Tournaments"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
// --- END OF FILE src/pages/ProfilePage.tsx ---
