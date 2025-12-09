import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { adminDb } from '@/lib/firebase-admin';
import { archiveImages } from '@/data/images';

export async function POST(request: NextRequest) {
    try {
        // Check auth - only admin can migrate
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('🚀 Starting migration to Firestore...');

        const batch = adminDb.batch();
        let count = 0;

        for (let i = 0; i < archiveImages.length; i++) {
            const url = archiveImages[i];
            const docId = `img-${String(i).padStart(3, '0')}`;
            const docRef = adminDb.collection('archive-images').doc(docId);

            batch.set(docRef, {
                url,
                order: i,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            count++;
            console.log(`✓ Prepared: ${docId} (order: ${i})`);
        }

        console.log(`⏳ Committing ${count} images to Firestore...`);
        await batch.commit();
        console.log(`✅ Successfully migrated ${count} images!`);

        return NextResponse.json({
            success: true,
            message: `Successfully migrated ${count} images to Firestore!`,
            count
        });
    } catch (error) {
        console.error('❌ Migration failed:', error);
        return NextResponse.json({
            error: 'Migration failed',
            details: String(error)
        }, { status: 500 });
    }
}