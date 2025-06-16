interface FixedNavbarProps {
    onArchiveClick?: () => void;
}

const FixedNavbar: React.FC<FixedNavbarProps> = ({ onArchiveClick }) => {
    return (
        <div className="fixed top-1/2 left-0 font-[400] w-full transform -translate-y-1/2 z-50 px-[16px]">
            <div className="relative w-full flex justify-center items-center text-xs  uppercase">

                <a  href="/"  className="absolute hover:opacity-20 text-black tracking-wider cursor-w-resize left-2">
                    jing yi xu
                </a>

                <button
                    onClick={onArchiveClick}
                    className="hover:italic uppercase  hover:opacity-0 cursor-n-resize text-black opacity-80 "

                    // style={{ backgroundColor: '#B4D7FF' }}
                >
                    Archive
                </button>

                <div className="absolute right-2 flex  opacity-0 gap-4">
                 <p> </p>
                </div>

            </div>
        </div>
    );
};

export default FixedNavbar;