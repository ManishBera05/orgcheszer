import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarDays,
  MapPin,
  Clock,
  Users,
  Hash,
  Phone,
  UserCircle,
  Trophy,
  BarChart2,
  ChevronRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Swords,
} from "lucide-react";
import {
  getTournament,
  getTournamentPlayers,
  registerForTournament,
} from "../api/tournaments";
import { useAuth } from "../hooks/useAuth";
import {
  formatDateTime,
  formatEntryFee,
  statusClass,
  truncate,
  initials,
} from "../lib/utils";
import type { ApiError, TournamentPlayerDTO } from "../types";

/* ─── Section card wrapper ────────────────────────────────── */
function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "14px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          padding: "1rem 1.375rem",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-elevated)",
        }}
      >
        <span style={{ color: "var(--accent-cta)" }}>{icon}</span>
        <h2
          style={{
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: "var(--text-primary)",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h2>
      </div>
      <div style={{ padding: "1.375rem" }}>{children}</div>
    </div>
  );
}

/* ─── Detail row ──────────────────────────────────────────── */
function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        padding: "0.625rem 0",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <span
        style={{ color: "var(--camel-600)", marginTop: "1px", flexShrink: 0 }}
      >
        {icon}
      </span>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
          {label}
        </span>
        <span
          style={{
            fontSize: "0.875rem",
            color: "var(--text-primary)",
            fontWeight: 500,
            textAlign: "right",
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

/* ─── Player avatar ───────────────────────────────────────── */
function PlayerRow({ p, rank }: { p: TournamentPlayerDTO; rank: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.875rem",
        padding: "0.625rem 0",
        borderBottom: "1px solid var(--border-subtle)",
        animation: "td-fadeIn 250ms ease forwards",
        animationDelay: `${rank * 30}ms`,
        opacity: 0,
      }}
    >
      {/* Rank */}
      <span
        style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "var(--text-muted)",
          width: "20px",
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {rank}
      </span>
      {/* Avatar */}
      <div
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "50%",
          background: "var(--accent-subtle)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.75rem",
          fontWeight: 700,
          color: "var(--accent-cta)",
          flexShrink: 0,
        }}
      >
        {initials(`${p.firstName} ${p.lastName}`)}
      </div>
      {/* Name + FIDE */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "var(--text-primary)",
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {p.firstName} {p.lastName}
        </p>
        {p.fideId && (
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              margin: 0,
            }}
          >
            FIDE {p.fideId}
          </p>
        )}
      </div>
      {/* ELO */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <span
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "var(--camel-400)",
          }}
        >
          {p.eloRating > 0 ? p.eloRating : "—"}
        </span>
        {/* Check-in status dot */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "0.25rem",
            marginTop: "2px",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              display: "inline-block",
              background:
                p.checkInStatus === "CHECKED_IN"
                  ? "var(--success)"
                  : "var(--border-strong)",
            }}
          />
          <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
            {p.checkInStatus === "CHECKED_IN" ? "In" : "Not in"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Skeleton ────────────────────────────────────────────── */
function PageSkeleton() {
  return (
    <div
      style={{ maxWidth: "1100px", margin: "0 auto", padding: "2.5rem 1.5rem" }}
    >
      <div
        className="skeleton"
        style={{ height: "28px", width: "200px", marginBottom: "2rem" }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "1.5rem",
        }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {[160, 220, 180].map((h, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: `${h}px`, borderRadius: "14px" }}
            />
          ))}
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {[200, 240].map((h, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: `${h}px`, borderRadius: "14px" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── TournamentDetailPage ────────────────────────────────── */
export default function TournamentDetailPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const [registered, setRegistered] = useState(false);

  const {
    data: tournament,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: () => getTournament(tournamentId!),
    enabled: !!tournamentId,
  });

  const { data: players = [] } = useQuery({
    queryKey: ["tournament-players", tournamentId],
    queryFn: () => getTournamentPlayers(tournamentId!),
    enabled: !!tournamentId,
  });

  const joinMutation = useMutation({
    mutationFn: () => registerForTournament(tournamentId!),
    onSuccess: () => {
      toast.success("You're registered! See you at the board.");
      setRegistered(true);
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
      queryClient.invalidateQueries({
        queryKey: ["tournament-players", tournamentId],
      });
    },
    onError: (err: ApiError) => {
      if (err.status === 409) {
        // 409 = already registered — treat as success state
        setRegistered(true);
        toast.info("You're already registered for this tournament.");
      } else {
        toast.error(err.message || "Registration failed. Please try again.");
      }
    },
  });

  function handleJoin() {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/tournaments/${tournamentId}`);
      return;
    }
    joinMutation.mutate();
  }

  /* ── Loading / error states ── */
  if (isLoading) return <PageSkeleton />;
  if (isError || !tournament) {
    return (
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "5rem 1.5rem",
          textAlign: "center",
        }}
      >
        <AlertCircle
          size={40}
          style={{ color: "var(--danger)", marginBottom: "1rem" }}
        />
        <h2 style={{ color: "var(--text-primary)", marginBottom: "0.5rem" }}>
          Tournament not found
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
          This tournament may have been removed or the link is invalid.
        </p>
        <Link
          to="/tournaments"
          style={{ color: "var(--accent-cta)", fontWeight: 500 }}
        >
          ← Back to all tournaments
        </Link>
      </div>
    );
  }

  const t = tournament;
  const isUpcoming = t.status === "UPCOMING";
  const isOngoing = t.status === "ONGOING";
  const isFinished = t.status === "COMPLETED" || t.status === "CANCELLED";
  const fillPct =
    t.maxParticipants > 0
      ? Math.min(100, (t.currentNumberOfParticipants / t.maxParticipants) * 100)
      : 0;
  const fillColor =
    fillPct >= 90
      ? "var(--danger)"
      : fillPct >= 70
        ? "var(--warning)"
        : "var(--success)";
  const isFull = t.currentNumberOfParticipants >= t.maxParticipants;
  const isRegistered = registered;

  return (
    <>
      <style>{`
        @keyframes td-fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes td-pageIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }

        .td-page {
          max-width: 1100px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem 5rem;
          animation: td-pageIn 350ms ease forwards;
        }
        .td-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 1.5rem;
          align-items: start;
        }
        .td-left  { display: flex; flex-direction: column; gap: 1.25rem; }
        .td-right { display: flex; flex-direction: column; gap: 1.25rem; position: sticky; top: 80px; }

        .td-btn-join {
          width: 100%;
          padding: 0.875rem 1rem;
          background: var(--accent-cta);
          color: var(--text-on-accent);
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 700;
          font-family: var(--font-sans);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: background 150ms ease, transform 150ms ease;
          letter-spacing: 0.01em;
          min-height: 52px;
        }
        .td-btn-join:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-1px); }
        .td-btn-join:disabled { cursor: not-allowed; opacity: 0.65; }

        .td-action-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.8rem 1rem;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--bg-base);
          text-decoration: none;
          color: var(--text-secondary);
          font-size: 0.9375rem;
          font-weight: 500;
          transition: border-color 150ms ease, color 150ms ease, background 150ms ease;
        }
        .td-action-link:hover {
          border-color: var(--accent-cta);
          color: var(--text-primary);
          background: var(--accent-subtle);
        }
        .td-action-link-inner { display: flex; align-items: center; gap: 0.625rem; }

        @media (max-width: 860px) {
          .td-layout { grid-template-columns: 1fr; }
          .td-right  { position: static; order: -1; }
        }
        @media (max-width: 540px) {
          .td-page { padding: 1.5rem 1rem 4rem; }
        }
      `}</style>

      <div className="td-page">
        {/* ── Back link ── */}
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

        {/* ── Hero header ── */}
        <div style={{ marginBottom: "2rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  flexWrap: "wrap",
                  marginBottom: "0.625rem",
                }}
              >
                <span className={`status-badge ${statusClass(t.status)}`}>
                  {t.status.toLowerCase()}
                </span>
                <span
                  style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}
                >
                  {t.format}
                </span>
                <span
                  style={{
                    width: "3px",
                    height: "3px",
                    borderRadius: "50%",
                    background: "var(--border-strong)",
                    display: "inline-block",
                  }}
                />
                <span
                  style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}
                >
                  {t.numberOfRounds} rounds
                </span>
              </div>
              <h1
                style={{
                  fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1.15,
                  margin: 0,
                }}
              >
                {t.tournamentName}
              </h1>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.9375rem",
                  marginTop: "0.5rem",
                }}
              >
                Organised by{" "}
                <span style={{ color: "var(--camel-400)", fontWeight: 500 }}>
                  {t.organizerName}
                </span>
              </p>
            </div>
            {/* Entry fee badge */}
            <div style={{ flexShrink: 0, textAlign: "right" }}>
              <div
                style={{
                  fontSize: "1.625rem",
                  fontWeight: 800,
                  color: "var(--accent-cta)",
                  letterSpacing: "-0.04em",
                }}
              >
                {formatEntryFee(t.entryFee)}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  marginTop: "0.125rem",
                }}
              >
                entry fee
              </div>
            </div>
          </div>

          {/* Accent underline */}
          <div
            style={{
              height: "2px",
              background:
                "linear-gradient(90deg, var(--accent-cta), transparent)",
              borderRadius: "1px",
              marginTop: "1.25rem",
            }}
          />
        </div>

        {/* ── Two-col layout ── */}
        <div className="td-layout">
          {/* ══ LEFT COLUMN ══ */}
          <div className="td-left">
            {/* About */}
            {t.description && (
              <Section
                title="About this tournament"
                icon={<Trophy size={16} />}
              >
                <p
                  style={{
                    fontSize: "0.9375rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.75,
                    margin: 0,
                  }}
                >
                  {t.description}
                </p>
              </Section>
            )}

            {/* Tournament details */}
            <Section title="Tournament details" icon={<Hash size={16} />}>
              <div>
                <DetailRow
                  icon={<CalendarDays size={15} />}
                  label="Start date & time"
                  value={formatDateTime(t.startDateTime)}
                />
                <DetailRow
                  icon={<MapPin size={15} />}
                  label="Location"
                  value={t.location}
                />
                <DetailRow
                  icon={<Clock size={15} />}
                  label="Time control"
                  value={t.timeControl}
                />
                <DetailRow
                  icon={<Hash size={15} />}
                  label="Number of rounds"
                  value={String(t.numberOfRounds)}
                />
                <DetailRow
                  icon={<Trophy size={15} />}
                  label="Format"
                  value={t.format.replace("_", " ")}
                />
                <div style={{ padding: "0.625rem 0" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <Users
                      size={15}
                      style={{ color: "var(--camel-600)", flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--text-muted)",
                        flex: 1,
                      }}
                    >
                      Participants
                    </span>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--text-primary)",
                        fontWeight: 500,
                      }}
                    >
                      {t.currentNumberOfParticipants} / {t.maxParticipants}
                    </span>
                  </div>
                  {/* Capacity bar */}
                  <div
                    style={{
                      height: "6px",
                      background: "var(--bg-elevated)",
                      borderRadius: "99px",
                      overflow: "hidden",
                      marginLeft: "1.625rem",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${fillPct}%`,
                        background: fillColor,
                        borderRadius: "99px",
                        transition: "width 600ms ease",
                      }}
                    />
                  </div>
                </div>
              </div>
            </Section>

            {/* Live navigation — only for ONGOING or COMPLETED */}
            {(isOngoing || isFinished) && (
              <Section
                title="Tournament navigation"
                icon={<Swords size={16} />}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.625rem",
                  }}
                >
                  <Link
                    to={`/tournaments/${t.tournamentId}/leaderboard`}
                    className="td-action-link"
                  >
                    <span className="td-action-link-inner">
                      <BarChart2
                        size={17}
                        style={{ color: "var(--accent-cta)" }}
                      />
                      <span>
                        <span
                          style={{
                            display: "block",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                          }}
                        >
                          Live leaderboard
                        </span>
                        <span
                          style={{
                            fontSize: "0.8125rem",
                            color: "var(--text-muted)",
                            fontWeight: 400,
                          }}
                        >
                          Standings with FIDE tiebreakers
                        </span>
                      </span>
                    </span>
                    <ChevronRight size={16} />
                  </Link>
                  {Array.from(
                    { length: t.numberOfRounds },
                    (_, i) => i + 1,
                  ).map((round) => (
                    <Link
                      key={round}
                      to={`/tournaments/${t.tournamentId}/rounds/${round}`}
                      className="td-action-link"
                    >
                      <span className="td-action-link-inner">
                        <Swords
                          size={17}
                          style={{ color: "var(--camel-600)" }}
                        />
                        <span>
                          <span
                            style={{
                              display: "block",
                              fontWeight: 600,
                              color: "var(--text-primary)",
                            }}
                          >
                            Round {round} pairings
                          </span>
                          <span
                            style={{
                              fontSize: "0.8125rem",
                              color: "var(--text-muted)",
                              fontWeight: 400,
                            }}
                          >
                            Board assignments & results
                          </span>
                        </span>
                      </span>
                      <ChevronRight size={16} />
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            {/* Registered players */}
            <Section
              title={`Registered players (${players.length})`}
              icon={<Users size={16} />}
            >
              {players.length === 0 ? (
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-muted)",
                    textAlign: "center",
                    padding: "1.5rem 0",
                  }}
                >
                  No players registered yet. Be the first!
                </p>
              ) : (
                <div>
                  {players.map((p, i) => (
                    <PlayerRow key={p.userId} p={p} rank={i + 1} />
                  ))}
                </div>
              )}
            </Section>
          </div>

          {/* ══ RIGHT COLUMN ══ */}
          <div className="td-right">
            {/* Join card — only for UPCOMING */}
            {isUpcoming && (
              <Section title="Registration" icon={<UserCircle size={16} />}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  {/* Status message */}
                  {isRegistered ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.625rem",
                        padding: "0.75rem 1rem",
                        background: "rgba(74,158,107,0.1)",
                        border: "1px solid rgba(74,158,107,0.25)",
                        borderRadius: "8px",
                      }}
                    >
                      <CheckCircle2
                        size={17}
                        style={{ color: "var(--success)", flexShrink: 0 }}
                      />
                      <div>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "var(--success)",
                            margin: 0,
                          }}
                        >
                          You're registered
                        </p>
                        <p
                          style={{
                            fontSize: "0.8125rem",
                            color: "var(--text-muted)",
                            margin: 0,
                          }}
                        >
                          See you at the board!
                        </p>
                      </div>
                    </div>
                  ) : isFull ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.625rem",
                        padding: "0.75rem 1rem",
                        background: "var(--danger-bg)",
                        border: "1px solid rgba(211,77,75,0.25)",
                        borderRadius: "8px",
                      }}
                    >
                      <AlertCircle
                        size={17}
                        style={{ color: "var(--danger)", flexShrink: 0 }}
                      />
                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--danger)",
                          margin: 0,
                          fontWeight: 500,
                        }}
                      >
                        Tournament is full
                      </p>
                    </div>
                  ) : null}

                  {/* Join button */}
                  <button
                    className="td-btn-join"
                    onClick={handleJoin}
                    disabled={isRegistered || isFull || joinMutation.isPending}
                    style={{
                      background: isRegistered
                        ? "var(--border)"
                        : isFull
                          ? "var(--border)"
                          : undefined,
                      color:
                        isRegistered || isFull
                          ? "var(--text-muted)"
                          : undefined,
                    }}
                  >
                    {joinMutation.isPending ? (
                      <>
                        <Loader2
                          size={17}
                          style={{ animation: "spin 0.7s linear infinite" }}
                        />
                        Registering…
                      </>
                    ) : isRegistered ? (
                      <>
                        <CheckCircle2 size={17} />
                        Already registered
                      </>
                    ) : isFull ? (
                      "Registration closed"
                    ) : (
                      <>
                        <Trophy size={17} />
                        {isAuthenticated
                          ? "Join tournament"
                          : "Sign in to join"}
                      </>
                    )}
                  </button>

                  {/* Entry fee reminder */}
                  {!isRegistered && !isFull && t.entryFee > 0 && (
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--text-muted)",
                        textAlign: "center",
                        margin: 0,
                      }}
                    >
                      Entry fee of{" "}
                      <strong style={{ color: "var(--camel-400)" }}>
                        {formatEntryFee(t.entryFee)}
                      </strong>{" "}
                      is collected on the day of the event.
                    </p>
                  )}
                </div>
              </Section>
            )}

            {/* Organizer contact */}
            <Section title="Organizer" icon={<UserCircle size={16} />}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.875rem",
                  marginBottom: "1.125rem",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: "var(--accent-subtle)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "var(--accent-cta)",
                    flexShrink: 0,
                  }}
                >
                  {initials(t.organizerName)}
                </div>
                <div>
                  <p
                    style={{
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      margin: 0,
                      fontSize: "0.9375rem",
                    }}
                  >
                    {t.organizerName}
                  </p>
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--text-muted)",
                      margin: 0,
                    }}
                  >
                    Tournament organizer
                  </p>
                </div>
              </div>
              {t.organizerPhoneNumber && (
                <a
                  href={`tel:${t.organizerPhoneNumber}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                    padding: "0.625rem 0.875rem",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    textDecoration: "none",
                    color: "var(--text-secondary)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    transition: "border-color 150ms ease, color 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor =
                      "var(--accent-cta)";
                    (e.currentTarget as HTMLAnchorElement).style.color =
                      "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor =
                      "var(--border)";
                    (e.currentTarget as HTMLAnchorElement).style.color =
                      "var(--text-secondary)";
                  }}
                >
                  <Phone size={15} style={{ color: "var(--camel-600)" }} />
                  {t.organizerPhoneNumber}
                </a>
              )}
            </Section>

            {/* Quick stats card */}
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "14px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "3px",
                  background:
                    "linear-gradient(90deg, var(--accent-cta), var(--choc-400))",
                }}
              />
              <div
                style={{
                  padding: "1.125rem 1.375rem",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                {[
                  { label: "Format", value: t.format.replace("_", " ") },
                  { label: "Rounds", value: String(t.numberOfRounds) },
                  { label: "Control", value: t.timeControl },
                  {
                    label: "Capacity",
                    value: `${t.currentNumberOfParticipants}/${t.maxParticipants}`,
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.2rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontWeight: 600,
                      }}
                    >
                      {s.label}
                    </span>
                    <span
                      style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
