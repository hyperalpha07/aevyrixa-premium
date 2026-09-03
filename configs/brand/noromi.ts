export const brandName = "Noromi Care";
export const brandShortName = "Noromi";
export const brandTagline = "Comfort. Confidence. Care.";

export const noromiAssets = {
  logoFullStacked: "/brand/noromi/logo-full-stacked.png",
  logoHorizontal: "/brand/noromi/logo-horizontal.png",
  logoMarkDetailed: "/brand/noromi/logo-mark-detailed.png",
  logoWhite: "/brand/noromi/logo-white.png",
  logoMark: "/brand/noromi/logo-mark.png",
  appIcon: "/brand/noromi/app-icon.png",
  heroBanner: "/brand/noromi/hero-banner.png",
  coverBannerWide: "/brand/noromi/cover-banner-wide.png",
} as const;

export const pink = "#FF4F91";
export const magenta = "#E6008D";
export const purple = "#8A14C7";
export const lavender = "#E9D8FF";
export const blush = "#FFF0F6";
export const goldAccent = "#D6A84B";
export const deepPurple = "#3B0A59";
export const softBackground = "#FCF7FD";

export const noromiColors = {
  pink,
  magenta,
  purple,
  lavender,
  blush,
  goldAccent,
  deepPurple,
  softBackground,
} as const;

export const noromiBrand = {
  name: brandName,
  shortName: brandShortName,
  tagline: brandTagline,
  assets: noromiAssets,
  colors: noromiColors,
} as const;
