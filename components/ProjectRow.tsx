// components/ProjectRow.tsx

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Project } from "@/lib/types";

interface ProjectRowProps {
    project: Project;
}

const ProjectRow: React.FC<ProjectRowProps> = ({ project }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const hasProcessPhotos = project.processPhotos && project.processPhotos.length > 0;

    return (
        <div className="w-full">
            {/* Container - ENTIRE ROW CLICKABLE */}
            <div
                className={`relative px-12 py-8 ${hasProcessPhotos ? 'cursor-pointer' : 'cursor-default'}`}
                onClick={() => hasProcessPhotos && setIsExpanded(!isExpanded)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
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
                        className={`text-xl font-helvetica font-medium uppercase tracking-wide inline-block transition-all ${
                            isHovered ? 'bg-yellow-300' : 'bg-transparent'
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
                                        className="h-[66vh] w-auto object-cover"
                                    />
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            {/* Process Photos - Expandable */}
            <AnimatePresence>
                {isExpanded && hasProcessPhotos && (
                    <motion.div
                        key="process-photos"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="w-full overflow-x-auto overflow-y-hidden scrollbar-hide bg-gray-50">
                            <div className="inline-flex items-center gap-8 px-12 py-8">
                                {project.processPhotos
                                    .sort((a, b) => a.order - b.order)
                                    .map((photo, idx) => (
                                        <div key={idx} className="flex-shrink-0 flex items-center gap-4">
                                            {/* Letter label */}
                                            <div className="text-xl font-helvetica text-gray-400">
                                                {String.fromCharCode(97 + idx)}
                                            </div>

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