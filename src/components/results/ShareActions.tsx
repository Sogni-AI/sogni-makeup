import { useCallback } from 'react';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/common/Button';

interface ShareActionsProps {
  resultUrl: string;
  onTryAnother: () => void;
}

function ShareActions({ resultUrl, onTryAnother }: ShareActionsProps) {
  const { addToast } = useToast();

  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(resultUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `sogni-makeover-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      addToast('success', 'Image downloaded!');
    } catch {
      window.open(resultUrl, '_blank');
      addToast('info', 'Opened image in new tab');
    }
  }, [resultUrl, addToast]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        const response = await fetch(resultUrl);
        const blob = await response.blob();
        const file = new File([blob], 'sogni-makeover.jpg', { type: 'image/jpeg' });

        await navigator.share({
          title: 'My Sogni Makeover',
          text: 'Check out my AI makeover!',
          files: [file],
        });
      } catch (err) {
        const error = err as Error;
        if (error.name !== 'AbortError') {
          addToast('info', 'Share cancelled');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        addToast('success', 'Link copied to clipboard!');
      } catch {
        addToast('error', 'Unable to share or copy link');
      }
    }
  }, [resultUrl, addToast]);

  return (
    <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
      <Button
        variant="outline"
        onClick={handleDownload}
        icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        }
      >
        Download
      </Button>

      <Button
        variant="outline"
        onClick={handleShare}
        icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
        }
      >
        Share
      </Button>

      <Button variant="primary" onClick={onTryAnother}>
        Try Another Look
      </Button>
    </div>
  );
}

export default ShareActions;
