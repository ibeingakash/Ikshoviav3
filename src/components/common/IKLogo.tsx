import React from 'react';
import { BrandLogo } from './BrandLogo.js';
import { BrandLogoVariant } from '../../branding/brandAssets.js';

export interface IKLogoProps {
  variant?: 'light' | 'dark' | BrandLogoVariant;
  showTagline?: boolean;
  taglineText?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

/**
 * IKLogo facade component maintaining backwards compatibility while routing
 * directly to the official IKSHOVIA single source of truth brand assets.
 */
export const IKLogo: React.FC<IKLogoProps> = ({
  variant = 'light',
  showTagline = true,
  size = 'md',
  onClick,
  className = '',
}) => {
  // Map historical light/dark variant to the official asset mapping:
  let resolvedVariant: BrandLogoVariant = 'dashboard';
  if (variant === 'dark') {
    resolvedVariant = showTagline ? 'primary' : 'horizontal';
  } else if (variant === 'light') {
    resolvedVariant = showTagline ? 'login' : 'dashboard';
  } else {
    resolvedVariant = variant as BrandLogoVariant;
  }

  const sizeMap: Record<string, 'sm' | 'md' | 'lg'> = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
  };

  return (
    <BrandLogo
      variant={resolvedVariant}
      size={sizeMap[size] || 'md'}
      onClick={onClick}
      className={className}
    />
  );
};

