import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import type { TournamentStatus, GameResult } from "../types";

/* ─── Tailwind class merge helper ────────────────────────── */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
/* ─── Date & Timezone handling ───────────────────────────── */

// Safely forces the string to be treated as UTC by appending 'Z'
function ensureUtc(isoString: string): string {
  if (!isoString) return "";
  // If it already contains timezone info (+, -, or Z), leave it alone.
  if (/(Z|[+-]\d{2}:\d{2})$/.test(isoString)) {
    return isoString;
  }
  return `${isoString}Z`;
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(ensureUtc(isoString));
    if (isNaN(date.getTime())) return isoString;
    return format(date, "dd MMM yyyy");
  } catch {
    return isoString;
  }
}

// Displays backend UTC time as User's Local Time
export function formatDateTime(isoString: string): string {
  try {
    const date = new Date(ensureUtc(isoString));
    if (isNaN(date.getTime())) return isoString;
    return format(date, "dd MMM yyyy, HH:mm");
  } catch {
    return isoString;
  }
}

// Converts backend UTC time to User's Local Time for the HTML <input type="datetime-local">
export function toLocalInputFormat(utcString: string): string {
  if (!utcString) return "";
  try {
    const date = new Date(ensureUtc(utcString));
    if (isNaN(date.getTime())) return utcString;

    // We must format it exactly as YYYY-MM-DDTHH:mm in local time for the input field
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const h = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${d}T${h}:${min}`;
  } catch {
    return utcString;
  }
}

// Converts Local time from HTML <input> to UTC for the Spring Boot backend
export function toUtcIsoString(localInputString: string): string {
  if (!localInputString) return "";
  try {
    const date = new Date(localInputString); // Browser parses this as local time
    // Returns UTC string and strips the .000Z to match Spring Boot's LocalDateTime
    return date.toISOString().split(".")[0];
  } catch {
    return localInputString;
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
