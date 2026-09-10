import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
      exclude: ["lib/supabase-client.ts", "lib/supabase-server.ts", "lib/db.ts"],
      thresholds: { lines: 80, functions: 80, branches: 70 },
    },
  },
});
