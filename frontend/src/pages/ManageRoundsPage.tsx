// --- START OF FILE src/pages/ManageRoundsPage.tsx ---
import { useState, useEffect, useRef } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import {
  useQuery,
  useMutation,
  useQueryClient,
  useQueries,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Swords,
  Loader2,
  CheckCircle2,
  ChevronDown,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Users,
  Flag,
  QrCode,
  Search,
} from "lucide-react";
import {
  getTournament,
  getPendingRequests,
  approveRequest,
  rejectRequest,
  getTournamentStaffs,
  endTournament,
} from "../api/tournaments";
import {
  getRoundPairings,
  submitResult,
  generateNextRound,
  generateStaffKeys,
  getStaffKeys,
  checkIn,
} from "../api/matchmaking";
import type {
  GamePairingDTO,
  GameResult,
  ApiError,
  RegistrationRequestDTO,
} from "../types";

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

  const isSettled = isLocked;

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
    <div
      className={`mr-game-row ${game.result !== "PENDING" ? "settled" : ""}`}
    >
      <div className="mr-game-players">
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
            background:
              game.result !== "PENDING"
                ? "var(--accent-subtle)"
                : "var(--bg-base)",
            border: "1px solid var(--border)",
            borderRadius: "7px",
            color:
              game.result !== "PENDING"
                ? "var(--accent-cta)"
                : "var(--text-muted)",
            fontSize: "0.8125rem",
            fontWeight: game.result !== "PENDING" ? 600 : 400,
            cursor: isSettled ? "default" : "pointer",
          }}
        >
          <span
            style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}
          >
            {mutation.isPending && (
              <Loader2 size={12} className="animate-spin" />
            )}
            {game.result !== "PENDING" && !mutation.isPending && (
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

// Added Pagination state specifically for requests
function RequestsManager({ tournamentId }: { tournamentId: string }) {
  const queryClient = useQueryClient();
  const [reqPage, setReqPage] = useState(0);
  const [reqList, setReqList] = useState<RegistrationRequestDTO[]>([]);

  const { data: requestsPage, isFetching } = useQuery({
    queryKey: ["requests", tournamentId, reqPage],
    queryFn: () => getPendingRequests(tournamentId, reqPage, 20),
    enabled: !!tournamentId,
  });

  useEffect(() => {
    if (requestsPage) {
      if (reqPage === 0) setReqList(requestsPage.content);
      else setReqList((prev) => [...prev, ...requestsPage.content]);
    }
  }, [requestsPage, reqPage]);

  const approveMut = useMutation({
    mutationFn: (id: string) => approveRequest(tournamentId, id),
    onSuccess: () => {
      toast.success("Approved!");
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
  const rejectMut = useMutation({
    mutationFn: (id: string) => rejectRequest(tournamentId, id),
    onSuccess: () => {
      toast.success("Rejected.");
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
    onError: (e: ApiError) => toast.error(e.message),
  });

  if (isFetching && reqPage === 0)
    return <Loader2 size={20} className="animate-spin text-muted" />;
  if (reqList.length === 0)
    return <p style={{ color: "var(--text-muted)" }}>No pending requests.</p>;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        maxWidth: "800px",
      }}
    >
      {reqList.map((r) => (
        <div key={r.requestId} className="req-card">
          <div>
            <h4
              style={{
                margin: "0 0 0.25rem",
                color: "var(--text-primary)",
                fontSize: "0.9375rem",
              }}
            >
              {r.playerName}
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: "0.8125rem",
                color: "var(--text-muted)",
              }}
            >
              ELO: {r.playerEloRating} | FIDE: {r.playerFideId || "N/A"}
            </p>
          </div>
          <div className="req-actions">
            <button
              onClick={() => rejectMut.mutate(r.requestId)}
              disabled={rejectMut.isPending || approveMut.isPending}
              style={{
                padding: "0.5rem 1rem",
                background: "rgba(211,77,75,0.1)",
                color: "var(--danger)",
                border: "1px solid rgba(211,77,75,0.3)",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.8125rem",
                fontWeight: 600,
              }}
            >
              Reject
            </button>
            <button
              onClick={() => approveMut.mutate(r.requestId)}
              disabled={rejectMut.isPending || approveMut.isPending}
              style={{
                padding: "0.5rem 1rem",
                background: "rgba(74,158,107,0.1)",
                color: "var(--success)",
                border: "1px solid rgba(74,158,107,0.3)",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.8125rem",
                fontWeight: 600,
              }}
            >
              Approve
            </button>
          </div>
        </div>
      ))}

      {requestsPage && !requestsPage.last && (
        <button
          onClick={() => setReqPage((p) => p + 1)}
          disabled={isFetching}
          style={{
            padding: "0.75rem",
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--text-secondary)",
            fontWeight: 500,
            cursor: "pointer",
            marginTop: "0.5rem",
          }}
        >
          {isFetching ? "Loading..." : "Load more requests"}
        </button>
      )}
    </div>
  );
}

function KeysManager({ tournamentId }: { tournamentId: string }) {
  const queryClient = useQueryClient();
  const [numKeys, setNumKeys] = useState(5);
  const { data: keys, isLoading: kLoad } = useQuery({
    queryKey: ["staff-keys", tournamentId],
    queryFn: () => getStaffKeys(tournamentId),
    enabled: !!tournamentId,
  });
  const { data: staffs, isLoading: sLoad } = useQuery({
    queryKey: ["staffs", tournamentId],
    queryFn: () => getTournamentStaffs(tournamentId),
    enabled: !!tournamentId,
  });
  const genMut = useMutation({
    mutationFn: () => generateStaffKeys(tournamentId, numKeys),
    onSuccess: () => {
      toast.success("Keys generated!");
      queryClient.invalidateQueries({ queryKey: ["staff-keys"] });
    },
    onError: (e: ApiError) => toast.error(e.message),
  });

  if (kLoad || sLoad)
    return <Loader2 size={20} className="animate-spin text-muted" />;

  return (
    <div className="keys-grid">
      <div>
        <h3
          style={{
            fontSize: "1rem",
            color: "var(--text-primary)",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <KeyRound size={16} /> Generated Keys
        </h3>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <input
            type="number"
            min="1"
            max="20"
            value={numKeys}
            onChange={(e) => setNumKeys(Number(e.target.value))}
            style={{
              width: "80px",
              padding: "0.5rem",
              background: "var(--bg-base)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              color: "var(--text-primary)",
              outline: "none",
            }}
          />
          <button
            onClick={() => genMut.mutate()}
            disabled={genMut.isPending}
            style={{
              padding: "0.5rem 1rem",
              background: "var(--accent-cta)",
              color: "var(--text-on-accent)",
              border: "none",
              borderRadius: "6px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Generate
          </button>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            maxHeight: "400px",
            overflowY: "auto",
            paddingRight: "0.5rem",
          }}
        >
          {keys?.map((k: any) => (
            <div
              key={k.keyValue}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0.75rem",
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
              }}
            >
              <code style={{ color: "var(--camel-400)", fontWeight: 600 }}>
                {k.keyValue}
              </code>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: k.used ? "var(--danger)" : "var(--success)",
                }}
              >
                {k.used ? "Used" : "Available"}
              </span>
            </div>
          ))}
          {keys?.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              No keys generated.
            </p>
          )}
        </div>
      </div>
      <div>
        <h3
          style={{
            fontSize: "1rem",
            color: "var(--text-primary)",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Users size={16} /> Active Staff
        </h3>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          {staffs?.map((s: any) => (
            <div
              key={s.userID}
              style={{
                padding: "0.75rem",
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
              }}
            >
              <Link
                to={`/users/${s.userID}`}
                style={{
                  textDecoration: "none",
                  color: "var(--text-primary)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: "0.25rem",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--accent-cta)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-primary)")
                }
              >
                {s.name}
              </Link>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                }}
              >
                Key used:{" "}
                <code style={{ color: "var(--text-secondary)" }}>
                  {s.keyUsed}
                </code>
              </p>
            </div>
          ))}
          {staffs?.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              No active staff.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ManageRoundsPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    "rounds" | "checkin" | "requests" | "keys"
  >("rounds");
  const [currentRound, setCurrentRound] = useState<number | null>(null);

  const { data: tournament, isLoading: tLoading } = useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: () => getTournament(tournamentId!),
    enabled: !!tournamentId,
  });

  const roundQueries = useQueries({
    queries: Array.from({ length: tournament?.numberOfRounds || 0 }).map(
      (_, i) => ({
        queryKey: ["pairings", tournamentId, i + 1],
        queryFn: () => getRoundPairings(tournamentId!, i + 1),
        enabled: !!tournament,
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
    if (currentRound === null && roundQueries.every((q) => !q.isLoading)) {
      setCurrentRound(latestGeneratedRound > 0 ? latestGeneratedRound : 1);
    }
  }, [roundQueries, currentRound, latestGeneratedRound]);

  const round = currentRound ?? 1;
  const activePairings = roundQueries[round - 1]?.data;
  const isRoundLoading = roundQueries[round - 1]?.isLoading;

  const generateMut = useMutation({
    mutationFn: () => generateNextRound(tournamentId!),
    onSuccess: () => {
      toast.success("Pairings generated!");
      queryClient.invalidateQueries({ queryKey: ["tournament"] });
      queryClient.invalidateQueries({ queryKey: ["pairings"] });
      setCurrentRound(latestGeneratedRound + 1);
    },
    onError: (err: ApiError) =>
      toast.error(err.message || "Failed to generate round."),
  });

  const endTourneyMut = useMutation({
    mutationFn: () => endTournament(tournamentId!),
    onSuccess: () => {
      toast.success("Tournament successfully completed!");
      queryClient.invalidateQueries({ queryKey: ["tournament"] });
    },
    onError: (err: ApiError) =>
      toast.error(err.message || "Failed to end tournament."),
  });

  if (tLoading || currentRound === null)
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <Loader2
          size={24}
          className="animate-spin text-muted"
          style={{ margin: "0 auto" }}
        />
      </div>
    );
  if (!tournament) return null;

  const pendingGames =
    activePairings?.pairings.filter((g) => g.result === "PENDING") ?? [];
  const settledGames =
    activePairings?.pairings.filter((g) => g.result !== "PENDING") ?? [];
  const hasPairings = activePairings && activePairings.pairings.length > 0;

  const canGoPrev = round > 1;
  const canGoNext = round < latestGeneratedRound;

  const latestRoundPairings =
    roundQueries[latestGeneratedRound - 1]?.data?.pairings || [];
  const latestRoundPending = latestRoundPairings.filter(
    (g) => g.result === "PENDING",
  ).length;

  const canGenerate =
    latestGeneratedRound === 0 ||
    (latestRoundPending === 0 &&
      latestGeneratedRound < tournament.numberOfRounds);
  const canEndTournament =
    latestGeneratedRound > 0 &&
    latestRoundPending === 0 &&
    tournament.status !== "COMPLETED" &&
    tournament.status !== "CANCELLED";

  const isRoundLocked =
    round < latestGeneratedRound ||
    tournament.status === "COMPLETED" ||
    tournament.status === "CANCELLED";

  return (
    <>
      <style>{`
        .mr-tab { padding: 0.75rem 1.25rem; font-size: 0.875rem; font-weight: 500; color: var(--text-muted); border: none; border-bottom: 2px solid transparent; background: transparent; cursor: pointer; transition: color 150ms; white-space: nowrap; }
        .mr-tab.active { color: var(--accent-cta); border-bottom-color: var(--accent-cta); font-weight: 600; }
        .mr-tab:hover:not(.active) { color: var(--text-primary); }

        .mr-game-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-subtle); }
        .mr-game-row:last-child { border-bottom: none; }
        .mr-game-row.settled { background: rgba(187,148,87,0.03); }
        .mr-game-players { display: flex; align-items: center; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; }
        .mr-nav-btn { display: flex; align-items: center; gap: 0.375rem; padding: 0.5rem 0.875rem; border: 1px solid var(--border); background: var(--bg-surface); color: var(--text-secondary); border-radius: 8px; font-weight: 500; cursor: pointer; transition: 150ms; }
        .mr-nav-btn:hover:not(:disabled) { border-color: var(--accent-cta); color: var(--text-primary); }
        .mr-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        
        .req-card { display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border); border-radius: 8px; gap: 1rem; }
        .req-actions { display: flex; gap: 0.5rem; }
        .keys-grid { display: grid; gap: 2rem; grid-template-columns: 1fr 1fr; }

        @media (max-width: 640px) { 
          .mr-game-row { flex-direction: column; align-items: stretch; gap: 0.75rem; } 
          .mr-game-row > div:last-child { max-width: 100% !important; } 
          .req-card { flex-direction: column; align-items: stretch; } 
          .req-actions { width: 100%; justify-content: stretch; } 
          .req-actions button { flex: 1; text-align: center; justify-content: center; } 
          .keys-grid { grid-template-columns: 1fr; } 
        }
      `}</style>
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "2.5rem 1.5rem 5rem",
        }}
      >
        <Link
          to="/dashboard"
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
          <ArrowLeft size={15} /> Back to Dashboard
        </Link>

        <div
          style={{
            marginBottom: "2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: "0 0 0.25rem",
              }}
            >
              Manage Tournament
            </h1>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.9375rem",
                margin: 0,
              }}
            >
              {tournament.tournamentName}
            </p>
          </div>

          <button
            onClick={() => {
              if (latestGeneratedRound < tournament.numberOfRounds) {
                if (
                  confirm(
                    `WARNING: You are ending the tournament early (Round ${latestGeneratedRound} of ${tournament.numberOfRounds} completed).\n\nFinal standings will be permanently locked. Are you sure you want to proceed?`,
                  )
                ) {
                  endTourneyMut.mutate();
                }
              } else {
                if (
                  confirm(
                    "Are you sure you want to end this tournament? Final standings will be permanently locked.",
                  )
                ) {
                  endTourneyMut.mutate();
                }
              }
            }}
            disabled={!canEndTournament || endTourneyMut.isPending}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.25rem",
              background: "var(--danger-bg)",
              color: "var(--danger)",
              border: "1px solid rgba(211,77,75,0.4)",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: !canEndTournament ? "not-allowed" : "pointer",
              opacity: !canEndTournament ? 0.5 : 1,
            }}
          >
            {endTourneyMut.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Flag size={16} />
            )}{" "}
            End Tournament
          </button>
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
            className={`mr-tab ${activeTab === "rounds" ? "active" : ""}`}
            onClick={() => setActiveTab("rounds")}
          >
            Matchmaking
          </button>
          <button
            className={`mr-tab ${activeTab === "checkin" ? "active" : ""}`}
            onClick={() => setActiveTab("checkin")}
          >
            Check-in
          </button>
          <button
            className={`mr-tab ${activeTab === "requests" ? "active" : ""}`}
            onClick={() => setActiveTab("requests")}
          >
            Requests
          </button>
          <button
            className={`mr-tab ${activeTab === "keys" ? "active" : ""}`}
            onClick={() => setActiveTab("keys")}
          >
            Staff Keys
          </button>
        </div>

        {activeTab === "rounds" && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                <button
                  className="mr-nav-btn"
                  disabled={!canGoPrev}
                  onClick={() => setCurrentRound((r) => r! - 1)}
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  Round {round} / {tournament.numberOfRounds}
                </span>
                <button
                  className="mr-nav-btn"
                  disabled={!canGoNext}
                  onClick={() => setCurrentRound((r) => r! + 1)}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>

              <button
                onClick={() => generateMut.mutate()}
                disabled={
                  generateMut.isPending ||
                  !canGenerate ||
                  tournament.status === "COMPLETED" ||
                  tournament.status === "CANCELLED"
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1.25rem",
                  background: "var(--accent-cta)",
                  color: "var(--text-on-accent)",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: !canGenerate ? "not-allowed" : "pointer",
                  opacity: !canGenerate ? 0.5 : 1,
                }}
              >
                {generateMut.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <PlayCircle size={16} />
                )}{" "}
                Generate Next Round
              </button>
            </div>

            {isRoundLocked && (
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--warning)",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <CheckCircle2 size={14} /> Results for this round are locked
                because a newer round exists or the tournament ended.
              </p>
            )}

            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "14px",
              }}
            >
              {isRoundLoading ? (
                <div style={{ padding: "4rem", textAlign: "center" }}>
                  <Loader2
                    size={24}
                    className="animate-spin text-muted"
                    style={{ margin: "0 auto" }}
                  />
                </div>
              ) : !hasPairings ? (
                <div style={{ padding: "5rem 1.5rem", textAlign: "center" }}>
                  <Swords
                    size={32}
                    style={{
                      color: "var(--border-strong)",
                      margin: "0 auto 1rem",
                    }}
                  />
                  <h3
                    style={{
                      color: "var(--text-primary)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Round {round} not generated
                  </h3>
                  <p
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "0.9375rem",
                    }}
                  >
                    Ensure all matches from previous rounds are submitted, then
                    click "Generate Next Round".
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
                        tournamentId={tournamentId!}
                        roundNumber={round}
                        isLocked={isRoundLocked}
                      />
                    ))}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === "checkin" && <CheckInTab tournamentId={tournamentId!} />}
        {activeTab === "requests" && (
          <RequestsManager tournamentId={tournamentId!} />
        )}
        {activeTab === "keys" && <KeysManager tournamentId={tournamentId!} />}
      </div>
    </>
  );
}
// --- END OF FILE src/pages/ManageRoundsPage.tsx ---
