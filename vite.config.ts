import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { viteSourceLocator } from "@metagptx/vite-plugin-source-locator";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    viteSourceLocator({
      prefix: "mgx",
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    fs: {
      strict: false,
    },
  },
  optimizeDeps: {
    include: ['fabric', 'pdf-lib', 'qrcode', 'jsbarcode'],
  },
  build: {
    rollupOptions: {
      external: [],
    },
  },
}));
