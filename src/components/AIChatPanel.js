/**
 * AIChatPanel — Ironclad Fleet Intelligence AI Assistant
 *
 * Drop into your Next.js app to add a RAG-powered chat sidebar.
 * Connects to your Railway backend for vector search + GPT answers.
 *
 * Usage in page.js:
 *   import AIChatPanel from '@/components/AIChatPanel';
 *   // Add to your layout:
 *   <AIChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
 *
 * Install deps: npm install @supabase/supabase-js
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { askIronclad } from '@/lib/rag-client';

// ─── Sample questions shown in empty state ────────────────────────────────────
const SUGGESTED_QUESTIONS = [
  'Which vendor has the highest labor overrun this quarter?',
  'Show me all flagged invoices for Alta Equipment.',
  'What does the Alta contract say about guaranteed hours?',
  'Which unit has the highest lifetime repair cost?',
  'Are there any invoices where labor exceeded the contracted rate?',
  'Summarize cost trends for SE Michigan in the last 90 days.'
];

// ─── Inline styles (no Tailwind dependency) ───────────────────────────────────
const styles = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)'
  },
  panel: {
    position: 'fixed', top: 0, right: 0, bottom: 0,
    width: '420px', maxWidth: '95vw',
    background: '#0f172a', color: '#f1f5f9',
    display: 'flex', flexDirection: 'column',
    boxShadow: '-4px 0 24px rgba(0,0,0,0.5)',
    fontFamily: 'DM Sans, system-ui, sans-serif',
    zIndex: 1001
  },
  header: {
    padding: '16px 20px', borderBottom: '1px solid #1e293b',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: '#0f172a', flexShrink: 0
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  badge: {
    background: '#22c55e', color: '#000', fontSize: '10px',
    fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
    letterSpacing: '0.5px'
  },
  closeBtn: {
    background: 'transparent', border: 'none', color: '#94a3b8',
    cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '4px'
  },
  messages: {
    flex: 1, overflowY: 'auto', padding: '16px',
    display: 'flex', flexDirection: 'column', gap: '16px'
  },
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', flex: 1, gap: '16px', padding: '24px',
    textAlign: 'center'
  },
  suggestionGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', marginTop: '8px'
  },
  suggestionBtn: {
    background: '#1e293b', border: '1px solid #334155', borderRadius: '8px',
    color: '#94a3b8', fontSize: '11px', padding: '10px', textAlign: 'left',
    cursor: 'pointer', lineHeight: 1.4, transition: 'border-color 0.2s, color 0.2s'
  },
  userBubble: {
    alignSelf: 'flex-end', background: '#3b82f6', borderRadius: '12px 12px 2px 12px',
    padding: '10px 14px', maxWidth: '85%', fontSize: '14px', lineHeight: 1.5
  },
  aiBubble: {
    alignSelf: 'flex-start', background: '#1e293b', borderRadius: '2px 12px 12px 12px',
    padding: '12px 14px', maxWidth: '92%', fontSize: '14px', lineHeight: 1.6
  },
  sources: {
    marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #334155'
  },
  sourceChip: {
    display: 'inline-block', background: '#0f172a', border: '1px solid #334155',
    borderRadius: '4px', fontSize: '10px', color: '#64748b',
    padding: '2px 6px', marginRight: '4px', marginTop: '4px'
  },
  loadingDot: {
    display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%',
    background: '#3b82f6', animation: 'pulse 1s infinite'
  },
  inputArea: {
    padding: '12px 16px', borderTop: '1px solid #1e293b',
    background: '#0f172a', flexShrink: 0
  },
  inputRow: {
    display: 'flex', gap: '8px', alignItems: 'flex-end'
  },
  textarea: {
    flex: 1, background: '#1e293b', border: '1px solid #334155',
    borderRadius: '8px', color: '#f1f5f9', fontSize: '14px',
    padding: '10px 12px', resize: 'none', outline: 'none',
    fontFamily: 'inherit', lineHeight: 1.4, minHeight: '44px', maxHeight: '120px'
  },
  sendBtn: {
    background: '#3b82f6', border: 'none', borderRadius: '8px',
    color: '#fff', cursor: 'pointer', fontSize: '18px',
    padding: '10px 14px', flexShrink: 0, transition: 'background 0.2s'
  },
  sendBtnDisabled: {
    background: '#1e293b', cursor: 'not-allowed'
  },
  disclaimer: {
    fontSize: '10px', color: '#475569', textAlign: 'center',
    marginTop: '6px', padding: '0 4px'
  },
  errorBubble: {
    alignSelf: 'flex-start', background: '#450a0a', borderRadius: '8px',
    padding: '10px 14px', maxWidth: '92%', fontSize: '13px',
    color: '#fca5a5', lineHeight: 1.5
  }
};

// ─── Component ────────────────────────────────────────────────────────────────
export function AIChatPanel({ isOpen, onClose }) {
  const [messages,   setMessages]   = useState([]);
  const [input,      setInput]      = useState('');
  const [isLoading,  setIsLoading]  = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const sendMessage = useCallback(async (question) => {
    const q = (question || input).trim();
    if (!q || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setIsLoading(true);

    try {
      const { answer, sources } = await askIronclad(q);
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: answer,
        sources: sources?.slice(0, 5) || []  // Show top 5 sources max
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role:    'error',
        content: `Error: ${err.message}. Check that the Railway backend is running.`
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatSourceLabel = (source) => {
    if (source.table === 'invoices') {
      const m = source.metadata;
      return `Invoice: ${m?.vendor || source.id} · $${((m?.parts_total || 0) + (m?.labor_total || 0) + (m?.misc_total || 0)).toFixed(0)}`;
    }
    if (source.table === 'agreements') {
      return `Agreement: ${source.metadata?.vendor || source.id}`;
    }
    if (source.table === 'documents') {
      return `Doc: ${source.metadata?.title || source.id}`;
    }
    return `${source.table}: ${source.id}`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div style={styles.overlay} onClick={onClose} />

      {/* Panel */}
      <div style={styles.panel}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.3px' }}>
                Ironclad AI
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Fleet Intelligence Assistant
              </div>
            </div>
            <span style={styles.badge}>RAG</span>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Messages */}
        <div style={styles.messages}>
          {messages.length === 0 && !isLoading ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '32px' }}>🔍</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>
                  Ask anything about your fleet
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                  Searches your invoices, contracts, and equipment data using AI
                </div>
              </div>
              <div style={styles.suggestionGrid}>
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    style={styles.suggestionBtn}
                    onClick={() => sendMessage(q)}
                    onMouseEnter={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.color = '#cbd5e1'; }}
                    onMouseLeave={e => { e.target.style.borderColor = '#334155'; e.target.style.color = '#94a3b8'; }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                if (msg.role === 'user') {
                  return (
                    <div key={i} style={styles.userBubble}>
                      {msg.content}
                    </div>
                  );
                }
                if (msg.role === 'error') {
                  return (
                    <div key={i} style={styles.errorBubble}>
                      ⚠️ {msg.content}
                    </div>
                  );
                }
                // Assistant
                return (
                  <div key={i} style={styles.aiBubble}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div style={styles.sources}>
                        <div style={{ fontSize: '10px', color: '#475569', marginBottom: '4px' }}>
                          Sources ({msg.sources.length})
                        </div>
                        {msg.sources.map((src, j) => (
                          <span key={j} style={styles.sourceChip} title={`Similarity: ${src.similarity}`}>
                            {formatSourceLabel(src)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div style={{ ...styles.aiBubble, display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={styles.loadingDot} />
                  <span style={{ ...styles.loadingDot, animationDelay: '0.2s' }} />
                  <span style={{ ...styles.loadingDot, animationDelay: '0.4s' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '4px' }}>
                    Searching your fleet data…
                  </span>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={styles.inputArea}>
          <div style={styles.inputRow}>
            <textarea
              ref={textareaRef}
              style={styles.textarea}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about invoices, vendors, contracts, equipment…"
              rows={1}
              disabled={isLoading}
            />
            <button
              style={{
                ...styles.sendBtn,
                ...((!input.trim() || isLoading) ? styles.sendBtnDisabled : {})
              }}
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
            >
              ↑
            </button>
          </div>
          <div style={styles.disclaimer}>
            AI answers are based on your Ironclad database. Always verify critical figures in source invoices.
          </div>
        </div>

      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.1); }
        }
      `}</style>
    </>
  );
}

// ─── Trigger button — add this wherever you want the chat button in your UI — ---------------------
export function AIChatButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        background: '#1e293b', border: '1px solid #334155',
        borderRadius: '8px', color: '#94a3b8', cursor: 'pointer',
        fontSize: '13px', padding: '8px 14px',
        transition: 'border-color 0.2s, color 0.2s'
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#f1f5f9'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#94a3b8'; }}
      title="Ask Ironclad AI"
    >
      ⚡ Ask AI
    </button>
  );
}
