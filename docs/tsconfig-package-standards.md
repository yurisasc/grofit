# Monorepo TypeScript and package.json Standards

This document explains how TypeScript configuration and package.json conventions are standardized across the Grofit monorepo. It describes the presets, how workspaces use them, and how scaffolding/sync automation works.

- Root presets: `tsconfig.lib.json`, `tsconfig.nest.json`, `tsconfig.next.json`
- Templates (used by scaffolding): `templates/tsconfig/*`, `templates/package/*`
- Automation: `scripts/scaffold.mjs`, `scripts/sync-templates.mjs`
- Orchestration: `turbo.json` with topological typecheck/build

Use this as a reference to understand how configs are structured and how new/existing workspaces remain consistent.

## Root TS Presets

- `tsconfig.lib.json`
  - For library packages under `packages/`.
  - Extends `./tsconfig.base.json`; enables `declaration` and `composite` so libraries emit types and support project references.
  - Libraries set their own `outDir`/`rootDir` and module settings as needed.

- `tsconfig.nest.json`
  - For NestJS apps under `apps/*` that are Node backends.
  - Enables `emitDecoratorMetadata`, `experimentalDecorators`, `types: ["node"]`.
  - App `tsconfig.json` stays minimal; include `src` only.

- `tsconfig.next.json`
  - For Next.js apps under `apps/web` or similar.
  - Sets the flags Next expects (e.g., `jsx` preserve, `noEmit`, bundler resolution, etc.).
  - Add the Next TypeScript plugin in the extending app if needed: `"plugins": [{ "name": "next" }]`.

Each workspace should `"extends"` the appropriate root preset.

## Local tsconfig.json Patterns

- Libraries, e.g. `packages/utils/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.lib.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "module": "CommonJS"
  },
  "include": ["src"],
  "references": [{ "path": "../contracts" }]
}
```

- Nest app, e.g. `apps/api/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.nest.json",
  "include": ["src"]
}
```

- Next app, e.g. `apps/web/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.next.json",
  "include": ["./", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Notes:

- Keep per-workspace files minimal. Only add overrides you actually need (e.g., `rootDir`, `outDir`, framework-specific flags).
- Use `references` to other local packages to guarantee correct `tsc -b` ordering.

## Path Aliases and Module Resolution

- Root `tsconfig.base.json` provides `baseUrl` and (optionally) `paths` for editor DX.
- Prefer not to point aliases to cross-package `src` files for build-mode. Instead, rely on:
  - Project References (`references` in `tsconfig.json`).
  - pnpm workspace dependency graph (package.json `dependencies`).
- If you opt to use `paths`, prefer mapping to package roots (e.g. `"packages/contracts"`) rather than `src` to avoid TS6305. When in doubt, omit `paths` and let Node/pnpm resolution handle it.

## Project References and Turbo Ordering

- Always add `"references"` in TS configs where a package imports another local package.
  - Example: `packages/orders` references `../db` and `../contracts`.
- Ensure `package.json` declares workspace dependencies too, so Turbo’s `^typecheck` and `^build` run in topological order.
- Root `turbo.json` includes:

```json
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**", "build/**"] },
    "typecheck": { "dependsOn": ["^typecheck"] }
  }
}
```

## package.json Conventions

For libraries under `packages/*`:

- `main`: `dist/index.js`
- `types`: `dist/index.d.ts`
- Scripts:
  - `build`: `tsc -b`
  - `dev`: `tsc -b -w` (optional)
  - `typecheck`: `tsc -b --clean && tsc -b`
- Declare internal deps with `workspace:*`.

Example `packages/orders/package.json`:

```json
{
  "name": "@grofit/orders",
  "version": "0.1.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -b",
    "dev": "tsc -b -w",
    "typecheck": "tsc -b --clean && tsc -b"
  },
  "dependencies": {
    "@grofit/contracts": "workspace:*",
    "@grofit/core": "workspace:*",
    "@grofit/db": "workspace:*"
  }
}
```

## Scaffolding and Syncing

These scripts keep workspaces consistent with the root presets and templates.

### Scaffold new workspaces — `scripts/scaffold.mjs`

CLI usage:

```bash
pnpm scaffold --type lib|nest|next --name <name> [--dir <relative-or-absolute>]

# Shorthands
pnpm scaffold --lib --name @grofit/foo
pnpm scaffold --nest --name api
pnpm scaffold --next --name web
```

Behavior:

- Picks templates from `templates/package/pkg-*.json` and `templates/tsconfig/*.json` based on `--type`.
- Writes `package.json` with `packageManager` and `engines` inherited from the root `package.json`.
- Generates `tsconfig.json` whose `extends` points to the appropriate root preset using a correct relative path.
- Creates starter source files:
  - lib: `src/index.ts`
  - nest: `src/app.module.ts`, `src/main.ts`, and a minimal `nest-cli.json`
  - next: `app/page.tsx` and `next.config.mjs` with `experimental.externalDir` enabled
- Default location when `--dir` is omitted:
  - lib → `packages/<unscoped-name>`
  - nest/next → `apps/<name>`

### Sync existing workspaces — `scripts/sync-templates.mjs`

CLI usage:

```bash
pnpm templates:sync
```

Behavior:

- Scans `apps/` and `packages/` (including `packages/plugins/*`).
- Detects workspace type from dependencies:
  - has `next` → `next`
  - has `@nestjs/core` → `nest`
  - otherwise → `lib`
- Updates workspace `package.json`:
  - Aligns `packageManager` and `engines` with the root.
  - For libraries: enforces scripts `build`, `dev`, `typecheck`; ensures `main` and `types` (defaults to `dist/index.js` and `dist/index.d.ts`).
  - For nest/next apps: ensures a `typecheck` script (`tsc -p tsconfig.json`).
- Updates `tsconfig.json` to ensure `extends` points to the correct root preset via a relative path.
- Prints a summary of synced workspaces and their detected types.

Edit root presets to change behavior monorepo‑wide. Edit templates to change how future workspaces are scaffolded.

## Build and Typecheck flow

- Libraries emit to `dist/` and expose `main/types` from `dist/`.
- Apps do not emit during typecheck (Next) or are built by their framework (Nest via `nest build`).
- `turbo.json` enforces topological order for `build` and `typecheck` via `^build`/`^typecheck`.
- Project references (`references`) ensure `tsc -b` compiles dependencies before dependents.

## Troubleshooting

- TS6305: “Output file X has not been built from source Y”
  - Cause: Consumer built before provider or aliases point to provider `src`.
  - Fix: Add TS `references` and `package.json` deps. Avoid cross-package `src` paths. Rebuild provider.

- Next.js warning about TypeScript plugin
  - If your app extends a preset, Next cannot inject its plugin automatically.
  - Add manually in the app `tsconfig.json`:
    ```json
    { "compilerOptions": { "plugins": [{ "name": "next" }] } }
    ```

- NestJS decorator errors in web build
  - Ensure Nest code is not included in Next’s compilation. Keep imports clean between `apps/web` and `apps/api`.

- Turbo warning: "no output files found"
  - Ensure libraries emit to `dist/`. Set `outDir` in the workspace `tsconfig.json` when using `tsconfig.lib.json`.

## Example Summary

- `apps/api/tsconfig.json` → extends `../../tsconfig.nest.json`, includes `src`.
- `apps/web/tsconfig.json` → extends `../../tsconfig.next.json`, includes `./` and `.next/types/**/*.ts`.
- `packages/*/tsconfig.json` → extends `../../tsconfig.lib.json`, sets `outDir`, `rootDir`, `module`, adds `references` where needed.
- `turbo.json` ensures topological `build` and `typecheck`.
- `package.json` for libraries points `main/types` to `dist/` and declares workspace deps.

This standard keeps configs minimal, avoids cyclic/early builds, and centralizes behavior in root presets while providing automation to keep all workspaces aligned.
