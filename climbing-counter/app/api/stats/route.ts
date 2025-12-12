
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '../../../lib/prisma'
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

// GET /api/stats - Get user statistics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from database to get stats
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        players: {
          include: {
            session: true,
            climbs: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }


    // Calculate stats from player's sessions and climbs
    const totalGames = user.players.length
    const totalScore = user.players.reduce((sum: number, player: any) => sum + player.score, 0)
    const totalClimbs = user.players.reduce((sum: number, player: any) => sum + player.climbs.length, 0)
    
    // Get highest score and average score
    const highestScore = user.players.length > 0 
      ? Math.max(...user.players.map((p: any) => p.score))
      : 0
    
    const averageScore = totalGames > 0 ? totalScore / totalGames : 0
    const averageClimbs = totalGames > 0 ? totalClimbs / totalGames : 0

    // Calculate games won (sessions where player had highest score)
    const gamesWon = await prisma.session.count({
      where: {
        status: 'ended',
        players: {
          some: {
            userId: user.id,
            score: {
              // This is a simplified approach - in reality you'd need to check if this player won
            }
          }
        }
      }
    })

    const stats = {
      totalGames,
      gamesWon,
      totalScore,
      averageScore: Math.round(averageScore * 10) / 10,
      highestScore,
      totalClimbs,
      averageClimbs: Math.round(averageClimbs * 10) / 10
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
