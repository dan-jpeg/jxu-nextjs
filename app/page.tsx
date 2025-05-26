"use client";

import { useEffect } from "react";
import ImageCycler from "@/components/ImageCycler";
import ThreeColumnLayout from "@/components/ThreeColumnLayout";
import { imageCyclerImages } from "@/data/images";

const Bonjour: React.FC = () => {
    useEffect(() => {
        // Disable scroll
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        // Cleanup on unmount (re-enable scroll)
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    return (
        <div className="h-screen w-full bg-white flex items-center justify-center overflow-hidden flex-col">
            <div className="flex mx-4 h-[60vh] max-w-screen-md w-full mb-4">
                <ImageCycler images={imageCyclerImages} interval={1424} />
            </div>
            <ThreeColumnLayout />
        </div>
    );
};

export default Bonjour;