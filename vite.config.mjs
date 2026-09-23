import { defineConfig } from 'vite'
import pug from 'pug'
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = dirname(fileURLToPath(import.meta.url))
const sourceRoot = resolve(projectRoot, 'src')
const pages = ['index', 'contact', '404']

function renderPages() {
  for (const page of pages) {
    writeFileSync(
      resolve(sourceRoot, `${page}.html`),
      pug.renderFile(resolve(sourceRoot, 'pug', `${page}.pug`))
    )
  }
}

// Render entries before Vite reads them. Both clean builds and the dev server
// use the same Pug templates; generated HTML remains ignored by Git.
renderPages()

export default defineConfig({
  root: sourceRoot,
  publicDir: resolve(sourceRoot, 'static'),
  plugins: [{
    name: 'pug-pages',
    configureServer(server) {
      server.watcher.add(resolve(sourceRoot, 'pug'))
      server.watcher.on('change', file => {
        if (file.endsWith('.pug')) renderPages()
      })
    }
  }],
  build: {
    outDir: resolve(projectRoot, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: Object.fromEntries(pages.map(page => [page, resolve(sourceRoot, `${page}.html`)]))
    }
  }
})
