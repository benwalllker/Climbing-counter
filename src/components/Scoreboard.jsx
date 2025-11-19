import React from 'react';

const Scoreboard = ({ players }) => {
  return (
    <div className="section" id="scoreboard">
      <h3>Score Summary</h3>
      <ul id="scoreList">
        {players.map((player, index) => (
          <li key={index}>
            <strong>{player.name}</strong>: {player.score} points
          </li>
        ))}
      </ul>
      <strong>Total Score: <span id="totalScore">{players.reduce((total, player) => total + player.score, 0)}</span></strong>
    </div>
  );
};

export default Scoreboard;