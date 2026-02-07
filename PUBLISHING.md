# Publishing

All four packages are published to npm under public access and share the same version number.

## Prerequisites

```bash
npm whoami  # confirm you're logged in
```

## First-Time Publish

```bash
pnpm -r run build

pnpm publish --access public --otp=<CODE> ./packages/core
pnpm publish --access public --otp=<CODE> ./packages/vite-plugin
pnpm publish --access public --otp=<CODE> ./packages/next-plugin
pnpm publish --access public --otp=<CODE> ./packages/agent-tail
```

Core must be published first since the other packages depend on it. The umbrella `agent-tail` package should be published last.

> **Important:** Always use `pnpm publish` (not `npm publish`). pnpm automatically replaces `workspace:^` with the real version range (e.g. `^0.1.0`) at publish time. Using `npm publish` will leave the raw `workspace:` protocol in the published package, breaking installs for consumers.

## Releasing a New Version

1. Bump versions across all packages:

```bash
pnpm version:patch   # 0.0.1 → 0.0.2
# or
pnpm version:minor   # 0.0.x → 0.1.0
# or
pnpm version:major   # 0.x.x → 1.0.0
```

2. Commit, tag, and publish:

```bash
git add -A && git commit -m "v0.0.2"
git tag v0.0.2
pnpm -r run build
pnpm publish --access public --otp=<CODE> ./packages/core
pnpm publish --access public --otp=<CODE> ./packages/vite-plugin
pnpm publish --access public --otp=<CODE> ./packages/next-plugin
pnpm publish --access public --otp=<CODE> ./packages/agent-tail
git push && git push --tags
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm version:patch` | Bump all packages by patch |
| `pnpm version:minor` | Bump all packages by minor |
| `pnpm version:major` | Bump all packages by major |
| `pnpm release` | Build all packages and publish (still requires OTP) |

## Notes

- All four packages are versioned in lockstep (same version number).
- The `release` script uses `--no-git-checks` because the build step generates dist files that make the working tree dirty.
- npm 2FA is enabled, so every publish requires an `--otp` code from your authenticator.
- `workspace:^` dependencies are resolved to real version ranges automatically by pnpm at publish time. **Never use `npm publish`** — it does not resolve the `workspace:` protocol.
