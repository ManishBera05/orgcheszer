// --- START OF FILE src/pages/StaffPanelPage.tsx ---
import { useState, useEffect, useRef } from "react";
import {
  useParams,
  useSearchParams,
  Link,
  useNavigate,
} from "react-router-dom";
import {
  useQuery,
  useMutation,
  useQueryClient,
  useQueries,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Shield,
  CheckCircle2,
  Swords,
  QrCode,
  Loader2,
  ChevronDown,
  Search,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { getMyTournamentHistory } from "../api/users";
import { getTournament } from "../api/tournaments";
import {
  getRoundPairings,
  submitResult,
  checkIn,
  redeemStaffKey,
} from "../api/matchmaking";
import TournamentCard from "../components/TournamentCard";
import type { GamePairingDTO, GameResult, ApiError } from "../types";

// Removed BYE from manual options
const RESULT_OPTIONS: { value: GameResult; label: string; color: string }[] = [
  { value: "WHITE_WINS", label: "White wins", color: "var(--camel-400)" },
  { value: "BLACK_WINS", label: "Black wins", color: "var(--camel-400)" },
  { value: "DRAW", label: "Draw", color: "var(--text-secondary)" },
];

function GameRow({
  game,
  tournamentId,
  roundNumber,
  isLocked,
}: {
  game: GamePairingDTO;
  tournamentId: string;
  roundNumber: number;
  isLocked: boolean;
}) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<GameResult | "">(
    game.result !== "PENDING" ? game.result : "",
  );
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // STAFF LOCK: Locked if parent locks it (past round) OR if game is already settled
  const isSettled = isLocked || game.result !== "PENDING";

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const mutation = useMutation({
    mutationFn: (result: GameResult) =>
      submitResult(tournamentId, game.gameId, result),
    onSuccess: (_, result) => {
      toast.success(`Board ${game.boardNumber}: result saved.`);
      setSelected(result);
      setOpen(false);
      queryClient.invalidateQueries({
        queryKey: ["pairings", tournamentId, roundNumber],
      });
    },
    onError: (err: ApiError) =>
      toast.error(err.message || "Failed to submit result."),
  });

  const currentLabel =
    selected === "BYE"
      ? "Bye"
      : selected
        ? (RESULT_OPTIONS.find((o) => o.value === selected)?.label ?? selected)
        : "Select result";

  return (
    <div className={`sp-game-row ${isSettled ? "settled" : ""}`}>
      <div className="sp-game-players">
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
          style={{ color: "var(--border-strong)", margin: "0 0.5rem" }}
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

        {game.blackName === "BYE" ? (
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

      <div
        ref={ref}
        style={{ position: "relative", width: "100%", maxWidth: "200px" }}
      >
        <button
          onClick={() => !isSettled && setOpen(!open)}
          disabled={mutation.isPending}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.4rem 0.625rem",
            background: isSettled ? "var(--accent-subtle)" : "var(--bg-base)",
            border: "1px solid var(--border)",
            borderRadius: "7px",
            color: isSettled ? "var(--accent-cta)" : "var(--text-muted)",
            fontSize: "0.8125rem",
            fontWeight: isSettled ? 600 : 400,
            cursor: isSettled ? "default" : "pointer",
          }}
        >
          <span
            style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}
          >
            {mutation.isPending && (
              <Loader2 size={12} className="animate-spin" />
            )}
            {isSettled && !mutation.isPending && (
              <CheckCircle2 size={12} style={{ color: "var(--success)" }} />
            )}
            {currentLabel}
          </span>
          {!isSettled && (
            <ChevronDown
              size={12}
              style={{
                transform: open ? "rotate(180deg)" : "none",
                transition: "transform 150ms",
              }}
            />
          )}
        </button>

        {open && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              marginTop: "4px",
              right: 0,
              left: 0,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              boxShadow: "var(--shadow-md)",
              zIndex: 50,
            }}
          >
            {RESULT_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => {
                  setOpen(false);
                  mutation.mutate(o.value);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "0.5rem 0.875rem",
                  background: "transparent",
                  border: "none",
                  color: o.color,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-interactive)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CheckInTab({ tournamentId }: { tournamentId: string }) {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const mutation = useMutation({
    mutationFn: () => checkIn(tournamentId, token.trim()),
    onSuccess: () => {
      toast.success("Player checked in!");
      setToken("");
    },
    onError: (err: ApiError) => {
      toast.error(err?.message || "Invalid token.");
    },
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        maxWidth: "600px",
        margin: "0 auto",
        padding: "2rem 0",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "0.625rem",
          padding: "1rem",
          background: "var(--accent-subtle)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
        }}
      >
        <QrCode
          size={18}
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
            QR Check-in
          </h4>
          <p
            style={{
              margin: 0,
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
            }}
          >
            Scan a player's Ticket Token to mark them physically present.
          </p>
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && token && mutation.mutate()}
          placeholder="Ticket Token..."
          style={{
            flex: 1,
            padding: "0.75rem",
            background: "var(--bg-base)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--text-primary)",
            outline: "none",
          }}
        />
        <button
          onClick={() => mutation.mutate()}
          disabled={!token || mutation.isPending}
          style={{
            padding: "0 1.25rem",
            background: "var(--accent-cta)",
            color: "var(--text-on-accent)",
            border: "none",
            borderRadius: "8px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
          }}
        >
          {mutation.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Search size={16} />
          )}{" "}
          Verify
        </button>
      </div>
    </div>
  );
}

export default function StaffPanelPage() {
  const { tournamentId } = useParams<{ tournamentId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [keyToRedeem, setKeyToRedeem] = useState("");
  const [activeTab, setActiveTab] = useState<"results" | "checkin">(
    searchParams.get("token") ? "checkin" : "results",
  );
  const [currentRound, setCurrentRound] = useState<number | null>(null);

  const { data: historyPage, isLoading: loadingHistory } = useQuery({
    queryKey: ["my-staff-tournaments"],
    queryFn: () => getMyTournamentHistory({ role: "STAFF", size: 100 }),
  });

  const { data: staffTournaments = [], isLoading: loadingFull } = useQuery({
    queryKey: [
      "my-full-staff-tournaments",
      historyPage?.content?.map((t) => t.tournamentId),
    ],
    enabled: !!historyPage?.content && historyPage.content.length > 0,
    queryFn: async () =>
      Promise.all(
        historyPage!.content.map((t) => getTournament(t.tournamentId)),
      ),
  });

  const isLoadingStaffList =
    loadingHistory || (historyPage?.content?.length! > 0 && loadingFull);

  const { data: activeTournament, isLoading: tLoading } = useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: () => getTournament(tournamentId!),
    enabled: !!tournamentId,
  });

  const roundQueries = useQueries({
    queries: Array.from({ length: activeTournament?.numberOfRounds || 0 }).map(
      (_, i) => ({
        queryKey: ["pairings", tournamentId, i + 1],
        queryFn: () => getRoundPairings(tournamentId!, i + 1),
        enabled: !!tournamentId && !!activeTournament,
        retry: 0,
      }),
    ),
  });

  const generatedRounds = roundQueries
    .map((q, i) => ({ round: i + 1, hasData: !!q.data?.pairings?.length }))
    .filter((r) => r.hasData)
    .map((r) => r.round);
  const latestGeneratedRound =
    generatedRounds.length > 0 ? Math.max(...generatedRounds) : 0;

  useEffect(() => {
    if (
      tournamentId &&
      currentRound === null &&
      roundQueries.every((q) => !q.isLoading)
    ) {
      setCurrentRound(latestGeneratedRound > 0 ? latestGeneratedRound : 1);
    }
  }, [roundQueries, currentRound, latestGeneratedRound, tournamentId]);

  const redeemMut = useMutation({
    mutationFn: () => redeemStaffKey(keyToRedeem),
    onSuccess: () => {
      toast.success("Key redeemed! You are now staff.");
      setKeyToRedeem("");
      queryClient.invalidateQueries({ queryKey: ["my-staff-tournaments"] });
      queryClient.invalidateQueries({
        queryKey: ["my-full-staff-tournaments"],
      });
    },
    onError: (err: ApiError) => toast.error(err.message || "Invalid Key."),
  });

  const round = currentRound ?? 1;
  const activePairings = roundQueries[round - 1]?.data;
  const isRoundLoading = roundQueries[round - 1]?.isLoading;

  const pendingGames =
    activePairings?.pairings.filter((g) => g.result === "PENDING") ?? [];
  const settledGames =
    activePairings?.pairings.filter((g) => g.result !== "PENDING") ?? [];
  const hasPairings = activePairings && activePairings.pairings.length > 0;

  const canGoNext = round < latestGeneratedRound;
  const canGoPrev = round > 1;
  const isRoundLocked =
    round < latestGeneratedRound ||
    activeTournament?.status === "COMPLETED" ||
    activeTournament?.status === "CANCELLED";

  return (
    <>
      <style>{`
        .sp-tab { padding: 0.75rem 1.25rem; font-size: 0.875rem; font-weight: 500; color: var(--text-muted); border: none; border-bottom: 2px solid transparent; background: transparent; cursor: pointer; transition: color 150ms; white-space: nowrap; }
        .sp-tab.active { color: var(--accent-cta); border-bottom-color: var(--accent-cta); font-weight: 600; }
        .sp-tab:hover:not(.active) { color: var(--text-primary); }
        .sp-game-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-subtle); }
        .sp-game-row:last-child { border-bottom: none; border-bottom-left-radius: 13px; border-bottom-right-radius: 13px; }
        .sp-game-row.settled { background: rgba(187,148,87,0.03); }
        .sp-game-players { display: flex; align-items: center; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; }
        .sp-nav-btn { display: flex; align-items: center; gap: 0.375rem; padding: 0.5rem 0.875rem; border: 1px solid var(--border); background: var(--bg-surface); color: var(--text-secondary); border-radius: 8px; font-weight: 500; cursor: pointer; transition: 150ms; }
        .sp-nav-btn:hover:not(:disabled) { border-color: var(--accent-cta); color: var(--text-primary); }
        .sp-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .org-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr)); gap: 1.25rem; }
        .sp-action-btn { display: inline-flex; align-items: center; gap: 0.375rem; justify-content: center; padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.8125rem; font-weight: 600; cursor: pointer; border: 1px solid var(--accent-cta); background: var(--bg-surface); color: var(--accent-cta); transition: all 150ms; width: 100%; }
        .sp-action-btn:hover { background: var(--accent-subtle); }
        @media (max-width: 640px) { .sp-game-row { flex-direction: column; align-items: stretch; gap: 0.75rem; } .sp-game-row > div:last-child { max-width: 100% !important; } }
      `}</style>

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "2.5rem 1.5rem 5rem",
        }}
      >
        {!tournamentId ? (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                marginBottom: "2rem",
              }}
            >
              <Shield size={24} style={{ color: "var(--accent-cta)" }} />
              <h1
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Staff Dashboard
              </h1>
            </div>

            <div
              style={{
                padding: "1.25rem",
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                marginBottom: "2.5rem",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "0.9375rem",
                    color: "var(--text-primary)",
                    margin: "0 0 0.25rem",
                  }}
                >
                  Become Staff
                </h3>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--text-muted)",
                    margin: 0,
                  }}
                >
                  Enter a key from an organizer to get access to a new
                  tournament.
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  value={keyToRedeem}
                  onChange={(e) => setKeyToRedeem(e.target.value)}
                  placeholder="Staff Key..."
                  style={{
                    width: "200px",
                    padding: "0.5rem 0.75rem",
                    background: "var(--bg-base)",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                />
                <button
                  onClick={() => redeemMut.mutate()}
                  disabled={!keyToRedeem || redeemMut.isPending}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "var(--accent-cta)",
                    color: "var(--text-on-accent)",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                  }}
                >
                  {redeemMut.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <ArrowRight size={14} />
                  )}{" "}
                  Redeem
                </button>
              </div>
            </div>

            <h2
              style={{
                fontSize: "1.25rem",
                color: "var(--text-primary)",
                marginBottom: "1rem",
              }}
            >
              My Tournaments
            </h2>
            {isLoadingStaffList ? (
              <div style={{ textAlign: "center", padding: "4rem" }}>
                <Loader2
                  size={24}
                  className="animate-spin text-muted"
                  style={{ margin: "0 auto" }}
                />
              </div>
            ) : staffTournaments.length === 0 ? (
              <p
                style={{
                  color: "var(--text-muted)",
                  textAlign: "center",
                  padding: "3rem",
                  border: "1px dashed var(--border)",
                  borderRadius: "12px",
                }}
              >
                You are not staff in any tournaments yet.
              </p>
            ) : (
              <div className="org-grid">
                {staffTournaments.map((t) => (
                  <div
                    key={t.tournamentId}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      overflow: "hidden",
                    }}
                  >
                    <TournamentCard t={t} />
                    <div
                      style={{
                        padding: "0.875rem 1.25rem",
                        background: "var(--bg-elevated)",
                        borderTop: "1px solid var(--border-subtle)",
                      }}
                    >
                      <button
                        className="sp-action-btn"
                        onClick={() =>
                          navigate(`/tournaments/${t.tournamentId}/staff`)
                        }
                      >
                        Manage as Staff <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <Link
              to="/staff"
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
              <ArrowLeft size={15} /> Back to Staff Dashboard
            </Link>

            {tLoading ? (
              <div style={{ textAlign: "center", padding: "4rem" }}>
                <Loader2
                  size={24}
                  className="animate-spin text-muted"
                  style={{ margin: "0 auto" }}
                />
              </div>
            ) : (
              <>
                <div style={{ marginBottom: "2rem" }}>
                  <h1
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      margin: "0 0 0.25rem",
                    }}
                  >
                    Manage Matchmaking
                  </h1>
                  <p
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "0.9375rem",
                      margin: 0,
                    }}
                  >
                    {activeTournament?.tournamentName}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    borderBottom: "1px solid var(--border-subtle)",
                    marginBottom: "2rem",
                    overflowX: "auto",
                  }}
                >
                  <button
                    className={`sp-tab ${activeTab === "results" ? "active" : ""}`}
                    onClick={() => setActiveTab("results")}
                  >
                    Submit Results
                  </button>
                  <button
                    className={`sp-tab ${activeTab === "checkin" ? "active" : ""}`}
                    onClick={() => setActiveTab("checkin")}
                  >
                    Check-in Player
                  </button>
                </div>

                {activeTab === "checkin" ? (
                  <CheckInTab tournamentId={tournamentId} />
                ) : (
                  <div style={{ maxWidth: "900px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        marginBottom: "1.5rem",
                      }}
                    >
                      <button
                        className="sp-nav-btn"
                        disabled={!canGoPrev}
                        onClick={() => setCurrentRound((r) => r! - 1)}
                      >
                        <ChevronLeft size={16} /> Prev
                      </button>
                      <span
                        style={{
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        Round {round} / {activeTournament?.numberOfRounds}
                      </span>
                      <button
                        className="sp-nav-btn"
                        disabled={!canGoNext}
                        onClick={() => setCurrentRound((r) => r! + 1)}
                      >
                        Next <ChevronRight size={16} />
                      </button>
                    </div>

                    <div
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "14px",
                      }}
                    >
                      {isRoundLoading || currentRound === null ? (
                        <div style={{ padding: "4rem", textAlign: "center" }}>
                          <Loader2
                            size={24}
                            className="animate-spin text-muted"
                            style={{ margin: "0 auto" }}
                          />
                        </div>
                      ) : !hasPairings ? (
                        <div style={{ padding: "3rem", textAlign: "center" }}>
                          <p style={{ color: "var(--text-muted)" }}>
                            Round {round} not generated yet.
                          </p>
                        </div>
                      ) : (
                        <>
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
                              {pendingGames.length} Pending
                            </span>
                            <span
                              style={{
                                fontSize: "0.8125rem",
                                color: "var(--success)",
                                fontWeight: 600,
                              }}
                            >
                              {settledGames.length} Settled
                            </span>
                          </div>
                          {[...pendingGames, ...settledGames]
                            .sort((a, b) => a.boardNumber - b.boardNumber)
                            .map((game) => (
                              <GameRow
                                key={game.gameId}
                                game={game}
                                tournamentId={tournamentId}
                                roundNumber={round}
                                isLocked={isRoundLocked}
                              />
                            ))}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
// --- END OF FILE src/pages/StaffPanelPage.tsx ---
