// lib/types.ts

export interface ProjectPhoto {
    url: string;
    order: number;
    width?: number;
    height?: number;
}



export interface Project {
    id: string;
    title: string;
    description?: string;
    category: 'personal' | 'work';  // NEW: Category field
    order: number;
    mainPhotos: ProjectPhoto[];
    processPhotos: ProjectPhoto[];
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateProjectData {
    title: string;
    description?: string;
    category: 'personal' | 'work';  // NEW: Category field
    order: number;
}

export interface UpdateProjectData {
    title?: string;
    description?: string;
    category?: 'personal' | 'work';
    order?: number;
    mainPhotos?: ProjectPhoto[];
    processPhotos?: ProjectPhoto[];
}

export interface AddPhotoData {
    url: string;
    order: number;
}

export interface ReorderProjectsData {
    projectIds: string[];  // New order of project IDs
}

export interface ReorderPhotosData {
    photoUrls: string[];  // New order of photo URLs
    type: 'main' | 'process';
}