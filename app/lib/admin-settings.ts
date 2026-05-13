export const ADMIN_SETTINGS_KEY = "aevyrixa-admin-settings";

export const walletProviders = ["bKash", "Nagad", "Rocket", "Upay"] as const;

export type WalletProvider = (typeof walletProviders)[number];

export type AdminSettings = {
  storeName: string;
  guaranteeText: string;
  deliveryNote: string;
  walletReceiverNumbers: Record<WalletProvider, string>;
  bankTransferInstruction: string;
  codInstruction: string;
};

export const defaultAdminSettings: AdminSettings = {
  storeName: "Aevyrixa Her Care",
  guaranteeText: "3-Day Hygiene-Safe Support",
  deliveryNote: "Estimated delivery will be confirmed by our team after order review.",
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

export function normalizeAdminSettings(value: unknown): AdminSettings {
  if (!isRecord(value)) return defaultAdminSettings;

  const storedWallets = isRecord(value.walletReceiverNumbers)
    ? value.walletReceiverNumbers
    : {};

  return {
    storeName: textValue(value.storeName) || defaultAdminSettings.storeName,
    guaranteeText:
      textValue(value.guaranteeText) || defaultAdminSettings.guaranteeText,
    deliveryNote: textValue(value.deliveryNote) || defaultAdminSettings.deliveryNote,
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
      textValue(value.codInstruction) || defaultAdminSettings.codInstruction,
  };
}
