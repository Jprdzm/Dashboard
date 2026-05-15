import { useState, useEffect, useRef, useCallback } from 'react';

export function usePomodoro(initialWorkMinutes = 25) {
  const WORK = initialWorkMinutes * 60;

  const [breakDuration, setBreakDuration] = useState(5);
  const [timeLeft, setTimeLeft] = useState(WORK);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  const intervalRef = useRef(null);
  const isBreakRef = useRef(false);

  useEffect(() => { isBreakRef.current = isBreak; }, [isBreak]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
    clearTimer();
  }, [clearTimer]);

  const play = useCallback(() => {
    if (timeLeft <= 0) return;
    setIsRunning(true);
  }, [timeLeft]);

  const reset = useCallback(() => {
    setIsRunning(false);
    clearTimer();
    setIsBreak(false);
    isBreakRef.current = false;
    setTimeLeft(WORK);
  }, [clearTimer, WORK]);

  const changeBreakDuration = useCallback((mins) => {
    setBreakDuration(mins);
    setIsRunning(false);
    clearTimer();
    if (isBreakRef.current) {
      setTimeLeft(mins * 60);
    }
  }, [clearTimer]);

  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimer();
  }, [isRunning, clearTimer]);

  useEffect(() => {
    if (timeLeft > 0 || !isRunning) return;

    clearTimer();
    setIsRunning(false);

    if (isBreak) {
      setIsBreak(false);
      isBreakRef.current = false;
      setTimeLeft(WORK);
    } else {
      setIsBreak(true);
      isBreakRef.current = true;
      setTimeLeft(breakDuration * 60);
    }
  }, [timeLeft, isBreak, breakDuration, WORK, isRunning, clearTimer]);

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
