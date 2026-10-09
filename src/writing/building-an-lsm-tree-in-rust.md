---
title: Building an LSM-tree from scratch in Rust
date: 2026-10-09
summary: What I learned writing Strata — a write-ahead log, a memtable, SSTables, Bloom filters and compaction — and the numbers that surprised me.
tags: [rust, storage, databases]
draft: true
---

> **Draft outline.** Everything below is a scaffold with Strata's real benchmark numbers. Rewrite it in your own voice, then set `draft: false` to publish.

## Why write a storage engine at all

- What I wanted to understand that using RocksDB never taught me.
- The shape of an LSM-tree in one sentence: writes are cheap because you never update in place.

## The write path: WAL → memtable

- Every write is appended to the write-ahead log first, so a crash never loses an acknowledged write.
- The memtable is a sorted in-memory map; when it fills up, it is frozen and flushed.

```rust
pub struct Memtable {
    entries: BTreeMap<Vec<u8>, Option<Vec<u8>>>, // None = tombstone
    approx_bytes: usize,
}
```

- **The fsync trade-off:** 252 durable writes/sec with an fsync on every write, versus 1.87M writes/sec with fsync off. Explain why, and where batching sits in between.

## SSTables and the read path

- Block-based, mmap-backed SSTables; an index block per file.
- Reads check the memtable, then SSTables newest to oldest — which is why absent keys are the worst case.

## Bloom filters: the 24× moment

- With 20 SSTables, a read dropped from 15.3 µs to 5.37 µs.
- Absent-key lookups got ~24× faster, because most files can be ruled out without touching disk.

## Compaction

- Size-tiered compaction: merging similar-sized tables, dropping overwritten values and tombstones.
- What goes wrong if compaction falls behind.

## Testing a database

- 46/46 correctness and crash-recovery tests: how to simulate a crash mid-write.
- Benchmarks with Criterion, and comparing against sled (~4.4× faster on sequential writes).

## What I'd do next

- Leveled compaction, a block cache, concurrent readers.
