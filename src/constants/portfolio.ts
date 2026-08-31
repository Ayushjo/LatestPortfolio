import { GithubIcon } from "@/Components/ui/github";
import { LinkedinIcon } from "@/Components/ui/linkedin";
import { SendIcon } from "@/Components/ui/send";
import { TwitterIcon } from "@/Components/ui/twitter";
import { Mail } from "lucide-react";


export type Contribution = {
  prUrl: string;
  private?: boolean;
  title?: string;
  url?: string; // a.k.a redirectUrl
  status?: 'open' | 'closed' | 'merged';
};

export interface Personal {
  name: string;
  surname: string;
  roles?: string[];
  location: string;
  timezone: string;
  bio: string;
  email: string;
  availability: string;
  avatar: string;
  resumeUrl: string;
}

export interface Social {
  icon: any ;
  href: string;
  label: string;
}

export interface Experience {
  company: string;
  companyUrl?: string;
  role: string;
  period: string;
  startDate: string;
  description?: string;
  points?: string[];
  linkedin?: string;
}

export interface Project {
  title: string;
  desc: string;
  tags: string[];
  href: string;
  github?: string;
  className: string;
  collaborative?: boolean;
  featured?: boolean;
  previewType?: "site" | "github";
  siteUrl?: string;
  previewImage?: string;
}


export interface Article {
  title: string;
  excerpt: string;
  href: string;
  date: string;
  readTime: string;
  category: 'entertainment' | 'tech';
  image?: string;
}

export interface SkillCategory {
  label: string;
  skills: string[];
}


export const PORTFOLIO_CONTENT: {
  personal: Personal;
  socials: Social[];
  // skills: string[];
  skillCategories: SkillCategory[];
  experience: Experience[];
  projects: Project[];
  contributions: Contribution[];
  articles: Article[];
  mediumUrl: string;
} = {
  personal: {
    name: "Hi, I'm Ayush —",
    surname: "Software Engineer.",
    roles: ["Software Engineer.", "Backend Developer.", "Systems Programmer."],
    location: "Naya Raipur, India",
    timezone: "Asia/Kolkata",
    bio: `I build production-grade backend systems and AI-powered applications in TypeScript, Node.js, Rust, and Python — from distributed job engines and LLM agents to LSM-tree databases and reverse proxies.`,
    email: "ayushsingh202586@gmail.com",
    availability: "Open to opportunities",
    avatar: "/avatar.jpg",
    resumeUrl: "https://drive.google.com/file/d/1JcHt_t-qgagu4bFeV4gToMPt9czSCyn8/view",
  },
  socials: [
    {
      icon: GithubIcon,
      href: "https://github.com/Ayushjo",
      label: "GitHub",
    },
    {
      icon: LinkedinIcon,
      href: "https://linkedin.com/in/ayush-singh",
      label: "LinkedIn",
    },
    { icon: TwitterIcon, href: "https://x.com/_wickyjohn", label: "Twitter" },
    { icon: SendIcon, href: "mailto:ayushsingh202586@gmail.com", label: "Email" },
  ],
  // skills: [
  //   "Next.js",
  //   "FastAPI",
  //   "Python",
  //   "React",
  //   "TypeScript",
  //   "JavaScript",
  //   "Node.js",
  //   "Prisma ORM",
  //   "RAG",
  //   "Vector Databases",
  //   "langChain",
  //   "langGraph",
  //   "Redis",
  //   "Docker",
  //   "GCP",
  //   "AWS",
  //   "PostgreSQL",
  //   "MongoDB",
  //   "Claude Code",
  // ],
  skillCategories: [
    {
      label: "Languages",
      skills: ["TypeScript", "JavaScript", "Python", "Rust", "Go", "Java", "C++", "SQL"],
    },
    {
      label: "Backend & Frameworks",
      skills: ["Node.js", "FastAPI", "Next.js", "React", "Prisma ORM", "Socket.IO"],
    },
    {
      label: "Data & Infra",
      skills: ["PostgreSQL", "MongoDB", "Redis", "Neo4j", "BullMQ", "Docker", "AWS", "Nginx"],
    },
    {
      label: "AI & Systems",
      skills: ["langChain", "RAG", "Claude Code", "scikit-learn"],
    },
  ],
  experience: [
    {
      company: "Amrevx Pvt. Ltd. (TRADElogs)",
      companyUrl: "https://tradelogs.com",
      role: "Software Development Engineer Intern",
      period: "Jul. 2026 – Present",
      startDate: "2026-07-01",
      description: "Building backend systems for TRADElogs, a MetaTrader-5 trading journal SaaS.",
      points: [
        "Built a live AI trading coach: an LLM chatbot (Groq) answering natural-language questions about trading behaviour, grounded on real account data via a token-bounded context pipeline.",
        "Implemented real-time token streaming over Server-Sent Events with per-user Redis rate limiting and rule-based fallback; engineered compliance guardrails and prompt-injection defenses.",
        "Integrated a Python/FastAPI MetaTrader-5 bridge with the Node backend to sync live broker trades, fixing a concurrency bug on the broker's single-terminal lock that caused intermittent 500s.",
      ],
    },
    {
      company: "VedaAI (Vedafy Technologies Pvt. Ltd.)",
      role: "SDE Intern",
      period: "Jun. 2026 – Jul. 2026",
      startDate: "2026-06-01",
      description: "Shipped core integrations and backend services for a B2B education platform.",
      points: [
        "Shipped the Google Classroom integration for VedaAI v3, syncing rosters, courses, and assignments so teachers could onboard existing classes without manual setup.",
        "Built scalable backend services and REST APIs, owning features end-to-end alongside the founding team.",
        "Reworked UI/UX across key product surfaces to improve usability and consistency.",
      ],
    },
    {
      company: "TheCinePrism",
      companyUrl: "https://thecineprism.com",
      role: "Freelance Full-Stack Developer",
      period: "Jul. 2025 – Present",
      startDate: "2025-07-01",
      description: "Building and maintaining a production movie review and newsletter platform.",
      points: [
        "Serves 36,000+ active users with 253,000+ monthly events; achieved sub-100ms API response via Redis caching.",
        "Deployed on AWS with Docker CI/CD, Cashfree payments, SES, and BullMQ queuing.",
        "Cut monthly infra costs 60% ($47 → $16–20) by dropping ALB/NAT Gateway for a single EC2 t2.micro with self-hosted Redis and Nginx.",
      ],
    },
    {
      company: "Rootvesters",
      role: "Backend Developer Intern",
      period: "May 2026 – Nov. 2026",
      startDate: "2026-05-01",
      description: "Built LearnGraph, an adaptive JEE/NEET Chemistry prep platform.",
      points: [
        "Modeled 25 chapters, 100 subtopics, and 325 concepts on Neo4j with Ebbinghaus forgetting curve and IRT-based scoring.",
        "Integrated Claude API for question generation with subtopic-level progressive unlocking.",
        "Fixed a backwards Neo4j edge-direction bug breaking prerequisite traversal and migrated the full curriculum across PostgreSQL and graph layers.",
      ],
    },
  ],
  projects: [
    {
      title: "Strata",
      desc: "Embedded LSM-tree key-value store in Rust — WAL, memtable, block-based SSTables, size-tiered compaction, and Bloom filters. Benchmarked at 1.87M writes/sec (fsync off) and 24× faster absent-key lookups with Bloom filters vs without.",
      tags: ["Rust", "LSM-tree", "Key-Value Store", "Systems"],
      href: "https://github.com/Ayushjo/Strata",
      github: "https://github.com/Ayushjo/Strata",
      className: "md:col-span-1",
      featured: true,
      previewType: "github",
    },
    {
      title: "Relay",
      desc: "Async reverse proxy / API gateway in Rust (tokio, axum/hyper). Least-connections load balancing cut traffic to a slow backend from ~33% to ~2% vs round-robin. Sharded per-client token-bucket rate limiting at ~54ns/check, validated across 500 clients and 75,000+ requests with zero incorrect rejections. Benchmarked at ~70k req/s, ~5ms p99 — within ~1% of nginx at matched concurrency.",
      tags: ["Rust", "tokio", "axum", "API Gateway", "Systems"],
      href: "https://github.com/Ayushjo/Relay",
      github: "https://github.com/Ayushjo/Relay",
      className: "md:col-span-1",
      featured: true,
      previewType: "github",
    },
    {
      title: "Pullwright",
      desc: "Autonomous GitHub issue-resolution agent: submit an issue, AI plans the fix, executes tool calls in an isolated Docker sandbox, and opens a PR end-to-end. Live SSE dashboard streams every LLM call and tool invocation. Hybrid LLM router across 5 providers with Redis-backed per-task $0.10 budget guard; shipped 8-file fixes in ~15 min and sub-$0.02 fixes in ~7 min.",
      tags: ["Node.js", "TypeScript", "Docker", "Redis", "BullMQ", "Multi-LLM", "React"],
      href: "https://github.com/Ayushjo/MyOwnDevin",
      github: "https://github.com/Ayushjo/MyOwnDevin",
      className: "md:col-span-1",
      previewType: "site",
      previewImage: "/previews/pullwright.png",
    },
    {
      title: "TRADElogs",
      desc: "MetaTrader-5 trading journal SaaS that auto-imports every fill, surfaces behavioral insights (tilt, revenge trades, session patterns), and delivers weekly AI reviews. Built the live AI trading coach with Groq over SSE, Redis rate limiting, and a Python/FastAPI MT5 bridge syncing broker trades in real time.",
      tags: ["Node.js", "TypeScript", "FastAPI", "Redis", "Groq", "MetaTrader 5"],
      href: "https://tradelogs.com",
      className: "md:col-span-1",
      previewType: "site",
      previewImage: "/previews/tradelogs.png",
    },
    {
      title: "TheCinePrism",
      desc: "Production movie review and newsletter platform serving 36,000+ active users with 253,000+ monthly events. Sub-100ms API response via Redis caching, deployed on AWS with Docker CI/CD, SES, and BullMQ.",
      tags: ["Node.js", "TypeScript", "React", "Redis", "AWS", "BullMQ"],
      href: "https://thecineprism.com",
      github: "https://github.com/Ayushjo/CineprismFE",
      className: "md:col-span-1",
      previewType: "site",
      previewImage: "/previews/cineprism.png",
    },
    {
      title: "ICS Multi-Agent Fault Detection",
      desc: "6-agent AI platform achieving 99.83% fault detection accuracy on the SWaT dataset (Random Forest), with a real-time WebSocket dashboard over 51 sensor points.",
      tags: ["Python", "Flask", "React", "scikit-learn", "Docker"],
      href: "https://github.com/Ayushjo/ics-minor",
      github: "https://github.com/Ayushjo/ics-minor",
      className: "md:col-span-1",
      previewType: "github",
    },
    {
      title: "LearnGraph",
      desc: "Adaptive JEE/NEET Chemistry prep platform with 25 chapters, 100 subtopics, and 325 concepts modeled on Neo4j with Ebbinghaus forgetting curve and IRT-based scoring.",
      tags: ["Node.js", "TypeScript", "Neo4j", "PostgreSQL", "Claude API"],
      href: "https://github.com/Ayushjo/learngraph-backend",
      github: "https://github.com/Ayushjo/learngraph-backend",
      className: "md:col-span-1",
      previewType: "github",
    },
  ],
  contributions: [
  ],
  articles: [
    {
      title: "Why The Odyssey Is a Must-Watch for Indians",
      excerpt: "Nolan's The Odyssey isn't a distant Greek myth for Indians — it's our own story of exile, war, and the long road home.",
      href: "https://thecineprism.com/s/XfNsS0h",
      date: "Jul 18, 2026",
      readTime: "7 min read",
      category: "entertainment",
      image: "/odysseyarticle.png",
    },
    {
      title: "Before Heroes, There Was Rama: Ramayana",
      excerpt: "About Namit Malhotra's Ramayana — one of the most ambitious films in the history of Indian cinema, bringing Ranbir Kapoor, Yash, and Hans Zimmer together.",
      href: "https://thecineprism.com/s/3IE9AgD",
      date: "Apr 2, 2026",
      readTime: "5 min read",
      category: "entertainment",
      image: "/ramayana.png",
    },
    {
      title: "Nobody Does Folklore Like Bollywood",
      excerpt: "From Stree to Tumbbad, Hindi cinema has long been a vessel for folklore — myths, regional legends, and oral traditions reimagined on the modern screen.",
      href: "https://thecineprism.com/s/hfquqzd",
      date: "Oct 26, 2025",
      readTime: "2 min read",
      category: "entertainment",
      image: "/folkflore.png",
    },
    {
      title: "Movies Should Be Watched at Cinema Halls",
      excerpt: "Why going to the cinema is important for an experience — on surrender, immersion, and why OTT can't replicate what a darkened hall gives you.",
      href: "https://thecineprism.com/s/g2FKGF7",
      date: "Oct 10, 2025",
      readTime: "2 min read",
      category: "entertainment",
      image: "/moviesatcinema.png",
    },
  ],
  mediumUrl: "https://medium.com/@ayushsingh",
};
