"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                username,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('invalid credentials');
            } else {
                router.push('/admin/dashboard');
                router.refresh();
            }
        } catch (err) {
            setError('something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-white flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-screen-md mx-auto text-xs lowercase text-gray-700 font-sans font-light"
            >
                <div className="text-left font-[450] tracking-[0.08em] mb-2">
                    admin access
                </div>
                <div className="w-full h-px bg-gray-200 mb-6" />

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <div className="text-left">username</div>
                        <div className="col-span-2">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 text-neutral-700 text-xs lowercase focus:outline-none focus:border-gray-400 transition-colors"
                                disabled={loading}
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 items-center">
                        <div className="text-left">password</div>
                        <div className="col-span-2">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 text-neutral-700 text-xs lowercase focus:outline-none focus:border-gray-400 transition-colors"
                                disabled={loading}
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-200 my-6" />

                    <div className="grid grid-cols-3 gap-4">
                        <a
                            href="/"
                            className="text-left text-neutral-700 font-normal text-xs hover:italic hover:text-neutral-300 transition-all"
                        >
                            ← back
                        </a>
                        <div className="text-center">
                            {error && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="italic text-red-400"
                                >
                                    {error}
                                </motion.span>
                            )}
                        </div>
                        <div className="text-right">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`text-neutral-700 font-normal text-xs hover:italic hover:text-neutral-300 transition-all ${
                                    loading ? 'opacity-50 cursor-wait' : ''
                                }`}
                            >
                                {loading ? 'accessing...' : 'enter →'}
                            </button>
                    ;    </div>
                    </div>
                </form>

                <div className="w-full h-px bg-gray-200 mt-6" />
            </motion.div>
        </div>
    );
};

export default LoginPage;