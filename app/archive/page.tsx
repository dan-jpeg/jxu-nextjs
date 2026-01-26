"use client";

import { useState, useEffect, useRef } from "react";
import FixedNavbar from "@/components/FixedNavbar";
import ProjectRow from "@/components/ProjectRow";
import type { Project } from "@/lib/types";

const ArchivePage = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
    const [dimmedProjectId, setDimmedProjectId] = useState<string | null>(null);
    const expandedRowRef = useRef<HTMLDivElement | null>(null);

    const fetchProjects = async () => {
        try {
            const response = await fetch('/api/projects');
            const data = await response.json();
            setProjects(data.projects || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (!dimmedProjectId) return;

        const handleScroll = () => {
            if (!expandedRowRef.current) return;

            const rect = expandedRowRef.current.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

            if (!isVisible) {
                setDimmedProjectId(null);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [dimmedProjectId]);

    const handleToggleExpand = (projectId: string) => {
        const newExpandedId = expandedProjectId === projectId ? null : projectId;
        setExpandedProjectId(newExpandedId);
        setDimmedProjectId(newExpandedId);

        // If expanding (not collapsing), scroll the row to top of viewport
        if (newExpandedId) {
            setTimeout(() => {
                const element = document.getElementById(`project-${projectId}`);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    const scrollOffset = rect.top + window.scrollY;

                    window.scrollTo({
                        top: scrollOffset,
                        behavior: 'smooth'
                    });
                }
            }, 50);
        }
    };

    // Group and sort projects
    const personalProjects = projects
        .filter(p => p.category === 'personal')
        .sort((a, b) => a.order - b.order);

    const workProjects = projects
        .filter(p => p.category === 'work')
        .sort((a, b) => a.order - b.order);

    const orderedProjects = [...personalProjects, ...workProjects];

    return (
        <div className="relative min-h-screen bg-white">
            {projects.length > 0 && <FixedNavbar projects={projects} />}

            <div className="">
                {loading ? (
                    <div className="flex items-center justify-center h-[50vh]">
                        <div className="text-xs lowercase text-gray-400">
                            loading...
                        </div>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="flex items-center justify-center h-[50vh]">
                        <div className="text-xs lowercase text-gray-400">
                            no projects yet
                        </div>
                    </div>
                ) : (
                    <div className="space-y-0">
                        {orderedProjects.map((project) => (
                            <div
                                key={project.id}
                                id={`project-${project.id}`}
                                ref={dimmedProjectId === project.id ? expandedRowRef : null}
                            >
                                <ProjectRow
                                    project={project}
                                    isExpanded={expandedProjectId === project.id}
                                    onToggleExpand={handleToggleExpand}
                                    isDimmed={dimmedProjectId !== null && dimmedProjectId !== project.id}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ArchivePage;