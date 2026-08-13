import React from 'react';

interface IKBrandMarkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
}

export const IKBrandMark: React.FC<IKBrandMarkProps> = ({
  className = '',
  size = 'md',
  glow = false,
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeClasses[size]} ${className}`}>
      {glow && (
        <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-md animate-pulse pointer-events-none" />
      )}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
      >
        <defs>
          <linearGradient id="ikStarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2B65D" />
            <stop offset="50%" stopColor="#C9953C" />
            <stop offset="100%" stopColor="#9A6B1F" />
          </linearGradient>
          <linearGradient id="ikStarInner" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#D9A441" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        
        {/* Diamond / 4-Point Star Base Contour */}
        <path
          d="M50 2 C52 32, 68 48, 98 50 C68 52, 52 68, 50 98 C48 68, 32 52, 2 50 C32 48, 48 32, 50 2 Z"
          fill="url(#ikStarGradient)"
        />
        
        {/* Inner Diamond Core Highlight */}
        <path
          d="M50 22 C51 38, 62 49, 78 50 C62 51, 51 62, 50 78 C49 62, 38 51, 22 50 C38 49, 49 38, 50 22 Z"
          fill="url(#ikStarInner)"
        />
        
        {/* Center Sparkle Node */}
        <circle cx="50" cy="50" r="4" fill="#FFFFFF" />
      </svg>
    </div>
  );
};
