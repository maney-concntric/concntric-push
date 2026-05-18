import { useState, useEffect, useRef } from 'react';

export function useTimer(durationSeconds, initialElapsed = 0) {
  const [elapsed, setElapsed] = useState(initialElapsed);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const baseElapsedRef = useRef(initialElapsed);

  useEffect(() => {
    if (running) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const delta = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsed(baseElapsedRef.current + delta);
      }, 500);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const start = () => {
    baseElapsedRef.current = elapsed;
    setRunning(true);
  };
  const pause = () => {
    baseElapsedRef.current = elapsed;
    setRunning(false);
  };
  const reset = () => {
    setRunning(false);
    setElapsed(0);
    baseElapsedRef.current = 0;
  };

  const remaining = Math.max(0, durationSeconds - elapsed);
  const percent = Math.min(100, (elapsed / durationSeconds) * 100);
  const isWarning = remaining <= 60 && remaining > 0;
  const isExpired = remaining === 0 && elapsed > 0;

  return { elapsed, remaining, percent, running, isWarning, isExpired, start, pause, reset };
}
