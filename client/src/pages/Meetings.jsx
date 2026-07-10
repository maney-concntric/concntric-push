import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { showToast } from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import { T, btn } from '../theme';

const today = () => new Date().toISOString().slice(0, 10);

export function Meetings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newDate, setNewDate] = useState(today());

  useEffect(() => {
    api.getMeetings()
      .then(setMeetings)
      .catch(e => showToast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this meeting? This cannot be undone.')) return;
    try {
      await api.deleteMeeting(id);
      setMeetings(prev => prev.filter(m => m.id !== id));
      showToast('Meeting deleted');
    } catch (e) {
      showToast('Failed to delete meeting', 'error');
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const meeting = await api.createMeeting(user.name, newDate);
      navigate(`/meetings/${meeting.id}`);
    } catch (e) {
      showToast(e.message, 'error');
      setCreating(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div>
      {showNewModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalTitle}>New Meeting</div>
            <div style={styles.modalField}>
              <label style={styles.modalLabel}>Meeting date</label>
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                style={styles.dateInput}
                autoFocus
              />
            </div>
            <div style={styles.modalBtns}>
              <button onClick={() => setShowNewModal(false)} style={styles.cancelBtn}>Cancel</button>
              <button
                onClick={handleCreate}
                disabled={creating || !newDate}
                style={btn.primary}
                onMouseEnter={e => { if (!creating) e.target.style.background = T.redDark; }}
                onMouseLeave={e => { e.target.style.background = T.red; }}
              >
                {creating ? 'Creating…' : 'Create Meeting'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.title}>Meetings</h1>
          <p style={styles.subtitle}>Leadership Tactical Meeting history</p>
        </div>
        {user?.role !== 'participant' && (
          <button
            onClick={() => { setNewDate(today()); setShowNewModal(true); }}
            style={btn.primary}
            onMouseEnter={e => e.target.style.background = T.redDark}
            onMouseLeave={e => e.target.style.background = T.red}
          >
            + New Meeting
          </button>
        )}
      </div>

      {loading && <div style={styles.empty}>Loading…</div>}

      {!loading && meetings.length === 0 && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📋</div>
          <div style={styles.emptyTitle}>No meetings yet</div>
          {user?.role === 'participant' ? (
            <p style={styles.emptyText}>You have not been assigned to any meetings.</p>
          ) : (
            <>
              <p style={styles.emptyText}>Start your first Leadership Tactical Meeting.</p>
              <button
                onClick={() => { setNewDate(today()); setShowNewModal(true); }}
                style={btn.primary}
                onMouseEnter={e => e.target.style.background = T.redDark}
                onMouseLeave={e => e.target.style.background = T.red}
              >
                Start first meeting
              </button>
            </>
          )}
        </div>
      )}

      {!loading && meetings.length > 0 && (
        <div style={styles.list}>
          {meetings.map(m => (
            <div
              key={m.id} style={styles.row}
              onClick={() => navigate(`/meetings/${m.id}`)}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.red}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
            >
              <div style={styles.rowLeft}>
                <div style={styles.dateLabel}>{formatDate(m.date)}</div>
                <div style={styles.meta}>
                  Facilitator: {m.facilitator || '—'}
                  {m.creator_name && ` · Created by ${m.creator_name}`}
                </div>
              </div>
              <div style={styles.rowRight}>
                <span style={m.is_complete ? styles.badgeComplete : styles.badgeInProgress}>
                  {m.is_complete ? '✓ Complete' : 'In progress'}
                </span>
                {user?.role === 'admin' && (
                  <button onClick={(e) => handleDelete(e, m.id)} style={styles.deleteBtn} title="Delete meeting">
                    🗑
                  </button>
                )}
                <span style={styles.arrow}>→</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: '#fff', borderRadius: 10, padding: '28px 32px',
    width: 340, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  },
  modalTitle: { fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 20 },
  modalField: { marginBottom: 24 },
  modalLabel: { display: 'block', fontSize: 13, fontWeight: 500, color: T.textSecondary, marginBottom: 8 },
  dateInput: {
    width: '100%', padding: '9px 12px', fontSize: 14, border: `1px solid ${T.border}`,
    borderRadius: 6, outline: 'none', boxSizing: 'border-box',
  },
  modalBtns: { display: 'flex', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: {
    padding: '8px 16px', fontSize: 13, border: `1px solid ${T.border}`,
    borderRadius: 5, background: '#fff', cursor: 'pointer', color: T.textSecondary,
  },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 },
  title: { margin: 0, fontSize: 24, fontWeight: 700, color: T.text },
  subtitle: { margin: '4px 0 0', fontSize: 14, color: T.textSecondary },
  empty: { padding: 40, textAlign: 'center', color: T.textSecondary },
  emptyState: { padding: '60px 20px', textAlign: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 600, color: T.text, marginBottom: 6 },
  emptyText: { fontSize: 14, color: T.textSecondary, marginBottom: 20 },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  row: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: T.white, border: `1px solid ${T.border}`, borderRadius: 8,
    padding: '16px 20px', cursor: 'pointer', transition: 'border-color 0.15s',
  },
  rowLeft: { flex: 1 },
  rowRight: { display: 'flex', alignItems: 'center', gap: 12 },
  dateLabel: { fontSize: 15, fontWeight: 600, color: T.text },
  meta: { fontSize: 13, color: T.textSecondary, marginTop: 3 },
  badgeComplete: {
    fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 12,
    background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0',
  },
  badgeInProgress: {
    fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 12,
    background: '#fdf2f2', color: T.red, border: `1px solid #f5c6c8`,
  },
  deleteBtn: {
    background: 'none', border: 'none', cursor: 'pointer', fontSize: 15,
    padding: '2px 4px', borderRadius: 4, opacity: 0.5, lineHeight: 1,
  },
  arrow: { color: T.textSecondary, fontSize: 16 },
};
