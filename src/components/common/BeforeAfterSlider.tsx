import { useState, useRef, useCallback, useEffect } from 'react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  className?: string;
}

function BeforeAfterSlider({ beforeImage, afterImage, className = '' }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [displaySize, setDisplaySize] = useState<{ width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const naturalSizeRef = useRef<{ width: number; height: number } | null>(null);

  // Reset sizing when images change to prevent stale dimensions / FOUC
  useEffect(() => {
    setDisplaySize(null);
    naturalSizeRef.current = null;
  }, [afterImage]);

  // Compute display size that fits within parent while maintaining aspect ratio
  const computeDisplaySize = useCallback(() => {
    const el = containerRef.current;
    const parent = el?.parentElement;
    const nat = naturalSizeRef.current;
    if (!parent || !nat) return;

    const cs = getComputedStyle(parent);
    const availW = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const availH = parent.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const isDesktop = availW >= 768;
    const scale = Math.min(availW / nat.width, availH / nat.height, 1) * (isDesktop ? 0.90 : 1);

    setDisplaySize({
      width: Math.round(nat.width * scale),
      height: Math.round(nat.height * scale),
    });
  }, []);

  // Recompute on parent resize
  useEffect(() => {
    const parent = containerRef.current?.parentElement;
    if (!parent) return;

    const observer = new ResizeObserver(() => computeDisplaySize());
    observer.observe(parent);
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Capture natural image dimensions on load
  const handleAfterImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    naturalSizeRef.current = { width: img.naturalWidth, height: img.naturalHeight };
    computeDisplaySize();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      updatePosition(e.clientX);
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setIsDragging(true);
      updatePosition(e.touches[0].clientX);
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      updatePosition(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      updatePosition(e.touches[0].clientX);
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      className={`relative cursor-col-resize select-none overflow-hidden rounded-2xl transition-opacity duration-300 ${displaySize ? 'opacity-100' : 'opacity-0'} ${className}`}
      style={{
        touchAction: 'none',
        ...(displaySize ? { width: displaySize.width, height: displaySize.height } : {}),
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      role="slider"
      aria-label="Before and after comparison slider"
      aria-valuenow={Math.round(sliderPosition)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') setSliderPosition((p) => Math.max(0, p - 2));
        if (e.key === 'ArrowRight') setSliderPosition((p) => Math.min(100, p + 2));
      }}
    >
      {/* After image (fills computed container) */}
      <img
        src={afterImage}
        alt="After transformation"
        className="block h-full w-full object-cover"
        onLoad={handleAfterImageLoad}
        draggable={false}
      />

      {/* Before image (clipped overlay — same size as after) */}
      <img
        src={beforeImage}
        alt="Before transformation"
        className="absolute inset-0 block h-full w-full object-cover"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        draggable={false}
      />

      {/* Divider line */}
      <div
        className="absolute bottom-0 top-0 z-10 w-px bg-primary-300/80 shadow-lg"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        {/* Drag handle */}
        <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary-300/50 bg-surface-950/80 shadow-xl backdrop-blur-sm">
          <svg className="h-5 w-5 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-3 left-3 z-10 rounded-lg bg-surface-950/70 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-white/70 backdrop-blur-sm">
        Before
      </div>
      <div className="absolute bottom-3 right-3 z-10 rounded-lg bg-surface-950/70 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-white/70 backdrop-blur-sm">
        After
      </div>
    </div>
  );
}

export default BeforeAfterSlider;
