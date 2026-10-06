import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const frontendDir = path.dirname(fileURLToPath(import.meta.url));
const elementsDir = path.resolve(frontendDir, "../elements");
const htmlInputs = Object.fromEntries(
  fs.readdirSync(frontendDir)
    .filter((filename) => filename.endsWith(".html"))
    .map((filename) => [filename.slice(0, -5), path.resolve(frontendDir, filename)]),
);

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
  plugins: [existingElements()],
  build: {
    rollupOptions: {
      input: htmlInputs,
    },
  },
  resolve: {
    preserveSymlinks: true,
  },
  server: {
    host: "localhost",
  },
  optimizeDeps: {
    noDiscovery: true,
    include: ["react", "react-dom/client"],
  },
});
