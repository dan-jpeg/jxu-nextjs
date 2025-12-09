"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
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
    const [animationComplete, setAnimationComplete] = useState(false);
    const [mainOpacity, setMainOpacity] = useState(1);
    const [mainZIndex, setMainZIndex] = useState(10);
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const scrollProgress = useMotionValue(0);

    // Calculate values before any conditional logic
    const hasSubImages = selectedImage?.subImages && selectedImage.subImages.length > 0;
    const numSubImages = selectedImage?.subImages?.length || 0;

    // ADJUSTABLE: When main image starts/finishes fading (0 = start, 1 = end of scroll)
    const fadeStartPoint = 0.9;  // Start fading at 10% scroll
    const fadeEndPoint = 0.15;   // Fully faded at 19% scroll (image moves away after this)

    // ADJUSTABLE: Where alphabet labels appear for progress pictures
    const alphabetLabelLocation = 'left' as 'top' | 'left';  // 'top' = above images, 'left' = beside images

    // Calculate total width needed to scroll through all images
    // Mobile: 80vw per image + 4vw gaps
    // Desktop: 35vw per image + 8vw gaps
    const imageWidthMobile = 80;
    const imageWidthDesktop = 35;
    const gapMobile = 4;
    const gapDesktop = 8;

    // Use mobile values for calculation (can add media query detection if needed)
    const totalWidthMobile = (numSubImages * imageWidthMobile) + ((numSubImages - 1) * gapMobile);
    const totalWidthDesktop = (numSubImages * imageWidthDesktop) + ((numSubImages - 1) * gapDesktop);

    // End position: scroll far enough left to see the last image
    // Start at 100vw (off-screen right), end at negative value (scrolled left)
    const endPositionMobile = -(totalWidthMobile - 20); // Stop with 20vw showing of last image
    const endPositionDesktop = -(totalWidthDesktop - 50); // Stop with 50vw showing of last image

    const isDesktop = typeof window !== "undefined" && window.innerWidth > 768;

    const endPos = isDesktop
        ? endPositionMobile * 0.35   // 40% slower
        : endPositionMobile;

    // Transform scroll progress to horizontal movement
    // Mobile calculation for safety (works on desktop too)
    const subImagesX = useTransform(scrollProgress, [0, 1], ['100vw', `${endPos}vw`]);

    // Scroll hint fades out
    const hintOpacity = useTransform(
        scrollProgress,
        [0, 0.1],
        [1, 0]
    );

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Manual scroll tracking
    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) return;

        const handleScroll = () => {
            const scrollTop = scrollContainer.scrollTop;
            const scrollHeight = scrollContainer.scrollHeight - scrollContainer.clientHeight;
            const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;

            scrollProgress.set(progress);

            // Update opacity and z-index state (only if animation complete)
            if (animationComplete) {
                const fadeStart = 0.1;
                const fadeEnd = 0.19;

                let opacity = 1;
                if (progress < fadeStart) {
                    opacity = 1;
                } else if (progress > fadeEnd) {
                    opacity = 0;
                } else {
                    opacity = 1 - ((progress - fadeStart) / (fadeEnd - fadeStart));
                }
                setMainOpacity(opacity);

                const zIndex = progress >= fadeEnd ? -10 : 10;
                setMainZIndex(zIndex);
            }

            // Calculate what x should be and opacity
            if (selectedImage?.subImages && selectedImage.subImages.length > 0) {
                const numImages = selectedImage.subImages.length;
                const totalWidth = (numImages * 80) + ((numImages - 1) * 4);
                const endPos = -(totalWidth - 20);
                const currentX = 100 + (progress * (endPos - 100));

                // Calculate opacity for debugging
                const fadeStart = 0.1;
                const fadeEnd = 0.19;  // Updated fade end point
                const opacity = progress < fadeStart ? 1 :
                    progress > fadeEnd ? 0 :
                        1 - ((progress - fadeStart) / (fadeEnd - fadeStart));

                // Calculate main image z-index
                const zIndex = progress >= fadeEnd ? -10 : 10;

                console.log('Scroll:', {
                    progress: progress.toFixed(2),
                    currentX: currentX.toFixed(0) + 'vw',
                    mainOpacity: animationComplete ? opacity.toFixed(2) : '1.00 (waiting)',
                    mainZ: animationComplete ? zIndex : '10 (waiting)',
                    animComplete: animationComplete
                });
            }
        };

        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [scrollProgress, selectedId, animationComplete, setMainOpacity, setMainZIndex]);

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
        setAnimationComplete(false);
        setMainOpacity(1);
        setMainZIndex(10);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleImageClick = (image: ImageData) => {
        if (selectedId === image.id) {
            setSelectedId(null);
            setSelectedImage(null);
            setAnimationComplete(false);
            setMainOpacity(1);
            setMainZIndex(10);
            setTimeout(() => {
                window.scrollTo({ top: savedScrollPosition, behavior: 'instant' });
            }, 0);
        } else {
            setSavedScrollPosition(window.scrollY);
            setSelectedId(image.id);
            setSelectedImage(image);
            setAnimationComplete(false);
            setMainOpacity(1);  // Reset to fully visible
            setMainZIndex(10);  // Reset to front

            // Reset scroll progress
            scrollProgress.set(0);

            // Fallback: Set animation complete after animation should be done
            setTimeout(() => {
                console.log('⏰ Fallback: Setting animationComplete to true');
                setAnimationComplete(true);
            }, 700);  // Slightly longer than animation duration (0.6s)

            // Log scroll calculation
            if (image.subImages && image.subImages.length > 0) {
                const numImages = image.subImages.length;
                const totalWidth = (numImages * 80) + ((numImages - 1) * 4);
                const endPos = -(totalWidth - 20);
                console.log('Sub-images scroll:', { numImages, totalWidth, endPos });
            }

            // Preload sub-images
            if (image.subImages && image.subImages.length > 0) {
                image.subImages.forEach((subImage) => {
                    const img = new Image();
                    img.src = subImage.url;
                });
            }
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

            {!selectedId ? (
                // 4-column grid
                <div className="grid grid-cols-4 gap-12 px-12 pt-20 pb-10 max-w-xl mx-auto">
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
            ) : (
                // Fixed overlay with internal scroll
                <div className="fixed inset-0 z-50 bg-white">
                    <div ref={scrollContainerRef} className="h-screen overflow-y-auto">
                        {/* Tall content to enable scroll */}
                        <div style={{ height: hasSubImages ? '300vh' : '100vh' }}>
                            {/* Sticky container */}
                            <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
                                {/* Main Image - Always Centered */}
                                <motion.div
                                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center  will-change-transform justify-center"
                                    style={{
                                        opacity: mainOpacity,
                                        zIndex: mainZIndex
                                    }}
                                >
                                    <motion.img
                                        src={selectedImage?.url}
                                        alt=""
                                        layoutId={selectedId}
                                        className="object-contain cursor-zoom-out max-w-[70vw] md:max-w-[50vw]"
                                        style={{ maxHeight: '70vh' }}
                                        onClick={() => {
                                            setSelectedId(null);
                                            setSelectedImage(null);
                                            setAnimationComplete(false);
                                            setMainOpacity(1);
                                            setMainZIndex(10);
                                            setTimeout(() => {
                                                window.scrollTo({ top: savedScrollPosition, behavior: 'instant' });
                                            }, 0);
                                        }}
                                        onAnimationComplete={() => {
                                            console.log('✅ Animation complete callback fired!');
                                            setAnimationComplete(true);
                                        }}
                                        transition={{ type: "spring", bounce: 0, duration: 0.6 }}
                                    />
                                </motion.div>

                                {/* Sub-Images filmstrip - Scrolls in from right */}
                                {hasSubImages && selectedImage.subImages && (
                                    <motion.div
                                        style={{ x: subImagesX }}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-4 md:gap-8 pr-4 md:pr-8 will-change-transform"
                                    >
                                        <div className="flex items-center gap-4 md:gap-8">
                                            {selectedImage.subImages
                                                .sort((a, b) => a.order - b.order)
                                                .map((subImage, idx) => (
                                                    <React.Fragment key={idx}>
                                                        <motion.div
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            transition={{ duration: 0.3, delay: 0.5 + idx * 0.1 }}
                                                            className="flex items-center gap-4 flex-shrink-0"
                                                        >
                                                            {/* Letter label BEFORE image when location is 'left' */}
                                                            {alphabetLabelLocation === 'left' && (
                                                                <div className="text-xs lowercase text-gray-400 text-center flex-shrink-0">
                                                                    {String.fromCharCode(97 + idx)}
                                                                </div>
                                                            )}

                                                            <div className="cursor-pointer">
                                                                {/* Letter label ABOVE image when location is 'top' */}
                                                                {alphabetLabelLocation === 'top' && (
                                                                    <div className="text-xs lowercase text-gray-400 mb-2 text-center">
                                                                        {String.fromCharCode(97 + idx)}
                                                                    </div>
                                                                )}

                                                                {/* Image */}
                                                                <div className="border-0 border-gray-200 hover:border-gray-400 transition-all">
                                                                    <img
                                                                        src={subImage.url}
                                                                        alt={`progress-${idx}`}
                                                                        className="w-[80vw] md:w-[50vw] lg:w-[35vw] h-[65vh] object-cover"
                                                                        onClick={() => setFullscreenImage(subImage.url)}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    </React.Fragment>
                                                ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Fullscreen overlay */}
                                {fullscreenImage && (
                                    <div
                                        className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center cursor-zoom-out"
                                        onClick={() => setFullscreenImage(null)}
                                    >
                                        <img
                                            src={fullscreenImage}
                                            className="max-w-[95vw] max-h-[95vh] object-contain"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Scroll hint */}
                            {hasSubImages && (
                                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 text-xs lowercase text-gray-400 flex items-center gap-2 pointer-events-none">
                                    <motion.div style={{ opacity: hintOpacity }}>
                                        scroll down
                                    </motion.div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FourColumnImageFeed;