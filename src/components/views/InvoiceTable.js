'use client';
import React, { useState, useMemo } from 'react';
import { calc, buildBaselines, audit, f$, f$2, fH } from '../../lib/engine';
import { S, Badge } from '../ui';

export const RESOLUTION_FLAGS = ["RESOLVED", "DISPUTED", "CREDITED"];
export const RESOLUTION_META = {
  RESOLVED: { label: "Resolved", color: "#16a34a", bg: "#16a34a12" },
  DISPUTED: { label: "Disputed", color: "#d97706", bg: "#d9770612" },
  CREDITED: { label: "Credited", color: "#2563eb", bg: "#2563eb12" },
};

export default function InvoiceTable({ data, vendors = [], onSaveResolution }) {
  const [exp,    setExp]    = useState(null);
  const [filt,   setFilt]   = useState("all");
  const [sortBy, setSortBy] = useState("flags");

  const c  = useMemo(() => data.map(inv => calc(inv, vendors)), [data, vendors]);
  const bl = useMemo(() => buildBaselines(data), [data]);

  const filtered = filt === "all"      ? c
    : filt === "flagged"               ? c.filter(i => (i.flags||[]).some(f => f.startsWith("ENG-")))
    : filt === "resolved"              ? c.filter(i => (i.allFlags||[]).includes("RESOLVED"))
    : filt === "disputed"              ? c.filter(i => (i.allFlags||[]).includes("DISPUTED"))
    : c.filter(i => i.vendor === filt || (i.allFlags||[]).includes(filt));

  const shown = [...filtered].sort((a, b) => {
    if (sortBy === "flags") {
      const diff = (b.flags||[]).filter(f=>f.startsWith("ENG-")).length - (a.flags||[]).filter(f=>f.startsWith("ENG-")).length;
      if (diff !== 0) return diff;
    }
    if (sortBy === "total") return b.total - a.total;
    return new Date(b.date) - new Date(a.date);
  });

  const engFlagCount = c.filter(i => (i.flags||[]).some(f => f.startsWith("ENG-"))).length;
  const vendorList   = [...new Set(data.map(i => i.vendor))];
  const filters      = ["all", "flagged", "disputed", "resolved", ...vendorList];
  const resolutionOf = inv => RESOLUTION_FLAGS.find(rf => (inv.allFlags||[]).includes(rf));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4, flex: 1, flexWrap: "wrap" }}>
          {filters.map(f => {
            const count = f==="all" ? c.length : f==="flagged" ? engFlagCount
              : f==="disputed" ? c.filter(i=>(i.allFlags||[]).includes("DISPUTED")).length
              : f==="resolved" ? c.filter(i=>(i.allFlags||[]).includes("RESOLVED")).length
              : c.filter(i=>i.vendor===f).length;
            const active = filt === f;
            const ac = f==="flagged"?"#dc2626":f==="disputed"?"#d97706":f==="resolved"?"#16a34a":S.accent;
            return (
              <button key={f} onClick={() => setFilt(f)} className="ic-btn" style={{
                padding: "5px 12px", borderRadius: 20, fontSize: 10, cursor: "pointer",
                fontWeight: active ? 700 : 500, transition: "all .15s",
                border: `1.5px solid ${active ? ac : S.border}`,
                background: active ? ac+"12" : "transparent",
                color: active ? ac : S.dim,
              }}>
                {f==="all"?`All (${count})`:f==="flagged"?`⚑ Flagged (${count})`:f==="disputed"?`⚠ Disputed (${count})`:f==="resolved"?`✓ Resolved (${count})`:`${f} (${count})`}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 9, color: S.dim, textTransform: "uppercase", letterSpacing: .5 }}>Sort:</span>
          {[["flags","Flags↑"],["total","Total↑"],["date","Date↑"]].map(([v,l]) => (
            <button key={v} onClick={() => setSortBy(v)} className="ic-btn" style={{
              padding: "3px 9px", borderRadius: 12, fontSize: 9, cursor: "pointer",
              border: `1px solid ${sortBy===v?S.accent:S.border}`,
              background: sortBy===v?S.accent+"15":"transparent",
              color: sortBy===v?S.accent:S.dim, fontWeight: sortBy===v?700:400,
            }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead><tr style={{ borderBottom: `2px solid ${S.accent}30` }}>
            {["Flags","Vendor","Total","Δ hrs","Invoice","Date","Equipment","Labor","Status"].map(h =>
              <th key={h} style={{ padding: "6px 8px", textAlign: ["Total","Δ hrs","Labor"].includes(h)?"right":"left", color: S.dim, fontSize: 9, textTransform: "uppercase", letterSpacing: .5 }}>{h}</th>
            )}
          </tr></thead>
          <tbody>
            {shown.map(inv => {
              const resolution = resolutionOf(inv);
              const engFlags   = (inv.flags||[]).filter(f => f.startsWith("ENG-"));
              const hasFinding = engFlags.length > 0;
              return (
                <React.Fragment key={inv.id}>
                  <tr onClick={() => setExp(exp===inv.id?null:inv.id)} style={{
                    cursor: "pointer", borderBottom: `1px solid ${S.border}60`,
                    background: exp===inv.id ? S.card : hasFinding ? "#dc262604" : "transparent",
                    borderLeft: hasFinding ? "3px solid #dc262640" : "3px solid transparent",
                  }}>
                    <td style={{ padding: "7px 8px", minWidth: 90 }}>
                      {engFlags.slice(0,2).map(f => <Badge key={f} flag={f} />)}
                      {engFlags.length > 2 && <span style={{ fontSize: 9, color: S.dim }}>+{engFlags.length-2}</span>}
                      {engFlags.length === 0 && <span style={{ fontSize: 9, color: "#16a34a" }}>✓ Clean</span>}
                    </td>
                    <td style={{ padding: "7px 8px", fontSize: 10, fontWeight: 600, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      color: inv.vendor==="Alta Equipment"?"#60a5fa":inv.vendor==="Michigan CAT (MacAllister Machinery)"?"#34d399":inv.vendor==="RECO Equipment"?"#a78bfa":inv.vendor==="Summit Industrial Services"?"#38bdf8":"#94a3b8" }}>
                      {inv.vendor}{inv.agreement==="resident"?" ★":""}
                    </td>
                    <td style={{ padding: "7px 8px", fontFamily: "monospace", textAlign: "right", fontWeight: 700, color: S.bright, fontSize: 12 }}>{f$(inv.total)}</td>
                    <td style={{ padding: "7px 8px", fontFamily: "monospace", textAlign: "right", fontWeight: 700,
                      color: inv.variance==null?S.dim:inv.variance>3?"#dc2626":inv.variance>1?"#d97706":"#16a34a" }}>
                      {inv.variance!=null?(inv.variance>0?"+":"")+inv.variance.toFixed(1)+"h":"—"}
                    </td>
                    <td style={{ padding: "7px 8px", fontWeight: 600, color: S.accent, fontFamily: "monospace", fontSize: 10 }}>{inv.id}</td>
                    <td style={{ padding: "7px 8px", fontSize: 10, color: S.dim }}>{inv.date}</td>
                    <td style={{ padding: "7px 8px", fontSize: 10, color: S.text, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.equipment}</td>
                    <td style={{ padding: "7px 8px", fontFamily: "monospace", textAlign: "right", fontSize: 10 }}>{f$2(inv.labor)}</td>
                    <td style={{ padding: "7px 8px" }} onClick={e => e.stopPropagation()}>
                      {resolution ? (
                        <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 9, fontWeight: 700,
                          background: RESOLUTION_META[resolution].bg, color: RESOLUTION_META[resolution].color }}>
                          {RESOLUTION_META[resolution].label}
                        </span>
                      ) : hasFinding && onSaveResolution ? (
                        <select defaultValue="" onChange={e => { if (e.target.value) onSaveResolution(inv, e.target.value); e.target.value=""; }}
                          style={{ fontSize: 9, border: `1px solid ${S.border}`, borderRadius: 8, padding: "2px 5px", background: S.card, color: S.dim, cursor: "pointer" }}>
                          <option value="">Mark…</option>
                          <option value="DISPUTED">Disputed</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CREDITED">Credited</option>
                        </select>
                      ) : null}
                    </td>
                  </tr>
                  {exp === inv.id && (
                    <tr style={{ background: S.bg }}>
                      <td colSpan={9} style={{ padding: "14px 20px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                          <div>
                            <div style={{ fontSize: 9, color: S.dim, textTransform: "uppercase", marginBottom: 4 }}>Description</div>
                            <div style={{ fontSize: 11, color: S.text, lineHeight: 1.5 }}>{inv.description}</div>
                            <div style={{ marginTop: 8, fontSize: 10, color: "#2563eb", lineHeight: 1.4 }}>{inv.rateNote}</div>
                            <div style={{ fontSize: 10, color: S.dim, marginTop: 4 }}>{inv.techs.join(", ")} | {inv.visits} visit{inv.visits>1?"s":""} | {inv.agreement||"none"}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 9, color: S.dim, textTransform: "uppercase", marginBottom: 4 }}>Costs</div>
                            <table style={{ fontSize: 11, color: S.text, width: "100%" }}><tbody>
                              <tr><td>Labor</td><td style={{ textAlign: "right", fontFamily: "monospace" }}>{f$2(inv.labor)}</td></tr>
                              <tr><td>Parts</td><td style={{ textAlign: "right", fontFamily: "monospace" }}>{f$2(inv.parts)}</td></tr>
                              <tr><td>Misc</td><td style={{ textAlign: "right", fontFamily: "monospace" }}>{f$2(inv.misc)}</td></tr>
                              <tr style={{ borderTop: `1px solid ${S.border}` }}><td style={{ fontWeight: 700, paddingTop: 4 }}>Total</td><td style={{ textAlign: "right", fontFamily: "monospace", color: S.accent, fontWeight: 700, paddingTop: 4 }}>{f$2(inv.total)}</td></tr>
                              {inv.impliedHrs!=null && <tr><td style={{ color: S.dim, paddingTop: 4 }}>Implied Hrs</td><td style={{ textAlign: "right", fontFamily: "monospace", paddingTop: 4 }}>{fH(inv.impliedHrs)}</td></tr>}
                              {inv.varDollars>0 && <tr><td style={{ color: "#dc2626" }}>Excess $</td><td style={{ textAlign: "right", fontFamily: "monospace", color: "#dc2626", fontWeight: 700 }}>{f$(inv.varDollars)}</td></tr>}
                            </tbody></table>
                          </div>
                          <div>
                            <div style={{ fontSize: 9, color: S.dim, textTransform: "uppercase", marginBottom: 4 }}>Parts</div>
                            {inv.partsDetail.map((p,i) => <div key={i} style={{ fontSize: 10, color: S.text, marginBottom: 2, display: "flex", justifyContent: "space-between" }}><span>{p.desc}</span><span style={{ fontFamily: "monospace" }}>{f$2(p.qty*p.price)}</span></div>)}
                            {inv.partsDetail.length===0 && <div style={{ fontSize: 11, color: S.dim }}>None</div>}
                            <div style={{ marginTop: 8 }}>{inv.allFlags.map(f => <Badge key={f} flag={f} />)}</div>
                            <div style={{ fontSize: 10, color: "#dc2626", lineHeight: 1.4, marginTop: 4 }}>{inv.flagNotes}</div>
                          </div>
                        </div>
                        <div style={{ marginTop: 8, padding: "4px 8px", background: S.card, borderRadius: 10, fontSize: 10, color: S.dim, border: `1px solid ${S.border}` }}>
                          S/N: {inv.sn} | Unit: {inv.unitId} | {inv.meter>0?inv.meter.toLocaleString()+"h":"N/A"}
                        </div>
                        {(() => {
                          const ck = audit(inv, bl);
                          const flags = ck.filter(c => c.r==="FLAG");
                          const notes = ck.filter(c => c.r==="NOTE"||c.r==="UNABLE");
                          return (
                            <div style={{ marginTop: 10, padding: 12, background: S.card, borderRadius: 12, border: `1px solid ${S.border}`, boxShadow: S.shadow }}>
                              <div style={{ fontSize: 9, color: S.dim, textTransform: "uppercase", letterSpacing: .5, marginBottom: 6, fontWeight: 700 }}>Compliance Checks</div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: flags.length+notes.length>0?8:0 }}>
                                {ck.map((c,i) => (
                                  <span key={i} style={{ padding: "3px 10px", borderRadius: 12, fontSize: 9, fontWeight: 600,
                                    background: c.r==="PASS"?"#22813D10":c.r==="FLAG"?"#dc262610":c.r==="UNABLE"?"#d9770610":"#4a7fd410",
                                    color: c.r==="PASS"?"#22813D":c.r==="FLAG"?"#dc2626":c.r==="UNABLE"?"#d97706":"#4a7fd4",
                                    border: `1px solid ${c.r==="PASS"?"#22813D20":c.r==="FLAG"?"#dc262620":c.r==="UNABLE"?"#d9770620":"#4a7fd420"}` }}>
                                    {c.r==="PASS"?"✓":c.r==="FLAG"?"⚠":c.r==="UNABLE"?"?":"○"} {c.ck}
                                  </span>
                                ))}
                              </div>
                              {[...flags,...notes].map((c,i) => (
                                <div key={i} style={{ fontSize: 10, color: c.r==="FLAG"?"#dc2626":c.r==="UNABLE"?"#d97706":S.dim, marginBottom: 3, lineHeight: 1.4 }}>
                                  <strong>{c.ck}:</strong> {c.d} <span style={{ fontSize: 8, color: S.dim }}>({c.cf})</span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
