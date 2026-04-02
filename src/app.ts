import "dotenv/config";
import { toNodeHandler } from "better-auth/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import qs from "qs";
import { auth, AUTH_BASE_PATH } from "./app/config/index.js";
import { buildCorsOrigins } from "./app/utils/trustedOrigins.js";
import { globalErrorHandler } from "./app/middleware/globalError.middleware.js";
import { notFound } from "./app/middleware/notFound.middleware.js";
import { IndexRoutes } from "./app/routes/index.js";

const app: Application = express();

// Custom query string parser
app.set("query parser", (str: string) => qs.parse(str));

// Security & logging
app.use(helmet());
app.use(morgan("dev"));

// CORS (aligned with Better Auth trustedOrigins + API host)
app.use(
  cors({
    origin: buildCorsOrigins(),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Stripe webhook — must be BEFORE express.json() to get raw body
app.post("/api/v1/payments/webhook", express.raw({ type: "application/json" }));

// Better Auth — Express v5 needs `*splat` (not `{*path}`). See better-auth.com/docs/integrations/express
app.all(`${AUTH_BASE_PATH}/*splat`, toNodeHandler(auth));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API routes
app.use("/api/v1", IndexRoutes);

// Health check
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "EcoSpark API is running",
  });
});

// 404 & global error handler
app.use(notFound);
app.use(globalErrorHandler);

export default app;
