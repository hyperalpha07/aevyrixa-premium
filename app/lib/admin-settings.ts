export const ADMIN_SETTINGS_KEY = "aevyrixa-admin-settings";

export const walletProviders = ["bKash", "Nagad", "Rocket", "Upay"] as const;

export type WalletProvider = (typeof walletProviders)[number];

export type AdminSettings = {
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

export const defaultAdminSettings: AdminSettings = {
  storeName: "Aevyrixa Her Care",
  supportPhone: "01644037384",
  supportWhatsApp: "01644037384",
  supportEmail: "support@aevyrixa.com",
  facebookPageUrl: "",
  instagramUrl: "",
  tiktokUrl: "",
  businessLocation: "Dhaka, Bangladesh",
  deliveryCoverageText:
    "Bangladesh delivery is available with order confirmation before dispatch.",
  codMessage:
    "Cash on Delivery is supported for eligible Bangladesh orders after confirmation.",
  privacyPackagingMessage:
    "Orders ship in discreet privacy packaging without sensitive product details on the outside.",
  supportWindowMessage:
    "3-Day Hygiene-Safe Support is available for eligible order, size, wrong item, or damaged item concerns.",
  hygieneReturnMessage:
    "Eligible support requests require unused, unwashed items in original packaging with tags and hygiene liner/seal where applicable.",
  orderConfirmationMessage:
    "Need help? Contact Aevyrixa support with your order reference.",
  guaranteeText: "3-Day Hygiene-Safe Support",
  deliveryNote:
    "Bangladesh delivery estimate is 2-7 working days after confirmation. Our team reviews delivery details before dispatch.",
  walletReceiverNumbers: {
    bKash: "01644037384",
    Nagad: "01644037384",
    Rocket: "016440373844",
    Upay: "01644037384",
  },
  bankTransferInstruction:
    "Our team will share verified bank details after confirming your order.",
  codInstruction:
    "Pay when your order is confirmed and delivered according to your selected delivery method.",
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
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

function guaranteeTextValue(value: unknown) {
  const guaranteeText = textValue(value);
  if (!guaranteeText) return defaultAdminSettings.guaranteeText;

  if (/7\s*-?\s*day|money back|coverage/i.test(guaranteeText)) {
    return defaultAdminSettings.guaranteeText;
  }

  return guaranteeText;
}

function supportWindowMessageValue(value: unknown) {
  const supportWindowMessage = textValue(value);
  if (!supportWindowMessage) return defaultAdminSettings.supportWindowMessage;

  if (/7\s*-?\s*day|money back|coverage/i.test(supportWindowMessage)) {
    return defaultAdminSettings.supportWindowMessage;
  }

  return supportWindowMessage;
}

export function normalizeAdminSettings(value: unknown): AdminSettings {
  if (!isRecord(value)) return defaultAdminSettings;

  const storedWallets = isRecord(value.walletReceiverNumbers)
    ? value.walletReceiverNumbers
    : {};

  return {
    storeName: textValue(value.storeName) || defaultAdminSettings.storeName,
    supportPhone:
      textValue(value.supportPhone) || defaultAdminSettings.supportPhone,
    supportWhatsApp:
      textValue(value.supportWhatsApp) || defaultAdminSettings.supportWhatsApp,
    supportEmail:
      textValue(value.supportEmail) || defaultAdminSettings.supportEmail,
    facebookPageUrl:
      publicUrlValue(value.facebookPageUrl) ||
      defaultAdminSettings.facebookPageUrl,
    instagramUrl:
      publicUrlValue(value.instagramUrl) || defaultAdminSettings.instagramUrl,
    tiktokUrl: publicUrlValue(value.tiktokUrl) || defaultAdminSettings.tiktokUrl,
    businessLocation:
      textValue(value.businessLocation) || defaultAdminSettings.businessLocation,
    deliveryCoverageText:
      textValue(value.deliveryCoverageText) ||
      textValue(value.deliveryNote) ||
      defaultAdminSettings.deliveryCoverageText,
    codMessage:
      textValue(value.codMessage) ||
      textValue(value.codInstruction) ||
      defaultAdminSettings.codMessage,
    privacyPackagingMessage:
      textValue(value.privacyPackagingMessage) ||
      defaultAdminSettings.privacyPackagingMessage,
    supportWindowMessage: supportWindowMessageValue(value.supportWindowMessage),
    hygieneReturnMessage:
      textValue(value.hygieneReturnMessage) ||
      defaultAdminSettings.hygieneReturnMessage,
    orderConfirmationMessage:
      textValue(value.orderConfirmationMessage) ||
      defaultAdminSettings.orderConfirmationMessage,
    guaranteeText: guaranteeTextValue(value.guaranteeText),
    deliveryNote:
      textValue(value.deliveryNote) ||
      textValue(value.deliveryCoverageText) ||
      defaultAdminSettings.deliveryNote,
    walletReceiverNumbers: {
      bKash:
        textValue(storedWallets.bKash) ||
        textValue(value.bKashReceiverNumber) ||
        defaultAdminSettings.walletReceiverNumbers.bKash,
      Nagad:
        textValue(storedWallets.Nagad) ||
        textValue(value.nagadReceiverNumber) ||
        defaultAdminSettings.walletReceiverNumbers.Nagad,
      Rocket:
        textValue(storedWallets.Rocket) ||
        textValue(value.rocketReceiverNumber) ||
        defaultAdminSettings.walletReceiverNumbers.Rocket,
      Upay:
        textValue(storedWallets.Upay) ||
        textValue(value.upayReceiverNumber) ||
        defaultAdminSettings.walletReceiverNumbers.Upay,
    },
    bankTransferInstruction:
      textValue(value.bankTransferInstruction) ||
      defaultAdminSettings.bankTransferInstruction,
    codInstruction:
      textValue(value.codInstruction) ||
      textValue(value.codMessage) ||
      defaultAdminSettings.codInstruction,
  };
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
