import React, { useState, useEffect } from 'react';
import { calculatePoints } from '../utils/scoring';
import useTimer from '../hooks/useTimer';

const Gameplay = ({ players, currentPlayerIndex, setCurrentPlayerIndex, gameMode, customLimit }) => {
  const [currentGrade, setCurrentGrade] = useState(0);
  const [score, setScore] = useState(0);
  const [v0Climbs, setV0Climbs] = useState(0);
  const { timeRemaining, startTimer, stopTimer, formatTime } = useTimer();

  useEffect(() => {
    if (gameMode === 'time') {
      startTimer(customLimit * 60);
    }
    return () => stopTimer();
  }, [gameMode, customLimit, startTimer, stopTimer]);

  const completeClimb = (attempts) => {
    const points = calculatePoints(currentGrade, attempts);
    const player = players[currentPlayerIndex];

    if (gameMode === 'limit' && currentGrade === 0) {
      if (v0Climbs + 1 > customLimit) {
        alert(`${player.name} reached the V0 climb limit.`);
        return;
      }
      setV0Climbs(v0Climbs + 1);
    }

    player.history.push({ grade: currentGrade, attempts, points });
    player.score += points;
    setScore(player.score);
    setCurrentGrade(currentGrade + 1);
    setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
  };

  const failClimb = () => {
    const player = players[currentPlayerIndex];

    if (gameMode === 'limit' && currentGrade === 0) {
      if (v0Climbs + 1 > customLimit) {
        alert(`${player.name} reached the V0 climb limit.`);
        return;
      }
      setV0Climbs(v0Climbs + 1);
    }

    player.history.push({ grade: currentGrade, attempts: 3, points: 0 });
    setCurrentGrade(0);
    setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
  };

  return (
    <div>
      <h2>Current Grade: V{currentGrade}</h2>
      <div>
        <button onClick={() => completeClimb(1)}>1 Attempt</button>
        <button onClick={() => completeClimb(2)}>2 Attempts</button>
        <button onClick={() => completeClimb(3)}>3 Attempts</button>
        <button onClick={failClimb}>Climb Failed</button>
      </div>
      <div>
        <h3>Score: {score}</h3>
        {gameMode === 'time' && <div>Time Left: {formatTime(timeRemaining)}</div>}
      </div>
    </div>
  );
};

export default Gameplay;