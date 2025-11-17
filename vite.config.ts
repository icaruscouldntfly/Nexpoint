import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      const app = createServer();

      // Add Express app as middleware to Vite dev server
      server.middlewares.use(app);

      // Return post-middleware hook for SPA routing
      return () => {
        // Catch-all for SPA routes - must be last middleware
        server.middlewares.use((req, res, next) => {
          // Skip API routes
          if (req.url.startsWith("/api/")) {
            return next();
          }

          // Skip actual files (have file extensions)
          if (req.url.match(/\.\w+$/)) {
            return next();
          }

          // Skip Vite internal routes
          if (req.url.startsWith("/@")) {
            return next();
          }

          // For SPA routes, serve index.html with transformations
          const indexPath = path.resolve(server.config.root, "index.html");
          if (fs.existsSync(indexPath)) {
            res.setHeader("Content-Type", "text/html");
            let html = fs.readFileSync(indexPath, "utf-8");
            // Apply Vite's index HTML transformations (HMR, etc.)
            server.transformIndexHtml(req.url, html).then(
              (transformedHtml) => {
                res.end(transformedHtml);
              },
              (err) => {
                next(err);
              }
            );
          } else {
            next();
          }
        });
      };
    },
  };
}
