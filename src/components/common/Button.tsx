import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import LoadingSpinner from '@/components/common/LoadingSpinner';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/25 hover:from-rose-600 hover:to-rose-700 focus-visible:ring-rose-500',
  secondary:
    'bg-gray-700 text-white hover:bg-gray-600 focus-visible:ring-gray-500',
  outline:
    'border border-white/10 bg-transparent text-white hover:bg-white/5 focus-visible:ring-white/30',
  ghost:
    'bg-transparent text-white/70 hover:bg-white/5 hover:text-white focus-visible:ring-white/20',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2.5',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    // Omit native drag event handlers that conflict with framer-motion's drag types
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { onDrag, onDragStart, onDragEnd, onAnimationStart, ...restProps } = props;

    return (
      <motion.button
        ref={ref}
        whileHover={isDisabled ? undefined : { scale: 1.02 }}
        whileTap={isDisabled ? undefined : { scale: 0.98 }}
        disabled={isDisabled}
        className={[
          'inline-flex items-center justify-center font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth ? 'w-full' : '',
          isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...restProps}
      >
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : icon ? (
          <span className="flex-shrink-0">{icon}</span>
        ) : null}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
