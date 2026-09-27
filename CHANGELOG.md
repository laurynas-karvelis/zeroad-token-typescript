# Changelog

All notable changes to `@zeroad.network/token`. Versions follow
[Semantic Versioning](https://semver.org/).

## [1.0.2] - 2026-09-27

### Changed

- README and `SKILLS.md` updates. The code is unchanged.

## [1.0.1] - 2026-09-26

### Changed

- Package keywords updated. The code is unchanged.

## [1.0.0] - 2026-09-26

First stable release. It replaces the 0.x API, headers and token format. 0.x
releases can't verify current membership tokens, so upgrade to use this version.

### Added

- `createPublisher({ publisherId, hostnames })` returns a publisher to create once
  and reuse for the life of the process.
- `publisher.header` sends `Better-Web-Publisher`, so the extension finds your
  website and credits the visit.
- `publisher.verify(token, hostname?)` checks the `Better-Web-Token` header
  offline. It never throws on bad input. It returns `subscriber` and, for a
  rejection, a `reason`: `missing`, `malformed`, `unsupported_version`,
  `expired`, `unknown_hostname`, `wrong_hostname` or `forged`.
- Tokens are bound to a hostname with two Ed25519 signatures. An apex hostname
  and its `www` sibling share one allowlist entry, but each is signed separately.
- Built-in verdict cache, with `publisher.cacheStats()` and `publisher.clearCache()`.
- Runs on Node 16+, Bun 1.1+, Deno 2.0+ and edge runtimes. Ships ESM (`.mjs`)
  and CJS builds, with no dependencies.
- `SKILLS.md`, a reference for coding agents, ships in the package.

### Removed

- The 0.x `Site` class, its `X-Better-Web-Welcome` and `X-Better-Web-Hello`
  headers, and the logger exports.

[1.0.2]: https://github.com/laurynas-karvelis/zeroad-token-typescript/compare/1.0.1...1.0.2
[1.0.1]: https://github.com/laurynas-karvelis/zeroad-token-typescript/compare/1.0.0...1.0.1
[1.0.0]: https://github.com/laurynas-karvelis/zeroad-token-typescript/tree/1.0.0
