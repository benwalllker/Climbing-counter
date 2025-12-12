import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '../../../lib/prisma'
import { authOptions } from '../auth/[...nextauth]/route'

// POST /api/games - Record a game action
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { sessionId, playerId, grade, attempts, points } = await req.json()

    if (!sessionId || !playerId || grade === undefined || attempts === undefined || points === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify player belongs to session and user
    const player = await prisma.player.findFirst({
      where: {
        id: playerId,
        sessionId: sessionId,
        userId: session.user.id
      }
    })

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found or access denied' },
        { status: 404 }
      )
    }

    // Record the game
    const game = await prisma.game.create({
      data: {
        sessionId,
        playerId,
        grade,
        attempts,
        points
      }
    })

    // Update player stats
    await prisma.player.update({
      where: { id: playerId },
      data: {
        score: { increment: points },
        grade: grade + 1
      }
    })

    // Update user stats
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        totalGames: { increment: 1 },
        totalScore: { increment: points },
        totalClimbs: { increment: 1 },
        highestScore: {
          set: Math.max(player.score + points, await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { highestScore: true }
          }).then(u => u?.highestScore || 0))
        }
      }
    })

    return NextResponse.json(
      { 
        message: 'Game recorded successfully',
        game
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error recording game:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
