---
lede: >-
  freedisk.space (DiskMap inside the code) is a free, open-source disk space analyzer for Mac and
  Windows. It shows what's filling your disk, explains what each thing is, and frees space without
  the fear of losing something. Every cleanup is reviewed first and goes to the Trash. No account,
  works offline, and the scan never leaves your computer. It ships as a native SwiftUI app for
  Mac, a native WPF app for Windows, and a read-only command-line tool.
problem: >-
  Disk analyzers are either slow, or quick to delete things you didn't mean to, or both. On a
  developer's machine the space hides in places most people don't recognise: Xcode, simulators,
  node_modules, Python environments, Docker and package caches. The goal was to match the best paid
  tools feature for feature, then go further where open source has the advantage.
role: Mac app & core; Windows app with Fahmin
flow:
  - name: Bulk scan
    detail: >-
      Up to 8 parallel workers walk the volume with getattrlistbulk, which returns a page of names,
      types, sizes and dates in one system call. iCloud placeholders are recorded but never opened,
      and symlinks are never followed.
  - name: A compact tree
    detail: >-
      A single publisher thread owns the tree: a struct-of-arrays indexed by 32-bit integers, with
      every name packed into one UTF-8 blob instead of millions of strings.
  - name: Roll up
    detail: >-
      One pass fills both the logical and the allocated size of every folder, in about 30 ms for a
      home folder.
  - name: Analyse
    detail: >-
      Developer-storage catalogs, duplicate finding (a 64 KB partial hash first, then a streamed
      SHA-256), APFS clone detection, and layouts like a squarified treemap and a sunburst.
  - name: Explore
    detail: >-
      Overview, a map, rings and a list to drill down, a cleanup view, a developer view, history,
      and ⌘K to find anything.
  - name: Review, then Trash
    detail: >-
      Everything you remove goes through one cleanup queue: stage it, review it, move it to the
      Trash, put it back if you change your mind. Protected locations can't be queued at all.
decisions:
  - title: A struct-of-arrays tree, not a class per file
    why: >-
      A class per file costs 48+ bytes of object overhead before its data, and each string is its own
      allocation. At a few million files that is gigabytes of overhead. The packed tree measures
      38 bytes a node: 62 MB for 1.64M nodes.
  - title: getattrlistbulk instead of FileManager
    why: >-
      The first home scan took 373 s, because it made one URL and one resourceValues call per file.
      One bulk call per page of entries brought the same scan to 7.3 s.
  - title: Eight workers, decided by A/B runs
    why: >-
      On ~1.8M items, 8 workers had a 6.0 s median, 4 workers 8.9 s, and 12 workers got slower
      again at 9.9 s from contention. A 4 MB buffer beat 1 MB (6.2 s vs 9.7 s). Two other ideas,
      handing off file descriptors and sharding the publisher, were tested and dropped.
  - title: Never download iCloud files to measure them
    why: >-
      A folder that only exists in iCloud is recorded but not opened, because listing it would make
      macOS download it. Scanning a disk shouldn't fill it.
  - title: Find APFS clones the hard way
    why: >-
      Apple has no API for "is this a clone of that". Clones have different inodes but share
      storage, so DiskMap compares the physical extents (fcntl F_LOG2PHYS) to avoid calling two
      clones duplicates and promising space you won't get back.
  - title: Trash only, no network
    why: >-
      Removal goes through one queue to the Trash, and the app makes no network requests except an
      update check you have to opt in to. Every change to the code has to keep both rules.
numbers:
  - value: 7.3 s
    label: Home folder scan, 1,791,180 items
    note: >-
      Release build on a MacBook Air. Run-to-run variance is real: other sessions measured medians
      from 5.9 s to 10.5 s.
  - value: ~55×
    label: Faster walk
    note: About 245,000 items/s with getattrlistbulk, versus about 4,400/s with the FileManager enumerator.
  - value: 38 B
    label: Memory per node in the tree
  - value: ~9 s
    label: Windows, 8M items
    note: Reading the raw $MFT on a 1 TB NVMe drive, elevated. Without admin rights the walk takes 70–200 s.
  - value: 0.33 s
    label: Duplicates in ~/Downloads
    note: 23,724 items, 281 groups, about 140 MB peak memory.
  - value: 0 B
    label: Data sent anywhere
    note: Scans stay on the machine. The only network call is an opt-in update check.
stack:
  - Swift Package
  - Sparkle
  - .NET 10
  - xUnit
status: >-
  Shipping for Mac and Windows (v0.4.1, October 2026). The Mac app isn't notarized and the Windows
  build isn't code-signed yet.
sources:
  - label: freedisk.space
    href: https://www.freedisk.space
  - label: Source code
    href: https://github.com/Ayushjo/freediskspace
  - label: Releases
    href: https://github.com/Ayushjo/freediskspace/releases
---

The first version scanned my home folder in **373 seconds**. The reason: for every one
of 1.8 million files, the scanner built a URL object and asked for its attributes separately. Most
of the time went into that overhead, not into reading the disk.

`getattrlistbulk` returns a whole page of entries per system call. Rewriting the walk around it,
then tuning worker count and buffer size with repeated A/B runs, brought the scan to **7.3 seconds**.
The performance notes record every run with its minimum, median and maximum, because a single run
on a laptop proves very little.

Memory needed the same treatment. A class per file is fine for a thousand files and costs
gigabytes at two million, so the tree became parallel arrays of integers with every name packed
into one buffer.

The rest of the work is about trust. A disk cleaner earns it by never surprising you: nothing is
deleted directly, iCloud files are never downloaded just to measure them, and two APFS clones are
never shown as duplicates.

Windows came next, built together with my collaborator Fahmin. It uses the approach WizTree made
famous: read the NTFS master file table directly, then use the change journal to make rescans
cheap. Snapshots use the same file format on both platforms, so a Mac and a Windows scan can be
compared.
