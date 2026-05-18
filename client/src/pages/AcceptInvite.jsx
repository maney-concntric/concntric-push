import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { T } from '../theme';

export function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { acceptInvite } = useAuth();
  const [invite, setInvite] = useState(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getInvite(token)
      .then(setInvite)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 10) { setError('Password must be at least 10 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setSubmitting(true);
    try {
      await acceptInvite(token, password);
      navigate('/meetings');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const focusStyle = (e) => { e.target.style.borderColor = T.red; };
  const blurStyle  = (e) => { e.target.style.borderColor = T.border; };

  if (loading) return <div style={styles.page}><div style={styles.card}>Validating invite…</div></div>;

  if (error && !invite) return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoWrap}><img src="/logo.svg" alt="Concntric" style={styles.logo} /></div>
        <div style={styles.errorBox}>{error}</div>
        <p style={{ fontSize: 13, color: T.textSecondary }}>This invite link is invalid or has expired. Contact your admin for a new invite.</p>
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoWrap}><img src="/logo.svg" alt="Concntric" style={styles.logo} /></div>
        <h1 style={styles.title}>Set your password</h1>
        <p style={styles.subtitle}>Welcome, <strong>{invite?.name}</strong>! Create a password for <strong>{invite?.email}</strong>.</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Password <span style={{ color: T.textSecondary, fontWeight: 400 }}>(min 10 characters)</span></label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={styles.input} autoFocus onFocus={focusStyle} onBlur={blurStyle} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Confirm password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required style={styles.input} onFocus={focusStyle} onBlur={blurStyle} />
          </div>
          {error && <div style={styles.errorBox}>{error}</div>}
          <button
            type="submit" disabled={submitting} style={styles.btn}
            onMouseEnter={e => { if (!submitting) e.target.style.background = T.redDark; }}
            onMouseLeave={e => { e.target.style.background = T.red; }}
          >
            {submitting ? 'Creating account…' : 'Create account & sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg },
  card: {
    background: T.white, border: `1px solid ${T.border}`, borderRadius: 10,
    padding: '40px 36px', width: '100%', maxWidth: 400,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  logoWrap: { display: 'flex', justifyContent: 'center', marginBottom: 20 },
  logo: { height: 36 },
  title: { margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: T.text, textAlign: 'center' },
  subtitle: { margin: '0 0 24px', fontSize: 14, color: T.textSecondary, textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 13, fontWeight: 500, color: T.text },
  input: {
    padding: '9px 12px', fontSize: 14, border: `1px solid ${T.border}`,
    borderRadius: 6, outline: 'none', width: '100%', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  errorBox: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 5, padding: '8px 12px', fontSize: 13 },
  btn: {
    padding: '10px', fontSize: 14, fontWeight: 600, border: 'none',
    borderRadius: 6, background: T.red, color: T.white, cursor: 'pointer',
    transition: 'background 0.15s',
  },
};
