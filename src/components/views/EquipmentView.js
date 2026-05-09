'use client';
import { useMemo } from 'react';
import { calc, lifecycleRisk, LIFECYCLE_DATA, f$ } from '../../lib/engine';
import { S } from '../ui';

const RISK_COLORS = { CRITICAL: "#dc2626", HIGH: "#ea580c", ELEVATED: "#d97706", MODERATE: "#4a7fd4", LOW: "#22813D", "INSUFFICIENT DATA": "#8b919e" };

export default function EquipmentView({ data, vendors = [] }) {
  const c = useMemo(() => data.map(inv => calc(inv, vendors)), [data, vendors]);
  const eq = {};
  c.forEach(i => {
    if (!eq[i.unitId]) eq[i.unitId] = { id: i.unitId, equip: i.equipment, sn: i.sn, meter: i.meter, site: i.site, invs: [], spend: 0, cats: new Set(), vendors: new Set() };
    const e = eq[i.unitId];
    e.invs.push(i); e.spend += i.total; e.cats.add(i.category); e.vendors.add(i.vendor);
    e.meter = Math.max(e.meter, i.meter);
  });

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {Object.values(eq).sort((a, b) => b.spend - a.spend).map(e => {
        const ld   = LIFECYCLE_DATA[e.id];
        const risk = ld ? lifecycleRisk(ld) : null;
        const borderColor = risk && risk.score >= 6 ? RISK_COLORS[risk.level] : e.invs.length > 1 ? "#dc2626" : S.border;
        return (
          <div key={e.id} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: 14, borderLeft: `3px solid ${borderColor}`, boxShadow: S.shadow }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: S.bright }}>{e.equip}</div>
                <div style={{ fontSize: 10, color: S.dim }}>S/N: {e.sn} | {e.id} | {e.meter > 0 ? e.meter.toLocaleString()+"h" : "N/A"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: S.accent, fontFamily: "monospace" }}>{f$(e.spend)}</div>
                {ld && <div style={{ fontSize: 9, color: S.dim }}>{ld.lineItems} records | ${(ld.totalSpend/1000).toFixed(0)}K lifecycle</div>}
              </div>
            </div>
            {risk && risk.score > 0 && (
              <div style={{ marginTop: 8, padding: "10px 12px", background: RISK_COLORS[risk.level]+"08", border: `1px solid ${RISK_COLORS[risk.level]}20`, borderRadius: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: RISK_COLORS[risk.level] }}>Lifecycle Risk: {risk.level}</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: RISK_COLORS[risk.level], fontFamily: "'JetBrains Mono',monospace" }}>{risk.score}/{risk.max}</span>
                  </div>
                  <span style={{ fontSize: 9, color: S.dim }}>{risk.years} years | {ld.make} {ld.model}</span>
                </div>
                {risk.components.filter(c => c.score > 0).map((c, i) => (
                  <div key={i} style={{ fontSize: 10, color: c.score >= 1.5 ? RISK_COLORS[risk.level] : S.dim, marginBottom: 2, lineHeight: 1.4 }}>
                    <strong>{c.name} ({c.score}/{c.max}):</strong> {c.evidence}
                  </div>
                ))}
              </div>
            )}
            {e.meter >= 15000 && !risk && <div style={{ marginTop: 4, padding: "2px 8px", background: "#dc262610", borderRadius: 10, fontSize: 10, color: "#dc2626" }}>Past lifecycle threshold</div>}
            <div style={{ marginTop: 6 }}>
              {e.invs.map(i => (
                <div key={i.id} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderTop: `1px solid ${S.border}22`, fontSize: 10 }}>
                  <span style={{ color: S.accent, fontFamily: "monospace" }}>{i.id}</span>
                  <span style={{ color: S.dim }}>{i.workDates}</span>
                  <span style={{ color: S.text }}>{i.category}</span>
                  <span style={{ color: S.bright, fontFamily: "monospace" }}>{f$(i.total)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
