// components/FixedNavbar.tsx

"use client";

import type { Project } from "@/lib/types";

interface FixedNavbarProps {
    projects: Project[];
}

const FixedNavbar: React.FC<FixedNavbarProps> = ({ projects }) => {
    const scrollToProject = (projectId: string) => {
        const element = document.getElementById(`project-${projectId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Group projects by category
    const personalProjects = projects.filter(p => p.category === 'personal');
    const workProjects = projects.filter(p => p.category === 'work');

    return (
        <div className="fixed top-0 left-2 z-50  font-helvetica-cond font-medium p-4 text-xl   uppercase max-w-s">
            {/* Personal Projects */}
            {personalProjects.length > 0 && (
                <div className="mb-2">
                    <div className=" mb-[2px]">Personal Projects</div>
                    <div className="space-y-0 pl-8">
                        {personalProjects.map((project) => (
                            <button
                                key={project.id}
                                onClick={() => scrollToProject(project.id)}
                                className="block hover:opacity-60 text-left transition-opacity"
                            >
                                {project.title}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Work Experience */}
            {workProjects.length > 0 && (
                <div>
                    <div className=" mb-[2px]">Work Experience</div>
                    <div className="pl-8">
                        {workProjects.map((project) => (
                            <button
                                key={project.id}
                                onClick={() => scrollToProject(project.id)}
                                className="block hover:opacity-60 text-left transition-opacity"
                            >
                                {project.title}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FixedNavbar;