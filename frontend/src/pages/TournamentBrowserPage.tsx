// --- START OF FILE src/pages/TournamentBrowserPage.tsx ---
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Radio,
  CalendarClock,
  ArchiveIcon,
  Loader2,
  Search,
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
function EmptyState({ tab }: { tab: TabKey }) {
  const msgs: Record<TabKey, { icon: string; title: string; sub: string }> = {
    live: {
      icon: "⚡",
      title: "No live tournaments right now",
      sub: "Check back soon — rounds are paired when the organiser triggers them.",
    },
    upcoming: {
      icon: "📅",
      title: "No upcoming tournaments",
      sub: "Be the first to create one.",
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

  const [page, setPage] = useState(0);
  const [accumulated, setAccumulated] = useState<TournamentResponse[]>([]);
  const prevTabRef = useRef(activeTab);

  // Reset accumulated list when tab changes
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

  const currentTab = TABS.find((t) => t.key === activeTab)!;
  const isSingleStatus = currentTab.statuses.length === 1;

  const queryParams: TournamentFilterParams = {
    // Use statuses[] for multi-status tabs (Past = COMPLETED + CANCELLED)
    ...(isSingleStatus
      ? { status: currentTab.statuses[0] }
      : { statuses: currentTab.statuses }),
    page,
    size: PAGE_SIZE,
  };

  const qKey = ["tournaments-browser", activeTab, page];

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
  }, [data, page]);

  // Prefetch next page
  useEffect(() => {
    if (data && !data.last) {
      queryClient.prefetchQuery({
        queryKey: ["tournaments-browser", activeTab, page + 1],
        queryFn: () => getTournamentsPaged({ ...queryParams, page: page + 1 }),
        staleTime: 30_000,
      });
    }
  }, [data, page, queryClient]);

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

        /* Results bar */
        .tb-results-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin: 1.5rem 0;
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
          .tb-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .tb-page { padding: 1.5rem 1rem 3rem; }
          .tb-tabs { width: 100%; }
          .tb-tab  { flex: 1; justify-content: center; padding: 0.5rem 0.5rem; font-size: 0.8125rem; }
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

        {/* ── Results bar ── */}
        <div className="tb-results-bar">
          {!isLoading && data && (
            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              {data.totalElements === 0
                ? "No tournaments found"
                : `${accumulated.length} of ${data.totalElements} tournament${data.totalElements !== 1 ? "s" : ""}`}
            </span>
          )}

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
                <EmptyState tab={activeTab} />
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
// --- END OF FILE src/pages/TournamentBrowserPage.tsx ---
