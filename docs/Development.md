# Development Guide

A practical guide to setting up a local development environment, running the app and its
backend services, and configuring and troubleshooting the dev loop.

> **Scope.** This expands on the quickstart in the [README](../README.md). For *native*
> (iOS/Android emulator) builds see [`Running-in-an-Emulator.md`](./Running-in-an-Emulator.md);
> for end-to-end tests see [`Testing.md`](./Testing.md); for *how the code is organized* see
> [`Architecture.md`](./Architecture.md).

## Table of contents
- [What you run locally](#what-you-run-locally)
- [Prerequisites](#prerequisites)
- [First-time setup](#first-time-setup)
- [The dev backend (Docker)](#the-dev-backend-docker)
- [Running the web app](#running-the-web-app)
- [Environment & configuration](#environment--configuration)
- [Build variants](#build-variants)
- [Quality gates](#quality-gates)
- [Troubleshooting](#troubleshooting)

## What you run locally

For day-to-day development you run two things:

1. **The web app** — a Webpack dev server (`npm run dev`) serving the React/Ionic app at
   <http://localhost:3003/> with hot reload. The same code is later packaged into the native
   iOS/Android apps via Capacitor.
2. **The backend services** — a local **KERIA** cloud agent, **KERI witnesses**, and a
   **credential-issuance** server + UI, all brought up with Docker Compose. The wallet cannot
   do anything useful (create identifiers, receive credentials) without a KERIA agent to talk
   to.

```
 Browser ──► localhost:3003  (web app, npm run dev)
                 │  Signify-TS (signed HTTP)
                 ▼
            localhost:3901/3902/3903  KERIA  ◄──► localhost:5642-5647  witnesses
                 ▲
            localhost:3001 credential-issuance server  ◄── localhost:3000 issuance UI
                       (all of the above run in Docker)
```

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| **Node.js** | **20.x** (use the latest 20.x release) | `package.json` pins `engines.node = 20.x`. Some transitive deps request `>=20.18.1`; an older 20.x prints harmless `EBADENGINE` warnings. If your shell defaults to a newer Node, switch with [nvm](https://github.com/nvm-sh/nvm): `nvm install 20 && nvm use 20`. |
| **npm** | bundled with Node 20 | |
| **Docker** + **Docker Compose** | recent | Runs the backend services. |
| **make** | any | `make init` configures the git hooks. |
| **git** | any | |

For native builds you additionally need **Xcode** (iOS, macOS only) or **Android Studio**
(Android) — see [`Running-in-an-Emulator.md`](./Running-in-an-Emulator.md). These are not
required for web/core development.

## First-time setup

```bash
# 1. Get the code (external contributors: fork first, then clone your fork)
git clone https://github.com/cardano-foundation/veridian-wallet.git
cd veridian-wallet

# 2. Configure the git hooks (enforces Conventional Commits on commit-msg)
make init

# 3. Select Node 20 (if you use nvm)
nvm use 20

# 4. Install dependencies
npm install
```

The first `npm install` is large (it includes the Appium/WebdriverIO E2E stack and builds
Signify-TS from a pinned git commit) and can take several minutes.

## The dev backend (Docker)

```bash
docker compose up -d --build
```

This builds/pulls and starts the services defined in
[`docker-compose.yaml`](../docker-compose.yaml):

| Service | Container | Ports (host) | Purpose |
|---|---|---|---|
| `keria` | `idw-keria` | 3901, 3902, 3903 | The KERIA cloud agent. **3901** = admin/connect, **3902** = KERI protocol, **3903** = boot. `configs/local.yaml` points the app at `3901` (connect) and `3903` (boot). |
| `witnesses` | `idw-witnesses` | 5642–5647 | Six demo KERI witnesses (`kli witness demo`) that receipt key events. |
| `cred-issuance` | `cred-issuance` | 3001 | Test credential-issuance server (issues/revokes ACDCs). Not a production issuer — testing only. |
| `cred-issuance-ui` | `cred-issuance-ui` | 3000 | Web UI for the issuance server (<http://localhost:3000>). |

Useful commands:

```bash
docker compose ps                 # check service status
docker compose logs -f keria      # follow a service's logs
docker compose down               # stop services (keeps data volumes)
docker compose down -v            # stop AND wipe local KERIA/issuer state (clean slate)
```

Local state persists in the `keria-data` and `issuer-server-data` Docker volumes; use
`down -v` when you want a fresh environment (e.g. after corrupting onboarding state).

## Running the web app

With the backend up:

```bash
npm run dev
```

Then open <http://localhost:3003/>. The dev server has hot reload and source maps. The first
compile of the full TypeScript codebase takes a while — wait for the
`webpack-dev-server ... Project is running at` line before loading the page.

To skip the onboarding flow during development, set `DEV_SKIP_ONBOARDING=true` in `.env`
(see below) — handy when iterating on post-onboarding screens.

## Environment & configuration

There are **two** layers of configuration, and it's important to understand how they differ.

### 1. Environment files (`configs/<ENVIRONMENT>.yaml`)

At startup, `ConfigurationService` (`src/core/configuration/`) dynamically imports
`configs/<ENVIRONMENT>.yaml` and validates it. `ENVIRONMENT` defaults to `local`.

| `ENVIRONMENT` | File | KERIA target | RASP |
|---|---|---|---|
| `local` (default) | `configs/local.yaml` | `http://127.0.0.1:3901` / boot `:3903` (your local Docker KERIA) | off |
| `remote` | `configs/remote.yaml` | the shared dev sandbox KERIA | off |
| `prod` | `configs/prod.yaml` | (set at deploy time) | on |

The schema is small: `keri.keria.url`, `keri.keria.bootUrl`, and `security.rasp.enabled`
(see `configurationService.types.ts`). `npm run dev` uses `local`; the `build` scripts set
`ENVIRONMENT` explicitly (see [Build variants](#build-variants)).

### 2. `.env` and shell variables (baked in at build time)

Webpack loads `.env` via `dotenv` and **inlines `process.env` into the bundle at build time**
(`webpack.DefinePlugin` in `webpack.common.cjs`). Consequently:

> ⚠️ **Changing `.env` or an env var requires restarting `npm run dev`** (or rebuilding) — the
> values are compiled into the bundle, not read at runtime.

Copy `.env.example` to `.env` and adjust as needed. Useful variables:

| Variable | Purpose |
|---|---|
| `ENVIRONMENT` | Which `configs/*.yaml` to load (`local` / `remote` / `prod`). |
| `DEV_SKIP_ONBOARDING` | Skip onboarding in development. |
| `KERIA_IP` | Override the KERIA host at runtime (see below). |
| `APP_CERT_HASH`, `WATCHER_MAIL` | freeRASP configuration. |
| `APP_TEAM_ID`, `APP_PATH` | iOS team id / built-app path for native & E2E. |

### `KERIA_IP` — reaching KERIA from emulators and devices

`configs/local.yaml` points KERIA at `127.0.0.1`, which is correct for the browser but **not**
for an emulator/simulator or a physical device, where `127.0.0.1` is the device itself.
`KERIA_IP` rewrites the host portion of the KERIA URLs at startup:

- **Android emulator:** `KERIA_IP=10.0.2.2` (the host loopback alias).
- **iOS simulator / physical device:** `KERIA_IP=<your host machine's LAN IPv4>`.

The dev server prints a warning when `KERIA_IP` is set, as a reminder it's non-default.

## Build variants

From `package.json`:

| Script | What it does |
|---|---|
| `npm run dev` | Dev server at `:3003` (`ENVIRONMENT=local`). |
| `npm run build` | Production web build with `ENVIRONMENT=remote`. |
| `npm run build:local` | Web build with `ENVIRONMENT=local`. |
| `npm run build:cap` | `build` + `npx cap sync` (copies the web build into the native projects). Use before opening Xcode/Android Studio. |
| `npm run build:e2e` | `build:local` + `cap sync`, for the E2E suite. |
| `npm run build:release` | `ENVIRONMENT=prod` build + `cap sync`. |

`npx cap sync` copies the latest web `build/` into `ios/` and `android/` and updates native
plugins; run it (or a `build:*` script that includes it) whenever you want native to pick up
web changes.

## Quality gates

| Check | Command | Notes |
|---|---|---|
| Lint | `npm run eslint` | ESLint over `src/**/*.{ts,tsx}`. |
| Format | `npm run prettier` | Prettier write. |
| Unit tests | `npm test` | Jest + Testing Library; tests are colocated as `*.test.ts(x)`. |
| E2E tests | see [`Testing.md`](./Testing.md) | WebdriverIO + Appium (Cucumber). |
| Dependency audit | `npm run audit` | `audit-ci` against the allowlist in `audit-ci.jsonc`. |

### Git hooks (a gotcha worth knowing)

Two hook mechanisms exist, and each sets `core.hooksPath` to a different directory:

- **`npm install`** runs the `prepare` script (`husky install`), which points
  `core.hooksPath` at **`.husky/`** — enabling `.husky/pre-commit` (runs `lint-staged`:
  ESLint + Prettier on staged files).
- **`make init`** points `core.hooksPath` at **`.githooks/`** — enabling
  `.githooks/commit-msg` (enforces [Conventional Commits](https://www.conventionalcommits.org/),
  which drive the changelog).

Because `core.hooksPath` holds a single directory, **these are mutually exclusive — whichever
ran last wins.** If you run `make init` and later run `npm install`, Husky takes over and the
`commit-msg` check is no longer active (and vice-versa). Check which is active with:

```bash
git config core.hooksPath
```

Re-run `make init` if you want the Conventional Commits check back after an `npm install`.
Regardless of hooks, please follow Conventional Commits and sign off commits where required by
the project's DCO.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `npm warn EBADENGINE ... required: { node: '>=20.18.1' }` | A 20.x older than 20.18.1. Harmless, but use the latest 20.x to silence it (`nvm install 20`). |
| Wrong Node entirely (e.g. v22/v24) | Your shell default isn't 20. Run `nvm use 20` in the project before `npm install`/`npm run dev`. |
| Blank page / network errors in the app | The Docker backend isn't up. Run `docker compose up -d` and check `docker compose ps`. |
| The app can't reach KERIA on an emulator/device | Set `KERIA_IP` appropriately (see above) and **restart** the dev server. |
| Changed `.env` but nothing happened | Env vars are compiled in at build time — restart `npm run dev` / rebuild. |
| Onboarding/state stuck in a bad state | `docker compose down -v` to wipe local KERIA/issuer volumes, and clear the browser's site data, for a clean slate. |
| First `npm run dev` seems to hang | The initial TypeScript compile is large; wait for the "Project is running at" line. |
| Mixed-content / HTTP blocked on Android emulator | `capacitor.config.ts` enables `allowMixedContent` for non-prod so the WebView can reach a local HTTP KERIA. |
