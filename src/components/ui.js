'use client';
/**
 * Shared UI constants and micro-components.
 * Imported by all view components so S, Badge, Stat stay in sync.
 */
import { FLAG_META, TXN_TAG_META } from '../lib/engine';

export const S = {
  bg: "#f0f1f5", card: "#ffffff", border: "#d5d8e0", accent: "#4a7fd4",
  text: "#3a3f4b", dim: "#8b919e", bright: "#1d2028",
  shadow: "0 1px 3px rgba(0,0,0,0.06)", yellow: "#d97706",
};

export function Badge({ flag }) {
  const m = FLAG_META[flag] || { c: "#6b7280", l: flag };
  return (
    <span style={{ display: "inline-block", padding: "2px 9px", borderRadius: 12, fontSize: 9,
      fontWeight: 700, marginRight: 3, marginBottom: 2,
      background: m.c + "15", color: m.c, border: `1px solid ${m.c}30` }}>
      {m.l}
    </span>
  );
}

export function TxnBadge({ tag }) {
  const m = TXN_TAG_META[tag] || { c: "#6b7280", l: tag };
  return (
    <span style={{ display: "inline-block", padding: "2px 9px", borderRadius: 12, fontSize: 9,
      fontWeight: 700, marginRight: 3, marginBottom: 2,
      background: m.c + "15", color: m.c, border: `1px solid ${m.c}30` }}>
      {m.l}
    </span>
  );
}

export function Stat({ label, value, sub, color }) {
  return (
    <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14,
      padding: "14px 16px", borderLeft: `3px solid ${color || S.border}`, boxShadow: S.shadow }}>
      <div style={{ fontSize: 10, color: S.dim, textTransform: "uppercase", letterSpacing: .8, marginBottom: 5 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || S.bright, fontFamily: "'JetBrains Mono',monospace" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: S.dim, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}
