// components/ContentBlockRenderer.tsx

"use client";

import ImageCycler from "@/components/ImageCycler";
import type { ContentBlock } from "@/lib/types";

interface ContentBlockRendererProps {
    blocks: ContentBlock[];
    figurePrefix?: string; // e.g., "fig" for main content
}

const ContentBlockRenderer: React.FC<ContentBlockRendererProps> = ({
                                                                       blocks,
                                                                       figurePrefix
                                                                   }) => {
    // Track photo count for figure numbering
    let photoCount = 0;

    return (
        <div className="space-y-8">
            {blocks
                .sort((a, b) => a.order - b.order)
                .map((block, idx) => {
                    if (block.type === 'photo') {
                        photoCount++;
                        const figNum = photoCount;

                        return (
                            <div key={block.id} className="space-y-2">
                                {/* Caption Above */}
                                {block.caption?.position === 'above' && (
                                    <p className="text-xs font-georgia italic text-gray-500">
                                        {block.caption.text}
                                    </p>
                                )}

                                {/* Photo */}
                                <img
                                    src={block.url}
                                    alt=""
                                    className="w-full h-auto"
                                />

                                {/* Figure Number */}
                                {figurePrefix && (
                                    <p className="text-xs font-georgia italic text-gray-500">
                                        {figurePrefix} {String(figNum).padStart(2, '0')}
                                    </p>
                                )}

                                {/* Caption Below */}
                                {block.caption?.position === 'below' && (
                                    <p className="text-xs font-georgia italic text-gray-500">
                                        {block.caption.text}
                                    </p>
                                )}
                            </div>
                        );
                    }

                    if (block.type === 'cycler') {
                        return (
                            <div key={block.id} className="w-full">
                                <div className="relative w-full h-[55vh]">
                                    <ImageCycler
                                        images={block.images}
                                        interval={block.interval}
                                    />
                                </div>
                            </div>
                        );
                    }

                    // Text Block
                    return (
                        <div key={block.id} className={`
                            text-xs lowercase
                            ${block.style === 'italic' ? 'italic' : ''}
                            ${block.style === 'quote' ? 'pl-8 border-l-2 border-gray-300 italic' : ''}
                        `}>
                            {block.content.split('\n').map((line, i) => (
                                <p key={i} className={i > 0 ? 'mt-4' : ''}>
                                    {line}
                                </p>
                            ))}
                        </div>
                    );
                })}
        </div>
    );
};

export default ContentBlockRenderer;
