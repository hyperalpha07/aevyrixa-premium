export const adminV2Motion = {
  duration: {
    micro: 140,
    hover: 180,
    page: 220,
    overlay: 260,
    ambient: 14000,
  },
  easing: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    entrance: "cubic-bezier(0.16, 1, 0.3, 1)",
    exit: "cubic-bezier(0.4, 0, 1, 1)",
  },
  distance: {
    page: 10,
    reveal: 8,
    hover: 3,
  },
} as const;

export function adminV2Transition(
  properties: string | string[],
  duration: number = adminV2Motion.duration.micro,
  easing: string = adminV2Motion.easing.standard
) {
  const props = Array.isArray(properties) ? properties : [properties];
  return props.map((property) => `${property} ${duration}ms ${easing}`).join(", ");
}
