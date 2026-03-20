import NextAuth from 'next-auth/next';
import { authOptions } from '@/lib/configs/authOptions';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
