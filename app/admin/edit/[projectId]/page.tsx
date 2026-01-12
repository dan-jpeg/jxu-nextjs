"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import type { Project, ProjectPhoto } from "@/lib/types";

export default function EditProject() {
    const router = useRouter();
    const params = useParams();
    const projectId = params.projectId as string;

    const [project, setProject] = useState<Project | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState<'personal' | 'work'>('personal');
    const [mainPhotos, setMainPhotos] = useState<ProjectPhoto[]>([]);
    const [processPhotos, setProcessPhotos] = useState<ProjectPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingMain, setUploadingMain] = useState(false);
    const [uploadingProcess, setUploadingProcess] = useState(false);

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
                setMainPhotos(proj.mainPhotos);
                setProcessPhotos(proj.processPhotos);
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

    const handleMainPhotoDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(mainPhotos);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update order values
        const updatedItems = items.map((item, index) => ({
            ...item,
            order: index,
        }));

        setMainPhotos(updatedItems);
    };

    const handleProcessPhotoDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(processPhotos);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update order values
        const updatedItems = items.map((item, index) => ({
            ...item,
            order: index,
        }));

        setProcessPhotos(updatedItems);
    };

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

    const removeMainPhoto = (index: number) => {
        const updated = mainPhotos
            .filter((_, i) => i !== index)
            .map((photo, i) => ({ ...photo, order: i }));
        setMainPhotos(updated);
    };

    const removeProcessPhoto = (index: number) => {
        const updated = processPhotos
            .filter((_, i) => i !== index)
            .map((photo, i) => ({ ...photo, order: i }));
        setProcessPhotos(updated);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            alert('Please enter a project title');
            return;
        }

        if (mainPhotos.length === 0) {
            alert('Please add at least one main photo');
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
                    mainPhotos,
                    processPhotos,
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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Edit Project</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => router.push('/admin/dashboard')}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="space-y-8 p-8 bg-white rounded-lg shadow">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Project Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Category */}
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

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Description <span className="text-gray-400">(optional)</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Main Photos */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Main Photos <span className="text-red-500">*</span>
                            <span className="text-gray-400 text-xs ml-2">(Drag to reorder)</span>
                        </label>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleMainPhotoUpload}
                            disabled={uploadingMain}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-4"
                        />
                        {uploadingMain && (
                            <p className="text-sm text-blue-600 mb-4">Uploading...</p>
                        )}

                        <DragDropContext onDragEnd={handleMainPhotoDragEnd}>
                            <Droppable droppableId="main-photos" direction="horizontal">
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="flex gap-4 overflow-x-auto pb-4"
                                    >
                                        {mainPhotos.map((photo, index) => (
                                            <Draggable
                                                key={photo.url}
                                                draggableId={photo.url}
                                                index={index}
                                            >
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`relative flex-shrink-0 ${
                                                            snapshot.isDragging ? 'opacity-50' : ''
                                                        }`}
                                                    >
                                                        <img
                                                            src={photo.url}
                                                            alt={`Main ${index + 1}`}
                                                            className="w-32 h-32 object-cover rounded border-2 border-gray-200"
                                                        />
                                                        <button
                                                            onClick={() => removeMainPhoto(index)}
                                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                                                        >
                                                            ×
                                                        </button>
                                                        <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                                            {index + 1}
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>

                    {/* Process Photos */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Process Photos <span className="text-gray-400">(optional)</span>
                            <span className="text-gray-400 text-xs ml-2">(Drag to reorder)</span>
                        </label>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleProcessPhotoUpload}
                            disabled={uploadingProcess}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 mb-4"
                        />
                        {uploadingProcess && (
                            <p className="text-sm text-green-600 mb-4">Uploading...</p>
                        )}

                        <DragDropContext onDragEnd={handleProcessPhotoDragEnd}>
                            <Droppable droppableId="process-photos" direction="horizontal">
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="flex gap-4 overflow-x-auto pb-4"
                                    >
                                        {processPhotos.map((photo, index) => (
                                            <Draggable
                                                key={photo.url}
                                                draggableId={photo.url}
                                                index={index}
                                            >
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`relative flex-shrink-0 ${
                                                            snapshot.isDragging ? 'opacity-50' : ''
                                                        }`}
                                                    >
                                                        <img
                                                            src={photo.url}
                                                            alt={`Process ${index + 1}`}
                                                            className="w-32 h-32 object-cover rounded border-2 border-gray-200"
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
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>
                </div>
            </div>
        </div>
    );
}