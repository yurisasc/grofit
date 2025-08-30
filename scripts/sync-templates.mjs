#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')

const ROOT_TSC = {
  lib: 'tsconfig.lib.json',
  nest: 'tsconfig.nest.json',
  next: 'tsconfig.next.json',
}

const bases = ['apps', 'packages']

async function exists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}
async function readJSON(p) {
  return JSON.parse(await fs.readFile(p, 'utf8'))
}
async function writeJSON(p, o) {
  await fs.writeFile(p, JSON.stringify(o, null, 2) + '\n')
}

async function listWorkspaces() {
  const dirs = []
  for (const b of bases) {
    const base = path.join(root, b)
    if (!(await exists(base))) continue
    for (const ent of await fs.readdir(base, { withFileTypes: true })) {
      if (!ent.isDirectory()) continue
      const d = path.join(base, ent.name)
      // include nested under packages/plugins/*
      if (b === 'packages' && ent.name === 'plugins') {
        for (const sub of await fs.readdir(d, { withFileTypes: true })) {
          if (sub.isDirectory()) dirs.push(path.join(d, sub.name))
        }
      } else {
        dirs.push(d)
      }
    }
  }
  const withPkg = []
  for (const d of dirs) {
    if (await exists(path.join(d, 'package.json'))) withPkg.push(d)
  }
  return withPkg
}

function detectType(pkg) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  if (deps?.next) return 'next'
  if (deps?.['@nestjs/core']) return 'nest'
  return 'lib'
}

function rel(fromAbs, toAbs) {
  return path.relative(fromAbs, toAbs).split(path.sep).join('/')
}

async function syncDir(dir, engines, packageManager) {
  const pkgPath = path.join(dir, 'package.json')
  if (!(await exists(pkgPath))) return null
  const pkg = await readJSON(pkgPath)
  const type = detectType(pkg)

  // package.json adjustments
  let changed = false
  if (packageManager && pkg.packageManager !== packageManager) {
    pkg.packageManager = packageManager
    changed = true
  }
  if (engines && JSON.stringify(pkg.engines) !== JSON.stringify(engines)) {
    pkg.engines = engines
    changed = true
  }

  if (type === 'lib') {
    pkg.scripts = {
      ...(pkg.scripts || {}),
      build: 'tsc -b',
      dev: 'tsc -b -w',
      typecheck: 'tsc -b --clean && tsc -b',
    }
    if (!pkg.main) {
      pkg.main = 'dist/index.js'
      changed = true
    }
    if (!pkg.types) {
      pkg.types = 'dist/index.d.ts'
      changed = true
    }
    changed = true
  } else if (type === 'nest' || type === 'next') {
    pkg.scripts = { ...(pkg.scripts || {}), typecheck: 'tsc -p tsconfig.json' }
    changed = true
  }
  if (changed) await writeJSON(pkgPath, pkg)

  // tsconfig extends
  const tsPath = path.join(dir, 'tsconfig.json')
  if (await exists(tsPath)) {
    const ts = await readJSON(tsPath)
    const want = rel(dir, path.join(root, ROOT_TSC[type]))
    if (ts.extends !== want) {
      ts.extends = want
      await writeJSON(tsPath, ts)
      changed = true
    }
  }
  return { dir, type, changed }
}

async function main() {
  const rootPkg = await readJSON(path.join(root, 'package.json'))
  const engines = rootPkg.engines
  const packageManager = rootPkg.packageManager
  const dirs = await listWorkspaces()

  const results = []
  for (const d of dirs) {
    const r = await syncDir(d, engines, packageManager)
    if (r) results.push(r)
  }
  const updated = results.filter((r) => r?.changed)
  console.log(`Synced ${updated.length}/${results.length} workspaces`)
  for (const r of updated) console.log(` - ${path.relative(root, r.dir)} -> ${r.type}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
