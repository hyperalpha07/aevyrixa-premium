import type { CourierAdapter } from "@/app/lib/courier/courier-types";

export const manualCourierAdapter: CourierAdapter = {
  mode: "manual",
  async createParcel(order) {
    return {
      mode: "manual",
      status: "manual",
      message:
        "Manual courier mode is active. Create the parcel in the courier dashboard and save the tracking ID on the order.",
      trackingId: order.trackingId,
    };
  },
  async getTrackingStatus() {
    return {
      mode: "manual",
      status: "manual",
      message: "Tracking is updated manually by admin.",
    };
  },
  async cancelParcel() {
    return {
      mode: "manual",
      status: "manual",
      message: "Cancel the parcel manually in the courier dashboard if needed.",
    };
  },
};
