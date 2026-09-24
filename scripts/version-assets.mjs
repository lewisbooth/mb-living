import { createHash } from 'node:crypto'
import { copyFileSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const output = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const assets = new Map()

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? files(path) : [path]
  })
}

function fingerprint(bytes) {
  return createHash('sha256').update(bytes).digest('hex').slice(0, 16)
}

function immutableName(path, bytes) {
  const ext = extname(path)
  return `${path.slice(0, -ext.length)}.${fingerprint(bytes)}${ext}`
}

// Vite hashes bundled JS and CSS, but copies public/ assets unchanged. Move
// those copies to content-addressed URLs before rewriting their consumers.
for (const directory of ['images', 'fonts', 'js', 'css']) {
  for (const path of files(join(output, directory))) {
    const oldPath = '/' + relative(output, path).replaceAll('\\', '/')
    const newPath = '/immutable' + immutableName(oldPath, readFileSync(path))
    mkdirSync(dirname(join(output, newPath)), { recursive: true })
    renameSync(path, join(output, newPath))
    assets.set(oldPath, newPath)
  }
  rmSync(join(output, directory), { recursive: true })
}

// Keep the conventional URL as a fallback for clients that request it without
// looking at the HTML's icon links. The explicit icon link is fingerprinted.
const favicon = readFileSync(join(output, 'favicon.ico'))
const versionedFavicon = '/immutable' + immutableName('/favicon.ico', favicon)
copyFileSync(join(output, 'favicon.ico'), join(output, versionedFavicon))
assets.set('/favicon.ico', versionedFavicon)

function rewriteStaticReferences(contents) {
  return contents.replace(/(["'(=\s])((?:\/)?(?:images|fonts|js|css)\/[\w.\-/%]+|\/favicon\.ico)/g,
    (match, prefix, url) => prefix + (assets.get(url.startsWith('/') ? url : '/' + url) ?? url))
}

// The generated stylesheet contains public/ URLs. Renaming it after rewriting
// keeps its own filename tied to its final bytes, as required for immutable CSS.
for (const path of files(join(output, 'assets')).filter(path => path.endsWith('.css'))) {
  const css = rewriteStaticReferences(readFileSync(path, 'utf8'))
  const name = basename(path).replace(/-[A-Za-z0-9_-]+\.css$/, '')
  const newPath = join(dirname(path), `${name}.${fingerprint(css)}.css`)
  writeFileSync(newPath, css)
  rmSync(path)
  assets.set('/assets/' + basename(path), '/assets/' + basename(newPath))
}

// Fail the build if future JS starts referencing a mutable public/ URL. Its
// Vite-generated filename would need updating after a content change, too.
for (const path of files(join(output, 'assets')).filter(path => path.endsWith('.js'))) {
  const js = readFileSync(path, 'utf8')
  if (rewriteStaticReferences(js) !== js) {
    throw new Error(`Mutable static URL in ${relative(output, path)}`)
  }
}

for (const path of files(output).filter(path => path.endsWith('.html'))) {
  let html = rewriteStaticReferences(readFileSync(path, 'utf8'))
  for (const [oldPath, newPath] of assets) {
    if (oldPath.startsWith('/assets/')) html = html.replaceAll(oldPath, newPath)
  }
  writeFileSync(path, html)
}

console.log(`Versioned ${assets.size} static assets for immutable browser caching.`)
