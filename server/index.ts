import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleOrderPDF } from "./routes/order";
import {
  getProducts,
  getCategories,
  getOrders,
  createOrder,
  updateProductStock,
} from "./routes/proxy";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  app.post("/api/order", handleOrderPDF);

  // Cloudflare D1 API routes (proxied)
  app.get("/api/products", getProducts);
  app.get("/api/categories", getCategories);
  app.get("/api/orders", getOrders);
  app.post("/api/orders", createOrder);
  app.put("/api/products/:id/stock", updateProductStock);

  // Middleware to pass non-matching requests to next handler (Vite)
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    // Pass all unhandled requests to the next middleware (Vite's SPA routing)
    next();
  });

  return app;
}
