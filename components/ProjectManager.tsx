// components/ProjectManager.tsx

"use client";

import { useState } from "react";
import type { ContentBlock, Project } from "@/lib/types";

interface ProjectManagerProps {
    projects: Project[];
    loading: boolean;
    onUpdate: () => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({
                                                           projects,
                                                           loading,
                                                           onUpdate
                                                       }) => {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (projectId: string, projectTitle: string) => {
        if (!confirm(`Are you sure you want to delete "${projectTitle}"? This cannot be undone.`)) {
            return;
        }

        setDeletingId(projectId);

        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete project");
            }

            alert("Project deleted successfully");
            onUpdate();
        } catch (error) {
            console.error("Error deleting project:", error);
            alert("Failed to delete project");
        } finally {
            setDeletingId(null);
        }
    };

    const handleReorder = async (projectId: string, direction: "up" | "down") => {
        const currentIndex = projects.findIndex(p => p.id === projectId);
        if (currentIndex === -1) return;

        const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= projects.length) return;

        const project1 = projects[currentIndex];
        const project2 = projects[newIndex];

        if (project1.category !== project2.category) return;

        try {
            await Promise.all([
                fetch(`/api/projects/${project1.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ order: project2.order }),
                }),
                fetch(`/api/projects/${project2.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ order: project1.order }),
                }),
            ]);

            onUpdate();
        } catch (error) {
            console.error("Error reordering projects:", error);
            alert("Failed to reorder projects");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Loading projects...</div>
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-200 p-12 text-center">
                <p className="text-gray-700 mb-2 text-sm uppercase tracking-widest">No projects yet</p>
                <p className="text-xs text-gray-400">Create your first project to get started</p>
            </div>
        );
    }

    const getPhotoBlocks = (blocks?: ContentBlock[]) =>
        (blocks || []).filter((block) => block.type === "photo");

    return (
        <div className="space-y-4">
            <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/80">
                    <tr>
                        <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em]">
                            Order
                        </th>
                        <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em]">
                            Category
                        </th>
                        <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em]">
                            Title
                        </th>
                        <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em]">
                            Main Photos
                        </th>
                        <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em]">
                            Process Photos
                        </th>
                        <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em]">
                            Actions
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                    {projects.map((project, index) => {
                        const mainPhotoBlocks = getPhotoBlocks(project.mainContent);
                        const processPhotoBlocks = getPhotoBlocks(project.processContent);
                        const mainCount = mainPhotoBlocks.length || project.mainPhotos.length;
                        const processCount = processPhotoBlocks.length || project.processPhotos.length;
                        const mainThumbs = mainPhotoBlocks.length > 0 ? mainPhotoBlocks : project.mainPhotos;
                        const processThumbs = processPhotoBlocks.length > 0 ? processPhotoBlocks : project.processPhotos;
                        const canMoveUp =
                            index > 0 && projects[index - 1].category === project.category;
                        const canMoveDown =
                            index < projects.length - 1 &&
                            projects[index + 1].category === project.category;

                        return (
                        <tr key={project.id} className="hover:bg-gray-50/80">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-900">{index + 1}</span>
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => handleReorder(project.id, "up")}
                                            disabled={!canMoveUp}
                                            className="text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Move up"
                                        >
                                            ▲
                                        </button>
                                        <button
                                            onClick={() => handleReorder(project.id, "down")}
                                            disabled={!canMoveDown}
                                            className="text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Move down"
                                        >
                                            ▼
                                        </button>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-widest border ${
                                    project.category === 'personal'
                                        ? 'border-gray-300 text-gray-700'
                                        : 'border-gray-300 text-gray-700'
                                }`}>
                                    {project.category === 'personal' ? 'Personal' : 'Work'}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 max-w-xs truncate">
                                    {project.title}
                                </div>
                                {project.description && (
                                    <div className="text-xs text-gray-500 max-w-xs truncate">
                                        {project.description}
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900">
                      {mainCount}
                    </span>
                                    {mainCount > 0 && (
                                        <div className="flex -space-x-2">
                                            {mainThumbs.slice(0, 3).map((photo, idx) => (
                                                <img
                                                    key={idx}
                                                    src={photo.url}
                                                    alt=""
                                                    className="w-8 h-8 rounded-full border-2 border-white object-cover"
                                                />
                                            ))}
                                            {mainCount > 3 && (
                                                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                                                    +{mainCount - 3}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900">
                      {processCount}
                    </span>
                                    {processCount > 0 && (
                                        <div className="flex -space-x-2">
                                            {processThumbs.slice(0, 3).map((photo, idx) => (
                                                <img
                                                    key={idx}
                                                    src={photo.url}
                                                    alt=""
                                                    className="w-8 h-8 rounded-full border-2 border-white object-cover"
                                                />
                                            ))}
                                            {processCount > 3 && (
                                                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                                                    +{processCount - 3}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center gap-2">
                                    <a
                                        href={`/archive#${project.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-700 hover:text-black underline-offset-4 hover:underline"
                                    >
                                        View
                                    </a>
                                    <a
                                        href={`/admin/edit/${project.id}`}
                                        className="text-gray-700 hover:text-black underline-offset-4 hover:underline"
                                    >
                                        Edit
                                    </a>
                                    <button
                                        onClick={() => handleDelete(project.id, project.title)}
                                        disabled={deletingId === project.id}
                                        className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {deletingId === project.id ? "Deleting..." : "Delete"}
                                    </button>
                                </div>
                            </td>
                        </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {/* Summary */}
            <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-widest text-gray-500">
                    <strong>{projects.length}</strong> project{projects.length !== 1 ? 's' : ''} total •{' '}
                    <strong>{projects.reduce((sum, p) => sum + p.mainPhotos.length, 0)}</strong> main photos •{' '}
                    <strong>{projects.reduce((sum, p) => sum + p.processPhotos.length, 0)}</strong> process photos
                </p>
            </div>
        </div>
    );
};

export default ProjectManager;
