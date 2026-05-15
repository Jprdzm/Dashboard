import { useState, useEffect, useRef, useCallback } from 'react';

export function usePomodoro(initialWorkMinutes = 25) {
  const WORK_MS = initialWorkMinutes * 60 * 1000;

  const [breakDuration, setBreakDuration] = useState(5);
  const [timeLeft, setTimeLeft] = useState(initialWorkMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  const intervalRef = useRef(null);
  const endTimeRef = useRef(0);
  const pauseRemainingRef = useRef(WORK_MS);
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

  tickRef.current = () => {
    const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
    setTimeLeft(remaining);
    if (remaining > 0) return;

    if (isBreakRef.current) {
      setIsBreak(false);
      isBreakRef.current = false;
      pauseRemainingRef.current = WORK_MS;
      setTimeLeft(WORK_MS / 1000);
    } else {
      setIsBreak(true);
      isBreakRef.current = true;
      const ms = breakDurationRef.current * 60 * 1000;
      pauseRemainingRef.current = ms;
      setTimeLeft(ms / 1000);
    }
    endTimeRef.current = 0;
    setIsRunning(false);
    clearTimer();
  };

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
    if (pauseRemainingRef.current <= 0) return;

    endTimeRef.current = Date.now() + pauseRemainingRef.current;
    pauseRemainingRef.current = 0;
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    if (endTimeRef.current > 0) {
      pauseRemainingRef.current = Math.max(500, endTimeRef.current - Date.now());
    }
    endTimeRef.current = 0;
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    endTimeRef.current = 0;
    pauseRemainingRef.current = WORK_MS;
    setIsBreak(false);
    isBreakRef.current = false;
    setTimeLeft(WORK_MS / 1000);
    setIsRunning(false);
  }, [WORK_MS]);

  const changeBreakDuration = useCallback((mins) => {
    setBreakDuration(mins);
    if (isBreakRef.current) {
      setIsRunning(false);
      clearTimer();
      const ms = mins * 60 * 1000;
      pauseRemainingRef.current = ms;
      endTimeRef.current = 0;
      setTimeLeft(mins * 60);
    }
  }, [clearTimer]);

  return {
    timeLeft,
    isRunning,
    isBreak,
    breakDuration,
    setBreakDuration: changeBreakDuration,
    play,
    pause,
    reset,
  };
}
