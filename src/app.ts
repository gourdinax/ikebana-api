import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./docs/openapi.js";

import userRoutes from "./modules/user/user.routes.js";
import addressRoutes from "./modules/address/address.routes.js";
import bouquetRoutes from "./modules/bouquet/bouquet.routes.js";
import orderRoutes from "./modules/order/order.routes.js";
import paymentRoutes from "./modules/payment/payment.routes.js";
import workshopRoutes from "./modules/workshop/workshop.routes.js";
import sessionRoutes from "./modules/session/session.routes.js";
import bookingRoutes from "./modules/booking/booking.routes.js";
import venueRoutes from "./modules/venue/venue.routes.js";
import stockRoutes from "./modules/stock/stock.routes.js";
import gridfsRoutes from "./modules/gridfs/gridfs.routes.js";

import { errorHandler } from "./middleware/error.js";

export const app = express();

// --- Middlewares globaux ---
app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"], // Front autorisés
    credentials: true,
  })
);
app.use(compression());
app.use(express.json());
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.get("/openapi.json", (_req, res) => res.json(openApiDocument));

// --- Routes ---
app.get("/health", (_, res) => res.json({ ok: true, message: "Ikebana API running" }));

// Modules
app.use("/api/users", userRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/bouquets", bouquetRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/workshops", workshopRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/files", gridfsRoutes);

// --- Gestion des erreurs ---
app.use(errorHandler);

// --- Fallback 404 ---
app.use((req, res) => {
  res.status(404).json({ error: "NOT_FOUND", message: `Route ${req.originalUrl} non trouvée` });
});
