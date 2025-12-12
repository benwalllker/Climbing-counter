'use client';

import { useState, useEffect, useCallback } from 'react';

interface Player {
  name: string;
  score: number;
  history: Array<{
    grade: number;
    attempts: number;
    points: number;
  }>;
  v0Climbs: number;
  grade: number;
}

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gameMode, setGameMode] = useState('unlimited');
  const [customLimit, setCustomLimit] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [gameEnded, setGameEnded] = useState(false);

  const addPlayer = () => {
    const name = newPlayerName.trim();
    if (name) {
      setPlayers(prev => [...prev, { name, score: 0, history: [], v0Climbs: 0, grade: 0 }]);
      setNewPlayerName('');
    }
  };

  const nextPlayer = () => {
    if (players.length === 0) return;
    setCurrentPlayerIndex(prev => (prev + 1) % players.length);
  };

  const updatePlayerList = () => {
    // This is handled by React state
  };

  const updatePlayerDisplay = () => {
    // This is handled by React state
  };

  const updateGradeDisplay = () => {
    // This is handled by React state
  };

  const updatePlayerScores = () => {
    // This is handled by React state
  };

  const updateLeaderboard = () => {
    // This is handled by React state
  };

  const updateClimbHistory = () => {
    // This is handled by React state
  };

  const renderFinalLeaderboard = () => {
    // This is handled by React state
  };

  const calculatePoints = (grade: number, attempts: number) => {
    if (grade === 0) return 0;
    if (grade === 1) return 1;
    if (grade === 2) return attempts <= 2 ? 2 : 1;
    if (grade >= 3) {
      if (attempts === 1) return 3;
      if (attempts === 2) return 2;
      return 1;
    }
    return 0;
  };

  const completeClimb = (attempts: number) => {
    setPlayers(prev => {
      const newPlayers = [...prev];
      const player = newPlayers[currentPlayerIndex];
      if (!player) return prev;

      const points = calculatePoints(player.grade, attempts);

      // Count V0 climbs in limit mode
      if (gameMode === 'limit' && player.grade === 0) {
        if (player.v0Climbs + 1 > customLimit) {
          endGame(`${player.name} reached the V0 climb limit.`);
          return newPlayers;
        }
        player.v0Climbs++;
      }

      player.history.push({ grade: player.grade, attempts, points });
      player.score += points;
      player.grade++;

      return newPlayers;
    });

    nextPlayer();
  };

  const failClimb = () => {
    setPlayers(prev => {
      const newPlayers = [...prev];
      const player = newPlayers[currentPlayerIndex];
      if (!player) return prev;

      // Count V0 climbs in limit mode
      if (gameMode === 'limit' && player.grade === 0) {
        if (player.v0Climbs + 1 > customLimit) {
          endGame(`${player.name} reached the V0 climb limit.`);
          return newPlayers;
        }
        player.v0Climbs++;
      }

      player.history.push({ grade: player.grade, attempts: 3, points: 0 });
      player.grade = 0;

      return newPlayers;
    });

    nextPlayer();
  };

  const startTimer = (duration: number) => {
    let timeLeft = duration;
    const interval = setInterval(() => {
      timeLeft--;
      setTimeRemaining(timeLeft);

      if (timeLeft <= 10) {
        // Add flash effect to timer
        const timerElement = document.getElementById('timerText');
        if (timerElement) {
          timerElement.classList.add('timer-flash');
        }
      }

      if (timeLeft < 0) {
        clearInterval(interval);
        setTimerInterval(null);
        endGame('Time is up!');
      }
    }, 1000);

    setTimerInterval(interval);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const endGame = (message: string) => {
    if (gameMode === 'unlimited') {
      if (!confirm("DONT BE SO WEAK! Are you sure you want to end the game?")) return;
    }

    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }

    setGameEnded(true);
    alert(message);
  };

  const startGame = () => {
    // Auto-add default player if none exist
    if (players.length === 0) {
      setPlayers([{ name: "Mystery Climber", score: 0, history: [], v0Climbs: 0, grade: 0 }]);
    }

    const mode = (document.getElementById('gameMode') as HTMLSelectElement)?.value || 'unlimited';
    const custom = parseInt((document.getElementById('customValue') as HTMLSelectElement)?.value || '0');
    
    setGameMode(mode);
    setCustomLimit(isNaN(custom) ? 0 : custom);
    setGameStarted(true);

    if (mode === 'time') {
      const timeLimit = custom * 60;
      setTimeRemaining(timeLimit);
      startTimer(timeLimit);
    }
  };

  const handleGameModeChange = (mode: string) => {
    setGameMode(mode);
  };

  const handleCustomValueChange = (value: number) => {
    setCustomLimit(value);
  };

  const currentPlayer = players[currentPlayerIndex];
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div style={{ minHeight: '100vh', padding: '20px' }}>
      <h1 className="app-title" style={{
        textAlign: 'center',
        fontSize: '2.5em',
        color: '#ffc000',
        marginBottom: '20px',
        fontWeight: '700',
        textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
        letterSpacing: '1px',
        borderBottom: '2px solid #ffc000',
        paddingBottom: '10px'
      }}>VClimb</h1>

      {/* Setup Section */}
      {!gameStarted && (
        <div className="section" style={{
          background: '#556573',
          padding: '20px',
          marginBottom: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}>
          <div id="playerSetup">
            <label style={{ display: 'block', marginTop: '10px', fontWeight: 'bold' }}>
              Add Player:
              <input 
                type="text" 
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '1rem',
                  padding: '10px',
                  boxSizing: 'border-box',
                  backgroundColor: '#404D58',
                  color: '#ffc000',
                  border: '1px solid #bf0000',
                  borderRadius: '5px',
                  marginTop: '5px'
                }}
              />
            </label>
            <button 
              onClick={addPlayer}
              style={{
                width: '100%',
                fontSize: '1rem',
                padding: '10px',
                boxSizing: 'border-box',
                backgroundColor: '#bf0000',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.3s ease',
                marginTop: '10px',
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: 'bold',
                borderRadius: '6px'
              }}
            >
              Add Player
            </button>
            <ul id="playerList" style={{ listStyle: 'none', paddingLeft: '0', marginTop: '10px' }}>
              {players.map((player, index) => (
                <li key={index} style={{ padding: '5px 0', borderBottom: '1px solid #eee' }}>
                  {index + 1}. {player.name}
                </li>
              ))}
            </ul>
          </div>

          <label style={{ display: 'block', marginTop: '10px', fontWeight: 'bold' }}>
            Game Mode:
            <select 
              id="gameMode"
              value={gameMode}
              onChange={(e) => handleGameModeChange(e.target.value)}
              style={{
                width: '100%',
                fontSize: '1rem',
                padding: '10px',
                boxSizing: 'border-box',
                backgroundColor: '#404D58',
                color: '#ffc000',
                border: '1px solid #bf0000',
                borderRadius: '5px',
                marginTop: '5px'
              }}
            >
              <option value="unlimited">Unlimited</option>
              <option value="time">Time Mode</option>
              <option value="limit">Climb Limit Mode</option>
            </select>
          </label>

          {(gameMode === 'time' || gameMode === 'limit') && (
            <label style={{ display: 'block', marginTop: '10px', fontWeight: 'bold' }}>
              {gameMode === 'time' ? 'Select Time Limit:' : 'Select Climb Limit:'}
              <select 
                id="customValue"
                onChange={(e) => handleCustomValueChange(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  fontSize: '1rem',
                  padding: '10px',
                  boxSizing: 'border-box',
                  backgroundColor: '#404D58',
                  color: '#ffc000',
                  border: '1px solid #bf0000',
                  borderRadius: '5px',
                  marginTop: '5px'
                }}
              >
                {gameMode === 'time' ? (
                  <>
                    <option value="1">1 minute</option>
                    <option value="5">5 minutes</option>
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="20">20 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                  </>
                ) : (
                  <>
                    <option value="5">5 climbs</option>
                    <option value="10">10 climbs</option>
                    <option value="15">15 climbs</option>
                    <option value="20">20 climbs</option>
                  </>
                )}
              </select>
            </label>
          )}

          <button 
            onClick={startGame}
            style={{
              width: '100%',
              fontSize: '1rem',
              padding: '10px',
              boxSizing: 'border-box',
              backgroundColor: '#bf0000',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.3s ease',
              marginTop: '10px',
              fontFamily: "'Orbitron', sans-serif",
              fontWeight: 'bold',
              borderRadius: '6px'
            }}
          >
            Start Game
          </button>
        </div>
      )}

      {/* Timer Display */}
      {gameMode === 'time' && gameStarted && !gameEnded && (
        <div className="timer-display" style={{
          fontSize: '3em',
          fontWeight: 'bold',
          color: timeRemaining <= 10 ? 'red' : '#ffc000',
          textAlign: 'center',
          margin: '20px auto'
        }}>
          Time Left: <span id="timerText">{formatTime(timeRemaining)}</span>
        </div>
      )}

      {/* Gameplay Section */}
      {gameStarted && !gameEnded && currentPlayer && (
        <div className="section" style={{
          background: '#556573',
          padding: '20px',
          marginBottom: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#ffc000' }}>
            Current Grade: V{currentPlayer.grade} | Player: {currentPlayer.name}
          </h2>
          
          <div className="gameplay-row" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px'
          }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginTop: '10px', fontWeight: 'bold' }}>
                Climb Completed:
              </label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  onClick={() => completeClimb(1)}
                  style={{
                    backgroundColor: '#bf0000',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease',
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 'bold'
                  }}
                >
                  1 Attempt
                </button>
                <button 
                  onClick={() => completeClimb(2)}
                  style={{
                    backgroundColor: '#bf0000',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease',
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 'bold'
                  }}
                >
                  2 Attempts
                </button>
                <button 
                  onClick={() => completeClimb(3)}
                  style={{
                    backgroundColor: '#bf0000',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease',
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 'bold'
                  }}
                >
                  3 Attempts
                </button>
              </div>
              
              <div style={{ marginBottom: '20px', marginTop: '20px' }}>
                <button 
                  onClick={failClimb}
                  style={{
                    backgroundColor: '#bf0000',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease',
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 'bold',
                    width: '100%'
                  }}
                >
                  Climb Failed
                </button>
              </div>

              <button 
                onClick={() => endGame('Game ended manually.')}
                style={{
                  backgroundColor: '#bf0000',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease',
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: 'bold',
                  width: '100%'
                }}
              >
                End Game
              </button>
            </div>

            <div style={{ flexShrink: 0, textAlign: 'center' }}>
              <h2 style={{ fontSize: '2.5em', margin: '0', color: '#ffc000' }}>Score</h2>
              <div style={{ fontSize: '3em', fontWeight: 'bold', color: 'whitesmoke' }}>
                {currentPlayer.score}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h3 style={{ color: '#ffc000', marginBottom: '10px' }}>Player Scores</h3>
            {players.map((player, index) => {
              const isCurrent = index === currentPlayerIndex;
              const remaining = customLimit - player.v0Climbs;
              const warning = gameMode === 'limit' && remaining === 1;

              return (
                <div 
                  key={index}
                  style={{
                    backgroundColor: isCurrent ? '#404D58' : '#556573',
                    padding: '10px',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    color: warning ? 'red' : '#ffc000',
                    border: warning ? '1px solid red' : '1px solid #bf0000',
                    boxSizing: 'border-box',
                    boxShadow: isCurrent ? '0 0 10px rgba(255, 192, 0, 0.3)' : 'none'
                  }}
                >
                  <span className="player-name" style={{ color: '#ffc000', fontWeight: 'bold' }}>
                    {player.name}
                  </span>: 
                  <span className="player-score" style={{ color: '#ffc000', fontWeight: '600' }}>
                    {player.score} points
                  </span>
                  {gameMode === 'limit' && (
                    <> | V0 climbs left: {remaining}</>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scoreboard Section */}
      {gameEnded && (
        <div className="section" style={{
          background: '#556573',
          padding: '20px',
          marginBottom: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#ffc000' }}>Score Summary</h3>
          <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
            {sortedPlayers.map((player, index) => (
              <li key={index} style={{ padding: '5px 0', borderBottom: '1px solid #eee' }}>
                {index + 1}. {player.name} - {player.score} points
              </li>
            ))}
          </ul>
          <strong style={{ display: 'block', marginTop: '10px', fontSize: '1.2em' }}>
            Total Score: <span>{players.reduce((sum, p) => sum + p.score, 0)}</span>
          </strong>
        </div>
      )}

      {/* Final Leaderboard Table */}
      {gameEnded && (
        <div className="section" style={{
          background: '#556573',
          padding: '20px',
          marginBottom: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#ffc000' }}>Final Leaderboard</h2>
          <div style={{ overflowX: 'auto', border: '1px solid #ccc', borderRadius: '6px', marginBottom: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ backgroundColor: '#404D58', color: '#ffc000' }}>
                  <th style={{ padding: '8px', border: '1px solid #ccc' }}>Player</th>
                  <th style={{ padding: '8px', border: '1px solid #ccc' }}>Climb #</th>
                  <th style={{ padding: '8px', border: '1px solid #ccc' }}>Grade</th>
                  <th style={{ padding: '8px', border: '1px solid #ccc' }}>Attempts</th>
                  <th style={{ padding: '8px', border: '1px solid #ccc' }}>Points</th>
                  <th style={{ padding: '8px', border: '1px solid #ccc' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {players.map(player => 
                  player.history.map((entry, index) => {
                    const total = player.history.slice(0, index + 1).reduce((sum, h) => sum + h.points, 0);
                    return (
                      <tr key={`${player.name}-${index}`}>
                        <td style={{ padding: '8px', border: '1px solid #ccc' }}>{player.name}</td>
                        <td style={{ padding: '8px', border: '1px solid #ccc' }}>{index + 1}</td>
                        <td style={{ padding: '8px', border: '1px solid #ccc' }}>V{entry.grade}</td>
                        <td style={{ padding: '8px', border: '1px solid #ccc' }}>{entry.attempts}</td>
                        <td style={{ padding: '8px', border: '1px solid #ccc' }}>{entry.points}</td>
                        <td style={{ padding: '8px', border: '1px solid #ccc' }}>{total}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Climb History Section */}
      {gameEnded && (
        <div className="section" style={{
          background: '#556573',
          padding: '20px',
          marginBottom: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#ffc000' }}>Climb History</h2>
          <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
            {players.map((player, playerIndex) => (
              <li key={playerIndex}>
                <strong style={{ color: '#ffc000' }}>{player.name}</strong>
                {player.history.map((entry, index) => (
                  <div key={index} style={{ padding: '5px 0', borderBottom: '1px solid #eee' }}>
                    #{index + 1}: V{entry.grade} | Attempts: {entry.attempts} | Points: {entry.points}
                  </div>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}

      <style jsx>{`
        @keyframes flashRed {
          0% { color: red; }
          50% { color: #ff6666; }
          100% { color: red; }
        }

        .timer-flash {
          animation: flashRed 1s infinite;
        }

        @media (max-width: 600px) {
          .gameplay-row {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }

          #bigScore {
            font-size: 2.5em;
            margin-top: 10px;
          }

          button {
            font-size: 1.1em;
            padding: 12px;
          }
        }

        input[type="text"]:focus {
          color: #ffc000;
          background-color: #556573;
          outline: none;
          border-color: #bf0000;
        }

        button:hover {
          background-color: #f30808;
        }
      `}</style>
    </div>
  );
}
