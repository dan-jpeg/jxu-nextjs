"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface ImageCyclerProps {
    images: string[];
    interval?: number;
}

const ImageCycler: React.FC<ImageCyclerProps> = ({ images, interval = 3000 }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, interval);

        return () => clearInterval(timer);
    }, [images, interval]);

    return (
        <div className="w-full h-full relative">
            <Image
                src={images[currentIndex]}
                alt={`Cycled image ${currentIndex + 1}`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
            />
        </div>
    );
};

export default ImageCycler;