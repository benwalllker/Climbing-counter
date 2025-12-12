'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface UserStats {
  totalGames: number;
  gamesWon: number;
  totalScore: number;
  averageScore: number;
  highestScore: number;
  totalClimbs: number;
  averageClimbs: number;
}

interface SessionHistory {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  players: Array<{
    name: string;
    score: number;
  }>;
}

interface LeaderboardEntry {
  name: string;
  totalScore: number;
  gamesPlayed: number;
  averageScore: number;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionHistory[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      loadDashboardData();
    }
  }, [session]);

  const loadDashboardData = async () => {
    try {
      // Load user stats
      const statsResponse = await fetch('/api/stats');
      const statsData = await statsResponse.json();
      setStats(statsData.stats);

      // Load session history
      const historyResponse = await fetch('/api/stats/history');
      const historyData = await historyResponse.json();
      setSessionHistory(historyData.sessions);

      // Load leaderboard
      const leaderboardResponse = await fetch('/api/stats/leaderboard');
      const leaderboardData = await leaderboardResponse.json();
      setLeaderboard(leaderboardData.leaderboard);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#ffc000' }}>
        Loading dashboard...
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#ffc000' }}>
        Please sign in to view your dashboard.
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#ffc000', fontSize: '2.5em' }}>VClimb Dashboard</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link href="/">
            <button style={{
              padding: '8px 16px',
              backgroundColor: '#404D58',
              color: '#ffc000',
              border: '1px solid #bf0000',
              borderRadius: '6px',
              cursor: 'pointer',
            }}>
              Back to Game
            </button>
          </Link>
          <span style={{ color: '#ffc000' }}>Welcome, {session.user?.name}</span>
          <button
            onClick={() => signOut()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#bf0000',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Personal Stats */}
      <div style={{ background: '#556573', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2 style={{ color: '#ffc000', marginBottom: '20px' }}>Your Statistics</h2>
        {stats ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ background: '#404D58', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
              <h3 style={{ color: '#ffc000', margin: '0 0 10px 0' }}>Games Played</h3>
              <div style={{ fontSize: '2em', color: '#ffc000', fontWeight: 'bold' }}>{stats.totalGames}</div>
            </div>
            <div style={{ background: '#404D58', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
              <h3 style={{ color: '#ffc000', margin: '0 0 10px 0' }}>Games Won</h3>
              <div style={{ fontSize: '2em', color: '#ffc000', fontWeight: 'bold' }}>{stats.gamesWon}</div>
            </div>
            <div style={{ background: '#404D58', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
              <h3 style={{ color: '#ffc000', margin: '0 0 10px 0' }}>Total Score</h3>
              <div style={{ fontSize: '2em', color: '#ffc000', fontWeight: 'bold' }}>{stats.totalScore}</div>
            </div>
            <div style={{ background: '#404D58', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
              <h3 style={{ color: '#ffc000', margin: '0 0 10px 0' }}>Average Score</h3>
              <div style={{ fontSize: '2em', color: '#ffc000', fontWeight: 'bold' }}>{stats.averageScore.toFixed(1)}</div>
            </div>
            <div style={{ background: '#404D58', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
              <h3 style={{ color: '#ffc000', margin: '0 0 10px 0' }}>Highest Score</h3>
              <div style={{ fontSize: '2em', color: '#ffc000', fontWeight: 'bold' }}>{stats.highestScore}</div>
            </div>
            <div style={{ background: '#404D58', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
              <h3 style={{ color: '#ffc000', margin: '0 0 10px 0' }}>Total Climbs</h3>
              <div style={{ fontSize: '2em', color: '#ffc000', fontWeight: 'bold' }}>{stats.totalClimbs}</div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#ffc000' }}>
            No statistics available yet. Play some games to see your stats!
          </div>
        )}
      </div>

      {/* Session History */}
      <div style={{ background: '#556573', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2 style={{ color: '#ffc000', marginBottom: '20px' }}>Recent Sessions</h2>
        {sessionHistory.length > 0 ? (
          <div style={{ display: 'grid', gap: '15px' }}>
            {sessionHistory.slice(0, 10).map((session) => (
              <div key={session.id} style={{ background: '#404D58', padding: '15px', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ color: '#ffc000', margin: '0' }}>{session.name}</h3>
                  <span style={{
                    color: session.status === 'ended' ? '#ffc000' : '#bf0000',
                    fontWeight: 'bold'
                  }}>
                    {session.status}
                  </span>
                </div>
                <p style={{ color: '#ffc000', margin: '5px 0' }}>
                  {new Date(session.createdAt).toLocaleDateString()}
                </p>
                <div style={{ color: '#ffc000' }}>
                  <strong>Players:</strong>
                  <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                    {session.players.map((player, index) => (
                      <li key={index}>{player.name}: {player.score} points</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#ffc000' }}>
            No sessions played yet. Join or create a session to get started!
          </div>
        )}
      </div>

      {/* Global Leaderboard */}
      <div style={{ background: '#556573', padding: '20px', borderRadius: '8px' }}>
        <h2 style={{ color: '#ffc000', marginBottom: '20px' }}>Global Leaderboard</h2>
        {leaderboard.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              color: '#ffc000',
              backgroundColor: '#404D58',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#2c3742' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #bf0000' }}>Rank</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #bf0000' }}>Player</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #bf0000' }}>Total Score</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #bf0000' }}>Games Played</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #bf0000' }}>Average Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.slice(0, 20).map((entry, index) => (
                  <tr key={index} style={{
                    borderBottom: index < leaderboard.length - 1 ? '1px solid #556573' : 'none',
                    backgroundColor: entry.name === session.user?.name ? '#2c3742' : 'transparent'
                  }}>
                    <td style={{ padding: '12px' }}>{index + 1}</td>
                    <td style={{ padding: '12px', fontWeight: entry.name === session.user?.name ? 'bold' : 'normal' }}>
                      {entry.name} {entry.name === session.user?.name ? '(You)' : ''}
                    </td>
                    <td style={{ padding: '12px' }}>{entry.totalScore}</td>
                    <td style={{ padding: '12px' }}>{entry.gamesPlayed}</td>
                    <td style={{ padding: '12px' }}>{entry.averageScore.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#ffc000' }}>
            No leaderboard data available yet.
          </div>
        )}
      </div>
    </div>
  );
}
