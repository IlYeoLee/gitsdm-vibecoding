import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Deployed to https://ilyeolee.github.io/gitsdm-vibecoding/
// In dev (npm run dev) base is '/'; in production build it's the repo subpath.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/gitsdm-vibecoding/' : '/',
}))
