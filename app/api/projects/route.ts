// app/api/projects/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { adminDb } from '@/lib/firebase-admin';
import type { Project, CreateProjectData } from '@/lib/types';

// GET /api/projects - Get all projects
export async function GET() {
    try {
        const projectsSnapshot = await adminDb
            .collection('projects')
            .orderBy('order', 'asc')
            .get();

        const projects: Project[] = projectsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                description: data.description,
                category: data.category || 'personal', // Default to 'personal' if not set
                order: data.order,
                mainPhotos: data.mainPhotos || [],
                processPhotos: data.processPhotos || [],
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
            };
        });

        return NextResponse.json({ projects }, { status: 200 });
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

        const projectData = {
            title: body.title,
            description: body.description || '',
            category: body.category,
            order: body.order || 0,
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