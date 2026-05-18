import type { OrderRecord } from "@/app/lib/order-types";

export type CourierIntegrationMode = "manual" | "pathao" | "steadfast" | "redx" | "custom";

export type CourierParcelResult = {
  mode: CourierIntegrationMode;
  status: "manual" | "not_configured" | "not_implemented";
  message: string;
  trackingId?: string;
};

export type CourierTrackingResult = {
  mode: CourierIntegrationMode;
  status: "manual" | "not_configured" | "not_implemented";
  message: string;
  deliveryStatus?: OrderRecord["deliveryStatus"];
};

export type CourierAdapter = {
  mode: CourierIntegrationMode;
  createParcel(order: OrderRecord): Promise<CourierParcelResult>;
  getTrackingStatus(trackingId: string): Promise<CourierTrackingResult>;
  cancelParcel(trackingId: string): Promise<CourierParcelResult>;
};
