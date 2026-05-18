// --- START OF FILE src/pages/ClubDetailPage.tsx ---
import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
  Trophy,
  ArrowLeft,
  Loader2,
  Copy,
  AlertCircle,
  RefreshCw,
  XCircle,
  CheckCircle2,
  Settings,
} from "lucide-react";
import {
  getClubDetails,
  getClubMembers,
  getClubRequests,
  approveClubRequest,
  removeClubMember,
  generateClubInviteCode,
  getClubLeaderboard,
  getClubTournaments,
  createClubTournament,
} from "../api/clubs";
import { getMyProfile } from "../api/users";
import { useAuth } from "../hooks/useAuth";
import { initials, toUtcIsoString } from "../lib/utils";
import TournamentCard from "../components/TournamentCard";
import type { ApiError, TournamentCreateRequest } from "../types";

export default function ClubDetailPage() {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<
    "tournaments" | "members" | "leaderboard" | "manage"
  >("tournaments");
  const [showCTModal, setShowCTModal] = useState(false);
  const [ctForm, setCtForm] = useState<TournamentCreateRequest>({
    tournamentName: "",
    startDateTime: "",
    numberOfRounds: 5,
    maxParticipants: 32,
    entryFee: 0,
    description: "",
    location: "Online",
    timeControl: "10+5",
    format: "SWISS",
  });
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  // Fetch Me
  const { data: me } = useQuery({
    queryKey: ["my-profile"],
    queryFn: getMyProfile,
    enabled: isAuthenticated,
  });

  // Fetch Club Details
  const {
    data: club,
    isLoading: cLoad,
    isError,
  } = useQuery({
    queryKey: ["club", clubId],
    queryFn: () => getClubDetails(clubId!),
    enabled: !!clubId,
  });
  const { data: members } = useQuery({
    queryKey: ["club-members", clubId],
    queryFn: () => getClubMembers(clubId!),
    enabled: !!clubId,
  });
  const { data: leaderboard, isLoading: lLoad } = useQuery({
    queryKey: ["club-leaderboard", clubId],
    queryFn: () => getClubLeaderboard(clubId!),
    enabled: !!clubId && activeTab === "leaderboard",
  });
  const { data: tournaments, isLoading: tLoad } = useQuery({
    queryKey: ["club-tournaments", clubId],
    queryFn: () => getClubTournaments(clubId!),
    enabled: !!clubId && activeTab === "tournaments",
  });

  // Management data
  const { data: requests, isLoading: rLoad } = useQuery({
    queryKey: ["club-requests", clubId],
    queryFn: () => getClubRequests(clubId!),
    enabled: !!clubId && activeTab === "manage",
  });

  const isOrganizer = me?.userId === club?.organizerId;
  // const isMember = isOrganizer || members?.some((m) => m.userId === me?.userId);

  // Mutations
  const approveMut = useMutation({
    mutationFn: (uid: string) => approveClubRequest(clubId!, uid),
    onSuccess: () => {
      toast.success("Member approved!");
      queryClient.invalidateQueries({ queryKey: ["club-requests"] });
      queryClient.invalidateQueries({ queryKey: ["club-members"] });
      queryClient.invalidateQueries({ queryKey: ["club"] });
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
  const removeMut = useMutation({
    mutationFn: (uid: string) => removeClubMember(clubId!, uid),
    onSuccess: () => {
      toast.success("Member removed/rejected.");
      queryClient.invalidateQueries({ queryKey: ["club-requests"] });
      queryClient.invalidateQueries({ queryKey: ["club-members"] });
      queryClient.invalidateQueries({ queryKey: ["club"] });
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
  const genCodeMut = useMutation({
    mutationFn: () => generateClubInviteCode(clubId!),
    onSuccess: () => {
      toast.success("New invite code generated!");
      queryClient.invalidateQueries({ queryKey: ["club"] });
    },
    onError: (e: ApiError) => toast.error(e.message),
  });

  const createTourneyMut = useMutation({
    mutationFn: () =>
      createClubTournament(clubId!, {
        ...ctForm,
        startDateTime: toUtcIsoString(ctForm.startDateTime),
        playerId: selectedPlayers,
        isClubTournament: true,
        clubId: clubId, // <--- ADD THIS LINE to inject the UUID into the payload
      }),
    onSuccess: () => {
      toast.success("Club Tournament started!");
      setShowCTModal(false);
      queryClient.invalidateQueries({ queryKey: ["club-tournaments"] });
    },
    onError: (e: ApiError) =>
      toast.error(e.message || "Failed to start tournament."),
  });

  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctForm.tournamentName || !ctForm.startDateTime)
      return toast.error("Missing required fields.");
    if (selectedPlayers.length < 2)
      return toast.error("Select at least 2 players to start a tournament.");
    createTourneyMut.mutate();
  };

  const togglePlayer = (uid: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid],
    );
  };

  const selectAll = () => {
    if (members) setSelectedPlayers(members.map((m) => m.userId));
  };

  if (cLoad)
    return (
      <div style={{ textAlign: "center", padding: "5rem" }}>
        <Loader2
          className="animate-spin text-muted"
          size={24}
          style={{ margin: "0 auto" }}
        />
      </div>
    );
  if (isError || !club)
    return (
      <div style={{ textAlign: "center", padding: "5rem" }}>
        <AlertCircle
          size={40}
          style={{ color: "var(--danger)", margin: "0 auto 1rem" }}
        />
        <h2>Club not found</h2>
      </div>
    );

  return (
    <>
      <style>{`
        .cd-tab { padding: 0.75rem 1.25rem; font-size: 0.875rem; font-weight: 500; color: var(--text-muted); border: none; border-bottom: 2px solid transparent; background: transparent; cursor: pointer; transition: color 150ms; white-space: nowrap; }
        .cd-tab.active { color: var(--accent-cta); border-bottom-color: var(--accent-cta); font-weight: 600; }
        .cd-tab:hover:not(.active) { color: var(--text-primary); }
        .member-row { display: flex; align-items: center; justify-content: space-between; padding: 1rem; border-bottom: 1px solid var(--border-subtle); background: var(--bg-surface); }
        .member-row:last-child { border-bottom: none; }
        .lb-table { width: 100%; border-collapse: collapse; min-width: 600px; text-align: left; }
        .lb-table th { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; background: var(--bg-elevated); }
        .lb-table td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-subtle); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
        .modal-content { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px; padding: 2rem; width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-lg); }
        .org-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr)); gap: 1.25rem; }
        .sp-action-btn { display: inline-flex; align-items: center; gap: 0.375rem; justify-content: center; padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.8125rem; font-weight: 600; cursor: pointer; border: 1px solid var(--accent-cta); background: var(--bg-surface); color: var(--accent-cta); transition: all 150ms; width: 100%; }
        .sp-action-btn:hover { background: var(--accent-subtle); }
      `}</style>
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "2.5rem 1.5rem 5rem",
        }}
      >
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

        <div
          style={{
            marginBottom: "2rem",
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "2rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "0.5rem",
            }}
          >
            <Users size={28} style={{ color: "var(--accent-cta)" }} />
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              {club.name}
            </h1>
          </div>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "1rem",
              lineHeight: 1.6,
              marginBottom: "1.5rem",
            }}
          >
            {club.description}
          </p>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <div>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  display: "block",
                }}
              >
                Organizer
              </span>
              <span style={{ color: "var(--camel-400)", fontWeight: 500 }}>
                <Link
                  to={`/users/${club.organizerId}`}
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  {club.organizerName}
                </Link>
              </span>
            </div>
            <div>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  display: "block",
                }}
              >
                Active Members
              </span>
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                {club.activeMembers}
              </span>
            </div>
          </div>
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
            className={`cd-tab ${activeTab === "tournaments" ? "active" : ""}`}
            onClick={() => setActiveTab("tournaments")}
          >
            Tournaments
          </button>
          <button
            className={`cd-tab ${activeTab === "members" ? "active" : ""}`}
            onClick={() => setActiveTab("members")}
          >
            Members
          </button>
          <button
            className={`cd-tab ${activeTab === "leaderboard" ? "active" : ""}`}
            onClick={() => setActiveTab("leaderboard")}
          >
            Leaderboard
          </button>
          {isOrganizer && (
            <button
              className={`cd-tab ${activeTab === "manage" ? "active" : ""}`}
              onClick={() => setActiveTab("manage")}
            >
              Manage Club{" "}
              {club.pendingRequests > 0 && (
                <span
                  style={{
                    background: "var(--danger)",
                    color: "white",
                    padding: "0.1rem 0.4rem",
                    borderRadius: "99px",
                    fontSize: "0.6rem",
                    marginLeft: "0.25rem",
                  }}
                >
                  {club.pendingRequests}
                </span>
              )}
            </button>
          )}
        </div>

        {/* TOURNAMENTS TAB */}
        {activeTab === "tournaments" && (
          <div>
            {isOrganizer && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: "1.5rem",
                }}
              >
                <button
                  onClick={() => setShowCTModal(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.625rem 1.25rem",
                    background: "var(--accent-cta)",
                    color: "var(--text-on-accent)",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Start Tournament
                </button>
              </div>
            )}

            {tLoad ? (
              <div style={{ padding: "4rem", textAlign: "center" }}>
                <Loader2
                  className="animate-spin text-muted"
                  size={24}
                  style={{ margin: "0 auto" }}
                />
              </div>
            ) : tournaments?.length === 0 ? (
              <div
                style={{
                  padding: "4rem",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                <Trophy
                  size={32}
                  style={{ margin: "0 auto 1rem", opacity: 0.5 }}
                />
                No tournaments running.
              </div>
            ) : (
              <div className="org-grid">
                {tournaments?.map((t) => (
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
                    {isOrganizer && (
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
                            navigate(`/tournaments/${t.tournamentId}/manage`)
                          }
                        >
                          Manage Matchmaking <Settings size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === "members" && (
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            {!members ? (
              <div style={{ padding: "4rem", textAlign: "center" }}>
                <Loader2
                  className="animate-spin text-muted"
                  size={24}
                  style={{ margin: "0 auto" }}
                />
              </div>
            ) : members.length === 0 ? (
              <div
                style={{
                  padding: "4rem",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                No members found.
              </div>
            ) : (
              members.map((m) => (
                <div key={m.userId} className="member-row">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "var(--accent-subtle)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "var(--accent-cta)",
                      }}
                    >
                      {initials(`${m.firstName} ${m.lastName}`)}
                    </div>
                    <div>
                      <Link
                        to={`/users/${m.userId}`}
                        style={{
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          textDecoration: "none",
                          fontSize: "0.9375rem",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "var(--accent-cta)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "var(--text-primary)")
                        }
                      >
                        {m.firstName} {m.lastName}
                      </Link>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          display: "flex",
                          gap: "0.5rem",
                        }}
                      >
                        {m.fideId && <span>FIDE: {m.fideId}</span>}
                        {m.eloRating > 0 && <span>ELO: {m.eloRating}</span>}
                      </div>
                    </div>
                  </div>
                  <span
                    style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                  >
                    Joined {new Date(m.joinedAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === "leaderboard" && (
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "12px",
              overflowX: "auto",
            }}
          >
            <table className="lb-table">
              <thead>
                <tr>
                  <th style={{ width: "50px" }}>Rank</th>
                  <th>Player</th>
                  <th>Points</th>
                  <th>Tournaments</th>
                  <th>Games</th>
                  <th>W/D/L</th>
                </tr>
              </thead>
              <tbody>
                {lLoad ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ padding: "4rem", textAlign: "center" }}
                    >
                      <Loader2
                        className="animate-spin text-muted"
                        size={24}
                        style={{ margin: "0 auto" }}
                      />
                    </td>
                  </tr>
                ) : leaderboard?.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: "4rem",
                        textAlign: "center",
                        color: "var(--text-muted)",
                      }}
                    >
                      Leaderboard is empty.
                    </td>
                  </tr>
                ) : (
                  leaderboard?.map((l) => (
                    <tr
                      key={l.userId}
                      style={{ background: "var(--bg-surface)" }}
                    >
                      <td
                        style={{ fontWeight: 600, color: "var(--text-muted)" }}
                      >
                        {l.rank <= 3 ? ["🥇", "🥈", "🥉"][l.rank - 1] : l.rank}
                      </td>
                      <td>
                        <Link
                          to={`/users/${l.userId}`}
                          style={{
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            textDecoration: "none",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "var(--accent-cta)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color =
                              "var(--text-primary)")
                          }
                        >
                          {l.playerName}
                        </Link>
                        {l.eloRating > 0 && (
                          <span
                            style={{
                              display: "block",
                              fontSize: "0.75rem",
                              color: "var(--camel-400)",
                            }}
                          >
                            {l.eloRating} ELO
                          </span>
                        )}
                      </td>
                      <td
                        style={{ fontWeight: 700, color: "var(--accent-cta)" }}
                      >
                        {l.totalScore.toFixed(1)}
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>
                        {l.tournamentsPlayed}
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>
                        {l.totalGamesPlayed}
                      </td>
                      <td>
                        <span style={{ color: "var(--success)" }}>
                          {l.totalWins}
                        </span>{" "}
                        /{" "}
                        <span style={{ color: "var(--camel-400)" }}>
                          {l.totalDraws}
                        </span>{" "}
                        /{" "}
                        <span style={{ color: "var(--danger)" }}>
                          {l.totalLosses}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* MANAGE TAB */}
        {activeTab === "manage" && isOrganizer && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}
          >
            <div
              style={{
                padding: "1.5rem",
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
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
                    margin: "0 0 0.25rem",
                    color: "var(--text-primary)",
                    fontSize: "1.125rem",
                  }}
                >
                  Invite Code
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.875rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Share this code with players to join your club.
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 1rem",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-strong)",
                    borderRadius: "8px",
                  }}
                >
                  <code
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: "var(--accent-cta)",
                      letterSpacing: "1px",
                    }}
                  >
                    {club.inviteCode}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(club.inviteCode);
                      toast.success("Copied!");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      display: "flex",
                    }}
                    title="Copy"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <button
                  onClick={() => genCodeMut.mutate()}
                  disabled={genCodeMut.isPending}
                  style={{
                    padding: "0 1rem",
                    background: "var(--bg-interactive)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-strong)",
                    borderRadius: "8px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                  }}
                >
                  <RefreshCw
                    size={14}
                    className={genCodeMut.isPending ? "animate-spin" : ""}
                  />{" "}
                  Renew
                </button>
              </div>
            </div>

            <div>
              <h3
                style={{
                  fontSize: "1.125rem",
                  color: "var(--text-primary)",
                  marginBottom: "1rem",
                }}
              >
                Pending Requests
              </h3>
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                {rLoad ? (
                  <div style={{ padding: "2rem", textAlign: "center" }}>
                    <Loader2
                      className="animate-spin text-muted"
                      size={20}
                      style={{ margin: "0 auto" }}
                    />
                  </div>
                ) : requests?.length === 0 ? (
                  <div
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "var(--text-muted)",
                    }}
                  >
                    No pending requests.
                  </div>
                ) : (
                  requests?.map((r) => (
                    <div key={r.userId} className="member-row">
                      <div>
                        <span
                          style={{
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            display: "block",
                          }}
                        >
                          {r.firstName} {r.lastName}
                        </span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          ELO: {r.eloRating} | FIDE: {r.fideId || "N/A"}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={() => removeMut.mutate(r.userId)}
                          disabled={removeMut.isPending || approveMut.isPending}
                          style={{
                            padding: "0.4rem 0.75rem",
                            background: "rgba(211,77,75,0.1)",
                            color: "var(--danger)",
                            border: "1px solid rgba(211,77,75,0.3)",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          <XCircle size={14} /> Reject
                        </button>
                        <button
                          onClick={() => approveMut.mutate(r.userId)}
                          disabled={removeMut.isPending || approveMut.isPending}
                          style={{
                            padding: "0.4rem 0.75rem",
                            background: "rgba(74,158,107,0.1)",
                            color: "var(--success)",
                            border: "1px solid rgba(74,158,107,0.3)",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          <CheckCircle2 size={14} /> Approve
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3
                style={{
                  fontSize: "1.125rem",
                  color: "var(--text-primary)",
                  marginBottom: "1rem",
                }}
              >
                Current Members
              </h3>
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                {members?.length === 0 ? (
                  <div
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "var(--text-muted)",
                    }}
                  >
                    No active members.
                  </div>
                ) : (
                  members?.map((m) => (
                    <div key={m.userId} className="member-row">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1rem",
                        }}
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "var(--text-secondary)",
                          }}
                        >
                          {initials(`${m.firstName} ${m.lastName}`)}
                        </div>
                        <div>
                          <span
                            style={{
                              fontWeight: 600,
                              color: "var(--text-primary)",
                              display: "block",
                              fontSize: "0.9375rem",
                            }}
                          >
                            {m.firstName} {m.lastName}
                          </span>
                        </div>
                      </div>
                      {m.userId !== me?.userId && (
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${m.firstName} from the club?`))
                              removeMut.mutate(m.userId);
                          }}
                          disabled={removeMut.isPending}
                          style={{
                            padding: "0.4rem 0.75rem",
                            background: "transparent",
                            color: "var(--text-muted)",
                            border: "1px solid var(--border)",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "var(--danger)";
                            e.currentTarget.style.color = "var(--danger)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border)";
                            e.currentTarget.style.color = "var(--text-muted)";
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: START TOURNAMENT */}
        {showCTModal && (
          <div className="modal-overlay" onClick={() => setShowCTModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: "0 0 1rem",
                }}
              >
                Start Club Tournament
              </h2>
              <form
                onSubmit={handleCreateTournament}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        color: "var(--text-secondary)",
                        marginBottom: "0.375rem",
                      }}
                    >
                      Name *
                    </label>
                    <input
                      required
                      value={ctForm.tournamentName}
                      onChange={(e) =>
                        setCtForm((d) => ({
                          ...d,
                          tournamentName: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        background: "var(--bg-base)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        color: "var(--text-secondary)",
                        marginBottom: "0.375rem",
                      }}
                    >
                      Start Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={ctForm.startDateTime}
                      onChange={(e) =>
                        setCtForm((d) => ({
                          ...d,
                          startDateTime: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        background: "var(--bg-base)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--text-primary)",
                        colorScheme: "dark",
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        color: "var(--text-secondary)",
                        marginBottom: "0.375rem",
                      }}
                    >
                      Format *
                    </label>
                    <select
                      value={ctForm.format}
                      onChange={(e) =>
                        setCtForm((d) => ({
                          ...d,
                          format: e.target.value as any,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        background: "var(--bg-base)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--text-primary)",
                      }}
                    >
                      <option value="SWISS">Swiss</option>
                      <option value="ROUND_ROBIN">Round Robin</option>
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        color: "var(--text-secondary)",
                        marginBottom: "0.375rem",
                      }}
                    >
                      Time Control *
                    </label>
                    <input
                      required
                      value={ctForm.timeControl}
                      onChange={(e) =>
                        setCtForm((d) => ({
                          ...d,
                          timeControl: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        background: "var(--bg-base)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        color: "var(--text-secondary)",
                        marginBottom: "0.375rem",
                      }}
                    >
                      Rounds *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={ctForm.numberOfRounds}
                      onChange={(e) =>
                        setCtForm((d) => ({
                          ...d,
                          numberOfRounds: parseInt(e.target.value),
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        background: "var(--bg-base)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        color: "var(--text-secondary)",
                        marginBottom: "0.375rem",
                      }}
                    >
                      Description
                    </label>
                    <input
                      value={ctForm.description}
                      onChange={(e) =>
                        setCtForm((d) => ({
                          ...d,
                          description: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        background: "var(--bg-base)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                </div>

                {/* Member Selection */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--text-secondary)",
                        fontWeight: 600,
                      }}
                    >
                      Select Participants ({selectedPlayers.length}) *
                    </label>
                    <button
                      type="button"
                      onClick={selectAll}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--accent-cta)",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      Select All
                    </button>
                  </div>
                  <div
                    style={{
                      maxHeight: "200px",
                      overflowY: "auto",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      background: "var(--bg-elevated)",
                      padding: "0.5rem",
                    }}
                  >
                    {members?.map((m) => (
                      <label
                        key={m.userId}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.5rem",
                          cursor: "pointer",
                          borderBottom: "1px solid var(--border-subtle)",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPlayers.includes(m.userId)}
                          onChange={() => togglePlayer(m.userId)}
                          style={{
                            width: "16px",
                            height: "16px",
                            accentColor: "var(--accent-cta)",
                          }}
                        />
                        <span
                          style={{
                            fontSize: "0.875rem",
                            color: "var(--text-primary)",
                          }}
                        >
                          {m.firstName} {m.lastName}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div
                  style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}
                >
                  <button
                    type="button"
                    onClick={() => setShowCTModal(false)}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      background: "transparent",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createTourneyMut.isPending}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      background: "var(--accent-cta)",
                      color: "var(--text-on-accent)",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {createTourneyMut.isPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Start Tournament"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
// --- END OF FILE src/pages/ClubDetailPage.tsx ---
