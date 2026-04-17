/**
 * Supabase client — browser/Next.js side (anon key, read-only)
 * Add to your Next.js app at: src/lib/supabase.js
 *
 * Install: npm install @supabase/supabase-js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnon) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnon);


// ─── Invoice helpers ──────────────────────────────────────────────────────────

export async function getAllInvoices() {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      invoice_line_items (*)
    `)
    .order('date', { ascending: false });

  if (error) throw new Error(`getAllInvoices: ${error.message}`);
  return data || [];
}

export async function getInvoiceById(id) {
  const { data, error } = await supabase
    .from('invoices')
    .select(`*, invoice_line_items (*)`)
    .eq('id', id)
    .single();

  if (error) throw new Error(`getInvoiceById: ${error.message}`);
  return data;
}

export async function getInvoicesByVendor(vendor) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .ilike('vendor', `%${vendor}%`)
    .order('date', { ascending: false });

  if (error) throw new Error(`getInvoicesByVendor: ${error.message}`);
  return data || [];
}

export async function getInvoicesByUnit(unitId) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('unit_id', unitId)
    .order('date', { ascending: false });

  if (error) throw new Error(`getInvoicesByUnit: ${error.message}`);
  return data || [];
}

export async function getFlaggedInvoices() {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .not('flags', 'eq', '{}')
    .not('flags', 'is', null)
    .order('date', { ascending: false });

  if (error) throw new Error(`getFlaggedInvoices: ${error.message}`);
  return data || [];
}


// ─── Agreement helpers ────────────────────────────────────────────────────────

export async function getAllAgreements() {
  const { data, error } = await supabase
    .from('agreements')
    .select('*')
    .order('status', { ascending: true });

  if (error) throw new Error(`getAllAgreements: ${error.message}`);
  return data || [];
}


// ─── Equipment helpers ────────────────────────────────────────────────────────

export async function getAllEquipment() {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .eq('status', 'active')
    .order('unit_id', { ascending: true });

  if (error) throw new Error(`getAllEquipment: ${error.message}`);
  return data || [];
}


// ─── Analytics views ──────────────────────────────────────────────────────────

export async function getVendorSpendSummary() {
  const { data, error } = await supabase
    .from('vendor_spend_summary')
    .select('*');

  if (error) throw new Error(`getVendorSpendSummary: ${error.message}`);
  return data || [];
}

export async function getUnitCostSummary() {
  const { data, error } = await supabase
    .from('unit_cost_summary')
    .select('*');

  if (error) throw new Error(`getUnitCostSummary: ${error.message}`);
  return data || [];
}


// ─── Transactions ─────────────────────────────────────────────────────────────

export async function getAllTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw new Error(`getAllTransactions: ${error.message}`);
  return data || [];
}


// ─── Chat session helpers ─────────────────────────────────────────────────────

export async function createChatSession(name = 'New Chat') {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({ session_name: name })
    .select('id')
    .single();

  if (error) throw new Error(`createChatSession: ${error.message}`);
  return data.id;
}

export async function saveChatMessage(sessionId, role, content, sources = null) {
  const { error } = await supabase
    .from('chat_messages')
    .insert({ session_id: sessionId, role, content, sources });

  if (error) throw new Error(`saveChatMessage: ${error.message}`);
}

export async function getChatHistory(sessionId) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`getChatHistory: ${error.message}`);
  return data || [];
}
