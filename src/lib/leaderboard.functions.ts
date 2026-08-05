import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface LeaderboardRow {
  id: string;
  username: string;
  score: number;
  distance: number;
  survival_time: number;
  character_used: string;
}

const submitSchema = z.object({
  username: z.string().trim().min(3).max(20),
  score: z.number().int().min(0).max(10_000_000),
  distance: z.number().int().min(0).max(10_000_000),
  survival_time: z.number().int().min(0).max(1_000_000),
  character: z.enum(["pookoo", "javan"]).catch("pookoo"),
});

export const getLeaderboard = createServerFn({ method: "GET" }).handler(
  async (): Promise<LeaderboardRow[]> => {
    const { getSql } = await import("./db.server");
    const sql = getSql();
    const rows = await sql`
      SELECT id, username, score, distance, survival_time, character_used
      FROM leaderboard
      ORDER BY score DESC
      LIMIT 100
    `;
    return rows as LeaderboardRow[];
  },
);

export const submitScore = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => submitSchema.parse(input))
  .handler(async ({ data }) => {
    const { getSql } = await import("./db.server");
    const sql = getSql();
    const key = data.username.toLowerCase();
    const rows = await sql`
      INSERT INTO leaderboard (username, username_key, score, distance, survival_time, character_used)
      VALUES (${data.username}, ${key}, ${data.score}, ${data.distance}, ${data.survival_time}, ${data.character})
      ON CONFLICT (username_key) DO UPDATE SET
        username = EXCLUDED.username,
        score = EXCLUDED.score,
        distance = EXCLUDED.distance,
        survival_time = EXCLUDED.survival_time,
        character_used = EXCLUDED.character_used,
        updated_at = now()
      WHERE EXCLUDED.score > leaderboard.score
      RETURNING id, username, score
    `;
    return { updated: rows.length > 0 };
  });
