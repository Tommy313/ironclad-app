/**
 * RAG Client — Next.js browser-side calls to your Railway backend
 * Add to: src/lib/rag-client.js
 */

const RAILWAY_URL = process.env.NEXT_PUBLIC_RAILWAY_URL;

if (!RAILWAY_URL && typeof window !== 'undefined') {
  console.warn('[RAG] NEXT_PUBLIC_RAILWAY_URL not set — AI features disabled');
}

/**
 * Ask Ironclad AI a question about your fleet data.
 * Returns { answer, sources, meta }
 */
export async function askIronclad(question, options = {}) {
  if (!RAILWAY_URL) {
    throw new Error('Railway backend not configured. Set NEXT_PUBLIC_RAILWAY_URL in .env.local');
  }

  const {
    threshold = 0.30,
    topK      = 15,
    tables    = null   // e.g. ['invoices', 'agreements']
  } = options;

  const response = await fetch(`${RAILWAY_URL}/query/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, threshold, topK, tables })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Query failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Semantic search across all Ironclad data (no LLM — just vector retrieval).
 * Faster than askIronclad, good for live search.
 */
export async function semanticSearch(query, options = {}) {
  if (!RAILWAY_URL) return { results: [] };

  const { threshold = 0.60, limit = 15 } = options;

  const response = await fetch(`${RAILWAY_URL}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, threshold, limit })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Search failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Send a newly saved invoice to Railway to be embedded and stored.
 * Call this in your IngestPanel.js after a user confirms a new invoice.
 */
export async function ingestInvoice(invoice, apiKey) {
  if (!RAILWAY_URL) {
    console.warn('[RAG] Skipping ingest — NEXT_PUBLIC_RAILWAY_URL not set');
    return null;
  }

  const response = await fetch(`${RAILWAY_URL}/ingest/invoice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify(invoice)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    console.error('[RAG] Ingest failed:', err.error);
    return null;
  }

  return response.json();
}

/**
 * Check if the Railway backend is reachable.
 */
export async function checkRAGHealth() {
  if (!RAILWAY_URL) return { ok: false, reason: 'RAILWAY_URL not configured' };

  try {
    const response = await fetch(`${RAILWAY_URL}/health`, { signal: AbortSignal.timeout(5000) });
    const data = await response.json();
    return { ok: response.ok, data };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}
