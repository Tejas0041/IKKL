import "dotenv/config";
import { createServer } from "http";
import app from "./app.js";
import { connectDB } from "./lib/db.js";
import { initSocket } from "./lib/socket.js";
import { seedAdmin } from "./lib/seed.js";

const PORT = Number(process.env.PORT) || 3001;

connectDB()
  .then(() => {
    seedAdmin();
    const server = createServer(app);
    initSocket(server);
    server.listen(PORT, () => {
      console.log(`IKKL API running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
