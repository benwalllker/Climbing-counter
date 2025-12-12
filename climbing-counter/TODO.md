# TODO: Real-Time Multiplayer Climbing Counter App

## 1. Backend Infrastructure Setup
- [ ] Install dependencies: next-auth, socket.io, socket.io-client, prisma, @prisma/client, bcryptjs, jsonwebtoken
- [ ] Set up Prisma with SQLite database
- [ ] Create database schema (prisma/schema.prisma) for users, sessions, games, player stats
- [ ] Set up NextAuth.js configuration for authentication

## 2. API Routes and Authentication
- [ ] Create API route for NextAuth: app/api/auth/[...nextauth]/route.ts
- [ ] Create API route for sessions: app/api/sessions/route.ts (create, join, list)
- [ ] Create API route for games: app/api/games/route.ts (game logic, stats)
- [ ] Create API route for user stats: app/api/stats/route.ts

## 3. Real-Time Communication
- [ ] Set up Socket.io server in a custom server file or Next.js API
- [ ] Implement Socket.io client in frontend
- [ ] Handle real-time events: player actions, turn changes, game state sync, timer sync

## 4. Frontend Modifications
- [ ] Update app/page.tsx to integrate auth checks and session/game UI
- [ ] Add login/signup forms and components
- [ ] Add session creation/joining UI
- [ ] Convert local state to server-synced state via Socket.io
- [ ] Update game logic to work with real-time data

## 5. Dashboard and Stats
- [ ] Create dashboard page/component: app/dashboard/page.tsx
- [ ] Display per-player stats: games played, wins, total score, average score, climb history
- [ ] Show session history and leaderboards
- [ ] Add navigation between game and dashboard

## 6. Testing and Deployment
- [ ] Test real-time functionality across multiple devices
- [ ] Test authentication and session management
- [ ] Deploy (Vercel for Next.js, separate server for Socket.io if needed)
- [ ] Handle production environment variables

## 7. Additional Features
- [ ] Add error handling and loading states
- [ ] Implement game persistence (save/load games)
- [ ] Add user profiles and avatars
- [ ] Optimize for mobile devices
