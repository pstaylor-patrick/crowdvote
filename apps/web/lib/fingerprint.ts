/**
 * Generate a device fingerprint from canvas rendering, screen, GPU, and hardware signals.
 * Survives cookie clearing and incognito mode.
 */
export async function getFingerprint(): Promise<string> {
  const signals: string[] = [];

  // Canvas rendering — different GPUs/fonts/OS produce different pixels
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillStyle = "#f60";
      ctx.fillRect(0, 0, 100, 50);
      ctx.fillStyle = "#069";
      ctx.fillText("CrowdVote fp", 2, 15);
      ctx.fillStyle = "rgba(102,204,0,0.7)";
      ctx.fillText("CrowdVote fp", 4, 17);
      signals.push(canvas.toDataURL());
    }
  } catch {
    // canvas blocked
  }

  // Screen properties
  signals.push(`${screen.width}x${screen.height}x${devicePixelRatio}`);

  // WebGL renderer (GPU model)
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    if (gl) {
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      if (ext) {
        signals.push(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL));
      }
    }
  } catch {
    // webgl blocked
  }

  // Hardware
  signals.push(String(navigator.hardwareConcurrency ?? 0));
  signals.push(String(navigator.maxTouchPoints ?? 0));

  // Platform / language
  signals.push(navigator.platform ?? "");
  signals.push(navigator.language ?? "");

  // Hash with SHA-256
  const data = new TextEncoder().encode(signals.join("|"));
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
