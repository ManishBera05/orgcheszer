// --- START OF FILE src/components/TournamentCard.tsx ---
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Clock, CalendarDays, Hash } from "lucide-react";
import { formatDateTime, formatEntryFee, truncate } from "../lib/utils";
import type { TournamentResponse } from "../types";

function useCountdown(targetIso: string) {
  const calc = () => {
    const diff = new Date(targetIso).getTime() - Date.now();
    if (diff <= 0) return null;
    const total = Math.floor(diff / 1000);
    return {
      d: Math.floor(total / 86400),
      h: Math.floor((total % 86400) / 3600),
      m: Math.floor((total % 3600) / 60),
      s: total % 60,
      total,
    };
  };
  const [r, setR] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setR(calc()), 1000);
    return () => clearInterval(id);
  }, [targetIso]);
  return r;
}

function StatusBadge({ t }: { t: TournamentResponse }) {
  // If COMPLETED or CANCELLED, show solid badge without animation
  if (t.status === "COMPLETED") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.3rem",
          padding: "0.25rem 0.6rem",
          background: "rgba(156,121,64,0.15)",
          border: "1px solid rgba(156,121,64,0.25)",
          borderRadius: "6px",
        }}
      >
        <span
          style={{
            fontSize: "0.6875rem",
            fontWeight: 700,
            color: "var(--camel-600)",
            letterSpacing: "0.03em",
          }}
        >
          Completed
        </span>
      </div>
    );
  }
  if (t.status === "CANCELLED") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.3rem",
          padding: "0.25rem 0.6rem",
          background: "rgba(211,77,75,0.15)",
          border: "1px solid rgba(211,77,75,0.25)",
          borderRadius: "6px",
        }}
      >
        <span
          style={{
            fontSize: "0.6875rem",
            fontWeight: 700,
            color: "var(--danger)",
            letterSpacing: "0.03em",
          }}
        >
          Cancelled
        </span>
      </div>
    );
  }

  const r = useCountdown(t.startDateTime);

  // ONGOING or UPCOMING with diff <= 0 means LIVE
  if (t.status === "ONGOING" || !r) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.3rem",
          padding: "0.25rem 0.6rem",
          background: "rgba(74,158,107,0.13)",
          border: "1px solid rgba(74,158,107,0.25)",
          borderRadius: "6px",
        }}
      >
        <span
          style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: "#4a9e6b",
            display: "inline-block",
            animation: "tc-pulse 1.5s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontSize: "0.6875rem",
            fontWeight: 700,
            color: "#4a9e6b",
            letterSpacing: "0.03em",
          }}
        >
          Live
        </span>
      </div>
    );
  }

  // UPCOMING countdown
  const urgent = r.total < 86400;
  const units =
    r.d > 0
      ? [
          { v: r.d, l: "d" },
          { v: r.h, l: "h" },
          { v: r.m, l: "m" },
        ]
      : r.h > 0
        ? [
            { v: r.h, l: "h" },
            { v: r.m, l: "m" },
            { v: r.s, l: "s" },
          ]
        : [
            { v: r.m, l: "m" },
            { v: r.s, l: "s" },
          ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.3rem",
        padding: "0.25rem 0.6rem",
        background: urgent ? "rgba(211,77,75,0.1)" : "var(--accent-subtle)",
        border: `1px solid ${urgent ? "rgba(211,77,75,0.28)" : "var(--border)"}`,
        borderRadius: "6px",
      }}
    >
      <Clock
        size={10}
        style={{
          color: urgent ? "var(--danger)" : "var(--accent-cta)",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: "0.6875rem",
          fontWeight: 700,
          color: urgent ? "var(--danger)" : "var(--accent-cta)",
          letterSpacing: "0.03em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {units.map((u, i) => (
          <span key={u.l}>
            {i > 0 && <span style={{ opacity: 0.45, margin: "0 1px" }}>:</span>}
            {String(u.v).padStart(2, "0")}
            {u.l}
          </span>
        ))}
      </span>
    </div>
  );
}

function CapacityBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  const color =
    pct >= 90
      ? "var(--danger)"
      : pct >= 70
        ? "var(--warning)"
        : "var(--success)";
  const label = pct >= 90 ? "Almost full" : pct >= 70 ? "Filling up" : "Open";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: "0.6875rem",
            fontWeight: 600,
            color,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: "0.6875rem",
            color: "var(--text-muted)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {current} / {max} players
        </span>
      </div>
      <div
        style={{
          height: "5px",
          background: "var(--bg-elevated)",
          borderRadius: "99px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: "99px",
            transition: "width 600ms ease",
          }}
        />
      </div>
    </div>
  );
}

function MetaCell({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.35rem",
        minWidth: 0,
      }}
    >
      <span
        style={{
          color: "var(--camel-600)",
          flexShrink: 0,
          lineHeight: 0,
          display: "flex",
        }}
      >
        {icon}
      </span>
      <span
        style={{
          fontSize: "0.8rem",
          color: "var(--text-secondary)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {text}
      </span>
    </div>
  );
}

interface Props {
  t: TournamentResponse;
  index?: number;
}

export default function TournamentCard({ t, index = 0 }: Props) {
  return (
    <>
      <style>{`
        @keyframes tc-pulse   { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes tc-slideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <Link
        to={`/tournaments/${t.tournamentId}`}
        style={{
          textDecoration: "none",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          overflow: "hidden",
          opacity: 0,
          animation: "tc-slideUp 380ms ease forwards",
          animationDelay: `${index * 90}ms`,
          transition:
            "border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLAnchorElement;
          el.style.borderColor = "var(--border-strong)";
          el.style.boxShadow = "var(--shadow-md)";
          el.style.transform = "translateY(-3px)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLAnchorElement;
          el.style.borderColor = "var(--border)";
          el.style.boxShadow = "none";
          el.style.transform = "translateY(0)";
        }}
      >
        <div
          style={{
            height: "3px",
            background:
              "linear-gradient(90deg, var(--accent-cta), var(--choc-400))",
            flexShrink: 0,
          }}
        />

        <div
          style={{
            padding: "1.125rem 1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            flex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "0.625rem",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  margin: 0,
                  lineHeight: 1.3,
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {t.tournamentName}
              </h3>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  margin: "0.2rem 0 0",
                }}
              >
                by {t.organizerName}
              </p>
            </div>
            {/* UPDATED STATUS BADGE */}
            <StatusBadge t={t} />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem 1.25rem",
            }}
          >
            <MetaCell
              icon={<CalendarDays size={12} />}
              text={formatDateTime(t.startDateTime)}
            />
            <MetaCell
              icon={
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    color: "var(--camel-600)",
                    letterSpacing: "0.02em",
                  }}
                >
                  FMT
                </span>
              }
              text={t.format.replace("_", " ")}
            />
            <MetaCell
              icon={<MapPin size={12} />}
              text={truncate(t.location, 20)}
            />
            <MetaCell icon={<Clock size={12} />} text={t.timeControl} />
            <MetaCell
              icon={
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "var(--camel-600)",
                    lineHeight: 1,
                  }}
                >
                  ₹
                </span>
              }
              text={formatEntryFee(t.entryFee)}
            />
            <MetaCell
              icon={<Hash size={12} />}
              text={`${t.numberOfRounds} rounds`}
            />
          </div>

          <div
            style={{
              marginTop: "auto",
              paddingTop: "0.625rem",
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            <CapacityBar
              current={t.currentNumberOfParticipants}
              max={t.maxParticipants}
            />
          </div>
        </div>
      </Link>
    </>
  );
}
// --- END OF FILE src/components/TournamentCard.tsx ---
