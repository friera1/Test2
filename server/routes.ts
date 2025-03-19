import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { updateGameProfileSchema, gameDataSchema } from "@shared/schema";
import { z } from "zod";
import fetch from "node-fetch";
import FormData from "form-data";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Game profile API
  app.get("/api/profile", async (req, res) => {
    console.log("Received request to /api/profile");
    console.log("Auth status:", req.isAuthenticated());
    console.log("Session:", req.sessionID);
    console.log("Authorization header:", req.headers.authorization ? "Present" : "Not present");

    let userId: number;

    // Проверяем токен в заголовке Authorization
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token && (app as any).activeTokens && (app as any).activeTokens.has(token)) {
      userId = (app as any).activeTokens.get(token);
      console.log("User authenticated via token:", userId);
    } else if (req.isAuthenticated()) {
      // Если токен не предоставлен, используем сессию
      userId = req.user!.id;
      console.log("User authenticated via session:", userId, req.user!.username);
    } else {
      console.log("User not authenticated - sending 401");
      return res.sendStatus(401);
    }

    const profile = await storage.getGameProfile(userId);

    console.log("User profile from storage:", profile);

    if (!profile) {
      console.log("No profile found for user:", userId);
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(profile);
  });

  app.post("/api/profile/game-data", async (req, res) => {
    console.log("Received request to /api/profile/game-data");
    console.log("Auth status:", req.isAuthenticated());
    console.log("Session:", req.sessionID);

    let userId: number;

    // Проверяем токен в заголовке Authorization
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token && (app as any).activeTokens && (app as any).activeTokens.has(token)) {
      userId = (app as any).activeTokens.get(token);
      console.log("User authenticated via token:", userId);
    } else if (req.isAuthenticated()) {
      // Если токен не предоставлен, используем сессию
      userId = req.user!.id;
      console.log("User authenticated via session:", userId, req.user!.username);
    } else {
      console.log("User not authenticated - sending 401");
      return res.sendStatus(401);
    }

    try {
      console.log("Game data payload:", req.body);
      const gameData = gameDataSchema.parse(req.body);

      // Check if profile exists
      let profile = await storage.getGameProfile(userId);
      console.log("Existing profile:", profile);

      if (profile) {
        // Update existing profile
        console.log("Updating profile for user:", userId);
        profile = await storage.updateGameProfile(profile.id, {
          server: gameData.server,
          alliance: gameData.alliance,
          level: gameData.level,
          powerNow: gameData.powerNow,
          powerMax: gameData.powerMax,
          hiddenPower: gameData.hiddenPower,
        });
      } else {
        // Create new profile
        console.log("Creating new profile for user:", userId);
        profile = await storage.createGameProfile({
          userId,
          characterId: gameData.characterId,
          nickname: gameData.nickname,
          server: gameData.server,
          alliance: gameData.alliance,
          level: gameData.level,
          powerNow: gameData.powerNow,
          powerMax: gameData.powerMax,
          hiddenPower: gameData.hiddenPower,
        });
      }

      // Обновляем статистику альянсов, чтобы быть уверенными что игрок попал в рейтинги
      if (profile.alliance && profile.server) {
        await storage.recalculateAllianceStats();
      }

      console.log("Profile saved successfully:", profile);
      res.status(200).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({
          message: "Invalid game data",
          errors: error.errors
        });
      }

      console.error("Error saving game data:", error);
      res.status(500).json({ message: "Failed to save game data" });
    }
  });

  app.patch("/api/profile/alliance", async (req, res) => {
    console.log("Received request to update alliance");
    console.log("Auth status:", req.isAuthenticated());
    console.log("Authorization header:", req.headers.authorization ? "Present" : "Not present");

    let userId: number;

    // Проверяем токен в заголовке Authorization
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token && (app as any).activeTokens && (app as any).activeTokens.has(token)) {
      userId = (app as any).activeTokens.get(token);
      console.log("User authenticated via token:", userId);
    } else if (req.isAuthenticated()) {
      // Если токен не предоставлен, используем сессию
      userId = req.user!.id;
      console.log("User authenticated via session:", userId, req.user!.username);
    } else {
      console.log("User not authenticated - sending 401");
      return res.sendStatus(401);
    }

    try {
      const updateData = updateGameProfileSchema.parse(req.body);
      console.log("Alliance update data:", updateData);

      // Get profile
      const profile = await storage.getGameProfile(userId);

      if (!profile) {
        console.log("Profile not found for user:", userId);
        return res.status(404).json({ message: "Profile not found" });
      }

      // Update alliance
      console.log("Updating alliance for profile:", profile.id);
      const updatedProfile = await storage.updateGameProfile(profile.id, {
        alliance: updateData.alliance
      });

      console.log("Alliance updated successfully:", updatedProfile);
      res.status(200).json(updatedProfile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({
          message: "Invalid update data",
          errors: error.errors
        });
      }

      console.error("Error updating alliance:", error);
      res.status(500).json({ message: "Failed to update alliance" });
    }
  });

  // Player rankings API
  app.get("/api/rankings/players", async (req, res) => {
    try {
      const { sortBy, sortOrder, server, alliance } = req.query;

      // Получаем список игроков, исключая тех, кто имеет статус hidden=true
      const players = await storage.getAllPlayers({
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        server: server as string,
        alliance: alliance as string,
        hideHidden: true // Скрываем игроков с hidden=true для обычных пользователей
      });

      res.json(players);
    } catch (error) {
      console.error('Error fetching players rankings:', error);
      res.status(500).json({ error: 'Failed to fetch player rankings' });
    }
  });

  // Проверка, является ли пользователь админом или модератором
  function isAdminOrModerator(req: Request): boolean {
    const user = req.session.user;
    return !!(user && (user.role === 'admin' || user.role === 'moderator'));
  }

  // Проверка, является ли пользователь админом
  function isAdmin(req: Request): boolean {
    const user = req.session.user;
    return !!(user && user.role === 'admin');
  }

  // Эндпоинт для получения всех игроков (включая скрытых) для админ-панели
  app.get('/api/admin/players', async (req, res) => {
    try {
      // Проверяем права доступа
      if (!isAdminOrModerator(req)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const { sortBy, sortOrder } = req.query as { sortBy?: string; sortOrder?: 'asc' | 'desc' };
      // Получаем всех игроков, включая скрытых
      const players = await storage.getAllPlayers({
        sortBy: sortBy || 'powerNow',
        sortOrder: sortOrder || 'desc'
      });

      return res.json(players);
    } catch (error) {
      console.error('Error fetching players for admin:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Эндпоинт для обновления ранга игрока
  app.put('/api/admin/players/:id/rank', async (req, res) => {
    try {
      const { id } = req.params;
      const { rank } = req.body;

      // Проверяем, что ранг правильный
      if (!['warrior', 'knight', 'goddess', 'warGod', 'emperor'].includes(rank)) {
        return res.status(400).json({ error: 'Invalid rank' });
      }

      // Проверяем права доступа
      if (!isAdminOrModerator(req)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Обновляем ранг игрока
      const playerId = parseInt(id);
      const updatedProfile = await storage.updateGameProfile(playerId, { rank });

      if (!updatedProfile) {
        return res.status(404).json({ error: 'Player not found' });
      }

      return res.json(updatedProfile);
    } catch (error) {
      console.error('Error updating player rank:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Эндпоинт для обновления видимости игрока в рейтинге
  app.put('/api/admin/players/:id/visibility', async (req, res) => {
    try {
      const { id } = req.params;
      const { hidden } = req.body;

      // Проверяем права доступа
      if (!isAdminOrModerator(req)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Обновляем видимость игрока
      const playerId = parseInt(id);
      const updatedProfile = await storage.updateGameProfile(playerId, { hidden });

      if (!updatedProfile) {
        return res.status(404).json({ error: 'Player not found' });
      }

      return res.json(updatedProfile);
    } catch (error) {
      console.error('Error updating player visibility:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Эндпоинт для получения списка модераторов и администраторов
  app.get('/api/admin/moderators', async (req, res) => {
    try {
      // Проверяем права доступа (только админ)
      if (!isAdmin(req)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Получаем всех пользователей с ролями модератор или админ
      const moderators = await storage.getUsersByRoles(['moderator', 'admin']);

      return res.json(moderators);
    } catch (error) {
      console.error('Error fetching moderators:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Эндпоинт для обновления роли пользователя
  app.put('/api/admin/users/:id/role', async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      // Проверяем, что роль правильная
      if (!['user', 'moderator', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      // Проверяем права доступа (только админ)
      if (!isAdmin(req)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Обновляем роль пользователя
      const userId = parseInt(id);
      const updatedUser = await storage.updateUser(userId, { role });

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user role:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Alliance rankings API
  app.get("/api/rankings/alliances", async (req, res) => {
    try {
      const { server, sortBy, sortOrder } = req.query;

      const filters = {
        server: server as string | undefined,
        sortBy: (sortBy as 'totalPower' | 'memberCount' | 'averagePower' | undefined) || 'totalPower',
        sortOrder: (sortOrder as 'asc' | 'desc' | undefined) || 'desc'
      };

      console.log("Fetching alliance rankings with filters:", filters);
      const alliances = await storage.getAllAlliances(filters);
      console.log(`Found ${alliances.length} alliances matching filters`);

      res.json(alliances);
    } catch (error) {
      console.error("Error fetching alliance rankings:", error);
      res.status(500).json({ message: "Failed to fetch alliance rankings" });
    }
  });

  // Proxy API for the game
  app.post("/api/game/token", async (req, res) => {
    try {
      const { encoded_payload, sign } = req.body;

      if (!encoded_payload || !sign) {
        return res.status(400).json({ error: "Missing parameters" });
      }

      const addr = 'https://5c7021242c10k1d2.tap4hub.com:10443';
      const url = addr + '/tgs/gateway2/character/litetoken?client_id=k1d2:oap.1.0.0';

      console.log("Proxying token request to:", url);

      const formData = new FormData();
      formData.append("encoded_payload", encoded_payload);
      formData.append("sign", sign);

      const response = await fetch(url, {
        method: 'POST',
        body: formData as any,
        // @ts-ignore
        headers: {
          ...formData.getHeaders()
        }
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Token API error:", response.status, text);
        return res.status(response.status).send(text);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error in game token proxy:", error);
      res.status(500).json({ error: "Failed to get game token" });
    }
  });

  app.get("/api/game/info", async (req, res) => {
    try {
      const { lite_token } = req.query;

      if (!lite_token) {
        return res.status(400).json({ error: "Missing token parameter" });
      }

      const addr = 'https://5c7021242c10k1d2.tap4hub.com:10443';
      const url = `${addr}/tgs/gateway2/oap/character/info?lite_token=${encodeURIComponent(lite_token as string)}&client_id=k1d2:oap.1.0.0`;

      console.log("Proxying game info request to:", url);

      const response = await fetch(url);

      if (!response.ok) {
        const text = await response.text();
        console.error("Game info API error:", response.status, text);
        return res.status(response.status).send(text);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error in game info proxy:", error);
      res.status(500).json({ error: "Failed to get game info" });
    }
  });

  // API для создания тестовых данных
  app.post("/api/test/create-data", async (req, res) => {
    try {
      console.log("Получен запрос на создание тестовых данных");
      const { profiles } = req.body;

      if (!profiles || !Array.isArray(profiles)) {
        return res.status(400).json({ message: "Missing or invalid profiles data" });
      }

      console.log(`Создание ${profiles.length} профилей игроков...`);

      // Создаем тестовых пользователей, если их еще нет
      const users = [];
      for (let i = 1; i <= 3; i++) {
        let user = await storage.getUserByUsername(`testuser${i}`);

        if (!user) {
          user = await storage.createUser({
            username: `testuser${i}`,
            email: `test${i}@example.com`,
            password: `password123`
          });
          console.log(`Создан пользователь ${i}: ${user.username} (ID: ${user.id})`);
        } else {
          console.log(`Пользователь ${i} уже существует: ${user.username} (ID: ${user.id})`);
        }

        users.push(user);
      }

      // Создаем игровые профили
      const createdProfiles = [];
      for (let i = 0; i < Math.min(profiles.length, users.length); i++) {
        const profileData = profiles[i];
        const userId = users[i].id;

        // Проверяем, есть ли уже профиль для этого пользователя
        let profile = await storage.getGameProfile(userId);

        if (profile) {
          // Обновляем существующий профиль
          profile = await storage.updateGameProfile(profile.id, profileData);
          console.log(`Обновлен профиль для пользователя ${userId}: ${profile.nickname}`);
        } else {
          // Создаем новый профиль
          profile = await storage.createGameProfile({
            userId,
            ...profileData
          });
          console.log(`Создан профиль для пользователя ${userId}: ${profile.nickname}`);
        }

        createdProfiles.push(profile);
      }

      // Пересчитываем статистику альянсов
      await storage.recalculateAllianceStats();
      console.log("Статистика альянсов пересчитана");

      // Возвращаем созданные данные
      const allPlayers = await storage.getAllPlayers();
      const allAlliances = await storage.getAllAlliances();

      console.log(`Всего игроков: ${allPlayers.length}`);
      console.log(`Всего альянсов: ${allAlliances.length}`);

      res.status(200).json({
        users,
        profiles: createdProfiles,
        playerCount: allPlayers.length,
        allianceCount: allAlliances.length
      });
    } catch (error) {
      console.error("Ошибка при создании тестовых данных:", error);
      res.status(500).json({ message: "Failed to create test data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
