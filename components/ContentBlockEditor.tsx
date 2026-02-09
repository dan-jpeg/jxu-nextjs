// components/ContentBlockEditor.tsx

"use client";

import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
    DndContext,
    PointerSensor,
    DragOverlay,
    closestCenter,
    useSensor,
    useSensors
} from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    arrayMove,
    verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import type { ContentBlock, PhotoBlock, TextBlock, CyclerBlock } from "@/lib/types";

// Update types - only mutable fields
type PhotoBlockUpdate = {
    url?: string;
    width?: number;
    height?: number;
    caption?: {
        text: string;
        position: 'above' | 'below';
    };
};

type TextBlockUpdate = {
    content?: string;
    style?: 'body' | 'italic' | 'quote';
};

type CyclerBlockUpdate = {
    images?: string[];
    interval?: number;
};

interface ContentBlockEditorProps {
    blocks: ContentBlock[];
    onChange: (blocks: ContentBlock[]) => void;
    onPhotoUpload?: (files: File[]) => Promise<string[]>;
}

const ContentBlockEditor: React.FC<ContentBlockEditorProps> = ({
                                                                   blocks,
                                                                   onChange,
                                                                   onPhotoUpload
                                                               }) => {
    const [uploading, setUploading] = useState(false);
    const [editingTextId, setEditingTextId] = useState<string | null>(null);
    const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);

    // Add text block
    const addTextBlock = () => {
        const newBlock: TextBlock = {
            id: `text-${Date.now()}`,
            type: 'text',
            order: blocks.length,
            content: '',
            style: 'body'
        };
        onChange([...blocks, newBlock]);
    };

    const addCyclerBlock = () => {
        const newBlock: CyclerBlock = {
            id: `cycler-${Date.now()}`,
            type: 'cycler',
            order: blocks.length,
            images: [],
            interval: 3000
        };
        onChange([...blocks, newBlock]);
    };

    // Add photo blocks
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!onPhotoUpload) return;
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            const urls = await onPhotoUpload(Array.from(files));
            const newBlocks: PhotoBlock[] = urls.map((url, index) => ({
                id: `photo-${Date.now()}-${index}`,
                type: 'photo',
                order: blocks.length + index,
                url
            }));
            onChange([...blocks, ...newBlocks]);
        } catch (error) {
            console.error('Error uploading photos:', error);
            alert('Failed to upload photos');
        } finally {
            setUploading(false);
        }
    };

    // Update block - type-safe with explicit update types
    const updatePhotoBlock = (id: string, updates: PhotoBlockUpdate) => {
        onChange(blocks.map(block =>
            block.id === id && block.type === 'photo'
                ? { ...block, ...updates }
                : block
        ));
    };

    const updateTextBlock = (id: string, updates: TextBlockUpdate) => {
        onChange(blocks.map(block =>
            block.id === id && block.type === 'text'
                ? { ...block, ...updates }
                : block
        ));
    };

    const updateCyclerBlock = (id: string, updates: CyclerBlockUpdate) => {
        onChange(blocks.map(block =>
            block.id === id && block.type === 'cycler'
                ? { ...block, ...updates }
                : block
        ));
    };

    // Remove block
    const removeBlock = (id: string) => {
        const newBlocks = blocks
            .filter(b => b.id !== id)
            .map((b, index) => ({ ...b, order: index }));
        onChange(newBlocks);
    };

    // Handle drag end
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const [activeId, setActiveId] = useState<string | null>(null);

    const handleDragStart = (event: any) => {
        setActiveId(event.active?.id ?? null);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over || active.id === over.id) return;

        const oldIndex = blocks.findIndex((b) => b.id === active.id);
        const newIndex = blocks.findIndex((b) => b.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = arrayMove(blocks, oldIndex, newIndex).map((item, index) => ({
            ...item,
            order: index
        }));

        onChange(reordered);
    };

    return (
        <div className="space-y-4">
            {/* Add Block Buttons */}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={addTextBlock}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                    + Text Block
                </button>
                <button
                    type="button"
                    onClick={addCyclerBlock}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                    + Image Cycler
                </button>
                {onPhotoUpload && (
                    <label className="px-4 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded cursor-pointer transition-colors">
                        {uploading ? 'Uploading...' : '+ Photo'}
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            disabled={uploading}
                            className="hidden"
                        />
                    </label>
                )}
            </div>

            {/* Drag and Drop List */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={blocks.map((block) => block.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-3 min-h-[100px] p-2 max-w-[520px] mx-auto">
                        <AnimatePresence mode="popLayout">
                            {blocks.map((block, index) => (
                                <SortableBlock
                                    key={block.id}
                                    id={block.id}
                                    index={index}
                                    render={(listeners, attributes) => (
                                        <div className="flex gap-3 p-4">
                                            {/* Drag Handle */}
                                            <DragHandle index={index} listeners={listeners} attributes={attributes} />

                                            {/* Block Content - Type-safe rendering */}
                                            <div className="flex-1">
                                            {block.type === 'photo' ? (
                                                <PhotoBlockEditor
                                                    block={block}
                                                    onUpdate={(updates) => updatePhotoBlock(block.id, updates)}
                                                    onRemove={() => removeBlock(block.id)}
                                                    isEditing={editingPhotoId === block.id}
                                                    onToggleEdit={() =>
                                                        setEditingPhotoId(
                                                            editingPhotoId === block.id ? null : block.id
                                                        )
                                                    }
                                                />
                                            ) : block.type === 'cycler' ? (
                                                <CyclerBlockEditor
                                                    block={block}
                                                    onUpdate={(updates) => updateCyclerBlock(block.id, updates)}
                                                    onRemove={() => removeBlock(block.id)}
                                                    onPhotoUpload={onPhotoUpload}
                                                    availablePhotoUrls={blocks
                                                        .filter(b => b.type === 'photo')
                                                        .map(b => b.url)}
                                                />
                                            ) : (
                                                <TextBlockEditor
                                                    block={block}
                                                    onUpdate={(updates) => updateTextBlock(block.id, updates)}
                                                    onRemove={() => removeBlock(block.id)}
                                                    isEditing={editingTextId === block.id}
                                                    onToggleEdit={() =>
                                                        setEditingTextId(
                                                            editingTextId === block.id ? null : block.id
                                                        )
                                                    }
                                                />
                                            )}
                                        </div>
                                        </div>
                                    )}
                                />
                            ))}
                        </AnimatePresence>

                        {blocks.length === 0 && (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                Add text blocks or photos to get started
                            </div>
                        )}
                    </div>
                </SortableContext>
                {typeof document !== "undefined" &&
                    createPortal(
                        <DragOverlay adjustScale={false} dropAnimation={null}>
                            {activeId ? (
                                <DragPreview block={blocks.find((b) => b.id === activeId) || null} />
                            ) : null}
                        </DragOverlay>,
                        document.body
                    )}
            </DndContext>
        </div>
    );
};

// Photo Block Editor
interface PhotoBlockEditorProps {
    block: PhotoBlock;
    onUpdate: (updates: PhotoBlockUpdate) => void;
    onRemove: () => void;
    isEditing: boolean;
    onToggleEdit: () => void;
}

const PhotoBlockEditor: React.FC<PhotoBlockEditorProps> = ({ block, onUpdate, onRemove, isEditing, onToggleEdit }) => {
    return (
        <div className="space-y-3">
            <div className="relative group">
                <img
                    src={block.url}
                    alt="Preview"
                    onClick={onToggleEdit}
                    className="w-full h-56 object-contain bg-white rounded  cursor-pointer"
                />
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        type="button"
                        onClick={onToggleEdit}
                        className="text-[10px] uppercase tracking-widest bg-white/90 border border-gray-200 px-2 py-1 rounded"
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={onRemove}
                        className="text-[10px] uppercase tracking-widest bg-white/90 border border-gray-200 px-2 py-1 rounded"
                    >
                        X
                    </button>
                </div>
            </div>

            {!isEditing && block.caption?.text && (
                <p className="text-xs italic text-gray-500">
                    {block.caption.text}
                </p>
            )}

            {isEditing && (
                <>
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500">Caption</label>
                        <textarea
                            value={block.caption?.text || ''}
                            onChange={(e) => onUpdate({
                                caption: {
                                    text: e.target.value,
                                    position: block.caption?.position || 'below'
                                }
                            })}
                            placeholder="Enter photo caption..."
                            rows={2}
                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                        />
                    </div>

                    {block.caption?.text && (
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => onUpdate({
                                    caption: { ...block.caption!, position: 'above' }
                                })}
                                className={`px-3 py-1 text-xs rounded transition-colors ${
                                    block.caption.position === 'above'
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Caption Above
                            </button>
                            <button
                                type="button"
                                onClick={() => onUpdate({
                                    caption: { ...block.caption!, position: 'below' }
                                })}
                                className={`px-3 py-1 text-xs rounded transition-colors ${
                                    block.caption.position === 'below'
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Caption Below
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// Text Block Editor
interface TextBlockEditorProps {
    block: TextBlock;
    onUpdate: (updates: TextBlockUpdate) => void;
    onRemove: () => void;
    isEditing: boolean;
    onToggleEdit: () => void;
}

const TextBlockEditor: React.FC<TextBlockEditorProps> = ({ block, onUpdate, onRemove, isEditing, onToggleEdit }) => {
    return (
        <div className="space-y-3">
            {!isEditing ? (
                <div className="relative group">
                    <div className={`text-xs text-gray-800 ${block.style === 'italic' ? 'italic' : ''} ${block.style === 'quote' ? 'pl-4 border-l border-gray-300 italic' : ''}`}>
                        {block.content ? (
                            block.content.split('\n').map((line, i) => (
                                <p key={i} className={i > 0 ? 'mt-3' : ''}>{line}</p>
                            ))
                        ) : (
                            <p className="text-gray-400 italic">Empty text block</p>
                        )}
                    </div>
                    <div className="absolute top-0 right-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            type="button"
                            onClick={onToggleEdit}
                            className="text-[10px] uppercase tracking-widest bg-white/90 border border-gray-200 px-2 py-1 rounded"
                        >
                            Edit
                        </button>
                        <button
                            type="button"
                            onClick={onRemove}
                            className="text-[10px] uppercase tracking-widest bg-white/90 border border-gray-200 px-2 py-1 rounded"
                        >
                            X
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between">
                        <div className="text-[10px] uppercase tracking-widest text-gray-500">Edit Text</div>
                        <button
                            type="button"
                            onClick={onToggleEdit}
                            className="text-xs uppercase tracking-widest text-gray-600 hover:text-gray-900"
                        >
                            Done
                        </button>
                    </div>
                    <textarea
                        value={block.content}
                        onChange={(e) => onUpdate({ content: e.target.value })}
                        placeholder="Enter text content..."
                        rows={4}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                    />

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => onUpdate({ style: 'body' })}
                            className={`px-3 py-1 text-xs rounded transition-colors ${
                                block.style === 'body'
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Body
                        </button>
                        <button
                            type="button"
                            onClick={() => onUpdate({ style: 'italic' })}
                            className={`px-3 py-1 text-xs rounded italic transition-colors ${
                                block.style === 'italic'
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Italic
                        </button>
                        <button
                            type="button"
                            onClick={() => onUpdate({ style: 'quote' })}
                            className={`px-3 py-1 text-xs rounded transition-colors ${
                                block.style === 'quote'
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Quote
                        </button>
                        <button
                            type="button"
                            onClick={onRemove}
                            className="ml-auto text-xs uppercase tracking-widest text-red-600 hover:text-red-700"
                        >
                            Delete
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ContentBlockEditor;

interface SortableBlockProps {
    id: string;
    index: number;
    render: (listeners: any, attributes: any) => ReactNode;
}

const SortableBlock: React.FC<SortableBlockProps> = ({ id, render }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    } as React.CSSProperties;

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`bg-white rounded-lg  transition-all ${
                isDragging ? 'border-1 border-gray-900 shadow-lg' : ''
            }`}
        >
            {render(listeners, attributes)}
        </motion.div>
    );
};

const DragHandle: React.FC<{ index: number; listeners: any; attributes: any }> = ({ index, listeners, attributes }) => {
    return (
        <div
            className="flex-shrink-0 w-8 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            {...listeners}
            {...attributes}
        >
            <img
                src="/drag-handle.png"
                alt="Drag"
                className="w-4 h-10 object-contain opacity-70"
            />
            <div className="text-xs mt-2">{index + 1}</div>
        </div>
    );
};

const DragPreview: React.FC<{ block: ContentBlock | null }> = ({ block }) => {
    if (!block) return null;
    if (block.type === "photo") {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-2 w-[220px]">
                <img src={block.url} alt="" className="w-full h-40 object-contain" />
            </div>
        );
    }
    if (block.type === "cycler") {
        return (
            <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs uppercase tracking-widest text-gray-500">
                Image Cycler
            </div>
        );
    }
    return (
        <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 max-w-[220px]">
            {block.content ? block.content.slice(0, 80) : "Text Block"}
        </div>
    );
};

// Cycler Block Editor
interface CyclerBlockEditorProps {
    block: CyclerBlock;
    onUpdate: (updates: CyclerBlockUpdate) => void;
    onRemove: () => void;
    onPhotoUpload?: (files: File[]) => Promise<string[]>;
    availablePhotoUrls: string[];
}

const CyclerBlockEditor: React.FC<CyclerBlockEditorProps> = ({
    block,
    onUpdate,
    onRemove,
    onPhotoUpload,
    availablePhotoUrls
}) => {
    const [selectedUrl, setSelectedUrl] = useState("");

    const handleAddSelected = () => {
        if (!selectedUrl) return;
        if (block.images.includes(selectedUrl)) return;
        onUpdate({ images: [...block.images, selectedUrl] });
        setSelectedUrl("");
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!onPhotoUpload) return;
        const files = e.target.files;
        if (!files || files.length === 0) return;

        try {
            const urls = await onPhotoUpload(Array.from(files));
            onUpdate({ images: [...block.images, ...urls] });
        } catch (error) {
            console.error('Error uploading images:', error);
            alert('Failed to upload images');
        }
    };

    const removeImage = (url: string) => {
        onUpdate({ images: block.images.filter((img) => img !== url) });
    };

    const intervalValue = typeof block.interval === "number" ? block.interval : 3000;

    const availableOptions = availablePhotoUrls.filter((url) => !block.images.includes(url));

    return (
        <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-medium text-gray-700">Image Cycler</div>
                <button
                    type="button"
                    onClick={onRemove}
                    className="text-red-500 hover:text-red-700 text-sm"
                >
                    Remove
                </button>
            </div>

            {/* Interval */}
            <div className="flex items-center gap-3">
                <label className="text-xs text-gray-600">Interval (ms)</label>
                <input
                    type="number"
                    min={250}
                    step={250}
                    value={intervalValue}
                    onChange={(e) => onUpdate({ interval: Number(e.target.value) || 3000 })}
                    className="w-28 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Add from existing photos */}
            {availableOptions.length > 0 && (
                <div className="flex items-center gap-2">
                    <select
                        value={selectedUrl}
                        onChange={(e) => setSelectedUrl(e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Select existing photo</option>
                        {availableOptions.map((url) => (
                            <option key={url} value={url}>
                                {url}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={handleAddSelected}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                    >
                        Add
                    </button>
                </div>
            )}

            {/* Upload images */}
            {onPhotoUpload && (
                <label className="inline-flex items-center px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded cursor-pointer transition-colors">
                    + Upload Images
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleUpload}
                        className="hidden"
                    />
                </label>
            )}

            {/* Image list */}
            {block.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                    {block.images.map((url) => (
                        <div key={url} className="relative">
                            <img
                                src={url}
                                alt=""
                                className="w-full h-20 object-cover rounded  "
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(url)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-xs text-gray-400">No images yet</div>
            )}
        </div>
    );
};
