import type {
  OrderSource,
  OrderStatus,
  PaymentVerificationStatus,
  ProofReceivedStatus,
} from "@/app/lib/order-types";

export const ADMIN_SETTINGS_KEY = "aevyrixa-admin-settings";

export const walletProviders = ["bKash", "Nagad", "Rocket", "Upay"] as const;

export type WalletProvider = (typeof walletProviders)[number];
export type StoreStatus = "live" | "maintenance" | "coming_soon";

export type StoreProfileSettings = {
  storeName: string;
  brandSubtitle: string;
  businessLocation: string;
  supportPhone: string;
  supportWhatsApp: string;
  supportEmail: string;
  supportAgentImageUrl: string;
  facebookPageUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  footerShortDescription: string;
  showFooterLegalLinks: boolean;
  showSocialIcons: boolean;
  showWhatsAppFooterIcon: boolean;
  liveSupportMode: "off" | "live_chat" | "whatsapp" | "both";
  storeStatus: StoreStatus;
};

export type PaymentSettings = {
  codEnabled: boolean;
  codMessage: string;
  bkashEnabled: boolean;
  bkashReceiverNumber: string;
  nagadEnabled: boolean;
  nagadReceiverNumber: string;
  rocketEnabled: boolean;
  rocketReceiverNumber: string;
  upayEnabled: boolean;
  upayReceiverNumber: string;
  bankTransferEnabled: boolean;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankBranch: string;
  bankRoutingNumber: string;
  bankTransferInstruction: string;
  paymentConfirmationInstruction: string;
};

export type CheckoutSettings = {
  checkoutHeaderText: string;
  checkoutSupportMessage: string;
  orderConfirmationMessage: string;
  orderReviewMessage: string;
  cartEmptyMessage: string;
  minimumOrderAmount: string;
  freeDeliveryThreshold: string;
  requireCustomerAccountForCheckout: boolean;
};

export type DeliverySettings = {
  deliveryCoverageText: string;
  defaultDeliveryCharge: string;
  insideDhakaDeliveryCharge: string;
  outsideDhakaDeliveryCharge: string;
  courierPartners: string;
  defaultCourier: CourierOption;
  courierIntegrationMode: CourierIntegrationMode;
  autoCourierBookingEnabled: boolean;
  autoTrackingSyncEnabled: boolean;
  courierApiReadyNote: string;
  estimatedDeliveryTime: string;
  dispatchConfirmationMessage: string;
  trackingSupportMessage: string;
};

export const courierOptions = [
  "Not selected",
  "Pathao",
  "Steadfast",
  "RedX",
  "Paperfly",
  "eCourier",
  "Sundarban Courier",
  "SA Paribahan",
  "Custom",
] as const;

export const courierIntegrationModes = [
  "manual",
  "pathao",
  "steadfast",
  "redx",
  "custom",
] as const;

export type CourierOption = (typeof courierOptions)[number];
export type CourierIntegrationMode = (typeof courierIntegrationModes)[number];

export type PolicySettings = {
  hygieneSafeSupportMessage: string;
  refundExchangeCondition: string;
  unusedUnwashedCondition: string;
  originalPackagingHygieneSealMessage: string;
  sizeCheckingInstruction: string;
  privacyPackagingMessage: string;
  noMedicalClaimsNotice: string;
};

export type OrderSettings = {
  defaultOrderStatus: OrderStatus;
  defaultOrderSource: OrderSource;
  defaultAssignedStaff: string;
  defaultPaymentVerificationStatus: PaymentVerificationStatus;
  proofRequiredDefault: ProofReceivedStatus;
  autoCancelPendingAfterDays: string;
  lowStockAlertThreshold: string;
  orderIdPrefix: string;
};

export type NotificationSettings = {
  telegramNewOrderEnabled: boolean;
  telegramStatusUpdateEnabled: boolean;
  orderConfirmationMessageTemplate: string;
  shippedMessageTemplate: string;
  deliveredMessageTemplate: string;
  cancelledMessageTemplate: string;
  telegramChatStatus: string;
};

export type SeoSettings = {
  homepageSeoTitle: string;
  homepageMetaDescription: string;
  defaultProductSeoSuffix: string;
  facebookPixelId: string;
  tiktokPixelId: string;
  googleAnalyticsId: string;
  openGraphImageUrl: string;
};

export type AppearanceSettings = {
  brandAccentColor: string;
  heroBadgeText: string;
  homepageHeroTitle: string;
  homepageHeroSubtitle: string;
  primaryCtaText: string;
  secondaryCtaText: string;
  announcementBarEnabled: boolean;
  announcementBarText: string;
  enableAnnouncement: boolean;
  announcementText: string;
  announcementLinkLabel: string;
  announcementLinkUrl: string;
  announcementStyle: "info" | "promo" | "warning" | "success";
  showOnHomepage: boolean;
  showOnShop: boolean;
  showOnProductPages: boolean;
  showOnCheckout: boolean;
};

export type WidgetPlacement = "homepage" | "all" | "product" | "support" | "cart";
export type LayerComfortMediaMode = "animation" | "image_text" | "video_text" | "background_media_text" | "media_only";

export type HomepageSectionMedia = {
  mode: "animation" | "image" | "video";
  imageUrl: string;
  videoUrl: string;
  altText: string;
  eyebrow: string;
  heading: string;
  subheading: string;
  ctaText: string;
  ctaLink: string;
};

export type HomepageCategoryState = "active" | "coming_soon" | "hidden";
export type HomepageCategoryMediaMode = LayerComfortMediaMode;
export type CtaSectionMediaMode = "no_media" | "image_text" | "video_text" | "background_media_text";

export type HomepageMediaSettings = {
  showHero: boolean;
  showTrustStrip: boolean;
  showStatStrip: boolean;
  showMarquee: boolean;
  showCategories: boolean;
  showFeaturedProducts: boolean;
  showStorySections: boolean;
  showTestimonials: boolean;
  showFAQ: boolean;
  showBottomCTA: boolean;
  splashEnabled: boolean;
  splashTitle: string;
  splashLogoUrl: string;
  statItem1Value: string;
  statItem1Label: string;
  statItem2Value: string;
  statItem2Label: string;
  statItem3Value: string;
  statItem3Label: string;
  marqueeItems: string;
  featuredProductsEyebrow: string;
  featuredProductsHeading: string;
  featuredProductsDescription: string;
  collectionsEyebrow: string;
  collectionsHeading: string;
  collectionsDescription: string;
  heroMedia: HomepageSectionMedia;
  careMedia: HomepageSectionMedia;
  experienceMedia: HomepageSectionMedia;
  categoryReusablePeriodCare: HomepageCategoryState;
  categoryReusablePeriodCareImageUrl: string;
  categoryReusablePeriodCareVideoUrl: string;
  categoryReusablePeriodCareMediaMode: HomepageCategoryMediaMode;
  categoryReusablePeriodCareAltText: string;
  categoryReusablePeriodCareTitle: string;
  categoryReusablePeriodCareDescription: string;
  categoryReusablePeriodCareLinkUrl: string;
  categoryComfortPanty: HomepageCategoryState;
  categoryComfortPantyImageUrl: string;
  categoryComfortPantyVideoUrl: string;
  categoryComfortPantyMediaMode: HomepageCategoryMediaMode;
  categoryComfortPantyAltText: string;
  categoryComfortPantyTitle: string;
  categoryComfortPantyDescription: string;
  categoryComfortPantyLinkUrl: string;
  categorySoftSupportBra: HomepageCategoryState;
  categorySoftSupportBraImageUrl: string;
  categorySoftSupportBraVideoUrl: string;
  categorySoftSupportBraMediaMode: HomepageCategoryMediaMode;
  categorySoftSupportBraAltText: string;
  categorySoftSupportBraTitle: string;
  categorySoftSupportBraDescription: string;
  categorySoftSupportBraLinkUrl: string;
  categoryNightwear: HomepageCategoryState;
  categoryNightwearImageUrl: string;
  categoryNightwearVideoUrl: string;
  categoryNightwearMediaMode: HomepageCategoryMediaMode;
  categoryNightwearAltText: string;
  categoryNightwearTitle: string;
  categoryNightwearDescription: string;
  categoryNightwearLinkUrl: string;
  categoryHygieneEssentials: HomepageCategoryState;
  categoryHygieneEssentialsImageUrl: string;
  categoryHygieneEssentialsVideoUrl: string;
  categoryHygieneEssentialsMediaMode: HomepageCategoryMediaMode;
  categoryHygieneEssentialsAltText: string;
  categoryHygieneEssentialsTitle: string;
  categoryHygieneEssentialsDescription: string;
  categoryHygieneEssentialsLinkUrl: string;
  categoryBundles: HomepageCategoryState;
  categoryBundlesImageUrl: string;
  categoryBundlesVideoUrl: string;
  categoryBundlesMediaMode: HomepageCategoryMediaMode;
  categoryBundlesAltText: string;
  categoryBundlesTitle: string;
  categoryBundlesDescription: string;
  categoryBundlesLinkUrl: string;
  categoryNewArrivals: HomepageCategoryState;
  categoryNewArrivalsImageUrl: string;
  categoryNewArrivalsVideoUrl: string;
  categoryNewArrivalsMediaMode: HomepageCategoryMediaMode;
  categoryNewArrivalsAltText: string;
  categoryNewArrivalsTitle: string;
  categoryNewArrivalsDescription: string;
  categoryNewArrivalsLinkUrl: string;
  categoryReusablePeriodCareSortOrder: string;
  categoryComfortPantySortOrder: string;
  categorySoftSupportBraSortOrder: string;
  categoryNightwearSortOrder: string;
  categoryHygieneEssentialsSortOrder: string;
  categoryBundlesSortOrder: string;
  categoryNewArrivalsSortOrder: string;
  whatsappWidgetEnabled: boolean;
  whatsappWidgetLabel: string;
  whatsappWidgetLiveText: string;
  whatsappWidgetPlacement: WidgetPlacement;
  liveChatEnabled: boolean;
  liveChatLabel: string;
  liveChatLink: string;
  liveChatPlacement: WidgetPlacement;
  ctaSectionEnabled: boolean;
  ctaSectionEyebrow: string;
  ctaSectionHeading: string;
  ctaSectionDescription: string;
  ctaSectionPrimaryCtaText: string;
  ctaSectionPrimaryCtaLink: string;
  ctaSectionSecondaryCtaText: string;
  ctaSectionSecondaryCtaLink: string;
  ctaSectionMediaMode: CtaSectionMediaMode;
  ctaSectionImageUrl: string;
  ctaSectionVideoUrl: string;
  ctaSectionAltText: string;
  layerComfortEnabled: boolean;
  layerComfortEyebrow: string;
  layerComfortHeading: string;
  layerComfortDescription: string;
  layerComfortLayer1Title: string;
  layerComfortLayer1Description: string;
  layerComfortLayer2Title: string;
  layerComfortLayer2Description: string;
  layerComfortLayer3Title: string;
  layerComfortLayer3Description: string;
  layerComfortCtaText: string;
  layerComfortCtaLink: string;
  layerComfortMediaMode: LayerComfortMediaMode;
  layerComfortImageUrl: string;
  layerComfortVideoUrl: string;
  layerComfortAltText: string;
  findCareEnabled: boolean;
  findCareEyebrow: string;
  findCareHeading: string;
  findCareDescription: string;
  findCareCtaText: string;
  findCareCtaLink: string;
  findCareCard1Title: string;
  findCareCard1Description: string;
  findCareCard1LinkUrl: string;
  findCareCard2Title: string;
  findCareCard2Description: string;
  findCareCard2LinkUrl: string;
  findCareCard3Title: string;
  findCareCard3Description: string;
  findCareCard3LinkUrl: string;
  faqPreviewEyebrow: string;
  faqPreviewHeading: string;
  faqPreviewItem1Question: string;
  faqPreviewItem1Answer: string;
  faqPreviewItem2Question: string;
  faqPreviewItem2Answer: string;
  faqPreviewItem3Question: string;
  faqPreviewItem3Answer: string;
  shopHeroEnabled: boolean;
  shopHeroEyebrow: string;
  shopHeroTitle: string;
  shopHeroSubtitle: string;
  shopHeroPrimaryCtaText: string;
  shopHeroPrimaryCtaLink: string;
  shopHeroSecondaryCtaText: string;
  shopHeroSecondaryCtaLink: string;
  shopHeroMediaUrl: string;
  shopHeroMediaType: "image" | "video" | "auto";
  shopHeroMediaAlt: string;
  shopHeroBadge1: string;
  shopHeroBadge2: string;
  shopHeroCaption: string;
  shopHeroTrust1Label: string;
  shopHeroTrust1Description: string;
  shopHeroTrust2Label: string;
  shopHeroTrust2Description: string;
  shopHeroTrust3Label: string;
  shopHeroTrust3Description: string;
};

export type AdvancedSettings = {
  maintenanceMode: boolean;
  testMode: boolean;
  debugMode: boolean;
  purgeDeletedProductsAfterDays: string;
  systemVersionLabel: string;
  backupReminderText: string;
};

export type AdminSettingsGroups = {
  storeProfile: StoreProfileSettings;
  paymentSettings: PaymentSettings;
  checkoutSettings: CheckoutSettings;
  deliverySettings: DeliverySettings;
  policySettings: PolicySettings;
  orderSettings: OrderSettings;
  notificationSettings: NotificationSettings;
  seoSettings: SeoSettings;
  appearanceSettings: AppearanceSettings;
  advancedSettings: AdvancedSettings;
  homepageMediaSettings: HomepageMediaSettings;
};

export type AdminSettings = AdminSettingsGroups & {
  storeName: string;
  supportPhone: string;
  supportWhatsApp: string;
  supportEmail: string;
  facebookPageUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  businessLocation: string;
  deliveryCoverageText: string;
  codMessage: string;
  privacyPackagingMessage: string;
  supportWindowMessage: string;
  hygieneReturnMessage: string;
  orderConfirmationMessage: string;
  guaranteeText: string;
  deliveryNote: string;
  walletReceiverNumbers: Record<WalletProvider, string>;
  bankTransferInstruction: string;
  codInstruction: string;
};

type UnknownRecord = Record<string, unknown>;

const defaultGroups: AdminSettingsGroups = {
  storeProfile: {
    storeName: "Aevyrixa Her Care",
    brandSubtitle: "Premium women's comfort, hygiene & reusable care for Bangladesh",
    businessLocation: "Dhaka, Bangladesh",
    supportPhone: "01644037384",
    supportWhatsApp: "01644037384",
    supportEmail: "support@aevyrixa.com",
    supportAgentImageUrl: "",
    facebookPageUrl: "",
    instagramUrl: "",
    tiktokUrl: "",
    youtubeUrl: "",
    footerShortDescription: "",
    showFooterLegalLinks: true,
    showSocialIcons: true,
    showWhatsAppFooterIcon: true,
    liveSupportMode: "both",
    storeStatus: "live",
  },
  paymentSettings: {
    codEnabled: true,
    codMessage:
      "Cash on Delivery is available for eligible Bangladesh orders. Our team will confirm your phone and delivery address before dispatch.",
    bkashEnabled: true,
    bkashReceiverNumber: "01644037384",
    nagadEnabled: true,
    nagadReceiverNumber: "01644037384",
    rocketEnabled: true,
    rocketReceiverNumber: "016440373844",
    upayEnabled: true,
    upayReceiverNumber: "01644037384",
    bankTransferEnabled: true,
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankBranch: "",
    bankRoutingNumber: "",
    bankTransferInstruction:
      "Our team will share verified bank details after confirming your order.",
    paymentConfirmationInstruction:
      "After payment, enter your sender number and transaction reference so support can verify the order.",
  },
  checkoutSettings: {
    checkoutHeaderText: "Secure checkout",
    checkoutSupportMessage:
      "Need help? Contact Aevyrixa support before submitting your order.",
    orderConfirmationMessage:
      "Need help? Contact Aevyrixa support with your order reference.",
    orderReviewMessage:
      "Review your order, delivery details, and payment method before submitting.",
    cartEmptyMessage: "Your cart is empty.",
    minimumOrderAmount: "",
    freeDeliveryThreshold: "",
    requireCustomerAccountForCheckout: true,
  },
  deliverySettings: {
    deliveryCoverageText:
      "Bangladesh delivery is available with order confirmation before dispatch.",
    defaultDeliveryCharge: "",
    insideDhakaDeliveryCharge: "80",
    outsideDhakaDeliveryCharge: "130",
    courierPartners: "",
    defaultCourier: "Not selected",
    courierIntegrationMode: "manual",
    autoCourierBookingEnabled: false,
    autoTrackingSyncEnabled: false,
    courierApiReadyNote:
      "Manual mode is active. Courier booking and tracking are updated by admin. API mode can be enabled later after merchant API credentials are approved.",
    estimatedDeliveryTime:
      "Bangladesh delivery estimate is 2-7 working days after confirmation. Our team reviews delivery details before dispatch.",
    dispatchConfirmationMessage:
      "We will confirm dispatch details after reviewing your order.",
    trackingSupportMessage:
      "Need help? Contact Aevyrixa support with your order reference.",
  },
  policySettings: {
    hygieneSafeSupportMessage:
      "3-Day Hygiene-Safe Support is available for eligible order, size, wrong item, or damaged item concerns.",
    refundExchangeCondition:
      "Eligible support is reviewed case by case for wrong item, damaged item, or size concerns reported within the support window.",
    unusedUnwashedCondition:
      "Eligible support requests require unused, unwashed items in original packaging with tags and hygiene liner/seal where applicable.",
    originalPackagingHygieneSealMessage:
      "Original packaging, tags, and hygiene liner/seal must remain intact where applicable.",
    sizeCheckingInstruction:
      "Please check the size guide before ordering and contact support if you need help choosing a size.",
    privacyPackagingMessage:
      "Orders ship in discreet privacy packaging without sensitive product details on the outside.",
    noMedicalClaimsNotice:
      "Aevyrixa products are personal care items and do not diagnose, treat, cure, or prevent medical conditions.",
  },
  orderSettings: {
    defaultOrderStatus: "Pending",
    defaultOrderSource: "Website",
    defaultAssignedStaff: "",
    defaultPaymentVerificationStatus: "Pending",
    proofRequiredDefault: "No",
    autoCancelPendingAfterDays: "",
    lowStockAlertThreshold: "5",
    orderIdPrefix: "AEV",
  },
  notificationSettings: {
    telegramNewOrderEnabled: true,
    telegramStatusUpdateEnabled: false,
    orderConfirmationMessageTemplate:
      "Your Aevyrixa order {{orderReference}} has been received.",
    shippedMessageTemplate:
      "Your Aevyrixa order {{orderReference}} has been shipped.",
    deliveredMessageTemplate:
      "Your Aevyrixa order {{orderReference}} has been delivered.",
    cancelledMessageTemplate:
      "Your Aevyrixa order {{orderReference}} has been cancelled. Contact support if you need help.",
    telegramChatStatus: "Configured in environment",
  },
  seoSettings: {
    homepageSeoTitle: "Aevyrixa Her Care",
    homepageMetaDescription:
      "Aevyrixa Her Care — premium women's comfort, hygiene, reusable care, and intimate essentials with discreet Bangladesh delivery.",
    defaultProductSeoSuffix: " | Aevyrixa Her Care",
    facebookPixelId: "",
    tiktokPixelId: "",
    googleAnalyticsId: "",
    openGraphImageUrl: "",
  },
  appearanceSettings: {
    brandAccentColor: "#67e8f9",
    heroBadgeText: "3-Day Hygiene-Safe Support",
    homepageHeroTitle: "Aevyrixa Her Care",
    homepageHeroSubtitle:
      "Premium women's comfort, hygiene & reusable care with discreet Bangladesh delivery.",
    primaryCtaText: "Shop Now",
    secondaryCtaText: "Track Order",
    announcementBarEnabled: false,
    announcementBarText: "",
    enableAnnouncement: false,
    announcementText: "",
    announcementLinkLabel: "",
    announcementLinkUrl: "",
    announcementStyle: "info",
    showOnHomepage: true,
    showOnShop: true,
    showOnProductPages: true,
    showOnCheckout: true,
  },
  advancedSettings: {
    maintenanceMode: false,
    testMode: false,
    debugMode: false,
    purgeDeletedProductsAfterDays: "",
    systemVersionLabel: "Aevyrixa Control Room — Phase 36+ Category CMS Enhanced",
    backupReminderText: "Review Supabase and Vercel backups before major changes.",
  },
  homepageMediaSettings: {
    showHero: true,
    showTrustStrip: true,
    showStatStrip: true,
    showMarquee: true,
    showCategories: true,
    showFeaturedProducts: true,
    showStorySections: true,
    showTestimonials: true,
    showFAQ: true,
    showBottomCTA: true,
    splashEnabled: true,
    splashTitle: "Aevyrixa Her Care",
    splashLogoUrl: "/logo.jpg",
    statItem1Value: "BDT",
    statItem1Label: "Local Pricing",
    statItem2Value: "3-Day",
    statItem2Label: "Hygiene-Safe Support",
    statItem3Value: "Care",
    statItem3Label: "Discreet Packaging",
    marqueeItems:
      "Bangladesh Delivery, Discreet Packaging, 3-Day Hygiene-Safe Support, Premium Comfort, BDT Pricing, Reusable Care, Secure Checkout",
    featuredProductsEyebrow: "Best Picks",
    featuredProductsHeading: "Best picks for your care routine.",
    featuredProductsDescription: "Browse active Her Care picks with live BDT pricing and the same product options available in the shop.",
    collectionsEyebrow: "Collections",
    collectionsHeading: "Shop by care.",
    collectionsDescription: "Move from reusable period care to comfort-led essentials through compact collection picks.",
    heroMedia: { mode: "animation", imageUrl: "", videoUrl: "", altText: "", eyebrow: "", heading: "", subheading: "", ctaText: "", ctaLink: "" },
    careMedia: { mode: "animation", imageUrl: "", videoUrl: "", altText: "", eyebrow: "", heading: "", subheading: "", ctaText: "", ctaLink: "" },
    experienceMedia: { mode: "animation", imageUrl: "", videoUrl: "", altText: "", eyebrow: "", heading: "", subheading: "", ctaText: "", ctaLink: "" },
    categoryReusablePeriodCare: "active",
    categoryReusablePeriodCareImageUrl: "",
    categoryReusablePeriodCareVideoUrl: "",
    categoryReusablePeriodCareMediaMode: "animation" as HomepageCategoryMediaMode,
    categoryReusablePeriodCareAltText: "",
    categoryReusablePeriodCareTitle: "Reusable Period Care",
    categoryReusablePeriodCareDescription: "Comfortable reusable protection for light to moderate flow.",
    categoryReusablePeriodCareLinkUrl: "/product?category=Reusable%20Period%20Care",
    categoryComfortPanty: "coming_soon",
    categoryComfortPantyImageUrl: "",
    categoryComfortPantyVideoUrl: "",
    categoryComfortPantyMediaMode: "animation" as HomepageCategoryMediaMode,
    categoryComfortPantyAltText: "",
    categoryComfortPantyTitle: "Comfort Panty",
    categoryComfortPantyDescription: "Soft stretch everyday wear designed for all-day comfort.",
    categoryComfortPantyLinkUrl: "/product?category=Comfort%20Panty",
    categorySoftSupportBra: "coming_soon",
    categorySoftSupportBraImageUrl: "",
    categorySoftSupportBraVideoUrl: "",
    categorySoftSupportBraMediaMode: "animation" as HomepageCategoryMediaMode,
    categorySoftSupportBraAltText: "",
    categorySoftSupportBraTitle: "Soft Support Bra",
    categorySoftSupportBraDescription: "Gentle support with smooth fabric for daily wear.",
    categorySoftSupportBraLinkUrl: "/product?category=Soft%20Support%20Bra",
    categoryNightwear: "coming_soon",
    categoryNightwearImageUrl: "",
    categoryNightwearVideoUrl: "",
    categoryNightwearMediaMode: "animation" as HomepageCategoryMediaMode,
    categoryNightwearAltText: "",
    categoryNightwearTitle: "Nightwear",
    categoryNightwearDescription: "Relaxed, breathable comfort for restful evenings.",
    categoryNightwearLinkUrl: "/product?category=Nightwear",
    categoryHygieneEssentials: "coming_soon",
    categoryHygieneEssentialsImageUrl: "",
    categoryHygieneEssentialsVideoUrl: "",
    categoryHygieneEssentialsMediaMode: "animation" as HomepageCategoryMediaMode,
    categoryHygieneEssentialsAltText: "",
    categoryHygieneEssentialsTitle: "Hygiene Essentials",
    categoryHygieneEssentialsDescription: "Curated essentials for your daily hygiene routine.",
    categoryHygieneEssentialsLinkUrl: "/product?category=Hygiene%20Essentials",
    categoryBundles: "coming_soon",
    categoryBundlesImageUrl: "",
    categoryBundlesVideoUrl: "",
    categoryBundlesMediaMode: "animation" as HomepageCategoryMediaMode,
    categoryBundlesAltText: "",
    categoryBundlesTitle: "Bundles",
    categoryBundlesDescription: "Thoughtful care sets at a considered price.",
    categoryBundlesLinkUrl: "/product?category=Bundles",
    categoryNewArrivals: "coming_soon",
    categoryNewArrivalsImageUrl: "",
    categoryNewArrivalsVideoUrl: "",
    categoryNewArrivalsMediaMode: "animation" as HomepageCategoryMediaMode,
    categoryNewArrivalsAltText: "",
    categoryNewArrivalsTitle: "New Arrivals",
    categoryNewArrivalsDescription: "Fresh additions to the Her Care collection.",
    categoryNewArrivalsLinkUrl: "/product?signal=New",
    categoryReusablePeriodCareSortOrder: "1",
    categoryComfortPantySortOrder: "2",
    categorySoftSupportBraSortOrder: "3",
    categoryNightwearSortOrder: "4",
    categoryHygieneEssentialsSortOrder: "5",
    categoryBundlesSortOrder: "6",
    categoryNewArrivalsSortOrder: "7",
    whatsappWidgetEnabled: false,
    whatsappWidgetLabel: "Support",
    whatsappWidgetLiveText: "",
    whatsappWidgetPlacement: "homepage" as WidgetPlacement,
    liveChatEnabled: false,
    liveChatLabel: "Need Help?",
    liveChatLink: "/support",
    liveChatPlacement: "homepage" as WidgetPlacement,
    ctaSectionEnabled: true,
    ctaSectionEyebrow: "Ready for reusable confidence?",
    ctaSectionHeading: "Discover Her Care essentials that feel softer, calmer, and more considered.",
    ctaSectionDescription: "Premium women's comfort, hygiene, and reusable care with discreet delivery.",
    ctaSectionPrimaryCtaText: "",
    ctaSectionPrimaryCtaLink: "/product",
    ctaSectionSecondaryCtaText: "Read FAQs",
    ctaSectionSecondaryCtaLink: "#faq",
    ctaSectionMediaMode: "no_media" as CtaSectionMediaMode,
    ctaSectionImageUrl: "",
    ctaSectionVideoUrl: "",
    ctaSectionAltText: "",
    layerComfortEnabled: true,
    layerComfortEyebrow: "Her Care Layer System",
    layerComfortHeading: "Layered comfort built for calm, discreet daily wear.",
    layerComfortDescription: "Each piece is designed with softness at every layer — from the fabric you feel against your skin to the discreet structure supporting your day.",
    layerComfortLayer1Title: "Comfort Knit Layer",
    layerComfortLayer1Description: "Soft, stretch-fit fabric that moves naturally with your body through the day.",
    layerComfortLayer2Title: "Absorbent Core",
    layerComfortLayer2Description: "A slim internal layer for quiet, discreet support during light to moderate flow.",
    layerComfortLayer3Title: "Protective Shell",
    layerComfortLayer3Description: "A smooth outer layer with a refined silhouette and clean, everyday finish.",
    layerComfortCtaText: "",
    layerComfortCtaLink: "",
    layerComfortMediaMode: "animation" as LayerComfortMediaMode,
    layerComfortImageUrl: "",
    layerComfortVideoUrl: "",
    layerComfortAltText: "",
    findCareEnabled: true,
    findCareEyebrow: "Find Your Care",
    findCareHeading: "Choose the care that matches your day.",
    findCareDescription: "Use a quick visual guide to move from flow-day support to daily comfort and gentle support picks.",
    findCareCtaText: "",
    findCareCtaLink: "/product",
    findCareCard1Title: "Flow Days",
    findCareCard1Description: "Reusable care for light to moderate flow routines.",
    findCareCard1LinkUrl: "/product?category=Reusable+Period+Care",
    findCareCard2Title: "Daily Comfort",
    findCareCard2Description: "Soft comfort wear for repeat everyday movement.",
    findCareCard2LinkUrl: "/product?category=Comfort+Panty",
    findCareCard3Title: "Gentle Support",
    findCareCard3Description: "Smooth support picks for easy daily layering.",
    findCareCard3LinkUrl: "/product?category=Soft+Support+Bra",
    faqPreviewEyebrow: "FAQ Preview",
    faqPreviewHeading: "A few quick answers.",
    faqPreviewItem1Question: "How much protection should I expect?",
    faqPreviewItem1Answer: "Her Care pieces are designed for light to moderate flow support without overpromising protection levels.",
    faqPreviewItem2Question: "Can I wear it by itself?",
    faqPreviewItem2Answer: "For lighter days, reusable period care may fit your routine. Choose backup protection for heavier flow if you need it.",
    faqPreviewItem3Question: "How do I wash it?",
    faqPreviewItem3Answer: "Rinse with cool water, wash gently, and air dry before storing.",
    shopHeroEnabled: true,
    shopHeroEyebrow: "AEVYRIXA HER CARE SHOP",
    shopHeroTitle: "Comfort that moves with you",
    shopHeroSubtitle: "Premium women's comfort, hygiene & reusable care with discreet Bangladesh delivery.",
    shopHeroPrimaryCtaText: "Shop Now",
    shopHeroPrimaryCtaLink: "/product",
    shopHeroSecondaryCtaText: "Track Order",
    shopHeroSecondaryCtaLink: "/track-order",
    shopHeroMediaUrl: "",
    shopHeroMediaType: "auto" as "image" | "video" | "auto",
    shopHeroMediaAlt: "Aevyrixa Her Care",
    shopHeroBadge1: "Discreet Packaging",
    shopHeroBadge2: "3-Day Hygiene-Safe Support",
    shopHeroCaption: "",
    shopHeroTrust1Label: "Privacy",
    shopHeroTrust1Description: "Discreet privacy packaging",
    shopHeroTrust2Label: "Support",
    shopHeroTrust2Description: "3-Day Hygiene-Safe Support",
    shopHeroTrust3Label: "Delivery",
    shopHeroTrust3Description: "Bangladesh delivery",
  },
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function publicUrlValue(value: unknown) {
  const text = textValue(value)?.trim();
  if (!text) return "";

  try {
    const url = new URL(text);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function safeText(value: unknown, fallback: string) {
  const text = textValue(value);
  return text === undefined ? fallback : text;
}

function storeStatusValue(value: unknown): StoreStatus {
  return value === "maintenance" || value === "coming_soon" || value === "live"
    ? value
    : defaultGroups.storeProfile.storeStatus;
}

function announcementStyleValue(value: unknown): AppearanceSettings["announcementStyle"] {
  return value === "promo" || value === "warning" || value === "success" || value === "info"
    ? value
    : "info";
}

function liveSupportModeValue(value: unknown): StoreProfileSettings["liveSupportMode"] {
  return value === "off" || value === "live_chat" || value === "whatsapp" || value === "both"
    ? value
    : "both";
}

function orderStatusValue(value: unknown): OrderStatus {
  return value === "Confirmed" ||
    value === "Shipped" ||
    value === "Delivered" ||
    value === "Cancelled" ||
    value === "Pending"
    ? value
    : defaultGroups.orderSettings.defaultOrderStatus;
}

function orderSourceValue(value: unknown): OrderSource {
  return value === "Facebook" ||
    value === "Manual" ||
    value === "Other" ||
    value === "Website"
    ? value
    : defaultGroups.orderSettings.defaultOrderSource;
}

function verificationStatusValue(value: unknown): PaymentVerificationStatus {
  return value === "Verified" ||
    value === "Failed" ||
    value === "Not Required" ||
    value === "Pending"
    ? value
    : defaultGroups.orderSettings.defaultPaymentVerificationStatus;
}

function proofStatusValue(value: unknown): ProofReceivedStatus {
  return value === "Yes" || value === "Requested" || value === "No"
    ? value
    : defaultGroups.orderSettings.proofRequiredDefault;
}

function nestedRecord(value: UnknownRecord, key: keyof AdminSettingsGroups) {
  return isRecord(value[key]) ? value[key] : {};
}

function sectionMediaModeValue(value: unknown): "animation" | "image" | "video" {
  return value === "image" || value === "video" ? value : "animation";
}

function categoryStateValue(value: unknown, fallback: HomepageCategoryState): HomepageCategoryState {
  return value === "active" || value === "coming_soon" || value === "hidden" ? value : fallback;
}

function widgetPlacementValue(value: unknown, fallback: WidgetPlacement): WidgetPlacement {
  return value === "homepage" || value === "all" || value === "product" || value === "support" || value === "cart"
    ? value
    : fallback;
}

function ctaSectionMediaModeValue(value: unknown): CtaSectionMediaMode {
  return value === "image_text" || value === "video_text" || value === "background_media_text"
    ? value
    : "no_media";
}

function layerComfortMediaModeValue(value: unknown): LayerComfortMediaMode {
  return value === "image_text" || value === "video_text" || value === "background_media_text" || value === "media_only"
    ? value
    : "animation";
}

function shopHeroMediaTypeValue(value: unknown): "image" | "video" | "auto" {
  return value === "image" || value === "video" ? value : "auto";
}

function categoryMediaModeValue(value: unknown, fallback: HomepageCategoryMediaMode): HomepageCategoryMediaMode {
  return value === "animation" || value === "image_text" || value === "video_text" || value === "background_media_text" || value === "media_only"
    ? value
    : fallback;
}

function courierOptionValue(value: unknown): CourierOption {
  return courierOptions.includes(value as CourierOption)
    ? (value as CourierOption)
    : defaultGroups.deliverySettings.defaultCourier;
}

function courierIntegrationModeValue(value: unknown): CourierIntegrationMode {
  return courierIntegrationModes.includes(value as CourierIntegrationMode)
    ? (value as CourierIntegrationMode)
    : defaultGroups.deliverySettings.courierIntegrationMode;
}

function sectionMediaValue(raw: UnknownRecord): HomepageSectionMedia {
  return {
    mode: sectionMediaModeValue(raw.mode),
    imageUrl: publicUrlValue(raw.imageUrl),
    videoUrl: publicUrlValue(raw.videoUrl),
    altText: safeText(raw.altText, ""),
    eyebrow: safeText(raw.eyebrow, ""),
    heading: safeText(raw.heading, ""),
    subheading: safeText(raw.subheading, ""),
    ctaText: safeText(raw.ctaText, ""),
    ctaLink: safeText(raw.ctaLink, ""),
  };
}

function guaranteeTextValue(value: unknown) {
  const guaranteeText = textValue(value);
  if (!guaranteeText) return defaultGroups.policySettings.hygieneSafeSupportMessage;

  if (/7\s*-?\s*day|money back|coverage/i.test(guaranteeText)) {
    return defaultGroups.policySettings.hygieneSafeSupportMessage;
  }

  return guaranteeText;
}

function supportWindowMessageValue(value: unknown) {
  const supportWindowMessage = textValue(value);
  if (!supportWindowMessage) {
    return defaultGroups.policySettings.hygieneSafeSupportMessage;
  }

  if (/7\s*-?\s*day|money back|coverage/i.test(supportWindowMessage)) {
    return defaultGroups.policySettings.hygieneSafeSupportMessage;
  }

  return supportWindowMessage;
}

function buildAdminSettings(groups: AdminSettingsGroups): AdminSettings {
  return {
    ...groups,
    storeName: groups.storeProfile.storeName,
    supportPhone: groups.storeProfile.supportPhone,
    supportWhatsApp: groups.storeProfile.supportWhatsApp,
    supportEmail: groups.storeProfile.supportEmail,
    facebookPageUrl: groups.storeProfile.facebookPageUrl,
    instagramUrl: groups.storeProfile.instagramUrl,
    tiktokUrl: groups.storeProfile.tiktokUrl,
    youtubeUrl: groups.storeProfile.youtubeUrl,
    businessLocation: groups.storeProfile.businessLocation,
    deliveryCoverageText: groups.deliverySettings.deliveryCoverageText,
    codMessage: groups.paymentSettings.codMessage,
    privacyPackagingMessage: groups.policySettings.privacyPackagingMessage,
    supportWindowMessage: groups.policySettings.hygieneSafeSupportMessage,
    hygieneReturnMessage: groups.policySettings.unusedUnwashedCondition,
    orderConfirmationMessage: groups.checkoutSettings.orderConfirmationMessage,
    guaranteeText: groups.policySettings.hygieneSafeSupportMessage,
    deliveryNote: groups.deliverySettings.estimatedDeliveryTime,
    walletReceiverNumbers: {
      bKash: groups.paymentSettings.bkashReceiverNumber,
      Nagad: groups.paymentSettings.nagadReceiverNumber,
      Rocket: groups.paymentSettings.rocketReceiverNumber,
      Upay: groups.paymentSettings.upayReceiverNumber,
    },
    bankTransferInstruction: groups.paymentSettings.bankTransferInstruction,
    codInstruction: groups.paymentSettings.codMessage,
  };
}

export function normalizeAdminSettings(value: unknown): AdminSettings {
  if (!isRecord(value)) return defaultAdminSettings;

  const storeProfile = nestedRecord(value, "storeProfile");
  const paymentSettings = nestedRecord(value, "paymentSettings");
  const checkoutSettings = nestedRecord(value, "checkoutSettings");
  const deliverySettings = nestedRecord(value, "deliverySettings");
  const policySettings = nestedRecord(value, "policySettings");
  const orderSettings = nestedRecord(value, "orderSettings");
  const notificationSettings = nestedRecord(value, "notificationSettings");
  const seoSettings = nestedRecord(value, "seoSettings");
  const appearanceSettings = nestedRecord(value, "appearanceSettings");
  const advancedSettings = nestedRecord(value, "advancedSettings");
  const homepageMediaRaw = isRecord(value.homepageMediaSettings) ? value.homepageMediaSettings : {};
  const storedWallets = isRecord(value.walletReceiverNumbers)
    ? value.walletReceiverNumbers
    : {};

  const groups: AdminSettingsGroups = {
    storeProfile: {
      storeName:
        textValue(storeProfile.storeName) ||
        textValue(value.storeName) ||
        defaultGroups.storeProfile.storeName,
      brandSubtitle: safeText(
        storeProfile.brandSubtitle,
        defaultGroups.storeProfile.brandSubtitle
      ),
      businessLocation:
        textValue(storeProfile.businessLocation) ||
        textValue(value.businessLocation) ||
        defaultGroups.storeProfile.businessLocation,
      supportPhone:
        textValue(storeProfile.supportPhone) ||
        textValue(value.supportPhone) ||
        defaultGroups.storeProfile.supportPhone,
      supportWhatsApp:
        textValue(storeProfile.supportWhatsApp) ||
        textValue(value.supportWhatsApp) ||
        defaultGroups.storeProfile.supportWhatsApp,
      supportEmail:
        textValue(storeProfile.supportEmail) ||
        textValue(value.supportEmail) ||
        defaultGroups.storeProfile.supportEmail,
      supportAgentImageUrl:
        publicUrlValue(storeProfile.supportAgentImageUrl) ||
        publicUrlValue(value.supportAgentImageUrl),
      facebookPageUrl:
        publicUrlValue(storeProfile.facebookPageUrl) ||
        publicUrlValue(value.facebookPageUrl),
      instagramUrl:
        publicUrlValue(storeProfile.instagramUrl) || publicUrlValue(value.instagramUrl),
      tiktokUrl: publicUrlValue(storeProfile.tiktokUrl) || publicUrlValue(value.tiktokUrl),
      youtubeUrl: publicUrlValue(storeProfile.youtubeUrl) || publicUrlValue(value.youtubeUrl),
      footerShortDescription: safeText(
        storeProfile.footerShortDescription,
        defaultGroups.storeProfile.footerShortDescription
      ),
      showFooterLegalLinks: booleanValue(
        storeProfile.showFooterLegalLinks,
        defaultGroups.storeProfile.showFooterLegalLinks
      ),
      showSocialIcons: booleanValue(
        storeProfile.showSocialIcons,
        defaultGroups.storeProfile.showSocialIcons
      ),
      showWhatsAppFooterIcon: booleanValue(
        storeProfile.showWhatsAppFooterIcon,
        defaultGroups.storeProfile.showWhatsAppFooterIcon
      ),
      liveSupportMode: liveSupportModeValue(storeProfile.liveSupportMode),
      storeStatus: storeStatusValue(storeProfile.storeStatus),
    },
    paymentSettings: {
      codEnabled: booleanValue(
        paymentSettings.codEnabled,
        defaultGroups.paymentSettings.codEnabled
      ),
      codMessage:
        textValue(paymentSettings.codMessage) ||
        textValue(value.codMessage) ||
        textValue(value.codInstruction) ||
        defaultGroups.paymentSettings.codMessage,
      bkashEnabled: booleanValue(
        paymentSettings.bkashEnabled,
        defaultGroups.paymentSettings.bkashEnabled
      ),
      bkashReceiverNumber:
        textValue(paymentSettings.bkashReceiverNumber) ||
        textValue(storedWallets.bKash) ||
        textValue(value.bKashReceiverNumber) ||
        defaultGroups.paymentSettings.bkashReceiverNumber,
      nagadEnabled: booleanValue(
        paymentSettings.nagadEnabled,
        defaultGroups.paymentSettings.nagadEnabled
      ),
      nagadReceiverNumber:
        textValue(paymentSettings.nagadReceiverNumber) ||
        textValue(storedWallets.Nagad) ||
        textValue(value.nagadReceiverNumber) ||
        defaultGroups.paymentSettings.nagadReceiverNumber,
      rocketEnabled: booleanValue(
        paymentSettings.rocketEnabled,
        defaultGroups.paymentSettings.rocketEnabled
      ),
      rocketReceiverNumber:
        textValue(paymentSettings.rocketReceiverNumber) ||
        textValue(storedWallets.Rocket) ||
        textValue(value.rocketReceiverNumber) ||
        defaultGroups.paymentSettings.rocketReceiverNumber,
      upayEnabled: booleanValue(
        paymentSettings.upayEnabled,
        defaultGroups.paymentSettings.upayEnabled
      ),
      upayReceiverNumber:
        textValue(paymentSettings.upayReceiverNumber) ||
        textValue(storedWallets.Upay) ||
        textValue(value.upayReceiverNumber) ||
        defaultGroups.paymentSettings.upayReceiverNumber,
      bankTransferEnabled: booleanValue(
        paymentSettings.bankTransferEnabled,
        defaultGroups.paymentSettings.bankTransferEnabled
      ),
      bankName: safeText(paymentSettings.bankName, defaultGroups.paymentSettings.bankName),
      bankAccountName: safeText(
        paymentSettings.bankAccountName,
        defaultGroups.paymentSettings.bankAccountName
      ),
      bankAccountNumber: safeText(
        paymentSettings.bankAccountNumber,
        defaultGroups.paymentSettings.bankAccountNumber
      ),
      bankBranch: safeText(
        paymentSettings.bankBranch,
        defaultGroups.paymentSettings.bankBranch
      ),
      bankRoutingNumber: safeText(
        paymentSettings.bankRoutingNumber,
        defaultGroups.paymentSettings.bankRoutingNumber
      ),
      bankTransferInstruction:
        textValue(paymentSettings.bankTransferInstruction) ||
        textValue(value.bankTransferInstruction) ||
        defaultGroups.paymentSettings.bankTransferInstruction,
      paymentConfirmationInstruction: safeText(
        paymentSettings.paymentConfirmationInstruction,
        defaultGroups.paymentSettings.paymentConfirmationInstruction
      ),
    },
    checkoutSettings: {
      checkoutHeaderText: safeText(
        checkoutSettings.checkoutHeaderText,
        defaultGroups.checkoutSettings.checkoutHeaderText
      ),
      checkoutSupportMessage: safeText(
        checkoutSettings.checkoutSupportMessage,
        defaultGroups.checkoutSettings.checkoutSupportMessage
      ),
      orderConfirmationMessage:
        textValue(checkoutSettings.orderConfirmationMessage) ||
        textValue(value.orderConfirmationMessage) ||
        defaultGroups.checkoutSettings.orderConfirmationMessage,
      orderReviewMessage: safeText(
        checkoutSettings.orderReviewMessage,
        defaultGroups.checkoutSettings.orderReviewMessage
      ),
      cartEmptyMessage: safeText(
        checkoutSettings.cartEmptyMessage,
        defaultGroups.checkoutSettings.cartEmptyMessage
      ),
      minimumOrderAmount: safeText(
        checkoutSettings.minimumOrderAmount,
        defaultGroups.checkoutSettings.minimumOrderAmount
      ),
      freeDeliveryThreshold: safeText(
        checkoutSettings.freeDeliveryThreshold,
        defaultGroups.checkoutSettings.freeDeliveryThreshold
      ),
      requireCustomerAccountForCheckout: booleanValue(
        checkoutSettings.requireCustomerAccountForCheckout,
        defaultGroups.checkoutSettings.requireCustomerAccountForCheckout
      ),
    },
    deliverySettings: {
      deliveryCoverageText:
        textValue(deliverySettings.deliveryCoverageText) ||
        textValue(value.deliveryCoverageText) ||
        textValue(value.deliveryNote) ||
        defaultGroups.deliverySettings.deliveryCoverageText,
      defaultDeliveryCharge: safeText(
        deliverySettings.defaultDeliveryCharge,
        defaultGroups.deliverySettings.defaultDeliveryCharge
      ),
      insideDhakaDeliveryCharge: safeText(
        deliverySettings.insideDhakaDeliveryCharge,
        defaultGroups.deliverySettings.insideDhakaDeliveryCharge
      ),
      outsideDhakaDeliveryCharge: safeText(
        deliverySettings.outsideDhakaDeliveryCharge,
        defaultGroups.deliverySettings.outsideDhakaDeliveryCharge
      ),
      courierPartners: safeText(
        deliverySettings.courierPartners,
        defaultGroups.deliverySettings.courierPartners
      ),
      defaultCourier: courierOptionValue(deliverySettings.defaultCourier),
      courierIntegrationMode: courierIntegrationModeValue(
        deliverySettings.courierIntegrationMode
      ),
      autoCourierBookingEnabled: booleanValue(
        deliverySettings.autoCourierBookingEnabled,
        defaultGroups.deliverySettings.autoCourierBookingEnabled
      ),
      autoTrackingSyncEnabled: booleanValue(
        deliverySettings.autoTrackingSyncEnabled,
        defaultGroups.deliverySettings.autoTrackingSyncEnabled
      ),
      courierApiReadyNote: safeText(
        deliverySettings.courierApiReadyNote,
        defaultGroups.deliverySettings.courierApiReadyNote
      ),
      estimatedDeliveryTime:
        textValue(deliverySettings.estimatedDeliveryTime) ||
        textValue(value.deliveryNote) ||
        defaultGroups.deliverySettings.estimatedDeliveryTime,
      dispatchConfirmationMessage: safeText(
        deliverySettings.dispatchConfirmationMessage,
        defaultGroups.deliverySettings.dispatchConfirmationMessage
      ),
      trackingSupportMessage:
        textValue(deliverySettings.trackingSupportMessage) ||
        defaultGroups.deliverySettings.trackingSupportMessage,
    },
    policySettings: {
      hygieneSafeSupportMessage: supportWindowMessageValue(
        policySettings.hygieneSafeSupportMessage || value.supportWindowMessage
      ),
      refundExchangeCondition: safeText(
        policySettings.refundExchangeCondition,
        defaultGroups.policySettings.refundExchangeCondition
      ),
      unusedUnwashedCondition:
        textValue(policySettings.unusedUnwashedCondition) ||
        textValue(value.hygieneReturnMessage) ||
        defaultGroups.policySettings.unusedUnwashedCondition,
      originalPackagingHygieneSealMessage: safeText(
        policySettings.originalPackagingHygieneSealMessage,
        defaultGroups.policySettings.originalPackagingHygieneSealMessage
      ),
      sizeCheckingInstruction: safeText(
        policySettings.sizeCheckingInstruction,
        defaultGroups.policySettings.sizeCheckingInstruction
      ),
      privacyPackagingMessage:
        textValue(policySettings.privacyPackagingMessage) ||
        textValue(value.privacyPackagingMessage) ||
        defaultGroups.policySettings.privacyPackagingMessage,
      noMedicalClaimsNotice: safeText(
        policySettings.noMedicalClaimsNotice,
        defaultGroups.policySettings.noMedicalClaimsNotice
      ),
    },
    orderSettings: {
      defaultOrderStatus: orderStatusValue(orderSettings.defaultOrderStatus),
      defaultOrderSource: orderSourceValue(orderSettings.defaultOrderSource),
      defaultAssignedStaff: safeText(
        orderSettings.defaultAssignedStaff,
        defaultGroups.orderSettings.defaultAssignedStaff
      ),
      defaultPaymentVerificationStatus: verificationStatusValue(
        orderSettings.defaultPaymentVerificationStatus
      ),
      proofRequiredDefault: proofStatusValue(orderSettings.proofRequiredDefault),
      autoCancelPendingAfterDays: safeText(
        orderSettings.autoCancelPendingAfterDays,
        defaultGroups.orderSettings.autoCancelPendingAfterDays
      ),
      lowStockAlertThreshold: safeText(
        orderSettings.lowStockAlertThreshold,
        defaultGroups.orderSettings.lowStockAlertThreshold
      ),
      orderIdPrefix: safeText(
        orderSettings.orderIdPrefix,
        defaultGroups.orderSettings.orderIdPrefix
      ),
    },
    notificationSettings: {
      telegramNewOrderEnabled: booleanValue(
        notificationSettings.telegramNewOrderEnabled,
        defaultGroups.notificationSettings.telegramNewOrderEnabled
      ),
      telegramStatusUpdateEnabled: booleanValue(
        notificationSettings.telegramStatusUpdateEnabled,
        defaultGroups.notificationSettings.telegramStatusUpdateEnabled
      ),
      orderConfirmationMessageTemplate: safeText(
        notificationSettings.orderConfirmationMessageTemplate,
        defaultGroups.notificationSettings.orderConfirmationMessageTemplate
      ),
      shippedMessageTemplate: safeText(
        notificationSettings.shippedMessageTemplate,
        defaultGroups.notificationSettings.shippedMessageTemplate
      ),
      deliveredMessageTemplate: safeText(
        notificationSettings.deliveredMessageTemplate,
        defaultGroups.notificationSettings.deliveredMessageTemplate
      ),
      cancelledMessageTemplate: safeText(
        notificationSettings.cancelledMessageTemplate,
        defaultGroups.notificationSettings.cancelledMessageTemplate
      ),
      telegramChatStatus: defaultGroups.notificationSettings.telegramChatStatus,
    },
    seoSettings: {
      homepageSeoTitle: safeText(
        seoSettings.homepageSeoTitle,
        defaultGroups.seoSettings.homepageSeoTitle
      ),
      homepageMetaDescription: safeText(
        seoSettings.homepageMetaDescription,
        defaultGroups.seoSettings.homepageMetaDescription
      ),
      defaultProductSeoSuffix: safeText(
        seoSettings.defaultProductSeoSuffix,
        defaultGroups.seoSettings.defaultProductSeoSuffix
      ),
      facebookPixelId: safeText(
        seoSettings.facebookPixelId,
        defaultGroups.seoSettings.facebookPixelId
      ),
      tiktokPixelId: safeText(
        seoSettings.tiktokPixelId,
        defaultGroups.seoSettings.tiktokPixelId
      ),
      googleAnalyticsId: safeText(
        seoSettings.googleAnalyticsId,
        defaultGroups.seoSettings.googleAnalyticsId
      ),
      openGraphImageUrl:
        publicUrlValue(seoSettings.openGraphImageUrl) ||
        defaultGroups.seoSettings.openGraphImageUrl,
    },
    appearanceSettings: {
      brandAccentColor: safeText(
        appearanceSettings.brandAccentColor,
        defaultGroups.appearanceSettings.brandAccentColor
      ),
      heroBadgeText: guaranteeTextValue(
        appearanceSettings.heroBadgeText ||
          defaultGroups.appearanceSettings.heroBadgeText
      ),
      homepageHeroTitle: safeText(
        appearanceSettings.homepageHeroTitle,
        defaultGroups.appearanceSettings.homepageHeroTitle
      ),
      homepageHeroSubtitle: safeText(
        appearanceSettings.homepageHeroSubtitle,
        defaultGroups.appearanceSettings.homepageHeroSubtitle
      ),
      primaryCtaText: safeText(
        appearanceSettings.primaryCtaText,
        defaultGroups.appearanceSettings.primaryCtaText
      ),
      secondaryCtaText: safeText(
        appearanceSettings.secondaryCtaText,
        defaultGroups.appearanceSettings.secondaryCtaText
      ),
      announcementBarEnabled: booleanValue(
        appearanceSettings.announcementBarEnabled,
        defaultGroups.appearanceSettings.announcementBarEnabled
      ),
      announcementBarText: safeText(
        appearanceSettings.announcementBarText,
        defaultGroups.appearanceSettings.announcementBarText
      ),
      enableAnnouncement: booleanValue(
        appearanceSettings.enableAnnouncement ?? appearanceSettings.announcementBarEnabled,
        defaultGroups.appearanceSettings.enableAnnouncement
      ),
      announcementText: safeText(
        appearanceSettings.announcementText ?? appearanceSettings.announcementBarText,
        defaultGroups.appearanceSettings.announcementText
      ),
      announcementLinkLabel: safeText(
        appearanceSettings.announcementLinkLabel,
        defaultGroups.appearanceSettings.announcementLinkLabel
      ),
      announcementLinkUrl: safeText(
        appearanceSettings.announcementLinkUrl,
        defaultGroups.appearanceSettings.announcementLinkUrl
      ),
      announcementStyle: announcementStyleValue(appearanceSettings.announcementStyle),
      showOnHomepage: booleanValue(
        appearanceSettings.showOnHomepage,
        defaultGroups.appearanceSettings.showOnHomepage
      ),
      showOnShop: booleanValue(
        appearanceSettings.showOnShop,
        defaultGroups.appearanceSettings.showOnShop
      ),
      showOnProductPages: booleanValue(
        appearanceSettings.showOnProductPages,
        defaultGroups.appearanceSettings.showOnProductPages
      ),
      showOnCheckout: booleanValue(
        appearanceSettings.showOnCheckout,
        defaultGroups.appearanceSettings.showOnCheckout
      ),
    },
    advancedSettings: {
      maintenanceMode: booleanValue(
        advancedSettings.maintenanceMode,
        defaultGroups.advancedSettings.maintenanceMode
      ),
      testMode: booleanValue(
        advancedSettings.testMode,
        defaultGroups.advancedSettings.testMode
      ),
      debugMode: booleanValue(
        advancedSettings.debugMode,
        defaultGroups.advancedSettings.debugMode
      ),
      purgeDeletedProductsAfterDays: safeText(
        advancedSettings.purgeDeletedProductsAfterDays,
        defaultGroups.advancedSettings.purgeDeletedProductsAfterDays
      ),
      systemVersionLabel: safeText(
        advancedSettings.systemVersionLabel,
        defaultGroups.advancedSettings.systemVersionLabel
      ),
      backupReminderText: safeText(
        advancedSettings.backupReminderText,
        defaultGroups.advancedSettings.backupReminderText
      ),
    },
    homepageMediaSettings: {
      showHero: booleanValue(
        homepageMediaRaw.showHero,
        defaultGroups.homepageMediaSettings.showHero
      ),
      showTrustStrip: booleanValue(
        homepageMediaRaw.showTrustStrip,
        defaultGroups.homepageMediaSettings.showTrustStrip
      ),
      showStatStrip: booleanValue(
        homepageMediaRaw.showStatStrip,
        defaultGroups.homepageMediaSettings.showStatStrip
      ),
      showMarquee: booleanValue(
        homepageMediaRaw.showMarquee,
        defaultGroups.homepageMediaSettings.showMarquee
      ),
      showCategories: booleanValue(
        homepageMediaRaw.showCategories,
        defaultGroups.homepageMediaSettings.showCategories
      ),
      showFeaturedProducts: booleanValue(
        homepageMediaRaw.showFeaturedProducts,
        defaultGroups.homepageMediaSettings.showFeaturedProducts
      ),
      showStorySections: booleanValue(
        homepageMediaRaw.showStorySections,
        defaultGroups.homepageMediaSettings.showStorySections
      ),
      showTestimonials: booleanValue(
        homepageMediaRaw.showTestimonials,
        defaultGroups.homepageMediaSettings.showTestimonials
      ),
      showFAQ: booleanValue(
        homepageMediaRaw.showFAQ,
        defaultGroups.homepageMediaSettings.showFAQ
      ),
      showBottomCTA: booleanValue(
        homepageMediaRaw.showBottomCTA,
        defaultGroups.homepageMediaSettings.showBottomCTA
      ),
      splashEnabled: booleanValue(
        homepageMediaRaw.splashEnabled,
        defaultGroups.homepageMediaSettings.splashEnabled
      ),
      splashTitle: safeText(
        homepageMediaRaw.splashTitle,
        defaultGroups.homepageMediaSettings.splashTitle
      ),
      splashLogoUrl: publicUrlValue(homepageMediaRaw.splashLogoUrl) ||
        defaultGroups.homepageMediaSettings.splashLogoUrl,
      statItem1Value: safeText(
        homepageMediaRaw.statItem1Value,
        defaultGroups.homepageMediaSettings.statItem1Value
      ),
      statItem1Label: safeText(
        homepageMediaRaw.statItem1Label,
        defaultGroups.homepageMediaSettings.statItem1Label
      ),
      statItem2Value: safeText(
        homepageMediaRaw.statItem2Value,
        defaultGroups.homepageMediaSettings.statItem2Value
      ),
      statItem2Label: safeText(
        homepageMediaRaw.statItem2Label,
        defaultGroups.homepageMediaSettings.statItem2Label
      ),
      statItem3Value: safeText(
        homepageMediaRaw.statItem3Value,
        defaultGroups.homepageMediaSettings.statItem3Value
      ),
      statItem3Label: safeText(
        homepageMediaRaw.statItem3Label,
        defaultGroups.homepageMediaSettings.statItem3Label
      ),
      marqueeItems: safeText(
        homepageMediaRaw.marqueeItems,
        defaultGroups.homepageMediaSettings.marqueeItems
      ),
      featuredProductsEyebrow: safeText(
        homepageMediaRaw.featuredProductsEyebrow,
        defaultGroups.homepageMediaSettings.featuredProductsEyebrow
      ),
      featuredProductsHeading: safeText(
        homepageMediaRaw.featuredProductsHeading,
        defaultGroups.homepageMediaSettings.featuredProductsHeading
      ),
      featuredProductsDescription: safeText(
        homepageMediaRaw.featuredProductsDescription,
        defaultGroups.homepageMediaSettings.featuredProductsDescription
      ),
      collectionsEyebrow: safeText(
        homepageMediaRaw.collectionsEyebrow,
        defaultGroups.homepageMediaSettings.collectionsEyebrow
      ),
      collectionsHeading: safeText(
        homepageMediaRaw.collectionsHeading,
        defaultGroups.homepageMediaSettings.collectionsHeading
      ),
      collectionsDescription: safeText(
        homepageMediaRaw.collectionsDescription,
        defaultGroups.homepageMediaSettings.collectionsDescription
      ),
      heroMedia: sectionMediaValue(
        isRecord(homepageMediaRaw.heroMedia) ? homepageMediaRaw.heroMedia : {}
      ),
      careMedia: sectionMediaValue(
        isRecord(homepageMediaRaw.careMedia) ? homepageMediaRaw.careMedia : {}
      ),
      experienceMedia: sectionMediaValue(
        isRecord(homepageMediaRaw.experienceMedia) ? homepageMediaRaw.experienceMedia : {}
      ),
      categoryReusablePeriodCare: categoryStateValue(
        homepageMediaRaw.categoryReusablePeriodCare,
        defaultGroups.homepageMediaSettings.categoryReusablePeriodCare
      ),
      categoryReusablePeriodCareImageUrl: publicUrlValue(homepageMediaRaw.categoryReusablePeriodCareImageUrl),
      categoryReusablePeriodCareVideoUrl: publicUrlValue(homepageMediaRaw.categoryReusablePeriodCareVideoUrl),
      categoryReusablePeriodCareMediaMode: categoryMediaModeValue(homepageMediaRaw.categoryReusablePeriodCareMediaMode, defaultGroups.homepageMediaSettings.categoryReusablePeriodCareMediaMode),
      categoryReusablePeriodCareAltText: safeText(homepageMediaRaw.categoryReusablePeriodCareAltText, defaultGroups.homepageMediaSettings.categoryReusablePeriodCareAltText),
      categoryReusablePeriodCareTitle: safeText(homepageMediaRaw.categoryReusablePeriodCareTitle, defaultGroups.homepageMediaSettings.categoryReusablePeriodCareTitle),
      categoryReusablePeriodCareDescription: safeText(homepageMediaRaw.categoryReusablePeriodCareDescription, defaultGroups.homepageMediaSettings.categoryReusablePeriodCareDescription),
      categoryReusablePeriodCareLinkUrl: safeText(homepageMediaRaw.categoryReusablePeriodCareLinkUrl, defaultGroups.homepageMediaSettings.categoryReusablePeriodCareLinkUrl),
      categoryComfortPanty: categoryStateValue(
        homepageMediaRaw.categoryComfortPanty,
        defaultGroups.homepageMediaSettings.categoryComfortPanty
      ),
      categoryComfortPantyImageUrl: publicUrlValue(homepageMediaRaw.categoryComfortPantyImageUrl),
      categoryComfortPantyVideoUrl: publicUrlValue(homepageMediaRaw.categoryComfortPantyVideoUrl),
      categoryComfortPantyMediaMode: categoryMediaModeValue(homepageMediaRaw.categoryComfortPantyMediaMode, defaultGroups.homepageMediaSettings.categoryComfortPantyMediaMode),
      categoryComfortPantyAltText: safeText(homepageMediaRaw.categoryComfortPantyAltText, defaultGroups.homepageMediaSettings.categoryComfortPantyAltText),
      categoryComfortPantyTitle: safeText(homepageMediaRaw.categoryComfortPantyTitle, defaultGroups.homepageMediaSettings.categoryComfortPantyTitle),
      categoryComfortPantyDescription: safeText(homepageMediaRaw.categoryComfortPantyDescription, defaultGroups.homepageMediaSettings.categoryComfortPantyDescription),
      categoryComfortPantyLinkUrl: safeText(homepageMediaRaw.categoryComfortPantyLinkUrl, defaultGroups.homepageMediaSettings.categoryComfortPantyLinkUrl),
      categorySoftSupportBra: categoryStateValue(
        homepageMediaRaw.categorySoftSupportBra,
        defaultGroups.homepageMediaSettings.categorySoftSupportBra
      ),
      categorySoftSupportBraImageUrl: publicUrlValue(homepageMediaRaw.categorySoftSupportBraImageUrl),
      categorySoftSupportBraVideoUrl: publicUrlValue(homepageMediaRaw.categorySoftSupportBraVideoUrl),
      categorySoftSupportBraMediaMode: categoryMediaModeValue(homepageMediaRaw.categorySoftSupportBraMediaMode, defaultGroups.homepageMediaSettings.categorySoftSupportBraMediaMode),
      categorySoftSupportBraAltText: safeText(homepageMediaRaw.categorySoftSupportBraAltText, defaultGroups.homepageMediaSettings.categorySoftSupportBraAltText),
      categorySoftSupportBraTitle: safeText(homepageMediaRaw.categorySoftSupportBraTitle, defaultGroups.homepageMediaSettings.categorySoftSupportBraTitle),
      categorySoftSupportBraDescription: safeText(homepageMediaRaw.categorySoftSupportBraDescription, defaultGroups.homepageMediaSettings.categorySoftSupportBraDescription),
      categorySoftSupportBraLinkUrl: safeText(homepageMediaRaw.categorySoftSupportBraLinkUrl, defaultGroups.homepageMediaSettings.categorySoftSupportBraLinkUrl),
      categoryNightwear: categoryStateValue(
        homepageMediaRaw.categoryNightwear,
        defaultGroups.homepageMediaSettings.categoryNightwear
      ),
      categoryNightwearImageUrl: publicUrlValue(homepageMediaRaw.categoryNightwearImageUrl),
      categoryNightwearVideoUrl: publicUrlValue(homepageMediaRaw.categoryNightwearVideoUrl),
      categoryNightwearMediaMode: categoryMediaModeValue(homepageMediaRaw.categoryNightwearMediaMode, defaultGroups.homepageMediaSettings.categoryNightwearMediaMode),
      categoryNightwearAltText: safeText(homepageMediaRaw.categoryNightwearAltText, defaultGroups.homepageMediaSettings.categoryNightwearAltText),
      categoryNightwearTitle: safeText(homepageMediaRaw.categoryNightwearTitle, defaultGroups.homepageMediaSettings.categoryNightwearTitle),
      categoryNightwearDescription: safeText(homepageMediaRaw.categoryNightwearDescription, defaultGroups.homepageMediaSettings.categoryNightwearDescription),
      categoryNightwearLinkUrl: safeText(homepageMediaRaw.categoryNightwearLinkUrl, defaultGroups.homepageMediaSettings.categoryNightwearLinkUrl),
      categoryHygieneEssentials: categoryStateValue(
        homepageMediaRaw.categoryHygieneEssentials,
        defaultGroups.homepageMediaSettings.categoryHygieneEssentials
      ),
      categoryHygieneEssentialsImageUrl: publicUrlValue(homepageMediaRaw.categoryHygieneEssentialsImageUrl),
      categoryHygieneEssentialsVideoUrl: publicUrlValue(homepageMediaRaw.categoryHygieneEssentialsVideoUrl),
      categoryHygieneEssentialsMediaMode: categoryMediaModeValue(homepageMediaRaw.categoryHygieneEssentialsMediaMode, defaultGroups.homepageMediaSettings.categoryHygieneEssentialsMediaMode),
      categoryHygieneEssentialsAltText: safeText(homepageMediaRaw.categoryHygieneEssentialsAltText, defaultGroups.homepageMediaSettings.categoryHygieneEssentialsAltText),
      categoryHygieneEssentialsTitle: safeText(homepageMediaRaw.categoryHygieneEssentialsTitle, defaultGroups.homepageMediaSettings.categoryHygieneEssentialsTitle),
      categoryHygieneEssentialsDescription: safeText(homepageMediaRaw.categoryHygieneEssentialsDescription, defaultGroups.homepageMediaSettings.categoryHygieneEssentialsDescription),
      categoryHygieneEssentialsLinkUrl: safeText(homepageMediaRaw.categoryHygieneEssentialsLinkUrl, defaultGroups.homepageMediaSettings.categoryHygieneEssentialsLinkUrl),
      categoryBundles: categoryStateValue(
        homepageMediaRaw.categoryBundles,
        defaultGroups.homepageMediaSettings.categoryBundles
      ),
      categoryBundlesImageUrl: publicUrlValue(homepageMediaRaw.categoryBundlesImageUrl),
      categoryBundlesVideoUrl: publicUrlValue(homepageMediaRaw.categoryBundlesVideoUrl),
      categoryBundlesMediaMode: categoryMediaModeValue(homepageMediaRaw.categoryBundlesMediaMode, defaultGroups.homepageMediaSettings.categoryBundlesMediaMode),
      categoryBundlesAltText: safeText(homepageMediaRaw.categoryBundlesAltText, defaultGroups.homepageMediaSettings.categoryBundlesAltText),
      categoryBundlesTitle: safeText(homepageMediaRaw.categoryBundlesTitle, defaultGroups.homepageMediaSettings.categoryBundlesTitle),
      categoryBundlesDescription: safeText(homepageMediaRaw.categoryBundlesDescription, defaultGroups.homepageMediaSettings.categoryBundlesDescription),
      categoryBundlesLinkUrl: safeText(homepageMediaRaw.categoryBundlesLinkUrl, defaultGroups.homepageMediaSettings.categoryBundlesLinkUrl),
      categoryNewArrivals: categoryStateValue(
        homepageMediaRaw.categoryNewArrivals,
        defaultGroups.homepageMediaSettings.categoryNewArrivals
      ),
      categoryNewArrivalsImageUrl: publicUrlValue(homepageMediaRaw.categoryNewArrivalsImageUrl),
      categoryNewArrivalsVideoUrl: publicUrlValue(homepageMediaRaw.categoryNewArrivalsVideoUrl),
      categoryNewArrivalsMediaMode: categoryMediaModeValue(homepageMediaRaw.categoryNewArrivalsMediaMode, defaultGroups.homepageMediaSettings.categoryNewArrivalsMediaMode),
      categoryNewArrivalsAltText: safeText(homepageMediaRaw.categoryNewArrivalsAltText, defaultGroups.homepageMediaSettings.categoryNewArrivalsAltText),
      categoryNewArrivalsTitle: safeText(homepageMediaRaw.categoryNewArrivalsTitle, defaultGroups.homepageMediaSettings.categoryNewArrivalsTitle),
      categoryNewArrivalsDescription: safeText(homepageMediaRaw.categoryNewArrivalsDescription, defaultGroups.homepageMediaSettings.categoryNewArrivalsDescription),
      categoryNewArrivalsLinkUrl: safeText(homepageMediaRaw.categoryNewArrivalsLinkUrl, defaultGroups.homepageMediaSettings.categoryNewArrivalsLinkUrl),
      categoryReusablePeriodCareSortOrder: safeText(homepageMediaRaw.categoryReusablePeriodCareSortOrder, defaultGroups.homepageMediaSettings.categoryReusablePeriodCareSortOrder),
      categoryComfortPantySortOrder: safeText(homepageMediaRaw.categoryComfortPantySortOrder, defaultGroups.homepageMediaSettings.categoryComfortPantySortOrder),
      categorySoftSupportBraSortOrder: safeText(homepageMediaRaw.categorySoftSupportBraSortOrder, defaultGroups.homepageMediaSettings.categorySoftSupportBraSortOrder),
      categoryNightwearSortOrder: safeText(homepageMediaRaw.categoryNightwearSortOrder, defaultGroups.homepageMediaSettings.categoryNightwearSortOrder),
      categoryHygieneEssentialsSortOrder: safeText(homepageMediaRaw.categoryHygieneEssentialsSortOrder, defaultGroups.homepageMediaSettings.categoryHygieneEssentialsSortOrder),
      categoryBundlesSortOrder: safeText(homepageMediaRaw.categoryBundlesSortOrder, defaultGroups.homepageMediaSettings.categoryBundlesSortOrder),
      categoryNewArrivalsSortOrder: safeText(homepageMediaRaw.categoryNewArrivalsSortOrder, defaultGroups.homepageMediaSettings.categoryNewArrivalsSortOrder),
      whatsappWidgetEnabled: booleanValue(
        homepageMediaRaw.whatsappWidgetEnabled,
        defaultGroups.homepageMediaSettings.whatsappWidgetEnabled
      ),
      whatsappWidgetLabel: safeText(
        homepageMediaRaw.whatsappWidgetLabel,
        defaultGroups.homepageMediaSettings.whatsappWidgetLabel
      ),
      whatsappWidgetLiveText: safeText(
        homepageMediaRaw.whatsappWidgetLiveText,
        defaultGroups.homepageMediaSettings.whatsappWidgetLiveText
      ),
      whatsappWidgetPlacement: widgetPlacementValue(
        homepageMediaRaw.whatsappWidgetPlacement,
        defaultGroups.homepageMediaSettings.whatsappWidgetPlacement
      ),
      liveChatEnabled: booleanValue(
        homepageMediaRaw.liveChatEnabled,
        defaultGroups.homepageMediaSettings.liveChatEnabled
      ),
      liveChatLabel: safeText(
        homepageMediaRaw.liveChatLabel,
        defaultGroups.homepageMediaSettings.liveChatLabel
      ),
      liveChatLink: safeText(
        homepageMediaRaw.liveChatLink,
        defaultGroups.homepageMediaSettings.liveChatLink
      ),
      liveChatPlacement: widgetPlacementValue(
        homepageMediaRaw.liveChatPlacement,
        defaultGroups.homepageMediaSettings.liveChatPlacement
      ),
      ctaSectionEnabled: booleanValue(
        homepageMediaRaw.ctaSectionEnabled,
        defaultGroups.homepageMediaSettings.ctaSectionEnabled
      ),
      ctaSectionEyebrow: safeText(
        homepageMediaRaw.ctaSectionEyebrow,
        defaultGroups.homepageMediaSettings.ctaSectionEyebrow
      ),
      ctaSectionHeading: safeText(
        homepageMediaRaw.ctaSectionHeading,
        defaultGroups.homepageMediaSettings.ctaSectionHeading
      ),
      ctaSectionDescription: safeText(
        homepageMediaRaw.ctaSectionDescription,
        defaultGroups.homepageMediaSettings.ctaSectionDescription
      ),
      ctaSectionPrimaryCtaText: safeText(
        homepageMediaRaw.ctaSectionPrimaryCtaText,
        defaultGroups.homepageMediaSettings.ctaSectionPrimaryCtaText
      ),
      ctaSectionPrimaryCtaLink: safeText(
        homepageMediaRaw.ctaSectionPrimaryCtaLink,
        defaultGroups.homepageMediaSettings.ctaSectionPrimaryCtaLink
      ),
      ctaSectionSecondaryCtaText: safeText(
        homepageMediaRaw.ctaSectionSecondaryCtaText,
        defaultGroups.homepageMediaSettings.ctaSectionSecondaryCtaText
      ),
      ctaSectionSecondaryCtaLink: safeText(
        homepageMediaRaw.ctaSectionSecondaryCtaLink,
        defaultGroups.homepageMediaSettings.ctaSectionSecondaryCtaLink
      ),
      ctaSectionMediaMode: ctaSectionMediaModeValue(homepageMediaRaw.ctaSectionMediaMode),
      ctaSectionImageUrl: publicUrlValue(homepageMediaRaw.ctaSectionImageUrl),
      ctaSectionVideoUrl: publicUrlValue(homepageMediaRaw.ctaSectionVideoUrl),
      ctaSectionAltText: safeText(homepageMediaRaw.ctaSectionAltText, ""),
      layerComfortEnabled: booleanValue(
        homepageMediaRaw.layerComfortEnabled,
        defaultGroups.homepageMediaSettings.layerComfortEnabled
      ),
      layerComfortEyebrow: safeText(
        homepageMediaRaw.layerComfortEyebrow,
        defaultGroups.homepageMediaSettings.layerComfortEyebrow
      ),
      layerComfortHeading: safeText(
        homepageMediaRaw.layerComfortHeading,
        defaultGroups.homepageMediaSettings.layerComfortHeading
      ),
      layerComfortDescription: safeText(
        homepageMediaRaw.layerComfortDescription,
        defaultGroups.homepageMediaSettings.layerComfortDescription
      ),
      layerComfortLayer1Title: safeText(
        homepageMediaRaw.layerComfortLayer1Title,
        defaultGroups.homepageMediaSettings.layerComfortLayer1Title
      ),
      layerComfortLayer1Description: safeText(
        homepageMediaRaw.layerComfortLayer1Description,
        defaultGroups.homepageMediaSettings.layerComfortLayer1Description
      ),
      layerComfortLayer2Title: safeText(
        homepageMediaRaw.layerComfortLayer2Title,
        defaultGroups.homepageMediaSettings.layerComfortLayer2Title
      ),
      layerComfortLayer2Description: safeText(
        homepageMediaRaw.layerComfortLayer2Description,
        defaultGroups.homepageMediaSettings.layerComfortLayer2Description
      ),
      layerComfortLayer3Title: safeText(
        homepageMediaRaw.layerComfortLayer3Title,
        defaultGroups.homepageMediaSettings.layerComfortLayer3Title
      ),
      layerComfortLayer3Description: safeText(
        homepageMediaRaw.layerComfortLayer3Description,
        defaultGroups.homepageMediaSettings.layerComfortLayer3Description
      ),
      layerComfortCtaText: safeText(
        homepageMediaRaw.layerComfortCtaText,
        defaultGroups.homepageMediaSettings.layerComfortCtaText
      ),
      layerComfortCtaLink: safeText(
        homepageMediaRaw.layerComfortCtaLink,
        defaultGroups.homepageMediaSettings.layerComfortCtaLink
      ),
      layerComfortMediaMode: layerComfortMediaModeValue(homepageMediaRaw.layerComfortMediaMode),
      layerComfortImageUrl: publicUrlValue(homepageMediaRaw.layerComfortImageUrl),
      layerComfortVideoUrl: publicUrlValue(homepageMediaRaw.layerComfortVideoUrl),
      layerComfortAltText: safeText(homepageMediaRaw.layerComfortAltText, ""),
      findCareEnabled: booleanValue(
        homepageMediaRaw.findCareEnabled,
        defaultGroups.homepageMediaSettings.findCareEnabled
      ),
      findCareEyebrow: safeText(
        homepageMediaRaw.findCareEyebrow,
        defaultGroups.homepageMediaSettings.findCareEyebrow
      ),
      findCareHeading: safeText(
        homepageMediaRaw.findCareHeading,
        defaultGroups.homepageMediaSettings.findCareHeading
      ),
      findCareDescription: safeText(
        homepageMediaRaw.findCareDescription,
        defaultGroups.homepageMediaSettings.findCareDescription
      ),
      findCareCtaText: safeText(
        homepageMediaRaw.findCareCtaText,
        defaultGroups.homepageMediaSettings.findCareCtaText
      ),
      findCareCtaLink: safeText(
        homepageMediaRaw.findCareCtaLink,
        defaultGroups.homepageMediaSettings.findCareCtaLink
      ),
      findCareCard1Title: safeText(
        homepageMediaRaw.findCareCard1Title,
        defaultGroups.homepageMediaSettings.findCareCard1Title
      ),
      findCareCard1Description: safeText(
        homepageMediaRaw.findCareCard1Description,
        defaultGroups.homepageMediaSettings.findCareCard1Description
      ),
      findCareCard1LinkUrl: safeText(
        homepageMediaRaw.findCareCard1LinkUrl,
        defaultGroups.homepageMediaSettings.findCareCard1LinkUrl
      ),
      findCareCard2Title: safeText(
        homepageMediaRaw.findCareCard2Title,
        defaultGroups.homepageMediaSettings.findCareCard2Title
      ),
      findCareCard2Description: safeText(
        homepageMediaRaw.findCareCard2Description,
        defaultGroups.homepageMediaSettings.findCareCard2Description
      ),
      findCareCard2LinkUrl: safeText(
        homepageMediaRaw.findCareCard2LinkUrl,
        defaultGroups.homepageMediaSettings.findCareCard2LinkUrl
      ),
      findCareCard3Title: safeText(
        homepageMediaRaw.findCareCard3Title,
        defaultGroups.homepageMediaSettings.findCareCard3Title
      ),
      findCareCard3Description: safeText(
        homepageMediaRaw.findCareCard3Description,
        defaultGroups.homepageMediaSettings.findCareCard3Description
      ),
      findCareCard3LinkUrl: safeText(
        homepageMediaRaw.findCareCard3LinkUrl,
        defaultGroups.homepageMediaSettings.findCareCard3LinkUrl
      ),
      faqPreviewEyebrow: safeText(
        homepageMediaRaw.faqPreviewEyebrow,
        defaultGroups.homepageMediaSettings.faqPreviewEyebrow
      ),
      faqPreviewHeading: safeText(
        homepageMediaRaw.faqPreviewHeading,
        defaultGroups.homepageMediaSettings.faqPreviewHeading
      ),
      faqPreviewItem1Question: safeText(
        homepageMediaRaw.faqPreviewItem1Question,
        defaultGroups.homepageMediaSettings.faqPreviewItem1Question
      ),
      faqPreviewItem1Answer: safeText(
        homepageMediaRaw.faqPreviewItem1Answer,
        defaultGroups.homepageMediaSettings.faqPreviewItem1Answer
      ),
      faqPreviewItem2Question: safeText(
        homepageMediaRaw.faqPreviewItem2Question,
        defaultGroups.homepageMediaSettings.faqPreviewItem2Question
      ),
      faqPreviewItem2Answer: safeText(
        homepageMediaRaw.faqPreviewItem2Answer,
        defaultGroups.homepageMediaSettings.faqPreviewItem2Answer
      ),
      faqPreviewItem3Question: safeText(
        homepageMediaRaw.faqPreviewItem3Question,
        defaultGroups.homepageMediaSettings.faqPreviewItem3Question
      ),
      faqPreviewItem3Answer: safeText(
        homepageMediaRaw.faqPreviewItem3Answer,
        defaultGroups.homepageMediaSettings.faqPreviewItem3Answer
      ),
      shopHeroEnabled: booleanValue(homepageMediaRaw.shopHeroEnabled, defaultGroups.homepageMediaSettings.shopHeroEnabled),
      shopHeroEyebrow: safeText(homepageMediaRaw.shopHeroEyebrow, defaultGroups.homepageMediaSettings.shopHeroEyebrow),
      shopHeroTitle: safeText(homepageMediaRaw.shopHeroTitle, defaultGroups.homepageMediaSettings.shopHeroTitle),
      shopHeroSubtitle: safeText(homepageMediaRaw.shopHeroSubtitle, defaultGroups.homepageMediaSettings.shopHeroSubtitle),
      shopHeroPrimaryCtaText: safeText(homepageMediaRaw.shopHeroPrimaryCtaText, defaultGroups.homepageMediaSettings.shopHeroPrimaryCtaText),
      shopHeroPrimaryCtaLink: safeText(homepageMediaRaw.shopHeroPrimaryCtaLink, defaultGroups.homepageMediaSettings.shopHeroPrimaryCtaLink),
      shopHeroSecondaryCtaText: safeText(homepageMediaRaw.shopHeroSecondaryCtaText, defaultGroups.homepageMediaSettings.shopHeroSecondaryCtaText),
      shopHeroSecondaryCtaLink: safeText(homepageMediaRaw.shopHeroSecondaryCtaLink, defaultGroups.homepageMediaSettings.shopHeroSecondaryCtaLink),
      shopHeroMediaUrl: publicUrlValue(homepageMediaRaw.shopHeroMediaUrl),
      shopHeroMediaType: shopHeroMediaTypeValue(homepageMediaRaw.shopHeroMediaType),
      shopHeroMediaAlt: safeText(homepageMediaRaw.shopHeroMediaAlt, defaultGroups.homepageMediaSettings.shopHeroMediaAlt),
      shopHeroBadge1: safeText(homepageMediaRaw.shopHeroBadge1, defaultGroups.homepageMediaSettings.shopHeroBadge1),
      shopHeroBadge2: safeText(homepageMediaRaw.shopHeroBadge2, defaultGroups.homepageMediaSettings.shopHeroBadge2),
      shopHeroCaption: safeText(homepageMediaRaw.shopHeroCaption, defaultGroups.homepageMediaSettings.shopHeroCaption),
      shopHeroTrust1Label: safeText(homepageMediaRaw.shopHeroTrust1Label, defaultGroups.homepageMediaSettings.shopHeroTrust1Label),
      shopHeroTrust1Description: safeText(homepageMediaRaw.shopHeroTrust1Description, defaultGroups.homepageMediaSettings.shopHeroTrust1Description),
      shopHeroTrust2Label: safeText(homepageMediaRaw.shopHeroTrust2Label, defaultGroups.homepageMediaSettings.shopHeroTrust2Label),
      shopHeroTrust2Description: safeText(homepageMediaRaw.shopHeroTrust2Description, defaultGroups.homepageMediaSettings.shopHeroTrust2Description),
      shopHeroTrust3Label: safeText(homepageMediaRaw.shopHeroTrust3Label, defaultGroups.homepageMediaSettings.shopHeroTrust3Label),
      shopHeroTrust3Description: safeText(homepageMediaRaw.shopHeroTrust3Description, defaultGroups.homepageMediaSettings.shopHeroTrust3Description),
    },
  };

  return buildAdminSettings(groups);
}

export const defaultAdminSettings: AdminSettings = buildAdminSettings(defaultGroups);

export function publicAdminSettings(settings: AdminSettings) {
  const normalized = normalizeAdminSettings(settings);

  return normalizeAdminSettings({
    storeProfile: normalized.storeProfile,
    paymentSettings: normalized.paymentSettings,
    checkoutSettings: normalized.checkoutSettings,
    deliverySettings: normalized.deliverySettings,
    policySettings: normalized.policySettings,
    seoSettings: normalized.seoSettings,
    appearanceSettings: normalized.appearanceSettings,
    homepageMediaSettings: normalized.homepageMediaSettings,
  });
}

export function whatsappHref(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";

  const international = digits.startsWith("880")
    ? digits
    : digits.startsWith("0")
      ? `88${digits}`
      : digits;

  return `https://wa.me/${international}`;
}
