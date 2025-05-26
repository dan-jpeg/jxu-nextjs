"use client";

import Image from "next/image";

interface Props {
    src: string;
    isSelected: boolean;
    isHidden: boolean;
    onClick: () => void;
    onClose: () => void;
}

const ClickableImage: React.FC<Props> = ({ src, isSelected, isHidden, onClick, onClose }) => {
    return (
        <div
            data-image-src={src}
            className={`cursor-pointer w-full py-2 transition-opacity duration-300 ${
                isHidden ? 'opacity-0' : 'opacity-100'
            }`}
            onClick={isSelected ? onClose : onClick}
        >
            <Image
                src={src}
                alt=""
                width={700}
                height={1400}
                className="w-full h-auto object-contain"
            />
        </div>
    );
};

export default ClickableImage;