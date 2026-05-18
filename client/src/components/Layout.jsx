import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { T } from '../theme';

export function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <Link to="/meetings" style={styles.brand}>
            <img src="/logo.svg" alt="Concntric" style={styles.logo} />
          </Link>
          <nav style={styles.nav}>
            <Link to="/meetings" style={{ ...styles.navLink, ...(isActive('/meetings') ? styles.navActive : {}) }}>
              Meetings
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin" style={{ ...styles.navLink, ...(isActive('/admin') ? styles.navActive : {}) }}>
                Admin
              </Link>
            )}
            {user?.role === 'facilitator' && (
              <>
                <span style={styles.navDivider} />
                <Link
                  to="/admin/settings"
                  style={{ ...styles.navLink, ...(isActive('/admin/settings') ? styles.navActive : {}) }}
                >
                  Meeting Configuration
                </Link>
              </>
            )}
          </nav>
          <div style={styles.userArea}>
            <span style={styles.userName}>{user?.name}</span>
            <button onClick={handleLogout} style={styles.logoutBtn}>Sign out</button>
          </div>
        </div>
      </header>
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles = {
  app: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: {
    background: T.white,
    borderBottom: `1px solid ${T.border}`,
    position: 'sticky', top: 0, zIndex: 100,
  },
  headerInner: {
    maxWidth: 1200, margin: '0 auto', padding: '0 24px',
    height: 56, display: 'flex', alignItems: 'center', gap: 32,
  },
  brand: { textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 },
  logo: { height: 32, display: 'block' },
  nav: { display: 'flex', alignItems: 'center', gap: 4, flex: 1 },
  navLink: {
    padding: '6px 12px', borderRadius: 6, textDecoration: 'none',
    color: T.textSecondary, fontSize: 14, fontWeight: 500,
    transition: 'color 0.15s',
  },
  navActive: { color: T.red, background: '#fdf2f2' },
  navDivider: {
    display: 'inline-block', width: 1, height: 18,
    background: T.border, margin: '0 6px',
  },
  userArea: { display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' },
  userName: { fontSize: 14, color: T.textSecondary },
  logoutBtn: {
    fontSize: 13, padding: '5px 12px', border: `1px solid ${T.border}`,
    borderRadius: 5, background: T.white, cursor: 'pointer', color: T.textSecondary,
  },
  main: { flex: 1, maxWidth: 1200, width: '100%', margin: '0 auto', padding: '32px 24px' },
};
