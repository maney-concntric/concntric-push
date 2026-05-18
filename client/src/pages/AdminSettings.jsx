import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { showToast } from '../components/Toast';
import { T, btn } from '../theme';

const OPTIONAL_SECTIONS = [
  { key: 'show_scorecard',      label: 'Scorecard',             minutes: 5  },
  { key: 'show_thematic_goal',  label: 'Thematic Goal',         minutes: 5  },
  { key: 'show_parking_lot',    label: 'Strategic Parking Lot', minutes: 5  },
];

const BASE_TACTICAL_MINS = 40;

export function AdminSettings() {
  const [settings, setSettings] = useState({
    show_scorecard: true,
    show_thematic_goal: true,
    show_parking_lot: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSettings()
      .then(setSettings)
      .catch(e => showToast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  const hidden = OPTIONAL_SECTIONS.filter(s => !settings[s.key]);
  const tacticalMins = BASE_TACTICAL_MINS + hidden.reduce((s, sec) => s + sec.minutes, 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.saveSettings(settings);
      showToast('Settings saved');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading…</div>;

  return (
    <div>
      <h1 style={styles.title}>Meeting Configuration</h1>
      <p style={styles.desc}>
        Choose which optional sections to include in new meetings. Disabled sections' time is
        added to Tactical Discussion.
      </p>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Optional Sections</div>
        {OPTIONAL_SECTIONS.map(({ key, label, minutes }) => (
          <div key={key} style={styles.row}>
            <label style={styles.rowLabel}>
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={() => toggle(key)}
                style={styles.checkbox}
              />
              <span style={styles.rowName}>{label}</span>
              <span style={styles.rowMins}>{minutes} min</span>
            </label>
            {!settings[key] && (
              <span style={styles.disabledNote}>+{minutes} min → Tactical Discussion</span>
            )}
          </div>
        ))}

        <div style={styles.divider} />

        <div style={styles.summary}>
          <span style={styles.summaryLabel}>Tactical Discussion will be:</span>
          <span style={styles.summaryMins}>{tacticalMins} minutes</span>
        </div>
      </div>

      <p style={styles.note}>
        Changes apply to new meetings only. In-progress meetings keep the settings they were
        created with.
      </p>

      <button
        onClick={handleSave} disabled={saving} style={btn.primary}
        onMouseEnter={e => { if (!saving) e.target.style.background = T.redDark; }}
        onMouseLeave={e => { e.target.style.background = T.red; }}
      >
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  );
}

const styles = {
  loading: { padding: 40, textAlign: 'center', color: '#9ca3af' },
  title: { margin: '0 0 8px 0', fontSize: 22, fontWeight: 700, color: T.text },
  desc: { margin: '0 0 24px 0', fontSize: 14, color: T.textSecondary },
  card: {
    background: T.white, border: `1px solid ${T.border}`, borderRadius: 8,
    padding: 20, marginBottom: 16, maxWidth: 480,
  },
  cardTitle: { fontSize: 13, fontWeight: 600, color: T.textSecondary, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' },
  row: { marginBottom: 12 },
  rowLabel: { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  checkbox: { width: 16, height: 16, cursor: 'pointer', accentColor: T.red },
  rowName: { fontSize: 14, fontWeight: 500, color: T.text, flex: 1 },
  rowMins: { fontSize: 13, color: T.textSecondary },
  disabledNote: { fontSize: 12, color: T.textSecondary, marginTop: 3, paddingLeft: 26, display: 'block', fontStyle: 'italic' },
  divider: { borderTop: `1px solid ${T.border}`, margin: '16px 0' },
  summary: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, fontWeight: 500, color: T.text },
  summaryMins: { fontSize: 16, fontWeight: 700, color: T.red },
  note: { fontSize: 12, color: '#9ca3af', marginBottom: 20, maxWidth: 480 },
};
