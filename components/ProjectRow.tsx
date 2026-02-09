// components/ProjectRow.tsx

"use client";

import ImageCycler from "@/components/ImageCycler";
import type { ContentBlock, Project } from "@/lib/types";

interface ProjectRowProps {
    project: Project;
    onPhotoClick: (projectId: string) => void;
    projectNumber?: number;
    totalProjects?: number;
}

const ProjectRow: React.FC<ProjectRowProps> = ({
                                                   project,
                                                   onPhotoClick,
                                                   projectNumber,
                                                   totalProjects
                                               }) => {
    const getMainPhotoBlocks = (blocks?: ContentBlock[]) =>
        (blocks || []).filter((block) => block.type === "photo");

    const mainPhotoBlocks = getMainPhotoBlocks(project.mainContent);
    const mainPhotos =
        mainPhotoBlocks.length > 0
            ? mainPhotoBlocks
            : project.mainPhotos;

    const mainImageUrls = mainPhotos
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((photo) => photo.url);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center z-10 px-12">
            {/* Single Figure label - centered above entire row */}
            {projectNumber && (
                <div className="text-center mb-6">
                    <p className="text-xs lowercase font-helvetica">
                        {project.category === 'work' ? 'work' : 'project'} ({String(projectNumber).padStart(2, '0')})
                    </p>
                </div>
            )}

            {/* Main Photos - Horizontal scroll, centered */}
            {project.useCycler && mainImageUrls.length > 0 ? (
                <div className="w-full flex justify-center">
                    <div
                        className="relative h-[55vh] w-full max-w-[55vh] cursor-pointer"
                        onClick={() => onPhotoClick(project.id)}
                    >
                        <ImageCycler
                            images={mainImageUrls}
                            interval={project.useCyclerInterval}
                        />
                    </div>
                </div>
            ) : (
                <div className="w-full overflow-x-auto overflow-y-hidden scrollbar-hide flex justify-center">
                    <div className="inline-flex items-start gap-1">
                        {mainPhotos
                            .slice()
                            .sort((a, b) => a.order - b.order)
                            .map((photo, idx) => (
                                <div
                                    key={idx}
                                    className="flex-shrink-0 cursor-pointer group flex flex-col gap-2"
                                    onClick={() => onPhotoClick(project.id)}
                                >
                                    {/* Caption Above */}
                                    {photo.caption && photo.caption.position === 'above' && (
                                        <div className="text-xs font-helvetica text-gray-600 max-w-[55vh] px-1 text-center">
                                            {photo.caption.text}
                                        </div>
                                    )}

                                    {/* Image */}
                                    <img
                                        src={photo.url}
                                        alt={`${project.title} - ${idx + 1}`}
                                        className="h-[55vh] w-auto object-cover cursor-zoom-in transition-opacity"
                                    />

                                    {/* Caption Below */}
                                    {photo.caption && photo.caption.position === 'below' && (
                                        <div className="text-xs font-helvetica text-gray-600 max-w-[55vh] px-1 text-center">
                                            {photo.caption.text}
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Hide scrollbar */}
            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};

export default ProjectRow;
