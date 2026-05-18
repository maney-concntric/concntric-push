import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { api } from '../api/client';
import { showToast } from '../components/Toast';
import { T } from '../theme';

export function AdminLayout() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div style={styles.wrapper}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarTitle}>Admin</div>
        <nav style={styles.nav}>
          {[
            { to: '/admin',          label: 'Dashboard' },
            { to: '/admin/users',    label: 'Users' },
            { to: '/admin/team',     label: 'Team Config' },
            { to: '/admin/settings', label: 'Meeting Configuration' },
          ].map(({ to, label }) => (
            <Link
              key={to} to={to}
              style={{ ...styles.navLink, ...(isActive(to) ? styles.navActive : {}) }}
            >
              {isActive(to) && <span style={styles.navAccent} />}
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div style={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.getStats().then(setStats).catch(e => showToast(e.message, 'error'));
  }, []);

  return (
    <div>
      <h1 style={styles.title}>Dashboard</h1>
      <div style={styles.statsGrid}>
        <StatCard label="Active Users" value={stats?.totalUsers ?? '—'} />
        <StatCard label="Total Meetings" value={stats?.totalMeetings ?? '—'} />
        <StatCard label="Meetings This Month" value={stats?.meetingsThisMonth ?? '—'} />
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardValue}>{value}</div>
      <div style={styles.cardLabel}>{label}</div>
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', gap: 32, alignItems: 'flex-start' },
  sidebar: { width: 180, flexShrink: 0 },
  sidebarTitle: {
    fontSize: 11, fontWeight: 700, color: '#9ca3af',
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
  },
  nav: { display: 'flex', flexDirection: 'column', gap: 2 },
  navLink: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '7px 10px', borderRadius: 6, fontSize: 14, fontWeight: 500,
    color: T.textSecondary, textDecoration: 'none', position: 'relative',
  },
  navActive: { color: T.red, background: '#fdf2f2' },
  navAccent: {
    display: 'inline-block', width: 3, height: 16, borderRadius: 2,
    background: T.red, flexShrink: 0,
  },
  content: { flex: 1 },
  title: { margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: T.text },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 },
  card: { background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, padding: '20px 24px' },
  cardValue: { fontSize: 36, fontWeight: 700, color: T.red, lineHeight: 1 },
  cardLabel: { fontSize: 13, color: T.textSecondary, marginTop: 6 },
};
