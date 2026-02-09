// app/mag/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import type { Project } from "@/lib/types";

const MagPage = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentLeftProject, setCurrentLeftProject] = useState<string>("");
    const [currentRightProject, setCurrentRightProject] = useState<string>("");

    const leftScrollRef = useRef<HTMLDivElement>(null);
    const rightScrollRef = useRef<HTMLDivElement>(null);

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

    // Group projects by category
    const personalProjects = projects
        .filter(p => p.category === 'personal')
        .sort((a, b) => a.order - b.order);

    const workProjects = projects
        .filter(p => p.category === 'work')
        .sort((a, b) => a.order - b.order);

    // Track which project is visible in each column
    useEffect(() => {
        const handleLeftScroll = () => {
            if (!leftScrollRef.current) return;

            const scrollTop = leftScrollRef.current.scrollTop;
            const viewportHeight = leftScrollRef.current.clientHeight;
            const elements = leftScrollRef.current.querySelectorAll('[data-project-id]');

            let currentProject = "";
            elements.forEach((el) => {
                const rect = el.getBoundingClientRect();
                const parentRect = leftScrollRef.current!.getBoundingClientRect();
                const relativeTop = rect.top - parentRect.top;

                if (relativeTop >= 0 && relativeTop < viewportHeight / 2) {
                    currentProject = el.getAttribute('data-project-id') || "";
                }
            });

            if (currentProject) {
                const project = personalProjects.find(p => p.id === currentProject);
                if (project) setCurrentLeftProject(project.title);
            }
        };

        const handleRightScroll = () => {
            if (!rightScrollRef.current) return;

            const scrollTop = rightScrollRef.current.scrollTop;
            const viewportHeight = rightScrollRef.current.clientHeight;
            const elements = rightScrollRef.current.querySelectorAll('[data-project-id]');

            let currentProject = "";
            elements.forEach((el) => {
                const rect = el.getBoundingClientRect();
                const parentRect = rightScrollRef.current!.getBoundingClientRect();
                const relativeTop = rect.top - parentRect.top;

                if (relativeTop >= 0 && relativeTop < viewportHeight / 2) {
                    currentProject = el.getAttribute('data-project-id') || "";
                }
            });

            if (currentProject) {
                const project = workProjects.find(p => p.id === currentProject);
                if (project) setCurrentRightProject(project.title);
            }
        };

        const leftScroll = leftScrollRef.current;
        const rightScroll = rightScrollRef.current;

        if (leftScroll) {
            leftScroll.addEventListener('scroll', handleLeftScroll, { passive: true });
            handleLeftScroll(); // Initial check
        }
        if (rightScroll) {
            rightScroll.addEventListener('scroll', handleRightScroll, { passive: true });
            handleRightScroll(); // Initial check
        }

        return () => {
            if (leftScroll) leftScroll.removeEventListener('scroll', handleLeftScroll);
            if (rightScroll) rightScroll.removeEventListener('scroll', handleRightScroll);
        };
    }, [personalProjects, workProjects]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <div className="text-xs lowercase text-gray-400 font-georgia italic">loading...</div>
            </div>
        );
    }

    // Calculate column width: (100vw - 160px) / 2
    const columnWidthStyle = "calc((100vw - 160px) / 2)";

    return (
        <div className="relative w-screen h-screen bg-white overflow-hidden flex">
            {/* Left Column - Personal Projects */}
            <div
                ref={leftScrollRef}
                className="h-screen overflow-y-scroll bg-white"
                style={{
                    width: columnWidthStyle,
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                }}
            >
                <style jsx>{`
                    div::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>

                {/* Personal project images */}
                <div className="p-8 space-y-0">
                    {personalProjects.map((project) => (
                        <div key={project.id} data-project-id={project.id} className="space-y-2">
                            {project.mainPhotos
                                .sort((a, b) => a.order - b.order)
                                .map((photo, idx) => (
                                    <div key={idx} className="space-y-0">
                                        <img
                                            src={photo.url}
                                            alt={`${project.title} - ${idx + 1}`}
                                            className="w-full h-auto"
                                        />

                                    </div>
                                ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Column - Work Experience */}
            <div
                ref={rightScrollRef}
                className="h-screen border-l-2  overflow-y-scroll bg-white"
                style={{
                    width: columnWidthStyle,
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                }}
            >
                <style jsx>{`
                    div::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>

                {/* Work project images */}
                <div className="space-y-0">
                    {workProjects.map((project) => (
                        <div key={project.id} data-project-id={project.id} className="space-y-0">
                            {project.mainPhotos
                                .sort((a, b) => a.order - b.order)
                                .map((photo, idx) => (
                                    <div key={idx} className="space-y-0">
                                        <img
                                            src={photo.url}
                                            alt={`${project.title} - ${idx + 1}`}
                                            className="w-full h-auto"
                                        />

                                    </div>
                                ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Right sidebar with project info */}
            <div className="w-60 h-screen bg-white  border-gray-300 p-4 overflow-y-auto">
                {/* Currently visible projects */}
                <div className="text-xs font-extralight text-left transform -translate-x-4  space-y-4 mb-8">
                    {currentLeftProject && (
                        <div>
                            <p className="font-normal whitespace-nowrap lowercase">{currentLeftProject}</p>
                            {/*<p className="text-[10px] opacity-60">personal project</p>*/}
                        </div>
                    )}
                    {currentRightProject && (
                        <div>
                            <p className="font-normal whitespace-nowrap lowercase">{currentRightProject}</p>
                            {/*<p className="text-[10px] opacity-60">work experience</p>*/}
                        </div>
                    )}
                </div>~

                {/* Project index */}

                {/* 160px right indicator */}

            </div>
        </div>
    );
};

export default MagPage;