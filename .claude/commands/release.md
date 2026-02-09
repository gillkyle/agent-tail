# Release

Publish a new version of all packages to npm.

## Steps

1. **Pre-flight checks** — Run these in parallel:
   - `pnpm run test` — all tests must pass
   - `pnpm run typecheck` — no type errors
   - `pnpm run build` — all packages build cleanly
   - `git status` — check for uncommitted changes

2. **Determine version bump** — Ask the user which bump type to apply:
   - `pnpm version:patch` (0.x.Y → 0.x.Y+1) — bug fixes
   - `pnpm version:minor` (0.X.y → 0.X+1.0) — new features
   - `pnpm version:major` (X.y.z → X+1.0.0) — breaking changes

   If the user already specified a version bump type, use that directly without asking.

3. **Update the changelog** — Add a new entry to `docs/src/app/changelog/page.tsx` in the `releases` array. Follow the existing format:
   ```tsx
   {
     version: "<new version>",
     date: "<Month Year>",
     changes: [
       { type: "added" | "fixed" | "improved" | "removed", text: <>Description</> },
     ],
   },
   ```
   Ask the user what changes to include if not obvious from recent commits.

4. **Commit and tag** — Stage all changes and create a version commit and tag:
   ```bash
   git add -A
   git commit -m "v<new version>"
   git tag v<new version>
   ```

5. **Build** — Run `pnpm -r run build` to generate fresh dist files.

6. **Prompt user to publish** — Display this command for the user to run manually (requires their OTP from authenticator):
   ```
   pnpm -r publish --access public --no-git-checks --otp=<OTP>
   ```
   Do NOT run the publish command yourself. The user must run it with their OTP code.

7. **After publish** — Remind the user to push the commit and tag:
   ```bash
   git push && git push --tags
   ```

## Important Notes

- All four packages (`agent-tail-core`, `vite-plugin-agent-tail`, `next-plugin-agent-tail`, `agent-tail`) share the same version number.
- Always use `pnpm publish`, never `npm publish` — pnpm resolves `workspace:^` dependencies at publish time.
- npm 2FA is enabled, so every publish requires an `--otp` code.
- The `--no-git-checks` flag is needed because the build step generates dist files that make the working tree dirty.
- Core must be published first since other packages depend on it. The `pnpm -r publish` command handles this via the workspace dependency graph.
