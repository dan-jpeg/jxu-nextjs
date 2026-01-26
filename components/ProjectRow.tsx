// components/ProjectRow.tsx

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Project } from "@/lib/types";

interface ProjectRowProps {
    project: Project;
    isExpanded?: boolean;
    onToggleExpand?: (projectId: string) => void;
    isDimmed?: boolean;
}

const ProjectRow: React.FC<ProjectRowProps> = ({
    project,
    isExpanded = false,
    onToggleExpand,
    isDimmed = false
}) => {
    const [isHovered, setIsHovered] = useState(false);

    const hasProcessPhotos = project.processPhotos && project.processPhotos.length > 0;

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (hasProcessPhotos && onToggleExpand) {
            onToggleExpand(project.id);
        } else {
            // Scroll to center the row in the viewport
            const element = e.currentTarget;
            const rect = element.getBoundingClientRect();
            const elementCenter = rect.top + rect.height / 2;
            const viewportCenter = window.innerHeight / 2;
            const scrollOffset = elementCenter - viewportCenter;

            window.scrollBy({
                top: scrollOffset,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="w-full">
            {/* Container - ENTIRE ROW CLICKABLE */}
            <motion.div
                className="relative px-12 py-8 cursor-pointer"
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                animate={{ opacity: isDimmed ? 0.1 : 1 }}
                transition={{ duration: 0.3 }}
            >
                {/* Title - Fixed Top Right (rotated when expanded) */}
                <motion.div
                    className="absolute top-8 right-12 origin-top-right pointer-events-none"
                    animate={{
                        rotate: isExpanded ? -90 : 0,
                        x: isExpanded ? -8 : 0,
                        y: isExpanded ? 8 : 0,
                    }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                    <div
                        className={`text-md font-helvetica font-medium uppercase tracking-wide inline-block transition-all ${
                            isHovered ? 'bg-yellow-200' : 'bg-transparent'
                        }`}
                    >
                        {project.title}
                    </div>
                </motion.div>

                {/* Main Photos - Scrollable Row */}
                <div className="w-full overflow-x-auto overflow-y-hidden scrollbar-hide">
                    <div className="inline-flex items-center gap-2">
                        {project.mainPhotos
                            .sort((a, b) => a.order - b.order)
                            .map((photo, idx) => (
                                <div key={idx} className="flex-shrink-0">
                                    <img
                                        src={photo.url}
                                        alt={`${project.title} - ${idx + 1}`}
                                        className="h-[60vh] w-auto object-cover"
                                    />
                                </div>
                            ))}
                    </div>
                </div>
            </motion.div>

            {/* Process Photos - Expandable */}
            <AnimatePresence>
                {isExpanded && hasProcessPhotos && (
                    <motion.div
                        key="process-photos"
                        data-process-photos
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div
                            className="w-full overflow-x-auto overflow-y-hidden scrollbar-hide"
                            style={{
                                cursor: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewport=\'0 0 24 24\'><text y=\'18\' font-size=\'18\'>←</text></svg>") 12 12, w-resize'
                            }}
                            onMouseMove={(e) => {
                                const container = e.currentTarget;
                                const rect = container.getBoundingClientRect();
                                const clickX = e.clientX - rect.left;
                                const clickPosition = clickX / container.clientWidth;

                                // Change cursor based on position
                                if (clickPosition < 0.5) {
                                    container.style.cursor = 'w-resize'; // West (left arrow)
                                } else {
                                    container.style.cursor = 'e-resize'; // East (right arrow)
                                }
                            }}
                            onClick={(e) => {
                                const container = e.currentTarget;
                                const containerWidth = container.clientWidth;
                                const scrollAmount = containerWidth * 0.2;

                                // Get click position relative to container
                                const rect = container.getBoundingClientRect();
                                const clickX = e.clientX - rect.left;
                                const clickPosition = clickX / containerWidth;

                                // Left half scrolls left, right half scrolls right
                                const direction = clickPosition < 0.5 ? -1 : 1;

                                container.scrollBy({
                                    left: scrollAmount * direction,
                                    behavior: 'smooth'
                                });
                            }}
                        >
                            <div className="inline-flex items-center gap-2 px-12 py-8">
                                {project.processPhotos
                                    .sort((a, b) => a.order - b.order)
                                    .map((photo, idx) => (
                                        <div key={idx} className="flex-shrink-0 flex items-center gap-4">
                                            {/* Letter label */}
                                            {/*<div className="text-xl font-helvetica text-gray-400">*/}
                                            {/*    {String.fromCharCode(97 + idx)}*/}
                                            {/*</div>*/}

                                            <img
                                                src={photo.url}
                                                alt={`${project.title} - process ${idx + 1}`}
                                                className="h-[70vh] w-auto object-cover"
                                            />
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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