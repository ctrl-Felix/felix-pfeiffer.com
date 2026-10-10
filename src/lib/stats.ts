import { cacheLife } from "next/cache";
import { db } from "./db";

export type Period = "7d" | "30d" | "year" | "all";

export type Stats = {
  year: number;
  totals: Record<Period, number>;
  daily: { day: string; visitors: number }[];
  monthly: { month: string; visitors: number }[];
  clicks: { target: string; counts: Record<Period, number> }[];
  recent: { at: string; kind: string; target: string | null }[];
};

export async function getStats(): Promise<Stats | null> {
  "use cache";
  cacheLife({ revalidate: 60, expire: 300 });

  try {
    const pool = db();
    const [totals, daily, monthly, clicks, recent] = await Promise.all([
      pool.query(`
        select
          count(*) filter (where day >= (now() at time zone 'utc')::date - 6)::int as d7,
          count(*) filter (where day >= (now() at time zone 'utc')::date - 29)::int as d30,
          count(*) filter (where day >= date_trunc('year', (now() at time zone 'utc')::date::timestamp)::date)::int as year,
          count(*)::int as all_time
        from events where kind = 'visit'`),
      pool.query(`
        select to_char(d, 'YYYY-MM-DD') as day, count(e.id)::int as visitors
        from generate_series((now() at time zone 'utc')::date - 29, (now() at time zone 'utc')::date, interval '1 day') d
        left join events e on e.kind = 'visit' and e.day = d::date
        group by d order by d`),
      pool.query(`
        select to_char(m, 'YYYY-MM') as month, count(e.id)::int as visitors
        from generate_series(
          (select date_trunc('month', coalesce(min(day), (now() at time zone 'utc')::date)::timestamp) from events where kind = 'visit'),
          date_trunc('month', (now() at time zone 'utc')::date::timestamp),
          interval '1 month') m
        left join events e on e.kind = 'visit' and date_trunc('month', e.day::timestamp) = m
        group by m order by m`),
      pool.query(`
        select target,
          count(*) filter (where day >= (now() at time zone 'utc')::date - 6)::int as d7,
          count(*) filter (where day >= (now() at time zone 'utc')::date - 29)::int as d30,
          count(*) filter (where day >= date_trunc('year', (now() at time zone 'utc')::date::timestamp)::date)::int as year,
          count(*)::int as all_time
        from events where kind = 'click' group by target order by all_time desc`),
      pool.query(`
        select to_char(occurred_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as at, kind, target
        from events order by id desc limit 15`),
    ]);
    const row = totals.rows[0];
    return {
      year: new Date().getUTCFullYear(),
      totals: { "7d": row.d7, "30d": row.d30, year: row.year, all: row.all_time },
      daily: daily.rows,
      monthly: monthly.rows,
      clicks: clicks.rows.map((click) => ({
        target: click.target,
        counts: { "7d": click.d7, "30d": click.d30, year: click.year, all: click.all_time },
      })),
      recent: recent.rows,
    };
  } catch {
    return null;
  }
}
