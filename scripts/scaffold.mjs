#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')

function parseArgs(argv) {
  const args = { type: 'lib', name: '', dir: '' }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    const [k, v] = a.startsWith('--') && a.includes('=') ? a.split('=') : [a, null]
    if (a === '--lib') args.type = 'lib'
    else if (a === '--nest') args.type = 'nest'
    else if (a === '--next') args.type = 'next'
    else if (k === '--type') args.type = v
    else if (k === '--name') args.name = v ?? argv[++i]
    else if (k === '--dir') args.dir = v ?? argv[++i]
  }
  if (!['lib', 'nest', 'next'].includes(args.type)) throw new Error(`Invalid --type ${args.type}`)
  if (!args.name)
    throw new Error('Missing --name <pkgName>. Example: --name @grofit/foo or --name web')
  return args
}

function unscopedName(name) {
  return name.startsWith('@') ? name.split('/')[1] : name
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function readJSON(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'))
}

async function writeJSON(file, obj) {
  await fs.writeFile(file, JSON.stringify(obj, null, 2) + '\n')
}

function rel(from, to) {
  return path.relative(from, to).split(path.sep).join('/')
}

async function main() {
  try {
    const args = parseArgs(process.argv)
    const name = args.name
    const short = unscopedName(name)

    const rootPkg = await readJSON(path.join(root, 'package.json'))

    let targetDir = args.dir
    if (!targetDir) {
      if (args.type === 'lib') targetDir = path.join(root, 'packages', short)
      else targetDir = path.join(root, 'apps', short)
    } else {
      targetDir = path.isAbsolute(targetDir) ? targetDir : path.join(root, args.dir)
    }

    await ensureDir(targetDir)

    // Pick templates
    const pkgTplMap = {
      lib: 'pkg-lib.json',
      nest: 'pkg-nest.json',
      next: 'pkg-next.json',
    }
    const tsTplMap = {
      lib: 'lib.json',
      nest: 'nest.json',
      next: 'next.json',
    }

    const pkgTpl = await readJSON(path.join(root, 'templates', 'package', pkgTplMap[args.type]))
    pkgTpl.name = name
    // inherit engines and packageManager from root
    pkgTpl.packageManager = rootPkg.packageManager
    pkgTpl.engines = rootPkg.engines
    await writeJSON(path.join(targetDir, 'package.json'), pkgTpl)

    const tsTpl = await readJSON(path.join(root, 'templates', 'tsconfig', tsTplMap[args.type]))
    const tsExtMap = {
      lib: 'tsconfig.lib.json',
      nest: 'tsconfig.nest.json',
      next: 'tsconfig.next.json',
    }
    const extendsPath = rel(targetDir, path.join(root, tsExtMap[args.type]))
    const tsconfig = { extends: extendsPath, ...tsTpl }
    await writeJSON(path.join(targetDir, 'tsconfig.json'), tsconfig)

    if (args.type === 'lib') {
      await ensureDir(path.join(targetDir, 'src'))
      const idx = `export const ${short.replace(/[^a-zA-Z0-9_]/g, '_')}_version = '0.0.0'\n`
      await fs.writeFile(path.join(targetDir, 'src', 'index.ts'), idx)
    } else if (args.type === 'nest') {
      await ensureDir(path.join(targetDir, 'src'))
      const appModule = `import { Module } from '@nestjs/common'\n\n@Module({})\nexport class AppModule {}\n`
      const mainTs = `import 'reflect-metadata'\nimport { NestFactory } from '@nestjs/core'\nimport { AppModule } from './app.module'\n\nasync function bootstrap() {\n  const app = await NestFactory.create(AppModule)\n  await app.listen(3000)\n}\nbootstrap()\n`
      await fs.writeFile(path.join(targetDir, 'src', 'app.module.ts'), appModule)
      await fs.writeFile(path.join(targetDir, 'src', 'main.ts'), mainTs)
      const nestCli = {
        $schema: 'https://json.schemastore.org/nest-cli',
        collection: '@nestjs/schematics',
        sourceRoot: 'src',
        compilerOptions: { deleteOutDir: true, webpack: true },
      }
      await writeJSON(path.join(targetDir, 'nest-cli.json'), nestCli)
    } else if (args.type === 'next') {
      await ensureDir(path.join(targetDir, 'app'))
      const page = `export default function Page() {\n  return <div>${short} app</div>\n}\n`
      await fs.writeFile(path.join(targetDir, 'app', 'page.tsx'), page)
      const nextCfg = `/** @type {import('next').NextConfig} */\nconst nextConfig = {\n  reactStrictMode: true,\n  experimental: { externalDir: true },\n}\nexport default nextConfig\n`
      await fs.writeFile(path.join(targetDir, 'next.config.mjs'), nextCfg)
    }

    console.log(`Scaffolded ${args.type} at ${rel(root, targetDir)}`)
  } catch (err) {
    console.error(err.message || err)
    process.exit(1)
  }
}

main()
