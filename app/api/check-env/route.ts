import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    return NextResponse.json({
        envCheck: {
            ADMIN_USERNAME: process.env.ADMIN_USERNAME,
            hasAdminPasswordHash: !!process.env.ADMIN_PASSWORD_HASH,
            passwordHashLength: process.env.ADMIN_PASSWORD_HASH?.length,
            passwordHashPreview: process.env.ADMIN_PASSWORD_HASH?.substring(0, 20) + '...',
            hasAuthSecret: !!process.env.AUTH_SECRET,
            authSecretLength: process.env.AUTH_SECRET?.length,
            hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
            firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
        }
    });
}