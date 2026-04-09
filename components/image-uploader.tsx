'use client';

import { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

interface ImageUploaderProps {
  label: string;
  images: string[];
  maxImages?: number;
  onUpload: (file: File) => Promise<string | null>;
  onRemove: (index: number) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  className?: string;
  hint?: string;
}

export function ImageUploader({
  label,
  images,
  maxImages = 5,
  onUpload,
  onRemove,
  className,
  hint,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (images.length >= maxImages) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length && images.length + i < maxImages; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        await onUpload(file);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [images.length, maxImages, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {hint && <p className="text-xs text-slate-400 -mt-1">{hint}</p>}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, idx) => (
            <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 group">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {images.length < maxImages && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl px-4 py-4 text-center cursor-pointer transition-all duration-200',
            dragOver
              ? 'border-indigo-400 bg-indigo-50'
              : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={maxImages > 1}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
          <p className="text-sm text-slate-500">
            {uploading ? (
              <span className="text-indigo-600">Uploading…</span>
            ) : (
              <>
                <span className="text-indigo-600 font-medium">Click to upload</span>{' '}
                or drag and drop
              </>
            )}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {maxImages === 1 ? 'JPG, PNG, WebP' : `Up to ${maxImages} images · JPG, PNG, WebP`}
          </p>
        </div>
      )}
    </div>
  );
}
