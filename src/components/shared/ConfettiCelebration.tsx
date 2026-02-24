import React, { useEffect, useState, useMemo, useCallback } from 'react';
import './ConfettiCelebration.css';

interface ConfettiCelebrationProps {
  isVisible: boolean;
  onComplete?: () => void;
}

interface ConfettiPiece {
  id: string;
  left: number;
  delay: number;
  duration: number;
  color: string;
  shape: 'square' | 'circle' | 'triangle';
  size: number;
  rotationSpeed: number;
  horizontalDrift: number;
}

const CONFETTI_COLORS = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
  '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd',
  '#00d2d3', '#ff9f43', '#10ac84', '#ee5a24',
  '#0984e3', '#a29bfe', '#fd79a8', '#fdcb6e'
];

const ConfettiCelebration: React.FC<ConfettiCelebrationProps> = ({
  isVisible,
  onComplete
}) => {
  const [animationKey, setAnimationKey] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);

  const confettiPieces = useMemo(() => {
    if (!isVisible || !animationKey) return [];

    const pieces: ConfettiPiece[] = [];
    const numPieces = 50;

    for (let i = 0; i < numPieces; i++) {
      pieces.push({
        id: `${animationKey}-${i}`,
        left: Math.random() * 100,
        delay: Math.random() * 1500,
        duration: 2500 + Math.random() * 1500,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        shape: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'circle' : 'triangle') : 'square',
        size: 6 + Math.random() * 8,
        rotationSpeed: 360 + Math.random() * 720,
        horizontalDrift: (Math.random() - 0.5) * 60
      });
    }

    return pieces;
  }, [isVisible, animationKey]);

  const handleComplete = useCallback(() => {
    setIsAnimating(false);
    setAnimationKey('');
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    if (isVisible && !isAnimating) {
      const newKey = `confetti-${Date.now()}-${Math.random()}`;
      setAnimationKey(newKey);
      setIsAnimating(true);

      const timeout = setTimeout(() => {
        handleComplete();
      }, 5000);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [isVisible, isAnimating, handleComplete]);

  useEffect(() => {
    if (!isVisible && isAnimating) {
      setIsAnimating(false);
      setAnimationKey('');
    }
  }, [isVisible, isAnimating]);

  if (!isAnimating || confettiPieces.length === 0) return null;

  return (
    <div className="confetti-container">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className={`confetti-piece confetti-${piece.shape}`}
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.shape === 'triangle' ? 'transparent' : piece.color,
            color: piece.shape === 'triangle' ? piece.color : undefined,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            '--animation-delay': `${piece.delay}ms`,
            '--animation-duration': `${piece.duration}ms`,
            '--rotation-speed': `${piece.rotationSpeed}deg`,
            '--horizontal-drift': `${piece.horizontalDrift}px`,
            '--size': `${piece.size}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export default React.memo(ConfettiCelebration);
