import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { adminDb } from '@/lib/firebase-admin';

// GET - Public route (no auth needed)
export async function GET(request: NextRequest) {
    try {
        // Fetch from Firestore
        const imagesSnapshot = await adminDb
            .collection('archive-images')
            .orderBy('order', 'asc')
            .get();

        const images = imagesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ images });
    } catch (error) {
        console.error('Error fetching images:', error);
        return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
    }
}

// POST - Protected route (auth required)
export async function POST(request: NextRequest) {
    try {
        // Check auth
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { url } = body;

        if (!url) {
            return NextResponse.json({ error: 'Image URL required' }, { status: 400 });
        }

        // Get the current max order
        const snapshot = await adminDb
            .collection('archive-images')
            .orderBy('order', 'desc')
            .limit(1)
            .get();

        const maxOrder = snapshot.empty ? 0 : snapshot.docs[0].data().order + 1;

        // Generate new document ID
        const docId = `img-${String(maxOrder).padStart(3, '0')}`;

        // Add to Firestore
        await adminDb.collection('archive-images').doc(docId).set({
            url,
            order: maxOrder,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return NextResponse.json({
            success: true,
            message: 'Image added successfully',
            id: docId,
        });
    } catch (error) {
        console.error('Error adding image:', error);
        return NextResponse.json({ error: 'Failed to add image' }, { status: 500 });
    }
}

// DELETE - Protected route (auth required)
export async function DELETE(request: NextRequest) {
    try {
        // Check auth
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const imageId = searchParams.get('id');

        if (!imageId) {
            return NextResponse.json({ error: 'Image ID required' }, { status: 400 });
        }

        // Delete from Firestore
        await adminDb.collection('archive-images').doc(imageId).delete();

        return NextResponse.json({
            success: true,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting image:', error);
        return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
    }
}

// PATCH - Protected route (auth required)
export async function PATCH(request: NextRequest) {
    try {
        // Check auth
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { images } = body; // Array of { id, url, order }

        if (!images || !Array.isArray(images)) {
            return NextResponse.json({ error: 'Images array required' }, { status: 400 });
        }

        // Update order in Firestore using batch
        const batch = adminDb.batch();
        images.forEach((img, index) => {
            const docRef = adminDb.collection('archive-images').doc(img.id);
            batch.update(docRef, {
                order: index,
                updatedAt: new Date(),
            });
        });
        await batch.commit();

        return NextResponse.json({
            success: true,
            message: 'Images reordered successfully'
        });
    } catch (error) {
        console.error('Error reordering images:', error);
        return NextResponse.json({ error: 'Failed to reorder images' }, { status: 500 });
    }
}