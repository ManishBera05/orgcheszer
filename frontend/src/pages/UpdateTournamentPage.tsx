// --- START OF FILE src/pages/UpdateTournamentPage.tsx ---
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trophy, ArrowLeft, Loader2, Save, XCircle } from "lucide-react";
import {
  getTournament,
  updateTournament,
  cancelTournament,
} from "../api/tournaments";
import type { TournamentCreateRequest, ApiError } from "../types";

export default function UpdateTournamentPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<TournamentCreateRequest>({
    tournamentName: "",
    startDateTime: "",
    numberOfRounds: 5,
    maxParticipants: 32,
    entryFee: 0,
    description: "",
    location: "",
    timeControl: "",
    format: "SWISS",
  });

  const { data: tournament, isLoading } = useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: () => getTournament(tournamentId!),
    enabled: !!tournamentId,
  });

  useEffect(() => {
    if (tournament) {
      setFormData({
        tournamentName: tournament.tournamentName,
        startDateTime: tournament.startDateTime.slice(0, 16), // Trim for datetime-local
        numberOfRounds: tournament.numberOfRounds,
        maxParticipants: tournament.maxParticipants,
        entryFee: tournament.entryFee,
        description: tournament.description,
        location: tournament.location,
        timeControl: tournament.timeControl,
        format: tournament.format,
      });
    }
  }, [tournament]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "numberOfRounds" ||
        name === "maxParticipants" ||
        name === "entryFee"
          ? parseInt(value, 10) || 0
          : value,
    }));
  };

  const updateMut = useMutation({
    mutationFn: (data: TournamentCreateRequest) =>
      updateTournament(tournamentId!, data),
    onSuccess: () => {
      toast.success("Tournament updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["my-full-tournaments"] });
      navigate("/dashboard");
    },
    onError: (err: ApiError) =>
      toast.error(err.message || "Failed to update tournament."),
  });

  const cancelMut = useMutation({
    mutationFn: () => cancelTournament(tournamentId!),
    onSuccess: () => {
      toast.success("Tournament cancelled successfully.");
      queryClient.invalidateQueries({ queryKey: ["my-full-tournaments"] });
      navigate("/dashboard");
    },
    onError: (err: ApiError) =>
      toast.error(err.message || "Failed to cancel tournament."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tournamentName.trim() || !formData.startDateTime)
      return toast.error("Missing required fields.");
    updateMut.mutate(formData);
  };

  const handleCancelTournament = () => {
    if (
      confirm(
        "Are you sure you want to cancel this tournament? This cannot be undone.",
      )
    ) {
      cancelMut.mutate();
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "0.75rem 0.875rem",
    background: "var(--bg-base)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    color: "var(--text-primary)",
    fontSize: "0.9375rem",
    outline: "none",
    colorScheme: "dark",
  };

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

  return (
    <div
      style={{
        maxWidth: "700px",
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

      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            marginBottom: "0.375rem",
          }}
        >
          <Trophy size={20} style={{ color: "var(--accent-cta)" }} />
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            Update Tournament
          </h1>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              fontWeight: 500,
            }}
          >
            Tournament Name
          </label>
          <input
            type="text"
            name="tournamentName"
            value={formData.tournamentName}
            onChange={handleChange}
            style={inputStyle}
            required
          />
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
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                fontWeight: 500,
              }}
            >
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              name="startDateTime"
              value={formData.startDateTime}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                fontWeight: 500,
              }}
            >
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              style={inputStyle}
              required
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
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                fontWeight: 500,
              }}
            >
              Format
            </label>
            <select
              name="format"
              value={formData.format}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="SWISS">Swiss System</option>
              <option value="ROUND_ROBIN">Round Robin</option>
            </select>
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                fontWeight: 500,
              }}
            >
              Time Control
            </label>
            <input
              type="text"
              name="timeControl"
              value={formData.timeControl}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "1rem",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                fontWeight: 500,
              }}
            >
              Rounds
            </label>
            <input
              type="number"
              name="numberOfRounds"
              value={formData.numberOfRounds}
              onChange={handleChange}
              min="1"
              max="20"
              style={inputStyle}
              required
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                fontWeight: 500,
              }}
            >
              Max Players
            </label>
            <input
              type="number"
              name="maxParticipants"
              value={formData.maxParticipants}
              onChange={handleChange}
              min="4"
              style={inputStyle}
              required
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                fontWeight: 500,
              }}
            >
              Entry Fee (₹)
            </label>
            <input
              type="number"
              name="entryFee"
              value={formData.entryFee}
              onChange={handleChange}
              min="0"
              style={inputStyle}
              required
            />
          </div>
        </div>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              fontWeight: 500,
            }}
          >
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
            required
          />
        </div>

        <button
          type="submit"
          disabled={updateMut.isPending}
          style={{
            padding: "0.875rem",
            background: "var(--accent-cta)",
            color: "var(--text-on-accent)",
            border: "none",
            borderRadius: "8px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          {updateMut.isPending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}{" "}
          Save Changes
        </button>
      </form>

      {/* DANGER ZONE */}
      <div
        style={{
          border: "1px solid rgba(211,77,75,0.4)",
          borderRadius: "16px",
          padding: "1.5rem",
          background: "rgba(211,77,75,0.05)",
        }}
      >
        <h3
          style={{
            color: "var(--danger)",
            margin: "0 0 0.5rem",
            fontSize: "1.125rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <XCircle size={18} /> Danger Zone
        </h3>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.875rem",
            marginBottom: "1rem",
          }}
        >
          Cancelling a tournament is permanent and will notify all registered
          players.
        </p>
        <button
          onClick={handleCancelTournament}
          disabled={cancelMut.isPending}
          style={{
            padding: "0.75rem 1rem",
            background: "var(--danger)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {cancelMut.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <XCircle size={16} />
          )}{" "}
          Cancel Tournament
        </button>
      </div>
    </div>
  );
}
// --- END OF FILE src/pages/UpdateTournamentPage.tsx ---
