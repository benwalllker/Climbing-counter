import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '../../../../lib/prisma'
import { authOptions } from '../../auth/[...nextauth]/route'

// GET /api/sessions/[sessionId] - Get session details
export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const sessionData = await prisma.session.findUnique({
      where: { id: params.sessionId },
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
        games: {
          include: {
            player: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ session: sessionData })
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/sessions/[sessionId]/join - Join a session
export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { name } = await req.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      )
    }

    // Check if session exists
    const sessionData = await prisma.session.findUnique({
      where: { id: params.sessionId },
      include: { players: true }
    })

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Check if user is already a player in this session
    const existingPlayer = await prisma.player.findFirst({
      where: {
        sessionId: params.sessionId,
        userId: session.user.id
      }
    })

    if (existingPlayer) {
      return NextResponse.json(
        { error: 'Already joined this session' },
        { status: 400 }
      )
    }

    // Add user as player
    const player = await prisma.player.create({
      data: {
        userId: session.user.id,
        sessionId: params.sessionId,
        name: name
      }
    })

    return NextResponse.json(
      { 
        message: 'Joined session successfully',
        player
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error joining session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
