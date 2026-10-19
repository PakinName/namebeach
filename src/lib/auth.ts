import { NextAuthOptions, getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from './prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.trim().toLowerCase() },
        });

        const email = credentials.email.trim().toLowerCase().slice(0,254);
        if (!user || !user.active || user.deletedAt) {
          await prisma.loginEvent.create({data:{email,userId:user?.id,outcome:'FAILED'}});
          throw new Error('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          await prisma.loginEvent.create({data:{email,userId:user.id,outcome:'FAILED'}});
          throw new Error('Invalid email or password');
        }

        if (user.role === 'TEACHER' && user.teacherApproval !== 'APPROVED') throw new Error('บัญชีครูรออนุมัติจากแอดมิน / Teacher account awaiting approval');
        await prisma.loginEvent.create({data:{email,userId:user.id,outcome:'SUCCESS'}});
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar ?? undefined,
        };
      },
    }),
  ],
  events: {
    async signOut({ token }) {
      if(token?.id) await prisma.loginEvent.create({data:{userId:String(token.id),email:token.email||'',outcome:'SIGN_OUT'}});
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      if (token.id) { const current = await prisma.user.findUnique({where:{id:String(token.id)},select:{name:true,role:true,email:true,avatar:true}}); if(current){token.name=current.name;token.role=current.role;token.email=current.email;token.picture=current.avatar;} }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'STUDENT' | 'TEACHER' | 'ADMIN';
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Every protected API rechecks the current database role and account status.
export async function getActiveSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, email: true, role: true, active: true, teacherApproval: true, deletedAt: true, fullName: true, nickname: true } });
  if (!user?.active || user.deletedAt || (user.role === 'TEACHER' && user.teacherApproval !== 'APPROVED')) return null;
  return { ...session, user: { ...session.user, ...user } };
}
