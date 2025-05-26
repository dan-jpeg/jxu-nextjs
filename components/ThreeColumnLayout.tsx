"use client";

import React, { useState } from 'react';

const ThreeColumnLayout: React.FC = () => {
    const [copied, setCopied] = useState(false);

    const handleCopyEmail = () => {
        navigator.clipboard.writeText('jinnix24@gmail.com');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            className="w-full max-w-screen-md mx-auto px-4 py-2 text-xs lowercase text-gray-700 font-sans font-light bg-white">
            <div className="text-left font-[450] tracking-[0.08em]">jing yi xu</div>
            <div className="w-full h-px bg-gray-200 my-2"/>
            {/* Corrected the bg class */}
            <div className="grid grid-cols-3 gap-4">
                <div className="text-left overflow-hidden whitespace-nowrap">
                    <div className="inline-flex animate-scroll">
                        {/* Repeated text */}
                        {[...Array(14)].map((_, i) => (
                            <span key={i} className="mr-8 italic">
                        jing yi xu is an artist and fashion designer based in new york city
                    </span>
                        ))}
                    </div>
                </div>
                <div className="text-center">
                    <a
                        href="/jinnixu_apr2025.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-700 font-normal text-xs hover:italic hover:text-neutral-300"
                    >
                        information
                    </a>
                </div>
                <div className="text-right">
                    <button
                        onClick={handleCopyEmail}
                        className={` ${copied ? 'italic' : '' } text-neutral-700 font-normal text-xs hover:italic hover:text-neutral-300 focus:outline-none`}
                    >
                        {copied ? 'email has been copied to clipboard' : 'mail'}
                    </button>
                </div>
            </div>
            <div className="w-full h-px bg-gray-200 my-2"/>
            <div className="grid grid-cols-3 gap-4">
                <div className="text-left">
                    <a
                        className="text-neutral-700 font-normal text-xs hover:italic hover:text-neutral-300"
                        href="https://www.instagram.com/jingyix_"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        @jingyix_
                    </a>
                </div>
                <div className="text-center">
                  <a
                    href="/archive"
                    className="hover:line-through cursor-pointer text-neutral-700 font-normal text-xs hover:italic hover:text-neutral-300"
                  >
                    Archive
                  </a>
                </div>
                <div className="text-right">1 347 327 2418</div>
            </div>
            <div className="w-full h-px bg-gray-200 my-2"/>
        </div>
    );
};

export default ThreeColumnLayout;