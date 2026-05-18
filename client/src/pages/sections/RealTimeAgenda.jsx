import { CountdownTimer } from '../../components/CountdownTimer';
import { inputStyle, tableStyle, thStyle, tdStyle, removeBtnStyle, timerRowStyle, selectStyle } from './sectionStyles';
import { T } from '../../theme';

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

const TYPES = ['Decision', 'Discussion', 'Escalation', 'Update'];
const PRIORITIES = ['High', 'Med', 'Low'];

function defaultIncluded(priority) {
  return priority === 'High';
}

export function RealTimeAgenda({ data, onChange, onBlur, teamMembers, onSendToDiscussion }) {
  const items = data.items || [];

  const update = (idx, field, value) => {
    const updated = items.map((it, i) => {
      if (i !== idx) return it;
      const next = { ...it, [field]: value };
      // When a new row is added and priority changes before included is set, auto-default
      if (field === 'priority' && it.included === undefined) {
        next.included = defaultIncluded(value);
      }
      return next;
    });
    onChange({ ...data, items: updated });
  };

  const toggleIncluded = (idx) => {
    const updated = items.map((it, i) =>
      i === idx ? { ...it, included: !getIncluded(it) } : it
    );
    onChange({ ...data, items: updated });
    onBlur();
  };

  const add = () => {
    onChange({ ...data, items: [...items, { id: uid(), topic: '', raisedBy: '', type: 'Discussion', priority: 'Med', included: false }] });
  };

  const remove = (idx) => onChange({ ...data, items: items.filter((_, i) => i !== idx) });

  // Resolve included: default High → true, else false if field absent
  const getIncluded = (item) =>
    item.included !== undefined ? item.included : defaultIncluded(item.priority);

  const checkedCount = items.filter(it => getIncluded(it)).length;

  return (
    <div>
      <div style={timerRowStyle}><CountdownTimer durationMinutes={5} /></div>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Topic</th>
              <th style={thStyle}>Raised By</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Priority</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Include?</th>
              <th style={{ ...thStyle, width: 32 }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id || idx}>
                <td style={tdStyle}>
                  <input value={item.topic} onChange={e => update(idx, 'topic', e.target.value)} onBlur={onBlur} style={inputStyle} />
                </td>
                <td style={tdStyle}>
                  <input value={item.raisedBy} onChange={e => update(idx, 'raisedBy', e.target.value)} onBlur={onBlur} style={inputStyle} list="team-names" />
                </td>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                  <select value={item.type} onChange={e => { update(idx, 'type', e.target.value); onBlur(); }} style={selectStyle}>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </td>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                  <select value={item.priority} onChange={e => { update(idx, 'priority', e.target.value); onBlur(); }} style={selectStyle}>
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={getIncluded(item)}
                    onChange={() => toggleIncluded(idx)}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: T.red }}
                  />
                </td>
                <td style={tdStyle}>
                  <button onClick={() => remove(idx)} style={removeBtnStyle} title="Remove">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={add} style={styles.addBtn}>+ Add topic</button>

      <button
        onClick={() => onSendToDiscussion(items.filter(it => getIncluded(it)))}
        disabled={checkedCount === 0}
        style={{ ...styles.sendBtn, opacity: checkedCount === 0 ? 0.45 : 1 }}
      >
        Send to Discussion → ({checkedCount} item{checkedCount !== 1 ? 's' : ''})
      </button>

      <datalist id="team-names">
        {(teamMembers || []).map(m => <option key={m.id} value={m.name} />)}
      </datalist>
    </div>
  );
}

const styles = {
  addBtn: {
    marginTop: 12, padding: '6px 14px', fontSize: 13, fontWeight: 500,
    border: '1px dashed #d1d5db', borderRadius: 5, background: '#fff',
    cursor: 'pointer', color: '#6b7280',
  },
  sendBtn: {
    display: 'block', width: '100%', marginTop: 16, padding: '11px',
    fontSize: 14, fontWeight: 600, border: 'none', borderRadius: 6,
    background: T.red, color: '#fff', cursor: 'pointer',
    transition: 'background 0.15s',
  },
};
