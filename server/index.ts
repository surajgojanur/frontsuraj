import 'dotenv/config';
import express from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";
import { serveStatic } from "./static";

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup routes (API)
await registerRoutes(server, app);

// Setup Vite or static files
if (process.env.NODE_ENV === "development") {
  await setupVite(server, app);
} else {
  serveStatic(app);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});