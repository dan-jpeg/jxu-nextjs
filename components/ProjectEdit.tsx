// components/ProjectEdit.tsx

"use client";

import { useEffect, useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import ContentBlockEditor from "./ContentBlockEditor";
import type { ContentBlock, Project, ProjectPhoto } from "@/lib/types";

interface ProjectEditProps {
    project: Project;
    onSuccess?: () => void;
    onCancel?: () => void;
}

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

const ProjectEdit: React.FC<ProjectEditProps> = ({ project, onSuccess, onCancel }) => {
    const [title, setTitle] = useState(project.title);
    const [description, setDescription] = useState(project.description || "");
    const [category, setCategory] = useState<'personal' | 'work'>(project.category);
    const [useCycler, setUseCycler] = useState<boolean>(project.useCycler || false);
    const [useCyclerInterval, setUseCyclerInterval] = useState<number>(project.useCyclerInterval || 3000);
    const [mainContent, setMainContent] = useState<ContentBlock[]>([]);
    const [processContent, setProcessContent] = useState<ContentBlock[]>([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        setTitle(project.title);
        setDescription(project.description || "");
        setCategory(project.category);
        setUseCycler(project.useCycler || false);
        setUseCyclerInterval(project.useCyclerInterval || 3000);
        setMainContent(buildInitialBlocks(project.mainContent, project.mainPhotos, "legacy-main"));
        setProcessContent(buildInitialBlocks(project.processContent, project.processPhotos, "legacy-process"));
    }, [project]);

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

    const handleUpdateProject = async () => {
        if (!title.trim()) {
            alert('Please enter a project title');
            return;
        }

        if (mainContent.length === 0) {
            alert('Please add at least one content block (photo or text)');
            return;
        }

        setUploading(true);

        try {
            const updateResponse = await fetch(`/api/projects/${project.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim() || undefined,
                    category: category,
                    useCycler,
                    useCyclerInterval,
                    mainContent: normalizeBlocks(mainContent),
                    processContent: normalizeBlocks(processContent),
                }),
            });

            if (!updateResponse.ok) {
                throw new Error('Failed to update project');
            }

            alert('Project updated successfully!');

            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error('Error updating project:', error);
            alert('Failed to update project');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-8 p-8 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Edit Project</h2>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="text-gray-600 hover:text-gray-900"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Title Input */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    Project Title <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., THESIS COLLECTION_ELEVATOR EFFECT"
                />
            </div>

            {/* Category Selector */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    Category <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => setCategory('personal')}
                        className={`flex-1 py-3 px-6 rounded font-medium transition-all ${
                            category === 'personal'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Personal Project
                    </button>
                    <button
                        type="button"
                        onClick={() => setCategory('work')}
                        className={`flex-1 py-3 px-6 rounded font-medium transition-all ${
                            category === 'work'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Work Experience
                    </button>
                </div>
            </div>

            {/* Description Input */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    Description <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Project description"
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
                        {useCycler ? "On" : "Off"}
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
            <div className="border-t pt-6">
                <label className="block text-sm font-medium mb-2">
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
            <div className="border-t pt-6">
                <label className="block text-sm font-medium mb-2">
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

            {/* Update Button */}
            <button
                onClick={handleUpdateProject}
                disabled={uploading}
                className="w-full py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {uploading ? "Saving..." : "Save Changes"}
            </button>
        </div>
    );
};

export default ProjectEdit;
