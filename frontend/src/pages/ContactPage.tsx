/* ─── ContactPage — placeholder ──────────────────────────── */
export default function ContactPage() {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1.5rem",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "420px" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✉</div>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.03em",
            marginBottom: "0.75rem",
          }}
        >
          Contact us
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            lineHeight: 1.7,
            marginBottom: "1.5rem",
          }}
        >
          This page is coming soon. In the meantime, reach out to us at{" "}
          <a
            href="mailto:beramanish.25@gmail.com"
            style={{ color: "var(--accent-cta)", fontWeight: 500 }}
          >
            beramanish.25@gmail.com
          </a>
        </p>
        <div
          style={{
            padding: "1rem 1.25rem",
            background: "var(--bg-surface)",
            border: "1px dashed var(--border)",
            borderRadius: "var(--radius-lg)",
            fontSize: "0.875rem",
            color: "var(--text-muted)",
          }}
        >
          Full contact page coming in a future update.
        </div>
      </div>
    </div>
  );
}
