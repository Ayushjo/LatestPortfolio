import type { Stat } from './projects';

export interface Role {
  id: string;
  kind: 'work' | 'education';
  company: string;
  title: string;
  product?: string;
  period: string;
  /** Short hash-style label for the git-log timeline. */
  commit: string;
  summary: string;
  points: string[];
  stats?: Stat[];
  links?: { label: string; href: string }[];
}

/** Newest first. */
export const experience: Role[] = [
  {
    id: 'amrevx',
    kind: 'work',
    company: 'Amrevx',
    title: 'Software Development Engineer Intern',
    product: 'TRADElogs — a MetaTrader-5 trading journal SaaS',
    period: 'Jul 2026 — Present',
    commit: 'feat: join Amrevx',
    summary: 'A trading journal that imports every fill and tells you when you are tilting.',
    points: [
      'Built the live AI trading coach: a Groq chatbot grounded on the trader’s own data — win rate, profit factor, session and day edges — through a token-bounded context pipeline.',
      'Streams tokens over SSE with per-user Redis rate limits and rule-based fallback; compliance guardrails and prompt-injection defences treat all external data as untrusted.',
      'Integrated the Python/FastAPI MT5 bridge with the Node backend, and fixed a race on the broker’s single-terminal lock that caused intermittent 500s.',
    ],
  },
  {
    id: 'vedaai',
    kind: 'work',
    company: 'VedaAI',
    title: 'SDE Intern',
    product: 'Vedafy Technologies — B2B education platform',
    period: 'Jun 2026 — Jul 2026',
    commit: 'feat: ship Classroom sync',
    summary: 'Teachers brought their whole Google Classroom over in one click.',
    points: [
      'Shipped the Google Classroom integration for VedaAI v3 — rosters, courses and assignments sync, so teachers onboard existing classes without setup.',
      'Built backend services and REST APIs across the platform, owning features end-to-end with the founding team.',
      'Reworked UI/UX across key product surfaces for usability and consistency.',
    ],
  },
  {
    id: 'cineprism',
    kind: 'work',
    company: 'TheCinePrism',
    title: 'Freelance Full-Stack Developer',
    product: 'Movie reviews and a newsletter, in production',
    period: 'Jul 2025 — Present',
    commit: 'perf: cut infra cost 60%',
    summary: 'I built it, I run it, and I made its AWS bill 60% smaller.',
    points: [
      'Built and maintain thecineprism.com: 36,000+ active users, 253,000+ monthly events, sub-100 ms API via Redis caching.',
      'AWS with Docker CI/CD, Cashfree payments, SES and BullMQ queues.',
      'Cut monthly infra cost 60% ($47 → $16–20) by dropping the ALB and NAT Gateway for one EC2 instance with self-hosted Redis and Nginx.',
    ],
    stats: [
      { value: '36k+', label: 'active users' },
      { value: '−60%', label: 'monthly AWS bill' },
    ],
    links: [{ label: 'thecineprism.com', href: 'https://thecineprism.com' }],
  },
  {
    id: 'iiitnr',
    kind: 'education',
    company: 'IIIT Naya Raipur',
    title: 'B.Tech, Electronics & Communication',
    product: 'Head of the DevOps Club',
    period: 'Aug 2024 — May 2028',
    commit: 'init: IIIT Naya Raipur',
    summary: 'Studying signals by day, shipping systems by night — and running the DevOps Club.',
    points: [],
  },
];
