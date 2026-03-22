import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import type { TournamentStatus, GameResult } from "../types";

/* ─── Tailwind class merge helper ────────────────────────── */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ─── Date formatting ────────────────────────────────────── */
export function formatDate(isoString: string): string {
  try {
    return format(parseISO(isoString), "dd MMM yyyy");
  } catch {
    return isoString;
  }
}

export function formatDateTime(isoString: string): string {
  try {
    return format(parseISO(isoString), "dd MMM yyyy, HH:mm");
  } catch {
    return isoString;
  }
}

/* ─── Currency formatting ────────────────────────────────── */
export function formatEntryFee(amount: number): string {
  if (amount === 0) return "Free";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/* ─── Status badge class helper ──────────────────────────── */
export function statusClass(status: TournamentStatus): string {
  const map: Record<TournamentStatus, string> = {
    UPCOMING: "upcoming",
    ONGOING: "ongoing",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
  };
  return map[status] ?? "completed";
}

/* ─── Game result label ───────────────────────────────────── */
export function resultLabel(result: GameResult): string {
  const map: Record<GameResult, string> = {
    PENDING: "Pending",
    WHITE_WINS: "White wins",
    BLACK_WINS: "Black wins",
    DRAW: "Draw",
    BYE: "Bye",
  };
  return map[result] ?? result;
}

/* ─── Truncate text ──────────────────────────────────────── */
export function truncate(str: string, maxLen = 80): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

/* ─── Initials from name ─────────────────────────────────── */
export function initials(name: string): string {
  return name
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/* ─── Score display (1, 0.5, 0) ─────────────────────────── */
export function formatScore(score: number): string {
  // Render .5 scores as fractions for a chess-native feel
  const int = Math.floor(score);
  const half = score % 1 !== 0;
  if (int === 0 && half) return "½";
  if (half) return `${int}½`;
  return String(int);
}
