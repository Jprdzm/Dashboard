import { useState, useEffect, useRef, useCallback } from 'react';

export function usePomodoro(initialWorkMinutes = 25) {
  const workSeconds = initialWorkMinutes * 60;

  const [breakDuration, setBreakDuration] = useState(5);
  const [timeLeft, setTimeLeft] = useState(workSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  const intervalRef = useRef(null);
  const isBreakRef = useRef(false);
  const breakDurationRef = useRef(5);
  const workSecondsRef = useRef(workSeconds);

  useEffect(() => { isBreakRef.current = isBreak; }, [isBreak]);
  useEffect(() => { breakDurationRef.current = breakDuration; }, [breakDuration]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const play = useCallback(() => {
    if (timeLeft <= 0) return;
    setIsRunning(true);
  }, [timeLeft]);

  const pause = useCallback(() => {
    setIsRunning(false);
    clearTimer();
  }, [clearTimer]);

  const reset = useCallback(() => {
    setIsRunning(false);
    clearTimer();
    setIsBreak(false);
    isBreakRef.current = false;
    setTimeLeft(workSecondsRef.current);
  }, [clearTimer]);

  const handleSetBreakDuration = useCallback((mins) => {
    setBreakDuration(mins);
  }, []);

  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (!isBreakRef.current) {
            setIsBreak(true);
            isBreakRef.current = true;
            return breakDurationRef.current * 60;
          }
          setIsBreak(false);
          isBreakRef.current = false;
          return workSecondsRef.current;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimer();
  }, [isRunning, clearTimer]);

  return {
    timeLeft,
    isRunning,
    isBreak,
    breakDuration,
    setBreakDuration: handleSetBreakDuration,
    play,
    pause,
    reset,
  };
}
