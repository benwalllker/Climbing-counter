import React from 'react';

const PlayerList = ({ players, currentPlayerIndex }) => {
  return (
    <ul id="playerList">
      {players.map((player, index) => (
        <li key={index} className={index === currentPlayerIndex ? 'current' : ''}>
          {`${index + 1}. ${player.name} - ${player.score} points`}
        </li>
      ))}
    </ul>
  );
};

export default PlayerList;