import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "../lib/prisma.js";
import { buildTrustedOrigins, normalizeAppOrigin } from "../utils/trustedOrigins.js";

/** Must match Express mount: `app.all("/api/v1/auth/*splat", ...)` (Express v5). */
export const AUTH_BASE_PATH = "/api/v1/auth";

const isProduction = process.env.NODE_ENV === "production";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: normalizeAppOrigin(process.env.BETTER_AUTH_URL!),
  basePath: AUTH_BASE_PATH,
  trustedOrigins: buildTrustedOrigins(),
  // Postman/curl have no Origin; browsers always send it. Only relax in non-production.
  advanced: {
    disableCSRFCheck: !isProduction,
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "MEMBER",
        input: false,
      },
      isActive: {
        type: "boolean",
        defaultValue: true,
        input: false,
      },
    },
  },
});
