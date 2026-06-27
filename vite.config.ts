import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Dev: forward /api/telnyx/* to the local Telnyx proxy (server/telnyx-proxy.mjs),
  // so the app uses a same-origin path and the secret key stays server-side.
  server: {
    proxy: {
      "/api/telnyx": {
        target: `http://localhost:${process.env.TELNYX_PROXY_PORT ?? 8787}`,
        changeOrigin: true,
      },
      "/api/paypal": {
        target: `http://localhost:${process.env.TELNYX_PROXY_PORT ?? 8787}`,
        changeOrigin: true,
      },
    },
  },

  // Multi-page: the mobile app (index.html) and the Control Hub (admin.html)
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        admin: path.resolve(__dirname, 'admin.html'),
        site: path.resolve(__dirname, 'site.html'),
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
