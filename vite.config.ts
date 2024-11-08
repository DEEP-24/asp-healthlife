import { vitePlugin as remix } from "@remix-run/dev";
import { flatRoutes } from "remix-flat-routes";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  build: { manifest: true },
  plugins: [
    tsconfigPaths(),
    remix({
      ignoredRouteFiles: ["**/*"],
      serverModuleFormat: "esm",
      routes: async (defineRoutes) => {
        return flatRoutes("routes", defineRoutes, {
          ignoredRouteFiles: ["**/*.test.{js,jsx,ts,tsx}", "**/__*.*"],
        });
      },
    }),
  ],
  server: {
    port: 3000,
  },
});
