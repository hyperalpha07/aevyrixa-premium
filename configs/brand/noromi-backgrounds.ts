/**
 * Noromi background asset registry.
 *
 * Phase 1 only prepares paths and future page-role assignments. Nothing in this
 * file is applied to the storefront until a later, page-scoped integration.
 * AVIF is listed first, with WebP retained as the fallback format.
 */

export type NoromiBackgroundAsset = Readonly<{
  avif: string;
  webp: string;
  cssImageSet: string;
}>;

function backgroundAsset(filename: string): NoromiBackgroundAsset {
  const basePath = `/brand/noromi/backgrounds/${filename}`;
  const avif = `${basePath}.avif`;
  const webp = `${basePath}.webp`;

  return Object.freeze({
    avif,
    webp,
    cssImageSet: `image-set(url("${avif}") type("image/avif"), url("${webp}") type("image/webp"))`,
  });
}

export const noromiBackgroundAssets = Object.freeze({
  dreamyPlumBlossomSilkGlow: backgroundAsset("dreamy_plum_blossom_silk_glow"),
  dreamyPlumFloralSilkBloom: backgroundAsset("dreamy_plum_floral_silk_bloom"),
  dreamyPlumSilkFloralFrame: backgroundAsset("dreamy_plum_silk_floral_frame"),
  etherealPlumBlossomSilkscape: backgroundAsset("ethereal_plum_blossom_silkscape"),
  etherealPlumFloralRibbonFrame: backgroundAsset("ethereal_plum_floral_ribbon_frame"),
  luxePlumSilkAndPetals: backgroundAsset("luxe_plum_silk_and_petals"),
  mysticalBlossomRibbonJourney: backgroundAsset("mystical_blossom_ribbon_journey"),
  customerFlow01: backgroundAsset("customer-flow-bg-01"),
  customerFlow02: backgroundAsset("customer-flow-bg-02"),
  customerFlow03: backgroundAsset("customer-flow-bg-03"),
  accountFlow01: backgroundAsset("account-flow-bg-01"),
});

/** Proposed page-role mapping for later, separately scoped visual phases. */
export const noromiBackgroundUsage = Object.freeze({
  home: noromiBackgroundAssets.dreamyPlumBlossomSilkGlow,
  shop: noromiBackgroundAssets.dreamyPlumFloralSilkBloom,
  productDetail: noromiBackgroundAssets.etherealPlumBlossomSilkscape,
  cart: noromiBackgroundAssets.customerFlow01,
  checkout: noromiBackgroundAssets.customerFlow02,
  trackOrder: noromiBackgroundAssets.customerFlow03,
  accountLogin: noromiBackgroundAssets.accountFlow01,
  contentSupport: noromiBackgroundAssets.luxePlumSilkAndPetals,
});

