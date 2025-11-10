import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  base: 'chat/',
  server: {
    host: true
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          // This will copy all assets from Shoelace's dist folder
          // into the 'dist/assets' directory during the build process.
          src: 'node_modules/@shoelace-style/shoelace/dist/assets/*',
          dest: 'assets'
        }
      ]
    })
  ]
})
