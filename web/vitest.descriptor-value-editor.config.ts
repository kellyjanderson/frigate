import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/components/camera-controls/DescriptorValueEditor.test.tsx"],
    mockReset: true,
    restoreMocks: true,
  },
});
