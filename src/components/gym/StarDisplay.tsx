interface StarDisplayProps {
  earned: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Star Display Component
 * Shows filled or empty star based on earned status
 */
export function StarDisplay({ earned, size = 'md' }: StarDisplayProps) {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  return (
    <div className={`${sizeClasses[size]} transition-all duration-300`}>
      {earned ? (
        <span className="inline-block animate-pulse">⭐</span>
      ) : (
        <span className="opacity-30">☆</span>
      )}
    </div>
  );
}
