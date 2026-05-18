import type { CourierAdapter } from "@/app/lib/courier/courier-types";

function hasPathaoCredentials() {
  return Boolean(
    process.env.PATHAO_CLIENT_ID &&
      process.env.PATHAO_CLIENT_SECRET &&
      process.env.PATHAO_USERNAME &&
      process.env.PATHAO_PASSWORD &&
      process.env.PATHAO_STORE_ID
  );
}

function disabledResult() {
  return {
    mode: "pathao" as const,
    status: hasPathaoCredentials() ? ("not_implemented" as const) : ("not_configured" as const),
    message: hasPathaoCredentials()
      ? "Pathao credentials are present, but live booking is intentionally disabled until API endpoints are confirmed."
      : "Pathao API credentials are not configured. Manual courier mode remains the safe path.",
  };
}

export const pathaoCourierAdapter: CourierAdapter = {
  mode: "pathao",
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
