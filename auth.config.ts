import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compareSync } from 'bcrypt-edge';

export const authConfig: NextAuthConfig = {
    pages: {
        signIn: '/admin/login',
    },
    providers: [
        Credentials({
            credentials: {
                username: { label: 'Username', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    return null;
                }

                const adminUsername = process.env.ADMIN_USERNAME;
                const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

                if (!adminUsername || !adminPasswordHash) {
                    console.error('Admin credentials not configured in environment');
                    return null;
                }

                const usernameMatch = credentials.username === adminUsername;
                const passwordMatch = compareSync(
                    credentials.password as string,
                    adminPasswordHash
                );

                if (usernameMatch && passwordMatch) {
                    return {
                        id: '1',
                        name: 'Admin',
                        email: 'admin@jingyi.com'
                    };
                }

                return null;
            },
        }),
    ],
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnAdmin = nextUrl.pathname.startsWith('/admin');
            const isOnLogin = nextUrl.pathname === '/admin/login';
            const isOnAdminRoot = nextUrl.pathname === '/admin';

            // If on /admin (root) with no trailing slash
            if (isOnAdminRoot) {
                if (isLoggedIn) {
                    return Response.redirect(new URL('/admin/dashboard', nextUrl));
                }
                return Response.redirect(new URL('/admin/login', nextUrl));
            }

            // If on admin pages (not login)
            if (isOnAdmin && !isOnLogin) {
                if (isLoggedIn) return true;
                return false; // Redirect to login
            }

            // If on login while already logged in
            if (isOnLogin && isLoggedIn) {
                return Response.redirect(new URL('/admin/dashboard', nextUrl));
            }

            return true;
        },
    },
    session: {
        strategy: 'jwt',
    },
};