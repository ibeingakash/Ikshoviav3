import React from 'react';
import { IKBrandMark } from './IKBrandMark.js';

interface IKLogoProps {
  variant?: 'light' | 'dark';
  showTagline?: boolean;
  taglineText?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export const IKLogo: React.FC<IKLogoProps> = ({
  variant = 'light', // 'light' background = dark text; 'dark' background = white text
  showTagline = true,
  taglineText = "Unlock Human Potential Through Understanding",
  size = 'md',
  onClick,
  className = '',
}) => {
  const isDark = variant === 'dark';

  const markSizes = {
    sm: 'sm' as const,
    md: 'md' as const,
    lg: 'lg' as const,
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl sm:text-3xl',
  };

  const taglineSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className={`p-1 rounded-xl ${isDark ? 'bg-[#17132B]/80 border border-amber-500/30' : 'bg-[#0C1024] border border-amber-500/20'} shadow-xs`}>
        <IKBrandMark size={markSizes[size]} glow={isDark} />
      </div>

      <div className="flex flex-col">
        <span
          className={`font-serif-editorial font-bold tracking-tight leading-none ${
            textSizes[size]
          } ${isDark ? 'text-white' : 'text-[#111426]'}`}
        >
          IKSHOVIA
        </span>

        {showTagline && (
          <span
            className={`font-serif-editorial italic font-medium tracking-wide mt-0.5 hidden sm:inline truncate max-w-[280px] ${
              taglineSizes[size]
            } ${isDark ? 'text-amber-300/90' : 'text-[#8A6721]'}`}
          >
            {taglineText}
          </span>
        )}
      </div>
    </div>
  );
};
