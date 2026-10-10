export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") return;
  const { readSecret } = await import("@/lib/secrets");
  if (!readSecret("DB_PASSWORD")) console.warn("DB_PASSWORD(_FILE) is not set: visitor statistics are disabled.");
}
