"use client"

import { useEffect, useState } from "react";
import ImageCycler from "@/components/ImageCycler";
import ThreeColumnLayout from "@/components/ThreeColumnLayout";
import { imageCyclerImages } from "@/data/images";

const Bonjour: React.FC = () => {
    const [scrollLock, setScrollLock] = useState(false);

    useEffect(() => {
        // Add class to lock scroll
        document.body.classList.add("scroll-locked");

        // Unlock on unmount
        return () => {
            document.body.classList.remove("scroll-locked");
        };
    }, []);

    return (
        <div className="h-screen w-full bg-white flex items-center justify-center flex-col">
            <div className="flex mx-4 h-[55vh] lg-[60vh]  max-w-screen-md w-full mb-4">
                <ImageCycler images={imageCyclerImages} interval={1424} />
            </div>
            <ThreeColumnLayout />
        </div>
    );
};

export default Bonjour;