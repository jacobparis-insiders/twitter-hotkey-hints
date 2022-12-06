import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { crx } from "@crxjs/vite-plugin"
import manifest from "./manifest.json" assert { type: "json" }
import tailwindcss from "tailwindcss"
import tailwindConfig from "./tailwind.config.cjs"

export default defineConfig({
  mode: "development",
  server: {
    hmr: false,
  },
  resolve: {
    alias: {
      "chrome-types": "node_modules/chrome-types/index.d.ts",
    },
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          config: tailwindConfig,
        }),
      ],
    },
  },
  build: {
    sourcemap: "inline",
    minify: false,
  },
  plugins: [react(), crx({ manifest })],
})
