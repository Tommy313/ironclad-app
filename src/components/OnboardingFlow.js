'use client';
/**
 * OnboardingFlow — guided "New Audit" modal
 *
 * Walks Tommy through a new client engagement in one connected flow:
 *   Step 1: Client name
 *   Step 2: Confirm/review vendors for that client
 *   Step 3: Import invoices (batch)
 *   Step 4: Run audit (Re-Audit All)
 *   Step 5: Go to Report tab
 *
 * Props:
 *   onClose()         — close the modal
 *   onClientCreated(name) — called after step 1
 *   onGoToTab(tab)    — navigate to a tab
 *   onReauditAll()    — trigger Re-Audit All
 *   onBatchImport()   — open batch import modal
 *   existingClients   — string[]
 *   vendors           — vendor registry array
 */

import { useState } from 'react';

const STEPS = [
  { id: 1, label: 'Client',   icon: '🏢' },
  { id: 2, label: 'Vendors',  icon: '📋' },
  { id: 3, label: 'Import',   icon: '📂' },
  { id: 4, label: 'Audit',    icon: '⚡' },
  { id: 5, label: 'Report',   icon: '📄' },
];

export default function OnboardingFlow({
  onClose,
  onClientCreated,
  onGoToTab,
  onReauditAll,
  onBatchImport,
  existingClients = [],
  vendors = [],
}) {
  const [step, setStep]         = useState(1);
  const [clientName, setClientName] = useState('');
  const [error, setError]       = useState('');
  const [auditDone, setAuditDone] = useState(false);

  const activeVendors = vendors.filter(v => v.agreement_status === 'ACTIVE');
  const totalVendors  = vendors.length;

  function handleClientSubmit() {
    const name = clientName.trim();
    if (!name) { setError('Enter a client name.'); return; }
    if (existingClients.includes(name)) { setError(`"${name}" already exists. Select them from the dropdown.`); return; }
    setError('');
    onClientCreated(name);
    setStep(2);
  }

  async function handleReaudit() {
    await onReauditAll();
    setAuditDone(true);
    setTimeout(() => setStep(5), 800);
  }

  const S = {
    overlay:   { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
    modal:     { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, boxShadow: '0 24px 60px rgba(0,0,0,0.2)', overflow: 'hidden' },
    header:    { background: '#1a2744', padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    title:     { color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: 0.3 },
    close:     { color: '#94a3b8', fontSize: 20, cursor: 'pointer', background: 'none', border: 'none', lineHeight: 1 },
    stepper:   { display: 'flex', padding: '16px 28px', borderBottom: '1px solid #e2e8f0', gap: 0 },
    body:      { padding: '28px 28px 24px' },
    footer:    { padding: '16px 28px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    btn:       { padding: '10px 22px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none' },
    input:     { width: '100%', padding: '11px 14px', fontSize: 14, border: '1px solid #cbd5e1', borderRadius: 8, outline: 'none', boxSizing: 'border-box', marginTop: 8 },
    label:     { fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
    infoBox:   { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '14px 16px', marginTop: 16 },
    checkRow:  { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 13, color: '#334155' },
  };

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>

        {/* Header */}
        <div style={S.header}>
          <span style={S.title}>New Client Audit</span>
          <button style={S.close} onClick={onClose}>×</button>
        </div>

        {/* Step tracker */}
        <div style={S.stepper}>
          {STEPS.map((s, i) => {
            const done    = step > s.id;
            const active  = step === s.id;
            const future  = step < s.id;
            return (
              <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {i > 0 && <div style={{ position: 'absolute', left: 0, top: 14, width: '50%', height: 2, background: done ? '#c8972b' : '#e2e8f0' }} />}
                {i < STEPS.length - 1 && <div style={{ position: 'absolute', right: 0, top: 14, width: '50%', height: 2, background: done ? '#c8972b' : '#e2e8f0' }} />}
                <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: done ? 13 : 11, fontWeight: 700, zIndex: 1,
                  background: done ? '#c8972b' : active ? '#1a2744' : '#f1f5f9',
                  color: done ? '#fff' : active ? '#fff' : '#94a3b8',
                  border: `2px solid ${done ? '#c8972b' : active ? '#1a2744' : '#e2e8f0'}`,
                }}>
                  {done ? '✓' : s.icon}
                </div>
                <span style={{ fontSize: 10, marginTop: 4, fontWeight: active ? 700 : 400, color: active ? '#1a2744' : future ? '#94a3b8' : '#c8972b' }}>{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div style={S.body}>

          {step === 1 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1a2744', marginBottom: 6 }}>Who is the client?</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Enter the company name exactly as it should appear on the Cost Intelligence Brief.</div>
              <label style={S.label}>Client Company Name</label>
              <input style={S.input} value={clientName} onChange={e => setClientName(e.target.value)}
                placeholder="e.g. Ferrous Process & Trading"
                onKeyDown={e => e.key === 'Enter' && handleClientSubmit()}
                autoFocus
              />
              {error && <div style={{ marginTop: 8, fontSize: 12, color: '#dc2626' }}>{error}</div>}
              {existingClients.length > 0 && (
                <div style={{ marginTop: 12, fontSize: 12, color: '#94a3b8' }}>
                  Existing clients: {existingClients.join(', ')}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1a2744', marginBottom: 6 }}>Vendor registry check</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                The engine uses the vendor registry to detect agreements and run compliance checks.
                Make sure <strong>{clientName}'s vendors</strong> are registered before importing invoices.
              </div>
              <div style={S.infoBox}>
                <div style={S.checkRow}>
                  <span style={{ color: totalVendors > 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>{totalVendors > 0 ? '✓' : '✗'}</span>
                  <span>{totalVendors} vendor{totalVendors !== 1 ? 's' : ''} in registry</span>
                </div>
                <div style={S.checkRow}>
                  <span style={{ color: activeVendors.length > 0 ? '#16a34a' : '#d97706', fontWeight: 700 }}>{activeVendors.length > 0 ? '✓' : '⚠'}</span>
                  <span>{activeVendors.length} active agreement{activeVendors.length !== 1 ? 's' : ''} loaded</span>
                  {activeVendors.length === 0 && <span style={{ fontSize: 11, color: '#d97706', marginLeft: 4 }}>— compliance checks won't fire</span>}
                </div>
                {activeVendors.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 11, color: '#64748b' }}>
                    Active: {activeVendors.map(v => v.name).join(', ')}
                  </div>
                )}
              </div>
              <div style={{ marginTop: 16, fontSize: 12, color: '#64748b' }}>
                Need to add a vendor? Close this and go to the <strong>Vendors tab</strong>, then come back.
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1a2744', marginBottom: 6 }}>Import invoices</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
                Import {clientName}'s PDF invoices. The engine will extract fields and run compliance checks automatically.
                Duplicates are detected and skipped.
              </div>
              <div style={S.infoBox}>
                <div style={S.checkRow}><span>📁</span><span>Supported: PDF invoices from any vendor</span></div>
                <div style={S.checkRow}><span>🔍</span><span>GPT-4o Vision extracts vendor, labor, parts, dates</span></div>
                <div style={S.checkRow}><span>⚡</span><span>Engine flags run automatically on import</span></div>
                <div style={S.checkRow}><span>🔄</span><span>Duplicates (same vendor+date+amount) are skipped</span></div>
              </div>
              <button
                onClick={() => { onBatchImport(); setStep(4); }}
                style={{ ...S.btn, marginTop: 20, width: '100%', background: '#16a34a', color: '#fff', fontSize: 15, padding: '14px' }}>
                📂 Open Batch Import
              </button>
            </div>
          )}

          {step === 4 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1a2744', marginBottom: 6 }}>Run the audit engine</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
                Re-run the engine across all imported invoices to ensure flags reflect the latest vendor registry
                and agreement data. This takes ~1 second per invoice.
              </div>
              <div style={S.infoBox}>
                <div style={S.checkRow}><span>✓</span><span>Agreement auto-detection fires on all invoices</span></div>
                <div style={S.checkRow}><span>✓</span><span>Rate vs contract, travel billing, fee policy checks</span></div>
                <div style={S.checkRow}><span>✓</span><span>Statistical baselines computed across full dataset</span></div>
              </div>
              {auditDone ? (
                <div style={{ marginTop: 20, padding: '14px', background: '#f0fdf4', border: '1px solid #16a34a', borderRadius: 8, textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#15803d' }}>
                  ✅ Audit complete — reviewing findings…
                </div>
              ) : (
                <button onClick={handleReaudit}
                  style={{ ...S.btn, marginTop: 20, width: '100%', background: '#d97706', color: '#fff', fontSize: 15, padding: '14px' }}>
                  ⚡ Run Re-Audit All
                </button>
              )}
            </div>
          )}

          {step === 5 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1a2744', marginBottom: 6 }}>Ready to export</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
                The audit is complete. Review your findings in the Invoices tab, then export the
                Cost Intelligence Brief from the Report tab.
              </div>
              <div style={S.infoBox}>
                <div style={S.checkRow}><span>✓</span><span>Client: <strong>{clientName}</strong></span></div>
                <div style={S.checkRow}><span>✓</span><span>Vendors registered</span></div>
                <div style={S.checkRow}><span>✓</span><span>Invoices imported</span></div>
                <div style={S.checkRow}><span>✓</span><span>Audit engine run</span></div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => { onGoToTab('Invoices'); onClose(); }}
                  style={{ ...S.btn, flex: 1, background: '#1a2744', color: '#fff' }}>
                  📋 View Findings
                </button>
                <button onClick={() => { onGoToTab('Report'); onClose(); }}
                  style={{ ...S.btn, flex: 1, background: '#c8972b', color: '#fff' }}>
                  📄 Export Report
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div style={S.footer}>
          <button onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            style={{ ...S.btn, background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0' }}>
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>Step {step} of {STEPS.length}</span>
          {step < 5 && step !== 3 && step !== 4 && (
            <button onClick={() => step === 1 ? handleClientSubmit() : setStep(s => s + 1)}
              style={{ ...S.btn, background: '#1a2744', color: '#fff' }}>
              {step === 1 ? 'Create Client →' : 'Continue →'}
            </button>
          )}
          {(step === 3 || step === 4) && (
            <button onClick={() => setStep(s => s + 1)}
              style={{ ...S.btn, background: 'transparent', color: '#94a3b8', border: '1px solid #e2e8f0', fontSize: 12 }}>
              Skip →
            </button>
          )}
          {step === 5 && (
            <button onClick={onClose}
              style={{ ...S.btn, background: '#16a34a', color: '#fff' }}>
              Done ✓
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
