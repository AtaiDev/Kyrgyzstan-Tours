import { Agent } from "node:http";
import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

const BACKEND_PATHS = ["/api", "/media", "/static", "/django-admin", "/sitemap.xml", "/robots.txt"];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backend = env.VITE_BACKEND_URL || "http://127.0.0.1:8000";
  const agent = new Agent({ keepAlive: true, maxSockets: 8 });
  const proxy = Object.fromEntries(BACKEND_PATHS.map((path) => [path, { target: backend, changeOrigin: false, agent }]));

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    server: { port: 5173, proxy },
    preview: { port: 4173, proxy },
    build: {
      target: "es2022",
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (/node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/.test(id)) return "react";
            if (/node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) return "motion";
            if (/node_modules[\\/]@tanstack[\\/]/.test(id)) return "query";
            return undefined;
          },
        },
      },
    },
    test: {
      environment: "node",
      include: ["src/**/*.test.ts"],
    },
  };
});
