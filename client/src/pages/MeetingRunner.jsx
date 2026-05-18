import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { showToast } from '../components/Toast';
import { T, btn } from '../theme';
import { LightningRound } from './sections/LightningRound';
import { Scorecard } from './sections/Scorecard';
import { ThematicGoal } from './sections/ThematicGoal';
import { RealTimeAgenda } from './sections/RealTimeAgenda';
import { TacticalDiscussion } from './sections/TacticalDiscussion';
import { StrategicParkingLot } from './sections/StrategicParkingLot';
import { ActionItems } from './sections/ActionItems';
import { CascadingMessages } from './sections/CascadingMessages';

const ALL_SECTIONS = [
  { key: 'lightning_round',     label: 'Lightning Round',        minutes: 10, Component: LightningRound,        optional: false },
  { key: 'scorecard',           label: 'Scorecard',              minutes: 5,  Component: Scorecard,             optional: true,  settingKey: 'show_scorecard' },
  { key: 'thematic_goal',       label: 'Thematic Goal',          minutes: 5,  Component: ThematicGoal,          optional: true,  settingKey: 'show_thematic_goal' },
  { key: 'realtime_agenda',     label: 'Real-Time Agenda',       minutes: 5,  Component: RealTimeAgenda,        optional: false },
  { key: 'tactical_discussion', label: 'Tactical Discussion',    minutes: 40, Component: TacticalDiscussion,    optional: false, baseMins: 40 },
  { key: 'parking_lot',         label: 'Strategic Parking Lot',  minutes: 5,  Component: StrategicParkingLot,   optional: true,  settingKey: 'show_parking_lot' },
  { key: 'action_items',        label: 'Action Items',           minutes: 5,  Component: ActionItems,           optional: false },
  { key: 'cascading_messages',  label: 'Cascading Messages',     minutes: 5,  Component: CascadingMessages,     optional: false },
];

function buildSections(meetingSettings) {
  if (!meetingSettings) return ALL_SECTIONS.map(s => ({ ...s }));
  let hidden = 0;
  const visible = ALL_SECTIONS
    .map(s => ({ ...s }))
    .filter(s => {
      if (!s.optional) return true;
      const on = meetingSettings[s.settingKey] !== false;
      if (!on) hidden += s.minutes;
      return on;
    });
  const tactical = visible.find(s => s.key === 'tactical_discussion');
  if (tactical && hidden > 0) tactical.minutes = (tactical.baseMins || 40) + hidden;
  return visible;
}

export function MeetingRunner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [sections, setSections] = useState({});
  const [teamMembers, setTeamMembers] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [completing, setCompleting] = useState(false);

  const pendingRef = useRef({});
  const [SECTIONS, setSECTIONS] = useState([]);

  useEffect(() => {
    Promise.all([api.getMeeting(id), api.getTeam()])
      .then(([m, team]) => {
        setMeeting(m);
        setSections(m.sections || {});
        setTeamMembers(team);
        const parsed = m.meeting_settings ? JSON.parse(m.meeting_settings) : null;
        setSECTIONS(buildSections(parsed));
      })
      .catch(e => showToast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  const saveSection = useCallback(async (key, data) => {
    if (!key) return;
    setSaving(true);
    try {
      await api.saveSection(id, key, data);
      setLastSaved(new Date());
    } catch (e) {
      showToast('Failed to save: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      const entries = Object.entries(pendingRef.current);
      if (!entries.length) return;
      entries.forEach(([key, data]) => saveSection(key, data));
      pendingRef.current = {};
    }, 30000);
    return () => clearInterval(interval);
  }, [saveSection]);

  const handleChange = (key, data) => {
    setSections(prev => ({ ...prev, [key]: data }));
    pendingRef.current[key] = data;
  };

  const handleBlur = (key) => {
    const data = sections[key];
    if (data) saveSection(key, data);
  };

  const TACTICAL_IDX = SECTIONS.findIndex(s => s.key === 'tactical_discussion');

  const handleSendToDiscussion = useCallback(async (agendaItems) => {
    if (!agendaItems.length) return;

    const current = sections['tactical_discussion'] || {};
    const existing = current.items || [];
    const existingTopics = new Set(existing.map(it => it.topic?.trim().toLowerCase()));

    function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

    const newItems = agendaItems
      .filter(it => it.topic?.trim() && !existingTopics.has(it.topic.trim().toLowerCase()))
      .map(it => ({
        id: uid(),
        topic: it.topic,
        notes: '',
        decision: '',
        owner: it.raisedBy || '',
        dueDate: '',
        fromAgenda: true,
      }));

    const skipped = agendaItems.length - newItems.length;
    const merged = { ...current, items: [...newItems, ...existing] };

    handleChange('tactical_discussion', merged);
    await saveSection('tactical_discussion', merged);

    const sent = newItems.length;
    if (sent === 0) {
      showToast(`All items already in discussion${skipped ? ` (${skipped} skipped)` : ''}`);
    } else {
      showToast(`${sent} item${sent !== 1 ? 's' : ''} sent to discussion${skipped ? ` (${skipped} already there)` : ''}`);
      setTimeout(() => setActiveTab(TACTICAL_IDX), 1000);
    }
  }, [sections, saveSection, TACTICAL_IDX]);

  const handleComplete = async () => {
    if (!confirm('Mark this meeting as complete? You can still view it afterward.')) return;
    setCompleting(true);
    const entries = Object.entries(pendingRef.current);
    await Promise.all(entries.map(([key, data]) => saveSection(key, data)));
    pendingRef.current = {};
    try {
      await api.completeMeeting(id);
      showToast('Meeting marked as complete');
      navigate('/meetings');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setCompleting(false);
    }
  };

  const totalMinutes = SECTIONS.reduce((s, sec) => s + sec.minutes, 0);
  const completedMinutes = SECTIONS.slice(0, activeTab).reduce((s, sec) => s + sec.minutes, 0);
  const progressPct = Math.round((completedMinutes / totalMinutes) * 100);

  if (loading || !SECTIONS.length) return <div style={styles.loading}>Loading meeting…</div>;
  if (!meeting) return <div style={styles.loading}>Meeting not found.</div>;

  const { key, label, minutes, Component } = SECTIONS[activeTab];

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={() => navigate('/meetings')} style={styles.backBtn}>← Meetings</button>
          <div>
            <div style={styles.meetingTitle}>Leadership Tactical Meeting — {meeting.date}</div>
            <div style={styles.facilitator}>Facilitator: {meeting.facilitator}</div>
          </div>
        </div>
        <div style={styles.headerRight}>
          {saving && <span style={styles.savingLabel}>Saving…</span>}
          {!saving && lastSaved && (
            <span style={styles.savedLabel}>Saved {lastSaved.toLocaleTimeString()}</span>
          )}
          {!meeting.is_complete && (
            <button
              onClick={handleComplete} disabled={completing} style={styles.completeBtn}
              onMouseEnter={e => { if (!completing) e.target.style.background = T.redDark; }}
              onMouseLeave={e => { e.target.style.background = T.red; }}
            >
              {completing ? 'Saving…' : 'Mark Complete'}
            </button>
          )}
          {meeting.is_complete && <span style={styles.completeBadge}>✓ Complete</span>}
        </div>
      </div>

      {/* Tab bar */}
      <div style={styles.tabBar}>
        {SECTIONS.map((sec, idx) => (
          <button
            key={sec.key}
            onClick={() => setActiveTab(idx)}
            style={{ ...styles.tab, ...(idx === activeTab ? styles.tabActive : {}) }}
          >
            <span style={styles.tabNum}>{idx + 1}</span>
            <span style={styles.tabLabel}>{sec.label}</span>
            <span style={styles.tabTime}>{sec.minutes}m</span>
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${progressPct}%` }} />
      </div>

      {/* Section content */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>{activeTab + 1}. {label}</h2>
            <div style={styles.sectionMeta}>Suggested time: {minutes} minutes</div>
          </div>
          <div style={styles.navBtns}>
            {activeTab > 0 && (
              <button onClick={() => setActiveTab(t => t - 1)} style={styles.navBtn}>← Previous</button>
            )}
            {activeTab < SECTIONS.length - 1 && (
              <button
                onClick={() => setActiveTab(t => t + 1)} style={styles.navBtnPrimary}
                onMouseEnter={e => e.target.style.background = T.redDark}
                onMouseLeave={e => e.target.style.background = T.red}
              >
                Next →
              </button>
            )}
          </div>
        </div>

        <Component
          data={sections[key] || {}}
          onChange={(data) => handleChange(key, data)}
          onBlur={() => handleBlur(key)}
          teamMembers={teamMembers}
          onSendToDiscussion={handleSendToDiscussion}
          durationMinutes={minutes}
        />
      </div>
    </div>
  );
}

const styles = {
  wrapper: { maxWidth: '100%' },
  loading: { padding: 40, textAlign: 'center', color: T.textSecondary },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 0, padding: '0 0 16px 0', borderBottom: `1px solid ${T.border}`,
    flexWrap: 'wrap', gap: 12,
  },
  headerLeft: { display: 'flex', alignItems: 'flex-start', gap: 16 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  backBtn: { background: 'none', border: 'none', cursor: 'pointer', color: T.textSecondary, fontSize: 13, padding: 0, paddingTop: 4 },
  meetingTitle: { fontSize: 18, fontWeight: 700, color: T.text },
  facilitator: { fontSize: 13, color: T.textSecondary, marginTop: 2 },
  savingLabel: { fontSize: 12, color: '#9ca3af' },
  savedLabel: { fontSize: 12, color: '#9ca3af' },
  completeBtn: {
    padding: '7px 16px', fontSize: 13, fontWeight: 600, borderRadius: 6,
    background: T.red, color: T.white, border: 'none', cursor: 'pointer',
    transition: 'background 0.15s',
  },
  completeBadge: {
    padding: '6px 14px', fontSize: 13, fontWeight: 600, borderRadius: 6,
    background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0',
  },
  tabBar: {
    display: 'flex', gap: 0, overflowX: 'auto', borderBottom: `2px solid ${T.border}`,
    marginTop: 20, scrollbarWidth: 'none',
  },
  tab: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
    padding: '8px 14px', background: 'none', border: 'none',
    borderBottom: '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap',
    color: T.textSecondary, marginBottom: -2, transition: 'color 0.1s',
  },
  tabActive: { color: T.red, borderBottomColor: T.red },
  tabNum: { fontSize: 10, fontWeight: 600, color: 'inherit', opacity: 0.6 },
  tabLabel: { fontSize: 13, fontWeight: 500, color: 'inherit' },
  tabTime: { fontSize: 10, color: 'inherit', opacity: 0.5 },
  progressBar: { height: 3, background: T.border, marginBottom: 28 },
  progressFill: { height: '100%', background: T.red, transition: 'width 0.3s ease' },
  section: { background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, padding: 24 },
  sectionHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 24, flexWrap: 'wrap', gap: 12,
  },
  sectionTitle: { margin: 0, fontSize: 20, fontWeight: 700, color: T.text },
  sectionMeta: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  navBtns: { display: 'flex', gap: 8 },
  navBtn: {
    padding: '7px 14px', fontSize: 13, border: `1px solid ${T.border}`,
    borderRadius: 5, background: T.white, cursor: 'pointer', color: T.textSecondary,
  },
  navBtnPrimary: {
    padding: '7px 14px', fontSize: 13, border: `1px solid ${T.red}`,
    borderRadius: 5, background: T.red, cursor: 'pointer', color: T.white,
    fontWeight: 500, transition: 'background 0.15s',
  },
};
