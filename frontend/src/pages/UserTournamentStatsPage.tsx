// --- START OF FILE src/pages/UserTournamentStatsPage.tsx ---
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Swords, AlertCircle, Loader2 } from "lucide-react";
import { getUserTournamentStats } from "../api/users";
import { formatScore } from "../lib/utils";

function StatBox({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        padding: "1rem",
        background: highlight ? "var(--accent-subtle)" : "var(--bg-surface)",
        border: `1px solid ${highlight ? "var(--accent-cta)" : "var(--border)"}`,
        borderRadius: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
      }}
    >
      <span
        style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "1.25rem",
          fontWeight: 700,
          color: highlight ? "var(--accent-cta)" : "var(--text-primary)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function UserTournamentStatsPage() {
  const { userId, tournamentId } = useParams<{
    userId: string;
    tournamentId: string;
  }>();
  const navigate = useNavigate();

  const {
    data: stats,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["user-tournament-stats", userId, tournamentId],
    queryFn: () => getUserTournamentStats(userId!, tournamentId!),
    enabled: !!userId && !!tournamentId,
  });

  if (isLoading)
    return (
      <div style={{ textAlign: "center", padding: "5rem" }}>
        <Loader2
          className="animate-spin text-muted"
          size={24}
          style={{ margin: "0 auto" }}
        />
      </div>
    );
  if (isError || !stats)
    return (
      <div style={{ textAlign: "center", padding: "5rem" }}>
        <AlertCircle
          size={40}
          style={{ color: "var(--danger)", margin: "0 auto 1rem" }}
        />
        <h2>Stats not found</h2>
      </div>
    );

  return (
    <>
      <style>{`
        .uts-page { max-width: 800px; margin: 0 auto; padding: 2.5rem 1.5rem 5rem; }
        .uts-stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        
        .uts-opp-grid { display: grid; grid-template-columns: 60px 1fr 100px; padding: 0.75rem 1rem; align-items: center; border-bottom: 1px solid var(--border-subtle); gap: 0.5rem; }
        .uts-opp-header { background: var(--bg-elevated); border-bottom: 1px solid var(--border); fontSize: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }
        
        .uts-role-badge { padding: 0.25rem 0.75rem; background: var(--bg-elevated); border: 1px solid var(--border); borderRadius: 99px; fontSize: 0.8125rem; font-weight: 600; color: var(--text-secondary); }
        .uts-rank-badge { padding: 0.25rem 0.75rem; background: rgba(187,148,87,0.15); border: 1px solid var(--accent-cta); borderRadius: 99px; fontSize: 0.8125rem; font-weight: 600; color: var(--accent-cta); }

        @media (max-width: 500px) {
          .uts-page { padding: 1.5rem 1rem 4rem; }
          .uts-stat-grid { grid-template-columns: 1fr 1fr; }
          .uts-opp-grid { grid-template-columns: 50px 1fr 80px; padding: 0.75rem; }
        }
      `}</style>
      <div className="uts-page">
        <button
          onClick={() => navigate(-1)}
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
          }}
        >
          <ArrowLeft size={15} /> Back
        </button>

        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "clamp(1.5rem, 4vw, 1.875rem)",
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: "0 0 0.25rem",
            }}
          >
            Tournament Performance
          </h1>
          <p
            style={{ color: "var(--text-muted)", fontSize: "1rem", margin: 0 }}
          >
            <Link
              to={`/tournaments/${stats.tournamentId}`}
              style={{
                color: "var(--camel-400)",
                textDecoration: "none",
                fontWeight: 500,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--accent-cta)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--camel-400)")
              }
            >
              {stats.tournamentName}
            </Link>
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "2rem",
            flexWrap: "wrap",
          }}
        >
          <span className="uts-role-badge">Role: {stats.role}</span>
          {stats.finalRank !== null && (
            <span className="uts-rank-badge">Rank #{stats.finalRank}</span>
          )}
        </div>

        {stats.role === "PLAYER" ? (
          <>
            <div className="uts-stat-grid">
              <StatBox
                label="Score"
                value={formatScore(stats.currentScore)}
                highlight
              />
              <StatBox label="Games" value={stats.gamesPlayed} />
              <StatBox
                label="Record (W/D/L)"
                value={
                  <span>
                    {stats.wins}/{stats.draws}/{stats.losses}
                  </span>
                }
              />
              <StatBox label="Buchholz" value={stats.buchholz.toFixed(1)} />
              <StatBox
                label="Buchholz Cut-1"
                value={stats.buchholzCut1.toFixed(1)}
              />
              <StatBox
                label="Sonneborn-Berger"
                value={stats.sonnenbornBerger.toFixed(1)}
              />
            </div>

            <h3
              style={{
                fontSize: "1.125rem",
                color: "var(--text-primary)",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Swords size={18} /> Opponent History
            </h3>
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              <div className="uts-opp-grid uts-opp-header">
                <span>Round</span>
                <span>Opponent</span>
                <span style={{ textAlign: "right" }}>Result</span>
              </div>
              {stats.opponents.length === 0 ? (
                <p
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    margin: 0,
                  }}
                >
                  No games played yet.
                </p>
              ) : (
                stats.opponents
                  .sort((a, b) => a.roundNumber - b.roundNumber)
                  .map((o) => (
                    <div key={o.roundNumber} className="uts-opp-grid">
                      <span
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {o.roundNumber}
                      </span>
                      <div style={{ minWidth: 0, overflow: "hidden" }}>
                        {o.opponentName === "BYE" ? (
                          <span
                            style={{
                              fontSize: "0.875rem",
                              color: "var(--text-muted)",
                              fontStyle: "italic",
                            }}
                          >
                            BYE
                          </span>
                        ) : (
                          <Link
                            to={`/users/${o.opponentId}`}
                            style={{
                              fontSize: "0.875rem",
                              color: "var(--text-primary)",
                              textDecoration: "none",
                              fontWeight: 500,
                              display: "block",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.color =
                                "var(--accent-cta)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.color =
                                "var(--text-primary)")
                            }
                          >
                            {o.opponentName}
                          </Link>
                        )}
                      </div>
                      <span
                        style={{
                          textAlign: "right",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color:
                            o.result.includes("WIN") || o.result === "BYE"
                              ? "var(--success)"
                              : o.result === "DRAW"
                                ? "var(--camel-400)"
                                : "var(--danger)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {o.result.replace("_", " ")}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </>
        ) : (
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              background: "var(--bg-surface)",
              border: "1px dashed var(--border)",
              borderRadius: "12px",
            }}
          >
            <p style={{ color: "var(--text-muted)", margin: 0 }}>
              You participated in this tournament as{" "}
              <strong>{stats.role}</strong>. Gameplay statistics are only
              tracked for players.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
// --- END OF FILE src/pages/UserTournamentStatsPage.tsx ---
