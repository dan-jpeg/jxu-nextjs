// app/archive/[id]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/types";
import FixedNavbar from "@/components/FixedNavbar";
import ContentBlockRenderer from "@/components/ContentBlockRenderer";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: PageProps) {
    const [project, setProject] = useState<Project | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [projectId, setProjectId] = useState<string>("");
    const router = useRouter();

    useEffect(() => {
        const loadData = async () => {
            const resolvedParams = await params;
            setProjectId(resolvedParams.id);

            try {
                // Fetch current project
                const projectResponse = await fetch(`/api/projects/${resolvedParams.id}`);
                if (!projectResponse.ok) {
                    throw new Error('Project not found');
                }
                const projectData = await projectResponse.json();

                setProject(projectData.project);

                // Fetch all projects for navbar
                const allProjectsResponse = await fetch('/api/projects');
                const allProjectsData = await allProjectsResponse.json();
                setProjects(allProjectsData.projects || []);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [params]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <div className="text-xs lowercase text-gray-400 italic">loading...</div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <div className="text-xs lowercase text-gray-400">project not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Fixed Navbar */}
            <FixedNavbar projects={projects} currentProjectId={projectId} />

            {/* Main Content - Right side column */}
            <div className="ml-auto w-full lg:w-[55vw] min-h-screen pt-[300px] pb-8 px-6 md:px-8 lg:py-8 lg:px-12">
                {/* Project Title */}
                <div className="mb-20">


                    {/* Description */}
                    {project.description && (
                        <p className="text-xs italic w-2/3 lowercase mb-4">
                            {project.description}
                        </p>
                    )}
                </div>

                {/* Process Photos only */}
                {project.processContent && project.processContent.length > 0 ? (
                    <div className="space-y-8 pt-8">
                        <ContentBlockRenderer
                            blocks={project.processContent.filter(
                                (block) => block.type === "photo"
                            )}
                        />
                    </div>
                ) : project.processPhotos && project.processPhotos.length > 0 ? (
                    <div className="space-y-8 pt-8">
                        {project.processPhotos
                            .sort((a, b) => a.order - b.order)
                            .map((photo, idx) => (
                                <div key={idx} className="space-y-1">
                                    <img
                                        src={photo.url}
                                        alt={`${project.title} process - ${idx + 1}`}
                                        className="w-full h-auto"
                                    />
                                </div>
                            ))}
                    </div>
                ) : (
                    <div className="text-xs text-gray-400 italic">no process photos</div>
                )}
            </div>
        </div>
    );
}
