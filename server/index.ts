import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage"; // Added import for storage
import { parseArgs } from "util";
import { createServer } from "http";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import morgan from "morgan";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Функция для создания тестовых данных
async function createTestData() {
  try {
    console.log("Creating test data...");

    // Проверим, есть ли уже тестовые пользователи
    const existingUser = await storage.getUserByUsername("testuser1");
    if (existingUser) {
      console.log("Test data already exists, skipping creation");
      return;
    }

    // Create test users
    const user1 = await storage.createUser({
      username: "testuser1",
      email: "test1@example.com",
      password: "password123",
    });

    const user2 = await storage.createUser({
      username: "testuser2",
      email: "test2@example.com",
      password: "password123",
    });

    const user3 = await storage.createUser({
      username: "testuser3",
      email: "test3@example.com",
      password: "password123",
    });

    console.log("Created test users:", user1.id, user2.id, user3.id);

    // Create game profiles
    const profile1 = await storage.createGameProfile({
      userId: user1.id,
      characterId: "character1",
      nickname: "Player1",
      server: "Server1",
      alliance: "Alliance1",
      level: 100,
      powerNow: 1000000,
      powerMax: 1200000,
      hiddenPower: 200000,
    });

    const profile2 = await storage.createGameProfile({
      userId: user2.id,
      characterId: "character2",
      nickname: "Player2",
      server: "Server1",
      alliance: "Alliance1",
      level: 90,
      powerNow: 800000,
      powerMax: 900000,
      hiddenPower: 100000,
    });

    const profile3 = await storage.createGameProfile({
      userId: user3.id,
      characterId: "character3",
      nickname: "Player3",
      server: "Server2",
      alliance: "Alliance2",
      level: 110,
      powerNow: 1200000,
      powerMax: 1500000,
      hiddenPower: 300000,
    });

    console.log("Created game profiles");

    // Recalculate alliance stats
    await storage.recalculateAllianceStats();
    console.log("Recalculated alliance stats");

    // Get all players
    const players = await storage.getAllPlayers();
    console.log("Players:", players.length);

    // Get all alliances
    const alliances = await storage.getAllAlliances();
    console.log("Alliances:", alliances.length);

    console.log("Test data creation complete");
  } catch (error) {
    console.error("Error creating test data:", error);
  }
}

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    log(`serving on port ${port}`);

    // Создаем тестовые данные после запуска сервера
    await createTestData();
  });
})();
