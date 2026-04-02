/** Browser Origin has no trailing slash; .env often has one — mismatch causes Better Auth "invalid origin". */
export function normalizeAppOrigin(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/** Origins allowed for Better Auth CSRF / Origin checks (frontend + optional extras). */
export function buildTrustedOrigins(): string[] {
  const extras =
    process.env.TRUSTED_ORIGINS?.split(/[\s,]+/)
      .map((s) => normalizeAppOrigin(s.trim()))
      .filter(Boolean) ?? [];

  const list = [
    process.env.CLIENT_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://[::1]:3000",
    ...extras,
  ]
    .filter((x): x is string => Boolean(x))
    .map(normalizeAppOrigin);

  return [...new Set(list)];
}

export function buildCorsOrigins(): string[] {
  const list = [
    ...buildTrustedOrigins(),
    ...(process.env.BETTER_AUTH_URL
      ? [normalizeAppOrigin(process.env.BETTER_AUTH_URL)]
      : []),
    "http://localhost:5000",
    "http://127.0.0.1:5000",
  ];
  return [...new Set(list)];
}
