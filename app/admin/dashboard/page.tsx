"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import ProjectUpload from "@/components/ProjectUpload";
import ProjectManager from "@/components/ProjectManager";
import type { Project } from "@/lib/types";

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<"upload" | "manage">("manage");
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [migrating, setMigrating] = useState(false);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/projects");
            const data = await response.json();
            setProjects(data.projects || []);
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch projects immediately when dashboard renders
    useEffect(() => {
        fetchProjects();
    }, []);

    const handleLogout = async () => {
        await signOut({ callbackUrl: "/" });
    };

    const handleMigrateLegacy = async () => {
        const confirmed = confirm(
            "Convert legacy main/process photos into content blocks for all projects that don't have them yet?"
        );
        if (!confirmed) return;

        setMigrating(true);
        try {
            const response = await fetch("/api/projects/migrate-content", {
                method: "POST",
            });

            if (!response.ok) {
                throw new Error("Migration failed");
            }

            const data = await response.json();
            alert(
                `Migration complete. Updated ${data.updatedProjects} project(s), ${data.migratedSections} section(s).`
            );
            fetchProjects();
        } catch (error) {
            console.error("Error migrating legacy content:", error);
            alert("Failed to migrate legacy content");
        } finally {
            setMigrating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-stone-50 to-neutral-100">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-4 mt-8">
                <div className="flex gap-4 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab("upload")}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === "upload"
                                ? "border-b-2 border-blue-600 text-blue-600"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        Create New Project
                    </button>
                    <button
                        onClick={() => setActiveTab("manage")}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === "manage"
                                ? "border-b-2 border-blue-600 text-blue-600"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        Manage Projects ({projects.length})
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {activeTab === "upload" ? (
                    <ProjectUpload onSuccess={() => {
                        setActiveTab("manage");
                        fetchProjects();
                    }} />
                ) : (
                    <>
                        <div className="flex items-center justify-end mb-4">
                            <button
                                onClick={handleMigrateLegacy}
                                disabled={migrating}
                                className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {migrating ? "Migrating..." : "Migrate Legacy Photos"}
                            </button>
                        </div>
                        <ProjectManager
                            projects={projects}
                            loading={loading}
                            onUpdate={fetchProjects}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
