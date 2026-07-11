import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from "http-proxy-middleware";

// The Next.js backend (nexacare-backend) is a separate process/service.
// Proxying it through this server -- rather than pointing the browser at it
// directly -- is what makes frontend + backend "same site" so the
// HttpOnly, SameSite=Strict auth cookies actually get sent. If you deploy
// them as genuinely separate origins with no shared proxy in front, switch
// the backend's cookies to SameSite=None + Secure and add CORS instead
// (see backend/lib/auth/cookies.ts for the tradeoffs).
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || "http://localhost:4000";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Mounted first and unparsed: http-proxy-middleware needs the raw
  // request stream to forward bodies (including JSON) and cookies as-is.
  app.use(
    "/api",
    createProxyMiddleware({
      target: BACKEND_ORIGIN,
      changeOrigin: true,
      pathRewrite: {
        // Express mounts the middleware at /api, so the original prefix is
        // already stripped from req.url before the proxy sees it. Restore it
        // here so the Next.js backend receives /api/auth/* instead of /auth/*.
        '^/': '/api/',
      },
      // Every /api/* route (auth, patients, staff, care-events, gemini, ...)
      // now lives in the backend service -- nothing is handled locally here.
    }),
  );

  // Vite middleware for asset serving in dev, static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('(.*)', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Frontend running on http://0.0.0.0:${PORT} (proxying /api -> ${BACKEND_ORIGIN})`);
  });
}

startServer();
