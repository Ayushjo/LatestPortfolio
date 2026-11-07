---
lede: >-
  BelieveMeGuys is a crypto copy-trading platform. You connect your own exchange account with a
  trade-only API key, choose a verified leader from a leaderboard ranked by real fills, and every
  fill the leader makes is mirrored into your account in under a second, sized to your settings
  and stopped by a daily loss cap you set. Your money never leaves your exchange account.
problem: >-
  Following a trader you trust usually means either watching them and copying by hand, always
  late, or handing your money to someone else. BelieveMeGuys copies their trades as they happen
  while you keep custody: the platform can place trades on your account but can never withdraw.
role: Solo
flow:
  - name: Connect
    detail: >-
      Link an exchange account with a trade-only API key that has withdrawals disabled. It takes
      about two minutes. Keys are encrypted at rest with AES-256-GCM and never shown again.
  - name: Choose a leader
    detail: Pick from a leaderboard of verified leaders, ranked by real fills.
  - name: Set size and risk
    detail: >-
      Fixed, proportional or multiplied sizing (a leader trading 1.0 can become 0.25 for you), and
      a daily loss cap that the engine enforces.
  - name: Mirror in real time
    detail: >-
      When the leader's order fills, the engine sizes it for each follower, checks their risk
      limits, and places it on their exchange with their own trade-only key.
  - name: Watch, pause, stop
    detail: >-
      A live dashboard shows every copy. Pause keeps your settings and skips new fills; Stop ends
      the copy and never closes open positions on its own. An admin kill switch can halt copying
      everywhere.
decisions:
  - title: Never hold the money
    why: >-
      Followers keep their funds on their own exchange account and connect with a key that can trade
      but not withdraw. The platform never has custody, so there's nothing to withdraw even if it
      were compromised.
  - title: Encrypt keys at rest, show them once
    why: >-
      API secrets are encrypted with AES-256-GCM and never displayed again after you enter them.
  - title: Risk is enforced by the engine, not the follower's attention
    why: >-
      The daily loss cap is checked by the engine before each mirrored order, so it holds even when
      the follower isn't watching.
  - title: Stopping never closes positions
    why: >-
      Ending a copy only stops new trades. Closing an open position is a decision with a price, so
      it's left to the follower.
numbers:
  - value: <1 s
    label: To mirror a leader's fill
  - value: $10
    label: Minimum per copy
  - value: '0'
    label: Withdrawal permissions held
  - value: '2025'
    label: Engine live on Delta Exchange India
    note: The verified leaderboard launched in 2026.
stack:
  - AES-256-GCM
  - Resend
status: >-
  Live on Delta Exchange India, in USDT and INR. Binance, Bybit and CoinSwitch are next.
  Copy-trading is high risk and nothing here is investment advice.
sources:
  - label: believemeguys.com
    href: https://www.believemeguys.com
  - label: Verified leaders
    href: https://www.believemeguys.com/leaders
  - label: Privacy policy
    href: https://www.believemeguys.com/privacy
---

Copy trading is a timing problem with money attached. A leader's fill is only useful to a follower
if it arrives while the price is still close, so the engine's job is to see the fill, size it for
every follower, check each follower's limits, and place each order on that follower's exchange,
all within a second.

The harder design work is about what the platform is not allowed to do. It never holds anyone's
funds: followers connect with keys that can trade but not withdraw, and the keys are encrypted at
rest. A follower's daily loss cap is enforced by the engine itself, not left to an alert they
might miss. Stopping a copy never closes a position on its own, because that's a decision with a
price.

I built the platform solo: the mirroring engine, the leaderboard, the follower dashboard and the
admin controls. It's been live on Delta Exchange India since 2025.
