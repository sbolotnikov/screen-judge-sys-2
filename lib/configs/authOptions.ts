import bcrypt from 'bcryptjs';
import { User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import clientPromise from '@/lib/mongodb';

type MongoUserData = {
  _id?: unknown;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  password?: string | null;
  role?: string | null;
  telephone?: string | null;
  emailVerified?: string | null;
  parties?: string[];
};

type ExtendedUser = User & {
  id?: string | null;
  role?: string | null;
  telephone?: string | null;
  parties?: string[];
};

export const authOptions = {
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      // @ts-expect-error NextAuth types compatibility
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }
        const client = await clientPromise;
        const db = client.db('screen-handler');
        const userDoc = await db.collection('users').findOne({ email: credentials.email });

        if (!userDoc) {
          return null;
        }

        const userData = userDoc as MongoUserData;
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          userData?.password || ""
        );

        if (!isPasswordValid) {
          return null;
        }
        const userObj = {
          id: userDoc._id.toString(),
          image: userData?.image ?? null,
          email: userData?.email ?? credentials.email,
          name: userData?.name ?? null,
        } as User;

        return userObj;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
      httpOptions: {
        timeout: 40000,
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    // @ts-expect-error NextAuth types compatibility
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const client = await clientPromise;
          const db = client.db('screen-handler');
          const userDoc = await db.collection('users').findOne({ email: user.email });

          if (!userDoc) {
            const timestamp = Date.now();
            const dateObject = new Date(timestamp);
            const date = dateObject.getDate();
            const month = dateObject.getMonth() + 1;
            const year = dateObject.getFullYear();
            const hour = dateObject.getHours();
            const minute = dateObject.getMinutes();
            const second = dateObject.getSeconds();

            await db.collection('users').insertOne({
              email: user.email,
              name: user.name,
              image: user.image,
              emailVerified: `${year}-${month}-${date} ${hour}:${minute}:${second}`,
              role: 'User',
              googleId: account.providerAccountId,
              parties: [],
            });
          }
        } catch (error) {
          console.error('Error handling Google user:', error);
          return false;
        }
      }
      return true;
    },
    // @ts-expect-error NextAuth types compatibility
    session: async ({ session }) => {
      const userEmail = session.user?.email;

      if (!userEmail) {
        return session;
      }

      const client = await clientPromise;
      const db = client.db('screen-handler');
      const userDoc = await db.collection('users').findOne({ email: userEmail });

      if (!userDoc) {
        return session;
      }

      const dbUser = userDoc as MongoUserData;

      return {
        ...session,
        user: {
          image: dbUser.image ?? session.user?.image ?? null,
          role: dbUser?.role ?? 'User',
          email: dbUser?.email ?? userEmail,
          name: dbUser?.name ?? session.user?.name ?? null,
          id: userDoc._id.toString(),
          telephone: dbUser?.telephone ?? null,
          parties: dbUser?.parties ?? [],
        },
      };
    },

    // @ts-expect-error NextAuth types compatibility
    jwt: async ({ token, user }) => {
      if (user) {
        const extendedUser = user as ExtendedUser;
        return {
          ...token,
          id: extendedUser.id ?? token.id,
          role: extendedUser.role ?? token.role ?? 'User',
          parties: extendedUser.parties ?? token.parties ?? [],
        };
      }

      if (token.email) {
        try {
          const client = await clientPromise;
          const db = client.db('screen-handler');
          const userDoc = await db.collection('users').findOne({ email: token.email });

          if (userDoc) {
            const userData = userDoc as MongoUserData;
            token.role = userData.role || 'User';
            token.id = userDoc._id.toString();
            token.parties = userData.parties || [];
          }
        } catch (error) {
          console.error('Error fetching user role and parties for JWT:', error);
        }
      }

      return token;
    },
  },
  events: {
    // @ts-expect-error NextAuth types compatibility
    async signIn(message) {
      console.log('Sign in event:', message);
    },
    // @ts-expect-error NextAuth types compatibility
    async signOut(message) {
      console.log('Sign out event:', message);
    },
    // @ts-expect-error NextAuth types compatibility
    async createUser(message) {
      console.log('Create user event:', message);
    },
  },
  debug: process.env.NODE_ENV === 'development',
};
