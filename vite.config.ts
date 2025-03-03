import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import solidStyled from "unplugin-solid-styled";
import inspect from "vite-plugin-inspect";
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  optimizeDeps: {
    exclude: ['@bokuweb/zstd-wasm'],
    esbuildOptions: {
      target: 'es2020',
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
