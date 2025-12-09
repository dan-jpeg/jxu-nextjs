"use client";

import { useState, useEffect } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface SubImage {
    url: string;
    order: number;
    createdAt?: any;
}

interface ImageData {
    id: string;
    url: string;
    order: number;
    subImages?: SubImage[];
}

const DashboardPage = () => {
    const router = useRouter();
    const [images, setImages] = useState<ImageData[]>([]);
    const [loading, setLoading] = useState(true);
    const [newImageUrl, setNewImageUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [message, setMessage] = useState('');

    // Backup state
    const [backups, setBackups] = useState<any[]>([]);
    const [showBackups, setShowBackups] = useState(false);
    const [lastAction, setLastAction] = useState<{ type: string; data: any } | null>(null);

    // Sub-images state
    const [expandedImageId, setExpandedImageId] = useState<string | null>(null);
    const [uploadingSubImage, setUploadingSubImage] = useState<string | null>(null);

    useEffect(() => {
        fetchImages();
        fetchBackups();
    }, []);

    const fetchImages = async () => {
        try {
            const response = await fetch('/api/images');
            const data = await response.json();
            setImages(data.images);
        } catch (error) {
            console.error('Error fetching images:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBackups = async () => {
        try {
            const response = await fetch('/api/backup');
            const data = await response.json();
            setBackups(data.backups || []);
        } catch (error) {
            console.error('Error fetching backups:', error);
        }
    };

    const createBackup = async () => {
        try {
            const response = await fetch('/api/backup', { method: 'POST' });
            if (response.ok) {
                await fetchBackups();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error creating backup:', error);
            return false;
        }
    };

    const handleManualBackup = async () => {
        setMessage('creating backup...');
        const success = await createBackup();
        setMessage(success ? 'backup created' : 'failed to create backup');
        setTimeout(() => setMessage(''), 3000);
    };

    const handleRestoreBackup = async (backupId: string) => {
        if (!confirm('restore from this backup? this will replace all current images.')) return;

        setMessage('restoring...');
        try {
            const response = await fetch('/api/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ backupId }),
            });

            if (response.ok) {
                setMessage('backup restored successfully');
                setShowBackups(false);
                await fetchImages();
            } else {
                setMessage('failed to restore backup');
            }
        } catch (error) {
            setMessage('error restoring backup');
        } finally {
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleSignOut = async () => {
        await signOut({ redirect: false });
        router.push('/admin/login');
    };

    const addImageToDatabase = async (url: string) => {
        try {
            const response = await fetch('/api/images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            if (response.ok) {
                setMessage('image added successfully');
                await fetchImages();
            } else {
                setMessage('failed to add image');
            }
        } catch (error) {
            setMessage('error adding image');
        } finally {
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleAddImageByUrl = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newImageUrl.trim()) return;

        setUploading(true);
        await addImageToDatabase(newImageUrl);
        setNewImageUrl('');
        setUploading(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setMessage('please select an image file');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setMessage('file too large (max 10mb)');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        setMessage('uploading...');

        try {
            const formData = new FormData();
            formData.append('file', file);

            setUploadProgress(25);

            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) {
                throw new Error('Upload failed');
            }

            const uploadData = await uploadResponse.json();
            setUploadProgress(75);

            await addImageToDatabase(uploadData.url);
            setUploadProgress(100);

            setTimeout(() => {
                setUploadProgress(0);
                setUploading(false);
            }, 1000);

        } catch (err: any) {
            console.error('Upload error:', err);
            setMessage('upload failed: ' + err.message);
            setUploading(false);
            setTimeout(() => setMessage(''), 3000);
        }

        e.target.value = '';
    };

    const handleSubImageUpload = async (imageId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Validate all files first
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/')) {
                setMessage(`"${file.name}" is not an image file`);
                setTimeout(() => setMessage(''), 3000);
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                setMessage(`"${file.name}" is too large (max 10mb)`);
                setTimeout(() => setMessage(''), 3000);
                return;
            }
        }

        setUploadingSubImage(imageId);
        setMessage(`uploading ${files.length} sub-image${files.length > 1 ? 's' : ''}...`);

        try {
            // Upload files sequentially
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch(`/api/images/${imageId}/sub-images`, {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    setMessage(`failed to upload "${file.name}"`);
                    setTimeout(() => setMessage(''), 3000);
                    break;
                }
            }

            setMessage(`${files.length} sub-image${files.length > 1 ? 's' : ''} added`);
            await fetchImages();
        } catch (error) {
            setMessage('error uploading sub-images');
        } finally {
            setUploadingSubImage(null);
            setTimeout(() => setMessage(''), 3000);
        }

        e.target.value = '';
    };

    const handleDeleteSubImage = async (imageId: string, subImageUrl: string) => {
        if (!confirm('delete this sub-image?')) return;

        try {
            const response = await fetch(
                `/api/images/${imageId}/sub-images?url=${encodeURIComponent(subImageUrl)}`,
                { method: 'DELETE' }
            );

            if (response.ok) {
                setMessage('sub-image deleted');
                await fetchImages();
            } else {
                setMessage('failed to delete sub-image');
            }
        } catch (error) {
            setMessage('error deleting sub-image');
        } finally {
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleDeleteImage = async (imageId: string) => {
        if (!confirm('delete this image?')) return;

        setMessage('creating backup before delete...');
        await createBackup();

        const deletedImage = images.find(img => img.id === imageId);
        setLastAction({ type: 'delete', data: deletedImage });

        try {
            const response = await fetch(`/api/images?id=${imageId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setMessage('image deleted (backup created)');
                await fetchImages();
            } else {
                setMessage('failed to delete');
            }
        } catch (error) {
            setMessage('error deleting');
        } finally {
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleReorder = async (newOrder: ImageData[]) => {
        setLastAction({ type: 'reorder', data: images });
        setImages(newOrder);

        try {
            await fetch('/api/images', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    images: newOrder.map((img, index) => ({
                        id: img.id,
                        url: img.url,
                        order: index
                    }))
                }),
            });
        } catch (error) {
            console.error('Error reordering:', error);
            setMessage('failed to save order');
            await fetchImages();
        }
    };

    const handleUndo = async () => {
        if (!lastAction) return;

        if (lastAction.type === 'reorder') {
            setImages(lastAction.data);
            await fetch('/api/images', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    images: lastAction.data.map((img: ImageData, index: number) => ({
                        id: img.id,
                        url: img.url,
                        order: index
                    }))
                }),
            });
            setMessage('reorder undone');
        } else if (lastAction.type === 'delete') {
            if (backups.length > 0) {
                await handleRestoreBackup(backups[0].id);
            }
        }

        setLastAction(null);
        setTimeout(() => setMessage(''), 3000);
    };

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-white flex items-center justify-center">
                <div className="text-xs lowercase text-gray-400">loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-white px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-6xl mx-auto text-xs lowercase text-gray-700 font-sans font-light"
            >
                {/* Header */}
                <div className="text-left font-[450] tracking-[0.08em] mb-2">
                    admin dashboard
                </div>
                <div className="w-full h-px bg-gray-200 mb-6" />

                {/* Navigation */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <a
                        href="/archive"
                        className="text-left text-neutral-700 font-normal text-xs hover:italic hover:text-neutral-300 transition-all"
                    >
                        ← archive
                    </a>
                    <div className="text-center text-neutral-700">
                        {images.length} images
                    </div>
                    <button
                        onClick={() => setShowBackups(!showBackups)}
                        className="text-center text-neutral-700 font-normal text-xs hover:italic hover:text-neutral-300 transition-all"
                    >
                        backups ({backups.length})
                    </button>
                    <div className="text-right">
                        <button
                            onClick={handleSignOut}
                            className="text-neutral-700 font-normal text-xs hover:italic hover:text-neutral-300 transition-all"
                        >
                            sign out
                        </button>
                    </div>
                </div>

                <div className="w-full h-px bg-gray-200 mb-6" />

                {/* Backup Controls */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={handleManualBackup}
                        className="px-4 py-2 bg-white border border-gray-200 text-neutral-700 text-xs hover:bg-gray-50 transition-all"
                    >
                        create backup
                    </button>
                    {lastAction && (
                        <motion.button
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={handleUndo}
                            className="px-4 py-2 bg-white border border-gray-200 text-neutral-700 text-xs hover:bg-gray-50 transition-all"
                        >
                            ↺ undo last action
                        </motion.button>
                    )}
                </div>

                {/* Backups Modal */}
                <AnimatePresence>
                    {showBackups && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 border border-gray-200 p-4 overflow-hidden"
                        >
                            <div className="text-neutral-700 mb-3">available backups</div>
                            {backups.length === 0 ? (
                                <div className="text-neutral-400 italic">no backups yet</div>
                            ) : (
                                <div className="space-y-2">
                                    {backups.map((backup) => (
                                        <div key={backup.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                                            <div>
                                                <div className="text-neutral-700">
                                                    {new Date(backup.createdAt).toLocaleString()}
                                                </div>
                                                <div className="text-neutral-400">
                                                    {backup.imageCount} images
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRestoreBackup(backup.id)}
                                                className="px-3 py-1 bg-white border border-gray-200 text-neutral-700 text-xs hover:bg-gray-50 transition-all"
                                            >
                                                restore
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="w-full h-px bg-gray-200 mb-6" />

                {/* Add Image Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <div className="text-neutral-700 mb-3">upload file</div>
                        <label className="block">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                disabled={uploading}
                                className="hidden"
                            />
                            <div className="px-6 py-3 bg-white border border-gray-200 text-neutral-700 text-xs hover:bg-gray-50 transition-all cursor-pointer text-center disabled:opacity-50">
                                {uploading && uploadProgress > 0
                                    ? `uploading ${uploadProgress}%...`
                                    : 'choose file'}
                            </div>
                        </label>
                        {uploading && uploadProgress > 0 && (
                            <div className="mt-3">
                                <div className="w-full bg-gray-200 h-1">
                                    <motion.div
                                        className="bg-neutral-700 h-1"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${uploadProgress}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="text-neutral-700 mb-3">or paste url</div>
                        <form onSubmit={handleAddImageByUrl} className="flex gap-3">
                            <input
                                type="url"
                                value={newImageUrl}
                                onChange={(e) => setNewImageUrl(e.target.value)}
                                placeholder="image url"
                                className="flex-1 px-3 py-2 bg-white border border-gray-200 text-neutral-700 text-xs lowercase focus:outline-none focus:border-gray-400 transition-colors"
                                disabled={uploading}
                            />
                            <button
                                type="submit"
                                disabled={uploading || !newImageUrl.trim()}
                                className="px-6 py-2 bg-white border border-gray-200 text-neutral-700 text-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                add
                            </button>
                        </form>
                    </div>
                </div>

                {message && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-6 text-neutral-400 italic"
                    >
                        {message}
                    </motion.div>
                )}

                <div className="w-full h-px bg-gray-200 mb-6" />

                <div className="text-neutral-400 mb-6 italic">
                    drag to reorder • click image to manage sub-images • click × to delete
                </div>

                {/* Image Grid */}
                <Reorder.Group
                    axis="y"
                    values={images}
                    onReorder={handleReorder}
                    className="space-y-4"
                >
                    {images.map((image) => (
                        <Reorder.Item
                            key={image.id}
                            value={image}
                            className="bg-white border border-gray-200 hover:border-gray-300 transition-colors"
                        >
                            {/* Main Image Row */}
                            <div className="flex items-center gap-4 p-4 cursor-grab active:cursor-grabbing">
                                <div className="text-gray-400">⋮⋮</div>

                                <img
                                    src={image.url}
                                    alt={image.id}
                                    className="w-20 h-20 object-cover cursor-pointer"
                                    onClick={() => setExpandedImageId(
                                        expandedImageId === image.id ? null : image.id
                                    )}
                                />

                                <div className="flex-1 text-neutral-700">
                                    <div className="font-normal">{image.id}</div>
                                    <div className="text-neutral-400 truncate max-w-md">
                                        {image.url}
                                    </div>
                                    {image.subImages && image.subImages.length > 0 && (
                                        <div className="text-neutral-400 text-xs mt-1">
                                            {image.subImages.length} sub-image{image.subImages.length !== 1 ? 's' : ''}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleDeleteImage(image.id)}
                                    className="px-4 py-2 text-red-400 hover:text-red-600 transition-colors text-xl"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Sub-Images Section (Expandable) */}
                            <AnimatePresence>
                                {expandedImageId === image.id && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="border-t border-gray-200 p-4 bg-gray-50"
                                    >
                                        <div className="text-neutral-700 mb-3">sub-images (progress pictures)</div>

                                        {/* Upload Sub-Image */}
                                        <label className="block mb-4">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={(e) => handleSubImageUpload(image.id, e)}
                                                disabled={uploadingSubImage === image.id}
                                                className="hidden"
                                            />
                                            <div className="px-4 py-2 bg-white border border-gray-200 text-neutral-700 text-xs hover:bg-gray-50 transition-all cursor-pointer text-center inline-block">
                                                {uploadingSubImage === image.id
                                                    ? 'uploading...'
                                                    : '+ upload sub-image(s)'}
                                            </div>
                                        </label>

                                        {/* Sub-Images Grid */}
                                        {image.subImages && image.subImages.length > 0 ? (
                                            <div className="grid grid-cols-4 gap-4">
                                                {image.subImages
                                                    .sort((a, b) => a.order - b.order)
                                                    .map((subImage, idx) => (
                                                        <div key={idx} className="relative group">
                                                            <img
                                                                src={subImage.url}
                                                                alt={`sub-${idx}`}
                                                                className="w-full h-32 object-cover border border-gray-200"
                                                            />
                                                            <button
                                                                onClick={() => handleDeleteSubImage(image.id, subImage.url)}
                                                                className="absolute top-1 right-1 bg-white bg-opacity-90 text-red-400 hover:text-red-600 w-6 h-6 flex items-center justify-center text-xl opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                            </div>
                                        ) : (
                                            <div className="text-neutral-400 italic text-xs">
                                                no sub-images yet
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Reorder.Item>
                    ))}
                </Reorder.Group>

                <div className="w-full h-px bg-gray-200 mt-8" />
            </motion.div>
        </div>
    );
};

export default DashboardPage;