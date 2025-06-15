const fs = require("fs");
const path = require("path");
const { createServer } = require("vite");

function log(message, source = "express") {
  const time = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  console.log(`${time} [${source}] ${message}`);
}

async function setupVite(app, server) {
  const vite = await createServer({
    server: {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true,
    },
    appType: "spa",
    root: "client",
    publicDir: path.resolve("client", "public"),
  });

  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);
}

function serveStatic(app) {
  const clientPath = path.resolve("client", "dist");

  if (!fs.existsSync(clientPath)) {
    throw new Error(
      `Could not find client build directory at ${clientPath}. Please run "npm run build" first.`
    );
  }

  app.use(require("express").static(clientPath));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(clientPath, "index.html"));
  });
}

module.exports = { log, setupVite, serveStatic };