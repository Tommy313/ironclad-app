'use client';

/**
 * Ironclad Login Page
 * Clean, branded login form using Supabase email/password auth.
 * Redirects to / on successful sign-in.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '../../lib/supabase-browser';

export default function LoginPage() {
  const router   = useRouter();
  const supabase = createSupabaseBrowser();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [checking, setChecking] = useState(true);

  // If already logged in, go straight to app
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/');
      else setChecking(false);
    });
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.replace('/');
      router.refresh();
    }
  }

  if (checking) {
    return (
      <div style={styles.page}>
        <div style={{ color: '#94a3b8', fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Branding */}
        <div style={styles.brandRow}>
          <span style={styles.brandIcon}>⚙</span>
          <div>
            <div style={styles.brandName}>IRONCLAD</div>
            <div style={styles.brandSub}>Fleet Intelligence</div>
          </div>
        </div>

        <div style={styles.divider} />

        <h1 style={styles.title}>Sign in</h1>
        <p style={styles.subtitle}>Internal audit platform — authorized users only.</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={styles.input}
              placeholder="you@example.com"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div style={styles.errorBox}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        <p style={styles.footer}>
          No self-service signup. Contact the system administrator to add an account.
        </p>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: '100vh',
    background: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 12,
    padding: '40px 44px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  brandIcon: {
    fontSize: 32,
    lineHeight: 1,
    color: '#c8972b',
  },
  brandName: {
    fontSize: 20,
    fontWeight: 800,
    color: '#f1f5f9',
    letterSpacing: 2,
  },
  brandSub: {
    fontSize: 11,
    color: '#c8972b',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  divider: {
    height: 1,
    background: 'linear-gradient(90deg, #c8972b, transparent)',
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#f1f5f9',
    margin: '0 0 6px',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    margin: '0 0 28px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    padding: '11px 14px',
    fontSize: 14,
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 7,
    color: '#f1f5f9',
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  errorBox: {
    background: '#450a0a',
    border: '1px solid #dc2626',
    borderRadius: 6,
    padding: '10px 14px',
    fontSize: 13,
    color: '#fca5a5',
  },
  button: {
    background: '#1a2744',
    border: '1px solid #c8972b',
    borderRadius: 7,
    color: '#f1f5f9',
    fontSize: 15,
    fontWeight: 700,
    padding: '13px',
    cursor: 'pointer',
    marginTop: 4,
    transition: 'background 0.15s',
    letterSpacing: 0.3,
  },
  footer: {
    marginTop: 24,
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 1.5,
  },
};
