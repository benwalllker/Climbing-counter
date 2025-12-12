const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_APP_URL 
      : "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Game state management
const gameSessions = new Map(); // sessionId -> gameState

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a game session
  socket.on('joinSession', async (data) => {
    try {
      const { sessionId, userId, playerName } = data;
      
      // Join the socket room for this session
      socket.join(sessionId);
      
      // Initialize or get existing game state
      let gameState = gameSessions.get(sessionId);
      if (!gameState) {
        gameState = await initializeGameState(sessionId);
        gameSessions.set(sessionId, gameState);
      }

      // Add player to game state if not already present
      const existingPlayer = gameState.players.find(p => p.userId === userId);
      if (!existingPlayer) {
        gameState.players.push({
          id: `player_${userId}`,
          userId,
          name: playerName,
          score: 0,
          grade: 0,
          v0Climbs: 0,
          history: [],
          isActive: true
        });
      }

      // Emit updated game state to all players in the session
      io.to(sessionId).emit('gameUpdate', {
        players: gameState.players,
        currentPlayerIndex: gameState.currentPlayerIndex,
        gameStarted: gameState.gameStarted,
        gameEnded: gameState.gameEnded,
        timeRemaining: gameState.timeRemaining
      });

      console.log(`Player ${playerName} joined session ${sessionId}`);
    } catch (error) {
      console.error('Error joining session:', error);
      socket.emit('error', { message: 'Failed to join session' });
    }
  });

  // Start game
  socket.on('startGame', async (data) => {
    try {
      const { sessionId } = data;
      let gameState = gameSessions.get(sessionId);
      
      if (!gameState) {
        gameState = await initializeGameState(sessionId);
        gameSessions.set(sessionId, gameState);
      }

      gameState.gameStarted = true;
      gameState.currentPlayerIndex = 0;
      gameState.timeRemaining = gameState.timeLimit;

      // Update session status in database
      await prisma.session.update({
        where: { id: sessionId },
        data: { status: 'active', startedAt: new Date() }
      });

      // Start timer if time limit is set
      if (gameState.timeLimit > 0) {
        gameState.timerInterval = setInterval(() => {
          gameState.timeRemaining--;
          if (gameState.timeRemaining <= 0) {
            gameState.gameEnded = true;
            clearInterval(gameState.timerInterval);
            endGame(sessionId);
          }
          
          io.to(sessionId).emit('gameUpdate', {
            players: gameState.players,
            currentPlayerIndex: gameState.currentPlayerIndex,
            gameStarted: gameState.gameStarted,
            gameEnded: gameState.gameEnded,
            timeRemaining: gameState.timeRemaining
          });
        }, 1000);
      }

      io.to(sessionId).emit('gameStarted', { sessionId });
      
      console.log(`Game started for session ${sessionId}`);
    } catch (error) {
      console.error('Error starting game:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  // Complete climb
  socket.on('climbCompleted', async (data) => {
    try {
      const { sessionId, playerId, attempts, points } = data;
      let gameState = gameSessions.get(sessionId);
      
      if (!gameState || !gameState.gameStarted || gameState.gameEnded) {
        return;
      }

      const player = gameState.players.find(p => p.id === playerId);
      if (!player) return;

      // Update player state
      player.score += points;
      player.grade = Math.min(player.grade + 1, 15); // Max grade V15
      player.history.push({
        grade: player.grade,
        attempts,
        points,
        timestamp: new Date()
      });

      if (player.grade === 0) {
        player.v0Climbs++;
      }

      // Record in database
      await prisma.climb.create({
        data: {
          playerId,
          grade: player.grade,
          attempts,
          points
        }
      });

      // Move to next player
      gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;

      io.to(sessionId).emit('gameUpdate', {
        players: gameState.players,
        currentPlayerIndex: gameState.currentPlayerIndex,
        gameStarted: gameState.gameStarted,
        gameEnded: gameState.gameEnded,
        timeRemaining: gameState.timeRemaining
      });

    } catch (error) {
      console.error('Error completing climb:', error);
      socket.emit('error', { message: 'Failed to complete climb' });
    }
  });

  // Fail climb
  socket.on('climbFailed', async (data) => {
    try {
      const { sessionId, playerId } = data;
      let gameState = gameSessions.get(sessionId);
      
      if (!gameState || !gameState.gameStarted || gameState.gameEnded) {
        return;
      }

      const player = gameState.players.find(p => p.id === playerId);
      if (!player) return;

      // Record failed climb in database
      await prisma.climb.create({
        data: {
          playerId,
          grade: player.grade,
          attempts: 3,
          points: 0
        }
      });

      // Move to next player
      gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;

      io.to(sessionId).emit('gameUpdate', {
        players: gameState.players,
        currentPlayerIndex: gameState.currentPlayerIndex,
        gameStarted: gameState.gameStarted,
        gameEnded: gameState.gameEnded,
        timeRemaining: gameState.timeRemaining
      });

    } catch (error) {
      console.error('Error failing climb:', error);
      socket.emit('error', { message: 'Failed to fail climb' });
    }
  });

  // End game
  socket.on('endGame', (data) => {
    const { sessionId } = data;
    endGame(sessionId);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Helper functions
async function initializeGameState(sessionId) {
  try {
    // Get session data from database
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        players: true
      }
    });

    if (!session) {
      throw new Error('Session not found');
    }

    return {
      sessionId,
      players: session.players.map(player => ({
        id: player.id,
        userId: player.userId,
        name: player.name,
        score: player.score,
        grade: player.grade,
        v0Climbs: player.v0Climbs,
        history: [],
        isActive: player.isActive
      })),
      currentPlayerIndex: 0,
      gameStarted: false,
      gameEnded: false,
      timeLimit: session.timeLimit,
      timeRemaining: session.timeLimit,
      timerInterval: null
    };
  } catch (error) {
    console.error('Error initializing game state:', error);
    throw error;
  }
}

async function endGame(sessionId) {
  try {
    let gameState = gameSessions.get(sessionId);
    if (!gameState) return;

    gameState.gameEnded = true;
    if (gameState.timerInterval) {
      clearInterval(gameState.timerInterval);
    }

    // Update session status in database
    await prisma.session.update({
      where: { id: sessionId },
      data: { 
        status: 'ended',
        endedAt: new Date()
      }
    });

    // Determine winner and update user stats
    const winner = gameState.players.reduce((prev, current) => 
      (prev.score > current.score) ? prev : current
    );

    // Update player scores in database
    for (const player of gameState.players) {
      await prisma.player.update({
        where: { id: player.id },
        data: {
          score: player.score,
          grade: player.grade
        }
      });

      // Update user stats
      await prisma.user.update({
        where: { id: player.userId },
        data: {
          totalGames: { increment: 1 },
          totalScore: { increment: player.score },
          highestScore: Math.max(player.score)
        }
      });
    }

    io.to(sessionId).emit('gameEnded', {
      winner: winner.name,
      finalScores: gameState.players.map(p => ({
        name: p.name,
        score: p.score
      })).sort((a, b) => b.score - a.score)
    });

    // Clean up game state
    gameSessions.delete(sessionId);
    
    console.log(`Game ended for session ${sessionId}`);
  } catch (error) {
    console.error('Error ending game:', error);
  }
}

const PORT = process.env.SOCKET_PORT || 3001;

server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Socket.IO server closed');
    process.exit(0);
  });
});

module.exports = { io, server };
