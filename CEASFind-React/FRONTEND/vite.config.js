import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const frontendDir = path.dirname(fileURLToPath(import.meta.url));
const elementsDir = path.resolve(frontendDir, "../elements");

function existingElements() {
  return {
    name: "ceasfind-existing-elements",
    configureServer(server) {
      server.middlewares.use("/elements", (req, res, next) => {
        let relativePath;
        try {
          relativePath = decodeURIComponent((req.url ?? "").split("?")[0]).replace(/^\/+/, "");
        } catch {
          next();
          return;
        }

        const absolutePath = path.resolve(elementsDir, relativePath);
        if (absolutePath !== elementsDir && !absolutePath.startsWith(`${elementsDir}${path.sep}`)) {
          next();
          return;
        }

        fs.stat(absolutePath, (error, stats) => {
          if (error || !stats.isFile()) {
            next();
            return;
          }
          res.setHeader("Content-Type", "image/png");
          fs.createReadStream(absolutePath).pipe(res);
        });
      });
    },
    generateBundle() {
      const copyAssets = (directory, relativeDirectory = "") => {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
          const sourcePath = path.join(directory, entry.name);
          const relativePath = path.posix.join(relativeDirectory, entry.name);
          if (entry.isDirectory()) {
            copyAssets(sourcePath, relativePath);
          } else if (entry.isFile()) {
            this.emitFile({
              type: "asset",
              fileName: path.posix.join("elements", relativePath),
              source: fs.readFileSync(sourcePath),
            });
          }
        }
      };

      copyAssets(elementsDir);
    },
  };
}

export default defineConfig({
  plugins: [react(), existingElements()],
  resolve: {
    preserveSymlinks: true,
  },
  server: {
    host: "localhost",
    // The Express backend (BACKEND/server.js) serves the API under /api.
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
