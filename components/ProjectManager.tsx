// components/ProjectManager.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/types";

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
    const router = useRouter();
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

        // Swap orders
        const project1 = projects[currentIndex];
        const project2 = projects[newIndex];

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
            <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 mb-4">No projects yet</p>
                <p className="text-sm text-gray-400">Create your first project to get started</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Main Photos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Process Photos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {projects.map((project, index) => (
                        <tr key={project.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-900">{index + 1}</span>
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => handleReorder(project.id, "up")}
                                            disabled={index === 0}
                                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Move up"
                                        >
                                            ▲
                                        </button>
                                        <button
                                            onClick={() => handleReorder(project.id, "down")}
                                            disabled={index === projects.length - 1}
                                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Move down"
                                        >
                                            ▼
                                        </button>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      project.category === 'personal'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
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
                      {project.mainPhotos.length}
                    </span>
                                    {project.mainPhotos.length > 0 && (
                                        <div className="flex -space-x-2">
                                            {project.mainPhotos.slice(0, 3).map((photo, idx) => (
                                                <img
                                                    key={idx}
                                                    src={photo.url}
                                                    alt=""
                                                    className="w-8 h-8 rounded-full border-2 border-white object-cover"
                                                />
                                            ))}
                                            {project.mainPhotos.length > 3 && (
                                                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                                                    +{project.mainPhotos.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900">
                      {project.processPhotos.length}
                    </span>
                                    {project.processPhotos.length > 0 && (
                                        <div className="flex -space-x-2">
                                            {project.processPhotos.slice(0, 3).map((photo, idx) => (
                                                <img
                                                    key={idx}
                                                    src={photo.url}
                                                    alt=""
                                                    className="w-8 h-8 rounded-full border-2 border-white object-cover"
                                                />
                                            ))}
                                            {project.processPhotos.length > 3 && (
                                                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                                                    +{project.processPhotos.length - 3}
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
                                        className="text-blue-600 hover:text-blue-900"
                                    >
                                        View
                                    </a>
                                    <button
                                        onClick={() => router.push(`/admin/edit/${project.id}`)}
                                        className="text-green-600 hover:text-green-900"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(project.id, project.title)}
                                        disabled={deletingId === project.id}
                                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {deletingId === project.id ? "Deleting..." : "Delete"}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    <strong>{projects.length}</strong> project{projects.length !== 1 ? 's' : ''} total •{' '}
                    <strong>{projects.reduce((sum, p) => sum + p.mainPhotos.length, 0)}</strong> main photos •{' '}
                    <strong>{projects.reduce((sum, p) => sum + p.processPhotos.length, 0)}</strong> process photos
                </p>
            </div>
        </div>
    );
};

export default ProjectManager;