// app/api/projects/reorder/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { adminDb } from '@/lib/firebase-admin';
import type { ReorderProjectsData } from '@/lib/types';

export const dynamic = 'force-dynamic';

// POST /api/projects/reorder - Persist a specific project ordering
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: ReorderProjectsData = await request.json();

        if (!body?.projectIds || !Array.isArray(body.projectIds)) {
            return NextResponse.json(
                { error: 'projectIds is required' },
                { status: 400 }
            );
        }

        const uniqueIds = Array.from(new Set(body.projectIds)).filter(Boolean);
        if (uniqueIds.length !== body.projectIds.length) {
            return NextResponse.json(
                { error: 'projectIds must be unique' },
                { status: 400 }
            );
        }

        const batch = adminDb.batch();
        const now = new Date();

        uniqueIds.forEach((id, index) => {
            const ref = adminDb.collection('projects').doc(id);
            batch.update(ref, { order: index, updatedAt: now });
        });

        await batch.commit();

        return NextResponse.json(
            { message: 'Projects reordered successfully', updated: uniqueIds.length },
            { status: 200, headers: { 'Cache-Control': 'no-store' } }
        );
    } catch (error) {
        console.error('Error reordering projects:', error);
        return NextResponse.json(
            { error: 'Failed to reorder projects' },
            { status: 500 }
        );
    }
}

