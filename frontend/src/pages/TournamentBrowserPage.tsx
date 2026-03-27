import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  SlidersHorizontal,
  Search,
  X,
  ChevronDown,
  Radio,
  CalendarClock,
  ArchiveIcon,
  Loader2,
} from "lucide-react";
import {
  getTournamentsPaged,
  type TournamentFilterParams,
} from "../api/tournaments";
import TournamentCard from "../components/TournamentCard";
import type { TournamentResponse, TournamentStatus } from "../types";

/* ─── Tab config ──────────────────────────────────────────── */
type TabKey = "live" | "upcoming" | "past";

const TABS: {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  statuses: TournamentStatus[];
}[] = [
  {
    key: "live",
    label: "Live",
    icon: <Radio size={14} />,
    statuses: ["ONGOING"],
  },
  {
    key: "upcoming",
    label: "Upcoming",
    icon: <CalendarClock size={14} />,
    statuses: ["UPCOMING"],
  },
  {
    key: "past",
    label: "Past",
    icon: <ArchiveIcon size={14} />,
    statuses: ["COMPLETED", "CANCELLED"],
  },
];

const PAGE_SIZE = 9;

/* ─── Filter state ────────────────────────────────────────── */
interface Filters {
  format: string;
  type: string;
  startDateFrom: string;
  startDateTo: string;
}

const EMPTY_FILTERS: Filters = {
  format: "",
  type: "",
  startDateFrom: "",
  startDateTo: "",
};

/* ─── Select field ────────────────────────────────────────── */
function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <label
        style={{
          fontSize: "0.75rem",
          fontWeight: 500,
          color: "var(--text-muted)",
          letterSpacing: "0.03em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem 2rem 0.5rem 0.75rem",
            background: "var(--bg-base)",
            border: `1px solid ${value ? "var(--accent-cta)" : "var(--border)"}`,
            borderRadius: "6px",
            color: value ? "var(--text-primary)" : "var(--text-muted)",
            fontSize: "0.875rem",
            fontFamily: "var(--font-sans)",
            cursor: "pointer",
            outline: "none",
            appearance: "none",
            WebkitAppearance: "none",
            transition: "border-color 150ms ease",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "var(--accent-cta)")
          }
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = value
              ? "var(--accent-cta)"
              : "var(--border)")
          }
        >
          <option value="">All</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={13}
          style={{
            position: "absolute",
            right: "0.625rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}

/* ─── Date field ──────────────────────────────────────────── */
function FilterDate({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <label
        style={{
          fontSize: "0.75rem",
          fontWeight: 500,
          color: "var(--text-muted)",
          letterSpacing: "0.03em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "0.5rem 0.75rem",
          background: "var(--bg-base)",
          border: `1px solid ${value ? "var(--accent-cta)" : "var(--border)"}`,
          borderRadius: "6px",
          color: value ? "var(--text-primary)" : "var(--text-muted)",
          fontSize: "0.875rem",
          fontFamily: "var(--font-sans)",
          outline: "none",
          transition: "border-color 150ms ease",
          colorScheme: "dark",
        }}
        onFocus={(e) =>
          (e.currentTarget.style.borderColor = "var(--accent-cta)")
        }
        onBlur={(e) =>
          (e.currentTarget.style.borderColor = value
            ? "var(--accent-cta)"
            : "var(--border)")
        }
      />
    </div>
  );
}

/* ─── Active filter pill ──────────────────────────────────── */
function FilterPill({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        padding: "0.2rem 0.5rem 0.2rem 0.625rem",
        background: "var(--accent-subtle)",
        border: "1px solid var(--border)",
        borderRadius: "99px",
        fontSize: "0.75rem",
        fontWeight: 500,
        color: "var(--camel-400)",
      }}
    >
      {label}
      <button
        onClick={onRemove}
        style={{
          display: "flex",
          alignItems: "center",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          padding: "1px",
          borderRadius: "50%",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.color = "var(--danger)")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.color =
            "var(--text-muted)")
        }
      >
        <X size={11} />
      </button>
    </div>
  );
}

/* ─── Skeleton grid ───────────────────────────────────────── */
function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="tb-grid">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            overflow: "hidden",
            animationDelay: `${i * 60}ms`,
          }}
        >
          <div style={{ height: "3px", background: "var(--border)" }} />
          <div
            style={{
              padding: "1.125rem 1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div
              className="skeleton"
              style={{ height: "18px", width: "65%" }}
            />
            <div
              className="skeleton"
              style={{ height: "13px", width: "40%" }}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
              }}
            >
              {[...Array(6)].map((_, j) => (
                <div key={j} className="skeleton" style={{ height: "13px" }} />
              ))}
            </div>
            <div
              className="skeleton"
              style={{ height: "5px", borderRadius: "99px" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Empty state ─────────────────────────────────────────── */
function EmptyState({ tab, hasFilters }: { tab: TabKey; hasFilters: boolean }) {
  const msgs: Record<TabKey, { icon: string; title: string; sub: string }> = {
    live: {
      icon: "⚡",
      title: "No live tournaments right now",
      sub: "Check back soon — rounds are paired when the organiser triggers them.",
    },
    upcoming: {
      icon: "📅",
      title: "No upcoming tournaments",
      sub: hasFilters
        ? "Try adjusting your filters."
        : "Be the first to create one.",
    },
    past: {
      icon: "📚",
      title: "No past tournaments yet",
      sub: "Completed tournaments will appear here.",
    },
  };
  const m = msgs[tab];
  return (
    <div
      style={{
        gridColumn: "1 / -1",
        textAlign: "center",
        padding: "5rem 1.5rem",
        background: "var(--bg-surface)",
        border: "1px dashed var(--border)",
        borderRadius: "16px",
      }}
    >
      <div style={{ fontSize: "2.5rem", marginBottom: "0.875rem" }}>
        {m.icon}
      </div>
      <p
        style={{
          fontWeight: 600,
          color: "var(--text-secondary)",
          marginBottom: "0.375rem",
        }}
      >
        {m.title}
      </p>
      <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
        {m.sub}
      </p>
    </div>
  );
}

/* ─── TournamentBrowserPage ───────────────────────────────── */
export default function TournamentBrowserPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Read tab from URL so deep-links and back-button work
  const rawTab = searchParams.get("tab") as TabKey | null;
  const activeTab: TabKey = TABS.find((t) => t.key === rawTab)
    ? (rawTab as TabKey)
    : "upcoming";

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [pending, setPending] = useState<Filters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [accumulated, setAccumulated] = useState<TournamentResponse[]>([]);
  const prevTabRef = useRef(activeTab);

  // Reset accumulated list when tab or filters change
  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      prevTabRef.current = activeTab;
      setPage(0);
      setAccumulated([]);
    }
  }, [activeTab]);

  function switchTab(key: TabKey) {
    setSearchParams({ tab: key });
    setPage(0);
    setAccumulated([]);
  }

  function applyFilters() {
    setFilters(pending);
    setPage(0);
    setAccumulated([]);
    setFiltersOpen(false);
  }

  function clearFilters() {
    setPending(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(0);
    setAccumulated([]);
  }

  const currentTab = TABS.find((t) => t.key === activeTab)!;

  const isSingleStatus = currentTab.statuses.length === 1;
  const queryParams: TournamentFilterParams = {
    // Use statuses[] for multi-status tabs (Past = COMPLETED + CANCELLED)
    // so the API layer fires parallel requests instead of sending an array param
    ...(isSingleStatus
      ? { status: currentTab.statuses[0] }
      : { statuses: currentTab.statuses }),
    format: filters.format || undefined,
    type: filters.type || undefined,
    startDateFrom: filters.startDateFrom || undefined,
    startDateTo: filters.startDateTo || undefined,
    page,
    size: PAGE_SIZE,
  };

  const qKey = ["tournaments-browser", activeTab, filters, page];

  const { data, isFetching, isLoading } = useQuery({
    queryKey: qKey,
    queryFn: () => getTournamentsPaged(queryParams),
    staleTime: 30_000,
  });

  // Accumulate pages for "load more"
  useEffect(() => {
    if (!data) return;
    if (page === 0) {
      setAccumulated(data.content);
    } else {
      setAccumulated((prev) => [...prev, ...data.content]);
    }
  }, [data]);

  // Prefetch next page
  useEffect(() => {
    if (data && !data.last) {
      queryClient.prefetchQuery({
        queryKey: ["tournaments-browser", activeTab, filters, page + 1],
        queryFn: () => getTournamentsPaged({ ...queryParams, page: page + 1 }),
        staleTime: 30_000,
      });
    }
  }, [data, page]);

  const hasFilters = Object.values(filters).some(Boolean);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // Build active pill labels
  const activePills: { label: string; key: keyof Filters }[] = [
    filters.format && {
      label: `Format: ${filters.format}`,
      key: "format" as const,
    },
    filters.type && { label: `Type: ${filters.type}`, key: "type" as const },
    filters.startDateFrom && {
      label: `From: ${filters.startDateFrom}`,
      key: "startDateFrom" as const,
    },
    filters.startDateTo && {
      label: `To: ${filters.startDateTo}`,
      key: "startDateTo" as const,
    },
  ].filter(Boolean) as { label: string; key: keyof Filters }[];

  return (
    <>
      <style>{`
        @keyframes tb-fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

        .tb-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem 4rem;
          animation: tb-fadeIn 300ms ease forwards;
        }

        /* Tabs */
        .tb-tabs {
          display: flex;
          gap: 0.25rem;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 0.25rem;
          width: fit-content;
        }
        .tb-tab {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 1.125rem;
          border-radius: 7px;
          font-size: 0.875rem;
          font-weight: 500;
          font-family: var(--font-sans);
          border: none;
          cursor: pointer;
          background: transparent;
          color: var(--text-muted);
          transition: color 150ms ease, background 150ms ease;
          white-space: nowrap;
        }
        .tb-tab:hover { color: var(--text-secondary); background: var(--bg-elevated); }
        .tb-tab.active {
          background: var(--bg-base);
          color: var(--text-primary);
          border: 1px solid var(--border);
          font-weight: 600;
        }
        .tb-tab-live-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--success);
          animation: tc-pulse 1.8s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes tc-pulse { 0%,100%{opacity:1}50%{opacity:0.35} }

        /* Filter bar */
        .tb-toolbar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-top: 1.5rem;
        }
        .tb-filter-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.875rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          font-family: var(--font-sans);
          border: 1px solid var(--border);
          background: var(--bg-surface);
          color: var(--text-secondary);
          cursor: pointer;
          transition: border-color 150ms ease, color 150ms ease;
          white-space: nowrap;
        }
        .tb-filter-btn:hover { border-color: var(--border-strong); color: var(--text-primary); }
        .tb-filter-btn.active { border-color: var(--accent-cta); color: var(--accent-cta); background: var(--accent-subtle); }
        .tb-filter-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: var(--accent-cta);
          color: var(--text-on-accent);
          font-size: 0.625rem;
          font-weight: 700;
          line-height: 1;
        }

        /* Filter panel */
        .tb-filter-panel {
          margin-top: 0.75rem;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.25rem;
          animation: tb-fadeIn 180ms ease forwards;
        }
        .tb-filter-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .tb-filter-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.625rem;
          padding-top: 0.875rem;
          border-top: 1px solid var(--border-subtle);
        }
        .tb-btn-ghost {
          padding: 0.45rem 0.875rem;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-family: var(--font-sans);
          cursor: pointer;
          transition: border-color 150ms ease, color 150ms ease;
        }
        .tb-btn-ghost:hover { border-color: var(--border-strong); color: var(--text-primary); }
        .tb-btn-apply {
          padding: 0.45rem 1rem;
          border: none;
          border-radius: 6px;
          background: var(--accent-cta);
          color: var(--text-on-accent);
          font-size: 0.875rem;
          font-weight: 600;
          font-family: var(--font-sans);
          cursor: pointer;
          transition: background 150ms ease;
        }
        .tb-btn-apply:hover { background: var(--accent-hover); }

        /* Results bar */
        .tb-results-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin: 1.25rem 0 1.5rem;
        }
        .tb-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          align-items: center;
        }

        /* Grid */
        .tb-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.125rem;
        }

        /* Load more */
        .tb-load-more {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          margin-top: 2.5rem;
          padding-top: 2.5rem;
          border-top: 1px solid var(--border-subtle);
        }
        .tb-btn-more {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.7rem 1.75rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-surface);
          color: var(--text-secondary);
          font-size: 0.9375rem;
          font-weight: 500;
          font-family: var(--font-sans);
          cursor: pointer;
          transition: border-color 150ms ease, color 150ms ease, background 150ms ease;
        }
        .tb-btn-more:hover { border-color: var(--accent-cta); color: var(--accent-cta); background: var(--accent-subtle); }
        .tb-btn-more:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Responsive */
        @media (max-width: 960px) {
          .tb-filter-grid { grid-template-columns: repeat(2, 1fr); }
          .tb-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .tb-page { padding: 1.5rem 1rem 3rem; }
          .tb-tabs { width: 100%; }
          .tb-tab  { flex: 1; justify-content: center; padding: 0.5rem 0.5rem; font-size: 0.8125rem; }
          .tb-filter-grid { grid-template-columns: 1fr; }
          .tb-grid { grid-template-columns: 1fr; }
          .tb-results-bar { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div className="tb-page">
        {/* ── Page header ── */}
        <div style={{ marginBottom: "1.75rem" }}>
          <h1
            style={{
              fontSize: "clamp(1.375rem, 3vw, 1.875rem)",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.03em",
              marginBottom: "0.375rem",
            }}
          >
            Tournament browser
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)" }}>
            Find and join tournaments, or track live results
          </p>
        </div>

        {/* ── Tabs ── */}
        <div className="tb-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={activeTab === t.key}
              className={`tb-tab${activeTab === t.key ? " active" : ""}`}
              onClick={() => switchTab(t.key)}
            >
              {t.key === "live" ? <span className="tb-tab-live-dot" /> : t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="tb-toolbar">
          <button
            className={`tb-filter-btn${filtersOpen || hasFilters ? " active" : ""}`}
            onClick={() => setFiltersOpen((o) => !o)}
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="tb-filter-badge">{activeFilterCount}</span>
            )}
          </button>

          {hasFilters && (
            <button
              className="tb-filter-btn"
              onClick={clearFilters}
              style={{
                color: "var(--danger)",
                borderColor: "rgba(211,77,75,0.3)",
              }}
            >
              <X size={13} />
              Clear all
            </button>
          )}
        </div>

        {/* ── Filter panel ── */}
        {filtersOpen && (
          <div className="tb-filter-panel">
            <div className="tb-filter-grid">
              <FilterSelect
                label="Format"
                value={pending.format}
                onChange={(v) => setPending((f) => ({ ...f, format: v }))}
                options={[
                  { value: "SWISS", label: "Swiss" },
                  { value: "ROUND_ROBIN", label: "Round Robin" },
                ]}
              />
              {/* TODO: wire to backend 'type' param once implemented */}
              <FilterSelect
                label="Type"
                value={pending.type}
                onChange={(v) => setPending((f) => ({ ...f, type: v }))}
                options={[
                  { value: "BLITZ", label: "Blitz" },
                  { value: "RAPID", label: "Rapid" },
                  { value: "CLASSICAL", label: "Classical" },
                ]}
              />
              <FilterDate
                label="Start date from"
                value={pending.startDateFrom}
                onChange={(v) =>
                  setPending((f) => ({ ...f, startDateFrom: v }))
                }
              />
              <FilterDate
                label="Start date to"
                value={pending.startDateTo}
                onChange={(v) => setPending((f) => ({ ...f, startDateTo: v }))}
              />
            </div>
            <div className="tb-filter-actions">
              <button
                className="tb-btn-ghost"
                onClick={() => {
                  setPending(EMPTY_FILTERS);
                }}
              >
                Reset
              </button>
              <button className="tb-btn-apply" onClick={applyFilters}>
                Apply filters
              </button>
            </div>
          </div>
        )}

        {/* ── Results bar ── */}
        <div className="tb-results-bar">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              flexWrap: "wrap",
            }}
          >
            {/* Count */}
            {!isLoading && data && (
              <span
                style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}
              >
                {data.totalElements === 0
                  ? "No tournaments found"
                  : `${accumulated.length} of ${data.totalElements} tournament${data.totalElements !== 1 ? "s" : ""}`}
              </span>
            )}
            {/* Active filter pills */}
            {activePills.length > 0 && (
              <div className="tb-pills">
                {activePills.map((p) => (
                  <FilterPill
                    key={p.key}
                    label={p.label}
                    onRemove={() => {
                      const next = { ...filters, [p.key]: "" };
                      setFilters(next);
                      setPending(next);
                      setPage(0);
                      setAccumulated([]);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Live indicator */}
          {activeTab === "live" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                fontSize: "0.8125rem",
                color: "var(--success)",
                fontWeight: 500,
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "var(--success)",
                  animation: "tc-pulse 1.5s ease-in-out infinite",
                  display: "inline-block",
                }}
              />
              Updating live
            </div>
          )}
        </div>

        {/* ── Cards ── */}
        {isLoading && page === 0 ? (
          <SkeletonGrid />
        ) : (
          <>
            <div className="tb-grid">
              {accumulated.length === 0 ? (
                <EmptyState tab={activeTab} hasFilters={hasFilters} />
              ) : (
                accumulated.map((t, i) => (
                  <TournamentCard
                    key={t.tournamentId}
                    t={t}
                    index={i % PAGE_SIZE}
                  />
                ))
              )}
            </div>

            {/* ── Load more ── */}
            {data && !data.last && accumulated.length > 0 && (
              <div className="tb-load-more">
                <p
                  style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}
                >
                  Showing {accumulated.length} of {data.totalElements}{" "}
                  tournaments
                </p>
                <button
                  className="tb-btn-more"
                  disabled={isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {isFetching ? (
                    <>
                      <Loader2
                        size={15}
                        style={{ animation: "spin 0.7s linear infinite" }}
                      />
                      Loading…
                    </>
                  ) : (
                    <>
                      <Search size={15} />
                      Load more tournaments
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
