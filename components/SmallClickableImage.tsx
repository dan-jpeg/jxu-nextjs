"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface Props {
    src: string;
    maxWidth?: string;
    maxHeight?: string;
    isSelected?: boolean;
    isOtherSelected?: boolean;
    onClick?: () => void;
}

const SmallClickableImage: React.FC<Props> = ({
                                                  src,
                                                  maxWidth = "90vw",
                                                  maxHeight = "90vh",
                                              }) => {
    const [isSelected, setIsSelected] = useState(false);

    return (
        <>
            {/* Thumbnail image (always rendered, hidden when fullscreen) */}
            <motion.img
                src={src}
                alt=""
                layoutId={src}
                onClick={() => setIsSelected(true)}
                className={`w-full h-auto object-cover cursor-pointer ${
                    isSelected ? 'invisible' : ''
                }`}
                transition={{ type: "linear" }}
            />

            {/* Fullscreen overlay */}
            <AnimatePresence>
                {isSelected && (
                    <motion.div
                        className="fixed inset-0 z-50 bg-transparent flex items-center justify-center cursor-pointer"
                        onClick={() => setIsSelected(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.img
                            src={src}
                            alt=""
                            layoutId={src}
                            className="object-contain"
                            style={{
                                maxWidth,
                                maxHeight,
                            }}
                            transition={{ type: "linear" }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default SmallClickableImage;