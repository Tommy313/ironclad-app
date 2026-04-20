/**
 * Ironclad Fleet Intelligence — Supabase data layer
 * Client-scoped queries for invoices, transactions, and clients.
 *
 * Requires in .env.local (and Railway env vars):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * Falls back to null client (localStorage mode) if env vars are absent.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Graceful: if not configured, data functions return empty arrays
// and the app falls back to localStorage. Remove fallback once migrated.
export const supabase = (supabaseUrl && supabaseAnon)
  ? createClient(supabaseUrl, supabaseAnon)
  : null;

export const isSupabaseConfigured = () => !!supabase;


// ─── Field mapping: DB ↔ Frontend ─────────────────────────────────────────────
// DB uses snake_case totals (labor_total). Frontend engine uses short names (labor).
// All mapping lives here so nothing else needs to know about the difference.

export function fromDbInvoice(row) {
  if (!row) return null;
  return {
    id:               row.id,
    date:             row.date,
    workDates:        row.work_dates       || '',
    equipment:        row.equipment        || '',
    sn:               row.serial_number    || '',
    unitId:           row.unit_id          || '',
    meter:            row.meter_hours      || 0,
    site:             row.site             || '',
    region:           row.region           || '',
    category:         row.category         || '',
    description:      row.description      || '',
    vendor:           row.vendor           || '',
    agreement:        row.agreement_status || 'none',
    techs:            row.techs            || [],
    visits:           row.visits           || 1,
    parts:            parseFloat(row.parts_total)  || 0,
    labor:            parseFloat(row.labor_total)  || 0,
    misc:             parseFloat(row.misc_total)   || 0,
    partsDetail:      row.parts_detail     || [],
    flags:            row.flags            || [],
    flagNotes:        row.flag_notes       || '',
    expectedHoursLow:  row.expected_hours_low  || 0,
    expectedHoursHigh: row.expected_hours_high || 0,
    vendorType:       row.vendor_type      || 'unknown',
    client:           row.client           || 'Ferrous',
    ingested:         row.created_at       || null,
  };
}

export function toDbInvoice(inv) {
  return {
    id:                inv.id,
    date:              inv.date,
    work_dates:        inv.workDates        || null,
    equipment:         inv.equipment        || null,
    serial_number:     inv.sn               || null,
    unit_id:           inv.unitId           || null,
    meter_hours:       inv.meter            ? Math.round(inv.meter) : null,
    site:              inv.site             || null,
    region:            inv.region           || null,
    category:          inv.category         || null,
    description:       inv.description      || null,
    vendor:            inv.vendor           || null,
    agreement_status:  inv.agreement        || 'none',
    techs:             inv.techs            || [],
    visits:            inv.visits           || 1,
    parts_total:       parseFloat(inv.parts)  || 0,
    labor_total:       parseFloat(inv.labor)  || 0,
    misc_total:        parseFloat(inv.misc)   || 0,
    parts_detail:      inv.partsDetail      || [],
    flags:             inv.flags            || [],
    flag_notes:        inv.flagNotes        || null,
    expected_hours_low:  inv.expectedHoursLow  || null,
    expected_hours_high: inv.expectedHoursHigh || null,
    vendor_type:       inv.vendorType       || null,
    client:            inv.client           || 'Ferrous',
  };
}

export function fromDbTransaction(row) {
  if (!row) return null;
  return {
    id:          row.id,
    date:        row.date,
    type:        row.type,
    equipment:   row.equipment,
    quantity:    row.quantity    || 1,
    unitPrice:   parseFloat(row.unit_price)   || 0,
    totalPrice:  parseFloat(row.total_price)  || 0,
    marketValue: parseFloat(row.market_value) || null,
    marketTotal: parseFloat(row.market_total) || null,
    spread:      parseFloat(row.spread)       || null,
    spreadPct:   parseFloat(row.spread_pct)   || null,
    category:    row.category,
    tags:        row.tags    || [],
    notes:       row.notes   || '',
    buyer:       row.buyer   || null,
    seller:      row.seller  || null,
    source:      row.source  || null,
    client:      row.client  || 'Ferrous',
  };
}

export function toDbTransaction(txn) {
  return {
    id:           txn.id,
    client:       txn.client      || 'Ferrous',
    date:         txn.date,
    type:         txn.type,
    equipment:    txn.equipment,
    quantity:     txn.quantity    || 1,
    unit_price:   txn.unitPrice   || 0,
    total_price:  txn.totalPrice  || 0,
    market_value: txn.marketValue || null,
    market_total: txn.marketTotal || null,
    spread:       txn.spread      || null,
    spread_pct:   txn.spreadPct   || null,
    category:     txn.category    || null,
    tags:         txn.tags        || [],
    notes:        txn.notes       || null,
    buyer:        txn.buyer       || null,
    seller:       txn.seller      || null,
    source:       txn.source      || null,
  };
}


// ─── Clients ──────────────────────────────────────────────────────────────────

export async function getClients() {
  if (!supabase) return ['Ferrous'];
  const { data, error } = await supabase
    .from('clients')
    .select('name')
    .order('created_at', { ascending: true });
  if (error) { console.error('[supabase] getClients:', error.message); return ['Ferrous']; }
  return data.map(r => r.name);
}

export async function addClient(name) {
  if (!supabase) return;
  const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const { error } = await supabase
    .from('clients')
    .upsert({ id, name }, { onConflict: 'id', ignoreDuplicates: true });
  if (error) console.error('[supabase] addClient:', error.message);
}


// ─── Invoices ─────────────────────────────────────────────────────────────────

export async function getClientInvoices(clientName) {
  if (!supabase) return null; // null = use localStorage fallback
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('client', clientName)
    .order('date', { ascending: false });
  if (error) { console.error('[supabase] getClientInvoices:', error.message); return null; }
  return data.map(fromDbInvoice);
}

export async function getAllClientInvoices() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('date', { ascending: false });
  if (error) { console.error('[supabase] getAllClientInvoices:', error.message); return null; }
  return data.map(fromDbInvoice);
}

// saveClientInvoice — used by single IngestPanel (allows editing/overwrite of existing)
export async function saveClientInvoice(invoice) {
  if (!supabase) return null;
  const row = toDbInvoice(invoice);
  const { data, error } = await supabase
    .from('invoices')
    .upsert(row, { onConflict: 'id', ignoreDuplicates: false })
    .select('id')
    .single();
  if (error) { console.error('[supabase] saveClientInvoice:', error.message); return null; }
  return data?.id;
}

// saveNewClientInvoice — used by batch import (never overwrites existing records)
// Returns 'saved', 'skipped' (already exists), or null (error)
export async function saveNewClientInvoice(invoice) {
  if (!supabase) return null;
  const row = toDbInvoice(invoice);
  const { data, error } = await supabase
    .from('invoices')
    .upsert(row, { onConflict: 'id', ignoreDuplicates: true })
    .select('id')
    .single();
  if (error && error.code !== 'PGRST116') {
    console.error('[supabase] saveNewClientInvoice:', error.message);
    return null;
  }
  return data?.id ? 'saved' : 'skipped';
}


// ─── Transactions ─────────────────────────────────────────────────────────────

export async function getClientTransactions(clientName) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('client_transactions')
    .select('*')
    .eq('client', clientName)
    .order('date', { ascending: false });
  if (error) { console.error('[supabase] getClientTransactions:', error.message); return null; }
  return data.map(fromDbTransaction);
}

export async function getAllClientTransactions() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('client_transactions')
    .select('*')
    .order('date', { ascending: false });
  if (error) { console.error('[supabase] getAllClientTransactions:', error.message); return null; }
  return data.map(fromDbTransaction);
}

export async function saveClientTransaction(txn) {
  if (!supabase) return null;
  const row = toDbTransaction(txn);
  const { data, error } = await supabase
    .from('client_transactions')
    .upsert(row, { onConflict: 'id', ignoreDuplicates: false })
    .select('id')
    .single();
  if (error) { console.error('[supabase] saveClientTransaction:', error.message); return null; }
  return data?.id;
}


// ─── Delete all invoices for a client (used by reset) ────────────────────────

export async function deleteAllClientInvoices(clientName) {
  if (!supabase) return false;
  // Delete rows matching the client name OR where client is null (untagged rows)
  const { error: e1 } = await supabase.from('invoices').delete().eq('client', clientName);
  const { error: e2 } = await supabase.from('invoices').delete().is('client', null);
  if (e1) console.error('[supabase] deleteAllClientInvoices (named):', e1.message);
  if (e2) console.error('[supabase] deleteAllClientInvoices (null):', e2.message);
  return !e1 && !e2;
}


// ─── Bulk seed (one-time migration of localStorage data) ─────────────────────

export async function bulkSeedInvoices(invoices) {
  if (!supabase) return { success: 0, failed: 0 };
  let success = 0, failed = 0;
  for (const inv of invoices) {
    const result = await saveClientInvoice(inv);
    if (result) success++; else failed++;
  }
  return { success, failed };
}

export async function bulkSeedTransactions(txns) {
  if (!supabase) return { success: 0, failed: 0 };
  let success = 0, failed = 0;
  for (const txn of txns) {
    const result = await saveClientTransaction(txn);
    if (result) success++; else failed++;
  }
  return { success, failed };
}
