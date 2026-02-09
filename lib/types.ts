// lib/types.ts

export interface ProjectPhoto {
    url: string;
    order: number;
    width?: number;
    height?: number;
    caption?: {
        text: string;
        position: 'above' | 'below';
    };
}

// Content Block System - Photos + Text Blocks + Cycler
export type ContentBlock = PhotoBlock | TextBlock | CyclerBlock;

export interface PhotoBlock {
    id: string;
    type: 'photo';
    order: number;
    url: string;
    width?: number;
    height?: number;
    caption?: {
        text: string;
        position: 'above' | 'below';
    };
}

export interface TextBlock {
    id: string;
    type: 'text';
    order: number;
    content: string;
    style?: 'body' | 'italic' | 'quote';
}

export interface CyclerBlock {
    id: string;
    type: 'cycler';
    order: number;
    images: string[];
    interval?: number; // milliseconds
}

export interface Project {
    id: string;
    title: string;
    description?: string;
    category: 'personal' | 'work';
    order: number;
    useCycler?: boolean;
    useCyclerInterval?: number;

    // New: Unified content blocks (photos + text mixed together)
    mainContent?: ContentBlock[];
    processContent?: ContentBlock[];

    // Legacy: Keep for backward compatibility
    mainPhotos: ProjectPhoto[];
    processPhotos: ProjectPhoto[];

    createdAt: Date;
    updatedAt: Date;
}

export interface CreateProjectData {
    title: string;
    description?: string;
    category: 'personal' | 'work';
    order: number;
    useCycler?: boolean;
    useCyclerInterval?: number;
}

export interface UpdateProjectData {
    title?: string;
    description?: string;
    category?: 'personal' | 'work';
    order?: number;
    useCycler?: boolean;
    useCyclerInterval?: number;
    mainPhotos?: ProjectPhoto[];
    processPhotos?: ProjectPhoto[];
    // New: Support for content blocks
    mainContent?: ContentBlock[];
    processContent?: ContentBlock[];
}

export interface AddPhotoData {
    url: string;
    order: number;
}

export interface ReorderProjectsData {
    projectIds: string[];
}

export interface ReorderPhotosData {
    photoUrls: string[];
    type: 'main' | 'process';
}
