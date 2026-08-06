import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";

dotenv.config();

const DB_FILE = path.join(process.cwd(), "db_data.json");

// Default initial database seed
const defaultDbData = {
  users: [
    {
      id: 'sample-user-owner-1',
      storeId: 'sample-store-1',
      username: 'oday_owner',
      email: 'owner@ode5.com',
      role: 'STORE_OWNER',
      password: 'ownerpass123',
      isSuspended: false,
      isDeleted: false,
    }
  ],
  stores: [
    {
      id: 'sample-store-1',
      name: 'متجر عدي للتجارة والمواد الغذائية',
      phone: '0791234567',
      email: 'owner@ode5.com',
      createdAt: new Date().toISOString(),
      isDeleted: false,
    }
  ],
  categories: [],
  products: [],
  sales: [],
  expenses: [],
  damagedGoods: [],
  customers: [],
  suppliers: [],
  debtRecords: [],
  debtPayments: [],
  settings: {},
};

function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading db_data.json:", err);
  }
  // If file doesn't exist, create it with default data
  writeDb(defaultDbData);
  return defaultDbData;
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing db_data.json:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // Central Cloud Database Sync API
  app.get("/api/db", (req, res) => {
    const data = readDb();
    res.json(data);
  });

  app.post("/api/db", (req, res) => {
    const newData = req.body;
    if (newData && typeof newData === "object") {
      const current = readDb();
      // Merge or replace
      const merged = {
        ...current,
        ...newData,
      };
      writeDb(merged);
      res.json({ success: true, message: "Central Database Synchronized" });
    } else {
      res.status(400).json({ success: false, message: "Invalid payload" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "online", timestamp: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

