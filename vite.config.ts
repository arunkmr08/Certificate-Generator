import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Deploying to GitHub Pages under /Certificate-Generator/
export default defineConfig({
  plugins: [react()],
  base: '/Certificate-Generator/',
})
