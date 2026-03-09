export function validateAdminToken(token: string, adminPassword: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64").toString();
    const parts = decoded.split(":");
    return parts.length >= 2 && parts.slice(1).join(":") === adminPassword;
  } catch {
    return false;
  }
}
