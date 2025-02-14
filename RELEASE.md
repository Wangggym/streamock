# Release Process

This document describes how to release a new version of streamock.

## Steps to Release

1. Make sure your local main branch is up to date:
   ```bash
   git checkout main
   git pull origin main
   ```

2. Update version using npm (choose one):
   ```bash
   npm version patch   # for bug fixes (1.0.0 -> 1.0.1)
   npm version minor   # for new features (1.0.0 -> 1.1.0)
   npm version major   # for breaking changes (1.0.0 -> 2.0.0)
   ```

3. Push changes and tags to GitHub:
   ```bash
   git push && git push --tags
   ```

4. The GitHub Action will automatically:
   - Run tests (if any)
   - Build the package (if needed)
   - Publish to NPM

5. Verify the new version is available on:
   - NPM: https://www.npmjs.com/package/streamock
   - GitHub: https://github.com/Wangggym/streamock/releases

## Version Guidelines

- `patch` (1.0.0 -> 1.0.1): Bug fixes and minor changes
- `minor` (1.0.0 -> 1.1.0): New features (backwards compatible)
- `major` (1.0.0 -> 2.0.0): Breaking changes

## Troubleshooting

If the automatic publish fails:
1. Check the GitHub Actions logs
2. Ensure NPM_TOKEN is correctly set in GitHub Secrets
3. Verify you have the correct permissions on NPM 