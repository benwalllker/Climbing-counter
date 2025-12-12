import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '../../../../lib/prisma'
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

// Inline authOptions to avoid import issues
const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      }
    })
  ],
  session: {
    strategy: "jwt" as const
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// GET /api/stats/history - Get user's session history
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all sessions where the user has been a player
    const userSessions = await prisma.player.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        session: {
          include: {
            players: {
              select: {
                name: true,
                score: true
              }
            }
          }
        }
      },
      orderBy: {
        joinedAt: 'desc'
      }
    })


    const sessions = userSessions.map((player: any) => ({
      id: player.session.id,
      name: player.session.name,
      status: player.session.status,
      createdAt: player.session.createdAt.toISOString(),
      players: player.session.players.map((p: any) => ({
        name: p.name,
        score: p.score
      }))
    }))

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Error fetching session history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
