"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function AdminPage() {
    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === "loading") return;

        if (session) {
            router.replace("/admin/dashboard");
        } else {
            router.replace("/admin/login");
        }
    }, [session, status, router]);

    return (
        <div className="min-h-screen w-full bg-white flex items-center justify-center">
            <div className="text-xs lowercase text-gray-400">redirecting...</div>
        </div>
    );
}