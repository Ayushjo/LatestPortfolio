---
lede: >-
  Strata is an embedded LSM-tree key-value store in Rust, built on the same principles as RocksDB
  and LevelDB: a write-ahead log for crash safety, immutable SSTables for reads, Bloom filters to
  skip files, and size-tiered compaction to keep reads bounded. It's a library: open, put, get,
  delete, flush, compact, close.
problem: >-
  An LSM tree turns random writes into sequential I/O, which makes writes very fast. The price is
  paid on reads, which may have to search several layers. Building one from the log up is the most
  direct way to see where that cost goes and how far Bloom filters and compaction bring it back.
flow:
  - name: Write-ahead log
    detail: >-
      Every write is appended to a CRC-checked log first, with a configurable fsync policy: every
      write, every N writes, or off.
  - name: Memtable
    detail: A sorted in-memory map with its size tracked. When it fills, it's frozen and a new one takes over.
  - name: Background flush
    detail: >-
      A background thread writes the frozen memtable as an SSTable: written to a temporary file,
      then renamed into place so it appears all at once.
  - name: SSTables
    detail: >-
      Block-based files with an index block, a Bloom filter and CRC-checked data blocks, read
      through mmap.
  - name: Manifest
    detail: A log plus snapshot that records which SSTables make up the database.
  - name: Compaction
    detail: >-
      Size-tiered: SSTables of similar size are merged with a k-way heap merge, triggered
      automatically after a flush.
decisions:
  - title: Drop the WAL only after the data is safe elsewhere
    why: >-
      The log is rotated only after the SSTable and the manifest have both been fsynced, so there is
      never a moment when the only copy of a write has been deleted.
  - title: Make durability a setting
    why: >-
      Fsync on every write is the D in ACID and costs about 250 writes a second. Batching fsyncs
      trades a small window of possible loss for throughput, the same knob production WALs expose.
      Strata measures every point on that curve.
  - title: Size-tiered compaction, not leveled
    why: >-
      It's simple, good for write-heavy work, and easy to reason about and prove correct. The cost
      is that it doesn't bound space amplification, which is listed as a known gap.
  - title: Keep tombstones until a full compaction
    why: >-
      A partial compaction can't drop a delete marker, because an older SSTable outside the merge
      may still hold the value it deletes.
  - title: One writer, many readers, one background thread
    why: >-
      Writes take &mut Engine, readers run concurrently, and shared state is behind one brief
      mutex. That keeps lock contention small and the model easy to reason about.
numbers:
  - value: 1.87M/s
    label: Writes, fsync off
    note: Single thread, 100-byte values, in-process on macOS (APFS).
  - value: 252/s
    label: Writes, fsync on every write
    note: 2,455/s fsyncing every 10 writes; 21,488/s every 100.
  - value: 24×
    label: Faster lookups for absent keys
    note: Bloom filter on, 0.24 µs vs 5.84 µs.
  - value: 15.3 → 5.4 µs
    label: Present key in the oldest of 20 SSTables
    note: Bloom off vs on. With one SSTable, the filter adds a little cost instead.
  - value: ~4.4×
    label: Sequential writes vs sled
    note: ~1.15M vs ~261K writes/s. sled is faster on point reads (~194 ns vs ~1.8 µs), so it's not a universal win.
  - value: 46/46
    label: Correctness and crash-recovery tests
    note: Crash recovery runs a helper binary that is killed mid-write.
stack:
  - memmap2
  - crc32fast
  - crossbeam-channel
  - parking_lot
  - criterion
status: >-
  All latencies are hot page-cache, in-process numbers; they don't simulate cold-disk misses. Not
  built yet: leveled compaction, a block cache, range scans, snapshots, compression.
sources:
  - label: Source code
    href: https://github.com/Ayushjo/Strata
  - label: Benchmark summary
    href: https://github.com/Ayushjo/Strata/blob/main/benchmarks/results/summary.txt
---

Most of Strata is about one promise: once `put` returns, the write survives a crash. Every design
choice follows from where that promise could break. The log has to be fsynced before the write is
acknowledged. An SSTable has to appear all at once, so it's written to a temporary file and
renamed. The log can't be deleted until the SSTable that replaced it is safely on disk.

Recovery replays the log on open. A torn final record (the process died mid-append) is treated as
the end of the log. A checksum mismatch anywhere else is reported as corruption instead of being
quietly skipped.

The benchmarks are there to make the trade-offs concrete instead of quoting them. Turning fsync off
is about 7,400× faster than fsyncing every write, which is why the policy is configurable. Bloom
filters are slightly slower when there's only one file to check, but take a lookup in the oldest of
twenty files from 15.3 µs to 5.4 µs, and make lookups for keys that don't exist 24× faster.

The comparison with sled is reported in both directions. Strata writes sequential keys about 4.4×
faster; sled answers point reads faster.
