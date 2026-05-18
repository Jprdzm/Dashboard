import { useState, useEffect, useRef, useCallback } from 'react';

export function usePomodoro(initialWorkMinutes = 25) {
  const WORK_SECONDS = initialWorkMinutes * 60;

  const [breakDuration, setBreakDuration] = useState(5);
  const [timeLeft, setTimeLeft] = useState(WORK_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  const intervalRef = useRef(null);
  const endTimeRef = useRef(0);
  const remainingRef = useRef(WORK_SECONDS);
  const isBreakRef = useRef(false);
  const breakDurationRef = useRef(5);

  useEffect(() => { isBreakRef.current = isBreak; }, [isBreak]);
  useEffect(() => { breakDurationRef.current = breakDuration; }, [breakDuration]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tickRef = useRef(null);

  useEffect(() => {
    tickRef.current = () => {
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining > 0) return;

      if (isBreakRef.current) {
        setIsBreak(false);
        isBreakRef.current = false;
        remainingRef.current = WORK_SECONDS;
        setTimeLeft(WORK_SECONDS);
      } else {
        setIsBreak(true);
        isBreakRef.current = true;
        const secs = breakDurationRef.current * 60;
        remainingRef.current = secs;
        setTimeLeft(secs);
      }
      endTimeRef.current = 0;
      setIsRunning(false);
      clearTimer();
    };
  }, [clearTimer, WORK_SECONDS]);

  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }

    const id = setInterval(() => tickRef.current(), 100);
    intervalRef.current = id;

    return () => clearInterval(id);
  }, [isRunning, clearTimer]);

  const play = useCallback(() => {
    if (remainingRef.current <= 0) return;

    endTimeRef.current = Date.now() + remainingRef.current * 1000;
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    if (endTimeRef.current > 0) {
      remainingRef.current = Math.max(0.5, Math.ceil((endTimeRef.current - Date.now()) / 1000));
    }
    endTimeRef.current = 0;
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    endTimeRef.current = 0;
    remainingRef.current = WORK_SECONDS;
    setIsBreak(false);
    isBreakRef.current = false;
    setTimeLeft(WORK_SECONDS);
    setIsRunning(false);
  }, [WORK_SECONDS]);

  const changeMode = useCallback((minutes) => {
    clearTimer();
    setIsRunning(false);
    endTimeRef.current = 0;
    const seconds = minutes * 60;
    remainingRef.current = seconds;
    setTimeLeft(seconds);
    if (minutes === initialWorkMinutes) {
      setIsBreak(false);
      isBreakRef.current = false;
    } else {
      setBreakDuration(minutes);
      setIsBreak(true);
      isBreakRef.current = true;
    }
  }, [clearTimer, initialWorkMinutes]);

  return {
    timeLeft,
    isRunning,
    isBreak,
    breakDuration,
    changeMode,
    play,
    pause,
    reset,
  };
}
