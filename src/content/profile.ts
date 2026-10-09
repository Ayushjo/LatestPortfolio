export type Mode = 'immersive' | 'casual' | 'recruiter';
export type Toned = Record<Mode, string>;

export const profile = {
  name: 'Ayush Singh',
  firstName: 'Ayush',
  role: 'Systems Engineer',
  location: 'Naya Raipur, India',
  timezone: 'Asia/Kolkata',
  email: 'ayushsingh202586@gmail.com',
  links: {
    github: 'https://github.com/Ayushjo',
    linkedin: 'https://linkedin.com/in/ayush-singh',
    twitter: 'https://x.com/_wickyjohn',
    resume: 'https://drive.google.com/file/d/1JcHt_t-qgagu4bFeV4gToMPt9czSCyn8/view',
  },
  tagline: {
    immersive: 'I build systems that move data — fast, and beautifully.',
    casual: "hey, I'm Ayush 👋 I make databases, proxies and AI agents go brrr.",
    recruiter: 'Backend & systems engineer — TypeScript, Node.js, Rust, Python.',
  } satisfies Toned,
  bio: {
    immersive:
      'Storage engines, reverse proxies and autonomous agents. I care about the microseconds nobody sees and the details everybody feels.',
    casual:
      "I write Rust for fun, TypeScript for work, and benchmark things until they confess. Currently open to cool teams.",
    recruiter:
      'I build production-grade backend systems and AI-powered applications: distributed job engines, LLM agents, LSM-tree databases and reverse proxies. Open to opportunities.',
  } satisfies Toned,
  scrollHint: {
    immersive: 'scroll — follow the stream',
    casual: 'scroll down, it gets fun',
    recruiter: '',
  } satisfies Toned,
  skills: {
    Languages: ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go', 'Java', 'C++', 'SQL'],
    'Backend & Frameworks': ['Node.js', 'FastAPI', 'Next.js', 'React', 'Prisma ORM', 'Socket.IO'],
    'Data & Infra': ['PostgreSQL', 'MongoDB', 'Redis', 'Neo4j', 'BullMQ', 'Docker', 'AWS', 'Nginx'],
    'AI & Systems': ['LangChain', 'RAG', 'Claude Code', 'scikit-learn'],
  } as Record<string, string[]>,
};
