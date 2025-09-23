import { defineConfig } from "vite";
import 'dotenv/config';
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      "@hooks": path.resolve(import.meta.dirname, "client", "src", "hooks"),
      "@lib": path.resolve(import.meta.dirname, "client", "src", "lib"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  // Serve static files from the repository-level `public/` so images under
  // `public/images/...` are available while Vite's root is `client/`.
  publicDir: path.resolve(import.meta.dirname, "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: Number(process.env.FRONTEND_PORT || 5000),
    proxy: {
      // Proxy /api requests to the backend server during development
      '/api': {
        target: `http://localhost:${process.env.PORT || 3000}`,
        changeOrigin: true,
        secure: false,
      },
      // Note: do not proxy `/images` — Vite now serves `public/` directly via `publicDir`
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    allowedHosts: ['*.ngrok-free.app'],
  },
});
