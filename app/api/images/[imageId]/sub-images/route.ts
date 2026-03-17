import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { adminDb, adminStorage } from '@/lib/firebase-admin';

// Add sub-image to existing image
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ imageId: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { imageId } = await params;

        // Get file from form data
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
        }

        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
        }

        // Upload file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const timestamp = Date.now();
        const filename = `jxu-sub-${imageId}-${timestamp}-${file.name}`;

        const bucket = adminStorage.bucket();
        const fileUpload = bucket.file(filename);

        await fileUpload.save(buffer, {
            metadata: { contentType: file.type },
            public: true,
        });

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

        // Get current image document
        const imageDoc = await adminDb.collection('archive-images').doc(imageId).get();

        if (!imageDoc.exists) {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }

        const imageData = imageDoc.data();
        const currentSubImages = imageData?.subImages || [];

        // Add new sub-image
        const newSubImage = {
            url: publicUrl,
            order: currentSubImages.length,
            createdAt: new Date(),
        };

        await adminDb.collection('archive-images').doc(imageId).update({
            subImages: [...currentSubImages, newSubImage],
            updatedAt: new Date(),
        });

        return NextResponse.json({
            success: true,
            subImage: newSubImage,
        });

    } catch (error: any) {
        console.error('Sub-image upload error:', error);
        return NextResponse.json({
            error: 'Upload failed: ' + error.message
        }, { status: 500 });
    }
}

// Delete sub-image
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ imageId: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { imageId } = await params;
        const { searchParams } = new URL(request.url);
        const subImageUrl = searchParams.get('url');

        if (!subImageUrl) {
            return NextResponse.json({ error: 'Sub-image URL required' }, { status: 400 });
        }

        // Get current image document
        const imageDoc = await adminDb.collection('archive-images').doc(imageId).get();

        if (!imageDoc.exists) {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }

        const imageData = imageDoc.data();
        const currentSubImages = imageData?.subImages || [];

        // Remove sub-image and reorder
        const updatedSubImages = currentSubImages
            .filter((img: any) => img.url !== subImageUrl)
            .map((img: any, index: number) => ({
                ...img,
                order: index,
            }));

        await adminDb.collection('archive-images').doc(imageId).update({
            subImages: updatedSubImages,
            updatedAt: new Date(),
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Sub-image delete error:', error);
        return NextResponse.json({
            error: 'Delete failed: ' + error.message
        }, { status: 500 });
    }
}