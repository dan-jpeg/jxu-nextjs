"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FixedNavbar from "@/components/FixedNavbar";
import ProjectRow from "@/components/ProjectRow";
import type { Project } from "@/lib/types";

const ArchivePage = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [showPasswordInput, setShowPasswordInput] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);

    // Check if already unlocked from localStorage
    useEffect(() => {
        const unlocked = localStorage.getItem('archive-unlocked');
        if (unlocked === 'true') {
            setIsUnlocked(true);
        }
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await fetch('/api/projects');
            const data = await response.json();
            setProjects(data.projects || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isUnlocked) {
            fetchProjects();
        }
    }, [isUnlocked]);

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (password === "waitforme") {
            setIsUnlocked(true);
            localStorage.setItem('archive-unlocked', 'true');
            setShowPasswordInput(false);
            setPassword("");
            setError(false);
        } else {
            setError(true);
            setPassword("");
        }
    };

    // Group and sort projects
    const personalProjects = projects
        .filter(p => p.category === 'personal')
        .sort((a, b) => a.order - b.order);

    const workProjects = projects
        .filter(p => p.category === 'work')
        .sort((a, b) => a.order - b.order);

    const orderedProjects = [...personalProjects, ...workProjects];

    return (
        <div className="relative min-h-screen bg-white">
            {/* Secret unlock button - tiny circle in top right */}
            {!isUnlocked && (
                <motion.button
                    onClick={() => setShowPasswordInput(true)}
                    className="fixed top-4 right-4 w-3 h-3 rounded-full bg-gray-200 hover:bg-gray-300 z-[100] transition-colors"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                />
            )}

            {/* Under construction veil */}
            <AnimatePresence>
                {!isUnlocked && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        className="fixed inset-0 z-50 bg-white flex items-center justify-center"
                    >
                        <div className="text-center px-4">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="space-y-4"
                            >
                                <h1 className="text-2xl font-helvetica font-medium uppercase tracking-wider text-gray-800">

                                </h1>
                                <p className="text-sm lowercase text-gray-500 font-light">
                                    under construction
                                </p>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Password input modal */}
            <AnimatePresence>
                {showPasswordInput && !isUnlocked && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center"
                        onClick={() => setShowPasswordInput(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", bounce: 0.3 }}
                            className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full mx-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 lowercase">
                                        enter password
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setError(false);
                                        }}
                                        autoFocus
                                        className={`w-full px-4 py-2 border ${
                                            error ? 'border-red-400' : 'border-gray-300'
                                        } rounded focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm`}
                                        placeholder="password"
                                    />
                                    {error && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-xs text-red-500 mt-2 lowercase italic"
                                        >
                                            incorrect password
                                        </motion.p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordInput(false)}
                                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm lowercase"
                                    >
                                        cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 transition-colors text-sm lowercase"
                                    >
                                        unlock
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main content - only shows when unlocked */}
            {isUnlocked && (
                <>
                    {projects.length > 0 && <FixedNavbar projects={projects} />}

                    <div className="">
                        {loading ? (
                            <div className="flex items-center justify-center h-[50vh]">
                                <div className="text-xs lowercase text-gray-400">
                                    loading...
                                </div>
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="flex items-center justify-center h-[50vh]">
                                <div className="text-xs lowercase text-gray-400">
                                    no projects yet
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-0">
                                {orderedProjects.map((project) => (
                                    <div key={project.id} id={`project-${project.id}`}>
                                        <ProjectRow project={project} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ArchivePage;