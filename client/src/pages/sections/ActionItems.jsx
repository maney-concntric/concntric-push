import { CountdownTimer } from '../../components/CountdownTimer';
import { inputStyle, addBtnStyle, removeBtnStyle, timerRowStyle, selectStyle } from './sectionStyles';

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export function ActionItems({ data, onChange, onBlur, teamMembers }) {
  const items = data.items || [];

  const update = (idx, field, value) => {
    onChange({ ...data, items: items.map((it, i) => i === idx ? { ...it, [field]: value } : it) });
  };

  const add = () => onChange({ ...data, items: [...items, { id: uid(), text: '', owner: '', dueDate: '', done: false }] });
  const remove = (idx) => onChange({ ...data, items: items.filter((_, i) => i !== idx) });

  const ownerOptions = (teamMembers || []).map(m => m.name);

  return (
    <div>
      <div style={timerRowStyle}><CountdownTimer durationMinutes={5} /></div>
      <div style={styles.list}>
        {items.map((item, idx) => (
          <div key={item.id || idx} style={{ ...styles.row, ...(item.done ? styles.done : {}) }}>
            <input
              type="checkbox"
              checked={!!item.done}
              onChange={e => { update(idx, 'done', e.target.checked); onBlur(); }}
              style={styles.checkbox}
            />
            <input
              value={item.text}
              onChange={e => update(idx, 'text', e.target.value)}
              onBlur={onBlur}
              placeholder="Action item..."
              style={{ ...inputStyle, flex: 1, textDecoration: item.done ? 'line-through' : 'none', color: item.done ? '#9ca3af' : '#111827' }}
            />
            <select
              value={item.owner}
              onChange={e => { update(idx, 'owner', e.target.value); onBlur(); }}
              style={{ ...selectStyle, width: 140 }}
            >
              <option value="">Owner…</option>
              {ownerOptions.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
            <input
              type="date"
              value={item.dueDate}
              onChange={e => update(idx, 'dueDate', e.target.value)}
              onBlur={onBlur}
              style={{ ...inputStyle, width: 150 }}
            />
            <button onClick={() => remove(idx)} style={removeBtnStyle} title="Remove">✕</button>
          </div>
        ))}
      </div>
      <button onClick={add} style={addBtnStyle}>+ Add action item</button>
    </div>
  );
}

const styles = {
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  row: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  done: { opacity: 0.6 },
  checkbox: { width: 16, height: 16, cursor: 'pointer', flexShrink: 0 },
};
