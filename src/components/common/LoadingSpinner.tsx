type SpinnerSize = 'sm' | 'md' | 'lg';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  label?: string;
  className?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
};

function LoadingSpinner({ size = 'md', label, className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div
        className={`animate-spin rounded-full border-rose-500/20 border-t-rose-500 ${sizeClasses[size]}`}
        role="status"
        aria-label={label || 'Loading'}
      />
      {label && (
        <p className="text-sm text-white/50">{label}</p>
      )}
    </div>
  );
}

export default LoadingSpinner;
