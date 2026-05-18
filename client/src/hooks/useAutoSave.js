import { useEffect, useRef, useCallback } from 'react';
import { api } from '../api/client';

export function useAutoSave(meetingId, sectionKey, data, onSaved, onError) {
  const timerRef = useRef(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const save = useCallback(async () => {
    if (!meetingId || !sectionKey) return;
    try {
      await api.saveSection(meetingId, sectionKey, dataRef.current);
      onSaved?.();
    } catch (e) {
      onError?.(e.message);
    }
  }, [meetingId, sectionKey, onSaved, onError]);

  // Auto-save every 30 seconds
  useEffect(() => {
    timerRef.current = setInterval(save, 30000);
    return () => clearInterval(timerRef.current);
  }, [save]);

  // Expose manual save for onBlur
  return save;
}
