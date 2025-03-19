import { storage } from "./storage";

async function checkData() {
  try {
    console.log("Checking storage data...");

    // Get all users
    const users = [];
    for (let i = 1; i <= 10; i++) {
      const user = await storage.getUser(i);
      if (user) users.push(user);
    }
    console.log("Users:", users.length);
    console.log(users);

    // Get all players
    const players = await storage.getAllPlayers();
    console.log("Players:", players.length);
    console.log(JSON.stringify(players, null, 2));

    // Get all alliances
    const alliances = await storage.getAllAlliances();
    console.log("Alliances:", alliances.length);
    console.log(JSON.stringify(alliances, null, 2));

    console.log("Data check complete");
  } catch (error) {
    console.error("Error checking data:", error);
  }
}

checkData();
