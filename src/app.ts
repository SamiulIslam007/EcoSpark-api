import "dotenv/config";
import { toNodeHandler } from "better-auth/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import qs from "qs";
import { auth } from "./app/config/index";
import { globalErrorHandler } from "./app/middlewares/globalError.middleware";
import { notFound } from "./app/middlewares/notFound.middleware";
import { IndexRoutes } from "./app/routes/index";

const app: Application = express();

// Custom query string parser
app.set("query parser", (str: string) => qs.parse(str));

// Security & logging
app.use(helmet());
app.use(morgan("dev"));

// CORS
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL!,
      process.env.BETTER_AUTH_URL!,
      "http://localhost:3000",
      "http://localhost:5000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Stripe webhook — must be BEFORE express.json() to get raw body
app.post("/api/v1/payments/webhook", express.raw({ type: "application/json" }));

// Better Auth — handles all /api/auth/* routes
app.all("/api/auth/{*path}", toNodeHandler(auth));

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
