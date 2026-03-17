// components/ProjectUpload.tsx

"use client";

import { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import ContentBlockEditor from "./ContentBlockEditor";
import type { ContentBlock, PhotoBlock } from "@/lib/types";

interface ProjectUploadProps {
    onSuccess?: () => void;
}

const ProjectUpload: React.FC<ProjectUploadProps> = ({ onSuccess }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState<'personal' | 'work'>('personal');
    const [useCycler, setUseCycler] = useState(false);
    const [useCyclerInterval, setUseCyclerInterval] = useState(3000);
    const [mainContent, setMainContent] = useState<ContentBlock[]>([]);
    const [processContent, setProcessContent] = useState<ContentBlock[]>([]);
    const [uploading, setUploading] = useState(false);

    // Handle photo upload for content blocks
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

    const handleCreateProject = async () => {
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
            // Create project
            const createResponse = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim() || undefined,
                    category: category,
                    useCycler,
                    useCyclerInterval,
                }),
            });

            if (!createResponse.ok) {
                throw new Error('Failed to create project');
            }

            const { project } = await createResponse.json();

            // Update with content blocks
            const updateResponse = await fetch(`/api/projects/${project.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mainContent,
                    processContent,
                }),
            });

            if (!updateResponse.ok) {
                throw new Error('Failed to add content to project');
            }

            alert('Project created successfully!');

            // Reset form
            setTitle('');
            setDescription('');
            setMainContent([]);
            setProcessContent([]);

            if (onSuccess) {
                onSuccess();
            } else {
                window.location.reload();
            }
        } catch (error) {
            console.error('Error creating project:', error);
            alert('Failed to create project');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-10 p-8 bg-white/80 backdrop-blur rounded-2xl border border-gray-200 shadow-sm">
            <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">New Project</p>
                <h2 className="text-2xl font-semibold text-gray-900">Create</h2>
            </div>

            {/* Title Input */}
            <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                    Project Title <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-0 py-2 bg-transparent border-b border-gray-300 focus:outline-none focus:border-gray-900 transition-colors"
                    placeholder="e.g., THESIS COLLECTION_ELEVATOR EFFECT"
                />
            </div>

            {/* Category Selector */}
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

            {/* Description Input */}
            <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                    Description <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-0 py-2 bg-transparent border-b border-gray-300 focus:outline-none focus:border-gray-900 transition-colors"
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

            {/* Create Button */}
            <button
                onClick={handleCreateProject}
                disabled={uploading}
                className="w-full py-3 bg-gray-900 text-white rounded-full text-sm uppercase tracking-widest hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {uploading ? 'Creating Project...' : 'Create Project'}
            </button>
        </div>
    );
};

export default ProjectUpload;
