import { storage } from "./storage";
import { users, gameProfiles, alliances } from "@shared/schema";

async function createAndCheckTestData() {
  try {
    console.log("Creating test data...");

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

    // Check data right after creation
    console.log("\nChecking data right after creation:");

    // Get all users
    const users = [];
    for (let i = 1; i <= 10; i++) {
      const user = await storage.getUser(i);
      if (user) users.push(user);
    }
    console.log("Users:", users.length);
    users.forEach(u => console.log(`User ${u.id}: ${u.username}`));

    // Get all players
    const players = await storage.getAllPlayers();
    console.log("\nPlayers:", players.length);
    players.forEach(p => console.log(`Player ${p.nickname}: Server=${p.server}, Alliance=${p.alliance}, Power=${p.powerNow}`));

    // Get all alliances
    const alliances = await storage.getAllAlliances();
    console.log("\nAlliances:", alliances.length);
    alliances.forEach(a => console.log(`Alliance ${a.name} (Server ${a.server}): Members=${a.memberCount}, TotalPower=${a.totalPower}, AvgPower=${a.averagePower}`));

    console.log("\nTest data creation and check complete");
  } catch (error) {
    console.error("Error creating/checking test data:", error);
  }
}

createAndCheckTestData();
