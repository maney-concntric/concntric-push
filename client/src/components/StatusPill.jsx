import { T } from '../theme';

const STATUSES = ['on_track', 'at_risk', 'off_track'];
const LABELS = { on_track: 'On Track', at_risk: 'At Risk', off_track: 'Off Track' };
const COLORS = {
  on_track:  { bg: '#f0fdf4', color: T.green,  border: '#bbf7d0' },
  at_risk:   { bg: '#fffbeb', color: T.amber,  border: '#fde68a' },
  off_track: { bg: '#fdf2f2', color: T.red,    border: '#f5c6c8' },
};

export function StatusPill({ value, onChange, readonly = false }) {
  const next = () => {
    if (readonly) return;
    const idx = STATUSES.indexOf(value);
    onChange(STATUSES[(idx + 1) % STATUSES.length]);
  };

  const c = COLORS[value] || COLORS.on_track;

  return (
    <span
      onClick={next}
      style={{
        display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 12,
        fontWeight: 600, border: `1px solid ${c.border}`, background: c.bg, color: c.color,
        cursor: readonly ? 'default' : 'pointer', whiteSpace: 'nowrap', userSelect: 'none',
      }}
      title={readonly ? undefined : 'Click to cycle status'}
    >
      {LABELS[value] || value}
    </span>
  );
}
