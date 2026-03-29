// --- START OF FILE src/pages/RoundPairingsPage.tsx ---
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Loader2,
  Swords,
} from "lucide-react";
import { getRoundPairings } from "../api/matchmaking";
import { getTournament } from "../api/tournaments";
import type { GamePairingDTO } from "../types";

type Side = "white" | "black";
function getResultScore(result: string, side: Side): string {
  if (result === "PENDING") return "·";
  if (result === "BYE") return side === "white" ? "1" : "—";
  if (result === "DRAW") return "½";
  if (result === "WHITE_WINS") return side === "white" ? "1" : "0";
  if (result === "BLACK_WINS") return side === "white" ? "0" : "1";
  return "·";
}
function getResultColor(result: string, side: Side): string {
  if (result === "PENDING") return "var(--text-muted)";
  if (result === "DRAW") return "var(--camel-400)";
  if (result === "BYE")
    return side === "white" ? "var(--success)" : "var(--text-muted)";
  const win =
    (side === "white" && result === "WHITE_WINS") ||
    (side === "black" && result === "BLACK_WINS");
  return win ? "var(--success)" : "var(--danger)";
}
function getResultBg(result: string, side: Side): string {
  if (result === "PENDING") return "transparent";
  if (result === "DRAW") return "rgba(187,148,87,0.1)";
  if (result === "BYE")
    return side === "white" ? "rgba(74,158,107,0.1)" : "transparent";
  const win =
    (side === "white" && result === "WHITE_WINS") ||
    (side === "black" && result === "BLACK_WINS");
  return win ? "rgba(74,158,107,0.1)" : "rgba(211,77,75,0.08)";
}

function ScorePill({ result, side }: { result: string; side: Side }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "32px",
        height: "32px",
        borderRadius: "8px",
        background: getResultBg(result, side),
        fontSize: "0.9375rem",
        fontWeight: 700,
        color: getResultColor(result, side),
        flexShrink: 0,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {getResultScore(result, side)}
    </span>
  );
}

function RoundStatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const cfg: Record<string, { label: string; color: string; bg: string }> = {
    IN_PROGRESS: {
      label: "In progress",
      color: "var(--success)",
      bg: "rgba(74,158,107,0.12)",
    },
    COMPLETED: {
      label: "Completed",
      color: "var(--camel-600)",
      bg: "rgba(156,121,64,0.1)",
    },
    PENDING: {
      label: "Not started",
      color: "var(--text-muted)",
      bg: "var(--bg-elevated)",
    },
  };
  const s = cfg[status] ?? {
    label: status,
    color: "var(--text-muted)",
    bg: "var(--bg-elevated)",
  };
  return (
    <span
      style={{
        fontSize: "0.75rem",
        fontWeight: 600,
        color: s.color,
        background: s.bg,
        padding: "0.2rem 0.65rem",
        borderRadius: "99px",
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

function PairingRow({ game }: { game: GamePairingDTO }) {
  const isBye = game.result === "BYE";
  const isSettled = game.result !== "PENDING";

  return (
    <div className={`rp-game-row ${isSettled ? "settled" : ""}`}>
      <div className="rp-game-players">
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--text-muted)",
            textAlign: "center",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "5px",
            padding: "0.15rem 0.35rem",
            marginRight: "0.5rem",
          }}
        >
          {game.boardNumber}
        </span>

        <Link
          to={`/users/${game.whiteId || game.whiteName}`}
          style={{
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
            fontWeight: game.result === "WHITE_WINS" ? 600 : 400,
            flex: 1,
            textAlign: "right",
            textDecoration: "none",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--accent-cta)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-secondary)")
          }
        >
          {game.whiteName}
        </Link>

        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            padding: "0.1rem 0.375rem",
            background: "var(--bg-elevated)",
            borderRadius: "4px",
            marginLeft: "0.5rem",
          }}
        >
          W
        </span>
        <Swords
          size={13}
          style={{
            color: "var(--border-strong)",
            margin: "0 0.5rem",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            padding: "0.1rem 0.375rem",
            background: "var(--bg-elevated)",
            borderRadius: "4px",
            marginRight: "0.5rem",
          }}
        >
          B
        </span>

        {isBye ? (
          <em style={{ color: "var(--text-muted)", flex: 1 }}>BYE</em>
        ) : (
          <Link
            to={`/users/${game.blackId || game.blackName}`}
            style={{
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              fontWeight: game.result === "BLACK_WINS" ? 600 : 400,
              flex: 1,
              textDecoration: "none",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--accent-cta)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-secondary)")
            }
          >
            {game.blackName}
          </Link>
        )}
      </div>

      <div className="rp-game-result">
        <ScorePill result={game.result} side="white" />
        <span
          style={{
            fontSize: "0.6875rem",
            color: "var(--border-strong)",
            fontWeight: 600,
            margin: "0 0.5rem",
          }}
        >
          vs
        </span>
        {isBye ? (
          <span style={{ minWidth: "32px" }} />
        ) : (
          <ScorePill result={game.result} side="black" />
        )}
      </div>
    </div>
  );
}

export default function RoundPairingsPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [selectedRound, setSelectedRound] = useState<number | null>(null);

  const { data: tournament, isLoading: tLoading } = useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: () => getTournament(tournamentId!),
    enabled: !!tournamentId,
  });

  const latestRound = tournament?.currentRound || 0;

  // Initialize default view to the latest generated round
  useEffect(() => {
    if (tournament && selectedRound === null) {
      setSelectedRound(Math.max(1, latestRound));
    }
  }, [tournament, selectedRound, latestRound]);

  const round = selectedRound ?? 1;

  // ONLY fetch pairings if the round has actually been generated
  const { data: pairings, isLoading: pLoading } = useQuery({
    queryKey: ["pairings", tournamentId, round],
    queryFn: () => getRoundPairings(tournamentId!, round),
    enabled: !!tournamentId && round <= latestRound && latestRound > 0,
    refetchInterval:
      tournament?.status === "ONGOING" && round === latestRound
        ? 30_000
        : false,
  });

  const pending =
    pairings?.pairings.filter((g) => g.result === "PENDING").length ?? 0;
  const done = (pairings?.pairings.length ?? 0) - pending;
  const sorted = [...(pairings?.pairings ?? [])].sort(
    (a, b) => a.boardNumber - b.boardNumber,
  );

  const canGoNext = round < latestRound;
  const canGoPrev = round > 1;

  const isLoading =
    tLoading || selectedRound === null || (pLoading && round <= latestRound);
  const isNotGenerated = round > latestRound;

  if (tLoading || selectedRound === null)
    return (
      <div style={{ textAlign: "center", padding: "5rem" }}>
        <Loader2
          className="animate-spin text-muted"
          size={24}
          style={{ margin: "0 auto" }}
        />
      </div>
    );

  return (
    <>
      <style>{`
        @keyframes rp-fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .rp-page { max-width: 1000px; margin: 0 auto; padding: 2.5rem 1.5rem 5rem; animation: rp-fadeIn 300ms ease forwards; }
        .rp-nav-btn { display: flex; align-items: center; gap: 0.375rem; padding: 0.5rem 0.875rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-surface); color: var(--text-secondary); font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: 150ms; }
        .rp-nav-btn:hover:not(:disabled) { border-color: var(--border-strong); color: var(--text-primary); }
        .rp-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        .rp-game-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-subtle); background: var(--bg-surface); }
        .rp-game-row:last-child { border-bottom: none; border-bottom-left-radius: 13px; border-bottom-right-radius: 13px; }
        .rp-game-row.settled { background: rgba(187,148,87,0.03); }
        .rp-game-players { display: flex; align-items: center; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; }
        .rp-game-result { display: flex; align-items: center; flex-shrink: 0; }

        @media (max-width: 640px) { 
          .rp-page { padding: 1.25rem 0.875rem 4rem; } 
          .rp-nav-btn span.nav-label { display: none; } 
          .rp-game-row { flex-direction: column; align-items: stretch; gap: 0.75rem; } 
          .rp-game-result { justify-content: center; background: var(--bg-elevated); padding: 0.5rem; border-radius: 8px; }
        }
      `}</style>

      <div className="rp-page">
        <Link
          to={`/tournaments/${tournamentId}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            color: "var(--text-muted)",
            fontSize: "0.875rem",
            textDecoration: "none",
            marginBottom: "1.5rem",
          }}
        >
          <ArrowLeft size={15} /> Back to tournament
        </Link>

        <div style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              flexWrap: "wrap",
              marginBottom: "0.375rem",
            }}
          >
            <h1
              style={{
                fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Round {round} Pairings
            </h1>
            <RoundStatusBadge status={pairings?.roundStatus} />
          </div>
          {tournament && (
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.9rem",
                margin: 0,
              }}
            >
              {tournament.tournamentName}
              {!isNotGenerated && (
                <span>
                  {" "}
                  · {done} done
                  {pending > 0 && (
                    <span style={{ color: "var(--warning)" }}>
                      {" "}
                      · {pending} pending
                    </span>
                  )}
                </span>
              )}
            </p>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            marginBottom: "1.5rem",
          }}
        >
          <button
            className="rp-nav-btn"
            disabled={!canGoPrev}
            onClick={() => setSelectedRound((r) => r! - 1)}
          >
            <ChevronLeft size={15} />
            <span className="nav-label">Prev</span>
          </button>
          <span
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: "0.875rem",
              color: "var(--text-muted)",
              fontWeight: 600,
            }}
          >
            Round {round} / {tournament?.numberOfRounds || "?"}
          </span>
          <button
            className="rp-nav-btn"
            disabled={!canGoNext}
            onClick={() => setSelectedRound((r) => r! + 1)}
          >
            <span className="nav-label">Next</span>
            <ChevronRight size={15} />
          </button>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}
        >
          {isLoading ? (
            <div style={{ padding: "4rem", textAlign: "center" }}>
              <Loader2
                className="animate-spin text-muted"
                size={24}
                style={{ margin: "0 auto" }}
              />
            </div>
          ) : isNotGenerated ? (
            <div
              style={{
                textAlign: "center",
                padding: "4rem 1.5rem",
                background: "var(--bg-surface)",
                border: "1px dashed var(--border)",
                borderRadius: "12px",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>⚠</div>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                  marginBottom: "0.25rem",
                }}
              >
                Round {round} not generated yet
              </p>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                The organiser will generate pairings before the round starts.
              </p>
            </div>
          ) : (
            <>
              {/* Header row for stats */}
              <div
                style={{
                  padding: "1rem",
                  background: "var(--bg-elevated)",
                  borderBottom: "1px solid var(--border)",
                  borderTopLeftRadius: "13px",
                  borderTopRightRadius: "13px",
                  display: "flex",
                  gap: "1.5rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--warning)",
                    fontWeight: 600,
                  }}
                >
                  {pending} Pending
                </span>
                <span
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--success)",
                    fontWeight: 600,
                  }}
                >
                  {done} Settled
                </span>
              </div>
              {sorted.map((game) => (
                <PairingRow key={game.gameId} game={game} />
              ))}
            </>
          )}
        </div>

        {!isLoading && !isNotGenerated && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              marginTop: "1.75rem",
              paddingTop: "1.75rem",
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            <Link
              to={`/tournaments/${tournamentId}/leaderboard`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "var(--accent-cta)",
                textDecoration: "none",
                padding: "0.5rem 0.875rem",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
            >
              Leaderboard <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
// --- END OF FILE src/pages/RoundPairingsPage.tsx ---
