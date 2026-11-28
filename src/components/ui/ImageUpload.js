'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

export default function ImageUpload({
  value,
  onChange,
  onPublicIdChange,
  label = 'Product / Item Photo',
  folder = 'inventory',
  disabled = false,
  className = '',
  aspectRatio = 'square',
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a JPG, PNG, or WebP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5MB.');
      return;
    }

    setError(null);
    setImgError(false);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Call onChange with both url and publicId atomically
      if (onChange) onChange(data.url, data.publicId);
      if (onPublicIdChange && data.publicId) onPublicIdChange(data.publicId);
    } catch (err) {
      console.error('Image upload error:', err);
      setError(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled || loading) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !loading) setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (disabled || loading) return;
    setImgError(false);
    if (onChange) onChange('', '');
    if (onPublicIdChange) onPublicIdChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isCloudinary = value && (value.includes('cloudinary.com') || value.includes('res.cloudinary'));
  const isLocal = value && value.startsWith('/uploads/');

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-text-secondary mb-1.5 flex items-center justify-between">
          <span>{label}</span>
          {isCloudinary && (
            <span className="text-[10px] font-medium text-cyan-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Cloudinary Active
            </span>
          )}
        </label>
      )}

      <div
        onClick={() => !disabled && !loading && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden
          ${dragActive
            ? 'border-primary bg-primary/10 scale-[1.01] shadow-lg'
            : 'border-border hover:border-primary/50 hover:shadow-sm bg-black/[0.02] dark:bg-white/[0.04]'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${aspectRatio === 'video' ? 'aspect-video' : 'aspect-square max-w-[210px]'}
          flex flex-col items-center justify-center p-2.5 text-center backdrop-blur-xl group
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          className="hidden"
          disabled={disabled || loading}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        {value && !imgError ? (
          <div className="relative w-full h-full rounded-xl overflow-hidden group">
            {/* The Image */}
            <img
              src={value}
              alt="Uploaded photo"
              className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgError(true)}
            />

            {/* Cloudinary or Local Pill Badge */}
            {/* {isCloudinary ? (
              <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950/85 border border-cyan-400/40 text-cyan-300 backdrop-blur-md flex items-center gap-1.5 shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Cloudinary
              </div>
            ) : isLocal ? (
              <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/85 border border-amber-400/40 text-amber-300 backdrop-blur-md flex items-center gap-1.5 shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Local
              </div>
            ) : null} */}

            {/* Hover Actions Overlay */}
            <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-xl flex items-center justify-center gap-2 backdrop-blur-xs">
              <span title='Change photo' className="text-white text-xs font-semibold bg-white/15 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/25 flex items-center gap-1 hover:bg-white/25 transition-colors">
                <RefreshCw className="h-4 w-4" />
              </span>
              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 bg-rose-600/90 text-white rounded-lg hover:bg-rose-600 transition-colors shadow-md border border-rose-400/30"
                title="Remove photo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center p-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <p className="text-xs text-cyan-300 font-semibold mt-3">Uploading to Cloud...</p>
            <p className="text-[10px] text-text-muted mt-0.5">Auto-optimizing format</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-2.5 border border-cyan-500/25 group-hover:scale-110 group-hover:bg-cyan-500/20 group-hover:shadow-[0_0_15px_rgba(0,168,178,0.3)] transition-all duration-200">
              <Upload className="h-5 w-5" />
            </div>
            {/* <p className="text-xs font-bold text-text-main group-hover:text-primary dark:group-hover:text-cyan-300 transition-colors">
              Upload Item Photo
            </p> */}
            <p className="text-[10px] text-text-muted  leading-tight">
              Drag & drop or browse<br />
              {/* <span className="text-cyan-400/80">Permanent Cloudinary Storage</span> */}
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1 font-medium bg-rose-500/10 border border-rose-500/20 rounded-lg px-2.5 py-1">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
