"use client";
import { useState } from "react";
import { extractTextFromPDF, extractFields, validateExtraction } from "../lib/ocr";
import { CATEGORIES } from "../lib/engine";

const S = { bg: "#f0f1f5", card: "#ffffff", border: "#d5d8e0", accent: "#4a7fd4", text: "#3a3f4b", dim: "#8b919e", bright: "#1d2028", shadow: "0 1px 3px rgba(0,0,0,0.06)", green: "#22813D", red: "#dc2626", yellow: "#d97706" };
const inp = { width: "100%", boxSizing: "border-box", background: S.bg, border: `1px solid ${S.border}`, borderRadius: 10, color: S.bright, fontSize: 13, padding: "8px 12px", outline: "none", fontFamily: "inherit" };

export default function IngestPanel({ knownVendors, knownEquipment, activeClient, existingIds, onSave, onClose }) {
  const [stage, setStage] = useState("upload"); // upload, extracting, review, saved
  const [rawText, setRawText] = useState("");
  const [fields, setFields] = useState(null);
  const [checks, setChecks] = useState([]);
  const [error, setError] = useState("");

  // Editable review fields
  const [form, setForm] = useState({
    id: "", date: "", workDates: "", equipment: "", sn: "", unitId: "", meter: 0,
    site: "", category: "", description: "", vendor: "", agreement: "none",
    techs: "", visits: 1, parts: 0, labor: 0, misc: 0, notes: ""
  });

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    setStage("extracting");
    try {
      const result = await extractTextFromPDF(file);
      setRawText(result.fullText);
      const ext = extractFields(result.fullText, knownVendors, knownEquipment);
      setFields(ext);
      const val = validateExtraction(ext);
      setChecks(val);

      // Pre-fill form from extraction
      setForm(prev => ({
        ...prev,
        id: ext.invoiceNumber?.value || "",
        date: ext.date?.value || "",
        workDates: ext.workDates?.value || "",
        equipment: ext.equipment?.value || "",
        sn: ext.sn?.value || "",
        vendor: ext.vendor?.value || "",
        meter: ext.meter?.value || 0,
        labor: ext.labor?.value || 0,
        parts: ext.parts?.value || 0,
        total: ext.total?.value || 0,
      }));
      setStage("review");
    } catch (e) {
      setError(`Extraction failed: ${e.message}. Try a different PDF or enter manually.`);
      setStage("upload");
    }
  };

  const handleManualStart = () => {
    setFields(null);
    setChecks([]);
    setRawText("");
    setStage("review");
  };

  const handleConfirmSave = () => {
    if (!form.id || !form.vendor) {
      setError("Invoice number and vendor are required.");
      return;
    }
    const record = {
      id: form.id,
      date: form.date,
      workDates: form.workDates,
      equipment: form.equipment,
      sn: form.sn,
      unitId: form.unitId || form.sn,
      meter: parseFloat(form.meter) || 0,
      site: form.site,
      category: form.category,
      description: form.description || form.notes,
      techs: form.techs ? form.techs.split(",").map(t => t.trim()) : [],
      visits: parseInt(form.visits) || 1,
      parts: parseFloat(form.parts) || 0,
      labor: parseFloat(form.labor) || 0,
      misc: parseFloat(form.misc) || 0,
      partsDetail: [],
      flags: [],
      flagNotes: "",
      expectedHoursLow: 0,
      expectedHoursHigh: 0,
      vendorType: "unknown",
      vendor: form.vendor,
      agreement: form.agreement,
      client: activeClient || "Ferrous",
      ingested: new Date().toISOString(),
      extractionConfidence: fields ? Object.values(fields).filter(f => f.confidence === "HIGH").length + "/" + Object.values(fields).filter(f => f.confidence).length : "manual"
    };
    onSave(record);
    setStage("saved");
  };

  const updateForm = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const confColor = (c) => c === "HIGH" ? S.green : c === "MEDIUM" ? S.accent : c === "LOW" ? S.yellow : S.dim;
  const confBg = (c) => c === "HIGH" ? "#22813D10" : c === "MEDIUM" ? "#4a7fd410" : c === "LOW" ? "#d9770610" : "#8b919e10";

  return <div style={{ background: S.card, borderRadius: 14, border: `1px solid ${S.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", maxHeight: "85vh", overflowY: "auto" }}>
    <div style={{ padding: "16px 20px", borderBottom: `1px solid ${S.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: S.card, zIndex: 5, borderRadius: "14px 14px 0 0" }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: S.bright }}>Ingest Invoice</div>
        <div style={{ fontSize: 10, color: S.dim }}>
          {stage === "upload" ? "Upload PDF or enter manually" : stage === "extracting" ? "Extracting text..." : stage === "review" ? "Review extracted data — correct any errors before saving" : "Saved to database"}
          {activeClient && activeClient !== "all" && <span style={{ marginLeft: 8, color: S.accent, fontWeight: 600 }}>→ {activeClient}</span>}
        </div>
      </div>
      <button onClick={onClose} style={{ background: S.bg, border: `1.5px solid ${S.border}`, borderRadius: 10, padding: "6px 14px", fontSize: 11, color: S.dim, cursor: "pointer", fontWeight: 600 }}>Close</button>
    </div>

    <div style={{ padding: 20 }}>
      {error && <div style={{ padding: "10px 14px", background: "#dc262608", border: "1px solid #dc262620", borderRadius: 10, color: S.red, fontSize: 12, marginBottom: 14 }}>{error}</div>}

      {/* UPLOAD STAGE */}
      {stage === "upload" && <div>
        <div style={{ border: `2px dashed ${S.border}`, borderRadius: 14, padding: 40, textAlign: "center", marginBottom: 14, cursor: "pointer", background: S.bg }}
          onClick={() => document.getElementById("ic-file-input").click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: S.bright }}>Drop a PDF here or tap to upload</div>
          <div style={{ fontSize: 11, color: S.dim, marginTop: 4 }}>Vendor invoices, work orders, repair estimates</div>
          <input id="ic-file-input" type="file" accept=".pdf" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
        </div>
        <div style={{ textAlign: "center", color: S.dim, fontSize: 11, marginBottom: 14 }}>— or —</div>
        <button onClick={handleManualStart} style={{ width: "100%", padding: 12, background: S.bg, border: `1.5px solid ${S.border}`, borderRadius: 12, color: S.accent, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Enter invoice data manually</button>
      </div>}

      {/* EXTRACTING */}
      {stage === "extracting" && <div style={{ textAlign: "center", padding: 40, color: S.dim }}>
        <div style={{ fontSize: 16, marginBottom: 8 }}>Extracting text from PDF...</div>
        <div style={{ fontSize: 11 }}>Pattern matching against known vendors and equipment library.</div>
      </div>}

      {/* REVIEW STAGE */}
      {stage === "review" && <div>
        {/* Extraction validation results */}
        {checks.length > 0 && <div style={{ marginBottom: 16, padding: 12, background: S.bg, borderRadius: 10, border: `1px solid ${S.border}` }}>
          <div style={{ fontSize: 9, color: S.dim, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>Extraction Checks</div>
          {checks.map((c, i) => <div key={i} style={{ fontSize: 11, marginBottom: 3, display: "flex", gap: 6, alignItems: "baseline" }}>
            <span style={{ color: c.result === "PASS" ? S.green : c.result === "FLAG" ? S.red : S.accent, fontWeight: 700, fontSize: 10 }}>
              {c.result === "PASS" ? "✓" : c.result === "FLAG" ? "⚠" : "○"} {c.check}
            </span>
            <span style={{ color: S.dim, fontSize: 10 }}>{c.detail}</span>
          </div>)}
        </div>}

        {/* Editable form — each field shows extraction source + confidence */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {[
            { key: "id", label: "Invoice Number", required: true },
            { key: "vendor", label: "Vendor", required: true },
            { key: "date", label: "Invoice Date" },
            { key: "workDates", label: "Work Dates" },
            { key: "equipment", label: "Equipment" },
            { key: "sn", label: "Serial Number" },
            { key: "unitId", label: "Unit ID" },
            { key: "site", label: "Site / Location" },
            { key: "meter", label: "Hour Meter", type: "number" },
          ].map(f => <div key={f.key}>
            <div style={{ fontSize: 9, color: f.required ? S.accent : S.dim, textTransform: "uppercase", letterSpacing: .5, marginBottom: 3, fontWeight: 600 }}>
              {f.label} {f.required && "*"}
              {fields && fields[f.key]?.confidence && <span style={{ marginLeft: 6, padding: "1px 6px", borderRadius: 8, fontSize: 8, background: confBg(fields[f.key].confidence), color: confColor(fields[f.key].confidence) }}>{fields[f.key].confidence}</span>}
            </div>
            <input value={form[f.key] || ""} onChange={e => updateForm(f.key, f.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)} type={f.type || "text"} style={inp} />
            {f.key === "id" && form.id && (existingIds || []).includes(form.id) && <div style={{ fontSize: 9, color: S.red, marginTop: 2, fontWeight: 700 }}>⚠ Duplicate: invoice {form.id} already exists in database</div>}
            {fields && fields[f.key]?.source && <div style={{ fontSize: 8, color: S.dim, marginTop: 2, fontStyle: "italic" }}>{fields[f.key].source}</div>}
          </div>)}
          <div>
            <div style={{ fontSize: 9, color: S.dim, textTransform: "uppercase", letterSpacing: .5, marginBottom: 3, fontWeight: 600 }}>Repair Category</div>
            <select value={form.category} onChange={e => updateForm("category", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
              <option value="">— Select category —</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
          {[
            { key: "labor", label: "Labor ($)", type: "number" },
            { key: "parts", label: "Parts ($)", type: "number" },
            { key: "misc", label: "Misc ($)", type: "number" },
          ].map(f => <div key={f.key}>
            <div style={{ fontSize: 9, color: S.dim, textTransform: "uppercase", letterSpacing: .5, marginBottom: 3, fontWeight: 600 }}>
              {f.label}
              {fields && fields[f.key]?.confidence && <span style={{ marginLeft: 6, padding: "1px 6px", borderRadius: 8, fontSize: 8, background: confBg(fields[f.key].confidence), color: confColor(fields[f.key].confidence) }}>{fields[f.key].confidence}</span>}
            </div>
            <input value={form[f.key] || ""} onChange={e => updateForm(f.key, parseFloat(e.target.value) || 0)} type="number" style={{ ...inp, fontFamily: "monospace" }} />
          </div>)}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 9, color: S.dim, textTransform: "uppercase", letterSpacing: .5, marginBottom: 3, fontWeight: 600 }}>Visits</div>
            <input value={form.visits} onChange={e => updateForm("visits", parseInt(e.target.value) || 1)} type="number" style={inp} />
          </div>
          <div>
            <div style={{ fontSize: 9, color: S.dim, textTransform: "uppercase", letterSpacing: .5, marginBottom: 3, fontWeight: 600 }}>Techs (comma-separated)</div>
            <input value={form.techs} onChange={e => updateForm("techs", e.target.value)} style={inp} />
          </div>
          <div>
            <div style={{ fontSize: 9, color: S.dim, textTransform: "uppercase", letterSpacing: .5, marginBottom: 3, fontWeight: 600 }}>Agreement</div>
            <select value={form.agreement} onChange={e => updateForm("agreement", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
              <option value="none">None</option>
              <option value="resident">Resident (Alta)</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: S.dim, textTransform: "uppercase", letterSpacing: .5, marginBottom: 3, fontWeight: 600 }}>Description / Notes</div>
          <textarea value={form.description} onChange={e => updateForm("description", e.target.value)} rows={3}
            style={{ ...inp, resize: "vertical", fontFamily: "inherit" }} placeholder="Describe the repair, diagnostic steps, findings..." />
        </div>

        {/* Raw text preview */}
        {rawText && <details style={{ marginBottom: 14 }}>
          <summary style={{ fontSize: 10, color: S.dim, cursor: "pointer", marginBottom: 4 }}>View raw extracted text ({rawText.length} chars)</summary>
          <div style={{ padding: 10, background: S.bg, borderRadius: 8, fontSize: 10, color: S.text, fontFamily: "monospace", maxHeight: 200, overflowY: "auto", whiteSpace: "pre-wrap", lineHeight: 1.4 }}>{rawText}</div>
        </details>}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleConfirmSave} style={{ flex: 1, padding: 14, background: S.accent, color: "#fff", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(74,127,212,0.25)" }}>
            Confirm & Save to Database
          </button>
          <button onClick={() => { setStage("upload"); setFields(null); setChecks([]); setError(""); }} style={{ padding: "14px 20px", background: S.bg, border: `1.5px solid ${S.border}`, borderRadius: 14, fontSize: 12, color: S.dim, cursor: "pointer", fontWeight: 600 }}>
            Start Over
          </button>
        </div>
      </div>}

      {/* SAVED */}
      {stage === "saved" && <div style={{ textAlign: "center", padding: 30 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: S.green }}>Invoice saved to database</div>
        <div style={{ fontSize: 12, color: S.dim, marginTop: 4 }}>
          {form.id} — {form.vendor} — {form.equipment || "Unknown equipment"}
          {activeClient && activeClient !== "all" && <span> — tagged to {activeClient}</span>}
        </div>
        <div style={{ fontSize: 11, color: S.dim, marginTop: 8 }}>Compliance checks and baseline comparisons are now running on this invoice.</div>
        <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "center" }}>
          <button onClick={() => { setStage("upload"); setForm({ id:"",date:"",workDates:"",equipment:"",sn:"",unitId:"",meter:0,site:"",category:"",description:"",vendor:"",agreement:"none",techs:"",visits:1,parts:0,labor:0,misc:0,notes:"" }); setFields(null); setChecks([]); setError(""); }}
            style={{ padding: "10px 20px", background: S.accent, color: "#fff", border: "none", borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Ingest Another
          </button>
          <button onClick={onClose} style={{ padding: "10px 20px", background: S.bg, border: `1.5px solid ${S.border}`, borderRadius: 12, fontSize: 12, color: S.dim, cursor: "pointer", fontWeight: 600 }}>
            Done
          </button>
        </div>
      </div>}
    </div>
  </div>;
}
