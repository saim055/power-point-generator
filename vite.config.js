import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'info', // Show all logs
  plugins: [
    react(),
  ],
  resolve: {
    alias: [
      { find: /^@\/components/, replacement: path.resolve(__dirname, './SRC/Component') },
      { find: /^@\/Component/, replacement: path.resolve(__dirname, './SRC/Component') },
      { find: /^@\/libs/, replacement: path.resolve(__dirname, './SRC/libs') },
      { find: /^@\/lib/, replacement: path.resolve(__dirname, './SRC/libs') },
      { find: /^@\/hooks/, replacement: path.resolve(__dirname, './SRC/hooks') },
      { find: '@', replacement: path.resolve(__dirname, './SRC') },
    ],
  },
});
