import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").default("user"),  // Новое поле для роли пользователя: 'user', 'moderator', 'admin'
});

export const gameProfiles = pgTable("game_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  characterId: text("character_id").notNull(),
  nickname: text("nickname").notNull(),
  server: text("server"),
  alliance: text("alliance"),
  level: integer("level"),
  powerNow: integer("power_now"),
  powerMax: integer("power_max"),
  hiddenPower: integer("hidden_power"),
  rank: text("rank").default("warrior"),  // Новое поле для ранга: 'warrior', 'knight', 'goddess', 'warGod', 'emperor'
  hidden: boolean("hidden").default(false),  // Новое поле для скрытия из рейтинга
});

export const alliances = pgTable("alliances", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  server: text("server").notNull(),
  memberCount: integer("member_count").default(0),
  totalPower: integer("total_power").default(0),
});

// Типы и схемы для Zod валидации

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertGameProfileSchema = createInsertSchema(gameProfiles).pick({
  userId: true,
  characterId: true,
  nickname: true,
  server: true,
  alliance: true,
  level: true,
  powerNow: true,
  powerMax: true,
  hiddenPower: true,
});

// Восстановленные схемы для обратной совместимости
export const updateGameProfileSchema = z.object({
  alliance: z.string().optional(),
  server: z.string().optional(),
  level: z.number().optional(),
  powerNow: z.number().optional(),
  powerMax: z.number().optional(),
  hiddenPower: z.number().optional(),
  rank: z.string().optional(),
  hidden: z.boolean().optional(),
});

export const gameDataSchema = z.object({
  characterId: z.string(),
  nickname: z.string(),
  server: z.string().optional(),
  alliance: z.string().optional(),
  level: z.number().optional(),
  powerNow: z.number().optional(),
  powerMax: z.number().optional(),
  hiddenPower: z.number().optional(),
});

// Типы для TypeScript

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type GameProfile = typeof gameProfiles.$inferSelect;
export type InsertGameProfile = typeof gameProfiles.$inferInsert;

export type Alliance = typeof alliances.$inferSelect;
export type InsertAlliance = typeof alliances.$inferInsert;

// Дополнительные типы для TS

export type Rank = 'warrior' | 'knight' | 'goddess' | 'warGod' | 'emperor';
export type UserRole = 'user' | 'moderator' | 'admin';

// Расширенный тип для альянса со статистикой
export type AllianceWithStats = Alliance & {
  averagePower?: number;
};
