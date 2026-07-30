import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    // Rulează testele din folderul /tests
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      // Permite import-uri de forma "@/lib/..." și în teste
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
