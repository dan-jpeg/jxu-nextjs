import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { backupId } = body;

        if (!backupId) {
            return NextResponse.json({ error: 'Backup ID required' }, { status: 400 });
        }

        // Get backup data
        const backupDoc = await adminDb
            .collection('archive-backup')
            .doc(backupId)
            .get();

        if (!backupDoc.exists) {
            return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
        }

        const backup = backupDoc.data();
        const backupImages = backup?.images || [];

        // Delete all current images
        const currentImages = await adminDb.collection('archive-images').get();
        const deleteBatch = adminDb.batch();
        currentImages.docs.forEach(doc => {
            deleteBatch.delete(doc.ref);
        });
        await deleteBatch.commit();

        // Restore images from backup
        const restoreBatch = adminDb.batch();
        backupImages.forEach((img: any) => {
            const docRef = adminDb.collection('archive-images').doc(img.id);
            restoreBatch.set(docRef, {
                url: img.url,
                order: img.order,
                createdAt: img.createdAt,
                updatedAt: new Date(),
            });
        });
        await restoreBatch.commit();

        return NextResponse.json({
            success: true,
            message: `Restored ${backupImages.length} images from backup`
        });
    } catch (error) {
        console.error('Error restoring backup:', error);
        return NextResponse.json({ error: 'Failed to restore backup' }, { status: 500 });
    }
}