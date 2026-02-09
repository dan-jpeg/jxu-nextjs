"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import ContentBlockEditor from "@/components/ContentBlockEditor";
import type { ContentBlock, Project, ProjectPhoto } from "@/lib/types";

const normalizeBlocks = (blocks: ContentBlock[]): ContentBlock[] =>
    [...blocks]
        .sort((a, b) => a.order - b.order)
        .map((block, index) => ({ ...block, order: index }));

const legacyPhotosToBlocks = (
    photos: ProjectPhoto[] | undefined,
    prefix: string
): ContentBlock[] => {
    if (!photos || photos.length === 0) return [];

    const sorted = [...photos].sort((a, b) => a.order - b.order);
    return sorted.map((photo, index) => ({
        id: `${prefix}-${index}-${Date.now()}`,
        type: "photo",
        order: index,
        url: photo.url,
        width: photo.width,
        height: photo.height,
        caption: photo.caption,
    }));
};

const buildInitialBlocks = (
    content: ContentBlock[] | undefined,
    legacy: ProjectPhoto[] | undefined,
    prefix: string
) => {
    if (content && content.length > 0) return normalizeBlocks(content);
    return legacyPhotosToBlocks(legacy, prefix);
};

export default function EditProject() {
    const router = useRouter();
    const params = useParams();
    const projectId = params.projectId as string;

    const [project, setProject] = useState<Project | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState<'personal' | 'work'>('personal');
    const [useCycler, setUseCycler] = useState(false);
    const [useCyclerInterval, setUseCyclerInterval] = useState(3000);
    const [mainContent, setMainContent] = useState<ContentBlock[]>([]);
    const [processContent, setProcessContent] = useState<ContentBlock[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch project data
    useEffect(() => {
        const fetchProject = async () => {
            try {
                const response = await fetch(`/api/projects/${projectId}`);
                if (!response.ok) {
                    throw new Error('Project not found');
                }
                const data = await response.json();
                const proj = data.project;

                setProject(proj);
                setTitle(proj.title);
                setDescription(proj.description || "");
                setCategory(proj.category);
                setUseCycler(proj.useCycler || false);
                setUseCyclerInterval(proj.useCyclerInterval || 3000);
                setMainContent(buildInitialBlocks(proj.mainContent, proj.mainPhotos, "legacy-main"));
                setProcessContent(buildInitialBlocks(proj.processContent, proj.processPhotos, "legacy-process"));
            } catch (error) {
                console.error('Error fetching project:', error);
                alert('Failed to load project');
                router.push('/admin/dashboard');
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            fetchProject();
        }
    }, [projectId, router]);

    const handlePhotoUpload = async (files: File[]): Promise<string[]> => {
        const uploadPromises = files.map(async (file, index) => {
            const timestamp = Date.now();
            const filename = `${timestamp}-${index}-${file.name}`;
            const storageRef = ref(storage, `projects/${filename}`);

            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            return url;
        });

        return await Promise.all(uploadPromises);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            alert('Please enter a project title');
            return;
        }

        if (mainContent.length === 0) {
            alert('Please add at least one content block (photo or text)');
            return;
        }

        setSaving(true);

        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim() || undefined,
                    category,
                    useCycler,
                    useCyclerInterval,
                    mainContent: normalizeBlocks(mainContent),
                    processContent: normalizeBlocks(processContent),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update project');
            }

            alert('Project updated successfully!');
            router.push('/admin/dashboard');
        } catch (error) {
            console.error('Error updating project:', error);
            alert('Failed to update project');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Loading project...</div>
            </div>
        );
    }

    if (!project) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-stone-50 to-neutral-100">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Project</p>
                        <h1 className="text-2xl font-semibold text-gray-900">Edit</h1>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => router.push('/admin/dashboard')}
                            className="px-4 py-2 text-xs uppercase tracking-widest border border-gray-300 text-gray-700 rounded-full hover:border-gray-500 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-2 bg-gray-900 text-white rounded-full text-xs uppercase tracking-widest hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="space-y-10 p-8 bg-white/80 backdrop-blur rounded-2xl border border-gray-200 shadow-sm">
                    {/* Title */}
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                            Project Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-0 py-2 bg-transparent border-b border-gray-300 focus:outline-none focus:border-gray-900 transition-colors"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-3">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1">
                            <button
                                type="button"
                                onClick={() => setCategory('personal')}
                                className={`px-5 py-2 rounded-full text-xs uppercase tracking-widest transition-all ${
                                    category === 'personal'
                                        ? 'bg-gray-900 text-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Personal Project
                            </button>
                            <button
                                type="button"
                                onClick={() => setCategory('work')}
                                className={`px-5 py-2 rounded-full text-xs uppercase tracking-widest transition-all ${
                                    category === 'work'
                                        ? 'bg-gray-900 text-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Work Experience
                            </button>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                            Description <span className="text-gray-400">(optional)</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full px-0 py-2 bg-transparent border-b border-gray-300 focus:outline-none focus:border-gray-900 transition-colors"
                        />
                    </div>

                    {/* Image Cycler Controls */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-gray-900">Use image cycler on archive</div>
                                <div className="text-xs text-gray-500">Cycles main photos instead of the standard row</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setUseCycler(!useCycler)}
                                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                    useCycler
                                        ? 'bg-gray-900 text-white border-gray-900'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                                }`}
                            >
                                {useCycler ? 'On' : 'Off'}
                            </button>
                        </div>

                        {useCycler && (
                            <div className="flex items-center gap-3">
                                <label className="text-xs uppercase tracking-widest text-gray-500">Cycler interval (ms)</label>
                                <input
                                    type="number"
                                    min={250}
                                    step={250}
                                    value={useCyclerInterval}
                                    onChange={(e) => setUseCyclerInterval(Number(e.target.value) || 3000)}
                                    className="w-28 px-2 py-1 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                                />
                            </div>
                        )}
                    </div>

                    {/* Main Photos Blocks */}
                    <div className="border-t border-gray-100 pt-6">
                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                            Main Photos <span className="text-red-500">*</span>
                        </label>
                        <ContentBlockEditor
                            blocks={mainContent}
                            onChange={setMainContent}
                            onPhotoUpload={handlePhotoUpload}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Mix photos and text blocks. Drag to reorder.
                        </p>
                    </div>

                    {/* Process Photos Blocks */}
                    <div className="border-t border-gray-100 pt-6">
                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                            Process Photos <span className="text-gray-400">(optional)</span>
                        </label>
                        <ContentBlockEditor
                            blocks={processContent}
                            onChange={setProcessContent}
                            onPhotoUpload={handlePhotoUpload}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Optional: Add process photos and notes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
