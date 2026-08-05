// Local persistence: username, stats, achievements, daily run

const USERNAME_KEY = "pookoo:username";
const STATS_KEY = "pookoo:stats";
const ACHIEVEMENTS_KEY = "pookoo:achievements";
const DAILY_KEY = "pookoo:daily";
const LAST_SUBMIT_KEY = "pookoo:lastSubmit";

export interface PlayerStats {
  personalBest: number;
  totalRuns: number;
  highestDistance: number;
  pookooRuns: number;
  javanRuns: number;
  totalTransformations: number;
}

export const DEFAULT_STATS: PlayerStats = {
  personalBest: 0,
  totalRuns: 0,
  highestDistance: 0,
  pookooRuns: 0,
  javanRuns: 0,
  totalTransformations: 0,
};

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_run", name: "First Steps", description: "Complete your first run", icon: "✦" },
  { id: "first_transform", name: "Metamorphosis", description: "Transform for the first time", icon: "◈" },
  { id: "score_1000", name: "Getting Started", description: "Reach 1,000 score", icon: "★" },
  { id: "score_5000", name: "On a Roll", description: "Reach 5,000 score", icon: "✸" },
  { id: "score_10000", name: "Pookoo Legend", description: "Reach 10,000 score", icon: "♛" },
  { id: "survivor", name: "Survivor", description: "Survive for 60 seconds", icon: "♢" },
  { id: "master_runner", name: "Master Runner", description: "Travel 5,000 meters in one run", icon: "❖" },
  { id: "daily_run", name: "Daily Devotion", description: "Complete a run today", icon: "☀" },
];

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function safeSet(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

export function getUsername(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(USERNAME_KEY) || "";
}
export function setUsername(name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USERNAME_KEY, name);
}

export function getStats(): PlayerStats {
  return { ...DEFAULT_STATS, ...safeGet<PlayerStats>(STATS_KEY, DEFAULT_STATS) };
}
export function getAchievements(): string[] {
  return safeGet<string[]>(ACHIEVEMENTS_KEY, []);
}

export interface RunResult {
  score: number;
  distance: number;
  time: number;
  character: "pookoo" | "javan";
  transformed: boolean;
}

export function recordRun(r: RunResult): { stats: PlayerStats; unlocked: Achievement[] } {
  const stats = getStats();
  stats.totalRuns += 1;
  stats.personalBest = Math.max(stats.personalBest, r.score);
  stats.highestDistance = Math.max(stats.highestDistance, r.distance);
  if (r.character === "javan") stats.javanRuns += 1; else stats.pookooRuns += 1;
  if (r.transformed) stats.totalTransformations += 1;
  safeSet(STATS_KEY, stats);

  const owned = new Set(getAchievements());
  const unlocked: Achievement[] = [];
  const grant = (id: string) => {
    if (!owned.has(id)) {
      owned.add(id);
      const a = ACHIEVEMENTS.find((x) => x.id === id);
      if (a) unlocked.push(a);
    }
  };
  grant("first_run");
  if (r.transformed) grant("first_transform");
  if (r.score >= 1000) grant("score_1000");
  if (r.score >= 5000) grant("score_5000");
  if (r.score >= 10000) grant("score_10000");
  if (r.time >= 60) grant("survivor");
  if (r.distance >= 5000) grant("master_runner");

  // Daily run
  const today = new Date().toISOString().slice(0, 10);
  const daily = safeGet<{ lastDay: string }>(DAILY_KEY, { lastDay: "" });
  if (daily.lastDay !== today) {
    safeSet(DAILY_KEY, { lastDay: today });
    grant("daily_run");
  }

  safeSet(ACHIEVEMENTS_KEY, Array.from(owned));
  return { stats, unlocked };
}

export function favoriteCharacter(stats: PlayerStats): "pookoo" | "javan" | "—" {
  if (stats.totalRuns === 0) return "—";
  return stats.javanRuns > stats.pookooRuns ? "javan" : "pookoo";
}

export function canSubmit(): boolean {
  if (typeof window === "undefined") return true;
  const last = parseInt(localStorage.getItem(LAST_SUBMIT_KEY) || "0", 10);
  return Date.now() - last > 4000; // 4s anti-spam
}
export function markSubmitted() {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_SUBMIT_KEY, String(Date.now()));
}

export function validateUsername(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = (raw || "").trim();
  if (trimmed.length < 3) return { ok: false, error: "Username must be at least 3 characters" };
  if (trimmed.length > 20) return { ok: false, error: "Username must be at most 20 characters" };
  if (!/^[\p{L}\p{N}_\- ]+$/u.test(trimmed)) return { ok: false, error: "Letters, numbers, spaces, _ and - only" };
  return { ok: true, value: trimmed };
}