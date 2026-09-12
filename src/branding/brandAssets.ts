/**
 * Centralized Single Source of Truth for IKSHOVIA Brand Assets.
 * Adheres strictly to official brand guidelines:
 * - Never stretch or squash logos (preserve exact aspect-ratio).
 * - Always use object-fit: contain.
 * - Single point of configuration for all application contexts.
 */

export const brandAssets = {
  primaryLogo: '/branding/01_IKSHOVIA_Primary_Logo_White.png',
  horizontalLogo: '/branding/02_IKSHOVIA_Horizontal_Logo_White.png',
  appIcon: '/branding/03_IKSHOVIA_App_Icon.png',
  favicon: '/branding/04_IKSHOVIA_Favicon.png',
  loginLogo: '/branding/05_IKSHOVIA_Login_Logo.png',
  dashboardLogo: '/branding/06_IKSHOVIA_Dashboard_Logo.png',
  pdfLogo: '/branding/07_IKSHOVIA_PDF_Report_Logo.png',
  certificateLogo: '/branding/08_IKSHOVIA_Certificate_Logo.png',
  monochromeLight: '/branding/09_IKSHOVIA_Monochrome_Light.png',
  monochromeDark: '/branding/10_IKSHOVIA_Monochrome_Dark.png',
} as const;

export type BrandLogoVariant =
  | 'primary'
  | 'horizontal'
  | 'login'
  | 'dashboard'
  | 'pdf'
  | 'certificate'
  | 'monochrome-light'
  | 'monochrome-dark'
  | 'app-icon'
  | 'favicon';

/**
 * Helper to get the canonical asset URL for any variant.
 */
export function getBrandAssetUrl(variant: BrandLogoVariant): string {
  switch (variant) {
    case 'primary':
      return brandAssets.primaryLogo;
    case 'horizontal':
      return brandAssets.horizontalLogo;
    case 'login':
      return brandAssets.loginLogo;
    case 'dashboard':
      return brandAssets.dashboardLogo;
    case 'pdf':
      return brandAssets.pdfLogo;
    case 'certificate':
      return brandAssets.certificateLogo;
    case 'monochrome-light':
      return brandAssets.monochromeLight;
    case 'monochrome-dark':
      return brandAssets.monochromeDark;
    case 'app-icon':
      return brandAssets.appIcon;
    case 'favicon':
      return brandAssets.favicon;
    default:
      return brandAssets.primaryLogo;
  }
}
