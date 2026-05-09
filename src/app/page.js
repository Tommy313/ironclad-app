"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "../lib/supabase-browser";

// ââ Engine version â bump when engine logic changes âââââââââââââââââââââââââââ
const ENGINE_VERSION = "v1.3";

// ââ Error boundary ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("[Ironclad] render error:", error, info); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>â ï¸</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: "#1a2744" }}>Something went wrong</div>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20, maxWidth: 400, margin: "0 auto 20px" }}>{this.state.error.message}</div>
        <button onClick={() => this.setState({ error: null })} style={{ padding: "10px 24px", background: "#1a2744", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>Try again</button>
        <button onClick={() => window.location.reload()} style={{ marginLeft: 12, padding: "10px 24px", background: "transparent", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>Reload</button>
      </div>
    );
  }
}

// ââ Extracted view components âââââââââââââââââââââââââââââââââââââââââââââââââ
import Dashboard from "../components/views/Dashboard";
import InvoiceTableView from "../components/views/InvoiceTable";
import EquipmentView from "../components/views/EquipmentView";
import { TransactionsView, AgreementView } from "../components/views/TransactionsView";
import { S, Badge, TxnBadge, Stat } from "../components/ui";
import { SEED_INVOICES, SEED_TRANSACTIONS, CATEGORIES, REGIONS,
  calc, buildBaselines, runAuditFlags,
  STORAGE_KEY, TXN_STORAGE_KEY, CLIENT_KEY,
  f$, f$2 } from "../lib/engine";
import IngestPanel from "../components/IngestPanel";
import BatchIngestPanel from "../components/BatchIngestPanel";
import VendorPanel from "../components/VendorPanel";
import ReportPanel from "../components/ReportPanel";
import OnboardingFlow from "../components/OnboardingFlow";
import { AIChatPanel, AIChatButton } from "../components/AIChatPanel";
import {
  isSupabaseConfigured,
  getClients, addClient,
  getAllClientInvoices, saveClientInvoice, saveNewClientInvoice,
  deleteAllClientInvoices,
  getAllClientTransactions, saveClientTransaction,
  bulkSeedInvoices, bulkSeedTransactions,
  getVendors, saveVendor,
  saveReportSnapshot
} from "../lib/supabase";

function DataTab({ data, txns, onExport, onReset, count, txnCount }) {
  const [confirmReset, setConfirmReset] = useState(false);
  return <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 16 }}>
      <Stat label="Invoices" value={count} sub="Persistent" color="#16a34a" />
      <Stat label="Transactions" value={txnCount} sub="Persistent" color="#7c3aed" />
      <Stat label="Agreements" value="3" sub="Alta (active) + MI CAT (expired) + AIS (quoted)" color="#2563eb" />
      <Stat label="Machines" value={[...new Set(data.map(i => i.unitId))].length} color={S.accent} />
    </div>
    <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
      <button onClick={onExport} className="ic-btn" style={{ padding: "10px 22px", background: S.accent, color: "#fff", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: 700, fontSize: 12, boxShadow: "0 2px 8px rgba(74,127,212,0.25)", transition: "all .15s" }}>â¬ Export All (JSON)</button>
      {!confirmReset
        ? <button onClick={() => setConfirmReset(true)} className="ic-btn" style={{ padding: "10px 22px", background: "#dc262610", color: "#dc2626", border: "1.5px solid #dc262630", borderRadius: 20, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>âº Reset to Seed Data</button>
        : <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "#dc262608", border: "1.5px solid #dc262625", borderRadius: 14 }}>
            <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 600 }}>Delete all added data and reset?</span>
            <button onClick={() => { onReset(); setConfirmReset(false); }} className="ic-btn" style={{ padding: "6px 16px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 16, cursor: "pointer", fontWeight: 700, fontSize: 11, transition: "all .15s" }}>Yes, Reset</button>
            <button onClick={() => setConfirmReset(false)} className="ic-btn" style={{ padding: "6px 16px", background: "transparent", color: "#8b919e", border: "1.5px solid #d5d8e0", borderRadius: 16, cursor: "pointer", fontWeight: 600, fontSize: 11 }}>Cancel</button>
          </div>
      }
    </div>
    <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: S.shadow }}>
      <div style={{ fontSize: 10, color: S.dim, textTransform: "uppercase", marginBottom: 8 }}>Invoice Registry</div>
      <table style={{ width: "100%", fontSize: 10, borderCollapse: "collapse" }}><thead><tr style={{ borderBottom: `1px solid ${S.border}` }}>
        {["ID", "Vendor", "Equipment", "Agmt", "Rate", "Total"].map(h => <th key={h} style={{ padding: "4px 8px", textAlign: h === "Total" || h === "Rate" ? "right" : "left", color: S.dim, fontSize: 9 }}>{h}</th>)}
      </tr></thead><tbody>
        {data.map(d => { const c = calc(d); return <tr key={d.id} style={{ borderBottom: `1px solid ${S.border}60` }}>
          <td style={{ padding: "4px 8px", fontFamily: "monospace", color: S.accent }}>{d.id}</td>
          <td style={{ padding: "4px 8px", color: S.text }}>{d.vendor}</td>
          <td style={{ padding: "4px 8px", color: S.dim }}>{d.equipment}</td>
          <td style={{ padding: "4px 8px", color: d.agreement === "resident" ? "#16a34a" : S.dim }}>{d.agreement || "â"}</td>
          <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "monospace" }}>{c.rate ? "$" + c.rate : "â"}</td>
          <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "monospace", color: S.bright }}>{f$(c.total)}</td>
        </tr>; })}
      </tbody></table>
    </div>
    <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: 16, boxShadow: S.shadow }}>
      <div style={{ fontSize: 10, color: S.dim, textTransform: "uppercase", marginBottom: 8 }}>Transaction Registry</div>
      <table style={{ width: "100%", fontSize: 10, borderCollapse: "collapse" }}><thead><tr style={{ borderBottom: `1px solid ${S.border}` }}>
        {["ID", "Date", "Type", "Equipment", "Qty", "Total", "Spread"].map(h => <th key={h} style={{ padding: "4px 8px", textAlign: ["Qty", "Total", "Spread"].includes(h) ? "right" : "left", color: S.dim, fontSize: 9 }}>{h}</th>)}
      </tr></thead><tbody>
        {txns.map(t => <tr key={t.id} style={{ borderBottom: `1px solid ${S.border}60` }}>
          <td style={{ padding: "4px 8px", fontFamily: "monospace", color: "#7c3aed" }}>{t.id}</td>
          <td style={{ padding: "4px 8px", color: S.dim }}>{t.date}</td>
          <td style={{ padding: "4px 8px", color: t.type === "sell" ? "#16a34a" : "#60a5fa" }}>{t.type}</td>
          <td style={{ padding: "4px 8px", color: S.text }}>{t.equipment}</td>
          <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "monospace" }}>{t.quantity}</td>
          <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "monospace", color: S.bright }}>{f$(t.totalPrice)}</td>
          <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "monospace", color: t.spread >= 0 ? "#16a34a" : "#d97706" }}>{t.spread != null ? f$(t.spread) : "â"}</td>
        </tr>)}
      </tbody></table>
    </div>
  </div>;
}

const TABS = ["Dashboard", "Invoices", "Equipment", "Transactions", "Vendors", "Report", "Agreements"];

// localStorage fallback adapter (used when Supabase is not yet configured)
const store = {
  async get(key) { try { const v = localStorage.getItem(key); return v ? { value: v } : null; } catch { return null; } },
  async set(key, val) { try { localStorage.setItem(key, val); return true; } catch { return false; } }
};

export default function App() {
  const router = useRouter();
  const supabaseBrowser = createSupabaseBrowser();

  // ââ Auth state ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get initial session
    supabaseBrowser.auth.getUser().then(({ data: { user } }) => setUser(user));
    // Listen for auth changes (sign out elsewhere, token refresh, etc.)
    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) router.replace("/login");
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = useCallback(async () => {
    await supabaseBrowser.auth.signOut();
    router.replace("/login");
  }, []);

  const [tab, setTab] = useState("Dashboard");
  const [invoices, setInvoices] = useState(SEED_INVOICES);
  const [txns, setTxns] = useState(SEED_TRANSACTIONS);
  const [loaded, setLoaded] = useState(false);
  const [sC, setSC] = useState(0);
  const [tC, setTC] = useState(0);
  const [activeClient, setActiveClient] = useState("all");
  const [clients, setClients] = useState(["Ferrous"]);

  // Benchmark clients â hidden from the audit client dropdown.
  // Their data still powers engine calculations and AI context behind the scenes.
  // Accessible via the gear menu for internal testing.
  const BENCHMARK_CLIENTS = ['Ferrous'];
  const auditClients = clients.filter(c => !BENCHMARK_CLIENTS.includes(c));
  const isBenchmarkMode = BENCHMARK_CLIENTS.includes(activeClient);
  const [showClientAdd, setShowClientAdd] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [vendors, setVendors] = useState([]);
  const [showIngest,      setShowIngest]      = useState(false);
  const [showBatchIngest, setShowBatchIngest] = useState(false);
  const [showOnboarding,  setShowOnboarding]  = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [usingSupabase, setUsingSupabase] = useState(false);

  // ââ Data loading: Supabase primary, localStorage fallback âââââââââââââââââ
  useEffect(() => {
    (async () => {
      const sbReady = isSupabaseConfigured();
      setUsingSupabase(sbReady);

      if (sbReady) {
        // ââ Supabase path âââââââââââââââââââââââââââââââââââââââââââââââââââ
        try {
          const [dbInvoices, dbTxns, dbClients, dbVendors] = await Promise.all([
            getAllClientInvoices(),
            getAllClientTransactions(),
            getClients(),
            getVendors()
          ]);
          if (dbVendors && dbVendors.length > 0) setVendors(dbVendors);

          if (dbInvoices && dbInvoices.length > 0) {
            setInvoices(dbInvoices); setSC(dbInvoices.length);
          } else {
            // First run: seed Supabase from built-in seed data
            await bulkSeedInvoices(SEED_INVOICES);
            await bulkSeedTransactions(SEED_TRANSACTIONS);
            setInvoices(SEED_INVOICES); setSC(SEED_INVOICES.length);
          }

          if (dbTxns && dbTxns.length > 0) {
            setTxns(dbTxns); setTC(dbTxns.length);
          } else {
            setTxns(SEED_TRANSACTIONS); setTC(SEED_TRANSACTIONS.length);
          }

          if (dbClients && dbClients.length > 0) setClients(dbClients);
        } catch (err) {
          console.error('[App] Supabase load failed, falling back:', err.message);
          setUsingSupabase(false);
        }
      }

      if (!sbReady) {
        // ââ localStorage fallback path ââââââââââââââââââââââââââââââââââââââ
        try {
          const r = await store.get(STORAGE_KEY);
          if (r?.value) { const p = JSON.parse(r.value); if (Array.isArray(p) && p.length > 0) { setInvoices(p); setSC(p.length); } else { await store.set(STORAGE_KEY, JSON.stringify(SEED_INVOICES)); setSC(SEED_INVOICES.length); } }
          else { await store.set(STORAGE_KEY, JSON.stringify(SEED_INVOICES)); setSC(SEED_INVOICES.length); }
        } catch { try { await store.set(STORAGE_KEY, JSON.stringify(SEED_INVOICES)); setSC(SEED_INVOICES.length); } catch {} }
        try {
          const tr = await store.get(TXN_STORAGE_KEY);
          if (tr?.value) { const p = JSON.parse(tr.value); if (Array.isArray(p) && p.length > 0) { setTxns(p); setTC(p.length); } else { await store.set(TXN_STORAGE_KEY, JSON.stringify(SEED_TRANSACTIONS)); setTC(SEED_TRANSACTIONS.length); } }
          else { await store.set(TXN_STORAGE_KEY, JSON.stringify(SEED_TRANSACTIONS)); setTC(SEED_TRANSACTIONS.length); }
        } catch { try { await store.set(TXN_STORAGE_KEY, JSON.stringify(SEED_TRANSACTIONS)); setTC(SEED_TRANSACTIONS.length); } catch {} }
        try {
          const cl = await store.get(CLIENT_KEY);
          if (cl?.value) { const p = JSON.parse(cl.value); if (Array.isArray(p) && p.length > 0) setClients(p); }
        } catch {}
      }

      setLoaded(true);
    })();
  }, []);

  // localStorage persistence (only when Supabase not active)
  useEffect(() => { if (!loaded || usingSupabase) return; (async () => { try { await store.set(STORAGE_KEY, JSON.stringify(invoices)); setSC(invoices.length); } catch {} })(); }, [invoices, loaded, usingSupabase]);
  useEffect(() => { if (!loaded || usingSupabase) return; (async () => { try { await store.set(TXN_STORAGE_KEY, JSON.stringify(txns)); setTC(txns.length); } catch {} })(); }, [txns, loaded, usingSupabase]);
  useEffect(() => { if (!loaded || usingSupabase) return; (async () => { try { await store.set(CLIENT_KEY, JSON.stringify(clients)); } catch {} })(); }, [clients, loaded, usingSupabase]);

  const handleAddClient = async (nameOverride) => {
    const name = (nameOverride || newClientName).trim();
    if (!name || clients.includes(name)) return;
    if (usingSupabase) await addClient(name);
    else { const updated = [...clients, name]; await store.set(CLIENT_KEY, JSON.stringify(updated)); }
    setClients(prev => [...prev, name]);
    setActiveClient(name);
    if (!nameOverride) { setNewClientName(""); setShowClientAdd(false); }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ agreements: AGREEMENTS, invoices, transactions: txns, clients, exported: new Date().toISOString(), version: "v7.0" }, null, 2)], { type: "application/json" });
    const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = `ironclad_${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(u);
  };

  const handleReset = async () => {
    setShowAdminMenu(false);

    if (usingSupabase) {
      // Wipe all Ferrous (benchmark) invoices from Supabase, then re-seed
      // This is the only way a reset survives a page refresh
      try {
        await deleteAllClientInvoices('Ferrous');
        await bulkSeedInvoices(SEED_INVOICES);
        await bulkSeedTransactions(SEED_TRANSACTIONS);
      } catch (err) {
        console.error('[reset] Supabase reset failed:', err.message);
      }
    } else {
      try {
        await store.set(STORAGE_KEY, JSON.stringify(SEED_INVOICES));
        await store.set(TXN_STORAGE_KEY, JSON.stringify(SEED_TRANSACTIONS));
      } catch {}
    }

    setInvoices(SEED_INVOICES);
    setTxns(SEED_TRANSACTIONS);
    setSC(SEED_INVOICES.length);
    setTC(SEED_TRANSACTIONS.length);
  };

  // Resolution status handler â stores DISPUTED / RESOLVED / CREDITED as manual flags
  // Manual flags are never overwritten by the engine, so status persists through re-audits.
  const handleSaveResolution = async (invoice, resolutionFlag) => {
    const currentManual = (invoice.flags || []).filter(f => !f.startsWith("ENG-") && !["DISPUTED","RESOLVED","CREDITED"].includes(f));
    const updated = { ...invoice, flags: [...currentManual, resolutionFlag] };
    if (usingSupabase) await saveClientInvoice(updated);
    setInvoices(prev => prev.map(i => i.id === updated.id ? updated : i));
  };

  const handleSaveVendor = async (vendor) => {
    if (usingSupabase) await saveVendor(vendor);
    setVendors(prev => {
      const idx = prev.findIndex(v => v.id === vendor.id);
      return idx >= 0 ? prev.map((v, i) => i === idx ? vendor : v) : [...prev, vendor];
    });
  };

  // Derive client_id slug from a name â matches the format used in the clients SQL table
  const toClientId = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleIngest = async (record) => {
    // Enforce client FK â stamp client_id on every saved invoice
    const clientName = activeClient !== "all" ? activeClient : (record.client || "Ferrous");
    const withClient = { ...record, client: clientName, client_id: toClientId(clientName) };
    const audited = runAuditFlags(withClient, invoices, vendors);
    if (usingSupabase) {
      await saveClientInvoice(audited);
    }
    setInvoices(prev => {
      const exists = prev.findIndex(i => i.id === audited.id);
      const updated = exists >= 0
        ? prev.map((i, idx) => idx === exists ? audited : i)
        : [audited, ...prev];
      if (!usingSupabase) store.set(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      setSC(updated.length);
      return updated;
    });
  };

  // Batch import â NEVER overwrites existing records. Skips any ID already in DB.
  const handleBatchIngest = async (record) => {
    const clientName = activeClient !== "all" ? activeClient : (record.client || "Ferrous");
    const withClient = { ...record, client: clientName, client_id: toClientId(clientName) };
    const audited = runAuditFlags(withClient, invoices, vendors);
    if (usingSupabase) {
      const result = await saveNewClientInvoice(audited);
      if (result !== 'saved') return;
    }
    setInvoices(prev => {
      if (prev.some(i => i.id === audited.id)) return prev;
      const updated = [audited, ...prev];
      if (!usingSupabase) store.set(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      setSC(updated.length);
      return updated;
    });
  };

  // Re-audit all existing invoices â updates ENG- flags in Supabase with current baselines.
  // Run this once after initial data load, or whenever the vendor rate table changes.
  // Does NOT re-run automatically on page load.

  // Auto Re-Audit when client changes + engine version is newer than last audit
  // Runs silently in background — no confirm dialog, no manual trigger needed
  useEffect(() => {
    if (!loaded || !usingSupabase || activeClient === "all" || vendors.length === 0) return;
    const key = `ironclad_last_audit_${activeClient}`;
    const lastVersion = localStorage.getItem(key);
    if (lastVersion === ENGINE_VERSION) return; // already current
    // Run silent re-audit for this client
    (async () => {
      const clientInvoices = invoices.filter(i => (i.client || "Ferrous") === activeClient);
      if (clientInvoices.length === 0) return;
      const baselines = buildBaselines(clientInvoices, undefined, vendors);
      const reaudited = clientInvoices.map(inv => runAuditFlags(inv, clientInvoices, vendors, baselines));
      for (const inv of reaudited) await saveClientInvoice(inv);
      setInvoices(prev => prev.map(p => reaudited.find(r => r.id === p.id) || p));
      localStorage.setItem(key, ENGINE_VERSION);
      console.log(`[auto-audit] ${activeClient} updated to ${ENGINE_VERSION}`);
    })();
  }, [activeClient, loaded, vendors.length]);

  const [reauditProgress, setReauditProgress] = useState(null); // null | { done, total }

  const handleReauditAll = async () => {
    setShowAdminMenu(false);
    const count = filteredInvoices.length;
    if (!confirm(`Re-audit all ${count} invoices with the current engine?\n\nThis updates stored flags in Supabase. Manual flags are preserved.`)) return;

    // Compute baselines ONCE â avoids O(nÂ²) recomputation on large datasets
    const baselines = buildBaselines(filteredInvoices, undefined, vendors);
    const reaudited = filteredInvoices.map(inv => runAuditFlags(inv, filteredInvoices, vendors, baselines));

    setReauditProgress({ done: 0, total: reaudited.length });

    if (usingSupabase) {
      for (let i = 0; i < reaudited.length; i++) {
        await saveClientInvoice(reaudited[i]);
        setReauditProgress({ done: i + 1, total: reaudited.length });
      }
    }

    setInvoices(prev => {
      const updated = prev.map(p => {
        const r = reaudited.find(r => r.id === p.id);
        return r || p;
      });
      setSC(updated.length);
      return updated;
    });
    setReauditProgress(null);
    alert(`Re-audit complete â ${reaudited.length} invoices updated.`);
  };

  // Client-filtered data
  const filteredInvoices = activeClient === "all" ? invoices : invoices.filter(i => (i.client || "Ferrous") === activeClient);
  const filteredTxns = activeClient === "all" ? txns : txns.filter(t => (t.client || "Ferrous") === activeClient);
  const tot = filteredInvoices.reduce((s, i) => s + i.parts + i.labor + i.misc, 0);
  const txnVol = filteredTxns.reduce((s, t) => s + t.totalPrice, 0);

  return <ErrorBoundary><div style={{ background: S.bg, minHeight: "100vh", color: S.text, fontFamily: "'Nunito Sans','SF Pro Display',-apple-system,sans-serif" }}>
    <div style={{ borderBottom: `1px solid ${S.border}`, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: S.card, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 10, background: `linear-gradient(135deg,${S.accent},#3a6ab8)`, boxShadow: "0 2px 6px rgba(74,127,212,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#fff" }}>I</div>
        <div><div style={{ fontSize: 13, fontWeight: 700, letterSpacing: .5 }}>IRONCLAD FLEET INTELLIGENCE</div>
          <div style={{ fontSize: 8, color: S.dim, letterSpacing: 1.2, textTransform: "uppercase" }}>Scrap Â· Demolition Â· Recycling</div></div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 9, color: S.dim, textTransform: "uppercase", letterSpacing: .5 }}>Client:</span>
          <select value={activeClient} onChange={e => setActiveClient(e.target.value)}
            style={{ background: isBenchmarkMode ? "#d9770610" : S.card, border: `1.5px solid ${isBenchmarkMode ? S.yellow : activeClient !== "all" ? S.accent : S.border}`, borderRadius: 10, color: isBenchmarkMode ? S.yellow : activeClient !== "all" ? S.accent : S.text, fontSize: 11, padding: "4px 8px", outline: "none", fontWeight: 600, cursor: "pointer" }}>
            <option value="all">â Select Client â</option>
            {auditClients.map(c => <option key={c} value={c}>{c} ({invoices.filter(i => (i.client || "Ferrous") === c).length})</option>)}
            {isBenchmarkMode && <option value={activeClient}>{activeClient} â Benchmark</option>}
          </select>
          {isBenchmarkMode && <span style={{ fontSize: 9, fontWeight: 700, color: S.yellow, textTransform: "uppercase", letterSpacing: .5 }}>â Benchmark Mode</span>}
          <button onClick={() => setShowClientAdd(!showClientAdd)} className="ic-btn" style={{ padding: "4px 12px", background: showClientAdd ? "#dc2626" : S.accent + "10", border: `1.5px solid ${showClientAdd ? "#dc2626" : S.accent}30`, borderRadius: 16, color: showClientAdd ? "#fff" : S.accent, fontSize: 10, cursor: "pointer", fontWeight: 700 }}>{showClientAdd ? "Ã" : "+ New"}</button>
          <button onClick={() => setShowOnboarding(true)} className="ic-btn" style={{ padding: "6px 16px", background: "#c8972b", color: "#fff", border: "none", borderRadius: 16, fontSize: 11, cursor: "pointer", fontWeight: 800, boxShadow: "0 2px 6px rgba(200,151,43,0.35)", marginLeft: 8, letterSpacing: 0.3 }}>â New Audit</button>
          <button onClick={() => setShowIngest(true)} className="ic-btn" style={{ padding: "6px 14px", background: S.accent, color: "#fff", border: "none", borderRadius: 16, fontSize: 10, cursor: "pointer", fontWeight: 700, boxShadow: "0 2px 6px rgba(74,127,212,0.25)", marginLeft: 4 }}>ð Ingest</button>
          <button onClick={() => setShowBatchIngest(true)} className="ic-btn" style={{ padding: "6px 14px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 16, fontSize: 10, cursor: "pointer", fontWeight: 700, boxShadow: "0 2px 6px rgba(22,163,74,0.25)" }}>ð Batch</button>
        </div>
        <div style={{ fontSize: 10, color: S.dim, textAlign: "right" }}>
          <div>{filteredInvoices.length} invoices Â· {filteredTxns.length} deals | {f$(tot)} R&M</div>
          <div style={{ color: usingSupabase ? "#16a34a" : "#d97706", fontSize: 9 }}>
            â {usingSupabase ? `Engine ${ENGINE_VERSION} â Supabase Â· Auth Â· RAG` : `Engine ${ENGINE_VERSION} â Local mode`}
          </div>
        </div>
        {/* Admin gear menu */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowAdminMenu(v => !v)}
            style={{ background: "transparent", border: `1px solid ${S.border}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 14, color: S.dim, lineHeight: 1 }}
            title="Admin"
          >â</button>
          {showAdminMenu && <>
            <div onClick={() => setShowAdminMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 299 }} />
            <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 300, minWidth: 200, overflow: "hidden" }}>
              <div style={{ padding: "8px 14px", fontSize: 9, color: S.dim, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1px solid ${S.border}` }}>Admin</div>
              <div style={{ padding: "4px 0" }}>
                <button onClick={handleExport} style={{ display: "block", width: "100%", padding: "9px 14px", background: "none", border: "none", textAlign: "left", fontSize: 12, color: S.text, cursor: "pointer" }}>â¬ Export All Data (JSON)</button>
                <div style={{ height: 1, background: S.border, margin: "4px 14px" }} />
                {BENCHMARK_CLIENTS.map(bc => (
                  <button key={bc} onClick={() => { setActiveClient(bc); setShowAdminMenu(false); }}
                    style={{ display: "block", width: "100%", padding: "9px 14px", background: "none", border: "none", textAlign: "left", fontSize: 12, color: S.yellow, cursor: "pointer" }}>
                    â View Benchmark Data ({bc})
                  </button>
                ))}
                <div style={{ height: 1, background: S.border, margin: "4px 14px" }} />
                <button onClick={handleReauditAll} style={{ display: "block", width: "100%", padding: "9px 14px", background: "none", border: "none", textAlign: "left", fontSize: 12, color: "#d97706", cursor: "pointer", fontWeight: 600 }}>â¡ Re-Audit All Invoices</button>
                <button onClick={() => { if (confirm("Reset all data to seed invoices? This cannot be undone.")) handleReset(); }} style={{ display: "block", width: "100%", padding: "9px 14px", background: "none", border: "none", textAlign: "left", fontSize: 12, color: "#dc2626", cursor: "pointer" }}>âº Reset to Seed Data</button>
                <div style={{ height: 1, background: S.border, margin: "4px 14px" }} />
                <button onClick={handleLogout} style={{ display: "block", width: "100%", padding: "9px 14px", background: "none", border: "none", textAlign: "left", fontSize: 12, color: "#dc2626", cursor: "pointer", fontWeight: 600 }}>ð Sign Out</button>
              </div>
              <div style={{ padding: "8px 14px", borderTop: `1px solid ${S.border}`, fontSize: 9, color: S.dim }}>
                {usingSupabase ? "â Supabase connected" : "â  Supabase not configured"}<br />
                {invoices.length} invoices Â· {txns.length} transactions Â· {clients.length} clients<br />
                {user && <span style={{ color: "#16a34a" }}>â {user.email}</span>}
              </div>
            </div>
          </>}
        </div>
      </div>
    </div>
    {reauditProgress && (
      <div style={{ padding: "8px 20px", background: "#d9770615", borderBottom: `1px solid #d9770640`, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 11, color: "#d97706", fontWeight: 700 }}>â¡ Re-auditing invoicesâ¦</span>
        <div style={{ flex: 1, maxWidth: 200, height: 4, background: "#d9770630", borderRadius: 2 }}>
          <div style={{ height: "100%", width: `${Math.round(reauditProgress.done / reauditProgress.total * 100)}%`, background: "#d97706", borderRadius: 2, transition: "width 0.2s" }} />
        </div>
        <span style={{ fontSize: 11, color: "#d97706" }}>{reauditProgress.done} / {reauditProgress.total}</span>
      </div>
    )}
    {showClientAdd && <div style={{ padding: "10px 20px", background: S.card, borderBottom: `1px solid ${S.border}`, display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 10, color: S.dim }}>New audit client:</span>
      <input value={newClientName} onChange={e => setNewClientName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddClient()}
        placeholder="Company name..." style={{ background: S.card, border: `1.5px solid ${S.border}`, borderRadius: 10, color: S.bright, fontSize: 12, padding: "7px 12px", outline: "none", width: 200, fontFamily: "inherit" }} />
      <button onClick={handleAddClient} className="ic-btn" style={{ padding: "6px 16px", background: S.accent, color: "#fff", border: "none", borderRadius: 16, fontSize: 11, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 6px rgba(74,127,212,0.2)", transition: "all .15s" }}>Add Client</button>
      <span style={{ fontSize: 9, color: S.dim, marginLeft: 8 }}>New invoices you upload will be tagged to the selected client.</span>
    </div>}
    <div style={{ display: "flex", borderBottom: `1px solid ${S.border}`, padding: "0 20px" }}>
      {TABS.map(t => <button key={t} onClick={() => setTab(t)} className="ic-btn" style={{ padding: "10px 18px", background: tab === t ? S.accent + "10" : "transparent", border: "none", borderBottom: tab === t ? `2px solid ${t === "Transactions" ? "#7c3aed" : S.accent}` : "2px solid transparent", borderRadius: "10px 10px 0 0", color: tab === t ? (t === "Transactions" ? "#7c3aed" : S.accent) : S.dim, fontSize: 12, fontWeight: tab === t ? 700 : 500, cursor: "pointer", transition: "all .15s" }}>{t}</button>)}
    </div>
    <div style={{ padding: "16px 20px", maxWidth: 1400, margin: "0 auto" }}>
      {!loaded ? <div style={{ textAlign: "center", padding: 40, color: S.dim }}>Loading...</div> :
        tab === "Dashboard"     ? <Dashboard data={filteredInvoices} txns={filteredTxns} activeClient={activeClient} /> :
        tab === "Invoices"      ? <InvoiceTableView data={filteredInvoices} vendors={vendors} onSaveResolution={handleSaveResolution} /> :
        tab === "Equipment"     ? <EquipmentView data={filteredInvoices} vendors={vendors} /> :
        tab === "Transactions"  ? <TransactionsView txns={filteredTxns} /> :
        tab === "Vendors"       ? <VendorPanel vendors={vendors} onSave={handleSaveVendor} /> :
        tab === "Report"        ? <ReportPanel invoices={filteredInvoices} vendors={vendors} client={activeClient || "Ferrous Process & Trading"} onSnapshotSave={saveReportSnapshot} /> :
                                  <AgreementView />}
    </div>
    {showIngest && <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={() => setShowIngest(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.2)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 720, zIndex: 201 }}>
        <IngestPanel
          knownVendors={vendors.length > 0 ? vendors.map(v => v.name) : [...new Set(invoices.map(i => i.vendor))]}
          knownEquipment={invoices.map(i => ({ id: i.unitId, make: i.equipment.split(" ")[0], model: i.equipment.split(" ").slice(1).join(" ") }))}
          activeClient={activeClient !== "all" ? activeClient : "Ferrous"}
          existingIds={invoices.map(i => i.id)}
          onSave={handleIngest}
          onClose={() => setShowIngest(false)}
        />
      </div>
    </div>}
    {showBatchIngest && <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={() => setShowBatchIngest(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.2)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 780, zIndex: 201 }}>
        <BatchIngestPanel
          knownVendors={vendors.length > 0 ? vendors.map(v => v.name) : [...new Set(invoices.map(i => i.vendor))]}
          knownEquipment={invoices.map(i => ({ id: i.unitId, make: i.equipment.split(" ")[0], model: i.equipment.split(" ").slice(1).join(" ") }))}
          activeClient={activeClient !== "all" ? activeClient : "Ferrous"}
          existingIds={invoices.map(i => i.id)}
          onSave={handleBatchIngest}
          onClose={() => setShowBatchIngest(false)}
        />
      </div>
    </div>}
    {showOnboarding && (
      <OnboardingFlow
        onClose={() => setShowOnboarding(false)}
        onClientCreated={async (name) => { await handleAddClient(name); setActiveClient(name); }}
        onGoToTab={(t) => setTab(t)}
        onReauditAll={handleReauditAll}
        onBatchImport={() => setShowBatchIngest(true)}
        existingClients={auditClients}
        vendors={vendors}
      />
    )}
    <AIChatButton onClick={() => setChatOpen(true)} />
    <AIChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
  </div></ErrorBoundary>;
}
