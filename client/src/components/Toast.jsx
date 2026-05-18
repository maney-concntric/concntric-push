import { useState, useCallback, useEffect, useRef } from 'react';

const toastListeners = new Set();
let toastId = 0;

export function showToast(message, type = 'success') {
  const id = ++toastId;
  toastListeners.forEach(fn => fn({ id, message, type }));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (toast) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), 3000);
    };
    toastListeners.add(handler);
    return () => toastListeners.delete(handler);
  }, []);

  if (!toasts.length) return null;

  return (
    <div style={styles.container}>
      {toasts.map(t => (
        <div key={t.id} style={{ ...styles.toast, ...(t.type === 'error' ? styles.error : styles.success) }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  toast: {
    padding: '10px 16px', borderRadius: 6, fontSize: 14, fontWeight: 500,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)', maxWidth: 320,
    animation: 'fadeIn 0.2s ease',
  },
  success: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' },
  error: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' },
};
