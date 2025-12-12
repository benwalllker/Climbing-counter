'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';

interface Player {
  id: string;
  name: string;
  score: number;
  history: Array<{
    grade: number;
    attempts: number;
    points: number;
  }>;
  v0Climbs: number;
  grade: number;
  userId: string;
}

interface Session {
  id: string;
  name: string;
  code: string;
  hostId: string;
  host: { id: string; name: string; email: string };
  gameMode: string;
  customLimit: number;
  timeLimit: number;
  status: string;
  players: Player[];
}

interface AuthForm {
  email: string;
  password: string;
  name: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);

  // Auth states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState<AuthForm>({ email: '', password: '', name: '' });
  const [authError, setAuthError] = useState('');

  // Session states
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessionCode, setSessionCode] = useState('');
  const [joinPlayerName, setJoinPlayerName] = useState('');
  const [createSessionName, setCreateSessionName] = useState('');
  const [view, setView] = useState<'auth' | 'sessions' | 'game'>('auth');

  // Game states
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gameMode, setGameMode] = useState('unlimited');
  const [customLimit, setCustomLimit] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [gameEnded, setGameEnded] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    if (session && !socket) {
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Connected to server');
      });

      newSocket.on('gameUpdate', (data) => {
        setPlayers(data.players);
        setCurrentPlayerIndex(data.currentPlayerIndex);
        setGameStarted(data.gameStarted);
        setGameEnded(data.gameEnded);
        setTimeRemaining(data.timeRemaining);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [session, socket]);

  // Load sessions when authenticated
  useEffect(() => {
    if (session && view === 'sessions') {
      loadSessions();
    }
  }, [session, view]);

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/sessions');
      const data = await response.json();
      setSessions(data.sessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      if (authMode === 'register') {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(authForm),
        });

        if (!response.ok) {
          const error = await response.json();
          setAuthError(error.error);
          return;
        }
      }

      const result = await signIn('credentials', {
        email: authForm.email,
        password: authForm.password,
        redirect: false,
      });

      if (result?.error) {
        setAuthError('Invalid credentials');
      } else {
        setView('sessions');
      }
    } catch (error) {
      setAuthError('An error occurred');
    }
  };

  const createSession = async () => {
    if (!createSessionName.trim()) return;

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createSessionName,
          gameMode: 'unlimited',
          customLimit: 0,
          timeLimit: 0,
        }),
      });

      const data = await response.json();
      setCurrentSession(data.session);
      setView('game');
      loadSessions();
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const joinSession = async () => {
    if (!sessionCode.trim() || !joinPlayerName.trim()) return;

    try {
      const response = await fetch(`/api/sessions/${sessionCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: joinPlayerName }),
      });

      if (response.ok) {
        // Load session details
        const sessionResponse = await fetch(`/api/sessions/${sessionCode}`);
        const sessionData = await sessionResponse.json();
        setCurrentSession(sessionData.session);
        setView('game');
      } else {
        alert('Failed to join session');
      }
    } catch (error) {
      console.error('Error joining session:', error);
    }
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

  const completeClimb = async (attempts: number) => {
    if (!currentSession || !players[currentPlayerIndex]) return;

    const currentPlayer = players[currentPlayerIndex];
    const points = calculatePoints(currentPlayer.grade, attempts);

    try {
      await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession.id,
          playerId: currentPlayer.id,
          grade: currentPlayer.grade,
          attempts,
          points,
        }),
      });

      // Emit socket event for real-time updates
      socket?.emit('climbCompleted', {
        sessionId: currentSession.id,
        playerId: currentPlayer.id,
        attempts,
        points,
      });
    } catch (error) {
      console.error('Error recording climb:', error);
    }
  };

  const failClimb = async () => {
    if (!currentSession || !players[currentPlayerIndex]) return;

    const currentPlayer = players[currentPlayerIndex];

    try {
      await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession.id,
          playerId: currentPlayer.id,
          grade: currentPlayer.grade,
          attempts: 3,
          points: 0,
        }),
      });

      socket?.emit('climbFailed', {
        sessionId: currentSession.id,
        playerId: currentPlayer.id,
      });
    } catch (error) {
      console.error('Error recording failed climb:', error);
    }
  };

  const startGame = () => {
    socket?.emit('startGame', { sessionId: currentSession?.id });
  };

  const endGame = () => {
    socket?.emit('endGame', { sessionId: currentSession?.id });
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentPlayer = players[currentPlayerIndex];
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  if (status === 'loading') {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  if (!session) {
    return (
      <div style={{ minHeight: '100vh', padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', color: '#ffc000', marginBottom: '30px' }}>VClimb</h1>

        <div style={{ background: '#556573', padding: '20px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', marginBottom: '20px' }}>
            <button
              onClick={() => setAuthMode('login')}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: authMode === 'login' ? '#bf0000' : '#404D58',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Login
            </button>
            <button
              onClick={() => setAuthMode('register')}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: authMode === 'register' ? '#bf0000' : '#404D58',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuth}>
            {authMode === 'register' && (
              <input
                type="text"
                placeholder="Name"
                value={authForm.name}
                onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '10px',
                  backgroundColor: '#404D58',
                  color: '#ffc000',
                  border: '1px solid #bf0000',
                  borderRadius: '5px',
                }}
                required
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                backgroundColor: '#404D58',
                color: '#ffc000',
                border: '1px solid #bf0000',
                borderRadius: '5px',
              }}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                backgroundColor: '#404D58',
                color: '#ffc000',
                border: '1px solid #bf0000',
                borderRadius: '5px',
              }}
              required
            />
            {authError && (
              <div style={{ color: 'red', marginBottom: '10px' }}>{authError}</div>
            )}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#bf0000',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              {authMode === 'login' ? 'Login' : 'Register'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'sessions') {
    return (
      <div style={{ minHeight: '100vh', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ color: '#ffc000' }}>VClimb</h1>
          <div>
            <span style={{ color: '#ffc000', marginRight: '10px' }}>Welcome, {session.user?.name}</span>
            <button
              onClick={() => signOut()}
              style={{
                padding: '5px 10px',
                backgroundColor: '#bf0000',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Create Session */}
          <div style={{ flex: 1, background: '#556573', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#ffc000' }}>Create New Session</h3>
            <input
              type="text"
              placeholder="Session Name"
              value={createSessionName}
              onChange={(e) => setCreateSessionName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                backgroundColor: '#404D58',
                color: '#ffc000',
                border: '1px solid #bf0000',
                borderRadius: '5px',
              }}
            />
            <button
              onClick={createSession}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#bf0000',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Create Session
            </button>
          </div>

          {/* Join Session */}
          <div style={{ flex: 1, background: '#556573', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#ffc000' }}>Join Session</h3>
            <input
              type="text"
              placeholder="Session Code"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                backgroundColor: '#404D58',
                color: '#ffc000',
                border: '1px solid #bf0000',
                borderRadius: '5px',
              }}
            />
            <input
              type="text"
              placeholder="Your Name"
              value={joinPlayerName}
              onChange={(e) => setJoinPlayerName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                backgroundColor: '#404D58',
                color: '#ffc000',
                border: '1px solid #bf0000',
                borderRadius: '5px',
              }}
            />
            <button
              onClick={joinSession}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#bf0000',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Join Session
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div style={{ marginTop: '20px', background: '#556573', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ color: '#ffc000' }}>Your Sessions</h3>
          {sessions.length === 0 ? (
            <p style={{ color: '#ffc000' }}>No sessions found. Create one above!</p>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  style={{
                    background: '#404D58',
                    padding: '15px',
                    borderRadius: '6px',
                    border: '1px solid #bf0000',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ color: '#ffc000', margin: '0' }}>{session.name}</h4>
                      <p style={{ color: '#ffc000', margin: '5px 0' }}>
                        Code: {session.code} | Host: {session.host.name} | Players: {session.players.length}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentSession(session);
                        setView('game');
                      }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#bf0000',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      {session.status === 'waiting' ? 'Join' : 'View'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Game View
  return (
    <div style={{ minHeight: '100vh', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#ffc000' }}>VClimb - {currentSession?.name}</h1>
        <div>
          <button
            onClick={() => setView('sessions')}
            style={{
              padding: '5px 10px',
              backgroundColor: '#404D58',
              color: '#ffc000',
              border: '1px solid #bf0000',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px',
            }}
          >
            Back to Sessions
          </button>
          <button
            onClick={() => signOut()}
            style={{
              padding: '5px 10px',
              backgroundColor: '#bf0000',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {!gameStarted && (
        <div style={{ background: '#556573', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3 style={{ color: '#ffc000' }}>Waiting for players...</h3>
          <p style={{ color: '#ffc000' }}>Session Code: <strong>{currentSession?.code}</strong></p>
          <p style={{ color: '#ffc000' }}>Players: {players.length}</p>
          <ul style={{ color: '#ffc000' }}>
            {players.map((player, index) => (
              <li key={player.id}>{player.name}</li>
            ))}
          </ul>
          {currentSession?.hostId === session?.user?.id && (
            <button
              onClick={startGame}
              style={{
                padding: '10px 20px',
                backgroundColor: '#bf0000',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              Start Game
            </button>
          )}
        </div>
      )}

      {gameStarted && !gameEnded && currentPlayer && (
        <div style={{ background: '#556573', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h2 style={{ color: '#ffc000' }}>
            Current Grade: V{currentPlayer.grade} | Player: {currentPlayer.name}
          </h2>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button onClick={() => completeClimb(1)} style={buttonStyle}>1 Attempt</button>
            <button onClick={() => completeClimb(2)} style={buttonStyle}>2 Attempts</button>
            <button onClick={() => completeClimb(3)} style={buttonStyle}>3 Attempts</button>
          </div>

          <button onClick={failClimb} style={{ ...buttonStyle, marginTop: '20px', width: '100%' }}>
            Climb Failed
          </button>

          <button onClick={endGame} style={{ ...buttonStyle, marginTop: '10px', width: '100%' }}>
            End Game
          </button>

          <div style={{ marginTop: '20px' }}>
            <h3 style={{ color: '#ffc000' }}>Player Scores</h3>
            {players.map((player, index) => (
              <div
                key={player.id}
                style={{
                  backgroundColor: index === currentPlayerIndex ? '#404D58' : '#556573',
                  padding: '10px',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  color: '#ffc000',
                  border: '1px solid #bf0000',
                }}
              >
                {player.name}: {player.score} points
              </div>
            ))}
          </div>
        </div>
      )}

      {gameEnded && (
        <div style={{ background: '#556573', padding: '20px', borderRadius: '8px' }}>
          <h2 style={{ color: '#ffc000' }}>Game Ended!</h2>
          <h3 style={{ color: '#ffc000' }}>Final Scores</h3>
          {sortedPlayers.map((player, index) => (
            <div key={player.id} style={{ color: '#ffc000', padding: '5px 0' }}>
              {index + 1}. {player.name} - {player.score} points
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const buttonStyle = {
  backgroundColor: '#bf0000',
  color: 'white',
  border: 'none',
  padding: '10px 16px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontFamily: "'Orbitron', sans-serif",
  fontWeight: 'bold' as const,
};
