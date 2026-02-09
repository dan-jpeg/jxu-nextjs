// components/FixedNavbar.tsx

"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Project } from "@/lib/types";

interface FixedNavbarProps {
    projects?: Project[];
    currentProjectId?: string; // NEW: for project detail pages
    onArchiveClick?: () => void;
}

const FixedNavbar: React.FC<FixedNavbarProps> = ({ projects, currentProjectId, onArchiveClick }) => {
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const pathname = usePathname();
    const router = useRouter();
    const isArchivePage = pathname === '/archive';
    const isProjectDetailPage = pathname?.startsWith('/archive/') && pathname !== '/archive';

    // If projects are provided
    if (projects && projects.length > 0) {
        // For project detail pages - navigate to /archive/[id]
        const navigateToProject = (projectId: string) => {
            router.push(`/archive/${projectId}`);
        };

        // For archive page - scroll to project
        const scrollToProject = (projectId: string) => {
            const scrollContainer = document.getElementById('archive-scroll-container');
            const element = document.getElementById(`project-${projectId}`);

            if (element && scrollContainer) {
                const elementTop = element.offsetTop;
                scrollContainer.scrollTo({
                    top: elementTop,
                    behavior: 'smooth'
                });
            }
        };

        const handleProjectClick = (projectId: string) => {
            router.push(`/archive/${projectId}`);
        };

        // Detect which project is currently in view (only on archive page)
        useEffect(() => {
            if (isProjectDetailPage && currentProjectId) {
                setActiveProjectId(currentProjectId);
                return;
            }

            if (!isArchivePage) return;

            const scrollContainer = document.getElementById('archive-scroll-container');
            if (!scrollContainer) return;

            const handleScroll = () => {
                const sections = projects.map(p => ({
                    id: p.id,
                    element: document.getElementById(`project-${p.id}`)
                }));

                const containerRect = scrollContainer.getBoundingClientRect();
                const viewportCenter = containerRect.top + (containerRect.height / 2);

                let closestDistance = Infinity;
                let currentId = null;

                sections.forEach(({ id, element }) => {
                    if (element) {
                        const rect = element.getBoundingClientRect();
                        const elementCenter = rect.top + (rect.height / 2);
                        const distance = Math.abs(elementCenter - viewportCenter);

                        if (distance < closestDistance) {
                            closestDistance = distance;
                            currentId = id;
                        }
                    }
                });

                if (currentId) {
                    setActiveProjectId(currentId);
                }
            };

            handleScroll();
            scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
            return () => scrollContainer.removeEventListener('scroll', handleScroll);
        }, [projects, isArchivePage, isProjectDetailPage, currentProjectId]);

        // Group projects by category
        const personalProjects = projects.filter(p => p.category === 'personal');
        const workProjects = projects.filter(p => p.category === 'work');

        return (
            <div className="fixed top-0 left-0 z-50 font-normal font-georgia pt-2 text-md lowercase max-w-s">
                {/* Large screens */}
                <div className="hidden lg:block">
                    {/* Index title */}
                    <button
                        type="button"
                        onClick={() => {
                            if (isArchivePage) {
                                const scrollContainer = document.getElementById('archive-scroll-container');
                                if (scrollContainer) {
                                    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
                                } else {
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                            } else {
                                router.push('/archive');
                            }
                        }}
                        className="text-xs pl-4 hover:underline hover:underline-offset-4 group"
                    >
                        <span className="inline-flex items-center gap-2">
                            {isArchivePage ? (
                                <>
                                    <span className="opacity-0 group-hover:opacity-100">↑</span>
                                    <span>(index)</span>
                                </>
                            ) : (
                                <>
                                    <span className="opacity-0 group-hover:opacity-100">←</span>
                                    <span>(index)</span>
                                </>
                            )}
                        </span>
                    </button>

                    {/* Personal Projects */}
                    {personalProjects.length > 0 && (
                        <div className="space-y-0 pl-4 mt-4">
                            {personalProjects.map((project, index) => {
                                const isActive = activeProjectId === project.id;
                                return (
                                    <button
                                        key={project.id}
                                        onClick={() => handleProjectClick(project.id)}
                                        className={`block text-left italic transition-all hover:underline hover:underline-offset-4 group ${
                                            isActive ? 'opacity-90 underline underline-offset-4' : 'opacity-30 hover:opacity-90'
                                        }`}
                                    >
                                        <span className="text-xs font-georgia inline-block w-24">
                                            personal ({String(index + 1).padStart(2, '0')})
                                        </span>
                                        <span className="text-xs lowercase font-georgia">
                                            {project.title}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Work Experience */}
                    {workProjects.length > 0 && (
                        <div className="space-y-0 pl-4">
                            {workProjects.map((project, index) => {
                                const isActive = activeProjectId === project.id;
                                return (
                                    <button
                                        key={project.id}
                                        onClick={() => handleProjectClick(project.id)}
                                        className={`block text-left italic transition-all hover:underline hover:underline-offset-4 group ${
                                            isActive ? 'opacity-90 underline underline-offset-4' : 'opacity-30 hover:opacity-90'
                                        }`}
                                    >
                                        <span className="text-xs font-georgia inline-block w-24">
                                            work ({String(personalProjects.length + index + 1).padStart(2, '0')})
                                        </span>
                                        <span className="text-xs lowercase font-georgia">
                                            {project.title}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Small/medium screens */}
                <div className="lg:hidden pl-4 opacity-80">
                    <button
                        type="button"
                        onClick={() => {
                            if (isArchivePage) {
                                const scrollContainer = document.getElementById('archive-scroll-container');
                                if (scrollContainer) {
                                    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
                                } else {
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                            } else {
                                router.push('/archive');
                            }
                        }}
                        className="text-xs mb-2 hover:underline hover:underline-offset-4 group text-left"
                    >
                        <span className="inline-flex items-center gap-2">
                            {isArchivePage ? (
                                <>
                                    <span className="opacity-0 group-hover:opacity-100">↑</span>
                                    <span>(index)</span>
                                </>
                            ) : (
                                <>
                                    <span className="opacity-0 group-hover:opacity-100">←</span>
                                    <span>(index)</span>
                                </>
                            )}
                        </span>
                    </button>

                    <div className="text-xs mb-2">personal projects</div>
                    {personalProjects.map((project, index) => (
                        <button
                            key={project.id}
                            onClick={() => handleProjectClick(project.id)}
                            className="block text-left italic transition-all hover:underline hover:underline-offset-4 group"
                        >
                            <span className="text-xs font-georgia inline-block w-8">
                                ({String(index + 1).padStart(2, '0')})
                            </span>
                            <span className="text-xs lowercase font-georgia">
                                {project.title}
                            </span>
                        </button>
                    ))}

                    <div className="text-xs mt-3 mb-2">work experience</div>
                    {workProjects.map((project, index) => (
                        <button
                            key={project.id}
                            onClick={() => handleProjectClick(project.id)}
                            className="block text-left italic transition-all hover:underline hover:underline-offset-4 group"
                        >
                            <span className="text-xs font-georgia inline-block w-8">
                                ({String(index + 1).padStart(2, '0')})
                            </span>
                            <span className="text-xs lowercase font-georgia">
                                {project.title}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // Otherwise, use simple archive button (old interface)
    return (
        <div className="fixed top-1/2 left-0 font-[400] w-full transform -translate-y-1/2 z-50 px-[16px]">
            <div className="relative w-full flex justify-center items-center text-xs lowercase">
                <a href="/" className="absolute hover:opacity-20 text-black tracking-wider cursor-w-resize left-2">
                    jing yi xu
                </a>

                <button
                    onClick={onArchiveClick}
                    className="hover:italic lowercase hover:opacity-0 cursor-n-resize text-black opacity-80"
                >
                    ARCHIVE
                </button>

                <div className="absolute right-2 flex opacity-0 gap-4">
                    <p> </p>
                </div>
            </div>
        </div>
    );
};

export default FixedNavbar;
