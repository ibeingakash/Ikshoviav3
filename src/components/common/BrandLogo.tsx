import React from 'react';
import { brandAssets, BrandLogoVariant, getBrandAssetUrl } from '../../branding/brandAssets.js';

export interface BrandLogoProps {
  variant?: BrandLogoVariant;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  alt?: string;
  onClick?: () => void;
}

const defaultHeights: Record<string, string> = {
  xs: 'h-6',
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-12',
  xl: 'h-16',
  '2xl': 'h-20',
};

/**
 * Reusable IKSHOVIA Brand Logo Component.
 * Ensures strict adherence to brand guidelines:
 * - Proper aspect ratio preserved with object-contain.
 * - Never squashed, stretched, or recolored.
 * - Single source of truth via brandAssets.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  alt = 'IKSHOVIA',
  onClick,
}) => {
  const assetUrl = getBrandAssetUrl(variant);
  const heightClass = defaultHeights[size] || 'h-10';

  return (
    <img
      src={assetUrl}
      alt={alt}
      referrerPolicy="no-referrer"
      onClick={onClick}
      className={`inline-block shrink-0 object-contain w-auto ${heightClass} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      loading="eager"
    />
  );
};

export interface BrandSymbolProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
  onClick?: () => void;
}

const symbolDimensions: Record<string, string> = {
  xs: 'w-5 h-5',
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

/**
 * Reusable IKSHOVIA Brand Symbol / App Icon component.
 * Uses the official 03_IKSHOVIA_App_Icon asset.
 */
export const BrandSymbol: React.FC<BrandSymbolProps> = ({
  size = 'md',
  className = '',
  alt = 'IKSHOVIA Symbol',
  onClick,
}) => {
  const dimensionClass = symbolDimensions[size] || 'w-9 h-9';

  return (
    <img
      src={brandAssets.appIcon}
      alt={alt}
      referrerPolicy="no-referrer"
      onClick={onClick}
      className={`inline-block shrink-0 object-contain rounded-xl ${dimensionClass} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      loading="eager"
    />
  );
};

/**
 * Dedicated Dashboard Logo for authenticated areas and dashboard navigation.
 * Uses 06_IKSHOVIA_Dashboard_Logo.
 */
export const DashboardLogo: React.FC<Omit<BrandLogoProps, 'variant'>> = (props) => {
  return <BrandLogo variant="dashboard" {...props} />;
};

/**
 * Dedicated Login Logo for authentication, signup, and onboarding screens.
 * Uses 05_IKSHOVIA_Login_Logo.
 */
export const LoginLogo: React.FC<Omit<BrandLogoProps, 'variant'>> = (props) => {
  return <BrandLogo variant="login" {...props} />;
};

/**
 * Dedicated PDF Report / Diagnostic Scorecard Logo.
 * Uses 07_IKSHOVIA_PDF_Report_Logo.
 */
export const PdfReportLogo: React.FC<Omit<BrandLogoProps, 'variant'>> = (props) => {
  return <BrandLogo variant="pdf" {...props} />;
};

/**
 * Dedicated Certificate / Official Voucher Logo.
 * Uses 08_IKSHOVIA_Certificate_Logo.
 */
export const CertificateLogo: React.FC<Omit<BrandLogoProps, 'variant'>> = (props) => {
  return <BrandLogo variant="certificate" {...props} />;
};

/**
 * Dedicated Monochrome Dark Logo for paper archives, printouts, and official commission stamps.
 * Uses 10_IKSHOVIA_Monochrome_Dark.
 */
export const MonochromeDarkLogo: React.FC<Omit<BrandLogoProps, 'variant'>> = (props) => {
  return <BrandLogo variant="monochrome-dark" {...props} />;
};

/**
 * Dedicated Monochrome Light Logo for dark mode cards, footers, and inverted banners.
 * Uses 09_IKSHOVIA_Monochrome_Light.
 */
export const MonochromeLightLogo: React.FC<Omit<BrandLogoProps, 'variant'>> = (props) => {
  return <BrandLogo variant="monochrome-light" {...props} />;
};
