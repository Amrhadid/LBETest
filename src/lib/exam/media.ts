/**
 * Human-readable, actionable messages for getUserMedia failures. Isomorphic.
 *
 * getUserMedia rejects with a DOMException whose `name` tells us WHY. We map
 * each cause to a message that says what the candidate should actually do,
 * instead of a single opaque "couldn't access your camera".
 */
export function cameraErrorMessage(err: unknown): string {
  // Insecure context (http): navigator.mediaDevices is undefined entirely.
  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices ||
    typeof navigator.mediaDevices.getUserMedia !== "function"
  ) {
    return "Camera access needs a secure (https) connection. Open this exam on the official https:// site.";
  }

  const name = (err as { name?: string })?.name ?? "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Your browser is blocking the camera for this site. Click the camera icon in the address bar (or Chrome → Settings → Privacy and security → Site settings → Camera) and set this site to Allow, then reload.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No camera was found on this device. Connect a webcam and reload.";
    case "NotReadableError":
    case "AbortError":
      return "Your camera is being used by another app (Zoom, FaceTime, Photo Booth, or another browser tab). Close it, then try again.";
    default:
      return "We couldn't access your camera. Make sure no other app is using it, that this site is allowed to use the camera, and reload.";
  }
}
