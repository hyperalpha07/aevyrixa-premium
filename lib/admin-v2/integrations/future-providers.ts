/**
 * Provider onboarding registry. Descriptive only: none of these providers is
 * connected, enabled, or allowed to execute network/payment/booking actions.
 *
 * When credentials become available, implement a server-only adapter with
 * provider-specific staging verification, approval gates, signature checks,
 * idempotency and audit events BEFORE offering an Enable action.
 * Credentials must be provisioned through a server-side secret manager.
 */
export type FutureProviderId =
  | "bkash-merchant"
  | "nagad-merchant"
  | "pathao-booking"
  | "steadfast-booking"
  | "whatsapp-business";

export type FutureProviderSlot = {
  id: FutureProviderId;
  name: string;
  category: "Payment gateway" | "Courier API" | "Messaging API";
  status: "awaiting_provider_onboarding";
  description: string;
  prerequisites: readonly string[];
  destination: string;
  destinationLabel: string;
};

export const futureProviderSlots: readonly FutureProviderSlot[] = [
  {
    id: "bkash-merchant",
    name: "bKash Merchant API",
    category: "Payment gateway",
    status: "awaiting_provider_onboarding",
    description: "Future merchant checkout and payment status verification. Existing manual bKash remains unchanged.",
    prerequisites: ["Merchant approval and API credentials", "Sandbox payment and refund validation", "Signed callbacks, replay protection, reconciliation and audit"],
    destination: "/admin-v2/transactions", destinationLabel: "Payment ledger",
  },
  {
    id: "nagad-merchant",
    name: "Nagad Merchant API",
    category: "Payment gateway",
    status: "awaiting_provider_onboarding",
    description: "Future merchant checkout and settlement reconciliation. Existing manual Nagad remains unchanged.",
    prerequisites: ["Merchant approval and API credentials", "Sandbox checkout and failure scenarios", "Signed callbacks, replay protection, reconciliation and audit"],
    destination: "/admin-v2/transactions", destinationLabel: "Payment ledger",
  },
  {
    id: "pathao-booking",
    name: "Pathao Courier API",
    category: "Courier API",
    status: "awaiting_provider_onboarding",
    description: "Future approved order booking, tracking synchronization and cancellation. Manual courier workflow stays available.",
    prerequisites: ["Courier account and verified API access", "Sandbox booking/cancellation testing", "Explicit staff confirmation, deduplication and tracking audit"],
    destination: "/admin-v2/couriers", destinationLabel: "Courier operations",
  },
  {
    id: "steadfast-booking",
    name: "Steadfast Courier API",
    category: "Courier API",
    status: "awaiting_provider_onboarding",
    description: "Future approved shipment booking and tracking. Manual courier workflow stays available.",
    prerequisites: ["Courier account and verified API access", "Sandbox booking/cancellation testing", "Explicit staff confirmation, deduplication and tracking audit"],
    destination: "/admin-v2/couriers", destinationLabel: "Courier operations",
  },
  {
    id: "whatsapp-business",
    name: "WhatsApp Business Platform",
    category: "Messaging API",
    status: "awaiting_provider_onboarding",
    description: "Future consent-based customer conversations and approved templates. Current WhatsApp contact link is separate.",
    prerequisites: ["Verified business and approved WhatsApp account", "Phone number registration and approved templates", "Customer consent, webhook signature validation and opt-out handling"],
    destination: "/admin-v2/support", destinationLabel: "Support inbox",
  },
];
