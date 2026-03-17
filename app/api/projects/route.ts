// app/api/projects/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { adminDb } from '@/lib/firebase-admin';
import type { Project, CreateProjectData } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET /api/projects - Get all projects
export async function GET() {
    try {
        const projectsSnapshot = await adminDb.collection('projects').get();

        const projects: Project[] = projectsSnapshot.docs.map(doc => {
            const data = doc.data();
            const parsedOrder =
                typeof data.order === 'number' ? data.order : Number(data.order);
            const order = Number.isFinite(parsedOrder)
                ? parsedOrder
                : Number.MAX_SAFE_INTEGER;
            const category = data.category === 'work' ? 'work' : 'personal';

            return {
                id: doc.id,
                title: data.title,
                description: data.description,
                category,
                order,
                useCycler: data.useCycler || false,
                useCyclerInterval: data.useCyclerInterval || 3000,
                mainContent: data.mainContent || [],
                processContent: data.processContent || [],
                mainPhotos: data.mainPhotos || [],
                processPhotos: data.processPhotos || [],
                createdAt: data.createdAt?.toDate() || new Date(0),
                updatedAt: data.updatedAt?.toDate() || new Date(0),
            };
        });

        projects.sort((a, b) => {
            const orderDiff = a.order - b.order;
            if (orderDiff !== 0) return orderDiff;

            return a.createdAt.getTime() - b.createdAt.getTime();
        });

        return NextResponse.json(
            { projects },
            { status: 200, headers: { 'Cache-Control': 'no-store' } }
        );
    } catch (error) {
        console.error('Error fetching projects:', error);
        return NextResponse.json(
            { error: 'Failed to fetch projects' },
            { status: 500 }
        );
    }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: CreateProjectData = await request.json();

        // Validate required fields
        if (!body.title) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            );
        }

        if (!body.category || !['personal', 'work'].includes(body.category)) {
            return NextResponse.json(
                { error: 'Category must be "personal" or "work"' },
                { status: 400 }
            );
        }

        // Create project document
        const projectRef = adminDb.collection('projects').doc();
        const now = new Date();

        let nextOrder = 0;
        if (typeof body.order === 'number' && Number.isFinite(body.order)) {
            nextOrder = body.order;
        } else {
            const snapshot = await adminDb.collection('projects').get();
            let maxOrder = -1;
            snapshot.docs.forEach((doc) => {
                const data = doc.data();
                const parsed = typeof data.order === 'number' ? data.order : Number(data.order);
                const value = Number.isFinite(parsed) ? parsed : -1;
                if (value > maxOrder) maxOrder = value;
            });
            nextOrder = maxOrder + 1;
        }

        const projectData = {
            title: body.title,
            description: body.description || '',
            category: body.category,
            order: nextOrder,
            useCycler: body.useCycler || false,
            useCyclerInterval: body.useCyclerInterval || 3000,
            mainContent: [],
            processContent: [],
            mainPhotos: [],
            processPhotos: [],
            createdAt: now,
            updatedAt: now,
        };

        await projectRef.set(projectData);

        const project: Project = {
            id: projectRef.id,
            ...projectData,
        };

        return NextResponse.json({ project }, { status: 201 });
    } catch (error) {
        console.error('Error creating project:', error);
        return NextResponse.json(
            { error: 'Failed to create project' },
            { status: 500 }
        );
    }
}
