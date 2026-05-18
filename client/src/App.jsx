import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastContainer } from './components/Toast';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { AcceptInvite } from './pages/AcceptInvite';
import { Meetings } from './pages/Meetings';
import { MeetingRunner } from './pages/MeetingRunner';
import { AdminLayout, AdminDashboard } from './pages/AdminDashboard';
import { AdminUsers } from './pages/AdminUsers';
import { AdminTeam } from './pages/AdminTeam';
import { AdminSettings } from './pages/AdminSettings';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== 'admin') return <Navigate to="/meetings" replace />;
  return children;
}

// Allows admin and facilitator; blocks participant
function RequireFacilitatorOrAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || (user.role !== 'admin' && user.role !== 'facilitator')) {
    return <Navigate to="/meetings" replace />;
  }
  return children;
}

function RedirectIfAuthed({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/meetings" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />
          <Route path="/accept-invite/:token" element={<AcceptInvite />} />

          <Route path="/meetings" element={<RequireAuth><Layout><Meetings /></Layout></RequireAuth>} />
          <Route path="/meetings/:id" element={<RequireAuth><Layout><MeetingRunner /></Layout></RequireAuth>} />

          {/* /admin/settings: accessible to facilitators and admins */}
          <Route
            path="/admin/settings"
            element={
              <RequireFacilitatorOrAdmin>
                <Layout><AdminSettings /></Layout>
              </RequireFacilitatorOrAdmin>
            }
          />

          {/* All other /admin/* routes: admin only, use AdminLayout with sidebar */}
          <Route path="/admin" element={<RequireAdmin><Layout><AdminLayout /></Layout></RequireAdmin>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="team" element={<AdminTeam />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="/" element={<Navigate to="/meetings" replace />} />
          <Route path="*" element={<Navigate to="/meetings" replace />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </AuthProvider>
  );
}
