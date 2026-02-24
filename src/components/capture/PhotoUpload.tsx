import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { validateImageFile, cropToPortrait } from '@/services/imageProcessing';
import Button from '@/components/common/Button';

function PhotoUpload() {
  const { setOriginalImage, setCurrentView } = useApp();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clean up Object URL when component unmounts or previewUrl changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFile = useCallback((file: File) => {
    setError(null);
    const validation = validateImageFile(file);

    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      addToast('error', validation.error || 'Invalid file');
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedFile(file);
  }, [addToast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleUsePhoto = useCallback(async () => {
    if (!selectedFile) return;

    try {
      const cropped = await cropToPortrait(selectedFile);
      setOriginalImage(cropped);
      setCurrentView('studio');
    } catch {
      addToast('error', 'Failed to process image. Please try a different photo.');
    }
  }, [selectedFile, setOriginalImage, setCurrentView, addToast]);

  const handleChooseDifferent = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl]);

  if (previewUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center"
      >
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-primary-400/10 bg-surface-950 warm-glow">
          <img
            src={previewUrl}
            alt="Selected photo preview"
            className="w-full rounded-2xl"
          />
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Button variant="outline" onClick={handleChooseDifferent}>
            Choose Different
          </Button>
          <Button variant="primary" onClick={handleUsePhoto}>
            Use This Photo
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex w-full max-w-md cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all ${
          isDragOver
            ? 'border-primary-400/40 bg-primary-400/[0.04]'
            : 'border-primary-400/[0.08] bg-surface-900/30 hover:border-primary-400/15 hover:bg-surface-900/50'
        }`}
        role="button"
        tabIndex={0}
        aria-label="Upload a photo"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            fileInputRef.current?.click();
          }
        }}
      >
        {/* Geometric upload icon */}
        <div className={`relative transition-colors ${isDragOver ? 'text-primary-300' : 'text-white/15'}`}>
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-current">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
        </div>
        <p className="mt-5 text-sm font-medium text-white/50">
          {isDragOver ? 'Drop your photo here' : (
            <>
              <span className="hidden sm:inline">Drop your photo here or click to browse</span>
              <span className="sm:hidden">Tap to choose a photo</span>
            </>
          )}
        </p>
        <p className="mt-2 text-xs text-white/25">
          JPG, PNG, or WebP up to 10MB
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-sm text-secondary-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

export default PhotoUpload;
