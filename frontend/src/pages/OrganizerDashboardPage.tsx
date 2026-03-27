// --- START OF FILE src/pages/OrganizerDashboardPage.tsx ---
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Plus,
  Settings,
  XCircle,
  Loader2,
  Trophy,
} from "lucide-react";
import { getTournament, cancelTournament } from "../api/tournaments";
import { getMyTournamentHistory } from "../api/users";
import TournamentCard from "../components/TournamentCard";

export default function OrganizerDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: historyPage, isLoading: loadingHistory } = useQuery({
    queryKey: ["my-organizer-tournaments"],
    queryFn: () => getMyTournamentHistory({ role: "ORGANIZER", size: 100 }),
  });

  const { data: tournaments = [], isLoading: loadingFull } = useQuery({
    queryKey: [
      "my-full-tournaments",
      historyPage?.content?.map((t) => t.tournamentId),
    ],
    enabled: !!historyPage?.content && historyPage.content.length > 0,
    queryFn: async () =>
      Promise.all(
        historyPage!.content.map((t) => getTournament(t.tournamentId)),
      ),
  });

  const isLoading =
    loadingHistory || (historyPage?.content?.length! > 0 && loadingFull);

  const cancelMutation = useMutation({
    mutationFn: cancelTournament,
    onSuccess: () => {
      toast.success("Tournament cancelled.");
      queryClient.invalidateQueries({ queryKey: ["my-full-tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["my-organizer-tournaments"] });
    },
    onError: (err: any) =>
      toast.error(err.message || "Failed to cancel tournament"),
  });

  return (
    <>
      <style>{`
        .org-action-btn { display: inline-flex; align-items: center; gap: 0.375rem; justify-content: center; padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.8125rem; font-weight: 600; cursor: pointer; border: 1px solid var(--border); background: var(--bg-surface); color: var(--text-secondary); transition: all 150ms; }
        .org-action-btn:hover:not(:disabled) { border-color: var(--border-strong); color: var(--text-primary); }
        .org-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .org-action-danger:hover:not(:disabled) { border-color: rgba(211,77,75,0.4); color: var(--danger); background: rgba(211,77,75,0.05); }
        .org-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr)); gap: 1.25rem; }
      `}</style>
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "2.5rem 1.5rem 5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "2.5rem",
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
              <LayoutDashboard
                size={20}
                style={{ color: "var(--accent-cta)" }}
              />
              <h1
                style={{
                  fontSize: "clamp(1.5rem, 4vw, 1.75rem)",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Organizer Dashboard
              </h1>
            </div>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.9375rem",
                margin: 0,
              }}
            >
              Select a tournament to manage matches, requests, and staff.
            </p>
          </div>
          <button
            onClick={() => navigate("/create-tournament")}
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
            <Plus size={16} /> Create
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "4rem" }}>
            <Loader2
              size={24}
              className="animate-spin text-muted"
              style={{ margin: "0 auto" }}
            />
          </div>
        ) : tournaments.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem",
              background: "var(--bg-surface)",
              border: "1px dashed var(--border)",
              borderRadius: "12px",
            }}
          >
            <Trophy
              size={32}
              style={{ color: "var(--text-muted)", margin: "0 auto 1rem" }}
            />
            <h3
              style={{ color: "var(--text-primary)", marginBottom: "0.5rem" }}
            >
              No tournaments organized
            </h3>
            <p style={{ color: "var(--text-muted)" }}>
              Host your first event today.
            </p>
          </div>
        ) : (
          <div className="org-grid">
            {tournaments.map((t) => {
              const isLocked =
                t.status === "ONGOING" ||
                t.status === "COMPLETED" ||
                t.status === "CANCELLED";
              return (
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
                      display: "flex",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <button
                      className="org-action-btn org-action-danger"
                      disabled={isLocked || cancelMutation.isPending}
                      onClick={() =>
                        confirm("Cancel this tournament?") &&
                        cancelMutation.mutate(t.tournamentId)
                      }
                    >
                      <XCircle size={14} /> Cancel
                    </button>
                    <button
                      className="org-action-btn"
                      onClick={() =>
                        navigate(`/tournaments/${t.tournamentId}/manage`)
                      }
                      style={{
                        borderColor: "var(--accent-cta)",
                        color: "var(--accent-cta)",
                      }}
                    >
                      <Settings size={14} /> Manage
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
// --- END OF FILE src/pages/OrganizerDashboardPage.tsx ---
