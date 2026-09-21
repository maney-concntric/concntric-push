import { useState } from 'react';
import { T } from '../../theme';

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export function OltTeamSection({ data, onChange, onBlur }) {
  const items = data.items || [];
  const ideas = data.ideas || '';
  const [newItemText, setNewItemText] = useState('');

  const activeItems = items.filter(it => !it.completed);
  const completedItems = items.filter(it => it.completed);

  const update = (patch) => {
    const next = { ...data, ...patch };
    onChange(next);
    onBlur();
  };

  const toggleComplete = (id) => {
    update({ items: items.map(it => it.id === id ? { ...it, completed: !it.completed } : it) });
  };

  const updateNotes = (id, notes) => {
    onChange({ ...data, items: items.map(it => it.id === id ? { ...it, notes } : it) });
  };

  const addItem = () => {
    if (!newItemText.trim()) return;
    const next = [...items, { id: uid(), text: newItemText.trim(), completed: false, notes: '' }];
    setNewItemText('');
    update({ items: next });
  };

  const removeItem = (id) => {
    update({ items: items.filter(it => it.id !== id) });
  };

  return (
    <div>
      {/* Active items */}
      {activeItems.length === 0 && completedItems.length === 0 && (
        <div style={styles.empty}>No agenda items. Add one below.</div>
      )}

      {activeItems.map(item => (
        <ItemRow
          key={item.id}
          item={item}
          onToggle={() => toggleComplete(item.id)}
          onNotesChange={(v) => updateNotes(item.id, v)}
          onNotesBlur={() => onBlur()}
          onRemove={() => removeItem(item.id)}
        />
      ))}

      {/* Add item */}
      <div style={styles.addRow}>
        <input
          value={newItemText}
          onChange={e => setNewItemText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          placeholder="Add agenda item…"
          style={styles.addInput}
        />
        <button onClick={addItem} disabled={!newItemText.trim()} style={styles.addBtn}>Add</button>
      </div>

      {/* Completed section */}
      {completedItems.length > 0 && (
        <div style={styles.completedSection}>
          <div style={styles.completedHeader}>
            ✓ Completed ({completedItems.length})
          </div>
          {completedItems.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              onToggle={() => toggleComplete(item.id)}
              onNotesChange={(v) => updateNotes(item.id, v)}
              onNotesBlur={() => onBlur()}
              onRemove={() => removeItem(item.id)}
              completed
            />
          ))}
        </div>
      )}

      {/* Ideas & Initiatives */}
      <div style={styles.ideasSection}>
        <label style={styles.ideasLabel}>Ideas &amp; Initiatives</label>
        <textarea
          value={ideas}
          onChange={e => onChange({ ...data, ideas: e.target.value })}
          onBlur={onBlur}
          placeholder="Capture new ideas and initiatives from the team…"
          style={styles.ideasTextarea}
          rows={3}
        />
      </div>
    </div>
  );
}

function ItemRow({ item, onToggle, onNotesChange, onNotesBlur, onRemove, completed }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ ...styles.itemRow, ...(completed ? styles.itemRowCompleted : {}) }}>
      <div style={styles.itemTop}>
        <button onClick={onToggle} style={styles.checkBtn} title={completed ? 'Mark incomplete' : 'Mark complete'}>
          <span style={{ ...styles.checkbox, ...(completed ? styles.checkboxDone : {}) }}>
            {completed ? '✓' : ''}
          </span>
        </button>
        <span style={{ ...styles.itemText, ...(completed ? styles.itemTextDone : {}) }}>
          {item.text}
        </span>
        <button
          onClick={() => setExpanded(e => !e)}
          style={styles.notesToggle}
          title="Toggle notes"
        >
          {expanded ? '▲' : '▼'} notes
        </button>
        <button onClick={onRemove} style={styles.removeBtn} title="Remove item">×</button>
      </div>
      {expanded && (
        <textarea
          value={item.notes || ''}
          onChange={e => onNotesChange(e.target.value)}
          onBlur={onNotesBlur}
          placeholder="Notes…"
          style={styles.notesArea}
          rows={2}
          autoFocus
        />
      )}
    </div>
  );
}

const styles = {
  empty: { color: T.textSecondary, fontSize: 14, padding: '12px 0' },
  itemRow: {
    border: `1px solid ${T.border}`, borderRadius: 7, padding: '10px 14px',
    marginBottom: 8, background: T.white,
  },
  itemRowCompleted: { background: '#f9fafb', borderColor: '#e5e7eb' },
  itemTop: { display: 'flex', alignItems: 'center', gap: 10 },
  checkBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 },
  checkbox: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 20, height: 20, borderRadius: 4, border: `2px solid ${T.border}`,
    fontSize: 11, fontWeight: 700, color: T.white, transition: 'all 0.15s',
  },
  checkboxDone: { background: '#16a34a', borderColor: '#16a34a' },
  itemText: { flex: 1, fontSize: 14, color: T.text },
  itemTextDone: { textDecoration: 'line-through', color: T.textSecondary },
  notesToggle: {
    background: 'none', border: 'none', cursor: 'pointer', fontSize: 11,
    color: T.textSecondary, padding: '2px 6px', borderRadius: 4, flexShrink: 0,
  },
  removeBtn: {
    background: 'none', border: 'none', cursor: 'pointer', fontSize: 16,
    color: '#9ca3af', padding: '0 4px', lineHeight: 1, flexShrink: 0,
  },
  notesArea: {
    width: '100%', marginTop: 8, padding: '7px 10px', fontSize: 13,
    border: `1px solid ${T.border}`, borderRadius: 5, outline: 'none',
    resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit',
    color: T.text,
  },
  addRow: { display: 'flex', gap: 8, marginTop: 4, marginBottom: 20 },
  addInput: {
    flex: 1, padding: '8px 12px', fontSize: 13, border: `1px solid ${T.border}`,
    borderRadius: 5, outline: 'none', boxSizing: 'border-box',
  },
  addBtn: {
    padding: '8px 16px', fontSize: 13, fontWeight: 600, border: `1px solid ${T.border}`,
    borderRadius: 5, background: T.white, cursor: 'pointer', color: T.textSecondary,
    flexShrink: 0,
  },
  completedSection: {
    borderTop: `1px dashed ${T.border}`, paddingTop: 16, marginTop: 4, marginBottom: 16,
  },
  completedHeader: {
    fontSize: 12, fontWeight: 600, color: '#16a34a', marginBottom: 10,
    textTransform: 'uppercase', letterSpacing: '0.04em',
  },
  ideasSection: { marginTop: 8 },
  ideasLabel: {
    display: 'block', fontSize: 13, fontWeight: 600, color: T.textSecondary,
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em',
  },
  ideasTextarea: {
    width: '100%', padding: '9px 12px', fontSize: 14, border: `1px solid ${T.border}`,
    borderRadius: 6, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
    fontFamily: 'inherit', color: T.text,
  },
};
