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
                console.log('🔐 Authorization attempt:', {
                    username: credentials?.username,
                    hasPassword: !!credentials?.password,
                });

                if (!credentials?.username || !credentials?.password) {
                    console.log('❌ Missing credentials');
                    return null;
                }

                const adminUsername = process.env.ADMIN_USERNAME;
                const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

                console.log('🔑 Environment check:', {
                    hasAdminUsername: !!adminUsername,
                    adminUsername: adminUsername,
                    hasAdminPasswordHash: !!adminPasswordHash,
                    hashPreview: adminPasswordHash?.substring(0, 20) + '...',
                });

                if (!adminUsername || !adminPasswordHash) {
                    console.error('❌ Admin credentials not configured in environment');
                    return null;
                }

                const usernameMatch = credentials.username === adminUsername;

                console.log('🔐 Comparing password...');
                const passwordMatch = compareSync(
                    credentials.password as string,
                    adminPasswordHash
                );

                console.log('🔍 Credential check:', {
                    usernameMatch,
                    passwordMatch,
                });

                if (usernameMatch && passwordMatch) {
                    console.log('✅ Login successful!');
                    return {
                        id: '1',
                        name: 'Admin',
                        email: 'admin@jingyi.com'
                    };
                }

                console.log('❌ Login failed');
                return null;
            },
        }),
    ],
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnAdmin = nextUrl.pathname.startsWith('/admin');
            const isOnLogin = nextUrl.pathname === '/admin/login';

            if (isOnAdmin && !isOnLogin) {
                if (isLoggedIn) return true;
                return false;
            }

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