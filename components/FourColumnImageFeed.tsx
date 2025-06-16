// components/FourColumnImageFeed.tsx

"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import SmallClickableImage from "./SmallClickableImage";
import FixedNavbar from "@/components/FixedNavbar";
import { archiveImages } from "@/data/images";

interface FourColumnImageFeedProps {
    maxExpandedWidth?: string;  // e.g., "80vw", "1200px", "100%"
    maxExpandedHeight?: string; // e.g., "90vh", "900px", "100%"
}

const FourColumnImageFeed: React.FC<FourColumnImageFeedProps> = ({
                                                                     maxExpandedWidth = "90vw",
                                                                     maxExpandedHeight = "100vh"
                                                                 }) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Distribute images into 4 columns
    const distributeImages = () => {
        const columns: string[][] = [[], [], [], []];
        archiveImages.forEach((src, index) => {
            columns[index % 4].push(src);
        });
        return columns;
    };

    const handleArchiveClick = () => {
        setSelectedId(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleImageClick = (src: string) => {
        if (selectedId === null) {
            setSelectedId(src);
        } else {
            setSelectedId(null);
        }
    };

    const columns = distributeImages();

    return (
        <div className="relative min-h-screen bg-white">
          <FixedNavbar onArchiveClick={handleArchiveClick} />

            {/* 4-column grid */}
            <div className="grid grid-cols-4 gap-12 px-12 pt-20 pb-10 max-w-xl mx-auto">
                {columns.map((column, columnIndex) => (
                    <div key={columnIndex} className="flex flex-col gap-40">
                        {column.map((src) => (
                            <SmallClickableImage
                                key={src}
                                src={src}
                                isSelected={selectedId === src}
                                isOtherSelected={selectedId !== null && selectedId !== src}
                                maxWidth={maxExpandedWidth}
                                maxHeight={maxExpandedHeight}
                                onClick={() => handleImageClick(src)}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {/* Transparent overlay for closing expanded image */}
            <AnimatePresence>
                {selectedId && (
                    <div
                        className="fixed inset-0 z-40 bg-transparent cursor-pointer"
                        onClick={() => setSelectedId(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default FourColumnImageFeed;