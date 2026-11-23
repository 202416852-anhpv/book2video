/// <reference types="vitest/config" />
import { defineConfig, Plugin } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

// Plugin to resolve figma:asset/ imports as empty placeholder strings
function figmaAssetPlugin(): Plugin {
  return {
    name: "figma-asset",
    resolveId(id) {
      if (id.startsWith("figma:asset/")) {
        return "\0figma-asset:" + id.slice("figma:asset/".length);
      }
    },
    load(id) {
      if (id.startsWith("\0figma-asset:")) {
        return 'export default ""';
      }
    }
  };
}

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    exclude: ["node_modules", ".claude", "dist", "renderer-service/"]
  },
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    figmaAssetPlugin()
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      "@": path.resolve(__dirname, "./src"),
      "@vbee-holding/video-renderer/draw": path.resolve(__dirname, "./src/app/renderer/video-renderer/draw.ts"),
      "@vbee-holding/video-renderer/schema": path.resolve(__dirname, "./src/app/renderer/video-renderer/schema.ts"),
      "@vbee-holding/video-renderer": path.resolve(__dirname, "./src/app/renderer/video-renderer/index.ts")
    }
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ["**/*.svg", "**/*.csv"],

  server: {
    port: 5174,
    proxy: {
      "/api/auth": "http://localhost:5050",
      "/api/projects": "http://localhost:5050",
      "/api/upload": {
        target: "http://localhost:5050",
        timeout: 1800000 // 30 min — large file upload up to 200MB
      },
      "/api/uploads": "http://localhost:5050",
      "/api/tts": "http://localhost:5050",
      "/api/vbee-voices": "http://localhost:5050",
      "/api/voices": "http://localhost:5050",
      "/api/loudness": {
        target: "http://localhost:5050",
        timeout: 120000 // 2 min — curl download (30s) + ffmpeg loudnorm (60s)
      },
      "/api/transcribe": {
        target: "http://localhost:5050",
        timeout: 600000 // 10 min — large file upload + transcription
      },
      "/api/export": {
        target: "http://localhost:5050",
        timeout: 600000 // 10 min — export can be slow
      }
    }
  }
});
