"use client";
import { useState, useRef, useCallback } from "react";
import { extractTextFromPDF, extractFields } from "../lib/ocr";

const RAG_URL = process.env.NEXT_PUBLIC_RAILWAY_URL;

const S = {
  bg: "#f0f1f5", card: "#ffffff", border: "#d5d8e0", accent: "#4a7fd4",
  text: "#3a3f4b", dim: "#8b919e", bright: "#1d2028",
  green: "#16a34a", red: "#dc2626", yellow: "#d97706", purple: "#7c3aed",
  shadow: "0 1px 3px rgba(0,0,0,0.06)"
};

// Status metadata
const STATUS_META = {
  pending:    { icon: "○", color: S.dim,    label: "Pending"    },
  processing: { icon: "⟳", color: S.accent, label: "Processing" },
  done:       { icon: "✓", color: S.green,  label: "Saved"      },
  skipped:    { icon: "—", color: S.yellow, label: "Skipped"    },
  error:      { icon: "✗", color: S.red,    label: "Error"      },
};

// Fire-and-forget RAG embed (same as IngestPanel)
async function ingestToRAG(record) {
  if (!RAG_URL) return;
  try {
    const payload = {
      id:               record.id,
      date:             record.date,
      work_dates:       record.workDates      || null,
      equipment:        record.equipment      || null,
      serial_number:    record.sn             || null,
      unit_id:          record.unitId         || null,
      meter_hours:      record.meter          ? Math.round(record.meter) : null,
      site:             record.site           || null,
      region:           record.region         || null,
      category:         record.category       || null,
      description:      record.description    || null,
      vendor:           record.vendor         || null,
      agreement_status: record.agreement      || 'none',
      techs:            record.techs          || [],
      visits:           record.visits         || 1,
      parts_total:      parseFloat(record.parts)  || 0,
      labor_total:      parseFloat(record.labor)  || 0,
      misc_total:       parseFloat(record.misc)   || 0,
      flags:            record.flags          || [],
      flag_notes:       record.flagNotes      || null,
      vendor_type:      record.vendorType     || null,
      client:           record.client         || 'Ferrous',
    };
    await fetch(`${RAG_URL}/ingest/invoice`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('[BatchIngest] RAG embed failed (non-blocking):', err.message);
  }
}

// Build a saveable invoice record from extracted fields
function buildRecord(ext, file, activeClient, index) {
  const invoiceId = ext.invoiceNumber?.value || `batch-${Date.now()}-${index}`;
  return {
    id:          invoiceId,
    date:        ext.date?.value        || "",
    workDates:   ext.workDates?.value   || "",
    equipment:   ext.equipment?.value   || "",
    sn:          ext.sn?.value          || "",
    unitId:      ext.unitId?.value      || ext.sn?.value || "",
    meter:       parseFloat(ext.meter?.value)  || 0,
    site:        ext.site?.value        || "",
    region:      "",
    category:    "",
    description: ext.description?.value || "",
    techs:       ext.techs?.value
                   ? ext.techs.value.split(",").map(t => t.trim()).filter(Boolean)
                   : [],
    visits:      parseInt(ext.visits?.value) || 1,
    parts:       parseFloat(ext.parts?.value)  || 0,
    labor:       parseFloat(ext.labor?.value)  || 0,
    misc:        parseFloat(ext.misc?.value)   || 0,
    partsDetail: [],
    flags:       [],
    flagNotes:   "",
    expectedHoursLow:  0,
    expectedHoursHigh: 0,
    vendorType:  "unknown",
    vendor:      ext.vendor?.value      || "",
    agreement:   "none",
    client:      activeClient           || "Ferrous",
    ingested:    new Date().toISOString(),
    sourceFile:  file.name,
  };
}

function fmt(secs) {
  if (secs < 60) return `${Math.round(secs)}s`;
  const m = Math.floor(secs / 60), s = Math.round(secs % 60);
  return `${m}m ${s}s`;
}

export default function BatchIngestPanel({ knownVendors, knownEquipment, activeClient, existingIds, onSave, onClose }) {
  const [queue,      setQueue]      = useState([]);   // array of queue items
  const [phase,      setPhase]      = useState("select"); // select | ready | running | done
  const [currentIdx, setCurrentIdx] = useState(null);
  const [stats,      setStats]      = useState({ saved: 0, skipped: 0, failed: 0 });
  const [startTime,  setStartTime]  = useState(null);
  const [avgSecs,    setAvgSecs]    = useState(12);    // rolling average, starts at 12s estimate
  const [dragOver,   setDragOver]   = useState(false);

  const stopRef     = useRef(false);
  const savedIdsRef = useRef(new Set(existingIds || [])); // tracks IDs saved this session too

  // ── Folder-aware file reading ─────────────────────────────────────────────────
  // Browser drag-and-drop hands back the folder itself, not its contents.
  // webkitGetAsEntry() + createReader() recursively expands folders into File objects.

  const readDirEntry = useCallback(async (dirEntry) => {
    const files = [];
    const reader = dirEntry.createReader();
    const readChunk = () => new Promise((res, rej) => reader.readEntries(res, rej));
    let chunk;
    do {
      chunk = await readChunk();
      for (const entry of chunk) {
        if (entry.isFile) {
          const f = await new Promise((res, rej) => entry.file(res, rej));
          files.push(f);
        } else if (entry.isDirectory) {
          files.push(...await readDirEntry(entry));
        }
      }
    } while (chunk.length > 0);
    return files;
  }, []);

  const loadFromDataTransfer = useCallback(async (dataTransfer) => {
    const files = [];
    const items = Array.from(dataTransfer.items || []);

    if (items.length > 0 && items[0].webkitGetAsEntry) {
      // Use File System API — handles both files and folders
      for (const item of items) {
        if (item.kind !== 'file') continue;
        const entry = item.webkitGetAsEntry();
        if (!entry) continue;
        if (entry.isFile) {
          const f = await new Promise((res, rej) => entry.file(res, rej));
          files.push(f);
        } else if (entry.isDirectory) {
          files.push(...await readDirEntry(entry));
        }
      }
    } else {
      // Fallback: plain file list
      files.push(...Array.from(dataTransfer.files || []));
    }
    return files;
  }, [readDirEntry]);

  // ── File selection ────────────────────────────────────────────────────────────
  const loadFiles = useCallback((files) => {
    const pdfs = Array.from(files)
      .filter(f => f.name.toLowerCase().endsWith(".pdf"))
      .map((f, i) => ({
        id:        i,
        file:      f,
        name:      f.name,
        sizeMb:    (f.size / 1024 / 1024).toFixed(1),
        status:    "pending",
        invoiceId: null,
        vendor:    null,
        error:     null,
      }));

    if (pdfs.length === 0) return;
    setQueue(pdfs);
    setStats({ saved: 0, skipped: 0, failed: 0 });
    setPhase("ready");
  }, []);

  // ── Processing loop ───────────────────────────────────────────────────────────
  const startProcessing = async () => {
    setPhase("running");
    setStartTime(Date.now());
    stopRef.current = false;

    let saved = 0, skipped = 0, failed = 0;
    const durations = [];

    for (let i = 0; i < queue.length; i++) {
      if (stopRef.current) break;

      const item = queue[i];
      const t0 = Date.now();

      // Mark as processing
      setCurrentIdx(i);
      setQueue(prev => prev.map((it, idx) =>
        idx === i ? { ...it, status: "processing" } : it
      ));

      try {
        // Extract — Vision primary, regex fallback
        const result = await extractTextFromPDF(
          item.file,
          knownVendors || [],
          knownEquipment || []
        );

        // ── Multi-invoice PDF (compiled dump) ──────────────────────────────────
        if (result.multiInvoice) {
          let fileSaved = 0, fileSkipped = 0;

          for (let j = 0; j < result.multiInvoice.length; j++) {
            const inv    = result.multiInvoice[j];
            const record = buildRecord(inv.visionFields, item, activeClient, `${i}-${j}`);

            if (savedIdsRef.current.has(record.id)) {
              fileSkipped++;
              skipped++;
            } else {
              onSave(record);
              savedIdsRef.current.add(record.id);
              ingestToRAG(record);
              fileSaved++;
              saved++;
            }

            // Update progress after each sub-invoice
            setStats({ saved, skipped, failed });
          }

          const label = `${fileSaved} invoices${fileSkipped > 0 ? ` (${fileSkipped} dupes)` : ""}`;
          setQueue(prev => prev.map((it, idx) =>
            idx === i ? { ...it, status: "done", invoiceId: label, vendor: result.multiInvoice[0]?.visionFields?.vendor?.value || "" } : it
          ));

        } else {
          // ── Single invoice ────────────────────────────────────────────────────
          const ext = result.visionFields
            ? result.visionFields
            : extractFields(result.fullText, knownVendors, knownEquipment);

          const record = buildRecord(ext, item, activeClient, i);

          if (savedIdsRef.current.has(record.id)) {
            setQueue(prev => prev.map((it, idx) =>
              idx === i ? { ...it, status: "skipped", invoiceId: record.id, vendor: record.vendor, error: "Duplicate ID" } : it
            ));
            skipped++;
          } else {
            onSave(record);
            savedIdsRef.current.add(record.id);
            ingestToRAG(record);

            setQueue(prev => prev.map((it, idx) =>
              idx === i ? { ...it, status: "done", invoiceId: record.id, vendor: record.vendor } : it
            ));
            saved++;
          }
          setStats({ saved, skipped, failed });
        }

        // Update rolling avg (per-file, not per sub-invoice)
        const elapsed = (Date.now() - t0) / 1000;
        durations.push(elapsed);
        setAvgSecs(durations.reduce((a, b) => a + b, 0) / durations.length);

      } catch (err) {
        setQueue(prev => prev.map((it, idx) =>
          idx === i ? { ...it, status: "error", error: err.message.slice(0, 80) } : it
        ));
        failed++;
        setStats({ saved, skipped, failed });
      }
    }

    setCurrentIdx(null);
    setPhase("done");
  };

  const stopProcessing = () => { stopRef.current = true; };

  // ── Derived values ────────────────────────────────────────────────────────────
  const processed  = queue.filter(q => ["done", "skipped", "error"].includes(q.status)).length;
  const remaining  = queue.length - processed;
  const pct        = queue.length ? Math.round(processed / queue.length * 100) : 0;
  const etaSecs    = remaining * avgSecs;
  const elapsed    = startTime ? (Date.now() - startTime) / 1000 : 0;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: S.card, borderRadius: 14, border: `1px solid ${S.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", maxHeight: "88vh", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${S.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: S.bright }}>Batch Import Invoices</div>
          <div style={{ fontSize: 10, color: S.dim }}>
            {phase === "select"  && "Drop a folder or select multiple PDFs — processed one by one via AI Vision"}
            {phase === "ready"   && `${queue.length} PDF${queue.length !== 1 ? "s" : ""} queued · ~${fmt(queue.length * avgSecs)} estimated`}
            {phase === "running" && `Processing file ${processed + 1} of ${queue.length} · ${pct}% complete · ~${fmt(etaSecs)} remaining · ${stats.saved} invoices saved`}
            {phase === "done"    && `Complete — ${stats.saved} saved, ${stats.skipped} skipped, ${stats.failed} failed in ${fmt(elapsed)}`}
            {activeClient && activeClient !== "all" && <span style={{ marginLeft: 8, color: S.accent, fontWeight: 600 }}>→ {activeClient}</span>}
          </div>
        </div>
        {phase !== "running" && (
          <button onClick={onClose} style={{ background: S.bg, border: `1.5px solid ${S.border}`, borderRadius: 10, padding: "6px 14px", fontSize: 11, color: S.dim, cursor: "pointer", fontWeight: 600 }}>
            Close
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>

        {/* SELECT PHASE */}
        {phase === "select" && (
          <div>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={async e => {
                e.preventDefault();
                setDragOver(false);
                const files = await loadFromDataTransfer(e.dataTransfer);
                loadFiles(files);
              }}
              style={{ border: `2px dashed ${dragOver ? S.accent : S.border}`, borderRadius: 14, padding: "50px 40px", textAlign: "center", background: dragOver ? S.accent + "05" : S.bg, transition: "all .15s" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📂</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: S.bright, marginBottom: 6 }}>Drop your invoice folder here</div>
              <div style={{ fontSize: 12, color: S.dim, marginBottom: 20, lineHeight: 1.6 }}>Drag a whole folder — all PDFs inside will be found automatically.<br />GPT-4o Vision extracts all fields from each invoice.</div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button onClick={() => document.getElementById("ic-batch-folder").click()}
                  style={{ padding: "9px 20px", background: S.accent, color: "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 6px rgba(74,127,212,0.25)" }}>
                  📁 Select Folder
                </button>
                <button onClick={() => document.getElementById("ic-batch-files").click()}
                  style={{ padding: "9px 20px", background: S.bg, border: `1.5px solid ${S.border}`, borderRadius: 10, fontSize: 12, fontWeight: 600, color: S.text, cursor: "pointer" }}>
                  📄 Select Files
                </button>
              </div>
              <div style={{ marginTop: 14, fontSize: 10, color: S.dim }}>Supports scanned PDFs · Any dealer format · Up to 4 pages per invoice</div>
              {/* Folder picker — webkitdirectory reads all files in the chosen folder */}
              <input id="ic-batch-folder" type="file" accept=".pdf" webkitdirectory="" style={{ display: "none" }}
                onChange={e => loadFiles(e.target.files)} />
              {/* Multi-file picker — for selecting individual PDFs */}
              <input id="ic-batch-files" type="file" accept=".pdf" multiple style={{ display: "none" }}
                onChange={e => loadFiles(e.target.files)} />
            </div>
          </div>
        )}

        {/* READY PHASE */}
        {phase === "ready" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: S.text }}>
                <strong style={{ color: S.bright }}>{queue.length} invoices</strong> ready to process
                <span style={{ marginLeft: 8, fontSize: 10, color: S.dim }}>~{fmt(queue.length * avgSecs)} estimated via Vision</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setQueue([]); setPhase("select"); }}
                  style={{ padding: "7px 14px", background: S.bg, border: `1.5px solid ${S.border}`, borderRadius: 10, fontSize: 11, color: S.dim, cursor: "pointer", fontWeight: 600 }}>
                  Clear
                </button>
                <button onClick={startProcessing}
                  style={{ padding: "7px 18px", background: S.accent, color: "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(74,127,212,0.25)" }}>
                  ▶ Start Processing
                </button>
              </div>
            </div>
            <QueueList queue={queue} currentIdx={null} />
          </div>
        )}

        {/* RUNNING PHASE */}
        {phase === "running" && (
          <div>
            {/* Progress bar */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11, color: S.text }}>
                <span><strong>{processed}</strong> / {queue.length} file{queue.length !== 1 ? "s" : ""} · <strong style={{ color: S.green }}>{stats.saved}</strong> invoices saved</span>
                <span style={{ color: S.dim }}>{phase === "running" && processed < queue.length ? `~${fmt((queue.length - processed) * avgSecs)} est. remaining` : "finishing…"}</span>
              </div>
              <div style={{ height: 8, background: S.bg, borderRadius: 8, overflow: "hidden", border: `1px solid ${S.border}` }}>
                <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${S.accent}, #3a6ab8)`, borderRadius: 8, transition: "width .4s ease" }} />
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 10 }}>
                <span style={{ color: S.green }}>✓ {stats.saved} saved</span>
                <span style={{ color: S.yellow }}>— {stats.skipped} skipped</span>
                <span style={{ color: S.red }}>✗ {stats.failed} failed</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <button onClick={stopProcessing}
                style={{ padding: "6px 16px", background: "#dc262610", border: `1.5px solid ${S.red}`, borderRadius: 10, fontSize: 11, color: S.red, cursor: "pointer", fontWeight: 700 }}>
                ⏹ Stop After Current
              </button>
            </div>

            <QueueList queue={queue} currentIdx={currentIdx} />
          </div>
        )}

        {/* DONE PHASE */}
        {phase === "done" && (
          <div>
            {/* Summary card */}
            <div style={{ background: stats.failed === 0 ? "#16a34a08" : "#d9770608", border: `1.5px solid ${stats.failed === 0 ? "#16a34a30" : "#d9770630"}`, borderRadius: 14, padding: "20px 24px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: stats.failed === 0 ? S.green : S.yellow, marginBottom: 4 }}>
                  {stats.failed === 0 ? "✓ Batch import complete" : "⚠ Batch import complete with errors"}
                </div>
                <div style={{ fontSize: 12, color: S.text }}>
                  <span style={{ color: S.green, fontWeight: 700 }}>{stats.saved} invoices saved</span>
                  {stats.skipped > 0 && <span style={{ color: S.yellow, fontWeight: 700, marginLeft: 14 }}>{stats.skipped} skipped (duplicates)</span>}
                  {stats.failed > 0 && <span style={{ color: S.red, fontWeight: 700, marginLeft: 14 }}>{stats.failed} failed</span>}
                  <span style={{ color: S.dim, marginLeft: 14 }}>Total time: {fmt(elapsed)}</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: S.green, fontFamily: "'JetBrains Mono',monospace" }}>{stats.saved}</div>
                <div style={{ fontSize: 9, color: S.dim, textTransform: "uppercase" }}>invoices added</div>
              </div>
            </div>

            {/* Errors if any */}
            {stats.failed > 0 && (
              <div style={{ marginBottom: 16, padding: 12, background: "#dc262608", border: "1px solid #dc262620", borderRadius: 10 }}>
                <div style={{ fontSize: 10, color: S.red, fontWeight: 700, marginBottom: 6 }}>Failed files — try re-ingesting individually:</div>
                {queue.filter(q => q.status === "error").map((q, i) => (
                  <div key={i} style={{ fontSize: 11, color: S.text, marginBottom: 3 }}>
                    <span style={{ fontFamily: "monospace" }}>{q.name}</span>
                    <span style={{ color: S.dim, marginLeft: 8 }}>{q.error}</span>
                  </div>
                ))}
              </div>
            )}

            <QueueList queue={queue} currentIdx={null} />

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => { setQueue([]); setPhase("select"); setStats({ saved: 0, skipped: 0, failed: 0 }); setStartTime(null); }}
                style={{ padding: "10px 20px", background: S.accent, color: "#fff", border: "none", borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(74,127,212,0.2)" }}>
                Import More
              </button>
              <button onClick={onClose}
                style={{ padding: "10px 20px", background: S.bg, border: `1.5px solid ${S.border}`, borderRadius: 12, fontSize: 12, color: S.dim, cursor: "pointer", fontWeight: 600 }}>
                Done
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}


// ── Queue list sub-component ──────────────────────────────────────────────────
function QueueList({ queue, currentIdx }) {
  if (queue.length === 0) return null;

  return (
    <div style={{ border: `1px solid ${S.border}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "24px 1fr 90px 120px", gap: 0, background: S.bg, padding: "6px 12px", fontSize: 9, color: S.dim, textTransform: "uppercase", letterSpacing: .6, fontWeight: 700 }}>
        <div></div><div>File</div><div>Status</div><div>Invoice ID / Note</div>
      </div>
      <div style={{ maxHeight: 360, overflowY: "auto" }}>
        {queue.map((item, idx) => {
          const m = STATUS_META[item.status];
          const isActive = idx === currentIdx;
          return (
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: "24px 1fr 90px 120px", gap: 0, padding: "7px 12px", borderTop: `1px solid ${S.border}`, fontSize: 11, alignItems: "center", background: isActive ? S.accent + "06" : "transparent", transition: "background .2s" }}>
              <div style={{ color: m.color, fontWeight: 700, fontSize: 13, animation: isActive ? "spin 1s linear infinite" : "none" }}>{m.icon}</div>
              <div style={{ color: isActive ? S.accent : S.text, fontFamily: "monospace", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }} title={item.name}>{item.name}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: m.color, textTransform: "uppercase" }}>{m.label}</div>
              <div style={{ fontSize: 9, color: item.status === "error" ? S.red : S.dim, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.invoiceId || item.error || (isActive ? "analyzing…" : "")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
