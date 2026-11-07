---
lede: >-
  BelieveMeGuys is a crypto copy-trading platform. You connect your own exchange account with a
  trade-only API key, choose a verified leader from a leaderboard ranked by real fills, and every
  fill the leader makes is copied into your account, sized to your settings and stopped by a daily
  loss cap you set. Your money never leaves your exchange account. It's a TypeScript monorepo: a
  Next.js web app and a separate copy engine that does nothing but trade.
problem: >-
  Following a trader you trust usually means watching them and copying by hand, always late, or
  handing your money to someone else. BelieveMeGuys copies their trades as they happen while you
  keep custody: it can place trades on your account but can never withdraw. And because it moves
  real money, a copy must never be placed twice and must never be silently missed.
role: Solo
flow:
  - name: Watch the leaders
    detail: >-
      Every 5 s the engine syncs which leaders are verified and have at least one active follower.
      For each, it holds an authenticated WebSocket to Delta Exchange on that account's private
      trades channel, with heartbeats, an idle watchdog and reconnects in about 1.5 s.
  - name: Ingest the fill, once
    detail: >-
      Each leader fill is written to Postgres. A unique constraint on the leader plus the exchange's
      fill ID makes ingestion idempotent, so a replayed or duplicated message changes nothing.
  - name: Size it for every follower
    detail: >-
      For each active follow, the copy is sized by the follower's mode (proportional to equity,
      fixed margin, or a multiplier), then checked against their max position and daily loss cap.
  - name: Place it, exactly once
    detail: >-
      Every copy gets a deterministic client order ID that is unique in the database, so a retry or
      a second engine can never place it twice. The market order goes to the follower's own
      account, signed with their trade-only key.
  - name: Recover what was missed
    detail: >-
      After any reconnect the engine replays recent fills, and a reconcile loop runs every 30 s, so a
      dropped connection never means a dropped copy.
  - name: Show it live
    detail: >-
      The dashboard updates over Server-Sent Events. Followers can pause (keep settings, skip new
      fills) or stop (end the copy without closing open positions).
decisions:
  - title: The engine is its own service
    why: >-
      Trade execution never shares a process with web traffic. The Next.js app serves the site and
      the API; a long-running Node process does nothing but watch fills and place orders.
  - title: No message queue, on purpose
    why: >-
      The engine fans out in-process, and Postgres does the coordination. Unique constraints on fill
      IDs and client order IDs make every step safe to retry, which is the guarantee a queue would
      have been there to provide, with one less system to run.
  - title: Never hold the money
    why: >-
      Followers connect keys that can trade but not withdraw, and orders go into their own account.
      The platform never has custody, so there's nothing to take even if it were compromised.
  - title: Keys encrypted, and connected only once
    why: >-
      API secrets are encrypted at rest with AES-256-GCM and a random IV per key. An HMAC fingerprint
      blocks connecting the same key twice, and the exchange account's ID blocks connecting the same
      account through a second key.
  - title: Exchange-agnostic from day one
    why: >-
      A shared package defines one Exchange interface (verify, account, positions, fills, place
      order, mark price, fill stream) and resolves instruments to a canonical form. Delta Exchange
      India is the live implementation; the next venue is one more adapter.
  - title: Fail closed
    why: >-
      A global kill switch and a maintenance mode can stop copying everywhere. If a leader's key is
      rejected, their follows pause automatically and followers are notified. Stopping a copy never
      closes a position on its own.
numbers:
  - value: ~1.5 s
    label: From the leader's fill to the copy filling
    note: >-
      Measured in production on a real ETH copy, from database timestamps: the engine seeing the
      leader's fill through to the follower's order filling (1.47 s).
  - value: 0.43 s
    label: Copy order sent to filled
    note: Same trade.
  - value: 30 s
    label: Reconcile loop
    note: Plus a replay of recent fills on every reconnect.
  - value: '0'
    label: Withdrawal permissions held
  - value: '18'
    label: Tables in the shared Prisma schema
  - value: $10
    label: Minimum per copy
stack:
  - React 19
  - Tailwind CSS v4
  - Neon
  - Prisma
  - better-auth
  - Server-Sent Events
  - AES-256-GCM
  - Railway
  - Cloudflare R2
  - Resend
  - Redis (optional cache)
  - pnpm monorepo
  - Vitest
status: >-
  Live on Delta Exchange India, in USDT and INR. Copy-trading is high risk and nothing here is
  investment advice.
sources:
  - label: believemeguys.com
    href: https://www.believemeguys.com
  - label: Verified leaders
    href: https://www.believemeguys.com/leaders
  - label: Privacy policy
    href: https://www.believemeguys.com/privacy
---

Copy trading is a timing problem with money attached. A leader's fill is only useful to a follower
if the copy arrives while the price is still close. In production, a real copy filled about 1.5
seconds after the leader's: the engine saw the fill, sized it, checked the follower's limits and
placed the order, and the exchange filled it 0.43 s after it was sent.

The harder problem is correctness, because the failure modes cost real money. A WebSocket that
drops can miss a fill. A retry can place an order twice. The usual fix is a message queue; here
the guarantee comes from the database instead. A fill can only be recorded once, because its
exchange ID is unique. A copy can only be placed once, because its client order ID is derived from
the fill and the follower, and is unique too. With both of those in place, the engine can replay
and reconcile as often as it likes, and that's exactly what it does: after every reconnect, and
every 30 seconds.

Early on, the fill socket dropped every ten minutes. It now runs on heartbeats and an idle
watchdog, reconnects in about a second and a half, and replays what it missed.

Everything else follows from the platform not being trusted with more than it needs: keys that
can't withdraw, secrets encrypted at rest, a key or exchange account that can only be connected
once, and a kill switch that stops everything. I built it solo, from the exchange adapter to the
dashboard.
