// components/FixedNavbar.tsx

"use client";

import { useState, useEffect } from "react";
import type { Project } from "@/lib/types";

interface FixedNavbarProps {
    projects?: Project[];
    onArchiveClick?: () => void;
}

const FixedTitleBar: React.FC<FixedNavbarProps> = ({ projects, onArchiveClick }) => {
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

    // If projects are provided, use new project navigation

    return (
        <div className="fixed bottom-0 left-0 font-[400] w-full transform -translate-y-1/2 z-50 px-[16px]">
            <div className="relative w-full flex justify-center items-center text-xs lowercase">
                <p> </p>

                <div className="flex flex-row ">
                    <a href="/" className=" mr-20  hover:opacity-20 text-black ">
                        jing yi xu
                    </a>
                    <p> archive </p>
                </div>
                <div className="absolute right-2 flex opacity-0 gap-4">
                    <p> </p>
                </div>
            </div>
        </div>
    );
};

export default FixedTitleBar;
