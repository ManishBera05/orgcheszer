// --- START OF FILE src/pages/TournamentDetailPage.tsx ---
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
import { getMyTournamentHistory } from "../api/users";
import { useAuth } from "../hooks/useAuth";
import {
  formatDateTime,
  formatEntryFee,
  statusClass,
  initials,
} from "../lib/utils";
import type { ApiError, TournamentPlayerDTO } from "../types";

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
          borderTopLeftRadius: "13px",
          borderTopRightRadius: "13px",
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

function PlayerRow({ p, rank }: { p: TournamentPlayerDTO; rank: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.875rem",
        padding: "0.625rem 0",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
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
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link
          to={`/users/${p.userId}`}
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "var(--text-primary)",
            textDecoration: "none",
            display: "block",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--accent-cta)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-primary)")
          }
        >
          {p.firstName} {p.lastName}
        </Link>
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

export default function TournamentDetailPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [requestPending, setRequestPending] = useState(false);

  const {
    data: tournament,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: () => getTournament(tournamentId!),
    enabled: !!tournamentId,
  });

  // UPDATED: Destructure the Page object from the new endpoint
  const { data: playersPage } = useQuery({
    queryKey: ["tournament-players", tournamentId],
    queryFn: () => getTournamentPlayers(tournamentId!),
    enabled: !!tournamentId,
  });
  const players = playersPage?.content || [];

  const { data: myHistory } = useQuery({
    queryKey: ["my-history"],
    queryFn: () => getMyTournamentHistory({ size: 100 }),
    enabled: isAuthenticated,
  });

  const myRole = myHistory?.content.find(
    (t) => t.tournamentId === tournamentId,
  )?.role;

  const joinMutation = useMutation({
    mutationFn: () => registerForTournament(tournamentId!),
    onSuccess: () => {
      toast.success(
        "Registration request submitted! Awaiting organizer approval.",
      );
      setRequestPending(true);
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
    },
    onError: (err: ApiError) => {
      if (err.status === 409) {
        setRequestPending(true);
        toast.info("You already have a pending registration request.");
      } else {
        toast.error(err.message || "Registration failed. Please try again.");
      }
    },
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
  if (isError || !tournament)
    return (
      <div style={{ textAlign: "center", padding: "5rem" }}>
        <AlertCircle
          size={40}
          style={{ color: "var(--danger)", margin: "0 auto 1rem" }}
        />
        <h2>Tournament not found</h2>
      </div>
    );

  const t = tournament;
  const isFull = t.currentNumberOfParticipants >= t.maxParticipants;
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

  const isJoinDisabled =
    !!myRole || isFull || requestPending || joinMutation.isPending;
  let joinText = "Join tournament";
  if (myRole === "ORGANIZER") joinText = "You are the Organizer";
  else if (myRole === "STAFF") joinText = "You are Staff";
  else if (myRole === "PLAYER") joinText = "You are Participating";
  else if (requestPending) joinText = "Request Submitted";
  else if (isFull) joinText = "Registration Full";
  else if (!isAuthenticated) joinText = "Sign in to Join";

  return (
    <>
      <style>{`
        .td-page { max-width: 1100px; margin: 0 auto; padding: 2.5rem 1.5rem 5rem; }
        .td-layout { display: grid; grid-template-columns: 1fr 340px; gap: 1.5rem; align-items: start; }
        .td-left { display: flex; flex-direction: column; gap: 1.25rem; }
        .td-right { display: flex; flex-direction: column; gap: 1.25rem; position: sticky; top: 80px; }
        .td-btn-join { width: 100%; padding: 0.875rem 1rem; background: var(--accent-cta); color: var(--text-on-accent); border: none; border-radius: 10px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background 150ms; min-height: 52px; }
        .td-btn-join:hover:not(:disabled) { background: var(--accent-hover); }
        .td-btn-join:disabled { cursor: not-allowed; opacity: 0.8; background: var(--bg-elevated); color: var(--text-muted); border: 1px solid var(--border); }
        .td-action-link { display: flex; align-items: center; justify-content: space-between; padding: 0.8rem 1rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-base); text-decoration: none; color: var(--text-secondary); font-weight: 500; transition: 150ms; }
        .td-action-link:hover { border-color: var(--accent-cta); background: var(--accent-subtle); color: var(--text-primary); }
        @media (max-width: 860px) { .td-layout { grid-template-columns: 1fr; } .td-right { position: static; order: -1; } }
      `}</style>
      <div className="td-page">
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
              </div>
              <h1
                style={{
                  fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
                  fontWeight: 800,
                  color: "var(--text-primary)",
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
            <div style={{ flexShrink: 0, textAlign: "right" }}>
              <div
                style={{
                  fontSize: "1.625rem",
                  fontWeight: 800,
                  color: "var(--accent-cta)",
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
        </div>

        <div className="td-layout">
          <div className="td-left">
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
            <Section title="Tournament details" icon={<Hash size={16} />}>
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
                label="Rounds"
                value={String(t.numberOfRounds)}
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
            </Section>

            {(t.status === "ONGOING" || t.status === "COMPLETED") && (
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
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.625rem",
                      }}
                    >
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
                  <Link
                    to={`/tournaments/${t.tournamentId}/rounds`}
                    className="td-action-link"
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.625rem",
                      }}
                    >
                      <Swords size={17} style={{ color: "var(--camel-600)" }} />
                      <span>
                        <span
                          style={{
                            display: "block",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                          }}
                        >
                          Match Pairings
                        </span>
                        <span
                          style={{
                            fontSize: "0.8125rem",
                            color: "var(--text-muted)",
                            fontWeight: 400,
                          }}
                        >
                          View latest board assignments & results
                        </span>
                      </span>
                    </span>
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </Section>
            )}

            <Section
              title={`Registered players (${playersPage?.totalElements || 0})`}
              icon={<Users size={16} />}
            >
              {players.length === 0 ? (
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-muted)",
                    textAlign: "center",
                  }}
                >
                  No players registered yet.
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

          <div className="td-right">
            {t.status === "UPCOMING" && (
              <Section title="Registration" icon={<UserCircle size={16} />}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  {requestPending && !myRole && (
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
                        style={{ color: "var(--success)" }}
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
                          Request submitted
                        </p>
                      </div>
                    </div>
                  )}
                  {isFull && !myRole && !requestPending && (
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
                        style={{ color: "var(--danger)" }}
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
                  )}

                  <button
                    className="td-btn-join"
                    onClick={() =>
                      isAuthenticated
                        ? joinMutation.mutate()
                        : navigate(
                            `/login?redirect=/tournaments/${tournamentId}`,
                          )
                    }
                    disabled={isJoinDisabled}
                  >
                    {joinMutation.isPending ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : myRole || requestPending ? (
                      <CheckCircle2 size={17} />
                    ) : (
                      <Trophy size={17} />
                    )}
                    {joinMutation.isPending ? "Processing..." : joinText}
                  </button>
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
// --- END OF FILE src/pages/TournamentDetailPage.tsx ---
