import { useState, useEffect } from 'react';

const useTimer = (initialTime) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);
  const [timerInterval, setTimerInterval] = useState(null);

  const startTimer = () => {
    setIsActive(true);
    setTimerInterval(setInterval(() => {
      setTimeRemaining(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timerInterval);
          setIsActive(false);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000));
  };

  const stopTimer = () => {
    clearInterval(timerInterval);
    setIsActive(false);
  };

  const resetTimer = (newTime) => {
    clearInterval(timerInterval);
    setTimeRemaining(newTime);
    setIsActive(false);
  };

  useEffect(() => {
    return () => clearInterval(timerInterval);
  }, [timerInterval]);

  return {
    timeRemaining,
    isActive,
    startTimer,
    stopTimer,
    resetTimer,
  };
};

export default useTimer;