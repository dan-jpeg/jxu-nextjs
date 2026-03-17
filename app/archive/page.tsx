"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProjectRow from "@/components/ProjectRow";
import type { Project } from "@/lib/types";
import FixedNavbar from "@/components/FixedNavbar";
import FixedTitleBar from "@/components/FixedTitleBar";

const ArchivePage = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

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

    const orderedProjects = [...projects].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    useEffect(() => {
        if (loading) return;
        if (orderedProjects.length === 0) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
            const scrollContainer = document.getElementById("archive-scroll-container");
            if (!scrollContainer) return;

            event.preventDefault();

            const sections = orderedProjects.map((project) =>
                document.getElementById(`project-${project.id}`)
            );

            const containerRect = scrollContainer.getBoundingClientRect();
            const viewportCenter = containerRect.top + containerRect.height / 2;

            let activeIndex = 0;
            let closestDistance = Infinity;

            sections.forEach((section, index) => {
                if (!section) return;
                const rect = section.getBoundingClientRect();
                const sectionCenter = rect.top + rect.height / 2;
                const distance = Math.abs(sectionCenter - viewportCenter);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    activeIndex = index;
                }
            });

            const direction = event.key === "ArrowDown" ? 1 : -1;
            const targetIndex = Math.min(
                Math.max(activeIndex + direction, 0),
                sections.length - 1
            );
            const target = sections[targetIndex];
            if (!target) return;

            scrollContainer.scrollTo({
                top: target.offsetTop,
                behavior: "smooth",
            });
        };

        window.addEventListener("keydown", handleKeyDown, { passive: false });
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [loading, orderedProjects]);

    const handleProjectClick = (projectId: string) => {
        router.push(`/archive/${projectId}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <div className="text-xs lowercase text-gray-400 font-helvetica">loading...</div>
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <div className="text-xs lowercase text-gray-400 font-helvetica">no projects yet</div>
            </div>
        );
    }

    return (
        <div className="relative w-full bg-white">
            <FixedTitleBar />
            <FixedNavbar projects={orderedProjects}/>

            {/* Scroll container with snap */}
            <div
                id="archive-scroll-container"
                className="h-screen overflow-y-scroll snap-y snap-mandatory"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                }}
            >
                <style jsx>{`
                    div::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>

                {/* Each project takes full viewport height */}
                {orderedProjects.map((project, index) => (
                    <section
                        key={project.id}
                        id={`project-${project.id}`}
                        className="h-screen w-full snap-start snap-always flex items-center justify-center"
                    >
                        <ProjectRow
                            project={project}
                            onPhotoClick={handleProjectClick}
                            projectNumber={index + 1}
                            totalProjects={orderedProjects.length}
                        />
                    </section>
                ))}
            </div>
        </div>
    );
};

export default ArchivePage;
