// components/ImageColumn.tsx

"use client";

import { useState, useEffect } from "react";
import ClickableImage from "./ClickableImage";
import FixedNavbar from "@/components/FixedNavbar";
import { archiveImages } from "@/data/images";

const ImageColumn = () => {
    const [selected, setSelected] = useState<string | null>(null);

    useEffect(() => {
        if (!selected) return;

        const handleScroll = () => {
            const selectedElement = document.querySelector(`[data-image-src="${selected}"]`);
            if (!selectedElement) return;

            const imageRect = selectedElement.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const buffer = 10;
            const isOutOfView = imageRect.bottom < -buffer || imageRect.top > windowHeight + buffer;

            if (isOutOfView) {
                setSelected(null);
            }
        };

        let ticking = false;
        const throttledScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', throttledScroll, { passive: true });
        return () => window.removeEventListener('scroll', throttledScroll);
    }, [selected]);

    const handleArchiveClick = () => {
        setSelected(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="relative">
            {!selected && <FixedNavbar onArchiveClick={handleArchiveClick} />}

            <div className="flex flex-col items-center gap-4 pb-20 px-6 max-w-3xl mx-auto">
                <div className="h-[50vh] opacity-0"></div>
                {archiveImages.map((src) => (

                    <ClickableImage
                        key={src}
                        src={src}
                        isSelected={selected === src}
                        isHidden={selected !== null && selected !== src}
                        onClick={() => setSelected(src)}
                        onClose={() => setSelected(null)}
                    />
                ))}
            </div>
        </div>
    );
};

export default ImageColumn