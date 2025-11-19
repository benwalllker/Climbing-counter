import React from 'react';

const FinalLeaderboard = ({ players }) => {
  return (
    <div className="section" id="finalLeaderboard">
      <h2>Final Leaderboard</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
          {players.map(player => {
            let total = 0;
            return player.history.map((entry, index) => {
              total += entry.points;
              return (
                <tr key={index}>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>{player.name}</td>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>{index + 1}</td>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>V{entry.grade}</td>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>{entry.attempts}</td>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>{entry.points}</td>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>{total}</td>
                </tr>
              );
            });
          })}
        </tbody>
      </table>
    </div>
  );
};

export default FinalLeaderboard;