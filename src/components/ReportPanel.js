'use client';
/**
 * ReportPanel — Tier 1 Cost Intelligence Brief generator.
 *
 * Computes findings from live invoice + vendor data, shows a preview,
 * and sends a POST to /report/generate on the RAG backend to download a PDF.
 *
 * Props:
 *   invoices   — full audited invoice array from Supabase
 *   vendors    — vendor registry array
 *   client     — string client name (from app state or user input)
 */

import { useState, useMemo } from 'react';
import { calc } from '../lib/engine';

const RAG_URL = process.env.NEXT_PUBLIC_RAILWAY_URL;

// ── Dollar formatter ──────────────────────────────────────────────────────────
const f$ = (n) => n != null ? '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—';
const fRate = (n) => n != null ? '$' + Number(n).toFixed(2) + '/hr' : '—';

// ── Derive top findings from flagged invoices ─────────────────────────────────
function computeFindings(invoices, vendors) {
  const findings = [];
  // calc() populates rate, impliedHrs, varDollars — required for dollar impact estimates
  const calcedInvoices = invoices.map(inv => calc(inv, vendors));

  calcedInvoices.forEach(inv => {
    const flags = (inv.flags || []).filter(f => f.startsWith('ENG-'));
    if (flags.length === 0) return;

    const total = (inv.labor || 0) + (inv.parts || 0) + (inv.misc || 0);
    const regEntry = vendors.find(v => v.name === inv.vendor);

    flags.forEach(flag => {
      let title = '', evidence = '', dollarImpact = 0;

      if (flag === 'ENG-RATE-OVR') {
        const contractRate = regEntry?.labor_rate ? parseFloat(regEntry.labor_rate) : null;
        const billedRate   = inv.rate || null;
        const delta        = billedRate != null && contractRate != null ? billedRate - contractRate : null;
        const impliedHrs   = billedRate && inv.labor ? inv.labor / billedRate : null;
        const exposure     = delta != null && impliedHrs != null ? delta * impliedHrs : null;
        title        = `Rate Overcharge — ${inv.vendor}`;
        evidence     = `Invoice ${inv.id}: billed ${fRate(billedRate)} vs contract ${fRate(contractRate)}` +
                       (delta != null ? `, delta +${fRate(delta)}` : '') +
                       (impliedHrs != null ? ` over ${impliedHrs.toFixed(1)} hrs implied.` : '.');
        dollarImpact = exposure || Math.round(total * 0.08);
      } else if (flag === 'ENG-LABOR-HEAVY') {
        const pct = total > 0 ? Math.round(inv.labor / total * 100) : 0;
        title        = `Excessive Labor Billing — ${inv.vendor}`;
        evidence     = `Invoice ${inv.id}: labor ${f$(inv.labor)} = ${pct}% of total ${f$(total)}. ` +
                       `Expected hours ${inv.expectedHoursLow}–${inv.expectedHoursHigh}h; implied ${inv.impliedHrs?.toFixed(1) || '?'}h.`;
        dollarImpact = inv.varDollars ? Math.abs(Math.round(inv.varDollars)) : Math.round(inv.labor * 0.25);
      } else if (flag === 'ENG-TRAVEL') {
        title        = `Unauthorized Travel Charge — ${inv.vendor}`;
        evidence     = `Invoice ${inv.id}: separate travel/truck line detected. Per vendor agreement, ` +
                       `travel is blended into hourly rate — no separate charge permitted.`;
        dollarImpact = Math.round(total * 0.05) || 150;
      } else if (flag === 'ENG-FEE') {
        title        = `Unauthorized Fee — ${inv.vendor}`;
        evidence     = `Invoice ${inv.id}: environmental surcharge, shop supplies, or fuel surcharge detected. ` +
                       `Vendor agreement is silent on these charges.`;
        dollarImpact = Math.round(total * 0.03) || 100;
      } else if (flag === 'ENG-MISDIAG') {
        title        = `Misdiagnosis / Rework — ${inv.vendor}`;
        evidence     = `Invoice ${inv.id}: multiple visits indicate failed first repair. ` +
                       `${inv.visits || 2} visits billed for same equipment issue.`;
        dollarImpact = inv.visits > 1 ? Math.round(inv.labor / inv.visits) : Math.round(inv.labor * 0.4);
      } else if (flag === 'ENG-STAT-LABOR') {
        title        = `Statistical Labor Outlier — ${inv.vendor}`;
        evidence     = `Invoice ${inv.id}: labor ${f$(inv.labor)} is a statistical outlier vs peer invoices ` +
                       `for ${inv.category || 'this category'}.`;
        dollarImpact = inv.varDollars ? Math.abs(Math.round(inv.varDollars)) : Math.round(inv.labor * 0.2);
      } else if (flag === 'ENG-MULTI-RATE') {
        title        = `Multiple Rate Types — ${inv.vendor}`;
        evidence     = `Invoice ${inv.id}: mixed resident/non-resident techs or rates detected. ` +
                       `Cannot verify blended rate against single contract tier.`;
        dollarImpact = Math.round(total * 0.06) || 200;
      } else {
        // Generic catch-all for other ENG- flags
        title        = `${flag.replace('ENG-', '').replace(/-/g, ' ')} — ${inv.vendor}`;
        evidence     = `Invoice ${inv.id}: ${inv.flagNotes?.split('|')[0]?.replace('[ENG]', '').trim() || 'See engine notes.'}`;
        dollarImpact = Math.round(total * 0.05) || 100;
      }

      findings.push({
        flag,
        title,
        invoiceId:   inv.id,
        vendor:      inv.vendor,
        category:    inv.category,
        amount:      total,
        dollarImpact,
        evidence,
        date:        inv.date,
      });
    });
  });

  // Deduplicate by flag+vendor (keep highest-impact instance per type per vendor)
  const deduped = [];
  const seen = new Set();
  findings
    .sort((a, b) => b.dollarImpact - a.dollarImpact)
    .forEach(f => {
      const key = `${f.flag}::${f.vendor}`;
      if (!seen.has(key)) { seen.add(key); deduped.push(f); }
    });

  return deduped;
}

// ── Build rate benchmark rows from vendor registry + invoices ─────────────────
function computeBenchmarks(invoices, vendors) {
  const vendorGroups = {};
  // Run calc() with vendors so rate/impliedHrs are populated before grouping
  const calcedInvoices = invoices.map(inv => calc(inv, vendors));
  calcedInvoices.forEach(inv => {
    if (!inv.vendor) return;
    if (!vendorGroups[inv.vendor]) vendorGroups[inv.vendor] = [];
    vendorGroups[inv.vendor].push(inv);
  });

  return Object.entries(vendorGroups).map(([vendor, invs]) => {
    const regEntry    = vendors.find(v => v.name === vendor);
    const ratedInvs   = invs.filter(i => i.rate != null);
    const avgBilled   = ratedInvs.length > 0
      ? ratedInvs.reduce((s, i) => s + i.rate, 0) / ratedInvs.length
      : null;
    const contractRate = regEntry?.labor_rate ? parseFloat(regEntry.labor_rate) : null;
    const variance    = avgBilled != null && contractRate != null ? avgBilled - contractRate : null;
    const status      = variance == null ? '—'
      : variance > 2 ? 'OVER' : variance < -2 ? 'UNDER' : 'OK';

    return {
      vendor,
      billedRate:         avgBilled,
      contractRate,
      ironcladBenchmark:  contractRate,  // for now same as contract; future: market benchmark
      variance,
      status,
      invoiceCount:       invs.length,
    };
  }).sort((a, b) => (b.variance || 0) - (a.variance || 0));
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ReportPanel({ invoices = [], vendors = [], client: defaultClient = '', onSnapshotSave }) {
  const [client, setClient]           = useState(defaultClient || 'Ferrous Process & Trading');
  const [dateStart, setDateStart]     = useState('');
  const [dateEnd, setDateEnd]         = useState('');
  const [generating, setGenerating]   = useState(false);
  const [error, setError]             = useState(null);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [lastExport, setLastExport]   = useState(null); // { date, findingCount, exposure, filename }

  // Compute findings and benchmarks from live data
  const findings   = useMemo(() => computeFindings(invoices, vendors),   [invoices, vendors]);
  const benchmarks = useMemo(() => computeBenchmarks(invoices, vendors), [invoices, vendors]);
  const topFindings = findings.slice(0, 5);
  const totalExposure = topFindings.reduce((s, f) => s + (f.dollarImpact || 0), 0);
  const totalValue    = invoices.reduce((s, i) => s + (i.labor||0) + (i.parts||0) + (i.misc||0), 0);
  const flaggedCount  = invoices.filter(i => (i.flags||[]).some(f => f.startsWith('ENG-'))).length;

  const canGenerate = !!RAG_URL && invoices.length > 0 && client.trim().length > 0;

  // Auto-fill date range from invoice data
  const autoDateRange = useMemo(() => {
    const dates = invoices.map(i => i.date).filter(Boolean).sort();
    return { start: dates[0] || '', end: dates[dates.length - 1] || '' };
  }, [invoices]);

  async function handleGenerate() {
    if (!canGenerate) return;
    setGenerating(true);
    setError(null);

    try {
      const payload = {
        client,
        preparedBy:  'Ironclad Fleet Intelligence',
        dateRange: {
          start: dateStart || autoDateRange.start,
          end:   dateEnd   || autoDateRange.end,
        },
        invoices,
        vendors,
        findings:   topFindings,
        benchmarks,
      };

      const res = await fetch(`${RAG_URL}/report/generate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server returned ${res.status}`);
      }

      // Trigger file download
      const blob      = await res.blob();
      const url       = URL.createObjectURL(blob);
      const filename  = `Ironclad_Brief_${client.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;
      const anchor    = document.createElement('a');
      anchor.href     = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      // Audit snapshot — record what findings existed at export time
      // This is the defensible record: "at the time of delivery, these were the findings"
      const snapshot = {
        exportedAt:    new Date().toISOString(),
        filename,
        client,
        dateRange:     { start: dateStart || autoDateRange.start, end: dateEnd || autoDateRange.end },
        invoiceCount:  invoices.length,
        findingCount:  topFindings.length,
        totalExposure,
        findings:      topFindings.map(f => ({
          title:       f.title,
          vendor:      f.vendor,
          invoiceId:   f.invoiceId,
          dollarImpact: f.dollarImpact,
          flag:        f.flag,
        })),
        benchmarkSummary: benchmarks.map(b => ({
          vendor: b.vendor, billedRate: b.billedRate, contractRate: b.contractRate, status: b.status
        })),
      };
      setLastExport({ date: new Date().toLocaleDateString(), findingCount: topFindings.length, exposure: totalExposure, filename });
      if (onSnapshotSave) onSnapshotSave(snapshot);
      // Also persist to localStorage as a fallback audit trail
      try {
        const existing = JSON.parse(localStorage.getItem('ironclad_report_snapshots') || '[]');
        existing.unshift(snapshot);
        localStorage.setItem('ironclad_report_snapshots', JSON.stringify(existing.slice(0, 20)));
      } catch {}

    } catch (err) {
      console.error('[ReportPanel] generate error:', err);
      setError(err.message || 'Failed to generate report.');
    } finally {
      setGenerating(false);
    }
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  const statusBadge = (status) => {
    const map = { OVER: '#dc2626', OK: '#15803d', UNDER: '#1d4ed8', '—': '#64748b' };
    return (
      <span style={{
        background: map[status] || '#64748b',
        color: '#fff', borderRadius: 3, padding: '1px 7px',
        fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
      }}>{status}</span>
    );
  };

  return (
    <div style={{ padding: '0 0 40px 0', maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a2744', margin: 0 }}>
            Cost Intelligence Brief
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Tier 1 client deliverable · {invoices.length} invoices · {flaggedCount} flagged
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || generating}
          style={{
            background: canGenerate && !generating ? '#1a2744' : '#94a3b8',
            color: '#fff', border: 'none', borderRadius: 6,
            padding: '10px 22px', fontSize: 14, fontWeight: 700,
            cursor: canGenerate && !generating ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          {generating ? (
            <>
              <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Generating…
            </>
          ) : (
            <>📄 Export PDF Report</>
          )}
        </button>
      </div>

      {!RAG_URL && (
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#92400e' }}>
          ⚠️ NEXT_PUBLIC_RAILWAY_URL not set — PDF generation requires the RAG backend.
        </div>
      )}
      {lastExport && (
        <div style={{ background: '#f0fdf4', border: '1px solid #16a34a', borderRadius: 6, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#15803d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>✅ Report exported {lastExport.date} — {lastExport.findingCount} findings, {f$(lastExport.exposure)} exposure</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>{lastExport.filename}</span>
        </div>
      )}
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #dc2626', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#991b1b' }}>
          ❌ {error}
        </div>
      )}

      {/* Report config */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 5 }}>Client Name</label>
            <input
              value={client}
              onChange={e => setClient(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 5 }}
              placeholder="Client company name"
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 5 }}>
              Audit Start {autoDateRange.start && <span style={{ color: '#94a3b8', fontWeight: 400 }}>({autoDateRange.start})</span>}
            </label>
            <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 5 }}
              placeholder={autoDateRange.start}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 5 }}>
              Audit End {autoDateRange.end && <span style={{ color: '#94a3b8', fontWeight: 400 }}>({autoDateRange.end})</span>}
            </label>
            <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 5 }}
              placeholder={autoDateRange.end}
            />
          </div>
        </div>
      </div>

      {/* Scope summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Invoices',      value: invoices.length,        red: false },
          { label: 'Flagged',       value: flaggedCount,           red: flaggedCount > 0 },
          { label: 'Findings',      value: topFindings.length,     red: topFindings.length > 0 },
          { label: 'Audit Value',   value: f$(totalValue),         red: false },
          { label: 'Total Exposure',value: f$(totalExposure),      red: totalExposure > 0 },
        ].map(m => (
          <div key={m.label} style={{ background: '#f8fafc', border: `1px solid ${m.red ? '#fca5a5' : '#e2e8f0'}`, borderRadius: 7, padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: m.red ? '#dc2626' : '#1a2744' }}>{m.value}</div>
            <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 3 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Preview toggle */}
      <div
        onClick={() => setPreviewOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: 12, userSelect: 'none' }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1a2744' }}>Report Preview {previewOpen ? '▲' : '▼'}</span>
        <span style={{ fontSize: 12, color: '#64748b' }}>{topFindings.length} finding{topFindings.length !== 1 ? 's' : ''} · {benchmarks.length} vendor{benchmarks.length !== 1 ? 's' : ''}</span>
      </div>

      {previewOpen && (
        <>
          {/* Rate Benchmark Table */}
          {benchmarks.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Rate Benchmark</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#1a2744', color: '#fff' }}>
                    {['Vendor', 'Invoices', 'Avg Billed', 'Contract Rate', 'Variance', 'Status'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {benchmarks.map((row, i) => (
                    <tr key={row.vendor} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={{ padding: '7px 10px', fontWeight: 600, color: '#1a2744' }}>{row.vendor}</td>
                      <td style={{ padding: '7px 10px', color: '#64748b' }}>{row.invoiceCount}</td>
                      <td style={{ padding: '7px 10px' }}>{fRate(row.billedRate)}</td>
                      <td style={{ padding: '7px 10px' }}>{fRate(row.contractRate)}</td>
                      <td style={{ padding: '7px 10px', fontWeight: row.variance != null && Math.abs(row.variance) > 2 ? 700 : 400, color: row.variance > 2 ? '#dc2626' : row.variance < -2 ? '#1d4ed8' : '#64748b' }}>
                        {row.variance != null ? (row.variance > 0 ? '+' : '') + fRate(row.variance) : '—'}
                      </td>
                      <td style={{ padding: '7px 10px' }}>{statusBadge(row.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Top Findings */}
          {topFindings.length > 0 ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Top Findings</div>
              {topFindings.map((f, i) => (
                <div key={`${f.flag}-${f.invoiceId}`} style={{ border: '1px solid #fca5a5', borderLeft: '4px solid #dc2626', borderRadius: 6, padding: '12px 14px', marginBottom: 10, background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                    <div>
                      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginRight: 8 }}>#{i + 1}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1a2744' }}>{f.title}</span>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#dc2626', whiteSpace: 'nowrap' }}>{f$(f.dollarImpact)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 5 }}>
                    {[f.invoiceId && `Invoice: ${f.invoiceId}`, f.category && `Category: ${f.category}`].filter(Boolean).join(' · ')}
                  </div>
                  <div style={{ fontSize: 12, color: '#334155' }}>{f.evidence}</div>
                </div>
              ))}
              {findings.length > 5 && (
                <div style={{ fontSize: 12, color: '#64748b', textAlign: 'center', padding: '8px', background: '#f8fafc', borderRadius: 5 }}>
                  + {findings.length - 5} additional findings in full report
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: '#94a3b8', background: '#f8fafc', borderRadius: 8, fontSize: 13 }}>
              No flagged invoices found. Run Re-Audit All from the gear menu, then check the Invoices tab for ENG- flags.
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
