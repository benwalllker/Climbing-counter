import React, { useState } from 'react';

const PlayerSetup = ({ players, setPlayers, gameMode, setGameMode, startGame }) => {
  const [newPlayerName, setNewPlayerName] = useState('');

  const addPlayer = () => {
    if (newPlayerName.trim()) {
      setPlayers([...players, { name: newPlayerName, score: 0, history: [], v0Climbs: 0, grade: 0 }]);
      setNewPlayerName('');
    }
  };

  return (
    <div className="section" id="setup">
      <div id="playerSetup">
        <label>
          Add Player:
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
          />
        </label>
        <button onClick={addPlayer}>Add Player</button>
        <ul id="playerList">
          {(players || []).map((player, index) => (
            <li key={index}>{`${index + 1}. ${player.name}`}</li>
          ))}
        </ul>
      </div>
      <label>
        Game Mode:
        <select value={gameMode} onChange={(e) => setGameMode(e.target.value)}>
          <option value="unlimited">Unlimited</option>
          <option value="time">Time Mode</option>
          <option value="limit">Climb Limit Mode</option>
        </select>
      </label>
      <button onClick={() => startGame && startGame(gameMode)}>Start Game</button>
    </div>
  );
};

export default PlayerSetup;