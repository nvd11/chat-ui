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
          src: 'node_modules/@shoelace-style/shoelace/dist/assets/icons',
          dest: 'assets'
        },
        // Also copy the Shoelace assets to our own assets directory
        {
          src: 'node_modules/@shoelace-style/shoelace/dist/assets',
          dest: '.'
        }
      ]
    })
  ]
})
