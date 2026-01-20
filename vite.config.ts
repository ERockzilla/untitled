import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 9999,
  },
  build: {
    // Split large vendor libraries into separate chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // React core - changes rarely, cache long
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // 3D graphics - heavy, only needed for voxel/LED pages
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          // Supabase - auth/data layer
          'vendor-supabase': ['@supabase/supabase-js'],
          // Canvas confetti for hidden party mode 🎉
          'vendor-effects': ['canvas-confetti'],
        },
      },
    },
    // Increase warning limit slightly since we now have proper splitting
    chunkSizeWarningLimit: 600,
  },
})
