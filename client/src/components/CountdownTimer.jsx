import { useTimer } from '../hooks/useTimer';
import { T } from '../theme';

function fmt(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function CountdownTimer({ durationMinutes }) {
  const duration = durationMinutes * 60;
  const { remaining, percent, running, isWarning, isExpired, start, pause, reset } = useTimer(duration);

  const fillColor = isWarning || isExpired ? '#dc2626' : T.red;

  return (
    <div style={styles.wrapper}>
      <div style={{ ...styles.display, ...(isWarning || isExpired ? styles.warning : {}) }}>
        {fmt(remaining)}
      </div>
      <div style={styles.bar}>
        <div style={{ ...styles.fill, width: `${percent}%`, background: fillColor }} />
      </div>
      <div style={styles.controls}>
        {!running ? (
          <button onClick={start} style={styles.btn}>{remaining === duration ? 'Start' : 'Resume'}</button>
        ) : (
          <button onClick={pause} style={styles.btn}>Pause</button>
        )}
        <button onClick={reset} style={{ ...styles.btn, ...styles.btnGhost }}>Reset</button>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  display: { fontVariantNumeric: 'tabular-nums', fontSize: 22, fontWeight: 700, color: T.text, minWidth: 64 },
  warning: { color: '#dc2626' },
  bar: { flex: 1, minWidth: 100, height: 4, background: T.border, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2, transition: 'width 0.5s linear' },
  controls: { display: 'flex', gap: 6 },
  btn: {
    padding: '4px 12px', fontSize: 13, fontWeight: 500, borderRadius: 5,
    border: `1px solid ${T.border}`, background: T.white, cursor: 'pointer', color: T.textSecondary,
  },
  btnGhost: { background: 'transparent', borderColor: 'transparent', color: '#9ca3af' },
};
