import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '../../../lib/prisma'
import { authOptions } from '../../auth/[...nextauth]/route'

// GET /api/sessions - List user's sessions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const sessions = await prisma.session.findMany({
      where: {
        OR: [
          { hostId: session.user.id },
          { players: { some: { userId: session.user.id } } }
        ]
      },
      include: {
        host: {
          select: { id: true, name: true, email: true }
        },
        players: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        _count: {
          select: {
            players: true,
            games: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/sessions - Create new session
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { name, gameMode, customLimit, timeLimit } = await req.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Session name is required' },
        { status: 400 }
      )
    }

    // Generate unique session code
    const code = Math.random().toString(36).substr(2, 6).toUpperCase()

    const newSession = await prisma.session.create({
      data: {
        name,
        code,
        hostId: session.user.id,
        gameMode: gameMode || 'unlimited',
        customLimit: customLimit || 0,
        timeLimit: timeLimit || 0,
        status: 'waiting'
      },
      include: {
        host: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Add host as a player
    await prisma.player.create({
      data: {
        userId: session.user.id,
        sessionId: newSession.id,
        name: session.user.name || 'Unknown Player'
      }
    })

    return NextResponse.json(
      { 
        message: 'Session created successfully',
        session: newSession
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
