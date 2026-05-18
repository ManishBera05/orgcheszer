// --- START OF FILE src/pages/ClubsPage.tsx ---
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
  Plus,
  UserPlus,
  KeyRound,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { getMyClubs, createClub, joinClub } from "../api/clubs";
// import { formatDate } from "../lib/utils";
import type { ApiError } from "../types";

export default function ClubsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"my-clubs" | "join">("my-clubs");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({ name: "", description: "" });
  const [inviteCode, setInviteCode] = useState("");

  const { data: myClubs = [], isLoading: loadingClubs } = useQuery({
    queryKey: ["my-clubs"],
    queryFn: getMyClubs,
  });

  const createMut = useMutation({
    mutationFn: () => createClub(createData),
    onSuccess: (newClub) => {
      toast.success("Club created successfully!");
      queryClient.invalidateQueries({ queryKey: ["my-clubs"] });
      setShowCreateModal(false);
      setCreateData({ name: "", description: "" });
      navigate(`/clubs/${newClub.clubId}`);
    },
    onError: (err: ApiError) =>
      toast.error(err.message || "Failed to create club."),
  });

  const joinMut = useMutation({
    mutationFn: () => joinClub(inviteCode.trim()),
    onSuccess: () => {
      toast.success("Request to join sent! Awaiting approval.");
      setInviteCode("");
    },
    onError: (err: ApiError) =>
      toast.error(err.message || "Invalid code or already joined."),
  });

  return (
    <>
      <style>{`
        .club-tab { padding: 0.75rem 1.25rem; font-size: 0.875rem; font-weight: 500; color: var(--text-muted); border: none; border-bottom: 2px solid transparent; background: transparent; cursor: pointer; transition: color 150ms; white-space: nowrap; }
        .club-tab.active { color: var(--accent-cta); border-bottom-color: var(--accent-cta); font-weight: 600; }
        .club-tab:hover:not(.active) { color: var(--text-primary); }
        .club-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr)); gap: 1.25rem; }
        .club-card { display: flex; flex-direction: column; background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem; text-decoration: none; transition: 150ms; }
        .club-card:hover { border-color: var(--accent-cta); transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
        .modal-content { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px; padding: 2rem; width: 100%; max-width: 500px; box-shadow: var(--shadow-lg); }
      `}</style>

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "2.5rem 1.5rem 5rem",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                marginBottom: "0.375rem",
              }}
            >
              <Users size={24} style={{ color: "var(--accent-cta)" }} />
              <h1
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Chess Clubs
              </h1>
            </div>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.9375rem",
                margin: 0,
              }}
            >
              Join a community or start your own chess club.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
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
            <Plus size={16} /> Create Club
          </button>
        </div>

        {/* TABS */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--border-subtle)",
            marginBottom: "2rem",
            overflowX: "auto",
          }}
        >
          <button
            className={`club-tab ${activeTab === "my-clubs" ? "active" : ""}`}
            onClick={() => setActiveTab("my-clubs")}
          >
            My Clubs
          </button>
          <button
            className={`club-tab ${activeTab === "join" ? "active" : ""}`}
            onClick={() => setActiveTab("join")}
          >
            Join a Club
          </button>
        </div>

        {/* TAB: MY CLUBS */}
        {activeTab === "my-clubs" && (
          <div>
            {loadingClubs ? (
              <div style={{ textAlign: "center", padding: "4rem" }}>
                <Loader2
                  size={24}
                  className="animate-spin text-muted"
                  style={{ margin: "0 auto" }}
                />
              </div>
            ) : myClubs.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "4rem",
                  background: "var(--bg-surface)",
                  border: "1px dashed var(--border)",
                  borderRadius: "12px",
                }}
              >
                <Users
                  size={32}
                  style={{ color: "var(--text-muted)", margin: "0 auto 1rem" }}
                />
                <h3
                  style={{
                    color: "var(--text-primary)",
                    marginBottom: "0.5rem",
                  }}
                >
                  No clubs joined yet
                </h3>
                <p
                  style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}
                >
                  Join an existing club using an invite code, or create your
                  own.
                </p>
                <button
                  onClick={() => setActiveTab("join")}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "var(--bg-interactive)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-strong)",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Enter Invite Code
                </button>
              </div>
            ) : (
              <div className="club-grid">
                {myClubs.map((club) => (
                  <Link
                    to={`/clubs/${club.clubId}`}
                    key={club.clubId}
                    className="club-card"
                  >
                    <h3
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        margin: "0 0 0.25rem",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {club.name}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--text-muted)",
                        margin: "0 0 1rem",
                      }}
                    >
                      Organized by{" "}
                      <span
                        style={{ color: "var(--camel-400)", fontWeight: 500 }}
                      >
                        {club.organizerName}
                      </span>
                    </p>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "auto",
                        paddingTop: "1rem",
                        borderTop: "1px solid var(--border-subtle)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          color: "var(--text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.3rem",
                        }}
                      >
                        <Users size={14} /> {club.activeMembers} Members
                      </span>
                      <ChevronRight
                        size={16}
                        style={{ color: "var(--border-strong)" }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: JOIN CLUB */}
        {activeTab === "join" && (
          <div
            style={{ maxWidth: "500px", margin: "0 auto", padding: "2rem 0" }}
          >
            <div
              style={{
                display: "flex",
                gap: "0.625rem",
                padding: "1rem",
                background: "var(--accent-subtle)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                marginBottom: "1.5rem",
              }}
            >
              <KeyRound
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
                  Join with Invite Code
                </h4>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.8125rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Ask the club organizer for the code. Once submitted, they must
                  approve your request.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="e.g. 1A2B3C"
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  background: "var(--bg-base)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                  outline: "none",
                  fontSize: "1rem",
                  letterSpacing: "1px",
                }}
              />
              <button
                onClick={() => joinMut.mutate()}
                disabled={!inviteCode || joinMut.isPending}
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
                {joinMut.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <UserPlus size={16} />
                )}{" "}
                Join
              </button>
            </div>
          </div>
        )}

        {/* MODAL: CREATE CLUB */}
        {showCreateModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowCreateModal(false)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: "0 0 1rem",
                }}
              >
                Create a New Club
              </h2>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
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
                    Club Name *
                  </label>
                  <input
                    value={createData.name}
                    onChange={(e) =>
                      setCreateData((d) => ({ ...d, name: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      background: "var(--bg-base)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                      outline: "none",
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
                    Description *
                  </label>
                  <textarea
                    value={createData.description}
                    onChange={(e) =>
                      setCreateData((d) => ({
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
                      outline: "none",
                      minHeight: "80px",
                      resize: "vertical",
                    }}
                  />
                </div>
                <div
                  style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}
                >
                  <button
                    onClick={() => setShowCreateModal(false)}
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
                    onClick={() => createMut.mutate()}
                    disabled={
                      !createData.name ||
                      !createData.description ||
                      createMut.isPending
                    }
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
                    {createMut.isPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Create"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
// --- END OF FILE src/pages/ClubsPage.tsx ---
