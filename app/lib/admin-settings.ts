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
  facebookPageUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
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
};

export type DeliverySettings = {
  deliveryCoverageText: string;
  defaultDeliveryCharge: string;
  insideDhakaDeliveryCharge: string;
  outsideDhakaDeliveryCharge: string;
  courierPartners: string;
  defaultCourier: string;
  estimatedDeliveryTime: string;
  dispatchConfirmationMessage: string;
  trackingSupportMessage: string;
};

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
};

export type AdminSettings = AdminSettingsGroups & {
  storeName: string;
  supportPhone: string;
  supportWhatsApp: string;
  supportEmail: string;
  facebookPageUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
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
    facebookPageUrl: "",
    instagramUrl: "",
    tiktokUrl: "",
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
  },
  deliverySettings: {
    deliveryCoverageText:
      "Bangladesh delivery is available with order confirmation before dispatch.",
    defaultDeliveryCharge: "",
    insideDhakaDeliveryCharge: "80",
    outsideDhakaDeliveryCharge: "130",
    courierPartners: "",
    defaultCourier: "",
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
  },
  advancedSettings: {
    maintenanceMode: false,
    testMode: false,
    debugMode: false,
    purgeDeletedProductsAfterDays: "",
    systemVersionLabel: "Aevyrixa Control Room — Phase 30 Support + Policy System",
    backupReminderText: "Review Supabase and Vercel backups before major changes.",
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
      facebookPageUrl:
        publicUrlValue(storeProfile.facebookPageUrl) ||
        publicUrlValue(value.facebookPageUrl),
      instagramUrl:
        publicUrlValue(storeProfile.instagramUrl) || publicUrlValue(value.instagramUrl),
      tiktokUrl: publicUrlValue(storeProfile.tiktokUrl) || publicUrlValue(value.tiktokUrl),
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
      defaultCourier: safeText(
        deliverySettings.defaultCourier,
        defaultGroups.deliverySettings.defaultCourier
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
