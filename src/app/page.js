"use client";
import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { AGREEMENTS, RESIDENT_TECH, SEED_INVOICES, SEED_TRANSACTIONS, LIFECYCLE_DATA,
  FLAG_META, TXN_TAG_META, CATEGORIES, REGIONS, calc, audit, buildBaselines, lifecycleRisk, runAuditFlags,
  STORAGE_KEY, TXN_STORAGE_KEY, CLIENT_KEY,
  f$, f$2, fH, fP } from "../lib/engine";
import IngestPanel from "../components/IngestPanel";
import BatchIngestPanel from "../components/BatchIngestPanel";
import { AIChatPanel, AIChatButton } from "../components/AIChatPanel";
import {
  isSupabaseConfigured,
  getClients, addClient,
  getAllClientInvoices, saveClientInvoice, saveNewClientInvoice,
  deleteAllClientInvoices,
  getAllClientTransactions, saveClientTransaction,
  bulkSeedInvoices, bulkSeedTransactions
} from "../lib/supabase";

const S = { bg: "#f0f1f5", card: "#ffffff", border: "#d5d8e0", accent: "#4a7fd4", text: "#3a3f4b", dim: "#8b919e", bright: "#1d2028", shadow: "0 1px 3px rgba(0,0,0,0.06)" };
function Badge({ flag }) { const m = FLAG_META[flag] || { c: "#6b7280", l: flag }; return <span style={{ display: "inline-block", padding: "2px 9px", borderRadius: 12, fontSize: 9, fontWeight: 700, marginRight: 3, marginBottom: 2, background: m.c + "15", color: m.c, border: `1px solid ${m.c}30` }}>{m.l}</span>; }
function TxnBadge({ tag }) { const m = TXN_TAG_META[tag] || { c: "#6b7280", l: tag }; return <span style={{ display: "inline-block", padding: "2px 9px", borderRadius: 12, fontSize: 9, fontWeight: 700, marginRight: 3, marginBottom: 2, background: m.c + "15", color: m.c, border: `1px solid ${m.c}30` }}>{m.l}</span>; }
function Stat({ label, value, sub, color }) { return <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: "14px 16px", borderLeft: `3px solid ${color || S.border}`, boxShadow: S.shadow }}><div style={{ fontSize: 10, color: S.dim, textTransform: "uppercase", letterSpacing: .8, marginBottom: 5 }}>{label}</div><div style={{ fontSize: 20, fontWeight: 700, color: color || S.bright, fontFamily: "'JetBrains Mono',monospace" }}>{value}</div>{sub && <div style={{ fontSize: 10, color: S.dim, marginTop: 3 }}>{sub}</div>}</div>; }

function Dashboard({ data, txns, activeClient }) {
  if (activeClient === "all") return <div style={{ textAlign: "center", padding: 80 }}>
    <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>📊</div>
    <div style={{ fontSize: 18, fontWeight: 700, color: S.bright, marginBottom: 8 }}>Select a client to view audit results</div>
    <div style={{ fontSize: 13, color: S.dim, maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>Use the client dropdown to select an audit client. Dashboard, invoices, and equipment views will filter to that client's data.</div>
  </div>;

  if (data.length === 0) return <div style={{ textAlign: "center", padding: 80 }}>
    <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>📂</div>
    <div style={{ fontSize: 18, fontWeight: 700, color: S.bright, marginBottom: 8 }}>No invoices yet for this client</div>
    <div style={{ fontSize: 13, color: S.dim, maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>Use Ingest Invoice or Batch Import to add invoices. They'll appear here and feed the audit engine automatically.</div>
  </div>;

  const c = data.map(calc);
  const tot = c.reduce((s, i) => s + i.total, 0), lab = c.reduce((s, i) => s + i.labor, 0), pts = c.reduce((s, i) => s + i.parts, 0);
  const actionFlags = c.filter(i => i.flags.some(f => ["MISDIAGNOSIS", "EXCESSIVE-LABOR", "HIGH-LABOR", "LABOR-HEAVY", "HIGHEST-COST", "PHANTOM-PART", "COURIER-AT-MECH-RATE", "UNDOCUMENTED-CHARGE", "WRONG-FLUID"].includes(f))).length;
  const bl = buildBaselines(data);
  const allAudits = c.map(i => audit(i, bl));
  const complianceFlags = allAudits.reduce((s, ck) => s + ck.filter(c => c.r === "FLAG").length, 0);
  const compliancePass = allAudits.reduce((s, ck) => s + ck.filter(c => c.r === "PASS").length, 0);
  const impH = c.filter(i => i.impliedHrs != null).reduce((s, i) => s + i.impliedHrs, 0);
  const expH = c.filter(i => i.midHrs != null).reduce((s, i) => s + i.midHrs, 0);
  // Only count exposure for invoices with explicit expected-hour benchmarks (midHrs != null)
  // Invoices without expected hours still get statistical analysis via buildBaselines/audit
  const excessH = c.filter(i => i.variance != null && i.variance > 0).reduce((s, i) => s + i.variance, 0);
  const excessDollars = c.filter(i => i.varDollars != null && i.varDollars > 0).reduce((s, i) => s + i.varDollars, 0);
  // Statistical outliers from audit engine (even without expected hours)
  const statFlags = allAudits.reduce((s, ck) => s + ck.filter(c => c.r === "FLAG" && ["Hours vs Category","Cost vs Category","Rate vs Baseline","Repeat Repair"].includes(c.ck)).length, 0);
  const vendors = [...new Set(c.map(i => i.vendor))], equip = [...new Set(c.map(i => i.unitId))];
  const catD = {}; c.forEach(i => { catD[i.category] = (catD[i.category] || 0) + i.total; });
  const pie = Object.entries(catD).map(([name, value]) => ({ name, value }));
  const PC = ["#c45a2d", "#2563eb", "#16a34a", "#d97706", "#7c3aed", "#dc2626", "#0891b2"];
  const eqD = {}; c.forEach(i => { if (!eqD[i.unitId]) eqD[i.unitId] = { name: i.equipment.length > 20 ? i.equipment.slice(0, 20) : i.equipment, spend: 0 }; eqD[i.unitId].spend += i.total; });
  const eqBar = Object.values(eqD).sort((a, b) => b.spend - a.spend).slice(0, 8);
  const vD = {}; c.forEach(i => { if (!vD[i.vendor]) vD[i.vendor] = { name: i.vendor.replace(" Equipment","").replace(" (MacAllister Machinery)","").replace(" CAT"," CAT"), spend: 0 }; vD[i.vendor].spend += i.total; });
  const txnVol = txns.reduce((s, t) => s + t.totalPrice, 0);
  const txnSpread = txns.reduce((s, t) => s + (t.spread || 0), 0);
  return <div>
    {excessDollars > 0 && <div style={{ background: "#dc262608", border: "2px solid #dc262630", borderRadius: 14, padding: "20px 24px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ fontSize: 10, color: "#dc2626", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Identified Cost Exposure</div>
        <div style={{ fontSize: 11, color: S.dim, marginTop: 2 }}>{excessH.toFixed(1)} excess hours across {c.filter(i => i.variance != null && i.variance > 0).length} invoices with benchmarked hours{statFlags > 0 ? ` · ${statFlags} statistical outlier${statFlags !== 1 ? "s" : ""} flagged` : ""}</div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: "#dc2626", fontFamily: "'JetBrains Mono',monospace" }}>{f$(excessDollars)}</div>
    </div>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 16 }}>
      <Stat label="R&M Invoiced" value={f$(tot)} sub={`${c.length} invoices`} color={S.accent} />
      <Stat label="Labor / Parts" value={tot > 0 ? `${fP(lab / tot * 100)} / ${fP(pts / tot * 100)}` : "— / —"} sub={`${f$(lab)} / ${f$(pts)}`} color="#ea580c" />
      <Stat label="Implied Hours" value={fH(impH)} sub={`vs ${fH(expH)} expected`} color="#2563eb" />
      <Stat label="Audit Findings" value={`${actionFlags} + ${complianceFlags}`} sub={`${actionFlags} manual | ${complianceFlags} compliance | ${compliancePass} passed`} color="#dc2626" />
      <Stat label="Vendors / Machines" value={`${vendors.length} / ${equip.length}`} sub={vendors.join(", ")} color="#16a34a" />
      <Stat label="Txn Volume" value={f$(txnVol)} sub={`${txns.length} deals | Spread: ${f$(txnSpread)}`} color="#7c3aed" />
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
      <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: 14, boxShadow: S.shadow }}>
        <div style={{ fontSize: 10, color: S.dim, textTransform: "uppercase", marginBottom: 10 }}>Equipment Spend</div>
        <ResponsiveContainer width="100%" height={200}><BarChart data={eqBar} layout="vertical" margin={{ left: 95 }}>
          <XAxis type="number" tickFormatter={v => "$" + (v / 1000).toFixed(1) + "k"} stroke={S.border} tick={{ fill: S.dim, fontSize: 9 }} />
          <YAxis type="category" dataKey="name" stroke={S.border} tick={{ fill: S.text, fontSize: 9 }} width={90} />
          <Tooltip formatter={v => f$(v)} contentStyle={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, fontSize: 11, color: S.text, boxShadow: S.shadow }} itemStyle={{ color: S.text }} labelStyle={{ color: S.dim }} />
          <Bar dataKey="spend" fill={S.accent} radius={[0, 3, 3, 0]} />
        </BarChart></ResponsiveContainer>
      </div>
      <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: 14, boxShadow: S.shadow }}>
        <div style={{ fontSize: 10, color: S.dim, textTransform: "uppercase", marginBottom: 10 }}>Category Spend</div>
        <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={pie} cx="50%" cy="50%" outerRadius={70} innerRadius={35} dataKey="value" stroke={S.bg} strokeWidth={2}>
          {pie.map((_, i) => <Cell key={i} fill={PC[i % PC.length]} />)}</Pie>
          <Tooltip formatter={v => f$(v)} contentStyle={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, fontSize: 11, color: S.text, boxShadow: S.shadow }} itemStyle={{ color: S.text }} labelStyle={{ color: S.dim }} />
          <Legend wrapperStyle={{ fontSize: 9 }} /></PieChart></ResponsiveContainer>
      </div>
      <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: 14, boxShadow: S.shadow }}>
        <div style={{ fontSize: 10, color: S.dim, textTransform: "uppercase", marginBottom: 10 }}>Vendor Spend</div>
        <ResponsiveContainer width="100%" height={200}><BarChart data={Object.values(vD)} margin={{ bottom: 40 }}>
          <XAxis dataKey="name" stroke={S.border} tick={{ fill: S.text, fontSize: 8 }} angle={-25} textAnchor="end" interval={0} />
          <YAxis tickFormatter={v => "$" + (v / 1000).toFixed(0) + "k"} stroke={S.border} tick={{ fill: S.dim, fontSize: 9 }} />
          <Tooltip formatter={v => f$(v)} contentStyle={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, fontSize: 11, color: S.text, boxShadow: S.shadow }} itemStyle={{ color: S.text }} labelStyle={{ color: S.dim }} />
          <Bar dataKey="spend" fill="#2563eb" radius={[3, 3, 0, 0]} />
        </BarChart></ResponsiveContainer>
      </div>
    </div>
  </div>;
}

function InvoiceTable({ data }) {
  const [exp, setExp] = useState(null);
  const [filt, setFilt] = useState("all");
  const c = data.map(calc);
  const bl = buildBaselines(data);
  const shown = filt === "all" ? c : filt === "flagged" ? c.filter(i => i.flags.length > 0) : c.filter(i => i.vendor === filt || i.allFlags.includes(filt));
  const vendors = [...new Set(data.map(i => i.vendor))];
  const filters = ["all", "flagged", ...vendors, "MISDIAGNOSIS", "EXCESSIVE-LABOR", "HIGHEST-COST", "GOOD-TRANSPARENCY", "EMISSION-PATTERN", "CROSS-VENDOR-COMP", "ESTIMATE", "PM-SERVICE", "WARRANTY"];
  return <div>
    <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
      {filters.map(f => <button key={f} onClick={() => setFilt(f)} className="ic-btn" style={{ padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${filt === f ? S.accent : S.border}`, background: filt === f ? S.accent + "12" : "transparent", color: filt === f ? S.accent : S.dim, fontSize: 10, cursor: "pointer", fontWeight: filt === f ? 700 : 500, transition: "all .15s" }}>{f === "all" ? `All (${c.length})` : f === "flagged" ? "Flagged" : (FLAG_META[f]?.l || f)}</button>)}
    </div>
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead><tr style={{ borderBottom: `2px solid ${S.accent}30` }}>
          {["Order", "Date", "Equipment", "Vendor", "Labor", "Impl.Hrs", "Exp.", "Δ", "Total", "Flags"].map(h =>
            <th key={h} style={{ padding: "6px 8px", textAlign: ["Labor", "Impl.Hrs", "Exp.", "Δ", "Total"].includes(h) ? "right" : "left", color: S.dim, fontSize: 9, textTransform: "uppercase" }}>{h}</th>)}
        </tr></thead>
        <tbody>{shown.map(inv => <React.Fragment key={inv.id}>
          <tr onClick={() => setExp(exp === inv.id ? null : inv.id)} style={{ cursor: "pointer", background: exp === inv.id ? S.card : "transparent", borderBottom: `1px solid ${S.border}60` }}>
            <td style={{ padding: 8, fontWeight: 700, color: S.accent, fontFamily: "monospace", fontSize: 11 }}>{inv.id}</td>
            <td style={{ padding: 8, fontSize: 10, color: S.dim }}>{inv.workDates}</td>
            <td style={{ padding: 8, color: S.text }}>{inv.equipment}</td>
            <td style={{ padding: 8, fontSize: 10, color: inv.vendor === "Alta Equipment" ? "#60a5fa" : inv.vendor === "Altorfer CAT" ? "#f59e0b" : inv.vendor === "Michigan CAT (MacAllister Machinery)" ? "#34d399" : inv.vendor === "RECO Equipment" ? "#a78bfa" : inv.vendor === "Sargents Equipment" ? "#fb923c" : inv.vendor === "Christofano Equipment" ? "#f472b6" : inv.vendor === "Summit Industrial Services" ? "#38bdf8" : inv.vendor === "National Association Supply" ? "#e879f9" : "#94a3b8" }}>{inv.vendor}{inv.agreement === "resident" ? " ★" : inv.flags?.includes("WARRANTY") ? " 🛡" : ""}</td>
            <td style={{ padding: 8, fontFamily: "monospace", textAlign: "right" }}>{f$2(inv.labor)}</td>
            <td style={{ padding: 8, fontFamily: "monospace", textAlign: "right", color: inv.variance != null && inv.variance > 2 ? "#dc2626" : S.text, fontWeight: inv.variance > 2 ? 700 : 400 }}>{fH(inv.impliedHrs)}</td>
            <td style={{ padding: 8, fontFamily: "monospace", textAlign: "right", color: S.dim, fontSize: 10 }}>{inv.expectedHoursLow}–{inv.expectedHoursHigh}</td>
            <td style={{ padding: 8, fontFamily: "monospace", textAlign: "right", fontWeight: 700, color: inv.variance == null ? S.dim : inv.variance > 3 ? "#dc2626" : inv.variance > 1 ? "#d97706" : "#16a34a" }}>{inv.variance != null ? (inv.variance > 0 ? "+" : "") + inv.variance.toFixed(1) : "—"}</td>
            <td style={{ padding: 8, fontFamily: "monospace", textAlign: "right", fontWeight: 700, color: S.bright }}>{f$(inv.total)}</td>
            <td style={{ padding: 8 }}>{inv.allFlags.slice(0, 2).map(f => <Badge key={f} flag={f} />)}{inv.allFlags.length > 2 && <span style={{ fontSize: 9, color: S.dim }}>+{inv.allFlags.length - 2}</span>}</td>
          </tr>
          {exp === inv.id && <tr style={{ background: S.bg }}><td colSpan={10} style={{ padding: "14px 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 9, color: S.dim, textTransform: "uppercase", marginBottom: 4 }}>Description</div>
                <div style={{ fontSize: 11, color: S.text, lineHeight: 1.5 }}>{inv.description}</div>
                <div style={{ marginTop: 8, fontSize: 10, color: "#2563eb", lineHeight: 1.4 }}>{inv.rateNote}</div>
                <div style={{ fontSize: 10, color: S.dim, marginTop: 4 }}>{inv.techs.join(", ")} | {inv.visits} visit{inv.visits > 1 ? "s" : ""} | {inv.agreement || "none"}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: S.dim, textTransform: "uppercase", marginBottom: 4 }}>Costs</div>
                <table style={{ fontSize: 11, color: S.text, width: "100%" }}><tbody>
                  <tr><td>Labor</td><td style={{ textAlign: "right", fontFamily: "monospace" }}>{f$2(inv.labor)}</td></tr>
                  <tr><td>Parts</td><td style={{ textAlign: "right", fontFamily: "monospace" }}>{f$2(inv.parts)}</td></tr>
                  <tr><td>Misc</td><td style={{ textAlign: "right", fontFamily: "monospace" }}>{f$2(inv.misc)}</td></tr>
                  {inv.travelLabor && <tr><td style={{ color: "#2563eb" }}>↳ Travel</td><td style={{ textAlign: "right", fontFamily: "monospace", color: "#2563eb" }}>{f$2(inv.travelLabor)}</td></tr>}
                  {inv.mileage && <tr><td style={{ color: "#2563eb" }}>↳ Mileage</td><td style={{ textAlign: "right", fontFamily: "monospace", color: "#2563eb" }}>{f$2(inv.mileage)}</td></tr>}
                  <tr style={{ borderTop: `1px solid ${S.border}` }}><td style={{ fontWeight: 700, paddingTop: 4 }}>Total</td><td style={{ textAlign: "right", fontFamily: "monospace", color: S.accent, fontWeight: 700, paddingTop: 4 }}>{f$2(inv.total)}</td></tr>
                  {inv.impliedHrs != null && <tr><td style={{ color: S.dim, paddingTop: 4 }}>Implied Hrs</td><td style={{ textAlign: "right", fontFamily: "monospace", paddingTop: 4 }}>{fH(inv.impliedHrs)}</td></tr>}
                  {inv.varDollars > 0 && <tr><td style={{ color: "#dc2626" }}>Excess $</td><td style={{ textAlign: "right", fontFamily: "monospace", color: "#dc2626", fontWeight: 700 }}>{f$(inv.varDollars)}</td></tr>}
                </tbody></table>
              </div>
              <div>
                <div style={{ fontSize: 9, color: S.dim, textTransform: "uppercase", marginBottom: 4 }}>Parts</div>
                {inv.partsDetail.map((p, i) => <div key={i} style={{ fontSize: 10, color: S.text, marginBottom: 2, display: "flex", justifyContent: "space-between" }}><span>{p.desc}</span><span style={{ fontFamily: "monospace" }}>{f$2(p.qty * p.price)}</span></div>)}
                {inv.partsDetail.length === 0 && <div style={{ fontSize: 11, color: S.dim }}>None</div>}
                <div style={{ marginTop: 8 }}>{inv.allFlags.map(f => <Badge key={f} flag={f} />)}</div>
                <div style={{ fontSize: 10, color: "#dc2626", lineHeight: 1.4, marginTop: 4 }}>{inv.flagNotes}</div>
              </div>
            </div>
            <div style={{ marginTop: 8, padding: "4px 8px", background: S.card, borderRadius: 10, fontSize: 10, color: S.dim, border: `1px solid ${S.border}` }}>S/N: {inv.sn} | Unit: {inv.unitId} | {inv.meter > 0 ? inv.meter.toLocaleString() + "h" : "N/A"}</div>
            {(() => { const ck = audit(inv, bl); const flags = ck.filter(c => c.r === "FLAG"); const notes = ck.filter(c => c.r === "NOTE" || c.r === "UNABLE"); return <div style={{ marginTop: 10, padding: 12, background: S.card, borderRadius: 12, border: `1px solid ${S.border}`, boxShadow: S.shadow }}>
              <div style={{ fontSize: 9, color: S.dim, textTransform: "uppercase", letterSpacing: .5, marginBottom: 6, fontWeight: 700 }}>Compliance Checks</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: flags.length + notes.length > 0 ? 8 : 0 }}>
                {ck.map((c, i) => <span key={i} style={{ padding: "3px 10px", borderRadius: 12, fontSize: 9, fontWeight: 600,
                  background: c.r === "PASS" ? "#22813D10" : c.r === "FLAG" ? "#dc262610" : c.r === "UNABLE" ? "#d9770610" : "#4a7fd410",
                  color: c.r === "PASS" ? "#22813D" : c.r === "FLAG" ? "#dc2626" : c.r === "UNABLE" ? "#d97706" : "#4a7fd4",
                  border: `1px solid ${c.r === "PASS" ? "#22813D20" : c.r === "FLAG" ? "#dc262620" : c.r === "UNABLE" ? "#d9770620" : "#4a7fd420"}` }}>
                  {c.r === "PASS" ? "\u2713" : c.r === "FLAG" ? "\u26A0" : c.r === "UNABLE" ? "?" : "\u25CB"} {c.ck}</span>)}
              </div>
              {[...flags, ...notes].map((c, i) => <div key={i} style={{ fontSize: 10, color: c.r === "FLAG" ? "#dc2626" : c.r === "UNABLE" ? "#d97706" : S.dim, marginBottom: 3, lineHeight: 1.4 }}>
                <strong>{c.ck}:</strong> {c.d} <span style={{ fontSize: 8, color: S.dim }}>({c.cf})</span></div>)}
            </div>; })()}
          </td></tr>}
        </React.Fragment>)}</tbody>
      </table>
    </div>
  </div>;
}

function EquipmentView({ data }) {
  const c = data.map(calc); const eq = {};
  c.forEach(i => { if (!eq[i.unitId]) eq[i.unitId] = { id: i.unitId, equip: i.equipment, sn: i.sn, meter: i.meter, site: i.site, invs: [], spend: 0, cats: new Set(), vendors: new Set() }; const e = eq[i.unitId]; e.invs.push(i); e.spend += i.total; e.cats.add(i.category); e.vendors.add(i.vendor); e.meter = Math.max(e.meter, i.meter); });
  const riskColors = { CRITICAL: "#dc2626", HIGH: "#ea580c", ELEVATED: "#d97706", MODERATE: "#4a7fd4", LOW: "#22813D", "INSUFFICIENT DATA": "#8b919e" };
  return <div style={{ display: "grid", gap: 10 }}>
    {Object.values(eq).sort((a, b) => b.spend - a.spend).map(e => {
      const ld = LIFECYCLE_DATA[e.id]; const risk = ld ? lifecycleRisk(ld) : null;
      return <div key={e.id} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: 14, borderLeft: `3px solid ${risk && risk.score >= 6 ? riskColors[risk.level] : e.invs.length > 1 ? "#dc2626" : S.border}`, boxShadow: S.shadow }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div><div style={{ fontSize: 15, fontWeight: 700, color: S.bright }}>{e.equip}</div><div style={{ fontSize: 10, color: S.dim }}>S/N: {e.sn} | {e.id} | {e.meter > 0 ? e.meter.toLocaleString() + "h" : "N/A"}</div></div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: S.accent, fontFamily: "monospace" }}>{f$(e.spend)}</div>
          {ld && <div style={{ fontSize: 9, color: S.dim }}>{ld.lineItems} records | ${(ld.totalSpend/1000).toFixed(0)}K lifecycle</div>}
        </div>
      </div>
      {risk && risk.score > 0 && <div style={{ marginTop: 8, padding: "10px 12px", background: riskColors[risk.level] + "08", border: `1px solid ${riskColors[risk.level]}20`, borderRadius: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: riskColors[risk.level] }}>Lifecycle Risk: {risk.level}</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: riskColors[risk.level], fontFamily: "'JetBrains Mono',monospace" }}>{risk.score}/{risk.max}</span>
          </div>
          <span style={{ fontSize: 9, color: S.dim }}>{risk.years} years of data | {ld.make} {ld.model}</span>
        </div>
        {risk.components.filter(c => c.score > 0).map((c, i) => <div key={i} style={{ fontSize: 10, color: c.score >= 1.5 ? riskColors[risk.level] : S.dim, marginBottom: 2, lineHeight: 1.4 }}>
          <strong>{c.name} ({c.score}/{c.max}):</strong> {c.evidence}
        </div>)}
      </div>}
      {e.meter >= 15000 && !risk && <div style={{ marginTop: 4, padding: "2px 8px", background: "#dc262610", borderRadius: 10, fontSize: 10, color: "#dc2626" }}>Past lifecycle threshold</div>}
      <div style={{ marginTop: 6 }}>{e.invs.map(i => <div key={i.id} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderTop: `1px solid ${S.border}22`, fontSize: 10 }}><span style={{ color: S.accent, fontFamily: "monospace" }}>{i.id}</span><span style={{ color: S.dim }}>{i.workDates}</span><span style={{ color: S.text }}>{i.category}</span><span style={{ color: S.bright, fontFamily: "monospace" }}>{f$(i.total)}</span></div>)}</div>
    </div>; })}
  </div>;
}

// ========== TRANSACTIONS TAB ==========
function TransactionsView({ txns }) {
  const [exp, setExp] = useState(null);
  const totalVol = txns.reduce((s, t) => s + t.totalPrice, 0);
  const totalSpread = txns.reduce((s, t) => s + (t.spread || 0), 0);
  const totalMarket = txns.reduce((s, t) => s + (t.marketTotal || t.totalPrice), 0);
  const buys = txns.filter(t => t.type === "buy");
  const sells = txns.filter(t => t.type === "sell");
  const categories = {};
  txns.forEach(t => { if (!categories[t.category]) categories[t.category] = { count: 0, vol: 0 }; categories[t.category].count++; categories[t.category].vol += t.totalPrice; });

  return <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginBottom: 16 }}>
      <Stat label="Total Deals" value={txns.length} sub={`${buys.length} buys / ${sells.length} sells`} color="#7c3aed" />
      <Stat label="Transaction Volume" value={f$(totalVol)} color={S.accent} />
      <Stat label="Market Value" value={f$(totalMarket)} sub="Known comps" color="#2563eb" />
      <Stat label="Spread vs Market" value={f$(totalSpread)} sub={totalMarket > 0 ? `${(totalSpread / totalMarket * 100).toFixed(1)}%` : "—"} color={totalSpread >= 0 ? "#16a34a" : "#d97706"} />
      <Stat label="Categories" value={Object.keys(categories).length} sub={Object.entries(categories).map(([k, v]) => `${k}: ${v.count}`).join(", ")} color="#0891b2" />
    </div>

    <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: S.shadow }}>
      <div style={{ fontSize: 10, color: S.dim, textTransform: "uppercase", letterSpacing: .8, marginBottom: 12 }}>Transaction Ledger</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead><tr style={{ borderBottom: `2px solid #7c3aed` }}>
          {["ID", "Date", "Type", "Equipment", "Qty", "Unit $", "Total", "Market", "Spread", "Tags"].map(h =>
            <th key={h} style={{ padding: "6px 8px", textAlign: ["Qty", "Unit $", "Total", "Market", "Spread"].includes(h) ? "right" : "left", color: S.dim, fontSize: 9, textTransform: "uppercase" }}>{h}</th>)}
        </tr></thead>
        <tbody>{txns.map(t => <React.Fragment key={t.id}>
          <tr onClick={() => setExp(exp === t.id ? null : t.id)} style={{ cursor: "pointer", background: exp === t.id ? S.card : "transparent", borderBottom: `1px solid ${S.border}60` }}>
            <td style={{ padding: 8, fontWeight: 700, color: "#7c3aed", fontFamily: "monospace", fontSize: 11 }}>{t.id}</td>
            <td style={{ padding: 8, fontSize: 10, color: S.dim }}>{t.date}</td>
            <td style={{ padding: 8 }}><span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 9, fontWeight: 700, background: t.type === "sell" ? "#16a34a15" : "#2563eb15", color: t.type === "sell" ? "#16a34a" : "#60a5fa", border: `1px solid ${t.type === "sell" ? "#16a34a30" : "#2563eb30"}` }}>{t.type.toUpperCase()}</span></td>
            <td style={{ padding: 8, color: S.text }}>{t.equipment}</td>
            <td style={{ padding: 8, fontFamily: "monospace", textAlign: "right" }}>{t.quantity}</td>
            <td style={{ padding: 8, fontFamily: "monospace", textAlign: "right" }}>{f$(t.unitPrice)}</td>
            <td style={{ padding: 8, fontFamily: "monospace", textAlign: "right", fontWeight: 700, color: S.bright }}>{f$(t.totalPrice)}</td>
            <td style={{ padding: 8, fontFamily: "monospace", textAlign: "right", color: S.dim }}>{t.marketTotal ? f$(t.marketTotal) : "—"}</td>
            <td style={{ padding: 8, fontFamily: "monospace", textAlign: "right", fontWeight: 700, color: t.spread > 0 ? "#16a34a" : t.spread < 0 ? "#d97706" : S.dim }}>{t.spread != null ? (t.spread > 0 ? "+" : "") + f$(t.spread) : "—"}</td>
            <td style={{ padding: 8 }}>{(t.tags || []).slice(0, 2).map(tag => <TxnBadge key={tag} tag={tag} />)}</td>
          </tr>
          {exp === t.id && <tr style={{ background: S.bg }}><td colSpan={10} style={{ padding: "14px 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 9, color: S.dim, textTransform: "uppercase", marginBottom: 4 }}>Details</div>
                <div style={{ fontSize: 11, color: S.text, lineHeight: 1.5 }}>{t.notes}</div>
                <div style={{ fontSize: 10, color: S.dim, marginTop: 6 }}>
                  {t.buyer && <div>Buyer: {t.buyer}</div>}
                  {t.seller && <div>Seller: {t.seller}</div>}
                  {t.source && <div>Source: {t.source}</div>}
                  <div>Category: {t.category}</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: S.dim, textTransform: "uppercase", marginBottom: 4 }}>Comp Analysis</div>
                <table style={{ fontSize: 11, color: S.text, width: "100%" }}><tbody>
                  <tr><td>Sale Price (per unit)</td><td style={{ textAlign: "right", fontFamily: "monospace" }}>{f$(t.unitPrice)}</td></tr>
                  <tr><td>Quantity</td><td style={{ textAlign: "right", fontFamily: "monospace" }}>{t.quantity}</td></tr>
                  <tr style={{ borderTop: `1px solid ${S.border}` }}><td style={{ fontWeight: 700, paddingTop: 4 }}>Transaction Total</td><td style={{ textAlign: "right", fontFamily: "monospace", color: S.accent, fontWeight: 700, paddingTop: 4 }}>{f$(t.totalPrice)}</td></tr>
                  {t.marketValue && <><tr><td style={{ color: S.dim, paddingTop: 8 }}>Market Value (per unit)</td><td style={{ textAlign: "right", fontFamily: "monospace", paddingTop: 8 }}>{f$(t.marketValue)}</td></tr>
                  <tr><td style={{ color: S.dim }}>Market Total</td><td style={{ textAlign: "right", fontFamily: "monospace" }}>{f$(t.marketTotal)}</td></tr></>}
                  {t.spread != null && <tr style={{ borderTop: `1px solid ${S.border}` }}><td style={{ fontWeight: 700, paddingTop: 4, color: t.spread >= 0 ? "#16a34a" : "#d97706" }}>Spread</td><td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 700, paddingTop: 4, color: t.spread >= 0 ? "#16a34a" : "#d97706" }}>{(t.spread > 0 ? "+" : "") + f$(t.spread)} ({t.spreadPct > 0 ? "+" : ""}{t.spreadPct}%)</td></tr>}
                </tbody></table>
                <div style={{ marginTop: 10 }}>{(t.tags || []).map(tag => <TxnBadge key={tag} tag={tag} />)}</div>
              </div>
            </div>
          </td></tr>}
        </React.Fragment>)}</tbody>
      </table>
    </div>

    <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: 16, boxShadow: S.shadow }}>
      <div style={{ fontSize: 10, color: S.dim, textTransform: "uppercase", letterSpacing: .8, marginBottom: 8 }}>Comp Database Purpose</div>
      <div style={{ fontSize: 11, color: S.text, lineHeight: 1.6 }}>
        <p>Every buy/sell transaction feeds proprietary comparison data. Over time, this builds market-rate intelligence for specific equipment categories, engines, and components used in scrap, demolition, recycling, and construction operations.</p>
        <p style={{ marginTop: 6, color: S.dim }}>Track: sale price vs. market value, buyer/seller, source channel, equipment category. The spread column shows where deals fell relative to market — positive means above-market sale, negative means below. Both are useful data points.</p>
      </div>
    </div>
  </div>;
}

function AgreementView() {
  const a = AGREEMENTS.alta, m = AGREEMENTS.micat;
  const compData = [
    { year: "2022", cat: 100, catTUC: 115, alta: null },
    { year: "2023", cat: 110, catTUC: 126.5, alta: null },
    { year: "2024", cat: 120, catTUC: 138, alta: null },
    { year: "2025 (H1)", cat: 130, catTUC: 149.5, alta: null },
    { year: "FY25", cat: null, catTUC: null, alta: 140 },
    { year: "FY26", cat: null, catTUC: null, alta: 154 },
    { year: "FY27", cat: null, catTUC: null, alta: 169.5 },
  ];

  return <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 12 }}>
      {[{ ag: a, label: "Alta Equipment", color: "#60a5fa", statusColor: "#16a34a" }, { ag: m, label: "Michigan CAT", color: "#f59e0b", statusColor: "#dc2626" }, { ag: AGREEMENTS.ais, label: "AIS Construction", color: "#a78bfa", statusColor: "#d97706" }].map(({ ag, label, color, statusColor }) =>
        <div key={label} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: 16, boxShadow: S.shadow, borderLeft: `3px solid ${color}` }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color }}>{label}</div>
            <span style={{ padding: "3px 10px", background: statusColor + "15", borderRadius: 12, fontSize: 10, color: statusColor, fontWeight: 700 }}>{ag.status}</span>
          </div>
          <div style={{ fontSize: 10, color: S.dim, marginTop: 4 }}>{ag.term.start} → {ag.term.end} ({ag.term.months} months)</div>
          <div style={{ fontSize: 10, color: S.dim }}>{ag.payTerms} | Non-solicit: {ag.nonSolicitation}</div>
          {ag.flatRate && <div style={{ fontSize: 11, color, marginTop: 6, fontWeight: 700 }}>Flat Rate: ${ag.flatRate}/hr | Total: ${ag.totalCost?.toLocaleString()}</div>}
        </div>
      )}
    </div>

    <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: S.shadow }}>
      <div style={{ fontSize: 10, color: S.dim, textTransform: "uppercase", letterSpacing: .8, marginBottom: 12 }}>Rate Comparison: Alta vs Michigan CAT</div>
      <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
        <thead><tr style={{ borderBottom: `2px solid ${S.border}` }}>
          {["Term", "Standard Rate", "+TUC/Truck", "All-In Effective", "OT Rate", "Travel", "Guarantee"].map(h => <th key={h} style={{ padding: "6px 8px", textAlign: h === "Term" ? "left" : "right", color: S.dim, fontSize: 9, textTransform: "uppercase" }}>{h}</th>)}
        </tr></thead>
        <tbody>
          <tr style={{ borderBottom: `1px solid ${S.border}` }}><td colSpan={7} style={{ padding: "6px 8px", fontWeight: 700, color: "#f59e0b", fontSize: 10 }}>MICHIGAN CAT (MacAllister) — EXPIRED</td></tr>
          {Object.values(m.rates).map(r => <tr key={r.period} style={{ borderBottom: `1px solid ${S.border}60` }}>
            <td style={{ padding: "5px 8px", color: S.text }}>{r.period}</td>
            <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace" }}>${r.standard}/hr</td>
            <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace", color: "#d97706" }}>+{r.tuc}% TUC</td>
            <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#f59e0b" }}>${(r.standard * 1.15).toFixed(0)}/hr</td>
            <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace" }}>${r.overtime}/hr</td>
            <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace" }}>${r.travel}/hr</td>
            <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace" }}>40h/wk</td>
          </tr>)}
          <tr style={{ borderBottom: `1px solid ${S.border}`, borderTop: `1px solid ${S.border}` }}><td colSpan={7} style={{ padding: "6px 8px", fontWeight: 700, color: "#60a5fa", fontSize: 10 }}>ALTA EQUIPMENT — ACTIVE</td></tr>
          {Object.values(a.rates).map(r => <tr key={r.period} style={{ borderBottom: `1px solid ${S.border}60` }}>
            <td style={{ padding: "5px 8px", color: S.text }}>{r.period}</td>
            <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace" }}>${r.standard}/hr</td>
            <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace", color: "#16a34a" }}>Included</td>
            <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#60a5fa" }}>${r.standard}/hr</td>
            <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace" }}>${r.overtime}/hr</td>
            <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace" }}>${r.travel}/day</td>
            <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace" }}>40h/wk</td>
          </tr>)}
        </tbody>
      </table>
    </div>

    <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: S.shadow }}>
      <div style={{ fontSize: 10, color: S.dim, textTransform: "uppercase", letterSpacing: .8, marginBottom: 12 }}>Rate Escalation Timeline</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={compData}>
          <XAxis dataKey="year" stroke={S.border} tick={{ fill: S.text, fontSize: 9 }} />
          <YAxis domain={[80, 180]} stroke={S.border} tick={{ fill: S.dim, fontSize: 9 }} tickFormatter={v => "$" + v} />
          <Tooltip contentStyle={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, fontSize: 11, color: S.text, boxShadow: S.shadow }} itemStyle={{ color: S.text }} labelStyle={{ color: S.dim }} formatter={(v, n) => [v ? "$" + v + "/hr" : "—", n]} />
          <Bar dataKey="cat" name="MI CAT Base" fill="#f59e0b" radius={[3, 3, 0, 0]} />
          <Bar dataKey="catTUC" name="MI CAT +TUC" fill="#f59e0b55" radius={[3, 3, 0, 0]} />
          <Bar dataKey="alta" name="Alta All-In" fill="#60a5fa" radius={[3, 3, 0, 0]} />
          <Legend wrapperStyle={{ fontSize: 9 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>

    <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: 16, boxShadow: S.shadow }}>
      <div style={{ fontSize: 10, color: S.dim, textTransform: "uppercase", letterSpacing: .8, marginBottom: 8 }}>Analysis</div>
      <div style={{ fontSize: 11, color: S.text, lineHeight: 1.6 }}>
        <p>Michigan CAT's base rate escalated $10/yr ($100 → $130), but the 15% TUC made the effective rate $115 → $149.50. Alta replaced CAT mid-2025 at $140/hr all-in (truck blended). At face value, Alta's FY25 rate ($140) is lower than CAT's final effective rate ($149.50).</p>
        <p style={{ marginTop: 8 }}>The structural difference: CAT billed travel at the hourly rate (potentially more expensive on long-travel days), while Alta charges a flat $140/day for travel. CAT's OT rate ($195) was 16% lower than Alta's ($232). CAT offered shop rates negotiated down from list — Alta's agreement doesn't include shop rates.</p>
        <p style={{ marginTop: 8, color: "#d97706" }}>For audit clients: this convergence is the benchmark. If another scrap fleet's dealer is charging $160+/hr all-in for equivalent service, they're overpaying. If they're at $120 all-in, they've negotiated well. The $135–$145 range is market for Michigan OEM dealer on-site service in 2024–2025.</p>
      </div>
    </div>
  </div>;
}

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
      <button onClick={onExport} className="ic-btn" style={{ padding: "10px 22px", background: S.accent, color: "#fff", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: 700, fontSize: 12, boxShadow: "0 2px 8px rgba(74,127,212,0.25)", transition: "all .15s" }}>⬇ Export All (JSON)</button>
      {!confirmReset
        ? <button onClick={() => setConfirmReset(true)} className="ic-btn" style={{ padding: "10px 22px", background: "#dc262610", color: "#dc2626", border: "1.5px solid #dc262630", borderRadius: 20, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>↺ Reset to Seed Data</button>
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
          <td style={{ padding: "4px 8px", color: d.agreement === "resident" ? "#16a34a" : S.dim }}>{d.agreement || "—"}</td>
          <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "monospace" }}>{c.rate ? "$" + c.rate : "—"}</td>
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
          <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "monospace", color: t.spread >= 0 ? "#16a34a" : "#d97706" }}>{t.spread != null ? f$(t.spread) : "—"}</td>
        </tr>)}
      </tbody></table>
    </div>
  </div>;
}

const TABS = ["Dashboard", "Invoices", "Equipment", "Transactions", "Agreements"];

// localStorage fallback adapter (used when Supabase is not yet configured)
const store = {
  async get(key) { try { const v = localStorage.getItem(key); return v ? { value: v } : null; } catch { return null; } },
  async set(key, val) { try { localStorage.setItem(key, val); return true; } catch { return false; } }
};

export default function App() {
  const [tab, setTab] = useState("Dashboard");
  const [invoices, setInvoices] = useState(SEED_INVOICES);
  const [txns, setTxns] = useState(SEED_TRANSACTIONS);
  const [loaded, setLoaded] = useState(false);
  const [sC, setSC] = useState(0);
  const [tC, setTC] = useState(0);
  const [activeClient, setActiveClient] = useState("all");
  const [clients, setClients] = useState(["Ferrous"]);

  // Benchmark clients — hidden from the audit client dropdown.
  // Their data still powers engine calculations and AI context behind the scenes.
  // Accessible via the gear menu for internal testing.
  const BENCHMARK_CLIENTS = ['Ferrous'];
  const auditClients = clients.filter(c => !BENCHMARK_CLIENTS.includes(c));
  const isBenchmarkMode = BENCHMARK_CLIENTS.includes(activeClient);
  const [showClientAdd, setShowClientAdd] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [showIngest,      setShowIngest]      = useState(false);
  const [showBatchIngest, setShowBatchIngest] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [usingSupabase, setUsingSupabase] = useState(false);

  // ── Data loading: Supabase primary, localStorage fallback ─────────────────
  useEffect(() => {
    (async () => {
      const sbReady = isSupabaseConfigured();
      setUsingSupabase(sbReady);

      if (sbReady) {
        // ── Supabase path ───────────────────────────────────────────────────
        try {
          const [dbInvoices, dbTxns, dbClients] = await Promise.all([
            getAllClientInvoices(),
            getAllClientTransactions(),
            getClients()
          ]);

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
        // ── localStorage fallback path ──────────────────────────────────────
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

  const handleAddClient = async () => {
    const name = newClientName.trim();
    if (!name || clients.includes(name)) return;
    if (usingSupabase) await addClient(name);
    else { const updated = [...clients, name]; await store.set(CLIENT_KEY, JSON.stringify(updated)); }
    setClients(prev => [...prev, name]);
    setActiveClient(name);
    setNewClientName("");
    setShowClientAdd(false);
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

  const handleIngest = async (record) => {
    // Run full audit engine before saving — flags written once, stored permanently
    const audited = runAuditFlags(record, invoices);
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

  // Batch import — NEVER overwrites existing records. Skips any ID already in DB.
  const handleBatchIngest = async (record) => {
    // Run full audit engine before saving — flags written once, stored permanently
    const audited = runAuditFlags(record, invoices);
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

  // Re-audit all existing invoices — updates ENG- flags in Supabase with current baselines.
  // Run this once after initial data load, or whenever the vendor rate table changes.
  // Does NOT re-run automatically on page load.
  const handleReauditAll = async () => {
    setShowAdminMenu(false);
    const count = filteredInvoices.length;
    if (!confirm(`Re-audit all ${count} invoices with the current engine?\n\nThis updates stored flags in Supabase. Manual flags are preserved. This may take up to ${Math.round(count * 0.3)}s.`)) return;

    const reaudited = filteredInvoices.map(inv => runAuditFlags(inv, filteredInvoices));

    if (usingSupabase) {
      for (const inv of reaudited) {
        await saveClientInvoice(inv);
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
    alert(`Re-audit complete — ${reaudited.length} invoices updated with engine findings.`);
  };

  // Client-filtered data
  const filteredInvoices = activeClient === "all" ? invoices : invoices.filter(i => (i.client || "Ferrous") === activeClient);
  const filteredTxns = activeClient === "all" ? txns : txns.filter(t => (t.client || "Ferrous") === activeClient);
  const tot = filteredInvoices.reduce((s, i) => s + i.parts + i.labor + i.misc, 0);
  const txnVol = filteredTxns.reduce((s, t) => s + t.totalPrice, 0);

  return <div style={{ background: S.bg, minHeight: "100vh", color: S.text, fontFamily: "'Nunito Sans','SF Pro Display',-apple-system,sans-serif" }}>
    <div style={{ borderBottom: `1px solid ${S.border}`, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: S.card, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 10, background: `linear-gradient(135deg,${S.accent},#3a6ab8)`, boxShadow: "0 2px 6px rgba(74,127,212,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#fff" }}>I</div>
        <div><div style={{ fontSize: 13, fontWeight: 700, letterSpacing: .5 }}>IRONCLAD FLEET INTELLIGENCE</div>
          <div style={{ fontSize: 8, color: S.dim, letterSpacing: 1.2, textTransform: "uppercase" }}>Scrap · Demolition · Recycling</div></div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 9, color: S.dim, textTransform: "uppercase", letterSpacing: .5 }}>Client:</span>
          <select value={activeClient} onChange={e => setActiveClient(e.target.value)}
            style={{ background: isBenchmarkMode ? "#d9770610" : S.card, border: `1.5px solid ${isBenchmarkMode ? S.yellow : activeClient !== "all" ? S.accent : S.border}`, borderRadius: 10, color: isBenchmarkMode ? S.yellow : activeClient !== "all" ? S.accent : S.text, fontSize: 11, padding: "4px 8px", outline: "none", fontWeight: 600, cursor: "pointer" }}>
            <option value="all">— Select Client —</option>
            {auditClients.map(c => <option key={c} value={c}>{c} ({invoices.filter(i => (i.client || "Ferrous") === c).length})</option>)}
            {isBenchmarkMode && <option value={activeClient}>{activeClient} ★ Benchmark</option>}
          </select>
          {isBenchmarkMode && <span style={{ fontSize: 9, fontWeight: 700, color: S.yellow, textTransform: "uppercase", letterSpacing: .5 }}>★ Benchmark Mode</span>}
          <button onClick={() => setShowClientAdd(!showClientAdd)} className="ic-btn" style={{ padding: "4px 12px", background: showClientAdd ? "#dc2626" : S.accent + "10", border: `1.5px solid ${showClientAdd ? "#dc2626" : S.accent}30`, borderRadius: 16, color: showClientAdd ? "#fff" : S.accent, fontSize: 10, cursor: "pointer", fontWeight: 700 }}>{showClientAdd ? "×" : "+ New"}</button>
          <button onClick={() => setShowIngest(true)} className="ic-btn" style={{ padding: "6px 14px", background: S.accent, color: "#fff", border: "none", borderRadius: 16, fontSize: 10, cursor: "pointer", fontWeight: 700, boxShadow: "0 2px 6px rgba(74,127,212,0.25)", marginLeft: 8 }}>📄 Ingest Invoice</button>
          <button onClick={() => setShowBatchIngest(true)} className="ic-btn" style={{ padding: "6px 14px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 16, fontSize: 10, cursor: "pointer", fontWeight: 700, boxShadow: "0 2px 6px rgba(22,163,74,0.25)" }}>📂 Batch Import</button>
        </div>
        <div style={{ fontSize: 10, color: S.dim, textAlign: "right" }}>
          <div>{filteredInvoices.length} invoices · {filteredTxns.length} deals | {f$(tot)} R&M</div>
          <div style={{ color: usingSupabase ? "#16a34a" : "#d97706", fontSize: 9 }}>
            ● {usingSupabase ? "v7.0 — Supabase · Multi-Client · RAG" : "v7.0 — Local mode (Supabase not configured)"}
          </div>
        </div>
        {/* Admin gear menu */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowAdminMenu(v => !v)}
            style={{ background: "transparent", border: `1px solid ${S.border}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 14, color: S.dim, lineHeight: 1 }}
            title="Admin"
          >⚙</button>
          {showAdminMenu && <>
            <div onClick={() => setShowAdminMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 299 }} />
            <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 300, minWidth: 200, overflow: "hidden" }}>
              <div style={{ padding: "8px 14px", fontSize: 9, color: S.dim, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1px solid ${S.border}` }}>Admin</div>
              <div style={{ padding: "4px 0" }}>
                <button onClick={handleExport} style={{ display: "block", width: "100%", padding: "9px 14px", background: "none", border: "none", textAlign: "left", fontSize: 12, color: S.text, cursor: "pointer" }}>⬇ Export All Data (JSON)</button>
                <div style={{ height: 1, background: S.border, margin: "4px 14px" }} />
                {BENCHMARK_CLIENTS.map(bc => (
                  <button key={bc} onClick={() => { setActiveClient(bc); setShowAdminMenu(false); }}
                    style={{ display: "block", width: "100%", padding: "9px 14px", background: "none", border: "none", textAlign: "left", fontSize: 12, color: S.yellow, cursor: "pointer" }}>
                    ★ View Benchmark Data ({bc})
                  </button>
                ))}
                <div style={{ height: 1, background: S.border, margin: "4px 14px" }} />
                <button onClick={handleReauditAll} style={{ display: "block", width: "100%", padding: "9px 14px", background: "none", border: "none", textAlign: "left", fontSize: 12, color: "#d97706", cursor: "pointer", fontWeight: 600 }}>⚡ Re-Audit All Invoices</button>
                <button onClick={() => { if (confirm("Reset all data to seed invoices? This cannot be undone.")) handleReset(); }} style={{ display: "block", width: "100%", padding: "9px 14px", background: "none", border: "none", textAlign: "left", fontSize: 12, color: "#dc2626", cursor: "pointer" }}>↺ Reset to Seed Data</button>
              </div>
              <div style={{ padding: "8px 14px", borderTop: `1px solid ${S.border}`, fontSize: 9, color: S.dim }}>
                {usingSupabase ? "✓ Supabase connected" : "⚠ Supabase not configured"}<br />
                {invoices.length} invoices · {txns.length} transactions · {clients.length} clients
              </div>
            </div>
          </>}
        </div>
      </div>
    </div>
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
        tab === "Invoices"      ? <InvoiceTable data={filteredInvoices} /> :
        tab === "Equipment"     ? <EquipmentView data={filteredInvoices} /> :
        tab === "Transactions"  ? <TransactionsView txns={filteredTxns} /> :
                                  <AgreementView />}
    </div>
    {showIngest && <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={() => setShowIngest(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.2)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 720, zIndex: 201 }}>
        <IngestPanel
          knownVendors={[...new Set(invoices.map(i => i.vendor))]}
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
          knownVendors={[...new Set(invoices.map(i => i.vendor))]}
          knownEquipment={invoices.map(i => ({ id: i.unitId, make: i.equipment.split(" ")[0], model: i.equipment.split(" ").slice(1).join(" ") }))}
          activeClient={activeClient !== "all" ? activeClient : "Ferrous"}
          existingIds={invoices.map(i => i.id)}
          onSave={handleBatchIngest}
          onClose={() => setShowBatchIngest(false)}
        />
      </div>
    </div>}
    <AIChatButton onClick={() => setChatOpen(true)} />
    <AIChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
  </div>;
}
