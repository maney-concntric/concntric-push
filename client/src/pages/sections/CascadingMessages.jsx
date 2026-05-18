import { CountdownTimer } from '../../components/CountdownTimer';
import { inputStyle, timerRowStyle } from './sectionStyles';

export function CascadingMessages({ data, onChange, onBlur }) {
  const leaders = data.leaders || [];

  const update = (idx, value) => {
    onChange({ ...data, leaders: leaders.map((l, i) => i === idx ? { ...l, message: value } : l) });
  };

  return (
    <div>
      <div style={timerRowStyle}><CountdownTimer durationMinutes={5} /></div>
      <p style={styles.description}>
        What does each leader need to cascade to their team from today's meeting? Align on the message before everyone disperses.
      </p>
      <div style={styles.grid}>
        {leaders.map((leader, idx) => (
          <div key={leader.id || idx} style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.leaderName}>{leader.name}</div>
              <div style={styles.leaderArrow}>→ their team</div>
            </div>
            <div style={styles.cardBody}>
              <textarea
                value={leader.message || ''}
                onChange={e => update(idx, e.target.value)}
                onBlur={onBlur}
                placeholder="Key messages to share with the team..."
                rows={4}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  description: { fontSize: 13, color: '#6b7280', marginBottom: 20, marginTop: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  card: { border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#fff' },
  cardHeader: {
    background: '#f9fafb', padding: '12px 16px', borderBottom: '1px solid #e5e7eb',
    display: 'flex', alignItems: 'baseline', gap: 8,
  },
  leaderName: { fontWeight: 600, fontSize: 15, color: '#111827' },
  leaderArrow: { fontSize: 12, color: '#9ca3af' },
  cardBody: { padding: 16 },
};
