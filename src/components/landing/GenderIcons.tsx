interface GenderIconProps {
  className?: string;
}

export function VenusIcon({ className = '' }: GenderIconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Circle */}
      <circle cx="50" cy="38" r="24" stroke="currentColor" strokeWidth="2.5" />
      {/* Vertical line */}
      <line x1="50" y1="62" x2="50" y2="88" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Horizontal cross */}
      <line x1="38" y1="76" x2="62" y2="76" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function MarsIcon({ className = '' }: GenderIconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Circle */}
      <circle cx="40" cy="52" r="24" stroke="currentColor" strokeWidth="2.5" />
      {/* Diagonal arrow line */}
      <line x1="57" y1="35" x2="76" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Arrow head horizontal */}
      <line x1="76" y1="16" x2="62" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Arrow head vertical */}
      <line x1="76" y1="16" x2="76" y2="30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
