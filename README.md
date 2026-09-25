# @zeroad.network/token

Verify [Zero Ad Network](https://zeroad.network) subscriber tokens in your backend. Offline, in about
80us cold and 0.16us cached, with no dependencies and no calls back to us.

```bash
npm install @zeroad.network/token
```

---

## The thirty second version

Zero Ad Network subscribers pay a monthly fee and install a browser extension. When one of them visits
a recognized website, the extension attaches a cryptographically signed token to eligible requests.
You verify it locally, and if it checks out, serve a clean page without ads, non-essential third-party trackers, cookie consent screens,
or marketing popups, including newsletter signup prompts. If you sell access, grant your base subscription
or a custom level that unlocks paid content or functionality. Higher tiers may remain restricted.

Earnings are calculated monthly from funded subscriber attention and allocation preferences. Publishers share
70% of received revenue after processing fees and excluding tax; the platform retains 30%. Transfers to
Stripe Express require a $30 accumulated balance and completed, eligible payout setup. Smaller balances
carry forward. A Stripe transfer is separate from a bank withdrawal.
See [how earnings work](https://zeroad.network/docs/monetization).

The SDK verifies membership; your application decides which content belongs to that included access level.
A subscriber token does not grant site administration, prove a purchase, or replace private-content permissions.
An already clean, unrestricted site only needs to announce its Publisher ID.

Two headers, and this package handles both ends:

| Direction      | Header                 | Carries                                         |
| :------------- | :--------------------- | :---------------------------------------------- |
| You -> visitor | `Better-Web-Publisher` | your publisher ID, so the visit can be credited |
| Visitor -> you | `Better-Web-Token`     | their signed, hostname-bound membership token   |

---

## Integrate

### 1. Register

[Sign up](https://zeroad.network/login) and copy your account’s **Publisher ID**.

You do not need a paid subscription or separate registration for each site. Announce the same ID on
all your properties. Accepted subscriber activity creates an observed integration after upload and
processing. You can also add and verify a website from your dashboard, then use **Test in your browser**.
Test access earns nothing.

### 2. Create a publisher

```ts
import { createPublisher } from "@zeroad.network/token"

export const publisher = createPublisher({
  publisherId: process.env.ZERO_AD_PUBLISHER_ID,
  hostnames: "example.com", // covers www.example.com too; pass a string[] for other hosts
})
```

`hostnames` is every host you serve. It is required, and it matters - see
[why hostnames are a whitelist](#why-hostnames-are-a-whitelist). Listing an apex covers its `www`
(and vice versa), so `["example.com"]` already admits `www.example.com`.

### 3. Wire up one middleware

```ts
app.use(async (request, response, next) => {
  response.set(...publisher.header)

  response.locals.visitor = await publisher.verify(request.get(publisher.tokenHeaderName), request.get("host"))

  next()
})
```

### 4. Branch on it

```ts
if (response.locals.visitor.subscriber) {
  // Remove ads and interruptions; grant your included content access.
}
```

Apply that decision in your rendering and access rules, and configure page caches as described below.
Copy-paste Hono and Express middleware, and the rest of the publisher
guide, live at [zeroad.network/docs/site-integration/remove-ads/node](https://zeroad.network/docs/site-integration/remove-ads/node).

> Set `Better-Web-Publisher` even on pages where you never read a token. It is how the extension
> discovers that your site takes part at all, and how visits get attributed to you.

---

## API

### `createPublisher(options)`

| Option                  | Type                 | Default      |                                                              |
| :---------------------- | :------------------- | :----------- | :----------------------------------------------------------- |
| `publisherId`           | `string`             | -            | From your dashboard. `zapub_` followed by 24 alphanumerics.  |
| `hostnames`             | `string \| string[]` | -            | Every host you serve; an apex covers its `www`. Ports, schemes and paths are stripped. |
| `publicKey`             | `string`             | platform key | Override for staging and tests. Leave alone in production.   |
| `clockToleranceSeconds` | `number`             | `60`         | Slack on expiry, for servers whose clocks drift.             |
| `cache`                 | `boolean \| object`  | on           | See [caching](#caching).                                     |

Returns an object you keep for the life of the process:

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

Takes the raw header value - `string`, `string[]` (Node hands back an array for a repeated header),
`null` or `undefined`. Never throws on bad input; a junk token is a result, not an exception.

Pass the actual request hostname, including when serving both an apex and `www`. Omitting it uses
the single configured hostname; with multiple configured entries, omission throws a configuration
error. A hostname outside the allowlist is rejected.

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

Rejection reasons describe the failed check, not proof of an attack.

| Reason                | Means                                                  | Ordinary?                        |
| :-------------------- | :----------------------------------------------------- | :------------------------------- |
| `missing`             | No token header. Most of your traffic.                 | yes                              |
| `malformed`           | Not a well-formed token.                               | yes                              |
| `unsupported_version` | Unsupported format; check for an SDK update.           | yes, but see below               |
| `expired`             | Expiry field is past the allowed time.                 | yes                              |
| `unknown_hostname`    | The host asked for is not in your whitelist.           | check your config                |
| `wrong_hostname`      | Authority signature passed; hostname signature failed. | check hostname, proxy, or token  |
| `forged`              | Authority signature failed.                            | check authority key or token     |

The first time a token arrives whose version is newer than this package understands, it is rejected as
`unsupported_version` **and** a one-off `console.warn` suggests checking for an SDK update. The warning alone does not prove
that the token is genuine or that a protocol upgrade has shipped. If you would rather not see it - during a staged rollout, or in tests that feed such tokens on
purpose - call `suppressProtocolWarnings()` once at startup.

### Also exported

`PLAN`, `PLAN_NAME`, `REJECTED`, `PUBLISHER_HEADER`, `PUBLISHER_ID_SCHEME`, `TOKEN_HEADER`,
`TOKEN_HEADER_LOWERCASE`, `AUTHORITY_PUBLIC_KEY`, `PROTOCOL_VERSION`, `TOKEN_BYTES`, `TOKEN_CHARACTERS`,
`DEFAULT_CACHE_OPTIONS`, `canonicalHostname()`, `encodePublisherHeader()`, `parsePublisherHeader()`,
`suppressProtocolWarnings()`, and the `VerificationResult`, `SubscriberResult`, `NonSubscriberResult`,
`Plan`, `Rejected`, `CacheOptions`, `CacheStats`, `Publisher`, `PublisherOptions` types.

This package **only verifies**. The platform’s private authority key signs credentials; the extension’s
private ephemeral keys bind those credentials to hostnames. Neither key is included in a visitor token.

---

## Discovery and page caching

The first request to an unfamiliar site may have no token: the extension discovers your ID from the
response or loaded page. Reload after recognition. Production injection covers HTTPS main-frame and
media requests for the exact recognized hostname, not arbitrary fetch/XHR or subdomains.

Forward `Better-Web-Token` and preserve the public request hostname through proxies. Configure every
CDN, proxy, and page cache to bypass both lookup and storage for token-bearing requests, and return
private, non-cacheable subscriber responses. Header presence alone must never grant access. Test the
same URL with and without a valid token while caches are warm. The SDK’s result cache below caches
verification decisions, not HTML.

## Caching

The extension reuses a token for its bound hostname while that credential remains valid, so a returning
visitor may send bytes you have already checked. Caching avoids repeating the signature checks; see
the benchmark results below. It is on by default and there is rarely a reason to touch it.

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

Three things it does that are worth knowing about:

**Failures are cached too.** A forged token costs exactly as much to reject as a real one costs to
accept, and whoever sends it is likely to send it again. This is safe because, for a fixed public key,
a rejection can never later become an acceptance - the only direction a verdict moves is valid to
expired, which each entry's own expiry already handles.

**A success never outlives the token.** The stored expiry is the earlier of your TTL and the token's
own `expiresAt`, so a generous TTL cannot extend anybody's subscription.

**Cheap rejections are not cached.** A malformed token is thrown out by a length check in about a
microsecond. Caching those would save nothing and would hand anyone who can send a request an easy way
to fill your memory with distinct keys.

Entries are evicted least-used-first, with the oldest breaking ties, and expired ones are swept as
writes accumulate rather than on a timer - an idle process stays idle.

---

## How the token works

You do not need this to integrate. You may want it before you trust it.

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

**The platform signs batch credentials.** The extension checks its pool hourly and refreshes when
credentials run low or approach expiry. It generates disposable keypairs locally and sends only the
public halves to the platform. The platform checks account entitlement and signs the plan, expiry, and
each key. Standard credentials expire at midnight UTC two days after issuance, about 24–48 hours later.
Demo and publisher-test access use separately issued, hostname-restricted tokens.

**The extension binds one to your hostname.** Offline, with no network call, the first time it meets
`example.com` it takes an unused keypair and signs your hostname with the private half. It reuses that
bound token for eligible requests to that exact hostname while it remains valid.

**You verify both signatures.** The first proves the platform authorized the credential’s plan and expiry.
The second proves it was bound to _your_ hostname.

The hostname is deliberately absent from the wire. Your server already knows what it serves and
rebuilds the signed message from that, so there is nothing to parse or compare - a token bound
elsewhere simply fails the signature.

### What this stops

The token you receive contains a **public** key and a signature over **your own** hostname. The secret
that mints bindings never leaves the visitor's browser.

- You cannot present a visitor's token at another site. You would need a signature over that site's
  hostname, and you do not have the key.
- Nobody can edit the plan or push out the expiry. Both are covered by the platform signature.
- Nobody can create a valid authority credential without the platform’s private key.

Tokens contain no account ID, name, or email. Reuse permits same-host correlation and replay during
validity. Issuance is authenticated, so the platform sees which account requests each public key; this
is not blind issuance or mathematical anonymity. The extension separately uploads account-linked
attention data, including creator page URLs. Offline verification cannot immediately revoke an issued
token after cancellation or account closure.

### Why hostnames are a whitelist

`hostnames` is required, and `verify()` will not fall back to whatever arrived in the `Host` header,
because tokens are bound to a hostname and `Host` is set by the client. Without the whitelist an
attacker could bind a token to a domain they control, send it with `Host: that-domain.example`, and be
admitted as a subscriber. Listing your hosts removes the possibility.

`www.example.com` and `example.com` are technically different hosts, but listing either admits both -
they are the same domain under one owner - so a site that serves both needs only one of them in the
list. The signature is still checked against the exact host each request arrives on.

---

## Performance

Measured on Bun 1.4, Apple Silicon, single core, via `bun run benchmarks/verify.ts`:

|                               |                                                     |
| :---------------------------- | :-------------------------------------------------- |
| Cold verification, end to end | 78us, about 12,900/s                                |
| Cached verdict                | 0.16us, about 6,200,000/s                           |
| Malformed token               | 0.7us, rejected on length before it is decoded      |

`node:crypto`'s synchronous verify is used where available. It is faster than dispatching to the
libuv threadpool (36.7us against 46.0us) and faster than WebCrypto (47.3us), and work that short does
not benefit from leaving the main thread. WebCrypto is the fallback, so edge runtimes work too.

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

**Every visitor comes back `missing`.** Expected - only subscribers send a token. Confirm the pipe
works by checking `Better-Web-Publisher` appears on your responses (`curl -sI https://your-site`).

**`unknown_hostname`.** The host being verified is not in `hostnames` (the `www`/apex sibling of a
listed host counts as listed). Log `visitor.hostname` to see what actually arrived; a reverse proxy
may be passing something you did not expect.

**`wrong_hostname` from real visitors.** Apex and `www` share allowlist coverage, but their signatures
are distinct. Pass the actual public request hostname and check proxy rewrites. A token for
`example.com` cannot verify against `www.example.com`. An invalid hostname signature can also reflect
a modified or replayed token.

**`forged` for everybody.** A `publicKey` override left over from staging.

**It got slower under load.** Check `publisher.cacheStats()`. A high `evictions` count against `size`
at `maxSize` means the working set outgrew the cache - raise `maxSize`.

---

## License

Apache-2.0
