import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages ではリポジトリ名に合わせて base を変更してください。
  base: './',
})
