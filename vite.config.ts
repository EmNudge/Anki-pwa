import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import solidStyled from "unplugin-solid-styled";
import inspect from "vite-plugin-inspect";
import path from "path";
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  optimizeDeps: {
    exclude: ['@bokuweb/zstd-wasm'],
  },
  build: {
    target: 'es2020',
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "src"),
    },
  },
  plugins: [
    solid(),
    solidStyled.vite({
      prefix: "anki",
      filter: {
        include: "src/**/*.tsx",
        exclude: "node_modules/**/*.{ts,js}",
      },
    }),
    inspect(),
    tailwindcss(),
  ],
});
