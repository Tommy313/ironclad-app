'use client';
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AGREEMENTS, f$ } from '../../lib/engine';
import { S, Stat, TxnBadge } from '../ui';

// ── Transactions ──────────────────────────────────────────────────────────────
export function TransactionsView({ txns }) {
  const [exp, setExp] = useState(null);
  const totalVol    = txns.reduce((s, t) => s + t.totalPrice, 0);
  const totalSpread = txns.reduce((s, t) => s + (t.spread || 0), 0);
  const totalMarket = txns.reduce((s, t) => s + (t.marketTotal || t.totalPrice), 0);
  const buys  = txns.filter(t => t.type === "buy");
  const sells = txns.filter(t => t.type === "sell");
  const categories = {};
  txns.forEach(t => { if (!categories[t.category]) categories[t.category] = { count: 0, vol: 0 }; categories[t.category].count++; categories[t.category].vol += t.totalPrice; });

  const ttConfig = { contentStyle: { background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, fontSize: 11, color: S.text, boxShadow: S.shadow }, itemStyle: { color: S.text }, labelStyle: { color: S.dim } };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginBottom: 16 }}>
        <Stat label="Total Deals"        value={txns.length}     sub={`${buys.length} buys / ${sells.length} sells`} color="#7c3aed" />
        <Stat label="Transaction Volume" value={f$(totalVol)}    color={S.accent} />
        <Stat label="Market Value"       value={f$(totalMarket)} sub="Known comps"                                    color="#2563eb" />
        <Stat label="Spread vs Market"   value={f$(totalSpread)} sub={totalMarket>0?`${(totalSpread/totalMarket*100).toFixed(1)}%`:"—"} color={totalSpread>=0?"#16a34a":"#d97706"} />
        <Stat label="Categories"         value={Object.keys(categories).length} sub={Object.entries(categories).map(([k,v])=>`${k}: ${v.count}`).join(", ")} color="#0891b2" />
      </div>
      <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: S.shadow }}>
        <div style={{ fontSize: 10, color: S.dim, textTransform: "uppercase", letterSpacing: .8, marginBottom: 12 }}>Transaction Ledger</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead><tr style={{ borderBottom: "2px solid #7c3aed" }}>
            {["ID","Date","Type","Equipment","Qty","Unit $","Total","Market","Spread","Tags"].map(h =>
              <th key={h} style={{ padding: "6px 8px", textAlign: ["Qty","Unit $","Total","Market","Spread"].includes(h)?"right":"left", color: S.dim, fontSize: 9, textTransform: "uppercase" }}>{h}</th>
            )}
          </tr></thead>
          <tbody>{txns.map(t => (
            <React.Fragment key={t.id}>
              <tr onClick={() => setExp(exp===t.id?null:t.id)} style={{ cursor: "pointer", background: exp===t.id?S.card:"transparent", borderBottom: `1px solid ${S.border}60` }}>
                <td style={{ padding: 8, fontWeight: 700, color: "#7c3aed", fontFamily: "monospace", fontSize: 11 }}>{t.id}</td>
                <td style={{ padding: 8, fontSize: 10, color: S.dim }}>{t.date}</td>
                <td style={{ padding: 8 }}><span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 9, fontWeight: 700, background: t.type==="sell"?"#16a34a15":"#2563eb15", color: t.type==="sell"?"#16a34a":"#60a5fa", border: `1px solid ${t.type==="sell"?"#16a34a30":"#2563eb30"}` }}>{t.type.toUpperCase()}</span></td>
                <td style={{ padding: 8, color: S.text }}>{t.equipment}</td>
                <td style={{ padding: 8, fontFamily: "monospace", textAlign: "right" }}>{t.quantity}</td>
                <td style={{ padding: 8, fontFamily: "monospace", textAlign: "right" }}>{f$(t.unitPrice)}</td>
                <td style={{ padding: 8, fontFamily: "monospace", textAlign: "right", fontWeight: 700, color: S.bright }}>{f$(t.totalPrice)}</td>
                <td style={{ padding: 8, fontFamily: "monospace", textAlign: "right", color: S.dim }}>{t.marketTotal?f$(t.marketTotal):"—"}</td>
                <td style={{ padding: 8, fontFamily: "monospace", textAlign: "right", fontWeight: 700, color: t.spread>0?"#16a34a":t.spread<0?"#d97706":S.dim }}>{t.spread!=null?(t.spread>0?"+":"")+f$(t.spread):"—"}</td>
                <td style={{ padding: 8 }}>{(t.tags||[]).slice(0,2).map(tag => <TxnBadge key={tag} tag={tag} />)}</td>
              </tr>
              {exp===t.id && (
                <tr style={{ background: S.bg }}><td colSpan={10} style={{ padding: "14px 20px" }}>
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
                        {t.marketValue && <>
                          <tr><td style={{ color: S.dim, paddingTop: 8 }}>Market Value (per unit)</td><td style={{ textAlign: "right", fontFamily: "monospace", paddingTop: 8 }}>{f$(t.marketValue)}</td></tr>
                          <tr><td style={{ color: S.dim }}>Market Total</td><td style={{ textAlign: "right", fontFamily: "monospace" }}>{f$(t.marketTotal)}</td></tr>
                        </>}
                        {t.spread!=null && <tr style={{ borderTop: `1px solid ${S.border}` }}><td style={{ fontWeight: 700, paddingTop: 4, color: t.spread>=0?"#16a34a":"#d97706" }}>Spread</td><td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 700, paddingTop: 4, color: t.spread>=0?"#16a34a":"#d97706" }}>{(t.spread>0?"+":"")+f$(t.spread)}</td></tr>}
                      </tbody></table>
                      <div style={{ marginTop: 10 }}>{(t.tags||[]).map(tag => <TxnBadge key={tag} tag={tag} />)}</div>
                    </div>
                  </div>
                </td></tr>
              )}
            </React.Fragment>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ── Agreements (rate reference — internal only) ───────────────────────────────
export function AgreementView() {
  const a = AGREEMENTS.alta, m = AGREEMENTS.micat;
  const compData = [
    { year: "FY23", cat: 110, catTUC: 126.5, alta: null },
    { year: "FY24", cat: 120, catTUC: 138,   alta: null },
    { year: "FY25", cat: 130, catTUC: 149.5, alta: 140 },
    { year: "FY26", cat: null, catTUC: null,  alta: 154 },
    { year: "FY27", cat: null, catTUC: null,  alta: 169.5 },
  ];
  const ttConfig = { contentStyle: { background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, fontSize: 11, color: S.text, boxShadow: S.shadow }, itemStyle: { color: S.text }, labelStyle: { color: S.dim }, formatter: (v, n) => [v ? "$"+v+"/hr" : "—", n] };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 12 }}>
        {[
          { ag: a, label: "Alta Equipment",  color: "#60a5fa", statusColor: "#16a34a" },
          { ag: m, label: "Michigan CAT",    color: "#f59e0b", statusColor: "#dc2626" },
          { ag: AGREEMENTS.ais, label: "AIS Construction", color: "#a78bfa", statusColor: "#d97706" },
        ].map(({ ag, label, color, statusColor }) => (
          <div key={label} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: 16, boxShadow: S.shadow, borderLeft: `3px solid ${color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color }}>{label}</div>
              <span style={{ padding: "3px 10px", background: statusColor+"15", borderRadius: 12, fontSize: 10, color: statusColor, fontWeight: 700 }}>{ag.status}</span>
            </div>
            <div style={{ fontSize: 10, color: S.dim, marginTop: 4 }}>{ag.term.start} → {ag.term.end} ({ag.term.months} months)</div>
            <div style={{ fontSize: 10, color: S.dim }}>{ag.payTerms} | Non-solicit: {ag.nonSolicitation}</div>
          </div>
        ))}
      </div>
      <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: S.shadow }}>
        <div style={{ fontSize: 10, color: S.dim, textTransform: "uppercase", letterSpacing: .8, marginBottom: 12 }}>Rate Escalation Timeline</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={compData}>
            <XAxis dataKey="year" stroke={S.border} tick={{ fill: S.text, fontSize: 9 }} />
            <YAxis domain={[80, 180]} stroke={S.border} tick={{ fill: S.dim, fontSize: 9 }} tickFormatter={v => "$"+v} />
            <Tooltip {...ttConfig} />
            <Bar dataKey="cat"    name="MI CAT Base" fill="#f59e0b" radius={[3,3,0,0]} />
            <Bar dataKey="catTUC" name="MI CAT +TUC" fill="#f59e0b55" radius={[3,3,0,0]} />
            <Bar dataKey="alta"   name="Alta All-In" fill="#60a5fa" radius={[3,3,0,0]} />
            <Legend wrapperStyle={{ fontSize: 9 }} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 12, fontSize: 11, color: S.dim, lineHeight: 1.6 }}>
          Market benchmark: $135–$145/hr all-in for Michigan OEM dealer on-site service (2024–2025). Alta FY25 at $140 is within market. Any audit client paying $160+ all-in for equivalent service is overpaying.
        </div>
      </div>
    </div>
  );
}
