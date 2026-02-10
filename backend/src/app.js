import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";

import healthRouter from "./routes/health.js";
import frailtyRouter from "./routes/frailty.js";
import firebasePing from "./routes/firebasePing.js";
import redisPing from "./routes/redisPing.js";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";
import { requireAuth } from "./middlewares/auth.js";
import chatRouter from "./routes/chat.js";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import goalsRouter from "./routes/goals.js";
import socialRouter from "./routes/social.js";
import memoryRoutes from "./routes/memory.js";
import nudgesRouter from "./routes/nudge.js";
import medicineRouter from "./routes/medicine.js";
import quizRouter from "./routes/quiz.js";
import challengesRouter from "./routes/challenges.js";
import achievementsRouter from "./routes/achievements.js";
import { swaggerUiMiddleware, swaggerUiSetup } from "./swagger.js";
import weeklySummaryRouter from "./routes/weeklySummary.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  
  // CORS configuration
  const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://localhost:5175').split(',').map(s => s.trim()).filter(Boolean);
  app.use(cors({ 
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get("/", (_req, res) =>
    res.json({ name: "live-well-backend", status: "running" })
  );

  // 🔹 Swagger docs route
  app.use("/api/docs", swaggerUiMiddleware, swaggerUiSetup);

  // 🔹 API routes
  app.use("/api", healthRouter);
  app.use("/api", firebasePing);
  // app.use("/api", redisPing);
  app.use("/api", authRouter);
  app.use("/api", usersRouter);
  app.use("/api", frailtyRouter);
  app.use("/api", requireAuth(), chatRouter);
  app.use("/api", requireAuth(), goalsRouter);
  // app.use('/api', nudgesRouter);
  app.use("/api/social", requireAuth(), socialRouter);
  app.use("/api/memory", memoryRoutes);
  app.use("/api", weeklySummaryRouter);
  app.use('/api', nudgesRouter);
  app.use('/api/medicine', requireAuth(), medicineRouter);
  app.use('/api/quiz', requireAuth(), quizRouter);
  app.use('/api', requireAuth(), challengesRouter);
  app.use('/api', requireAuth(), achievementsRouter);

  // 🔹 Error handling
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
