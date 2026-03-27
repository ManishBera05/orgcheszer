import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trophy, Plus, ArrowLeft, Loader2 } from "lucide-react";
import { createTournament } from "../api/tournaments";
import type { TournamentCreateRequest, ApiError } from "../types";

export default function CreateTournamentPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<TournamentCreateRequest>({
    tournamentName: "",
    startDateTime: "",
    numberOfRounds: 5,
    maxParticipants: 32,
    entryFee: 0,
    description: "",
    location: "",
    timeControl: "90+30",
    format: "SWISS",
  });

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

  const mutation = useMutation({
    mutationFn: createTournament,
    onSuccess: () => {
      toast.success(
        "Tournament created successfully! It is now pending admin approval.",
      );
      navigate("/dashboard");
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Failed to create tournament.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tournamentName.trim())
      return toast.error("Tournament name is required");
    if (!formData.startDateTime)
      return toast.error("Start date and time is required");
    if (new Date(formData.startDateTime) <= new Date())
      return toast.error("Start date must be in the future");
    if (formData.numberOfRounds < 1 || formData.numberOfRounds > 20)
      return toast.error("Rounds must be between 1 and 20");
    if (formData.maxParticipants < 4)
      return toast.error("Participants must be at least 4");

    mutation.mutate(formData);
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
    transition: "border-color 150ms ease",
    colorScheme: "dark",
  };

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
          fontFamily: "var(--font-sans)",
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
            Create Tournament
          </h1>
        </div>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.9375rem",
            margin: 0,
          }}
        >
          Fill in the details below. Once submitted, it will await admin
          approval.
        </p>
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
        }}
      >
        {/* Name */}
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
            Tournament Name{" "}
            <span style={{ color: "var(--accent-cta)" }}>*</span>
          </label>
          <input
            type="text"
            name="tournamentName"
            value={formData.tournamentName}
            onChange={handleChange}
            style={inputStyle}
            placeholder="e.g., Winter Grandmaster Open"
            required
          />
        </div>

        {/* Date & Location */}
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
              Start Date & Time{" "}
              <span style={{ color: "var(--accent-cta)" }}>*</span>
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
              Location <span style={{ color: "var(--accent-cta)" }}>*</span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Address or Online link"
              required
            />
          </div>
        </div>

        {/* Format & Time Control */}
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
              Format <span style={{ color: "var(--accent-cta)" }}>*</span>
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
              Time Control <span style={{ color: "var(--accent-cta)" }}>*</span>
            </label>
            <input
              type="text"
              name="timeControl"
              value={formData.timeControl}
              onChange={handleChange}
              style={inputStyle}
              placeholder="e.g., 90+30"
              required
            />
          </div>
        </div>

        {/* Numbers */}
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
              Rounds (1-20)
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
              Max Players (≥4)
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

        {/* Description */}
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
            Description <span style={{ color: "var(--accent-cta)" }}>*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
            placeholder="Provide tournament rules, prizes, and schedule details..."
            required
          />
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginTop: "1rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <button
            type="submit"
            disabled={mutation.isPending}
            style={{
              flex: 1,
              padding: "0.875rem",
              background: "var(--accent-cta)",
              color: "var(--text-on-accent)",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: mutation.isPending ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "background 150ms ease",
            }}
          >
            {mutation.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Plus size={18} />
            )}
            Submit for Approval
          </button>
        </div>
      </form>
    </div>
  );
}
