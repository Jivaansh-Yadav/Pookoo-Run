import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getLeaderboard, type LeaderboardRow } from "@/lib/leaderboard.functions";
import {
  getStats, getAchievements, ACHIEVEMENTS, favoriteCharacter, getUsername,
} from "@/lib/playerStats";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Pookoo Run" },
      { name: "description", content: "Top runners in the magical world of Pookoo Run. Compete for the top spot." },
      { property: "og:title", content: "Leaderboard — Pookoo Run" },
      { property: "og:description", content: "Top runners in the magical world of Pookoo Run." },
    ],
  }),
  component: LeaderboardPage,
});

type Row = LeaderboardRow;

type Status = "loading" | "ok" | "empty" | "error";

function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string>("");
  const username = useMemo(() => getUsername(), []);

  const load = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const data = await getLeaderboard();
      if (!data || data.length === 0) { setRows([]); setStatus("empty"); return; }
      setRows(data);
      setStatus("ok");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => getStats(), []);
  const unlocked = useMemo(() => new Set(getAchievements()), []);

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="min-h-screen bg-hero relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full blur-3xl opacity-30 bg-aurora animate-float-slow" />
        <div className="absolute top-1/3 -right-24 w-[460px] h-[460px] rounded-full blur-3xl opacity-25 bg-ember animate-float-slow" style={{ animationDelay: "1.5s" }} />
      </div>

      <header className="relative z-10 max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-aurora glow-accent flex items-center justify-center text-lg">✦</div>
          <span className="font-bold tracking-wide">POOKOO RUN</span>
        </Link>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition">← Home</Link>
      </header>

      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-6 pb-12 text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-accent mb-3">Hall of legends</div>
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-aurora mb-3">Leaderboard</h1>
        <p className="text-muted-foreground">Top 100 runners across the world.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={load}
            disabled={status === "loading"}
            className="px-5 py-2 rounded-full glass border border-border hover:border-primary/60 transition text-sm font-semibold disabled:opacity-50"
          >
            {status === "loading" ? "Refreshing…" : "↻ Refresh"}
          </button>
          <Link
            to="/"
            className="px-5 py-2 rounded-full bg-ember text-primary-foreground text-sm font-semibold hover:scale-105 transition-transform glow-primary"
          >
            Play Now →
          </Link>
        </div>
      </section>

      {/* Player Profile Summary */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-10">
        <div className="glass rounded-2xl border border-border p-5 sm:p-7 shadow-card">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Your profile</div>
              <div className="text-2xl font-bold">{username || "Anonymous Runner"}</div>
            </div>
            <div className="text-xs text-muted-foreground">Stored locally on this device</div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <ProfileStat label="Personal Best" value={stats.personalBest.toLocaleString()} accent />
            <ProfileStat label="Total Runs" value={stats.totalRuns.toLocaleString()} />
            <ProfileStat label="Highest Distance" value={`${stats.highestDistance}m`} />
            <ProfileStat label="Favorite" value={favoriteCharacter(stats).toUpperCase()} />
          </div>

          {/* Achievements */}
          <div className="mt-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Achievements ({unlocked.size}/{ACHIEVEMENTS.length})</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ACHIEVEMENTS.map((a) => {
                const got = unlocked.has(a.id);
                return (
                  <div
                    key={a.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition ${
                      got ? "border-accent/60 bg-accent/5 glow-accent" : "border-border opacity-50"
                    }`}
                    title={a.description}
                  >
                    <div className={`text-xl ${got ? "text-aurora" : ""}`}>{a.icon}</div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">{a.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{a.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Podium */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-10">
        {status === "loading" && <SkeletonPodium />}
        {status === "error" && (
          <div className="glass rounded-2xl border border-destructive/50 p-8 text-center">
            <div className="text-destructive font-semibold mb-2">Could not load leaderboard</div>
            <div className="text-sm text-muted-foreground mb-4">{error}</div>
            <button onClick={load} className="px-4 py-2 rounded-lg bg-ember text-primary-foreground font-semibold">Retry</button>
          </div>
        )}
        {status === "empty" && (
          <div className="glass rounded-2xl border border-border p-10 text-center">
            <div className="text-5xl mb-3 text-aurora">✦</div>
            <div className="text-xl font-bold mb-1">No legends yet</div>
            <div className="text-sm text-muted-foreground mb-5">Be the first to claim a spot.</div>
            <Link to="/" className="inline-block px-6 py-3 rounded-full bg-ember text-primary-foreground font-bold glow-primary">Start a Run</Link>
          </div>
        )}
        {status === "ok" && podium.length > 0 && <Podium rows={podium} highlight={username} />}
      </section>

      {/* Table */}
      {status === "ok" && (
        <section className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
          <div className="glass rounded-2xl border border-border shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="font-bold">All Rankings</div>
              <div className="text-xs text-muted-foreground">{rows.length} runners</div>
            </div>
            <div className="max-h-[560px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card/95 backdrop-blur border-b border-border">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 w-16">Rank</th>
                    <th className="px-4 py-3">Player</th>
                    <th className="px-4 py-3 text-right">Score</th>
                    <th className="px-4 py-3 text-right hidden sm:table-cell">Distance</th>
                    <th className="px-4 py-3 text-right hidden md:table-cell">Time</th>
                    <th className="px-4 py-3 text-right hidden sm:table-cell">Char</th>
                  </tr>
                </thead>
                <tbody>
                  {rest.map((r, i) => {
                    const rank = i + 4;
                    const me = username && r.username.toLowerCase() === username.toLowerCase();
                    return (
                      <tr
                        key={r.id}
                        className={`border-b border-border/50 transition hover:bg-card/60 ${me ? "bg-accent/10" : ""}`}
                      >
                        <td className="px-4 py-3 font-bold text-muted-foreground">#{rank}</td>
                        <td className="px-4 py-3 font-semibold truncate max-w-[200px]">
                          {r.username}
                          {me && <span className="ml-2 text-[10px] uppercase tracking-wider text-accent">You</span>}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-aurora">{r.score.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">{r.distance}m</td>
                        <td className="px-4 py-3 text-right hidden md:table-cell">{r.survival_time}s</td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            r.character_used === "javan" ? "border-primary/60 text-primary" : "border-accent/60 text-accent"
                          }`}>{r.character_used}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {rest.length === 0 && (
                    <tr><td colSpan={6} className="text-center text-muted-foreground py-8 text-sm">Only the podium so far. Keep playing!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function ProfileStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="p-3 rounded-xl bg-card/60 border border-border">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-xl font-bold ${accent ? "text-aurora" : ""}`}>{value}</div>
    </div>
  );
}

function SkeletonPodium() {
  return (
    <div className="grid grid-cols-3 gap-3 max-w-3xl mx-auto items-end">
      {[120, 170, 100].map((h, i) => (
        <div key={i} className="glass border border-border rounded-2xl p-4 animate-pulse" style={{ height: h }} />
      ))}
    </div>
  );
}

function Podium({ rows, highlight }: { rows: Row[]; highlight: string }) {
  // order: 2nd, 1st, 3rd
  const order = [rows[1], rows[0], rows[2]].filter(Boolean);
  const meta = [
    { rank: 2, h: "h-56", medal: "🥈", glow: "" },
    { rank: 1, h: "h-72", medal: "🥇", glow: "glow-primary animate-pulse-glow" },
    { rank: 3, h: "h-48", medal: "🥉", glow: "" },
  ].slice(0, order.length);
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-5 max-w-4xl mx-auto items-end">
      {order.map((r, i) => {
        const m = meta[i];
        const me = highlight && r.username.toLowerCase() === highlight.toLowerCase();
        return (
          <div
            key={r.id}
            className={`relative ${m.h} rounded-2xl glass border ${m.rank === 1 ? "border-primary/70" : "border-border"} ${m.glow} p-4 flex flex-col items-center justify-end text-center transition hover:-translate-y-1`}
          >
            <div className={`absolute -top-7 text-5xl ${m.rank === 1 ? "animate-float-slow" : ""}`}>{m.medal}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">#{m.rank}</div>
            <div className={`mt-1 font-bold truncate w-full ${m.rank === 1 ? "text-xl" : "text-base"}`}>
              {r.username}{me && <span className="ml-1 text-[10px] text-accent">YOU</span>}
            </div>
            <div className={`font-black ${m.rank === 1 ? "text-3xl" : "text-xl"} text-aurora my-1`}>
              {r.score.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">{r.distance}m · {r.character_used}</div>
          </div>
        );
      })}
    </div>
  );
}