import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const output = join(root, 'dist')
const staticRoot = join(root, 'src', 'static')

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = join(directory, entry.name)
    return entry.isDirectory() ? files(filename) : [filename]
  })
}

function snapshot(directory) {
  return Object.fromEntries(files(directory).map(filename => [
    relative(directory, filename),
    createHash('sha256').update(readFileSync(filename)).digest('hex')
  ]))
}

function build() {
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], {
    cwd: root, stdio: 'inherit'
  })
  assert.equal(result.status, 0, 'Vite build failed')
}

rmSync(output, { recursive: true, force: true })
mkdirSync(output)
writeFileSync(join(output, 'stale-file.txt'), 'Must be deleted by the build')
build()
assert.equal(existsSync(join(output, 'stale-file.txt')), false, 'Old output survived')
const first = snapshot(output)

assert.match(readFileSync(join(output, '_headers'), 'utf8'),
  /\/immutable\/\*\s+Cache-Control: public, max-age=31536000, immutable/)
assert.match(readFileSync(join(output, '_headers'), 'utf8'),
  /\/assets\/\*\s+Cache-Control: public, max-age=31536000, immutable/)

function checkReference(reference, from) {
  if (/^(?:https?:|mailto:|tel:|data:|#)/.test(reference)) return
  const path = reference.split(/[?#]/, 1)[0]
  const target = path === '/' ? 'index.html' :
    path === '/contact' ? 'contact.html' : path.replace(/^\//, '')
  assert.ok(first[target], `Missing ${reference} referenced by ${from}`)
  if (!['index.html', 'contact.html'].includes(target)) {
    assert.match(path, /^\/(?:immutable|assets)\//,
      `Unversioned asset ${reference} referenced by ${from}`)
  }
}

for (const page of ['index.html', 'contact.html', '404.html']) {
  assert.ok(first[page], `Missing ${page}`)
  const html = readFileSync(join(output, page), 'utf8')
  for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    checkReference(match[1], page)
  }
  for (const match of html.matchAll(/url\(\s*['"]?([^'"()]+)['"]?\s*\)/g)) {
    checkReference(match[1], page)
  }
}

for (const css of files(join(output, 'assets')).filter(file => file.endsWith('.css'))) {
  const contents = readFileSync(css, 'utf8')
  for (const match of contents.matchAll(/url\(\s*['"]?([^'"()]+)['"]?\s*\)/g)) {
    checkReference(match[1], relative(output, css))
  }
  const hash = css.match(/\.([a-f0-9]{16})\.css$/)?.[1]
  assert.equal(hash, first[relative(output, css)].slice(0, 16),
    `Rewritten CSS filename does not match its content: ${css}`)
}

const sourceAssets = snapshot(staticRoot)
for (const [asset, hash] of Object.entries(sourceAssets)) {
  if (/^(?:images|fonts|js|css)\//.test(asset) || asset === 'favicon.ico') {
    const ext = extname(asset)
    const versioned = `immutable/${asset.slice(0, -ext.length)}.${hash.slice(0, 16)}${ext}`
    assert.equal(first[versioned], hash, `Missing or incorrect versioned asset: ${asset}`)
    if (asset !== 'favicon.ico') {
      assert.equal(first[asset], undefined, `Mutable copy remains: ${asset}`)
      continue
    }
  }
  assert.equal(first[asset], hash, `Static asset changed: ${asset}`)
}

rmSync(output, { recursive: true, force: true })
build()
assert.deepEqual(snapshot(output), first, 'Clean builds differ')
console.log(`Verified ${Object.keys(first).length} reproducible output files and ${Object.keys(sourceAssets).length} copied assets.`)
