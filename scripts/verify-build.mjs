import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
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

for (const page of ['index.html', 'contact.html', '404.html']) {
  assert.ok(first[page], `Missing ${page}`)
  const html = readFileSync(join(output, page), 'utf8')
  for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    const reference = match[1]
    if (/^(?:https?:|mailto:|tel:|data:|#)/.test(reference)) continue
    const path = reference.split(/[?#]/, 1)[0]
    const target = path === '/' ? 'index.html' :
      path === '/contact' ? 'contact.html' : path.replace(/^\//, '')
    assert.ok(first[target], `Missing ${reference} referenced by ${page}`)
  }
}

const sourceAssets = snapshot(staticRoot)
for (const [asset, hash] of Object.entries(sourceAssets)) {
  assert.equal(first[asset], hash, `Static asset changed: ${asset}`)
}

rmSync(output, { recursive: true, force: true })
build()
assert.deepEqual(snapshot(output), first, 'Clean builds differ')
console.log(`Verified ${Object.keys(first).length} reproducible output files and ${Object.keys(sourceAssets).length} copied assets.`)
