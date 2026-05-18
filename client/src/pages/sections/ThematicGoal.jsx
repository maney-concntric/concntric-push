import { StatusPill } from '../../components/StatusPill';
import { CountdownTimer } from '../../components/CountdownTimer';
import { inputStyle, tableStyle, thStyle, tdStyle, addBtnStyle, removeBtnStyle, timerRowStyle } from './sectionStyles';

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export function ThematicGoal({ data, onChange, onBlur, teamMembers }) {
  const objectives = data.objectives || [];

  const updateObjective = (idx, field, value) => {
    const updated = objectives.map((o, i) => i === idx ? { ...o, [field]: value } : o);
    onChange({ ...data, objectives: updated });
  };

  const addObjective = () => {
    onChange({ ...data, objectives: [...objectives, { id: uid(), description: '', owner: '', status: 'on_track', notes: '' }] });
  };

  const removeObjective = (idx) => {
    onChange({ ...data, objectives: objectives.filter((_, i) => i !== idx) });
  };

  return (
    <div>
      <div style={timerRowStyle}><CountdownTimer durationMinutes={5} /></div>
      <div style={{ marginBottom: 24 }}>
        <label style={styles.fieldLabel}>Current Thematic Goal</label>
        <input
          value={data.goal || ''}
          onChange={e => onChange({ ...data, goal: e.target.value })}
          onBlur={onBlur}
          placeholder="e.g. Achieve profitable growth through Q3"
          style={{ ...inputStyle, fontSize: 15, padding: '10px 12px' }}
        />
      </div>
      <div style={styles.sectionTitle}>Defining Objectives</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Objective</th>
              <th style={thStyle}>Owner</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Notes</th>
              <th style={{ ...thStyle, width: 32 }}></th>
            </tr>
          </thead>
          <tbody>
            {objectives.map((obj, idx) => (
              <tr key={obj.id || idx}>
                <td style={tdStyle}>
                  <input value={obj.description} onChange={e => updateObjective(idx, 'description', e.target.value)} onBlur={onBlur} style={inputStyle} />
                </td>
                <td style={tdStyle}>
                  <input value={obj.owner} onChange={e => updateObjective(idx, 'owner', e.target.value)} onBlur={onBlur} style={inputStyle} list="team-names" />
                </td>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                  <StatusPill value={obj.status || 'on_track'} onChange={v => { updateObjective(idx, 'status', v); onBlur(); }} />
                </td>
                <td style={tdStyle}>
                  <input value={obj.notes} onChange={e => updateObjective(idx, 'notes', e.target.value)} onBlur={onBlur} style={inputStyle} />
                </td>
                <td style={tdStyle}>
                  <button onClick={() => removeObjective(idx)} style={removeBtnStyle} title="Remove">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addObjective} style={addBtnStyle}>+ Add objective</button>
      <datalist id="team-names">
        {(teamMembers || []).map(m => <option key={m.id} value={m.name} />)}
      </datalist>
    </div>
  );
}

const styles = {
  fieldLabel: { display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 },
  sectionTitle: { fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 },
};
