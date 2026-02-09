// app/api/projects/migrate-content/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { adminDb } from "@/lib/firebase-admin";
import type { UpdateData, DocumentData } from "firebase-admin/firestore";
import type { ContentBlock } from "@/lib/types";

type LegacyPhoto = {
    url: string;
    order?: number;
    width?: number;
    height?: number;
    caption?: {
        text: string;
        position: "above" | "below";
    };
};

const sortPhotos = (photos: LegacyPhoto[]) =>
    [...photos].sort((a, b) => {
        const ao = typeof a.order === "number" ? a.order : 0;
        const bo = typeof b.order === "number" ? b.order : 0;
        return ao - bo;
    });

const photosToBlocks = (
    photos: LegacyPhoto[],
    prefix: string,
    projectId: string
): ContentBlock[] => {
    const sorted = sortPhotos(photos);
    return sorted.map((photo, index) => {
        const block: ContentBlock = {
            id: `${prefix}-${projectId}-${index}`,
            type: "photo",
            order: index,
            url: photo.url,
        };

        if (typeof photo.width === "number") block.width = photo.width;
        if (typeof photo.height === "number") block.height = photo.height;
        if (photo.caption) block.caption = photo.caption;

        return block;
    });
};

// POST /api/projects/migrate-content - Convert legacy photos to content blocks
export async function POST() {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const snapshot = await adminDb.collection("projects").get();

        let migrated = 0;
        let updated = 0;

        const batch = adminDb.batch();

        snapshot.docs.forEach((doc) => {
            const data = doc.data();

            const mainContent = Array.isArray(data.mainContent) ? data.mainContent : [];
            const processContent = Array.isArray(data.processContent) ? data.processContent : [];
            const mainPhotos = Array.isArray(data.mainPhotos) ? data.mainPhotos : [];
            const processPhotos = Array.isArray(data.processPhotos) ? data.processPhotos : [];

            const updates: UpdateData<DocumentData> = {};

            if (mainContent.length === 0 && mainPhotos.length > 0) {
                updates.mainContent = photosToBlocks(mainPhotos, "legacy-main", doc.id);
                migrated += 1;
            }

            if (processContent.length === 0 && processPhotos.length > 0) {
                updates.processContent = photosToBlocks(processPhotos, "legacy-process", doc.id);
                migrated += 1;
            }

            if (Object.keys(updates).length > 0) {
                updates.updatedAt = new Date();
                batch.update(doc.ref, updates);
                updated += 1;
            }
        });

        if (updated > 0) {
            await batch.commit();
        }

        return NextResponse.json(
            { updatedProjects: updated, migratedSections: migrated },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error migrating content blocks:", error);
        return NextResponse.json(
            { error: "Failed to migrate content blocks" },
            { status: 500 }
        );
    }
}
