import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import itemRouter from "./routes/itemRoutes.js";
import savedRouter from "./routes/savedRoutes.js";
import { getNotifications } from "./controllers/itemController.js";
import { db } from "./config/firebase.js";
import claimRouter from "./routes/claimRoutes.js";

// Add this in server.js instead — see below

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://localhost:3000",
    "http://localhost:5173",
  ],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the built React app (run `npm run build` in ../FRONTEND first)
const distDir = path.join(__dirname, "../FRONTEND/dist");
app.use(express.static(distDir));
app.use("/elements", express.static(path.join(__dirname, "../elements")));

// ── API Routes ────────────────────────────────────────────────────────────────
// Mounted under /api so they don't collide with the React app's page routes
// (e.g. the /saved page vs. the /saved API).
app.use("/api/item", itemRouter);
app.use("/api/saved", savedRouter);
app.use("/api/claims", claimRouter);

// ── GET /api/notifications?uid=xxx ────────────────────────────────────────────
app.get("/api/notifications", async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).send("uid is required.");
    const notifs = await getNotifications(uid);
    res.status(200).json(notifs);
  } catch (err) {
    console.error("GET /notifications error:", err.message);
    res.status(500).send("Could not fetch notifications.");
  }
});

// Unknown API paths are real 404s, not the React app
app.use("/api", (req, res) => res.status(404).send("Not found."));

// Fallback: let React Router handle every other GET
app.get("*splat", (req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

console.log("Elements path:", path.join(__dirname, "../elements"));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`CEASFind server running on http://localhost:${PORT}`);
});