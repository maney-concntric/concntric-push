import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { T } from '../theme';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Email and password are required'); return; }
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/meetings');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <img src="/logo.svg" alt="Concntric" style={styles.logo} />
        </div>
        <h1 style={styles.title}>Leadership Tactical Meeting</h1>
        <p style={styles.subtitle}>Sign in to your account</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              autoComplete="email" autoFocus required
              style={styles.input}
              onFocus={e => e.target.style.borderColor = T.red}
              onBlur={e => e.target.style.borderColor = T.border}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              autoComplete="current-password" required
              style={styles.input}
              onFocus={e => e.target.style.borderColor = T.red}
              onBlur={e => e.target.style.borderColor = T.border}
            />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button
            type="submit" disabled={loading} style={styles.btn}
            onMouseEnter={e => { if (!loading) e.target.style.background = T.redDark; }}
            onMouseLeave={e => { e.target.style.background = T.red; }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: T.bg,
  },
  card: {
    background: T.white, border: `1px solid ${T.border}`, borderRadius: 10,
    padding: '40px 36px', width: '100%', maxWidth: 380,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  logoWrap: { display: 'flex', justifyContent: 'center', marginBottom: 24 },
  logo: { height: 40 },
  title: { margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: T.text, textAlign: 'center' },
  subtitle: { margin: '0 0 28px', fontSize: 14, color: T.textSecondary, textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 13, fontWeight: 500, color: T.text },
  input: {
    padding: '9px 12px', fontSize: 14, border: `1px solid ${T.border}`,
    borderRadius: 6, outline: 'none', width: '100%', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  error: {
    background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca',
    borderRadius: 5, padding: '8px 12px', fontSize: 13,
  },
  btn: {
    padding: '10px', fontSize: 14, fontWeight: 600, border: 'none',
    borderRadius: 6, background: T.red, color: T.white, cursor: 'pointer',
    marginTop: 4, transition: 'background 0.15s',
  },
};
