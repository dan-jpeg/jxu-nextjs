// app/admin/dashboard/components/ProjectUpload.tsx

"use client";

import { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import type { ProjectPhoto } from "@/lib/types";

interface ProjectUploadProps {
    onSuccess?: () => void;
}

const ProjectUpload: React.FC<ProjectUploadProps> = ({ onSuccess }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState<'personal' | 'work'>('personal');
    const [mainPhotos, setMainPhotos] = useState<ProjectPhoto[]>([]);
    const [processPhotos, setProcessPhotos] = useState<ProjectPhoto[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadingMain, setUploadingMain] = useState(false);
    const [uploadingProcess, setUploadingProcess] = useState(false);

    const handleMainPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadingMain(true);

        try {
            const uploadPromises = Array.from(files).map(async (file, index) => {
                const timestamp = Date.now();
                const filename = `main-${timestamp}-${index}-${file.name}`;
                const storageRef = ref(storage, `projects/${filename}`);

                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);

                return {
                    url,
                    order: mainPhotos.length + index,
                };
            });

            const newPhotos = await Promise.all(uploadPromises);
            setMainPhotos([...mainPhotos, ...newPhotos]);
        } catch (error) {
            console.error('Error uploading main photos:', error);
            alert('Failed to upload main photos');
        } finally {
            setUploadingMain(false);
        }
    };

    const handleProcessPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadingProcess(true);

        try {
            const uploadPromises = Array.from(files).map(async (file, index) => {
                const timestamp = Date.now();
                const filename = `process-${timestamp}-${index}-${file.name}`;
                const storageRef = ref(storage, `projects/${filename}`);

                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);

                return {
                    url,
                    order: processPhotos.length + index,
                };
            });

            const newPhotos = await Promise.all(uploadPromises);
            setProcessPhotos([...processPhotos, ...newPhotos]);
        } catch (error) {
            console.error('Error uploading process photos:', error);
            alert('Failed to upload process photos');
        } finally {
            setUploadingProcess(false);
        }
    };

    const handleCreateProject = async () => {
        if (!title.trim()) {
            alert('Please enter a project title');
            return;
        }

        if (mainPhotos.length === 0) {
            alert('Please upload at least one main photo');
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
                    order: 0, // Will be set in backend or admin panel
                }),
            });

            if (!createResponse.ok) {
                throw new Error('Failed to create project');
            }

            const { project } = await createResponse.json();

            // Update with photos
            const updateResponse = await fetch(`/api/projects/${project.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mainPhotos,
                    processPhotos,
                }),
            });

            if (!updateResponse.ok) {
                throw new Error('Failed to add photos to project');
            }

            alert('Project created successfully!');

            // Reset form
            setTitle('');
            setDescription('');
            setMainPhotos([]);
            setProcessPhotos([]);

            // Call success callback if provided
            if (onSuccess) {
                onSuccess();
            } else {
                // Refresh page if no callback
                window.location.reload();
            }
        } catch (error) {
            console.error('Error creating project:', error);
            alert('Failed to create project');
        } finally {
            setUploading(false);
        }
    };

    const removeMainPhoto = (index: number) => {
        setMainPhotos(mainPhotos.filter((_, i) => i !== index));
    };

    const removeProcessPhoto = (index: number) => {
        setProcessPhotos(processPhotos.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-8 p-8 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-bold">Create New Project</h2>

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
                    placeholder="Project description (for future use)"
                />
            </div>

            {/* Main Photos Upload */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    Main Photos <span className="text-red-500">*</span>
                </label>
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleMainPhotoUpload}
                    disabled={uploadingMain}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploadingMain && (
                    <p className="mt-2 text-sm text-blue-600">Uploading main photos...</p>
                )}
                {mainPhotos.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-4">
                        {mainPhotos.map((photo, index) => (
                            <div key={index} className="relative">
                                <img
                                    src={photo.url}
                                    alt={`Main ${index + 1}`}
                                    className="w-full h-32 object-cover rounded"
                                />
                                <button
                                    onClick={() => removeMainPhoto(index)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Process Photos Upload */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    Process Photos <span className="text-gray-400">(optional)</span>
                </label>
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleProcessPhotoUpload}
                    disabled={uploadingProcess}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                {uploadingProcess && (
                    <p className="mt-2 text-sm text-green-600">Uploading process photos...</p>
                )}
                {processPhotos.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-4">
                        {processPhotos.map((photo, index) => (
                            <div key={index} className="relative">
                                <img
                                    src={photo.url}
                                    alt={`Process ${index + 1}`}
                                    className="w-full h-32 object-cover rounded"
                                />
                                <button
                                    onClick={() => removeProcessPhoto(index)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                                >
                                    ×
                                </button>
                                <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                    {String.fromCharCode(97 + index)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Button */}
            <button
                onClick={handleCreateProject}
                disabled={uploading || uploadingMain || uploadingProcess}
                className="w-full py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {uploading ? 'Creating Project...' : 'Create Project'}
            </button>
        </div>
    );
};

export default ProjectUpload;