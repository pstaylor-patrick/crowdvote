"use server";

export async function getAppUrl(): Promise<string> {
  return await Promise.resolve(process.env.APP_URL || "http://localhost:3000");
}
