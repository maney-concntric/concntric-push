import { StatusPill } from '../../components/StatusPill';
import { CountdownTimer } from '../../components/CountdownTimer';
import { inputStyle, tableStyle, thStyle, tdStyle, addBtnStyle, removeBtnStyle, timerRowStyle } from './sectionStyles';

// uuid inline to avoid import issues
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export function Scorecard({ data, onChange, onBlur, teamMembers }) {
  const rows = data.rows || [];

  const updateRow = (idx, field, value) => {
    const updated = rows.map((r, i) => i === idx ? { ...r, [field]: value } : r);
    onChange({ ...data, rows: updated });
  };

  const addRow = () => {
    onChange({ ...data, rows: [...rows, { id: uid(), metric: '', owner: '', target: '', actual: '', status: 'on_track', comment: '' }] });
  };

  const removeRow = (idx) => {
    onChange({ ...data, rows: rows.filter((_, i) => i !== idx) });
  };

  return (
    <div>
      <div style={timerRowStyle}><CountdownTimer durationMinutes={5} /></div>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 200 }}>Metric</th>
              <th style={thStyle}>Owner</th>
              <th style={thStyle}>Target</th>
              <th style={thStyle}>Actual</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Comment</th>
              <th style={{ ...thStyle, width: 32 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id || idx}>
                <td style={tdStyle}>
                  <input value={row.metric} onChange={e => updateRow(idx, 'metric', e.target.value)} onBlur={onBlur} style={inputStyle} />
                </td>
                <td style={tdStyle}>
                  <input value={row.owner} onChange={e => updateRow(idx, 'owner', e.target.value)} onBlur={onBlur} style={inputStyle} list="team-names" />
                </td>
                <td style={tdStyle}>
                  <input value={row.target} onChange={e => updateRow(idx, 'target', e.target.value)} onBlur={onBlur} style={inputStyle} />
                </td>
                <td style={tdStyle}>
                  <input value={row.actual} onChange={e => updateRow(idx, 'actual', e.target.value)} onBlur={onBlur} style={inputStyle} />
                </td>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                  <StatusPill value={row.status || 'on_track'} onChange={v => { updateRow(idx, 'status', v); onBlur(); }} />
                </td>
                <td style={tdStyle}>
                  <input value={row.comment} onChange={e => updateRow(idx, 'comment', e.target.value)} onBlur={onBlur} style={inputStyle} />
                </td>
                <td style={tdStyle}>
                  <button onClick={() => removeRow(idx)} style={removeBtnStyle} title="Remove">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addRow} style={addBtnStyle}>+ Add row</button>
      <datalist id="team-names">
        {(teamMembers || []).map(m => <option key={m.id} value={m.name} />)}
      </datalist>
    </div>
  );
}
