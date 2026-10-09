export interface ProjectLink {
  label: string;
  href: string;
}

export interface Stat {
  value: string;
  label: string;
}

export interface Project {
  slug: string;
  name: string;
  /** Featured projects get a full chapter; the rest go in the "More work" grid. */
  tier: 'featured' | 'more';
  /** One-line hook shown under the name. */
  tagline: string;
  summary: string;
  /** Ayush's part, for team projects. */
  role?: string;
  /** Up to three headline numbers, shown big. */
  stats: Stat[];
  /** Full detail lines, used by the Recruiter view. */
  metrics: string[];
  tags: string[];
  links: ProjectLink[];
  demo?: { src: string; poster: string };
}

/** Display order is the order of this array. */
export const projects: Project[] = [
  {
    slug: 'sahaayak',
    name: 'Sahaayak',
    tier: 'featured',
    tagline: 'An AI staff for the small businessman the internet left behind.',
    summary:
      'A shop owner talks in plain Hinglish; an orchestrator routes him to specialist agents that chase payments, watch cash flow and source suppliers — and an agent factory hires new specialists on demand. Nothing goes out without his one-tap approval.',
    role: 'Team lead — backend & AWS platform',
    stats: [
      { value: '4+1', label: 'agents + an agent factory' },
      { value: '14', label: 'DynamoDB tables, serverless' },
      { value: '81', label: 'tests, offline ↔ AWS parity' },
    ],
    metrics: [
      'Orchestrator + 3 specialists + an agent factory (Strands, Bedrock Nova)',
      'Cedar default-deny tool allowlist for every agent',
      'Textract → Titan embeddings document memory',
      'Serverless: Lambda, 14 DynamoDB tables, EventBridge, SES',
    ],
    tags: ['Python', 'FastAPI', 'AWS Bedrock', 'Strands Agents', 'Cedar'],
    links: [
      { label: 'Live', href: 'https://www.sahaayak.space' },
      { label: 'Demo video', href: 'https://youtu.be/4jNoelUtQ9Q' },
    ],
  },
  {
    slug: 'pullwright',
    name: 'Pullwright',
    tier: 'featured',
    tagline: 'Hand it a GitHub issue. Get back a pull request.',
    summary:
      'An autonomous issue-resolution agent: a planner, executor and verifier plan the fix, run tool calls in an isolated Docker sandbox and open the PR end-to-end, while a live dashboard streams every LLM call and tool invocation.',
    stats: [
      { value: '5', label: 'LLM providers, auto-failover' },
      { value: '$0.10', label: 'per-task budget cap' },
      { value: '~7 min', label: 'for a sub-$0.02 fix' },
    ],
    metrics: [
      'Planner / Executor / Verifier agents in isolated Docker sandboxes',
      'Hybrid router across 5 LLM providers with a Redis-backed $0.10 budget guard',
      '6+ autonomous PRs shipped; 8-file fix in ~15 min, sub-$0.02 fix in ~7 min',
    ],
    tags: ['TypeScript', 'Node.js', 'Docker', 'Redis', 'BullMQ', 'Multi-LLM'],
    links: [{ label: 'GitHub', href: 'https://github.com/Ayushjo/MyOwnDevin' }],
  },
  {
    slug: 'diskmap',
    name: 'DiskMap',
    tier: 'featured',
    tagline: 'A native macOS storage analyzer — shipping as freedisk.space.',
    summary:
      'See what fills a disk, follow big folders down to their files, find duplicates and developer junk, and review every cleanup before anything moves to Trash. Nothing leaves the machine. Windows port in progress.',
    stats: [
      { value: '7.3 s', label: 'to scan 1.79M files' },
      { value: '~55×', label: 'faster walk than FileManager' },
      { value: '0 B', label: 'ever leave your Mac' },
    ],
    metrics: [
      '1.79M files scanned in 7.3 s — ~245k items/s',
      '~55× faster walk via getattrlistbulk vs FileManager',
      'APFS clone-aware duplicate detection, squarified treemap',
    ],
    tags: ['Swift', 'SwiftUI', 'AppKit', 'macOS', 'WPF'],
    links: [
      { label: 'freedisk.space', href: 'https://freedisk.space' },
      { label: 'GitHub', href: 'https://github.com/Ayushjo/freediskspace' },
    ],
  },
  {
    slug: 'relay',
    name: 'Relay',
    tier: 'featured',
    tagline: 'A reverse proxy that keeps pace with nginx.',
    summary:
      'An async API gateway in Rust (tokio, axum, hyper) with streaming proxying, health-checked backend pools, least-connections load balancing and sharded per-client token-bucket rate limiting.',
    stats: [
      { value: '~70k', label: 'req/s, within 1% of nginx' },
      { value: '~5 ms', label: 'p99 latency' },
      { value: '54 ns', label: 'per rate-limit check' },
    ],
    metrics: [
      '~70k req/s, ~5 ms p99 — within ~1% of nginx at matched concurrency',
      'Least-connections cut slow-backend traffic from ~33% to ~2%',
      '~54 ns per rate-limit check, zero wrong rejections over 75k requests',
    ],
    tags: ['Rust', 'Tokio', 'Axum', 'Hyper'],
    links: [{ label: 'GitHub', href: 'https://github.com/Ayushjo/Relay' }],
  },
  {
    slug: 'strata',
    name: 'Strata',
    tier: 'featured',
    tagline: 'A storage engine, from the write-ahead log up.',
    summary:
      'A persistent embedded LSM-tree key-value store in Rust — WAL, memtable, mmap-based SSTables, Bloom filters and size-tiered compaction — modelled on RocksDB and LevelDB.',
    stats: [
      { value: '1.87M', label: 'writes/sec (fsync off)' },
      { value: '24×', label: 'faster absent-key lookups' },
      { value: '46/46', label: 'correctness & crash tests' },
    ],
    metrics: [
      '252 durable writes/s (fsync each) up to 1.87M writes/s (fsync off)',
      'Bloom filters cut 20-SSTable reads from 15.3 µs to 5.37 µs; ~24× faster absent-key lookups',
      '~4.4× faster than sled on sequential writes; 46/46 correctness and crash-recovery tests',
    ],
    tags: ['Rust', 'LSM-tree', 'Storage engines'],
    links: [{ label: 'GitHub', href: 'https://github.com/Ayushjo/Strata' }],
  },
  {
    slug: 'believemeguys',
    name: 'BelieveMeGuys',
    tier: 'featured',
    tagline: 'Copy the traders you trust, fill for fill.',
    summary:
      'A crypto copy-trading platform: link your exchange with trade-only keys, follow a verified leader, and every fill is mirrored into your account — sized to your settings and fenced by your daily loss and per-trade risk caps.',
    stats: [
      { value: '<1 s', label: 'to mirror a leader’s fill' },
      { value: '0', label: 'withdrawal permissions held' },
      { value: '$10', label: 'minimum per copy' },
    ],
    metrics: [
      'Real-time engine mirrors leader fills into follower accounts in under a second',
      'Fixed, proportional or multiplied sizing with daily loss and per-trade risk caps',
      'AES-256-GCM at rest, trade-only API keys, admin kill-switch',
    ],
    tags: ['Copy trading', 'Real-time', 'Delta Exchange'],
    links: [{ label: 'Live', href: 'https://www.believemeguys.com' }],
  },
  {
    slug: 'ics-fault-detection',
    name: 'ICS Fault Detection',
    tier: 'more',
    tagline: 'Six agents watching a water plant for attacks.',
    summary: 'A multi-agent AI platform with a real-time WebSocket dashboard over 51 industrial sensor points.',
    stats: [
      { value: '99.83%', label: 'fault detection on SWaT' },
      { value: '51', label: 'sensors, live' },
    ],
    metrics: ['99.83% fault detection accuracy on SWaT (Random Forest)', '6 agents, real-time dashboard over 51 sensors'],
    tags: ['Python', 'Flask', 'React', 'scikit-learn'],
    links: [{ label: 'GitHub', href: 'https://github.com/Ayushjo/ics-minor' }],
  },
  {
    slug: 'learngraph',
    name: 'LearnGraph',
    tier: 'more',
    tagline: 'Chemistry prep that knows what you are about to forget.',
    summary:
      'Adaptive JEE/NEET prep modelled as a Neo4j knowledge graph, with Ebbinghaus forgetting curves and IRT-based scoring.',
    stats: [
      { value: '325', label: 'concepts in a graph' },
      { value: '25', label: 'chapters' },
    ],
    metrics: ['325 concepts across 25 chapters and 100 subtopics', 'Ebbinghaus forgetting curves + IRT scoring'],
    tags: ['TypeScript', 'Neo4j', 'PostgreSQL', 'Claude API'],
    links: [{ label: 'GitHub', href: 'https://github.com/Ayushjo/learngraph-backend' }],
  },
];

export const featured = projects.filter((p) => p.tier === 'featured');
export const moreWork = projects.filter((p) => p.tier === 'more');
