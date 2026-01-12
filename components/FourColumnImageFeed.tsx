"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import FixedNavbar from "@/components/FixedNavbar";

interface SubImage {
    url: string;
    order: number;
}

interface ImageData {
    id: string;
    url: string;
    order: number;
    subImages?: SubImage[];
}

const FourColumnImageFeed: React.FC = () => {
    const [images, setImages] = useState<ImageData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
    const [savedScrollPosition, setSavedScrollPosition] = useState<number>(0);
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const hasSubImages = selectedImage?.subImages && selectedImage.subImages.length > 0;

    // ADJUSTABLE: Where alphabet labels appear for progress pictures
    const alphabetLabelLocation = 'top' as 'top' | 'left';

    const fetchImages = async () => {
        try {
            const response = await fetch('/api/images');
            const data = await response.json();
            setImages(data.images || []);
        } catch (error) {
            console.error('Error fetching images:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const distributeImages = () => {
        const columns: ImageData[][] = [[], [], [], []];
        images.forEach((img, index) => {
            columns[index % 4].push(img);
        });
        return columns;
    };

    const handleArchiveClick = () => {
        setSelectedId(null);
        setSelectedImage(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleImageClick = (image: ImageData) => {
        if (selectedId === image.id) {
            setSelectedId(null);
            setSelectedImage(null);
            setTimeout(() => {
                window.scrollTo({ top: savedScrollPosition, behavior: 'instant' });
            }, 0);
        } else {
            setSavedScrollPosition(window.scrollY);
            setSelectedId(image.id);
            setSelectedImage(image);
        }
    };

    const columns = distributeImages();

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-white flex items-center justify-center">
                <div className="text-xs lowercase text-gray-400">loading...</div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-white">
            <FixedNavbar onArchiveClick={handleArchiveClick} />

            {/* 4-column grid - Always rendered, hidden when selected */}
            <div className={`grid grid-cols-4 gap-12 px-12 pt-20 pb-10 max-w-[1200px] mx-auto ${selectedId ? 'invisible' : 'visible'}`}>
                {columns.map((column, columnIndex) => (
                    <div key={columnIndex} className="flex flex-col gap-40">
                        {column.map((image) => (
                            <motion.img
                                key={image.id}
                                src={image.url}
                                alt=""
                                layoutId={image.id}
                                onClick={() => handleImageClick(image)}
                                className="w-full h-auto object-cover cursor-zoom-in"
                                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {/* Fixed overlay with horizontal scroll */}
            {selectedId && (
                <div className="fixed inset-0 z-50 bg-white">
                    {/* Horizontal scroll container */}
                    <div
                        ref={scrollContainerRef}
                        className="h-screen overflow-x-auto overflow-y-hidden snap-x snap-mandatory"
                        style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            WebkitOverflowScrolling: 'touch'
                        }}
                    >
                        <style jsx>{`
                            div::-webkit-scrollbar {
                                display: none;
                            }
                        `}</style>

                        {/* Filmstrip container */}
                        <div className="h-full inline-flex items-center gap-8 md:gap-12">
                            {/* Left spacer to center main image */}
                            <div className="flex-shrink-0 w-[calc(50vw-35vw)] md:w-[calc(50vw-25vw)]" />

                            {/* Main Image */}
                            <div className="snap-center flex-shrink-0">
                                <motion.img
                                    src={selectedImage?.url}
                                    alt=""
                                    layoutId={selectedId}
                                    className="object-contain cursor-zoom-out w-[70vw] md:w-[50vw]"
                                    style={{ maxHeight: '75vh' }}
                                    onClick={() => {
                                        setSelectedId(null);
                                        setSelectedImage(null);
                                        setTimeout(() => {
                                            window.scrollTo({ top: savedScrollPosition, behavior: 'instant' });
                                        }, 0);
                                    }}
                                    transition={{ type: "spring", bounce: 0, duration: 0.6 }}
                                />
                            </div>

                            {/* Sub-Images */}
                            {hasSubImages && selectedImage.subImages && (
                                <>
                                    {selectedImage.subImages
                                        .sort((a, b) => a.order - b.order)
                                        .map((subImage, idx) => (
                                            <div
                                                key={idx}
                                                className="snap-center flex-shrink-0 flex items-center gap-4"
                                            >
                                                {/* Letter label beside image */}
                                                {alphabetLabelLocation === 'left' && (
                                                    <div className="text-xs lowercase text-gray-400 text-center flex-shrink-0">
                                                        {String.fromCharCode(97 + idx)}
                                                    </div>
                                                )}

                                                <div className="cursor-pointer">
                                                    {/* Letter label above image */}
                                                    {alphabetLabelLocation === 'top' && (
                                                        <div className="text-xs lowercase text-gray-400 mb-2 text-center">
                                                            {String.fromCharCode(97 + idx)}
                                                        </div>
                                                    )}

                                                    <img
                                                        src={subImage.url}
                                                        alt={`progress-${idx}`}
                                                        className="w-[70vw] md:w-[50vw] lg:w-[45vw] h-[75vh] object-cover"
                                                        onClick={() => setFullscreenImage(subImage.url)}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                </>
                            )}

                            {/* Right spacer */}
                            <div className="flex-shrink-0 w-[50vw]" />
                        </div>
                    </div>

                    {/* Fullscreen overlay */}
                    {fullscreenImage && (
                        <div
                            className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center cursor-zoom-out"
                            onClick={() => setFullscreenImage(null)}
                        >
                            <img
                                src={fullscreenImage}
                                alt=""
                                className="max-w-[95vw] max-h-[95vh] object-contain"
                            />
                        </div>
                    )}

                    {/* Scroll hint */}
                    {hasSubImages && (
                        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 text-xs lowercase text-gray-400 pointer-events-none">
                            scroll right →
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FourColumnImageFeed;