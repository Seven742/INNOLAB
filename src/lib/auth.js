import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { queryOne } from './db';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await queryOne(
          'SELECT id, full_name, email, password_hash, role, avatar_url, is_active FROM users WHERE email = ?',
          [credentials.email]
        );

        if (!user) {
          throw new Error('Invalid email or password');
        }

        if (!user.is_active) {
          throw new Error('Account is deactivated');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password_hash);
        if (!isValid) {
          throw new Error('Invalid email or password');
        }

        // Update last login
        const { query } = await import('./db');
        await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

        return {
          id: String(user.id),
          name: user.full_name,
          email: user.email,
          role: user.role,
          avatar: user.avatar_url,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.avatar = user.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.avatar = token.avatar;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'innolab-dev-secret-change-in-production',
};

