---
lede: >-
  Relay is an async reverse proxy and API gateway written in Rust on tokio, axum and hyper. It
  routes traffic to healthy backends with pluggable load balancing, limits each client with a token
  bucket, streams bodies without buffering them, and reports what it's doing through structured
  logs, Prometheus metrics and a small admin API.
problem: >-
  A gateway does three things on every request: decide who the client is, decide whether they're
  allowed, and pick a healthy backend. Any of those can add a lock or a buffer to the hot path. The
  question behind Relay was how close a small gateway written from scratch can get to nginx if none
  of the three adds per-request contention.
flow:
  - name: Identify the client
    detail: X-API-Key if present, then X-Forwarded-For, then the peer IP address.
  - name: Rate-limit
    detail: >-
      A token bucket per client in a sharded DashMap. Over the limit, the client gets 429 with a
      Retry-After header. A background task evicts idle buckets.
  - name: Pick a backend
    detail: >-
      Load a snapshot of the healthy pool through ArcSwap, then ask the LoadBalancer trait:
      round-robin or least-connections.
  - name: Stream the proxy
    detail: >-
      The request body is handed to a pooled hyper client as it arrives, and the upstream response
      streams back the same way. Neither is ever held whole in memory.
  - name: Record it
    detail: >-
      A tracing span per request (client, method, path, backend, status, latency, whether it was
      rate-limited) and atomic counters exported as Prometheus text.
  - name: Keep the pool honest
    detail: >-
      A separate task probes every backend's health path with a 500 ms timeout. After N consecutive
      failures a backend is marked down and the snapshot is rebuilt.
decisions:
  - title: No write lock per request
    why: >-
      Health is a per-backend atomic flag, and routing reads an ArcSwap snapshot that is rebuilt
      only when membership changes. Requests never wait on a lock to find a backend.
  - title: Sharded rate limiting
    why: >-
      The limiter runs on every single request, so it can't sit behind one global mutex. A sharded
      map means two clients almost never contend.
  - title: Count connections on the body, not the headers
    why: >-
      Least-connections holds an RAII guard on the response body stream, so the count reflects
      requests still streaming, not just the time to the first byte. That's what keeps traffic off a
      slow backend.
  - title: Stream instead of buffer
    why: >-
      Bodies are passed straight between axum and hyper without being collected, so memory per
      request stays flat however large the payload is.
numbers:
  - value: ~70k
    label: Requests per second
    note: Within about 1% of an nginx round-robin baseline at matched concurrency. Measured locally with oha.
  - value: ~5 ms
    label: p99 latency
    note: Same local run.
  - value: ~54 ns
    label: Per rate-limit check
    note: Criterion benchmark of the limiter.
  - value: 33% → 2%
    label: Traffic sent to a slow backend
    note: Round-robin versus least-connections, with one deliberately slow mock backend (100 ms per response).
  - value: '0'
    label: Wrong rejections over 75k requests
    note: Rate limiter under load.
  - value: '13'
    label: Unit and integration tests
stack:
  - DashMap
  - ArcSwap
  - tracing
  - Prometheus
  - criterion
status: >-
  Benchmarks were run locally; the harness (concurrency 10 to 1,000 for 30 s each) is in the repo.
  Next: TLS termination, HTTP/2 and gRPC upstreams, and rate limiting shared through Redis.
sources:
  - label: Source code
    href: https://github.com/Ayushjo/Relay
  - label: Architecture notes
    href: https://github.com/Ayushjo/Relay/blob/main/docs/ARCHITECTURE.md
---

Relay is small on purpose. The interesting part of a gateway isn't the routing table; it's what
happens on the path every request takes, and how much of that path is shared between requests.

Each step on that path was designed so that requests don't wait on each other. Finding a backend
reads an atomically swapped snapshot. Rate limiting touches one shard of a map, not a global lock.
Counting connections happens on the response stream, so the least-connections balancer sees a slow
backend as busy for as long as it really is. Against a backend that sleeps 100 ms, that one choice
moved its share of traffic from about a third to about 2%.

The benchmark harness sweeps concurrency from 10 to 1,000 connections, 30 seconds each, with oha or
wrk, and plots the results. At matched concurrency Relay came within about a percent of nginx on
my machine. That's a statement about the hot path having nothing in it, not about Relay being a
better nginx.
