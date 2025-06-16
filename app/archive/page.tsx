// app/archive/page.tsx

import FixedNavbar from "@/components/FixedNavbar";
import ImageColumn from "@/components/ImageColumn";
import FourColumnImageFeed from "@/components/FourColumnImageFeed";

const ArchivePage = () => {
    return (
        <div id="top" className="relative bg-white min-h-screen">
            <FourColumnImageFeed  />
        </div>
    );
};

export default ArchivePage;