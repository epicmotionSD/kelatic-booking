// lotto-fetch-draws — pulls the latest Powerball + Mega Millions results from
// NY Open Data and inserts them. The lotto_draws trigger does all the matching.
// Idempotent: UNIQUE(game, draw_date) + ignoreDuplicates means re-runs are no-ops.
// Called by pg_cron via pg_net (x-lotto-secret). `?dry=1` parses without inserting.
import { admin, isInternalCaller, json } from "../_shared/lotto.ts";

type Game = "powerball" | "megamillions";

const FEEDS: Record<Game, { url: string; maxWhite: number }> = {
  powerball: {
    // Lottery Powerball Winning Numbers: Beginning 2010
    url: "https://data.ny.gov/resource/d6yy-54nr.json?$order=draw_date%20DESC&$limit=5",
    maxWhite: 69,
  },
  megamillions: {
    // Lottery Mega Millions Winning Numbers: Beginning 2002
    url: "https://data.ny.gov/resource/5xaw-6ayf.json?$order=draw_date%20DESC&$limit=5",
    maxWhite: 70,
  },
};

type Row = { draw_date?: string; winning_numbers?: string; mega_ball?: string };

function parse(game: Game, row: Row) {
  if (!row.draw_date || !row.winning_numbers) return null;
  const nums = row.winning_numbers.trim().split(/\s+/).map(Number);
  // Powerball feed: "w1 w2 w3 w4 w5 PB". Mega Millions feed: 5 whites + separate mega_ball.
  const white = nums.slice(0, 5).sort((a, b) => a - b);
  const special = game === "megamillions" && row.mega_ball != null
    ? Number(row.mega_ball)
    : (nums[5] ?? null);

  const max = FEEDS[game].maxWhite;
  const valid = white.length === 5 &&
    new Set(white).size === 5 &&
    white.every((n) => Number.isInteger(n) && n >= 1 && n <= max);
  if (!valid) return null;

  return {
    game,
    draw_date: row.draw_date.slice(0, 10),
    white_balls: white,
    special_ball: Number.isInteger(special) ? special : null,
  };
}

Deno.serve(async (req) => {
  if (!(await isInternalCaller(req))) return json({ error: "unauthorized" }, 401);
  const dry = new URL(req.url).searchParams.get("dry") === "1";

  const report: Record<string, unknown> = {};
  for (const game of Object.keys(FEEDS) as Game[]) {
    try {
      const res = await fetch(FEEDS[game].url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`feed ${res.status}`);
      const rows = (await res.json()) as Row[];
      const draws = rows.map((r) => parse(game, r)).filter(Boolean)
        // oldest first so cumulative matching happens in draw order
        .sort((a, b) => a!.draw_date.localeCompare(b!.draw_date));

      if (dry) {
        report[game] = { parsed: draws };
        continue;
      }

      let inserted = 0;
      for (const d of draws) {
        const { data, error } = await admin
          .from("lotto_draws")
          .upsert(d!, { onConflict: "game,draw_date", ignoreDuplicates: true })
          .select("id");
        if (error) throw error;
        inserted += data?.length ?? 0;
      }
      report[game] = { seen: draws.length, inserted };
    } catch (e) {
      report[game] = { error: String(e) };
    }
  }
  return json({ ok: true, dry, report });
});
