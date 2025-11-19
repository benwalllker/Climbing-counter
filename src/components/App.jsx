import React, { useState } from 'react';
import PlayerSetup from './PlayerSetup';
import Gameplay from './Gameplay';
import Scoreboard from './Scoreboard';
import FinalLeaderboard from './FinalLeaderboard';

const App = () => {
  const [players, setPlayers] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gameMode, setGameMode] = useState('unlimited');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const addPlayer = (name) => {
    setPlayers([...players, { name, score: 0, history: [], v0Climbs: 0, grade: 0 }]);
  };

  const startGame = (mode) => {
    setGameMode(mode);
    setGameStarted(true);
  };

  const endGame = () => {
    setGameOver(true);
    setGameStarted(false);
  };

  const nextPlayer = () => {
    if (players.length === 0) return;
    setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">VClimb</div>
        <div className="app-subtitle">Bouldering score tracker • Simple, fast, focused</div>
      </header>

      {!gameStarted && !gameOver && (
        <main>
          <PlayerSetup
            players={players}
            setPlayers={setPlayers}
            gameMode={gameMode}
            setGameMode={setGameMode}
            startGame={startGame}
          />
        </main>
      )}
      {gameStarted && !gameOver && (
        <Gameplay
          players={players}
          currentPlayerIndex={currentPlayerIndex}
          nextPlayer={nextPlayer}
          endGame={endGame}
        />
      )}
      {gameOver && <Scoreboard players={players} />}
      {gameOver && <FinalLeaderboard players={players} />}
    </div>
  );
};

export default App;