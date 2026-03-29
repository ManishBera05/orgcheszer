// --- START OF FILE src/pages/LeaderboardPage.tsx ---
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BarChart2, RefreshCw, Loader2 } from "lucide-react";
import { getLeaderboard } from "../api/matchmaking";
import { getTournament } from "../api/tournaments";
import { formatScore } from "../lib/utils";
import type { LeaderboardEntryDTO, TournamentFormat } from "../types";

const PAGE_SIZE = 50;

interface ColDef {
  key: keyof LeaderboardEntryDTO;
  label: string;
  title: string;
  width?: string;
}

// FORMAT SPECIFIC COLUMNS EXACTLY AS REQUESTED
const RR_COLS: ColDef[] = [
  { key: "score", label: "Score", title: "Total points (W=1, D=½)" },
  { key: "directEncounterScore", label: "DE", title: "Direct Encounter" },
  {
    key: "sonnebornBerger",
    label: "SB",
    title: "Sonneborn-Berger: sum of defeated opponents' scores + ½ drawn",
  },
  { key: "numberOfWins", label: "Wins", title: "Number of victories" },
  { key: "winsWithBlack", label: "W/B", title: "Number of wins with Black" },
  { key: "totalGamesPlayed", label: "Games", title: "Total games played" },
];

const SWISS_COLS: ColDef[] = [
  { key: "score", label: "Score", title: "Total points (W=1, D=½, Bye=1)" },
  { key: "buchholzCut1", label: "BH-1", title: "Buchholz Cut 1" },
  { key: "buchholzCut2", label: "BH-2", title: "Buchholz Cut 2" },
  { key: "sonnebornBerger", label: "SB", title: "Sonneborn Berger" },
  { key: "buchholzMedian", label: "BH-M", title: "Buchholz Median" },
  { key: "totalGamesPlayed", label: "Games", title: "Total games played" },
];

function getCols(format?: TournamentFormat | string): ColDef[] {
  return format === "ROUND_ROBIN" ? RR_COLS : SWISS_COLS;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const medals = ["🥇", "🥈", "🥉"];
    return (
      <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>
        {medals[rank - 1]}
      </span>
    );
  }
  return (
    <span
      style={{
        fontSize: "0.8125rem",
        fontWeight: 600,
        color: "var(--text-muted)",
        fontVariantNumeric: "tabular-nums",
        minWidth: "24px",
        display: "inline-block",
        textAlign: "right",
      }}
    >
      {rank}
    </span>
  );
}

function ScoreCell({ v }: { v: number }) {
  return (
    <span
      style={{
        fontSize: "0.9375rem",
        fontWeight: 700,
        color: "var(--accent-cta)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {formatScore(v)}
    </span>
  );
}
function TbCell({ v }: { v: number }) {
  return (
    <span
      style={{
        fontSize: "0.8125rem",
        color: "var(--text-muted)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {(v || 0).toFixed(1)}
    </span>
  );
}
function IntCell({ v }: { v: number }) {
  return (
    <span
      style={{
        fontSize: "0.8125rem",
        color: "var(--text-secondary)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {v || 0}
    </span>
  );
}

function renderCell(
  key: keyof LeaderboardEntryDTO,
  entry: LeaderboardEntryDTO,
) {
  if (key === "score") return <ScoreCell v={entry.score} />;
  if (
    [
      "buchholz",
      "buchholzCut1",
      "buchholzCut2",
      "buchholzMedian",
      "sonnebornBerger",
      "directEncounterScore",
    ].includes(key)
  )
    return <TbCell v={entry[key] as number} />;
  return <IntCell v={entry[key] as number} />;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td style={{ padding: "0.75rem 1rem" }}>
        <div className="skeleton" style={{ height: "14px", width: "24px" }} />
      </td>
      <td style={{ padding: "0.75rem 1rem" }}>
        <div className="skeleton" style={{ height: "14px", width: "140px" }} />
      </td>
      {Array.from({ length: cols }, (_, i) => (
        <td key={i} style={{ padding: "0.75rem 1rem" }}>
          <div
            className="skeleton"
            style={{ height: "14px", width: "40px", marginLeft: "auto" }}
          />
        </td>
      ))}
    </tr>
  );
}

export default function LeaderboardPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<LeaderboardEntryDTO[]>([]);

  const { data: tournament } = useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: () => getTournament(tournamentId!),
    enabled: !!tournamentId,
    staleTime: 60_000,
  });

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["leaderboard", tournamentId, page],
    queryFn: () => getLeaderboard(tournamentId!, page, PAGE_SIZE),
    enabled: !!tournamentId,
    staleTime: 30_000,
    refetchInterval: tournament?.status === "ONGOING" ? 30_000 : false,
  });

  useEffect(() => {
    if (!data) return;
    if (page === 0) setRows(data.content);
    else setRows((p) => [...p, ...data.content]);
  }, [data]);

  useEffect(() => {
    if (data && !data.last) {
      queryClient.prefetchQuery({
        queryKey: ["leaderboard", tournamentId, page + 1],
        queryFn: () => getLeaderboard(tournamentId!, page + 1, PAGE_SIZE),
        staleTime: 30_000,
      });
    }
  }, [data, page]);

  const cols = getCols(tournament?.format);
  const isLive = tournament?.status === "ONGOING";

  return (
    <>
      <style>{`
        @keyframes lb-fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lb-rowIn  { from{opacity:0} to{opacity:1} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes tc-pulse  { 0%,100%{opacity:1}50%{opacity:0.35} }

        .lb-page { max-width: 1100px; margin: 0 auto; padding: 2.5rem 1.5rem 5rem; animation: lb-fadeIn 300ms ease forwards; }
        .lb-wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: 14px; background: var(--bg-surface); }
        .lb-table { width: 100%; border-collapse: collapse; min-width: 600px; }
        .lb-table thead th { padding: 0.7rem 1rem; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid var(--border); background: var(--bg-elevated); white-space: nowrap; }
        .lb-table thead th.right { text-align: right; }
        .lb-table thead th.left  { text-align: left;  }
        .lb-table tbody tr { animation: lb-rowIn 250ms ease forwards; opacity: 0; transition: background 120ms ease; border-bottom: 1px solid var(--border-subtle); }
        .lb-table tbody tr:hover { background: var(--bg-elevated); }
        .lb-table tbody tr:last-child { border-bottom: none; }
        .lb-table td { padding: 0.7rem 1rem; vertical-align: middle; }
        .lb-table td.right { text-align: right; }

        .lb-player-link { color: var(--text-primary); text-decoration: none; font-weight: 500; font-size: 0.9rem; transition: color 150ms ease; }
        .lb-player-link:hover { color: var(--accent-cta); text-decoration: underline; }

        .lb-load-more { display: flex; flex-direction: column; align-items: center; gap: 0.625rem; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border-subtle); }
        .lb-btn-more { display: flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1.5rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-surface); color: var(--text-secondary); font-size: 0.9375rem; font-weight: 500; cursor: pointer; transition: border-color 150ms ease, color 150ms ease; }
        .lb-btn-more:hover  { border-color: var(--accent-cta); color: var(--accent-cta); }
        .lb-btn-more:disabled { opacity: 0.5; cursor: not-allowed; }

        @media (max-width: 540px) { .lb-page { padding: 1.5rem 0.75rem 4rem; } }
      `}</style>

      <div className="lb-page">
        <Link
          to={`/tournaments/${tournamentId}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            color: "var(--text-muted)",
            fontSize: "0.875rem",
            textDecoration: "none",
            marginBottom: "1.5rem",
          }}
        >
          <ArrowLeft size={15} /> Back to tournament
        </Link>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
            marginBottom: "1.25rem",
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
              <BarChart2 size={20} style={{ color: "var(--accent-cta)" }} />
              <h1
                style={{
                  fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.03em",
                  margin: 0,
                }}
              >
                Leaderboard
              </h1>
              {isLive && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--success)",
                    padding: "0.2rem 0.6rem",
                    background: "rgba(74,158,107,0.12)",
                    border: "1px solid rgba(74,158,107,0.25)",
                    borderRadius: "99px",
                  }}
                >
                  <span
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: "var(--success)",
                      display: "inline-block",
                      animation: "tc-pulse 1.5s ease-in-out infinite",
                    }}
                  />
                  Live
                </span>
              )}
            </div>
            {tournament && (
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.9375rem",
                  margin: 0,
                }}
              >
                {tournament.tournamentName} ·{" "}
                {tournament.format.replace("_", " ")} · {rows.length}
                {data && !data.last ? ` of ${data.totalElements}` : ""} player
                {rows.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              setPage(0);
              setRows([]);
              setTimeout(() => refetch(), 50);
            }}
            disabled={isFetching}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.5rem 0.875rem",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              background: "transparent",
              color: "var(--text-muted)",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            <RefreshCw
              size={14}
              style={{
                animation: isFetching ? "spin 0.7s linear infinite" : "none",
              }}
            />{" "}
            Refresh
          </button>
        </div>

        <div className="lb-wrap">
          <table className="lb-table">
            <thead>
              <tr>
                <th
                  className="left"
                  style={{ width: "48px", paddingLeft: "1rem" }}
                >
                  #
                </th>
                <th className="left">Player</th>
                {cols.map((c) => (
                  <th key={c.key} className="right" title={c.title}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && page === 0 ? (
                Array.from({ length: 10 }, (_, i) => (
                  <SkeletonRow key={i} cols={cols.length} />
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={2 + cols.length}
                    style={{
                      padding: "4rem 1.5rem",
                      textAlign: "center",
                      color: "var(--text-muted)",
                    }}
                  >
                    <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>
                      ♟
                    </div>
                    <p
                      style={{
                        fontWeight: 500,
                        color: "var(--text-secondary)",
                        marginBottom: "0.25rem",
                      }}
                    >
                      No results yet
                    </p>
                    <p style={{ fontSize: "0.875rem" }}>
                      Standings will appear once games are played.
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((entry, i) => (
                  <tr
                    key={entry.playerID}
                    style={{ animationDelay: `${(i % PAGE_SIZE) * 18}ms` }}
                  >
                    <td style={{ paddingLeft: "1rem" }}>
                      <RankBadge rank={entry.rank} />
                    </td>
                    <td>
                      <Link
                        to={`/users/${entry.playerID}`}
                        className="lb-player-link"
                      >
                        {entry.playerName}
                      </Link>
                      {(entry.fideId || entry.eloRating > 0) && (
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            marginTop: "1px",
                          }}
                        >
                          {entry.fideId && (
                            <span
                              style={{
                                fontSize: "0.6875rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              FIDE {entry.fideId}
                            </span>
                          )}
                          {entry.eloRating > 0 && (
                            <span
                              style={{
                                fontSize: "0.6875rem",
                                color: "var(--camel-600)",
                              }}
                            >
                              {entry.eloRating}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    {cols.map((c) => (
                      <td key={c.key} className="right">
                        {renderCell(c.key, entry)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && !data.last && rows.length > 0 && (
          <div className="lb-load-more">
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Showing {rows.length} of {data.totalElements} players
            </p>
            <button
              className="lb-btn-more"
              disabled={isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              {isFetching ? (
                <>
                  <Loader2
                    size={14}
                    style={{ animation: "spin 0.7s linear infinite" }}
                  />
                  Loading…
                </>
              ) : (
                "Load more players"
              )}
            </button>
          </div>
        )}

        {isLive && (
          <p
            style={{
              textAlign: "center",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginTop: "1.5rem",
            }}
          >
            ↻ Auto-refreshes every 30 seconds while the tournament is live
          </p>
        )}
      </div>
    </>
  );
}
// --- END OF FILE src/pages/LeaderboardPage.tsx ---
