import { createServer as createViteServer } from "vite";

export function log(message, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app, server) {
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: { server }
    },
    appType: "spa",
  });

  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);

  // Add a simple health check route
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      let template = await vite.transformIndexHtml(url, `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>KiranaConnect</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
      `);

      res.status(200).set({ "Content-Type": "text/html" }).send(template);
    } catch (e) {
      console.error('Vite middleware error:', e);
      vite.ssrFixStacktrace(e);
      res.status(500).send('Internal Server Error');
    }
  });

  log("Vite server setup complete");
}

export function serveStatic(app) {
  app.use(express.static("dist"));
  
  app.get("*", (req, res) => {
    res.sendFile(path.resolve("dist", "index.html"));
  });
  
  log("Static file serving setup complete");
}