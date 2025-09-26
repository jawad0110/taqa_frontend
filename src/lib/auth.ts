import { getServerSession } from "next-auth/next"
import { NextAuthOptions, User } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import axios from 'axios'

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token: any) {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh_token`, {
      headers: {
        Authorization: `Bearer ${token.refreshToken}`
      }
    })

    const refreshedTokens = response.data

    if (!response.data) {
      throw refreshedTokens
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + 60 * 60 * 1000, // 1 hour from now
      refreshToken: token.refreshToken, // Keep the same refresh token
    }
  } catch (error) {
    

    return {
      ...token,
      error: "RefreshAccessTokenError",
    }
  }
}

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            email: credentials.email,
            password: credentials.password
          })

          if (response.data && response.data.user) {
            return {
              id: response.data.user.uid,
              uid: response.data.user.uid,
              email: response.data.user.email,
              name: `${response.data.user.first_name} ${response.data.user.last_name}`,
              first_name: response.data.user.first_name,
              last_name: response.data.user.last_name,
              role: response.data.user.role || 'user', // Default to 'user' if role is not provided
              is_verified: response.data.user.is_verified,
              created_at: response.data.user.created_at,
              updated_at: response.data.user.updated_at,
              accessToken: response.data.token,
              refreshToken: response.data.refresh_token || ''
            }
          }
          return null
        } catch (error) {
          console.error('Login error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.user = user
        token.accessTokenExpires = Date.now() + 60 * 60 * 1000 // 1 hour from now
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpires) {
        return token
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token)
    },
    async session({ session, token }) {
      if (session.user) {
        session.user = {
          uid: token.user.uid,
          email: token.user.email,
          name: `${token.user.first_name} ${token.user.last_name}`,
          first_name: token.user.first_name,
          last_name: token.user.last_name,
          role: token.user.role || 'user', // Include role in session
          is_verified: token.user.is_verified,
          created_at: token.user.created_at,
          updated_at: token.user.updated_at,
          accessToken: token.accessToken,
          refreshToken: token.refreshToken || ''
        }
        session.error = token.error
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  secret: process.env.NEXTAUTH_SECRET
}

export const auth = () => getServerSession(authOptions)

export default auth
