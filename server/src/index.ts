import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config";
import weatherRouter from "./routes/weather";
import treesRouter from "./routes/trees";
import farmsRouter from "./routes/farms";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.allowedOrigins,
  }),
);
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests", code: "RATE_LIMITED" },
  }),
);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/weather", weatherRouter);
app.use("/api/trees", treesRouter);
app.use("/api/farms", farmsRouter);

app.use(errorHandler);

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}

export default app;
