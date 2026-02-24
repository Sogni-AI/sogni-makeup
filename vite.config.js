import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import process from "process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = "/";

  // Get version from package.json
  const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
  const appVersion = packageJson.version;
  console.log(`App version: ${appVersion}`);

  // Determine the backend API port - default to 3003 if not specified
  const backendPort = parseInt(env.BACKEND_PORT || "3003", 10);
  console.log(`Backend API configured on port: ${backendPort}`);

  return {
    plugins: [react()],
    base,
    server: {
      host: "0.0.0.0",
      port: 5176,
      strictPort: true,
      https: false,
      allowedHosts: ["makeover-local.sogni.ai", "makeover.sogni.ai"],
      cors: {
        origin: [
          "https://makeover-local.sogni.ai",
          "http://localhost:5176",
        ],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
        allowedHeaders: [
          "Content-Type",
          "Authorization",
          "X-Requested-With",
          "X-Client-App-ID",
        ],
      },
      proxy: {
        "/api": {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy) => {
            proxy.on("error", (err) => {
              console.log("Proxy error:", err);
            });
            proxy.on("proxyReq", (_proxyReq, req) => {
              console.log("Proxying request:", req.method, req.url);
            });
            proxy.on("proxyRes", (proxyRes, req) => {
              console.log("Proxy response:", proxyRes.statusCode, req.url);
            });
          },
        },
        "/sogni": {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
          secure: false,
        },
        "/health": {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
      chunkSizeWarningLimit: 750,
      rollupOptions: {
        output: {
          entryFileNames: "assets/[name]-[hash].js",
          chunkFileNames: "assets/[name]-[hash].js",
          manualChunks: {
            'sogni-sdk': ['@sogni-ai/sogni-client'],
            'vendor': ['react', 'react-dom', 'framer-motion'],
          },
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split(".");
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash].${ext}`;
            }
            if (/css/i.test(ext)) {
              return `assets/css/[name]-[hash].${ext}`;
            }
            return `assets/[name]-[hash].${ext}`;
          },
        },
      },
    },
    publicDir: "public",
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      "import.meta.env.VITE_SOGNI_APP_ID": JSON.stringify("***REMOVED***"),
      "import.meta.env.APP_VERSION": JSON.stringify(appVersion),
    },
  };
});
