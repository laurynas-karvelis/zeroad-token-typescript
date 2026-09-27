# @zeroad.network/token

Recognise [Zero Ad Network](https://zeroad.network) subscribers on your server, and serve them a clean page.
Verification runs offline, in about 80µs cold and 0.16µs cached, with no dependencies and no calls back to us.

```bash
npm install @zeroad.network/token
```

**In short**

- Subscribers pay one monthly membership, called Freedom, and use our browser extension.
- On your site, the extension sends a signed `Better-Web-Token` header. This package checks it and answers yes or no.
- For a yes, serve the page without ads, cookie banners, non-essential trackers or marketing popups. If you sell access, unlock your included paid content.
- You earn from the time subscribers spend on your site, and keep 70% of your share. Transfers to Stripe
  start once your balance reaches $30 and payout setup is complete. [How earnings work →](https://zeroad.network/docs/monetization)

Step-by-step guide with Hono and Express examples: [Node, Bun & Deno guide](https://zeroad.network/docs/site-integration/remove-ads/node)

---

## Two headers

This package handles both ends:

| Direction      | Header                 | Carries                                                   |
| :------------- | :--------------------- | :-------------------------------------------------------- |
| You → visitor  | `Better-Web-Publisher` | Your Publisher ID, so the extension finds you and credits the visit |
| Visitor → you  | `Better-Web-Token`     | Their signed membership token, bound to your hostname     |

**Already clean?** If your site has no ads, trackers, cookie banners, popups or paywall, you only need
to send `Better-Web-Publisher`. You don't need to verify anything.
[Check whether your site is already clean →](https://zeroad.network/docs/site-integration#is-your-site-already-clean)

---

## Integrate

### 1. Copy your Publisher ID

[Sign in](https://zeroad.network/login), then copy your **Publisher ID** from
[Sites & creators](https://zeroad.network/sites#publisher-id). It starts with `zapub_`.

- You don't need a paid membership to publish.
- Use the same ID on every site you run. There is no separate sign-up per site.

### 2. Create a publisher once

```ts
import { createPublisher } from "@zeroad.network/token"

export const publisher = createPublisher({
  publisherId: process.env.ZERO_AD_PUBLISHER_ID,
  hostnames: "example.com", // also covers www.example.com; pass a string[] for other hosts
})
```

Create it at startup, and reuse it for the life of the process.

`hostnames` lists every host you serve. It's required, because a token only verifies on a listed host.
See [why hostnames are an allowlist](#why-hostnames-are-an-allowlist).

### 3. Add one middleware

```ts
app.use(async (request, response, next) => {
  response.set(...publisher.header)

  response.locals.visitor = await publisher.verify(request.get(publisher.tokenHeaderName), request.get("host"))

  next()
})
```

It does two things on every request:

1. Sends `Better-Web-Publisher`, even when no token arrived. This is how the extension discovers your site.
2. Checks the visitor's token.

### 4. Serve subscribers the clean page

```ts
if (response.locals.visitor.subscriber) {
  // Skip ads, cookie consent, non-essential trackers and marketing popups.
  // If you sell access, unlock your base subscription or included paid content.
}
```

Unlock paid content on the server. Hiding a paywall overlay doesn't help if the content was never sent.
Higher tiers can stay restricted.

### 5. Keep subscriber pages out of shared caches

If a CDN, proxy or page cache sits in front of your app, set it to skip requests carrying `Better-Web-Token`.
[Set up page caching and CDNs →](https://zeroad.network/docs/site-integration/remove-ads/caching)

### 6. Check it works

1. Confirm your responses include `Better-Web-Publisher`:
   `curl -s -D - -o /dev/null https://example.com/ | grep -i better-web-publisher`
2. In your dashboard, open your website's page and select **Test in your browser**. No paid membership needed.
3. Reload your site. You should see the clean page.
4. Open the same URL without the extension, with caches warm. You should see the normal page.

Hono and Express middleware to copy, and the rest of the guide, are at
[zeroad.network/docs](https://zeroad.network/docs/site-integration/remove-ads/node).

---

## API

### `createPublisher(options)`

| Option                  | Type                 | Default      |                                                              |
| :---------------------- | :------------------- | :----------- | :----------------------------------------------------------- |
| `publisherId`           | `string`             | -            | From your dashboard. `zapub_` followed by 24 alphanumerics.  |
| `hostnames`             | `string \| string[]` | -            | Every host you serve. An apex covers its `www`. Ports, schemes and paths are stripped. |
| `publicKey`             | `string`             | platform key | Override for staging and tests. Leave alone in production.   |
| `clockToleranceSeconds` | `number`             | `60`         | Slack on expiry, for servers whose clocks drift.             |
| `cache`                 | `boolean \| object`  | on           | See [caching](#caching).                                     |

It returns an object to keep for the life of the process:

|                                         |                                                                |
| :-------------------------------------- | :------------------------------------------------------------- |
| `publisher.header`                      | `["Better-Web-Publisher", "zapub_..."]`, ready to spread       |
| `publisher.headerName` / `.headerValue` | the same, separately                                           |
| `publisher.tokenHeaderName`             | `"Better-Web-Token"`                                           |
| `publisher.tokenHeaderNameLowercase`    | `"better-web-token"`, how Node and Fastify key request headers |
| `publisher.verify(token, hostname?)`    | `Promise<VerificationResult>`                                  |
| `publisher.cacheStats()`                | `{ size, maxSize, hits, misses, evictions }`                   |
| `publisher.clearCache()`                | drops every cached verdict                                     |

### `publisher.verify(token, hostname?)`

Pass the raw header value: a `string`, a `string[]` (Node returns an array for a repeated header), `null` or
`undefined`. It never throws on bad input. A junk token is a result, not an exception.

- **Pass the actual request hostname,** including when you serve both an apex and `www`.
- **If you omit it,** the single configured hostname is used. With several configured hostnames, omitting it throws.
- **A hostname outside the allowlist** is rejected.

The result is a discriminated union, so TypeScript gives you the right fields in each branch:

```ts
const visitor = await publisher.verify(token, host)

if (visitor.subscriber) {
  visitor.plan // PLAN.FREEDOM
  visitor.planName // "Freedom"
  visitor.expiresAt // Date
} else {
  visitor.reason // REJECTED.*
}

visitor.hostname // what it was verified against
visitor.cached // whether this skipped the cryptography
```

### `REJECTED`

A reason names the check that failed. It isn't proof of an attack.

| Reason                | Means                                                  | What to do                       |
| :-------------------- | :----------------------------------------------------- | :------------------------------- |
| `missing`             | No token header. Most of your traffic.                 | Nothing. This is normal.         |
| `malformed`           | Not a well-formed token.                               | Nothing.                         |
| `unsupported_version` | Unsupported token format.                              | Check for an SDK update.         |
| `expired`             | Expiry is past the allowed time.                       | Nothing, unless it comes in bursts. |
| `unknown_hostname`    | The host isn't in your allowlist.                      | Check your `hostnames` config.   |
| `wrong_hostname`      | Authority signature passed; hostname signature failed. | Check the hostname and your proxy. |
| `forged`              | Authority signature failed.                            | Check for a `publicKey` override. |

The first time a token arrives with a version newer than this package understands, it's rejected as
`unsupported_version`, **and** a one-off `console.warn` suggests an SDK update. The warning alone doesn't
prove the token is genuine, or that a protocol upgrade has shipped. To silence it during a staged rollout,
or in tests that send such tokens on purpose, call `suppressProtocolWarnings()` once at startup.

### Also exported

`PLAN`, `PLAN_NAME`, `REJECTED`, `PUBLISHER_HEADER`, `PUBLISHER_ID_SCHEME`, `TOKEN_HEADER`,
`TOKEN_HEADER_LOWERCASE`, `AUTHORITY_PUBLIC_KEY`, `PROTOCOL_VERSION`, `TOKEN_BYTES`, `TOKEN_CHARACTERS`,
`DEFAULT_CACHE_OPTIONS`, `canonicalHostname()`, `encodePublisherHeader()`, `parsePublisherHeader()`,
`suppressProtocolWarnings()`, and the `VerificationResult`, `SubscriberResult`, `NonSubscriberResult`,
`Plan`, `Rejected`, `CacheOptions`, `CacheStats`, `Publisher`, `PublisherOptions` types.

This package **only verifies**. The platform's private authority key signs credentials, and the extension's
private ephemeral keys bind them to hostnames. Neither key is in a visitor token.

---

## Good to know

- **The first visit may have no token.** The extension discovers your ID from a page it has already loaded.
  The next page or a reload carries the token.
- **Tokens reach page and media requests only.** The extension adds them to HTTPS main-frame and media
  requests for the exact recognised hostname. Not to fetch/XHR calls, and not to subdomains.
- **Proxies must pass things through.** Forward `Better-Web-Token`, and keep the public `Host` header.
- **A header alone never grants access.** Only a successful `verify()` does.

---

## Caching

The extension reuses a token for its bound hostname while the credential is valid. So a returning visitor
may send bytes you've already checked. Caching skips repeating the signature checks. It's on by default, and
you'll rarely need to change it.

This caches verification results, not HTML. For page caches, see
[Page caching and CDNs](https://zeroad.network/docs/site-integration/remove-ads/caching).

```ts
createPublisher({
  publisherId: "zapub_...",
  hostnames: "example.com",
  cache: { ttl: 600_000, maxSize: 5000 }, // or `cache: false`
})
```

| Option    | Default  |                                   |
| :-------- | :------- | :-------------------------------- |
| `enabled` | `true`   |                                   |
| `ttl`     | `600000` | milliseconds a verdict is trusted |
| `maxSize` | `1000`   | entries, roughly 700 bytes each   |

Three things worth knowing:

**Failures are cached too.** A forged token costs as much to reject as a real one costs to accept, and
whoever sends it will likely send it again. This is safe: for a fixed public key, a rejection can never
later become an acceptance. The only direction a verdict moves is from valid to expired, and each entry's
own expiry handles that.

**A success never outlives the token.** The stored expiry is the earlier of your TTL and the token's own
`expiresAt`. A generous TTL can't extend anybody's membership.

**Cheap rejections are not cached.** A length check throws out a malformed token in about a microsecond.
Caching those would save nothing, and would let anyone fill your memory with distinct keys.

Entries are evicted least-used-first, with the oldest breaking ties. Expired entries are swept as writes
accumulate, not on a timer, so an idle process stays idle.

---

## How the token works

You don't need this to integrate. You may want it before you trust it.

A token is 174 bytes, 232 base64url characters, and carries **two** Ed25519 signatures.

```
  offset  size  field
       0     1  version
       1     1  plan
       2     4  expiresAt, u32 unix seconds, little-endian
       6    32  ephemeralPublicKey
      38    64  authoritySignature
     102     8  nonce
     110    64  hostnameSignature
```

**1. The platform signs batch credentials.** The extension generates disposable key pairs locally, and sends
only the public halves. The platform checks the account's membership, then signs the plan, expiry and each
key. Standard credentials expire at midnight UTC two days after issue, about 24–48 hours later. The
extension checks its pool hourly, and refreshes when credentials run low or near expiry. Demo and
publisher-test access use separately issued tokens, restricted to one hostname.

**2. The extension binds one to your hostname.** The first time it meets `example.com`, it takes an unused
key pair and signs your hostname with the private half. This happens offline. It reuses that bound token
for your exact hostname while it stays valid.

**3. You verify both signatures.** The first proves the platform authorised the plan and expiry. The second
proves the token was bound to _your_ hostname.

The hostname is deliberately absent from the wire. Your server already knows what it serves, and rebuilds
the signed message from that. A token bound elsewhere simply fails the signature.

### What this stops

The token you receive contains a **public** key, and a signature over **your own** hostname. The secret that
makes bindings never leaves the visitor's browser.

- You can't present a visitor's token at another site. That needs a signature over the other site's
  hostname, and you don't have the key.
- Nobody can edit the plan or extend the expiry. The platform signature covers both.
- Nobody can create a valid credential without the platform's private key.

### Privacy

- Tokens contain no account ID, name or email.
- Reusing a token allows correlation and replay on the same host while it's valid.
- Issuance is authenticated, so the platform sees which account requests each public key. This isn't blind
  issuance or mathematical anonymity.
- The extension separately uploads account-linked attention data, including creator page URLs.
- Offline verification can't revoke an issued token straight away after cancellation or account closure.
  It stops working when it expires.

### Why hostnames are an allowlist

`hostnames` is required, and `verify()` won't fall back to whatever arrived in the `Host` header. Tokens are
bound to a hostname, and the client sets `Host`. Without the allowlist, an attacker could bind a token to a
domain they control, send it with `Host: that-domain.example`, and be admitted as a subscriber. Listing your
hosts removes that possibility.

`www.example.com` and `example.com` are different hosts, but listing either admits both. They're the same
domain under one owner, so a site serving both needs only one in the list. The signature is still checked
against the exact host each request arrives on.

---

## Performance

Measured on Bun 1.4, Apple Silicon, single core, via `bun run benchmarks/verify.ts`:

|                               |                                                     |
| :---------------------------- | :-------------------------------------------------- |
| Cold verification, end to end | 78µs, about 12,900/s                                |
| Cached verdict                | 0.16µs, about 6,200,000/s                           |
| Malformed token               | 0.7µs, rejected on length before it's decoded       |

Where available, it uses `node:crypto`'s synchronous verify. That's faster than the libuv threadpool
(36.7µs against 46.0µs) and faster than WebCrypto (47.3µs). Work this short doesn't benefit from leaving
the main thread. WebCrypto is the fallback, so edge runtimes work too.

---

## Runtimes

|                                        |      |               |
| :------------------------------------- | :--- | :------------ |
| Node.js                                | 16+  | ESM and CJS   |
| Bun                                    | 1.1+ | ESM and CJS   |
| Deno                                   | 2.0+ | ESM           |
| Edge (Cloudflare Workers, Vercel Edge) | -    | via WebCrypto |

---

## Troubleshooting

**Every visitor comes back `missing`.** That's expected: only subscribers send a token. Check that
`Better-Web-Publisher` appears on your responses, then test with **Test in your browser**.

**A test subscriber comes back `missing`.** Reload after the first visit. Then check that your CDN or proxy
forwards `Better-Web-Token`, and doesn't serve a cached page.

**`unknown_hostname`.** The host isn't in `hostnames`. The `www`/apex sibling of a listed host counts as
listed. Log `visitor.hostname` to see what arrived; a reverse proxy may pass something unexpected.

**`wrong_hostname` from real visitors.** Apex and `www` share allowlist coverage, but their signatures are
different. A token for `example.com` can't verify against `www.example.com`. Pass the actual public hostname,
and check for proxy rewrites. A modified or replayed token can also cause this.

**`forged` for everybody.** A `publicKey` override left over from staging.

**It got slower under load.** Check `publisher.cacheStats()`. A high `evictions` count, with `size` at
`maxSize`, means the working set outgrew the cache. Raise `maxSize`.

---

## License

Apache-2.0
