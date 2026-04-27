import type { TrackingType } from "./types";

export type TrackingMode = "boolean" | "measurement" | "duration";

export const TRACKING_MODE_OPTIONS: TrackingMode[] = [
  "boolean",
  "measurement",
  "duration",
];

export function toTrackingMode(trackingType: TrackingType): TrackingMode {
  if (trackingType === "boolean") return "boolean";
  if (trackingType === "duration") return "duration";
  return "measurement";
}
