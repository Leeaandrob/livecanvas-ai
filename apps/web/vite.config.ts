import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  // Load env from root directory
  const env = loadEnv(mode, path.resolve(__dirname, "../.."), "");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@live-canvas/protocols": path.resolve(
          __dirname,
          "../../packages/protocols/src"
        ),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      allowedHosts: [".trycloudflare.com", ".ngrok-free.app", ".ngrok.io"],
      proxy: {
        "/api": {
          target: env.VITE_WORKER_URL || "http://localhost:8787",
          changeOrigin: true,
        },
        "/board": {
          target: env.VITE_WS_URL || "ws://localhost:8787",
          ws: true,
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
  };
});
