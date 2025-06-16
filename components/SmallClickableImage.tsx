"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState } from "react";

interface Props {
    src: string;
    isSelected: boolean;
    isOtherSelected: boolean;
    maxWidth: string;
    maxHeight: string;
    onClick: () => void;
}

const SmallClickableImage: React.FC<Props> = ({
                                                  src,
                                                  isSelected,
                                                  isOtherSelected,
                                                  maxWidth,
                                                  maxHeight,
                                                  onClick
                                              }) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const [gridRect, setGridRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        if (!isSelected) return;

        const updateRect = () => {
            if (gridRef.current) {
                setGridRect(gridRef.current.getBoundingClientRect());
            }
        };

        // Delay until next frame — layout should be settled
        const raf = requestAnimationFrame(updateRect);

        window.addEventListener("resize", updateRect);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", updateRect);
        };
    }, [isSelected]);

    // Calculate transform values for animation
    const getTransformValues = () => {
        if (!gridRect) return { x: 0, y: 0, scale: 1 };

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const targetX = windowWidth / 2;
        const targetY = windowHeight / 2;

        const currentX = gridRect.left + gridRect.width / 2;
        const currentY = gridRect.top + gridRect.height / 2;

        const x = targetX - currentX;
        const y = targetY - currentY;

        // Now calculate scale
        const maxWidthPx = maxWidth.includes('vw')
            ? (parseFloat(maxWidth) / 100) * windowWidth
            : parseFloat(maxWidth);
        const maxHeightPx = maxHeight.includes('vh')
            ? (parseFloat(maxHeight) / 100) * windowHeight
            : parseFloat(maxHeight);

        const scaleX = Math.min(maxWidthPx / gridRect.width, 4);
        const scaleY = Math.min(maxHeightPx / gridRect.height, 4);
        const scale = Math.min(scaleX, scaleY);

        return { x, y, scale };
    };

    const { x, y, scale } = getTransformValues();

    return (
        <>
            {/* Grid view - always rendered to maintain layout */}
            <div
                ref={gridRef}
                className={`relative cursor-pointer transition-all duration-300 ${
                    isOtherSelected ? 'opacity-70 scale-95' : 'opacity-100 hover:scale-105'
                }`}
                onClick={onClick}
            >
                <Image
                    src={src}
                    alt=""
                    width={400}
                    height={600}
                    className={`w-full h-auto object-cover transition-opacity duration-300 ${
                        isSelected ? 'opacity-0' : 'opacity-100'
                    }`}
                    sizes="(max-width: 768px) 10vw, 15vw"
                />
            </div>

            {/* Animated expanded view */}
            <AnimatePresence>
                {isSelected && gridRect && (
                    <motion.div
                        className="fixed z-50 cursor-pointer"
                        style={{
                            left: gridRect.left,
                            top: gridRect.top,
                            width: gridRect.width,
                            height: gridRect.height,
                        }}
                        animate={{
                            x,
                            y,
                            scale,
                        }}
                        exit={{
                            x: 0,
                            y: 0,
                            scale: 1,
                        }}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 200,
                            duration: 0.3
                        }}
                        onClick={onClick}
                    >
                        <Image
                            src={src}
                            alt=""
                            width={400}
                            height={600}
                            className="w-full h-full object-cover"
                            priority
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default SmallClickableImage;