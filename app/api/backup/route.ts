import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { adminDb } from '@/lib/firebase-admin';

// Create backup snapshot
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all current images
        const imagesSnapshot = await adminDb
            .collection('archive-images')
            .orderBy('order', 'asc')
            .get();

        const images = imagesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Create backup document
        const backupRef = await adminDb.collection('archive-backup').add({
            images,
            createdAt: new Date(),
            createdBy: session.user?.email || 'admin',
            imageCount: images.length,
        });

        // Keep only last 10 backup
        const oldBackups = await adminDb
            .collection('archive-backup')
            .orderBy('createdAt', 'desc')
            .offset(10)
            .get();

        const batch = adminDb.batch();
        oldBackups.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        return NextResponse.json({
            success: true,
            backupId: backupRef.id,
            message: 'Backup created successfully'
        });
    } catch (error) {
        console.error('Error creating backup:', error);
        return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 });
    }
}

// Get all backup
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const backupsSnapshot = await adminDb
            .collection('archive-backup')
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();

        const backups = backupsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate().toISOString(),
        }));

        return NextResponse.json({ backups });
    } catch (error) {
        console.error('Error fetching backup:', error);
        return NextResponse.json({ error: 'Failed to fetch backup' }, { status: 500 });
    }
}