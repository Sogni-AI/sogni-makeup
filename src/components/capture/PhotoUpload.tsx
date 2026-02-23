import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { validateImageFile } from '@/services/imageProcessing';
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

  const handleUsePhoto = useCallback(() => {
    if (!selectedFile) return;

    try {
      setOriginalImage(selectedFile);
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
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-black">
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
            ? 'border-rose-500/50 bg-rose-500/5'
            : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
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
        <svg
          className={`h-12 w-12 transition-colors ${isDragOver ? 'text-rose-400' : 'text-white/20'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21zm14.25-13.5a1.125 1.125 0 11-2.25 0 1.125 1.125 0 012.25 0z"
          />
        </svg>
        <p className="mt-4 text-sm font-medium text-white/60">
          {isDragOver ? 'Drop your photo here' : 'Drop your photo here or click to browse'}
        </p>
        <p className="mt-2 text-xs text-white/30">
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
          className="mt-4 text-sm text-red-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

export default PhotoUpload;
