import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { showToast } from '../components/Toast';
import { T, btn } from '../theme';

export function AdminTeam() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => api.getTeam().then(setMembers).catch(e => showToast(e.message, 'error')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newRole.trim()) return;
    setAdding(true);
    try {
      await api.addTeamMember(newName.trim(), newRole.trim());
      setNewName(''); setNewRole('');
      showToast('Team member added');
      load();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    try {
      await api.updateTeamMember(editing.id, { name: editing.name, role: editing.role });
      showToast('Updated');
      setEditing(null);
      load();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleRemove = async (id, name) => {
    if (!confirm(`Remove ${name} from the team?`)) return;
    try {
      await api.removeTeamMember(id);
      showToast(`${name} removed`);
      load();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const focusRed = (e) => { e.target.style.borderColor = T.red; };
  const blurGray = (e) => { e.target.style.borderColor = T.border; };

  return (
    <div>
      <h1 style={styles.title}>Team Configuration</h1>
      <p style={styles.subtitle}>These team members appear in the Lightning Round cards and Owner dropdowns throughout the meeting runner.</p>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Add team member</h2>
        <form onSubmit={handleAdd} style={styles.addForm}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name" required style={styles.input} onFocus={focusRed} onBlur={blurGray} />
          <input value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="Role / Title" required style={styles.input} onFocus={focusRed} onBlur={blurGray} />
          <button
            type="submit" disabled={adding} style={btn.primarySm}
            onMouseEnter={e => { if (!adding) e.target.style.background = T.redDark; }}
            onMouseLeave={e => { e.target.style.background = T.red; }}
          >
            {adding ? 'Adding…' : 'Add member'}
          </button>
        </form>
      </div>

      {loading ? <div style={{ color: T.textSecondary }}>Loading…</div> : (
        <div style={styles.list}>
          {members.map((m, idx) => (
            <div key={m.id} style={styles.memberRow}>
              <div style={styles.orderNum}>{idx + 1}</div>
              {editing?.id === m.id ? (
                <>
                  <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} style={{ ...styles.input, flex: 1 }} onFocus={focusRed} onBlur={blurGray} />
                  <input value={editing.role} onChange={e => setEditing({ ...editing, role: e.target.value })} style={{ ...styles.input, flex: 1 }} onFocus={focusRed} onBlur={blurGray} />
                  <button onClick={handleSaveEdit} style={styles.saveBtn}>Save</button>
                  <button onClick={() => setEditing(null)} style={styles.cancelBtn}>Cancel</button>
                </>
              ) : (
                <>
                  <div style={styles.memberName}>{m.name}</div>
                  <div style={styles.memberRole}>{m.role}</div>
                  <button onClick={() => setEditing({ id: m.id, name: m.name, role: m.role })} style={styles.editBtn}>Edit</button>
                  <button onClick={() => handleRemove(m.id, m.name)} style={styles.removeBtn}>Remove</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  title: { margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: T.text },
  subtitle: { margin: '0 0 24px', fontSize: 13, color: T.textSecondary },
  card: { background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, padding: '20px 24px', marginBottom: 20 },
  cardTitle: { margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: T.text },
  addForm: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  input: {
    padding: '8px 12px', fontSize: 13, border: `1px solid ${T.border}`,
    borderRadius: 5, outline: 'none', flex: 1, minWidth: 140, boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  memberRow: {
    display: 'flex', alignItems: 'center', gap: 12, background: T.white,
    border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px', flexWrap: 'wrap',
  },
  orderNum: { fontSize: 12, color: '#9ca3af', fontWeight: 600, minWidth: 20 },
  memberName: { fontWeight: 600, fontSize: 14, color: T.text, flex: 1, minWidth: 100 },
  memberRole: { fontSize: 13, color: T.textSecondary, flex: 2, minWidth: 120 },
  editBtn: {
    fontSize: 12, padding: '4px 10px', border: `1px solid ${T.border}`,
    borderRadius: 4, background: T.white, cursor: 'pointer', color: T.textSecondary,
  },
  saveBtn: {
    fontSize: 12, padding: '4px 10px', border: `1px solid ${T.red}`,
    borderRadius: 4, background: T.red, cursor: 'pointer', color: T.white, fontWeight: 600,
  },
  cancelBtn: {
    fontSize: 12, padding: '4px 10px', border: `1px solid ${T.border}`,
    borderRadius: 4, background: T.white, cursor: 'pointer', color: T.textSecondary,
  },
  removeBtn: {
    fontSize: 12, padding: '4px 10px', border: `1px solid #fecaca`,
    borderRadius: 4, background: T.white, cursor: 'pointer', color: '#dc2626',
  },
};
