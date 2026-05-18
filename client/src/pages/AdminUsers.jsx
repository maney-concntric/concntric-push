import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { showToast } from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import { T, btn } from '../theme';

const ROLE_DESCRIPTIONS = {
  admin: 'Full access including admin panel and all settings',
  facilitator: 'Can create and run meetings — no admin access',
  participant: 'Read and edit access to assigned meetings only',
};

const ROLE_LABELS = {
  admin: 'Admin',
  facilitator: 'Facilitator',
  participant: 'Participant',
};

function RolePill({ role }) {
  const s = role === 'admin' ? styles.roleAdmin
    : role === 'facilitator' ? styles.roleFacilitator
    : styles.roleParticipant;
  return <span style={s}>{ROLE_LABELS[role] || role}</span>;
}

function ParticipantPanel({ user, allMeetings, onClose }) {
  const [assignedIds, setAssignedIds] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getUserMeetings(user.id)
      .then(meetings => setAssignedIds(new Set(meetings.map(m => m.id))))
      .catch(e => showToast(e.message, 'error'));
  }, [user.id]);

  const toggle = async (meetingId) => {
    if (busy || assignedIds === null) return;
    setBusy(true);
    const isAssigned = assignedIds.has(meetingId);
    try {
      if (isAssigned) {
        await api.unassignMeeting(user.id, meetingId);
        setAssignedIds(prev => { const s = new Set(prev); s.delete(meetingId); return s; });
      } else {
        await api.assignMeeting(user.id, meetingId);
        setAssignedIds(prev => new Set([...prev, meetingId]));
      }
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const fmt = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <div>
          <div style={styles.panelTitle}>Meeting Access — {user.name}</div>
          <div style={styles.panelSub}>Check meetings this participant can view and edit</div>
        </div>
        <button onClick={onClose} style={styles.panelClose}>✕</button>
      </div>
      {assignedIds === null ? (
        <div style={styles.panelLoading}>Loading…</div>
      ) : allMeetings.length === 0 ? (
        <div style={styles.panelLoading}>No meetings exist yet.</div>
      ) : (
        <div style={styles.panelList}>
          {allMeetings.map(m => (
            <label key={m.id} style={styles.panelRow}>
              <input
                type="checkbox"
                checked={assignedIds.has(m.id)}
                onChange={() => toggle(m.id)}
                style={{ accentColor: T.red, width: 15, height: 15, cursor: 'pointer' }}
              />
              <span style={styles.panelMeetingDate}>{fmt(m.date)}</span>
              <span style={styles.panelMeetingFac}>{m.facilitator || '—'}</span>
              <span style={m.is_complete ? styles.panelBadgeComplete : styles.panelBadgeActive}>
                {m.is_complete ? 'Complete' : 'Active'}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [allMeetings, setAllMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('facilitator');
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [editingRoleValue, setEditingRoleValue] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // user object to delete

  useEffect(() => {
    Promise.all([api.getUsers(), api.getMeetings()])
      .then(([u, m]) => { setUsers(u); setAllMeetings(m); })
      .catch(e => showToast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    setInviting(true);
    setInviteLink('');
    try {
      const res = await api.inviteUser(inviteName.trim(), inviteEmail.trim(), inviteRole);
      setInviteLink(res.inviteUrl);
      showToast('Invite link generated');
      setInviteName('');
      setInviteEmail('');
      setInviteRole('facilitator');
      setUsers(await api.getUsers());
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setInviting(false);
    }
  };

  const toggleUser = async (u) => {
    try {
      if (u.is_active) {
        await api.deactivateUser(u.id);
        showToast(`${u.name} deactivated`);
      } else {
        await api.reactivateUser(u.id);
        showToast(`${u.name} reactivated`);
      }
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: u.is_active ? 0 : 1 } : x));
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const startEditRole = (u) => {
    setEditingRoleId(u.id);
    setEditingRoleValue(u.role);
  };

  const saveRole = async (u) => {
    if (editingRoleValue === u.role) { setEditingRoleId(null); return; }
    try {
      await api.editUserRole(u.id, editingRoleValue);
      showToast(`${u.name}'s role updated to ${ROLE_LABELS[editingRoleValue]}`);
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: editingRoleValue } : x));
      if (selectedParticipant?.id === u.id) setSelectedParticipant(null);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setEditingRoleId(null);
    }
  };

  const handleDelete = async () => {
    const u = confirmDelete;
    setConfirmDelete(null);
    try {
      await api.deleteUser(u.id);
      setUsers(prev => prev.filter(x => x.id !== u.id));
      if (selectedParticipant?.id === u.id) setSelectedParticipant(null);
      showToast('User deleted');
    } catch (e) {
      showToast('Failed to delete user', 'error');
    }
  };

  const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  const focusRed = (e) => { e.target.style.borderColor = T.red; };
  const blurGray = (e) => { e.target.style.borderColor = T.border; };

  return (
    <div>
      <h1 style={styles.title}>Users</h1>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Invite a user</h2>
        <form onSubmit={handleInvite} style={styles.inviteForm}>
          <input
            value={inviteName} onChange={e => setInviteName(e.target.value)}
            placeholder="Full name" required style={styles.input}
            onFocus={focusRed} onBlur={blurGray}
          />
          <input
            type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
            placeholder="Email address" required style={styles.input}
            onFocus={focusRed} onBlur={blurGray}
          />
          <div style={styles.roleSelectWrap}>
            <select
              value={inviteRole} onChange={e => setInviteRole(e.target.value)}
              style={styles.roleSelect}
            >
              <option value="admin">Admin</option>
              <option value="facilitator">Facilitator</option>
              <option value="participant">Participant</option>
            </select>
            <div style={styles.roleDesc}>{ROLE_DESCRIPTIONS[inviteRole]}</div>
          </div>
          <button
            type="submit" disabled={inviting} style={btn.primarySm}
            onMouseEnter={e => { if (!inviting) e.target.style.background = T.redDark; }}
            onMouseLeave={e => { e.target.style.background = T.red; }}
          >
            {inviting ? 'Generating…' : 'Generate invite link'}
          </button>
        </form>
        {inviteLink && (
          <div style={styles.inviteLinkBox}>
            <div style={styles.inviteLinkLabel}>Share this link (valid 48 hours):</div>
            <div style={styles.inviteLinkRow}>
              <code style={styles.inviteLink}>{inviteLink}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(inviteLink); showToast('Copied!'); }}
                style={styles.copyBtn}
              >Copy</button>
            </div>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div style={styles.dialogOverlay}>
          <div style={styles.dialog}>
            <div style={styles.dialogTitle}>Delete user</div>
            <p style={styles.dialogMsg}>
              Are you sure you want to permanently delete <strong>{confirmDelete.name}</strong>? This cannot be undone.
            </p>
            <div style={styles.dialogBtns}>
              <button onClick={() => setConfirmDelete(null)} style={styles.actionBtn}>Cancel</button>
              <button onClick={handleDelete} style={styles.deletePermanentBtn}>Delete permanently</button>
            </div>
          </div>
        </div>
      )}

      {selectedParticipant && (
        <ParticipantPanel
          user={selectedParticipant}
          allMeetings={allMeetings}
          onClose={() => setSelectedParticipant(null)}
        />
      )}

      {loading ? <div style={{ color: T.textSecondary, padding: '20px 0' }}>Loading…</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Name', 'Email', 'Role', 'Status', 'Joined', 'Last Login', ''].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={selectedParticipant?.id === u.id ? styles.rowHighlight : {}}>
                  <td style={styles.td}>
                    {u.role === 'participant' ? (
                      <button
                        onClick={() => setSelectedParticipant(selectedParticipant?.id === u.id ? null : u)}
                        style={styles.nameBtn}
                        title="Manage meeting access"
                      >
                        {u.name} ↗
                      </button>
                    ) : u.name}
                  </td>
                  <td style={styles.td}>{u.email}</td>
                  <td style={styles.td}><RolePill role={u.role} /></td>
                  <td style={styles.td}>
                    <span style={u.is_active ? styles.statusActive : styles.statusInactive}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={styles.td}>{fmtDate(u.created_at)}</td>
                  <td style={styles.td}>{fmtDate(u.last_login)}</td>
                  <td style={styles.td}>
                    {u.id !== currentUser?.id && (
                      <div style={styles.actions}>
                        {editingRoleId === u.id ? (
                          <>
                            <select
                              value={editingRoleValue}
                              onChange={e => setEditingRoleValue(e.target.value)}
                              style={styles.inlineRoleSelect}
                              autoFocus
                            >
                              <option value="admin">Admin</option>
                              <option value="facilitator">Facilitator</option>
                              <option value="participant">Participant</option>
                            </select>
                            <button onClick={() => saveRole(u)} style={styles.saveBtn}>Save</button>
                            <button onClick={() => setEditingRoleId(null)} style={styles.actionBtn}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEditRole(u)} style={styles.actionBtn}>Edit Role</button>
                            <button onClick={() => toggleUser(u)} style={styles.actionBtn}>
                              {u.is_active ? 'Deactivate' : 'Reactivate'}
                            </button>
                            <button onClick={() => setConfirmDelete(u)} style={styles.deleteBtn}>Delete</button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  title: { margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: T.text },
  card: { background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, padding: '20px 24px', marginBottom: 24 },
  cardTitle: { margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: T.text },
  inviteForm: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' },
  input: {
    padding: '8px 12px', fontSize: 13, border: `1px solid ${T.border}`,
    borderRadius: 5, outline: 'none', minWidth: 180, flex: 1,
    transition: 'border-color 0.15s',
  },
  roleSelectWrap: { display: 'flex', flexDirection: 'column', gap: 4 },
  roleSelect: {
    padding: '8px 10px', fontSize: 13, border: `1px solid ${T.border}`,
    borderRadius: 5, outline: 'none', background: T.white, cursor: 'pointer', minWidth: 160,
  },
  roleDesc: { fontSize: 11, color: T.textSecondary, maxWidth: 200 },
  inviteLinkBox: { marginTop: 16, padding: '12px 14px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6 },
  inviteLinkLabel: { fontSize: 12, fontWeight: 600, color: T.textSecondary, marginBottom: 6 },
  inviteLinkRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  inviteLink: { fontSize: 12, color: T.text, wordBreak: 'break-all', flex: 1 },
  copyBtn: {
    padding: '4px 10px', fontSize: 12, border: `1px solid ${T.red}`,
    borderRadius: 4, background: T.white, cursor: 'pointer', color: T.red, whiteSpace: 'nowrap',
  },
  // Assignment panel
  panel: {
    background: T.white, border: `1px solid ${T.red}`, borderRadius: 8,
    padding: '16px 20px', marginBottom: 16,
  },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  panelTitle: { fontSize: 15, fontWeight: 600, color: T.text },
  panelSub: { fontSize: 12, color: T.textSecondary, marginTop: 2 },
  panelClose: { background: 'none', border: 'none', cursor: 'pointer', color: T.textSecondary, fontSize: 16, padding: 0 },
  panelLoading: { fontSize: 13, color: T.textSecondary, padding: '8px 0' },
  panelList: { display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' },
  panelRow: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px',
    borderRadius: 5, cursor: 'pointer', fontSize: 13,
    transition: 'background 0.1s',
  },
  panelMeetingDate: { flex: 1, color: T.text, fontWeight: 500 },
  panelMeetingFac: { color: T.textSecondary, fontSize: 12 },
  panelBadgeComplete: { fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 8, background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' },
  panelBadgeActive: { fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 8, background: '#fdf2f2', color: T.red, border: `1px solid #f5c6c8` },
  // Table
  table: {
    width: '100%', borderCollapse: 'collapse', fontSize: 13, background: T.white,
    border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden',
  },
  th: {
    textAlign: 'left', padding: '10px 12px', fontWeight: 600, fontSize: 11,
    color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em',
    borderBottom: `1px solid ${T.border}`, background: T.surface, whiteSpace: 'nowrap',
  },
  td: { padding: '10px 12px', borderBottom: `1px solid #f3f4f6`, color: T.text },
  rowHighlight: { background: '#fdf2f2' },
  nameBtn: {
    background: 'none', border: 'none', cursor: 'pointer', color: T.red,
    fontSize: 13, fontWeight: 500, padding: 0, textDecoration: 'underline',
    textDecorationStyle: 'dotted',
  },
  // Role pills
  roleAdmin: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#1f2937', color: '#f9fafb', border: '1px solid #374151' },
  roleFacilitator: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' },
  roleParticipant: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: T.surface, color: T.textSecondary, border: `1px solid ${T.border}` },
  // Status pills
  statusActive: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' },
  statusInactive: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' },
  // Actions
  actions: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  actionBtn: {
    fontSize: 12, padding: '4px 10px', border: `1px solid ${T.border}`,
    borderRadius: 4, background: T.white, cursor: 'pointer', color: T.textSecondary, whiteSpace: 'nowrap',
  },
  saveBtn: {
    fontSize: 12, padding: '4px 10px', border: `1px solid ${T.red}`,
    borderRadius: 4, background: T.red, cursor: 'pointer', color: T.white, whiteSpace: 'nowrap',
  },
  inlineRoleSelect: {
    fontSize: 12, padding: '3px 6px', border: `1px solid ${T.border}`,
    borderRadius: 4, background: T.white, cursor: 'pointer',
  },
  deleteBtn: {
    fontSize: 12, padding: '4px 10px', border: `1px solid #fca5a5`,
    borderRadius: 4, background: T.white, cursor: 'pointer', color: '#dc2626', whiteSpace: 'nowrap',
  },
  // Confirmation dialog
  dialogOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  dialog: {
    background: T.white, borderRadius: 10, padding: '24px 28px',
    maxWidth: 420, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  },
  dialogTitle: { fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 10 },
  dialogMsg: { fontSize: 14, color: T.textSecondary, lineHeight: 1.5, margin: '0 0 20px' },
  dialogBtns: { display: 'flex', justifyContent: 'flex-end', gap: 10 },
  deletePermanentBtn: {
    fontSize: 13, padding: '7px 16px', border: 'none',
    borderRadius: 5, background: T.red, cursor: 'pointer', color: T.white,
    fontWeight: 600,
  },
};
