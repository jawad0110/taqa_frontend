import NextAuth, { DefaultUser, Session as NextAuthSession, User as NextAuthUser } from 'next-auth';
import { JWT as NextAuthJWT } from 'next-auth/jwt';

declare module 'next-auth/jwt' {
  interface JWT extends NextAuthJWT {
    user: NextAuthUser;
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    error?: string;
  }
}

declare module 'next-auth' {
  interface Session {
    user: {
      accessToken: string;
      refreshToken: string;
      uid: string;
      email: string;
      name: string;
      first_name: string;
      last_name: string;
      role: string;
      is_verified: boolean;
      created_at: string;
      updated_at: string;
    };
    error?: string;
  }

  interface User {
    accessToken: string;
    refreshToken: string;
    uid: string;
    email: string;
    name: string;
    first_name: string;
    last_name: string;
    role: string;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
  }
}
