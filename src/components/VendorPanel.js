/**
 * VendorPanel — Vendor Registry UI
 *
 * Displays all vendors from Supabase vendors table.
 * Allows adding and editing vendor records including rates, agreement status,
 * and contract details. These records drive the audit engine's rate lookups
 * and the "unknown vendor" guard.
 */

"use client";
import { useState } from "react";

const S = {
  bg:     "#f8f9fc",
  card:   "#ffffff",
  border: "#e2e8f0",
  text:   "#1e293b",
  dim:    "#64748b",
  bright: "#0f172a",
  accent: "#4a7fd4",
  green:  "#16a34a",
  red:    "#dc2626",
  yellow: "#d97706",
  purple: "#7c3aed",
};

const AGREEMENT_STATUS_COLORS = {
  ACTIVE:  { bg: "#dcfce7", color: "#15803d", label: "ACTIVE" },
  EXPIRED: { bg: "#fee2e2", color: "#dc2626", label: "EXPIRED" },
  QUOTED:  { bg: "#fef9c3", color: "#b45309", label: "QUOTED" },
  NONE:    { bg: "#f1f5f9", color: "#64748b", label: "NONE" },
};

const CONFIDENCE_COLORS = {
  contract:  { color: "#15803d", label: "Contract" },
  published: { color: "#2563eb", label: "Published" },
  estimated: { color: "#d97706", label: "Estimated" },
};

const EMPTY_VENDOR = {
  id: "",
  name: "",
  vendor_type: "dealer",
  labor_rate: "",
  rate_confidence: "estimated",
  rate_note: "",
  agreement_type: "none",
  agreement_status: "NONE",
  agreement_ref: "",
  agreement_start: "",
  agreement_end: "",
  tech_cert: "",
  notes: "",
  active: true,
};

function Badge({ status }) {
  const meta = AGREEMENT_STATUS_COLORS[status] || AGREEMENT_STATUS_COLORS.NONE;
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 10,
      fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
      background: meta.bg, color: meta.color
    }}>
      {meta.label}
    </span>
  );
}

function ConfidenceDot({ conf }) {
  const meta = CONFIDENCE_COLORS[conf] || CONFIDENCE_COLORS.estimated;
  return (
    <span style={{ color: meta.color, fontSize: 10, fontWeight: 600 }}>
      ● {meta.label}
    </span>
  );
}

function VendorForm({ vendor, onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_VENDOR, ...vendor });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      labor_rate: form.labor_rate !== "" ? parseFloat(form.labor_rate) : null,
      id: form.id || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    };
    await onSave(payload);
    setSaving(false);
  };

  const inp = (label, key, type = "text", opts = {}) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 10, color: S.dim, fontWeight: 600, letterSpacing: 0.3 }}>{label}</label>
      <input
        type={type}
        value={form[key] ?? ""}
        onChange={e => set(key, e.target.value)}
        placeholder={opts.placeholder || ""}
        style={{
          background: S.bg, border: `1.5px solid ${S.border}`, borderRadius: 8,
          color: S.bright, fontSize: 12, padding: "7px 10px", outline: "none",
          fontFamily: "inherit", width: "100%", boxSizing: "border-box"
        }}
      />
    </div>
  );

  const sel = (label, key, options) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 10, color: S.dim, fontWeight: 600, letterSpacing: 0.3 }}>{label}</label>
      <select
        value={form[key] ?? ""}
        onChange={e => set(key, e.target.value)}
        style={{
          background: S.bg, border: `1.5px solid ${S.border}`, borderRadius: 8,
          color: S.bright, fontSize: 12, padding: "7px 10px", outline: "none",
          fontFamily: "inherit", cursor: "pointer"
        }}
      >
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {inp("Vendor Name *", "name", "text", { placeholder: "Alta Equipment" })}
        {sel("Vendor Type", "vendor_type", [
          { v: "dealer", l: "Dealer" },
          { v: "independent", l: "Independent" },
          { v: "other", l: "Other" },
        ])}
      </div>

      {/* Rate section */}
      <div style={{ padding: "12px 14px", background: "#f8faff", border: `1px solid ${S.border}`, borderRadius: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: S.dim, letterSpacing: 0.5, marginBottom: 10, textTransform: "uppercase" }}>Rate Information</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 12 }}>
          {inp("Labor Rate ($/hr)", "labor_rate", "number", { placeholder: "140.00" })}
          {sel("Confidence", "rate_confidence", [
            { v: "contract",  l: "Contract — verified" },
            { v: "published", l: "Published rate" },
            { v: "estimated", l: "Estimated" },
          ])}
          {inp("Rate Note", "rate_note", "text", { placeholder: "e.g. Resident contract FY25 (BP0015900)" })}
        </div>
      </div>

      {/* Agreement section */}
      <div style={{ padding: "12px 14px", background: "#f8faff", border: `1px solid ${S.border}`, borderRadius: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: S.dim, letterSpacing: 0.5, marginBottom: 10, textTransform: "uppercase" }}>Agreement</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          {sel("Agreement Type", "agreement_type", [
            { v: "none",     l: "None" },
            { v: "resident", l: "Resident" },
            { v: "contract", l: "Contract" },
            { v: "expired",  l: "Expired" },
            { v: "quoted",   l: "Quoted" },
          ])}
          {sel("Status", "agreement_status", [
            { v: "NONE",    l: "None" },
            { v: "ACTIVE",  l: "Active" },
            { v: "EXPIRED", l: "Expired" },
            { v: "QUOTED",  l: "Quoted" },
          ])}
          {inp("Contract Ref", "agreement_ref", "text", { placeholder: "BP0015900" })}
          {inp("Tech Cert Required", "tech_cert", "text", { placeholder: "OE324 / CAT Certified" })}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          {inp("Agreement Start", "agreement_start", "date")}
          {inp("Agreement End", "agreement_end", "date")}
        </div>
      </div>

      {/* Notes */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 10, color: S.dim, fontWeight: 600, letterSpacing: 0.3 }}>Notes</label>
        <textarea
          value={form.notes ?? ""}
          onChange={e => set("notes", e.target.value)}
          placeholder="Billing patterns, contact info, watch items..."
          rows={3}
          style={{
            background: S.bg, border: `1.5px solid ${S.border}`, borderRadius: 8,
            color: S.bright, fontSize: 12, padding: "7px 10px", outline: "none",
            fontFamily: "inherit", resize: "vertical", width: "100%", boxSizing: "border-box"
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" onClick={onCancel}
          style={{ padding: "8px 18px", background: "transparent", border: `1.5px solid ${S.border}`, borderRadius: 10, fontSize: 12, color: S.dim, cursor: "pointer" }}>
          Cancel
        </button>
        <button type="submit" disabled={saving}
          style={{ padding: "8px 20px", background: saving ? S.dim : S.accent, color: "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 2px 6px rgba(74,127,212,0.25)" }}>
          {saving ? "Saving..." : vendor.id ? "Save Changes" : "Add Vendor"}
        </button>
      </div>
    </form>
  );
}

export default function VendorPanel({ vendors = [], onSave }) {
  const [showForm, setShowForm] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = vendors.filter(v =>
    !search || v.name.toLowerCase().includes(search.toLowerCase()) ||
    (v.notes || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (v) => {
    setEditVendor(v);
    setShowForm(true);
  };

  const handleNew = () => {
    setEditVendor(null);
    setShowForm(true);
  };

  const handleSave = async (vendor) => {
    await onSave(vendor);
    setShowForm(false);
    setEditVendor(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditVendor(null);
  };

  const activeCount   = vendors.filter(v => v.agreement_status === "ACTIVE").length;
  const expiredCount  = vendors.filter(v => v.agreement_status === "EXPIRED").length;
  const unknownCount  = vendors.filter(v => !v.labor_rate).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: S.bright }}>Vendor Registry</div>
          <div style={{ fontSize: 11, color: S.dim, marginTop: 2 }}>
            {vendors.length} vendors · {activeCount} with active agreements · {expiredCount} expired · {unknownCount} rate unknown
          </div>
        </div>
        <button onClick={handleNew}
          style={{ padding: "8px 18px", background: S.accent, color: "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 6px rgba(74,127,212,0.2)" }}>
          + New Vendor
        </button>
      </div>

      {/* Notice banner when registry is empty */}
      {vendors.length === 0 && !showForm && (
        <div style={{ padding: "16px 20px", background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 10, color: "#92400e", fontSize: 12 }}>
          <strong>Vendor registry is empty.</strong> Run the SQL migration in Supabase first, then reload.
          The engine will not block invoices until vendors are loaded. Once the registry is populated,
          any invoice from an unregistered vendor will be flagged <strong>⚡ Unknown Vendor</strong>.
        </div>
      )}

      {/* Add/edit form */}
      {showForm && (
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: S.bright, marginBottom: 16 }}>
            {editVendor?.id ? `Edit: ${editVendor.name}` : "Add New Vendor"}
          </div>
          <VendorForm vendor={editVendor || {}} onSave={handleSave} onCancel={handleCancel} />
        </div>
      )}

      {/* Search */}
      {vendors.length > 0 && (
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search vendors..."
          style={{
            background: S.card, border: `1.5px solid ${S.border}`, borderRadius: 10,
            color: S.bright, fontSize: 12, padding: "8px 14px", outline: "none",
            fontFamily: "inherit", width: 280, boxSizing: "border-box"
          }}
        />
      )}

      {/* Vendor list */}
      {filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(v => {
            const rateColor = v.labor_rate
              ? (CONFIDENCE_COLORS[v.rate_confidence] || CONFIDENCE_COLORS.estimated).color
              : S.dim;

            return (
              <div key={v.id}
                style={{
                  background: S.card, border: `1px solid ${S.border}`, borderRadius: 12,
                  padding: "14px 18px", display: "flex", alignItems: "flex-start",
                  gap: 16, cursor: "pointer", transition: "box-shadow .15s"
                }}
                onClick={() => handleEdit(v)}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.07)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
              >
                {/* Left: name + type */}
                <div style={{ flex: "0 0 260px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: S.bright }}>{v.name}</div>
                  <div style={{ fontSize: 10, color: S.dim, marginTop: 2, textTransform: "capitalize" }}>
                    {v.vendor_type}
                    {v.tech_cert ? ` · ${v.tech_cert}` : ""}
                  </div>
                </div>

                {/* Rate */}
                <div style={{ flex: "0 0 160px" }}>
                  {v.labor_rate ? (
                    <>
                      <div style={{ fontSize: 14, fontWeight: 700, color: rateColor }}>${parseFloat(v.labor_rate).toFixed(0)}/hr</div>
                      <ConfidenceDot conf={v.rate_confidence} />
                    </>
                  ) : (
                    <div style={{ fontSize: 11, color: S.dim }}>Rate unknown</div>
                  )}
                </div>

                {/* Agreement */}
                <div style={{ flex: "0 0 160px" }}>
                  <Badge status={v.agreement_status} />
                  {v.agreement_ref && (
                    <div style={{ fontSize: 10, color: S.dim, marginTop: 3 }}>{v.agreement_ref}</div>
                  )}
                  {v.agreement_start && v.agreement_end && (
                    <div style={{ fontSize: 10, color: S.dim }}>
                      {v.agreement_start} → {v.agreement_end}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div style={{ flex: 1, fontSize: 11, color: S.dim, lineHeight: 1.5 }}>
                  {v.rate_note && <div style={{ marginBottom: 2, color: S.text }}>{v.rate_note}</div>}
                  {v.notes && <div>{v.notes.length > 120 ? v.notes.slice(0, 120) + "…" : v.notes}</div>}
                </div>

                {/* Edit indicator */}
                <div style={{ fontSize: 11, color: S.accent, whiteSpace: "nowrap", flexShrink: 0, alignSelf: "center" }}>Edit →</div>
              </div>
            );
          })}
        </div>
      )}

      {/* How it works */}
      <div style={{ padding: "14px 18px", background: "#f0f7ff", border: "1px solid #bfdbfe", borderRadius: 10, marginTop: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#1d4ed8", marginBottom: 6 }}>How the Engine Uses This Registry</div>
        <div style={{ fontSize: 11, color: "#1e40af", lineHeight: 1.6 }}>
          Every invoice ingest runs through the audit engine. If the invoice vendor <strong>is not in this registry</strong>, the engine flags it <strong>⚡ Unknown Vendor</strong> and skips rate analysis. Add the vendor here first — with a labor rate and agreement status — before importing their invoices.
          <br />
          The vendor list also feeds into the GPT-4o Vision extraction prompt as a canonical name list, preventing name fragmentation (e.g. "Alta Equipment Company" vs "Alta Equipment").
        </div>
      </div>
    </div>
  );
}
