export interface ProjectLink {
  label: string;
  href: string;
}

export interface Project {
  slug: string;
  name: string;
  /** One-line hook shown under the name. */
  tagline: string;
  summary: string;
  /** Ayush's part, for team projects. */
  role?: string;
  metrics: string[];
  tags: string[];
  links: ProjectLink[];
}

/** Display order is the order of this array. */
export const projects: Project[] = [
  {
    slug: 'sahaayak',
    name: 'Sahaayak',
    tagline: 'An AI staff for the small businessman the internet left behind.',
    summary:
      'A shop owner talks in plain Hinglish; an orchestrator routes him to specialist agents that chase payments, watch cash flow and source suppliers — and an agent factory hires new specialists on demand. Everything outbound waits for his one-tap approval.',
    role: 'Team lead — backend & AWS platform',
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
    tagline: 'Hand it a GitHub issue. Get back a pull request.',
    summary:
      'An autonomous issue-resolution agent: it plans the fix, executes tool calls in an isolated Docker sandbox and opens the PR end-to-end, while a live SSE dashboard streams every LLM call and tool invocation.',
    metrics: [
      'Hybrid router across 5 LLM providers',
      'Redis-backed $0.10 per-task budget guard',
      '8-file fixes in ~15 min; sub-$0.02 fixes in ~7 min',
    ],
    tags: ['TypeScript', 'Node.js', 'Docker', 'Redis', 'BullMQ', 'Multi-LLM'],
    links: [{ label: 'GitHub', href: 'https://github.com/Ayushjo/MyOwnDevin' }],
  },
  {
    slug: 'diskmap',
    name: 'DiskMap',
    tagline: 'A native macOS storage analyzer — shipping as freedisk.space.',
    summary:
      'See what fills a disk, follow big folders down to their files, find duplicates and developer junk, and review every cleanup before anything moves to Trash. Nothing leaves the machine. Windows port in progress.',
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
    tagline: 'A reverse proxy that keeps pace with nginx.',
    summary:
      'Async reverse proxy / API gateway in Rust (tokio, axum/hyper) with least-connections load balancing and sharded per-client token-bucket rate limiting.',
    metrics: [
      '~70k req/s, ~5 ms p99 — within ~1% of nginx',
      'Slow-backend traffic cut from ~33% to ~2%',
      '~54 ns per rate-limit check, zero wrong rejections over 75k requests',
    ],
    tags: ['Rust', 'Tokio', 'Axum', 'Hyper'],
    links: [{ label: 'GitHub', href: 'https://github.com/Ayushjo/Relay' }],
  },
  {
    slug: 'strata',
    name: 'Strata',
    tagline: 'A storage engine, from the write-ahead log up.',
    summary:
      'Embedded LSM-tree key-value store in Rust — WAL, memtable, block-based SSTables, size-tiered compaction and Bloom filters.',
    metrics: ['1.87M writes/sec (fsync off)', '24× faster absent-key lookups with Bloom filters'],
    tags: ['Rust', 'LSM-tree', 'Storage engines'],
    links: [{ label: 'GitHub', href: 'https://github.com/Ayushjo/Strata' }],
  },
  {
    slug: 'thecineprism',
    name: 'TheCinePrism',
    tagline: 'Film reviews and a newsletter for 36,000 readers.',
    summary: 'A production movie review and newsletter platform on AWS, with Docker CI/CD, SES and BullMQ.',
    metrics: ['36,000+ active users', '253,000+ monthly events', 'Sub-100 ms API via Redis caching'],
    tags: ['TypeScript', 'Node.js', 'React', 'Redis', 'AWS'],
    links: [
      { label: 'Live', href: 'https://thecineprism.com' },
      { label: 'GitHub', href: 'https://github.com/Ayushjo/CineprismFE' },
    ],
  },
  {
    slug: 'tradelogs',
    name: 'TRADElogs',
    tagline: 'A trading journal that calls out your tilt.',
    summary:
      'MetaTrader-5 journal SaaS that auto-imports every fill, surfaces behavioural patterns (tilt, revenge trades, sessions) and runs a live AI trading coach over SSE, fed by a FastAPI MT5 bridge.',
    metrics: ['Real-time broker sync', 'Weekly AI reviews', 'Groq coach with Redis rate limiting'],
    tags: ['TypeScript', 'FastAPI', 'Redis', 'Groq', 'MetaTrader 5'],
    links: [],
  },
  {
    slug: 'ics-fault-detection',
    name: 'ICS Fault Detection',
    tagline: 'Six agents watching a water plant for attacks.',
    summary: 'A multi-agent AI platform with a real-time WebSocket dashboard over 51 industrial sensor points.',
    metrics: ['99.83% fault detection accuracy on SWaT'],
    tags: ['Python', 'Flask', 'React', 'scikit-learn'],
    links: [{ label: 'GitHub', href: 'https://github.com/Ayushjo/ics-minor' }],
  },
  {
    slug: 'learngraph',
    name: 'LearnGraph',
    tagline: 'Chemistry prep that knows what you are about to forget.',
    summary:
      'Adaptive JEE/NEET prep modelled as a Neo4j knowledge graph, with Ebbinghaus forgetting curves and IRT-based scoring.',
    metrics: ['325 concepts across 25 chapters'],
    tags: ['TypeScript', 'Neo4j', 'PostgreSQL', 'Claude API'],
    links: [{ label: 'GitHub', href: 'https://github.com/Ayushjo/learngraph-backend' }],
  },
];
