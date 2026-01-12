// app/api/projects/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { adminDb } from '@/lib/firebase-admin';
import type { Project, UpdateProjectData } from '@/lib/types';

// GET /api/projects/[id] - Get single project
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const projectDoc = await adminDb.collection('projects').doc(id).get();

        if (!projectDoc.exists) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        const data = projectDoc.data()!;
        const project: Project = {
            id: projectDoc.id,
            title: data.title,
            description: data.description,
            category: data.category || 'personal', // Default to 'personal' if not set
            order: data.order,
            mainPhotos: data.mainPhotos || [],
            processPhotos: data.processPhotos || [],
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
        };

        return NextResponse.json({ project }, { status: 200 });
    } catch (error) {
        console.error('Error fetching project:', error);
        return NextResponse.json(
            { error: 'Failed to fetch project' },
            { status: 500 }
        );
    }
}

// PUT /api/projects/[id] - Update project
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        // Check authentication
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;
        const body: UpdateProjectData = await request.json();

        const projectRef = adminDb.collection('projects').doc(id);
        const projectDoc = await projectRef.get();

        if (!projectDoc.exists) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        const updateData: any = {
            updatedAt: new Date(),
        };

        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.category !== undefined) updateData.category = body.category;
        if (body.order !== undefined) updateData.order = body.order;
        if (body.mainPhotos !== undefined) updateData.mainPhotos = body.mainPhotos;
        if (body.processPhotos !== undefined) updateData.processPhotos = body.processPhotos;

        await projectRef.update(updateData);

        const updatedDoc = await projectRef.get();
        const data = updatedDoc.data()!;

        const project: Project = {
            id: updatedDoc.id,
            title: data.title,
            description: data.description,
            category: data.category || 'personal', // Default to 'personal' if not set
            order: data.order,
            mainPhotos: data.mainPhotos || [],
            processPhotos: data.processPhotos || [],
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
        };

        return NextResponse.json({ project }, { status: 200 });
    } catch (error) {
        console.error('Error updating project:', error);
        return NextResponse.json(
            { error: 'Failed to update project' },
            { status: 500 }
        );
    }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        // Check authentication
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;
        const projectRef = adminDb.collection('projects').doc(id);
        const projectDoc = await projectRef.get();

        if (!projectDoc.exists) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        await projectRef.delete();

        return NextResponse.json(
            { message: 'Project deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error deleting project:', error);
        return NextResponse.json(
            { error: 'Failed to delete project' },
            { status: 500 }
        );
    }
}