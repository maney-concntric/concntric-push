import { CountdownTimer } from '../../components/CountdownTimer';
import { inputStyle, tableStyle, thStyle, tdStyle, addBtnStyle, removeBtnStyle, timerRowStyle } from './sectionStyles';

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export function TacticalDiscussion({ data, onChange, onBlur, teamMembers, durationMinutes = 40 }) {
  const items = data.items || [];

  const update = (idx, field, value) => {
    onChange({ ...data, items: items.map((it, i) => i === idx ? { ...it, [field]: value } : it) });
  };

  const add = () => {
    onChange({ ...data, items: [...items, { id: uid(), topic: '', notes: '', decision: '', owner: '', dueDate: '', fromAgenda: false }] });
  };

  const remove = (idx) => onChange({ ...data, items: items.filter((_, i) => i !== idx) });

  return (
    <div>
      <div style={timerRowStyle}><CountdownTimer durationMinutes={durationMinutes} /></div>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 180 }}>Topic</th>
              <th style={{ ...thStyle, width: '28%' }}>Notes</th>
              <th style={{ ...thStyle, width: '28%' }}>Decision / Takeaway</th>
              <th style={thStyle}>Owner</th>
              <th style={thStyle}>Due Date</th>
              <th style={{ ...thStyle, width: 32 }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id || idx}>
                <td style={tdStyle}>
                  <div style={styles.topicCell}>
                    <input value={item.topic} onChange={e => update(idx, 'topic', e.target.value)} onBlur={onBlur} style={inputStyle} />
                    {item.fromAgenda && (
                      <span style={styles.agendaTag}>from agenda</span>
                    )}
                  </div>
                </td>
                <td style={tdStyle}>
                  <textarea
                    value={item.notes} onChange={e => update(idx, 'notes', e.target.value)} onBlur={onBlur}
                    rows={2} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </td>
                <td style={tdStyle}>
                  <textarea
                    value={item.decision} onChange={e => update(idx, 'decision', e.target.value)} onBlur={onBlur}
                    rows={2} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </td>
                <td style={tdStyle}>
                  <input value={item.owner} onChange={e => update(idx, 'owner', e.target.value)} onBlur={onBlur} style={inputStyle} list="team-names" />
                </td>
                <td style={tdStyle}>
                  <input type="date" value={item.dueDate} onChange={e => update(idx, 'dueDate', e.target.value)} onBlur={onBlur} style={inputStyle} />
                </td>
                <td style={tdStyle}>
                  <button onClick={() => remove(idx)} style={removeBtnStyle} title="Remove">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={add} style={addBtnStyle}>+ Add topic</button>
      <datalist id="team-names">
        {(teamMembers || []).map(m => <option key={m.id} value={m.name} />)}
      </datalist>
    </div>
  );
}

const styles = {
  topicCell: { display: 'flex', flexDirection: 'column', gap: 4 },
  agendaTag: {
    display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '1px 6px',
    borderRadius: 8, background: '#f3f4f6', color: '#6b7280',
    border: '1px solid #e5e7eb', letterSpacing: '0.02em', whiteSpace: 'nowrap',
    alignSelf: 'flex-start',
  },
};
