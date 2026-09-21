import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { showToast } from '../components/Toast';
import { T, btn } from '../theme';

export function AdminOltTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState('');
  const [addingTeam, setAddingTeam] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [newItemText, setNewItemText] = useState({});
  const [editingItem, setEditingItem] = useState(null);

  const load = () =>
    api.getOltTeams()
      .then(setTeams)
      .catch(e => showToast(e.message, 'error'))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleAddTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setAddingTeam(true);
    try {
      await api.createOltTeam(newTeamName.trim(), '');
      setNewTeamName(''); setNewTeamOwner('');
      showToast('Team added');
      load();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setAddingTeam(false);
    }
  };

  const handleSaveTeam = async () => {
    if (!editingTeam) return;
    try {
      await api.updateOltTeam(editingTeam.id, { name: editingTeam.name });
      showToast('Team updated');
      setEditingTeam(null);
      load();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleDeleteTeam = async (id, name) => {
    if (!confirm(`Delete team "${name}"? This will also remove all its agenda items.`)) return;
    try {
      await api.deleteOltTeam(id);
      showToast(`Team deleted`);
      if (expandedTeam === id) setExpandedTeam(null);
      load();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleAddItem = async (teamId) => {
    const text = newItemText[teamId]?.trim();
    if (!text) return;
    try {
      await api.createOltItem(teamId, text);
      setNewItemText(prev => ({ ...prev, [teamId]: '' }));
      showToast('Item added');
      load();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleSaveItem = async () => {
    if (!editingItem) return;
    try {
      await api.updateOltItem(editingItem.teamId, editingItem.id, editingItem.text);
      showToast('Item updated');
      setEditingItem(null);
      load();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleDeleteItem = async (teamId, itemId, text) => {
    if (!confirm(`Remove item "${text}"?`)) return;
    try {
      await api.deleteOltItem(teamId, itemId);
      showToast('Item removed');
      load();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const focusRed = (e) => { e.target.style.borderColor = T.red; };
  const blurGray = (e) => { e.target.style.borderColor = T.border; };

  return (
    <div>
      <h1 style={styles.title}>OLT Meeting Configuration</h1>
      <p style={styles.subtitle}>
        Configure the teams and agenda items that pre-populate each new OLT meeting. Changes apply to new meetings only.
      </p>

      {/* Add team */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Add team</h2>
        <form onSubmit={handleAddTeam} style={styles.addForm}>
          <input
            value={newTeamName} onChange={e => setNewTeamName(e.target.value)}
            placeholder="Team name (e.g. Sales)" required style={styles.input}
            onFocus={focusRed} onBlur={blurGray}
          />
          <button
            type="submit" disabled={addingTeam} style={btn.primarySm}
            onMouseEnter={e => { if (!addingTeam) e.target.style.background = T.redDark; }}
            onMouseLeave={e => { e.target.style.background = T.red; }}
          >
            {addingTeam ? 'Adding…' : 'Add team'}
          </button>
        </form>
      </div>

      {loading ? (
        <div style={{ color: T.textSecondary }}>Loading…</div>
      ) : (
        <div style={styles.list}>
          {teams.map((team, idx) => (
            <div key={team.id} style={styles.teamCard}>
              {/* Team header row */}
              <div style={styles.teamHeader}>
                <div style={styles.teamOrder}>{idx + 1}</div>
                {editingTeam?.id === team.id ? (
                  <>
                    <input
                      value={editingTeam.name}
                      onChange={e => setEditingTeam({ ...editingTeam, name: e.target.value })}
                      style={{ ...styles.input, flex: 1 }}
                      onFocus={focusRed} onBlur={blurGray}
                    />
                    <button onClick={handleSaveTeam} style={styles.saveBtn}>Save</button>
                    <button onClick={() => setEditingTeam(null)} style={styles.cancelBtn}>Cancel</button>
                  </>
                ) : (
                  <>
                    <div style={styles.teamName}>{team.name}</div>
                    <div style={styles.teamItemCount}>{team.items?.length || 0} items</div>
                    <button
                      onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
                      style={styles.expandBtn}
                    >
                      {expandedTeam === team.id ? 'Hide items ▲' : 'Edit items ▼'}
                    </button>
                    <button
                      onClick={() => setEditingTeam({ id: team.id, name: team.name })}
                      style={styles.editBtn}
                    >
                      Edit
                    </button>
                    <button onClick={() => handleDeleteTeam(team.id, team.name)} style={styles.removeBtn}>
                      Delete
                    </button>
                  </>
                )}
              </div>

              {/* Items panel */}
              {expandedTeam === team.id && (
                <div style={styles.itemsPanel}>
                  {(team.items || []).map((item) => (
                    <div key={item.id} style={styles.itemRow}>
                      {editingItem?.id === item.id ? (
                        <>
                          <input
                            value={editingItem.text}
                            onChange={e => setEditingItem({ ...editingItem, text: e.target.value })}
                            style={{ ...styles.input, flex: 1 }}
                            onFocus={focusRed} onBlur={blurGray}
                          />
                          <button onClick={handleSaveItem} style={styles.saveBtn}>Save</button>
                          <button onClick={() => setEditingItem(null)} style={styles.cancelBtn}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <span style={styles.itemText}>{item.text}</span>
                          <button
                            onClick={() => setEditingItem({ id: item.id, teamId: team.id, text: item.text })}
                            style={styles.editBtn}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(team.id, item.id, item.text)}
                            style={styles.removeBtn}
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  ))}

                  {/* Add item */}
                  <div style={styles.addItemRow}>
                    <input
                      value={newItemText[team.id] || ''}
                      onChange={e => setNewItemText(prev => ({ ...prev, [team.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleAddItem(team.id)}
                      placeholder="Add agenda item…"
                      style={{ ...styles.input, flex: 1 }}
                      onFocus={focusRed} onBlur={blurGray}
                    />
                    <button
                      onClick={() => handleAddItem(team.id)}
                      disabled={!newItemText[team.id]?.trim()}
                      style={styles.addItemBtn}
                    >
                      Add item
                    </button>
                  </div>
                </div>
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
  teamCard: {
    background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden',
  },
  teamHeader: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', flexWrap: 'wrap',
  },
  teamOrder: { fontSize: 12, color: '#9ca3af', fontWeight: 600, minWidth: 20 },
  teamName: { fontWeight: 600, fontSize: 15, color: T.text, flex: 1, minWidth: 100 },
  teamOwner: { fontSize: 13, color: T.textSecondary, minWidth: 80 },
  teamItemCount: { fontSize: 12, color: '#9ca3af', minWidth: 50 },
  expandBtn: {
    fontSize: 12, padding: '4px 10px', border: `1px solid ${T.border}`,
    borderRadius: 4, background: T.white, cursor: 'pointer', color: T.textSecondary,
  },
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
    fontSize: 12, padding: '4px 10px', border: '1px solid #fecaca',
    borderRadius: 4, background: T.white, cursor: 'pointer', color: '#dc2626',
  },
  itemsPanel: {
    borderTop: `1px solid ${T.border}`, padding: '12px 16px 16px',
    background: '#fafafa', display: 'flex', flexDirection: 'column', gap: 6,
  },
  itemRow: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
    background: T.white, border: `1px solid ${T.border}`, borderRadius: 5,
  },
  itemText: { flex: 1, fontSize: 13, color: T.text },
  addItemRow: { display: 'flex', gap: 8, marginTop: 4 },
  addItemBtn: {
    padding: '8px 14px', fontSize: 13, border: `1px solid ${T.border}`,
    borderRadius: 5, background: T.white, cursor: 'pointer', color: T.textSecondary, flexShrink: 0,
  },
};
