'use client';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { calc, buildBaselines, audit, f$, fP, fH } from '../../lib/engine';
import { S, Stat } from '../ui';

const PC = ["#c45a2d", "#2563eb", "#16a34a", "#d97706", "#7c3aed", "#dc2626", "#0891b2"];

export default function Dashboard({ data, txns, activeClient }) {
  if (activeClient === "all") return (
    <div style={{ textAlign: "center", padding: 80 }}>
      <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>📊</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: S.bright, marginBottom: 8 }}>Select a client to view audit results</div>
      <div style={{ fontSize: 13, color: S.dim, maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>
        Use the client dropdown to select an audit client. Dashboard, invoices, and equipment views will filter to that client's data.
      </div>
    </div>
  );

  if (data.length === 0) return (
    <div style={{ textAlign: "center", padding: 80 }}>
      <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>📂</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: S.bright, marginBottom: 8 }}>No invoices yet for this client</div>
      <div style={{ fontSize: 13, color: S.dim, maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>
        Use ★ New Audit or Batch Import to add invoices.
      </div>
    </div>
  );

  const c = useMemo(() => data.map(calc), [data]);
  const bl = useMemo(() => buildBaselines(data), [data]);

  const tot = c.reduce((s, i) => s + i.total, 0);
  const lab = c.reduce((s, i) => s + i.labor, 0);
  const pts = c.reduce((s, i) => s + i.parts, 0);
  const actionFlags = c.filter(i => i.flags.some(f =>
    ["MISDIAGNOSIS","EXCESSIVE-LABOR","HIGH-LABOR","LABOR-HEAVY","HIGHEST-COST","PHANTOM-PART"].includes(f)
  )).length;
  const allAudits = c.map(i => audit(i, bl));
  const complianceFlags = allAudits.reduce((s, ck) => s + ck.filter(c => c.r === "FLAG").length, 0);
  const compliancePass  = allAudits.reduce((s, ck) => s + ck.filter(c => c.r === "PASS").length, 0);
  const impH = c.filter(i => i.impliedHrs != null).reduce((s, i) => s + i.impliedHrs, 0);
  const expH = c.filter(i => i.midHrs != null).reduce((s, i) => s + i.midHrs, 0);
  const excessH       = c.filter(i => i.variance != null && i.variance > 0).reduce((s, i) => s + i.variance, 0);
  const excessDollars = c.filter(i => i.varDollars != null && i.varDollars > 0).reduce((s, i) => s + i.varDollars, 0);
  const statFlags     = allAudits.reduce((s, ck) => s + ck.filter(c =>
    ["Hours vs Category","Cost vs Category","Rate vs Baseline","Repeat Repair"].includes(c.ck) && c.r === "FLAG"
  ).length, 0);
  const vendors = [...new Set(c.map(i => i.vendor))];
  const equip   = [...new Set(c.map(i => i.unitId))];
  const catD = {}; c.forEach(i => { catD[i.category] = (catD[i.category] || 0) + i.total; });
  const pie = Object.entries(catD).map(([name, value]) => ({ name, value }));
  const eqD = {}; c.forEach(i => {
    if (!eqD[i.unitId]) eqD[i.unitId] = { name: i.equipment.length > 20 ? i.equipment.slice(0,20) : i.equipment, spend: 0 };
    eqD[i.unitId].spend += i.total;
  });
  const eqBar = Object.values(eqD).sort((a, b) => b.spend - a.spend).slice(0, 8);
  const vD = {}; c.forEach(i => {
    if (!vD[i.vendor]) vD[i.vendor] = { name: i.vendor.replace(" Equipment","").replace(" (MacAllister Machinery)",""), spend: 0 };
    vD[i.vendor].spend += i.total;
  });
  const txnVol    = txns.reduce((s, t) => s + t.totalPrice, 0);
  const txnSpread = txns.reduce((s, t) => s + (t.spread || 0), 0);
  const ttConfig  = { contentStyle: { background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, fontSize: 11, color: S.text, boxShadow: S.shadow }, itemStyle: { color: S.text }, labelStyle: { color: S.dim } };

  return (
    <div>
      {excessDollars > 0 && (
        <div style={{ background: "#dc262608", border: "2px solid #dc262630", borderRadius: 14, padding: "20px 24px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, color: "#dc2626", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Identified Cost Exposure</div>
            <div style={{ fontSize: 11, color: S.dim, marginTop: 2 }}>
              {excessH.toFixed(1)} excess hours across {c.filter(i => i.variance != null && i.variance > 0).length} invoices
              {statFlags > 0 ? ` · ${statFlags} statistical outlier${statFlags !== 1 ? "s" : ""} flagged` : ""}
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#dc2626", fontFamily: "'JetBrains Mono',monospace" }}>{f$(excessDollars)}</div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 16 }}>
        <Stat label="R&M Invoiced"    value={f$(tot)}   sub={`${c.length} invoices`}                              color={S.accent} />
        <Stat label="Labor / Parts"   value={tot > 0 ? `${fP(lab/tot*100)} / ${fP(pts/tot*100)}` : "— / —"} sub={`${f$(lab)} / ${f$(pts)}`} color="#ea580c" />
        <Stat label="Implied Hours"   value={fH(impH)}  sub={`vs ${fH(expH)} expected`}                          color="#2563eb" />
        <Stat label="Audit Findings"  value={`${actionFlags} + ${complianceFlags}`} sub={`${actionFlags} manual | ${complianceFlags} compliance | ${compliancePass} passed`} color="#dc2626" />
        <Stat label="Vendors / Equip" value={`${vendors.length} / ${equip.length}`} sub={vendors.join(", ")}     color="#16a34a" />
        <Stat label="Txn Volume"      value={f$(txnVol)} sub={`${txns.length} deals | Spread: ${f$(txnSpread)}`} color="#7c3aed" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {[
          { title: "Equipment Spend", chart: (
            <BarChart data={eqBar} layout="vertical" margin={{ left: 95 }}>
              <XAxis type="number" tickFormatter={v => "$" + (v/1000).toFixed(1)+"k"} stroke={S.border} tick={{ fill: S.dim, fontSize: 9 }} />
              <YAxis type="category" dataKey="name" stroke={S.border} tick={{ fill: S.text, fontSize: 9 }} width={90} />
              <Tooltip formatter={v => f$(v)} {...ttConfig} />
              <Bar dataKey="spend" fill={S.accent} radius={[0,3,3,0]} />
            </BarChart>
          )},
          { title: "Category Spend", chart: (
            <PieChart>
              <Pie data={pie} cx="50%" cy="50%" outerRadius={70} innerRadius={35} dataKey="value" stroke={S.bg} strokeWidth={2}>
                {pie.map((_, i) => <Cell key={i} fill={PC[i % PC.length]} />)}
              </Pie>
              <Tooltip formatter={v => f$(v)} {...ttConfig} />
              <Legend wrapperStyle={{ fontSize: 9 }} />
            </PieChart>
          )},
          { title: "Vendor Spend", chart: (
            <BarChart data={Object.values(vD)} margin={{ bottom: 40 }}>
              <XAxis dataKey="name" stroke={S.border} tick={{ fill: S.text, fontSize: 8 }} angle={-25} textAnchor="end" interval={0} />
              <YAxis tickFormatter={v => "$"+(v/1000).toFixed(0)+"k"} stroke={S.border} tick={{ fill: S.dim, fontSize: 9 }} />
              <Tooltip formatter={v => f$(v)} {...ttConfig} />
              <Bar dataKey="spend" fill="#2563eb" radius={[3,3,0,0]} />
            </BarChart>
          )},
        ].map(({ title, chart }) => (
          <div key={title} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: 14, boxShadow: S.shadow }}>
            <div style={{ fontSize: 10, color: S.dim, textTransform: "uppercase", marginBottom: 10 }}>{title}</div>
            <ResponsiveContainer width="100%" height={200}>{chart}</ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
}
