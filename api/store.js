// Shared storage for the Weekly Achievement & Incentive tool (Vercel + Supabase).
// Env vars (Vercel): SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Server-side only; never put the key in index.html.
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});
const TABLE = 'mip_store';
const OK_COLS = new Set(['app', 'entries', 'incentives', 'meetings', 'dept']);

export default async function handler(req, res) {
  try {
    const q = req.query || {};
    if (req.method === 'GET') {
      if (!OK_COLS.has(q.col)) return res.status(400).json({ error: 'unknown collection' });
      if (q.id) {
        const { data, error } = await supabase.from(TABLE).select('data').eq('col', q.col).eq('id', q.id).maybeSingle();
        if (error) throw error;
        return res.status(200).json({ data: data ? data.data : null });
      }
      const { data, error } = await supabase.from(TABLE).select('id, data').eq('col', q.col);
      if (error) throw error;
      return res.status(200).json({ docs: data || [] });
    }
    if (req.method === 'PUT' || req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { col, id, data } = body;
      if (!OK_COLS.has(col) || !id || typeof data !== 'object') return res.status(400).json({ error: 'col, id and data required' });
      const { error } = await supabase.from(TABLE)
        .upsert({ col, id, data, updated_at: new Date().toISOString() }, { onConflict: 'col,id' });
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    if (req.method === 'DELETE') {
      if (!OK_COLS.has(q.col) || !q.id) return res.status(400).json({ error: 'col and id required' });
      const { error } = await supabase.from(TABLE).delete().eq('col', q.col).eq('id', q.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.setHeader('Allow', 'GET, PUT, DELETE');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) });
  }
}
