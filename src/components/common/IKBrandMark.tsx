import React from 'react';
import { BrandSymbol } from './BrandLogo.js';

export interface IKBrandMarkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
}

export const IKBrandMark: React.FC<IKBrandMarkProps> = ({
  className = '',
  size = 'md',
}) => {
  return (
    <BrandSymbol
      size={size}
      className={className}
    />
  );
};

