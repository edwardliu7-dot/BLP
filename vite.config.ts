import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      allowedHosts: true as const,
    },
    // Pre-bundle heavy deps at dev-server start instead of on first request,
    // preventing slow on-demand compilation.
    optimizeDeps: {
      include: ['jspdf', 'jspdf-autotable', 'exceljs', 'xlsx'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React runtime — cached forever, changes rarely.
            'vendor-react': ['react', 'react-dom'],
            // PDF/Excel export libs — only needed when guru downloads a report.
            'vendor-export': ['jspdf', 'jspdf-autotable', 'exceljs', 'xlsx'],
            // Animation library.
            'vendor-motion': ['motion'],
          },
        },
      },
    },
  };
});
