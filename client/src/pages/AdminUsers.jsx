import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { showToast } from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import { T, btn } from '../theme';

const ROLE_DESCRIPTIONS = {
  admin: 'Full access including admin panel and all settings',
  facilitator: 'Can create and run meetings — no admin access',
  participant: 'View and edit access to meetings matching their meeting type',
};

const ROLE_LABELS = { admin: 'Admin', facilitator: 'Facilitator', participant: 'Participant' };
const ACCESS_LABELS = { slt: 'SLT', olt: 'OLT', both: 'Both' };

function RolePill({ role }) {
  const s = role === 'admin' ? styles.roleAdmin
    : role === 'facilitator' ? styles.roleFacilitator
    : styles.roleParticipant;
  return <span style={s}>{ROLE_LABELS[role] || role}</span>;
}

function AccessPill({ access }) {
  const s = access === 'slt' ? styles.accessSlt
    : access === 'olt' ? styles.accessOlt
    : styles.accessBoth;
  return <span style={s}>{ACCESS_LABELS[access] || access}</span>;
}

export function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('participant');
  const [inviteAccess, setInviteAccess] = useState('both');
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [editingRoleValue, setEditingRoleValue] = useState('');
  const [editingAccessId, setEditingAccessId] = useState(null);
  const [editingAccessValue, setEditingAccessValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = () =>
    api.getUsers()
      .then(setUsers)
      .catch(e => showToast(e.message, 'error'))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    setInviting(true);
    setInviteLink('');
    try {
      const res = await api.inviteUser(inviteName.trim(), inviteEmail.trim(), inviteRole, inviteAccess);
      setInviteLink(res.inviteUrl);
      showToast('Invite link generated');
      setInviteName(''); setInviteEmail('');
      setInviteRole('participant'); setInviteAccess('both');
      load();
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

  const saveRole = async (u) => {
    if (editingRoleValue === u.role) { setEditingRoleId(null); return; }
    try {
      await api.editUserRole(u.id, editingRoleValue);
      showToast(`${u.name}'s role updated`);
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: editingRoleValue } : x));
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setEditingRoleId(null);
    }
  };

  const saveAccess = async (u) => {
    if (editingAccessValue === (u.meeting_access || 'both')) { setEditingAccessId(null); return; }
    try {
      await api.editUserAccess(u.id, editingAccessValue);
      showToast(`${u.name}'s meeting access updated`);
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, meeting_access: editingAccessValue } : x));
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setEditingAccessId(null);
    }
  };

  const handleDelete = async () => {
    const u = confirmDelete;
    setConfirmDelete(null);
    try {
      await api.deleteUser(u.id);
      setUsers(prev => prev.filter(x => x.id !== u.id));
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
          <div style={styles.selectGroup}>
            <label style={styles.selectLabel}>Role</label>
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={styles.select}>
              <option value="admin">Admin</option>
              <option value="facilitator">Facilitator</option>
              <option value="participant">Participant</option>
            </select>
            <div style={styles.selectDesc}>{ROLE_DESCRIPTIONS[inviteRole]}</div>
          </div>
          <div style={styles.selectGroup}>
            <label style={styles.selectLabel}>Meeting access</label>
            <select value={inviteAccess} onChange={e => setInviteAccess(e.target.value)} style={styles.select}>
              <option value="slt">SLT only</option>
              <option value="olt">OLT only</option>
              <option value="both">Both SLT &amp; OLT</option>
            </select>
            <div style={styles.selectDesc}>Which meetings this user can see</div>
          </div>
          <button
            type="submit" disabled={inviting} style={{ ...btn.primarySm, alignSelf: 'flex-start', marginTop: 20 }}
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

      {loading ? <div style={{ color: T.textSecondary, padding: '20px 0' }}>Loading…</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Name', 'Email', 'Role', 'Meeting Access', 'Status', 'Joined', 'Last Login', ''].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={styles.td}>{u.name}</td>
                  <td style={styles.td}>{u.email}</td>
                  <td style={styles.td}>
                    {editingRoleId === u.id ? (
                      <div style={styles.inlineEdit}>
                        <select
                          value={editingRoleValue}
                          onChange={e => setEditingRoleValue(e.target.value)}
                          style={styles.inlineSelect} autoFocus
                        >
                          <option value="admin">Admin</option>
                          <option value="facilitator">Facilitator</option>
                          <option value="participant">Participant</option>
                        </select>
                        <button onClick={() => saveRole(u)} style={styles.saveBtn}>Save</button>
                        <button onClick={() => setEditingRoleId(null)} style={styles.actionBtn}>✕</button>
                      </div>
                    ) : (
                      <div style={styles.pillRow}>
                        <RolePill role={u.role} />
                        {u.id !== currentUser?.id && (
                          <button onClick={() => { setEditingRoleId(u.id); setEditingRoleValue(u.role); }} style={styles.editPillBtn}>edit</button>
                        )}
                      </div>
                    )}
                  </td>
                  <td style={styles.td}>
                    {editingAccessId === u.id ? (
                      <div style={styles.inlineEdit}>
                        <select
                          value={editingAccessValue}
                          onChange={e => setEditingAccessValue(e.target.value)}
                          style={styles.inlineSelect} autoFocus
                        >
                          <option value="slt">SLT only</option>
                          <option value="olt">OLT only</option>
                          <option value="both">Both</option>
                        </select>
                        <button onClick={() => saveAccess(u)} style={styles.saveBtn}>Save</button>
                        <button onClick={() => setEditingAccessId(null)} style={styles.actionBtn}>✕</button>
                      </div>
                    ) : (
                      <div style={styles.pillRow}>
                        <AccessPill access={u.meeting_access || 'both'} />
                        {u.id !== currentUser?.id && (
                          <button onClick={() => { setEditingAccessId(u.id); setEditingAccessValue(u.meeting_access || 'both'); }} style={styles.editPillBtn}>edit</button>
                        )}
                      </div>
                    )}
                  </td>
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
                        <button onClick={() => toggleUser(u)} style={styles.actionBtn}>
                          {u.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
                        <button onClick={() => setConfirmDelete(u)} style={styles.deleteBtn}>Delete</button>
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
  inviteForm: { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' },
  input: {
    padding: '8px 12px', fontSize: 13, border: `1px solid ${T.border}`,
    borderRadius: 5, outline: 'none', minWidth: 180, flex: 1,
    transition: 'border-color 0.15s',
  },
  selectGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
  selectLabel: { fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' },
  select: {
    padding: '8px 10px', fontSize: 13, border: `1px solid ${T.border}`,
    borderRadius: 5, outline: 'none', background: T.white, cursor: 'pointer', minWidth: 160,
  },
  selectDesc: { fontSize: 11, color: T.textSecondary, maxWidth: 200 },
  inviteLinkBox: { marginTop: 16, padding: '12px 14px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6 },
  inviteLinkLabel: { fontSize: 12, fontWeight: 600, color: T.textSecondary, marginBottom: 6 },
  inviteLinkRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  inviteLink: { fontSize: 12, color: T.text, wordBreak: 'break-all', flex: 1 },
  copyBtn: {
    padding: '4px 10px', fontSize: 12, border: `1px solid ${T.red}`,
    borderRadius: 4, background: T.white, cursor: 'pointer', color: T.red, whiteSpace: 'nowrap',
  },
  table: {
    width: '100%', borderCollapse: 'collapse', fontSize: 13, background: T.white,
    border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden',
  },
  th: {
    textAlign: 'left', padding: '10px 12px', fontWeight: 600, fontSize: 11,
    color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em',
    borderBottom: `1px solid ${T.border}`, background: T.surface, whiteSpace: 'nowrap',
  },
  td: { padding: '10px 12px', borderBottom: `1px solid #f3f4f6`, color: T.text, verticalAlign: 'middle' },
  pillRow: { display: 'flex', alignItems: 'center', gap: 6 },
  inlineEdit: { display: 'flex', alignItems: 'center', gap: 4 },
  inlineSelect: {
    fontSize: 12, padding: '3px 6px', border: `1px solid ${T.border}`,
    borderRadius: 4, background: T.white, cursor: 'pointer',
  },
  editPillBtn: {
    fontSize: 10, padding: '1px 5px', border: `1px solid ${T.border}`,
    borderRadius: 3, background: 'none', cursor: 'pointer', color: T.textSecondary,
  },
  // Role pills
  roleAdmin: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#1f2937', color: '#f9fafb', border: '1px solid #374151' },
  roleFacilitator: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' },
  roleParticipant: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: T.surface, color: T.textSecondary, border: `1px solid ${T.border}` },
  // Access pills
  accessSlt: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#f0f4ff', color: '#3b5bdb', border: '1px solid #c5d0f5' },
  accessOlt: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' },
  accessBoth: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' },
  // Status pills
  statusActive: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' },
  statusInactive: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' },
  actions: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  actionBtn: {
    fontSize: 12, padding: '4px 10px', border: `1px solid ${T.border}`,
    borderRadius: 4, background: T.white, cursor: 'pointer', color: T.textSecondary, whiteSpace: 'nowrap',
  },
  saveBtn: {
    fontSize: 12, padding: '4px 10px', border: `1px solid ${T.red}`,
    borderRadius: 4, background: T.red, cursor: 'pointer', color: T.white, whiteSpace: 'nowrap',
  },
  deleteBtn: {
    fontSize: 12, padding: '4px 10px', border: '1px solid #fca5a5',
    borderRadius: 4, background: T.white, cursor: 'pointer', color: '#dc2626', whiteSpace: 'nowrap',
  },
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
    borderRadius: 5, background: T.red, cursor: 'pointer', color: T.white, fontWeight: 600,
  },
};
