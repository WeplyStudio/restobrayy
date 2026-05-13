import express from "express";
import path from "path";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { Category, MenuItem, Order, PromoCode, Settings } from "./src/models/Schemas";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => {
      console.error("MongoDB connection error details:");
      console.error(err);
      console.warn("Make sure your MONGODB_URI is correct and your IP is whitelisted (if using a cloud DB).");
    });
} else {
  console.warn("WARNING: MONGODB_URI environment variable is not set. Database operations will fail.");
  console.warn("Please set MONGODB_URI in your environment variables to use a real database.");
}

// Middleware to check DB connection
app.use("/api", (req, res, next) => {
  if (req.path === "/health") return next();
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      error: "Database not connected", 
      details: MONGODB_URI ? "Connecting to MongoDB..." : "MONGODB_URI is not configured. Please set it in your environment variables." 
    });
  }
  next();
});

// API Routes

// Categories
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/categories", async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.json(category);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Menu Items
app.get("/api/menu_items", async (req, res) => {
  try {
    const items = await MenuItem.find();
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/menu_items", async (req, res) => {
  try {
    const item = new MenuItem(req.body);
    await item.save();
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/menu_items/:id", async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/menu_items/:id", async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: "Item deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Orders
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    // Handle queue number
    let queueDoc = await Settings.findOne({ key: "queue" });
    if (!queueDoc) {
      queueDoc = new Settings({ key: "queue", value: { currentNumber: 1 } });
    } else {
      queueDoc.value.currentNumber += 1;
      queueDoc.markModified("value");
    }
    await queueDoc.save();

    const order = new Order({
      ...req.body,
      queueNumber: queueDoc.value.currentNumber
    });
    await order.save();
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/orders/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true });
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Promo Codes
app.get("/api/promo_codes", async (req, res) => {
  try {
    const promos = await PromoCode.find();
    res.json(promos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/promo_codes", async (req, res) => {
  try {
    const promo = new PromoCode(req.body);
    await promo.save();
    res.json(promo);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/promo_codes/:id", async (req, res) => {
  try {
    const promo = await PromoCode.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(promo);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/promo_codes/:id", async (req, res) => {
  try {
    await PromoCode.findByIdAndDelete(req.params.id);
    res.json({ message: "Promo deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Settings / Queue
app.get("/api/settings/queue", async (req, res) => {
  try {
    const queue = await Settings.findOne({ key: "queue" });
    res.json(queue ? queue.value : { currentNumber: 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

// Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
