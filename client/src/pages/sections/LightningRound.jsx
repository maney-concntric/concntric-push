import { CountdownTimer } from '../../components/CountdownTimer';
import { inputStyle, tableStyle, thStyle, tdStyle } from './sectionStyles';

export function LightningRound({ data, onChange, onBlur }) {
  const leaders = data.leaders || [];

  const updateLeader = (idx, field, value) => {
    const updated = leaders.map((l, i) => i === idx ? { ...l, [field]: value } : l);
    onChange({ ...data, leaders: updated });
  };

  const updatePriority = (idx, pIdx, value) => {
    const updated = leaders.map((l, i) => {
      if (i !== idx) return l;
      const priorities = [...(l.priorities || ['', '', ''])];
      priorities[pIdx] = value;
      return { ...l, priorities };
    });
    onChange({ ...data, leaders: updated });
  };

  return (
    <div>
      <div style={styles.timerRow}>
        <CountdownTimer durationMinutes={10} />
      </div>
      <div style={styles.grid}>
        {leaders.map((leader, idx) => (
          <div key={leader.id || idx} style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.leaderName}>{leader.name}</div>
              <div style={styles.leaderRole}>{leader.role}</div>
            </div>
            <div style={styles.cardBody}>
              <div style={styles.label}>Top 3 Priorities</div>
              {[0, 1, 2].map(pi => (
                <input
                  key={pi}
                  value={(leader.priorities || [])[pi] || ''}
                  onChange={e => updatePriority(idx, pi, e.target.value)}
                  onBlur={onBlur}
                  placeholder={`Priority ${pi + 1}`}
                  style={{ ...inputStyle, marginBottom: 6 }}
                />
              ))}
              <div style={{ ...styles.label, marginTop: 10 }}>Risks / Blockers</div>
              <textarea
                value={leader.risks || ''}
                onChange={e => updateLeader(idx, 'risks', e.target.value)}
                onBlur={onBlur}
                placeholder="Any risks or blockers this week?"
                rows={2}
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
  timerRow: { marginBottom: 24 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  card: { border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#fff' },
  cardHeader: { background: '#f9fafb', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' },
  leaderName: { fontWeight: 600, fontSize: 15, color: '#111827' },
  leaderRole: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  cardBody: { padding: 16 },
  label: { fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 },
};
