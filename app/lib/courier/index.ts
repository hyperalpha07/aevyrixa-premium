import { manualCourierAdapter } from "@/app/lib/courier/manual-courier";
import { pathaoCourierAdapter } from "@/app/lib/courier/pathao-courier";
import { steadfastCourierAdapter } from "@/app/lib/courier/steadfast-courier";
import type {
  CourierAdapter,
  CourierIntegrationMode,
} from "@/app/lib/courier/courier-types";

export function getCourierAdapter(mode: CourierIntegrationMode): CourierAdapter {
  if (mode === "pathao") return pathaoCourierAdapter;
  if (mode === "steadfast") return steadfastCourierAdapter;

  return manualCourierAdapter;
}

export type {
  CourierAdapter,
  CourierIntegrationMode,
  CourierParcelResult,
  CourierTrackingResult,
} from "@/app/lib/courier/courier-types";
