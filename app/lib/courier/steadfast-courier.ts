import type { CourierAdapter } from "@/app/lib/courier/courier-types";

function hasSteadfastCredentials() {
  return Boolean(process.env.STEADFAST_API_KEY && process.env.STEADFAST_SECRET_KEY);
}

function disabledResult() {
  return {
    mode: "steadfast" as const,
    status: hasSteadfastCredentials()
      ? ("not_implemented" as const)
      : ("not_configured" as const),
    message: hasSteadfastCredentials()
      ? "Steadfast credentials are present, but live booking is intentionally disabled until API endpoints are confirmed."
      : "Steadfast API credentials are not configured. Manual courier mode remains the safe path.",
  };
}

export const steadfastCourierAdapter: CourierAdapter = {
  mode: "steadfast",
  async createParcel() {
    return disabledResult();
  },
  async getTrackingStatus() {
    return disabledResult();
  },
  async cancelParcel() {
    return disabledResult();
  },
};
