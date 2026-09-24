// Shared storage for the Weekly Achievement & Incentive tool (Vercel + Neon).
// Needs the env var DATABASE_URL (exact name) pointing at your Neon database.
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
let ready = false;
async function ensure() {
  if (ready) return;
  await sql`create table if not exists mip_store (
    col text not null, id text not null, data jsonb not null,
    updated_at timestamptz not null default now(), primary key (col, id))`;
  ready = true;
}
const OK_COLS = new Set(['app', 'entries', 'incentives']);
export default async function handler(req, res) {
  try {
    await ensure();
    const q = req.query || {};
    if (req.method === 'GET') {
      if (!OK_COLS.has(q.col)) return res.status(400).json({ error: 'unknown collection' });
      if (q.id) {
        const r = await sql`select data from mip_store where col = ${q.col} and id = ${q.id}`;
        return res.status(200).json({ data: r[0] ? r[0].data : null });
      }
      const r = await sql`select id, data from mip_store where col = ${q.col}`;
      return res.status(200).json({ docs: r });
    }
    if (req.method === 'PUT' || req.method === 'POST') {
      const { col, id, data } = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      if (!OK_COLS.has(col) || !id || typeof data !== 'object') return res.status(400).json({ error: 'col, id and data required' });
      await sql`insert into mip_store (col, id, data, updated_at) values (${col}, ${id}, ${JSON.stringify(data)}::jsonb, now())
        on conflict (col, id) do update set data = excluded.data, updated_at = now()`;
      return res.status(200).json({ ok: true });
    }
    if (req.method === 'DELETE') {
      if (!OK_COLS.has(q.col) || !q.id) return res.status(400).json({ error: 'col and id required' });
      await sql`delete from mip_store where col = ${q.col} and id = ${q.id}`;
      return res.status(200).json({ ok: true });
    }
    res.setHeader('Allow', 'GET, PUT, DELETE');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
