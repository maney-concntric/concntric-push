import { CountdownTimer } from '../../components/CountdownTimer';
import { inputStyle, addBtnStyle, removeBtnStyle, timerRowStyle } from './sectionStyles';

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export function StrategicParkingLot({ data, onChange, onBlur }) {
  const items = data.items || [];

  const update = (idx, value) => {
    onChange({ ...data, items: items.map((it, i) => i === idx ? { ...it, text: value } : it) });
  };

  const add = () => onChange({ ...data, items: [...items, { id: uid(), text: '' }] });
  const remove = (idx) => onChange({ ...data, items: items.filter((_, i) => i !== idx) });

  return (
    <div>
      <div style={timerRowStyle}><CountdownTimer durationMinutes={5} /></div>
      <p style={styles.description}>
        Topics that are strategic in nature and not appropriate for the weekly tactical. Review and triage these in your monthly strategic meeting.
      </p>
      <div style={styles.list}>
        {items.map((item, idx) => (
          <div key={item.id || idx} style={styles.itemRow}>
            <span style={styles.bullet}>◆</span>
            <input
              value={item.text}
              onChange={e => update(idx, e.target.value)}
              onBlur={onBlur}
              placeholder="Strategic topic..."
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={() => remove(idx)} style={removeBtnStyle} title="Remove">✕</button>
          </div>
        ))}
      </div>
      <button onClick={add} style={addBtnStyle}>+ Add item</button>
    </div>
  );
}

const styles = {
  description: { fontSize: 13, color: '#6b7280', marginBottom: 20, marginTop: 0 },
  list: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 },
  itemRow: { display: 'flex', alignItems: 'center', gap: 10 },
  bullet: { color: '#d1d5db', fontSize: 10, flexShrink: 0 },
};
