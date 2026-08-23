'use client';

import { useState, useEffect, type JSX, lazy, Suspense, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Linkedin,
  MapPin,
  Terminal,
  Briefcase,
  BookOpen,
  Globe,
  ChevronDown,
} from "lucide-react";

import { PORTFOLIO_CONTENT } from "@/constants/portfolio";
import BentoCard from "@/Components/BentoCard";
import ProjectCard from "@/Components/ProjectCard";
import OpenSourceSection from "@/Components/OpenSourceSection";
import LiveClock from "@/Components/LiveClock";
import Hero from "@/Components/Hero";
import { Tooltip } from "@/Components/ui/tooltip-card";

import TypeScript from "@/Components/Typescript";
import NextJs from "@/Components/NextJS";
import NodeJs from "@/Components/NodeJs";
import ReactLogo from "@/Components/React";
import PostgreSQL from "@/Components/PostgreSQL";
import FastAPI from "@/Components/FastAPI";

// Animated icons
import { GithubIcon, type GithubIconHandle } from "@/Components/ui/github";
import { LinkedinIcon, type LinkedinIconHandle } from "@/Components/ui/linkedin";
import { TwitterIcon, type TwitterIconHandle } from "@/Components/ui/twitter";
import { SendIcon, type SendIconHandle } from "@/Components/ui/send";
import type { MediumPost } from "@/lib/medium";
import BlogCard from "@/Components/BlogCard";
import GitHubCalendarComponent from "@/Components/GitHubCalendarComponent";
import { MapPinIcon, type MapPinIconHandle } from "@/Components/ui/map-pin";

// Lazy load heavy below-the-fold components
const Oneko = lazy(() => import("@/Components/Oneko"));

type TechLogo = {
  src: string;
  alt: string;
};

const TECH_STACK_LOGOS: Record<string, TechLogo> = {
  "Next.js": { src: "https://cdn.simpleicons.org/nextdotjs", alt: "Next.js logo" },
  React: { src: "https://cdn.simpleicons.org/react", alt: "React logo" },
  TypeScript: { src: "https://cdn.simpleicons.org/typescript", alt: "TypeScript logo" },
  JavaScript: { src: "https://cdn.simpleicons.org/javascript", alt: "JavaScript logo" },
  "Node.js": { src: "https://cdn.simpleicons.org/nodedotjs", alt: "Node.js logo" },
  "Prisma ORM": { src: "https://cdn.simpleicons.org/prisma", alt: "Prisma logo" },
  "Drizzle ORM": { src: "https://cdn.simpleicons.org/drizzle", alt: "Drizzle ORM logo" },
  "SQLAlchemy": { src: "https://cdn.simpleicons.org/sqlalchemy", alt: "SQLAlchemy logo" },
  Python: { src: "https://cdn.simpleicons.org/python", alt: "Python logo" },
  FastAPI: { src: "https://cdn.simpleicons.org/fastapi", alt: "FastAPI logo" },
  langChain: { src: "https://cdn.simpleicons.org/langchain", alt: "LangChain logo" },
  langGraph: { src: "https://cdn.simpleicons.org/langgraph", alt: "LangGraph logo" },
  Qdrant: { src: "https://cdn.simpleicons.org/qdrant", alt: "Qdrant logo" },
  Redis: { src: "https://cdn.simpleicons.org/redis", alt: "Redis logo" },
  Docker: { src: "https://cdn.simpleicons.org/docker", alt: "Docker logo" },
  GCP: { src: "https://cdn.simpleicons.org/googlecloud", alt: "Google Cloud logo" },
  PostgreSQL: { src: "https://cdn.simpleicons.org/postgresql", alt: "PostgreSQL logo" },
  MongoDB: { src: "https://cdn.simpleicons.org/mongodb", alt: "MongoDB logo" },
  "Claude Code": { src: "https://cdn.simpleicons.org/claude", alt: "Anthropic logo" },
  Codex: { src: "https://cdn.simpleicons.org/openai", alt: "OpenAI logo" },
};

const HIDDEN_BLOG_MATCHES = [
  "4a1617798586",
  "6b88c7941e53",
  "683fdbd0a8c1",
  "im-building-a-github-pr-reviewer-that-actually-thinks-not-just-comments",
  "orizen-flow-an-ai-system-for-evidence-based-hiring",
  "building-beautiful-cli-experiences-introducing-orizen-tui",
];

const isHiddenBlog = (post: MediumPost) => {
  const searchablePostFields = [post.link, post.guid, post.title]
    .join(" ")
    .toLowerCase();
  return HIDDEN_BLOG_MATCHES.some((match) => searchablePostFields.includes(match));
};

// Socials Card Component with animated icons
function SocialsCard({ colSpan, rowSpan }: { colSpan?: string; rowSpan?: string }) {
  const githubRef = useRef<GithubIconHandle>(null);
  const linkedinRef = useRef<LinkedinIconHandle>(null);
  const twitterRef = useRef<TwitterIconHandle>(null);
  const emailRef = useRef<SendIconHandle>(null);

  const iconRefs = {
    "GitHub": githubRef,
    "LinkedIn": linkedinRef,
    "Twitter": twitterRef,
    "Email": emailRef,
  };

  const handleMouseEnter = (label: string) => {
    const ref = iconRefs[label as keyof typeof iconRefs];
    ref?.current?.startAnimation();
  };

  const handleMouseLeave = (label: string) => {
    const ref = iconRefs[label as keyof typeof iconRefs];
    ref?.current?.stopAnimation();
  };

  const getIcon = (social: typeof PORTFOLIO_CONTENT.socials[0]) => {
    const className = "text-neutral-600 dark:text-neutral-400 group-hover:text-black dark:group-hover:text-white mb-2";

    switch (social.label) {
      case "GitHub":
        return <GithubIcon ref={githubRef} size={20} className={className} />;
      case "LinkedIn":
        return <LinkedinIcon ref={linkedinRef} size={20} className={className} />;
      case "Twitter":
        return <TwitterIcon ref={twitterRef} size={20} className={className} />;
      case "Email":
        return <SendIcon ref={emailRef} size={20} className={className} />;
      default:
        return <social.icon size={20} className={className} />;
    }
  };

  return (
    <BentoCard colSpan={colSpan} rowSpan={rowSpan} delay={0.2}>
      <div className="flex flex-col justify-center h-full">
        <div className="grid grid-cols-2 gap-3">
          {PORTFOLIO_CONTENT.socials.map((link, i) => (
            <a
              key={i}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 hover:scale-105 transition-all duration-300 group"
              onMouseEnter={() => handleMouseEnter(link.label)}
              onMouseLeave={() => handleMouseLeave(link.label)}
            >
              {getIcon(link)}
              <span className="text-[10px] text-neutral-600 dark:text-neutral-500">
                {link.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </BentoCard>
  );
}

// Location Card Component with animated MapPin icon
function LocationCard({ colSpan, rowSpan }: { colSpan?: string; rowSpan?: string }) {
  const mapPinRef = useRef<MapPinIconHandle>(null);

  return (
    <BentoCard colSpan={colSpan} rowSpan={rowSpan} delay={0.1}>
      <div
        className="flex flex-col items-center justify-center text-center space-y-3 h-full"
        onMouseEnter={() => mapPinRef.current?.startAnimation()}
        onMouseLeave={() => mapPinRef.current?.stopAnimation()}
      >
        <div className="relative w-full px-5 h-24 bg-neutral-200 dark:bg-neutral-800 rounded-xl overflow-hidden opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="absolute inset-0 bg-[radial-gradient(#a3a3a3_1px,transparent_1px)] dark:bg-[radial-gradient(#404040_1px,transparent_1px)] bg-size-[8px_8px] opacity-20"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-500 rounded-full animate-ping" />
              <MapPinIcon
                ref={mapPinRef}
                size={24}
                className="text-blue-500 dark:text-blue-400 relative z-10"
              />
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-neutral-900 dark:text-white font-semibold pt-2">
            {PORTFOLIO_CONTENT.personal.location}
          </h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-500">
            <LiveClock timezone={PORTFOLIO_CONTENT.personal.timezone ?? "Asia/Kolkata"} />
            {" "}({PORTFOLIO_CONTENT.personal.timezone})
          </p>
        </div>
      </div>
    </BentoCard>
  );
}

export default function Home() {
  const [blogs, setBlogs] = useState<MediumPost[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [showAllBlogs, setShowAllBlogs] = useState(false);
  const heroSendRef = useRef<SendIconHandle>(null);

  const currentRole = PORTFOLIO_CONTENT.experience[0];

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/medium?url=${encodeURIComponent(PORTFOLIO_CONTENT.mediumUrl)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch Medium posts: ${response.status}`);
        }
        return response.json() as Promise<{ posts?: MediumPost[] }>;
      })
      .then((data) => {
        setBlogs(
          Array.isArray(data.posts)
            ? data.posts.filter((post) => !isHiddenBlog(post))
            : []
        );
      })
      .catch((error) => {
        if ((error as Error).name === "AbortError") return;
        console.error("Failed to fetch Medium posts:", error);
      })
      .finally(() => {
        setLoadingBlogs(false);
      });

    return () => {
      controller.abort();
    };
  }, []);

  const startDate = new Date(currentRole.startDate);
  const now = new Date();

  let months =
    (now.getFullYear() - startDate.getFullYear()) * 12 +
    (now.getMonth() - startDate.getMonth());
  if (now.getDate() >= startDate.getDate()) months++;

  const displayMonths = months < 1 ? 1 : months;
  const expDuration = `${displayMonths} month${displayMonths > 1 ? "s" : ""}`;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 font-sans selection:bg-blue-600 selection:text-white dark:selection:bg-blue-300 dark:selection:text-neutral-900 transition-colors duration-300">
      {/* Background Gradient Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-50">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 dark:bg-blue-900/10 blur-[60px] gpu" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/5 dark:bg-purple-900/10 blur-[60px] gpu" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* === HERO SECTION === */}
        <Hero />

        {/* === BENTO GRID LAYOUT === */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-auto md:auto-rows-[220px]">
          {/* 1. Hero / About */}
          <BentoCard colSpan="md:col-span-2 lg:col-span-2" rowSpan="md:row-span-2" delay={0}>
            <div className="flex flex-col justify-between h-full">
              <div className="space-y-6 md:space-y-8">
                {/* Avatar */}
                <Image
                  className="w-32 h-32 md:w-36 md:h-36 rounded-2xl object-cover shadow-sm bg-neutral-100 dark:bg-neutral-800 border border-transparent dark:border-white/5"
                  src={PORTFOLIO_CONTENT.personal.avatar}
                  alt="Avatar"
                  width={144}
                  height={144}
                  priority
                />
                
                {/* Text Content */}
                <div className="space-y-4">
                  <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white leading-tight">
                    About me.
                  </h2>
                 <div className="text-neutral-700 dark:text-neutral-300 text-[15px] md:text-[17px] leading-loose w-full max-w-none">
                   {PORTFOLIO_CONTENT.personal.bio.split(/(TypeScript|React|Next\.js|Node\.js|PostgreSQL|LLM APIs|RAG|FastAPI|AI|web)/g).map((part, i) => {
                    const pillClass = "inline-flex items-center text-sm font-semibold bg-neutral-100 dark:bg-white/10 border border-neutral-200 dark:border-white/20 py-1 px-2.5 rounded-lg text-black dark:text-white align-baseline shadow-xs mx-0.5";
                    
                    const inlineMap: Record<string, JSX.Element> = {
                      TypeScript: (
                        <span key={`ts-${i}`} className={pillClass}>
                          <span className="w-4 h-4 mr-1.5"><TypeScript /></span>
                          <span>TypeScript</span>
                        </span>
                      ),
                      React: (
                        <span key={`react-${i}`} className={pillClass}>
                          <span className="w-4 h-4 mr-1.5"><ReactLogo /></span>
                          <span>React</span>
                        </span>
                      ),
                      "Next.js": (
                        <span key={`next-${i}`} className={pillClass}>
                          <span className="w-4 h-4 mr-1.5"><NextJs /></span>
                          <span>Next.js</span>
                        </span>
                      ),
                      "Node.js": (
                        <span key={`node-${i}`} className={pillClass}>
                          <span className="w-4 h-4 mr-1.5"><NodeJs /></span>
                          <span>Node.js</span>
                        </span>
                      ),
                      PostgreSQL: (
                        <span key={`pg-${i}`} className={pillClass}>
                          <span className="w-4 h-4 mr-1.5"><PostgreSQL /></span>
                          <span>PostgreSQL</span>
                        </span>
                      ),
                      FastAPI: (
                        <span key={`fastapi-${i}`} className={pillClass}>
                          <span className="w-4 h-4 mr-1.5"><FastAPI /></span>
                          <span>FastAPI</span>
                        </span>
                      ),
                      AI: (
                        <span key={`ai-${i}`} className="font-bold text-neutral-900 dark:text-neutral-100">AI</span>
                      ),
                      web: (
                        <span key={`web-${i}`} className="font-bold text-neutral-900 dark:text-neutral-100">web</span>
                      ),
                    };
                    
                    return inlineMap[part] || <span key={i}>{part}</span>;
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 md:pt-6 w-full mt-auto">
              <a
                // href={`https://mail.google.com/mail/?view=cm&fs=1&to=${PORTFOLIO_CONTENT.personal.email}`}
                href={`https://drive.google.com/file/d/1xbYe4gXuTu1eu68GtpJMelBKbYQtlqF-/view`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-[15px] font-bold bg-neutral-900 dark:bg-white text-white dark:text-black py-2.5 px-5 rounded-xl hover:scale-105 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all gap-2 shadow-sm group/send"
                onMouseEnter={() => heroSendRef.current?.startAnimation()}
                onMouseLeave={() => heroSendRef.current?.stopAnimation()}
              >
                <SendIcon ref={heroSendRef} size={16} />
                Resume
              </a>
            </div>
          </div>
        </BentoCard>

          {/* 4. Tech Stack (Vertical Sidebar) */}
          <BentoCard colSpan="md:col-span-1 lg:col-span-1" rowSpan="row-span-3" delay={0.3}>
            <div className="flex flex-col h-full">
              <div className="mb-4 flex items-center gap-2 shrink-0">
                <Terminal size={18} className="text-neutral-600 dark:text-neutral-400" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-600 dark:text-neutral-500">
                  Skills & Stack
                </h3>
              </div>
              <div className="flex-1 relative overflow-y-auto min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="space-y-6 pt-1 pb-4">
                  {PORTFOLIO_CONTENT.skillCategories.map((group, gIdx) => (
                    <div key={group.label} className="space-y-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500 px-1">
                        {group.label}
                      </h4>
                      <div className="flex flex-wrap content-start gap-2">
                        {group.skills.map((skill, i) => (
                          <motion.div
                            key={skill}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.05 + (gIdx * 0.1) + (i * 0.02) }}
                          >
                            <div className="text-[12px] md:text-[13px] font-medium bg-neutral-100/50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 py-1.5 px-3 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-blue-50/50 dark:hover:bg-blue-500/10 hover:border-blue-500/50 transition-all cursor-pointer flex items-center gap-2 group/skill">
                              <div className="w-4 h-4 flex items-center justify-center shrink-0">
                                {TECH_STACK_LOGOS[skill] ? (
                                  <img
                                    src={TECH_STACK_LOGOS[skill].src}
                                    alt={TECH_STACK_LOGOS[skill].alt}
                                    width={16}
                                    height={16}
                                    loading="lazy"
                                    className="w-4 h-4 object-contain transition-all duration-300 group-hover/skill:scale-110"
                                  />
                                ) : (
                                  <Terminal size={14} className="text-neutral-500" />
                                )}
                              </div>
                              {skill}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </BentoCard>

          {/* 2. Map / Location */}
          <LocationCard colSpan="md:col-span-1 lg:col-span-1" rowSpan="md:row-span-1" />

          {/* 3. Socials */}
          <SocialsCard colSpan="md:col-span-1 lg:col-span-1" rowSpan="md:row-span-1" />
        </div>

        {/* === WORK EXPERIENCE SECTION === */}
        <div className="mt-16 w-full cv-auto">
          <div className="mb-8 px-4 md:px-6">
            <div className="flex items-center gap-3">
              <Briefcase className="text-blue-500" size={24} />
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Experience</h2>
            </div>
          </div>

          <div className="relative sm:mx-6 md:mx-12 lg:mx-20 border-l border-neutral-200 dark:border-white/10 ml-6 md:ml-12 lg:ml-20">
            {PORTFOLIO_CONTENT.experience.map((role, idx) => {
               const isPresent = /\b(present|current)\b/i.test(role.period);
               return (
                 <div key={idx} className={`relative pl-6 sm:pl-8 py-6 group ${isPresent ? '' : 'opacity-90 hover:opacity-100 transition-opacity'}`}>
                   {/* Timeline Node */}
                   <motion.div 
                     initial={{ scale: 0, opacity: 0 }}
                     whileInView={{ scale: 1, opacity: 1 }}
                     viewport={{ once: true, margin: "-50px" }}
                     transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                     className={`absolute -left-[5px] top-8 w-2.5 h-2.5 rounded-full ring-4 ring-neutral-50 dark:ring-neutral-950 transition-colors z-10 ${isPresent ? 'bg-blue-500 dark:bg-blue-400' : 'bg-neutral-300 dark:bg-neutral-600 group-hover:bg-neutral-400 dark:group-hover:bg-neutral-500'}`} 
                   />
                   
                   {/* Animated Ping for Current Role */}
                   {isPresent && (
                     <motion.div 
                       initial={{ opacity: 0 }}
                       whileInView={{ opacity: 0.75 }}
                       viewport={{ once: true, margin: "-50px" }}
                       transition={{ delay: 0.4 }}
                       className="absolute -left-[5px] top-8 w-2.5 h-2.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-ping" 
                     />
                   )}
                   
                   <motion.div 
                     initial={{ opacity: 0, x: -20 }}
                     whileInView={{ opacity: 1, x: 0 }}
                     viewport={{ once: true, margin: "-50px" }}
                     transition={{ duration: 0.4, delay: 0.2 }}
                     className="flex flex-col gap-1"
                   >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                         <h3 className={`text-xl font-bold ${isPresent ? 'text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>{role.role}</h3>
                         <p className={`text-sm font-medium ${isPresent ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-500 dark:text-neutral-400'}`}>{role.period}</p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <span className={`text-base font-semibold ${isPresent ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-neutral-400'}`}>{role.company}</span>
                        
                        {(role.companyUrl || role.linkedin) && (
                          <div className="flex items-center gap-2">
                            {role.companyUrl && (
                              <a href={role.companyUrl} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                                <Globe size={14} />
                              </a>
                            )}
                            {role.linkedin && (
                              <a href={role.linkedin} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                                <Linkedin size={14} />
                              </a>
                            )}
                          </div>
                        )}

                        {isPresent && (
                           <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 uppercase ring-1 ring-blue-500/20">
                             Current
                           </span>
                        )}
                      </div>
                   </motion.div>

                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true, margin: "-50px" }}
                   transition={{ duration: 0.4, delay: 0.3 }}
                   className="mt-4"
                 >
                    {role.description && (
                      <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-[15px] mb-4">
                        {role.description}
                      </p>
                    )}
                    
                    {role.points && role.points.length > 0 && (
                      <div className="mt-2 space-y-3">
                         {role.points.map((point, pIdx) => (
                           <motion.div 
                             initial={{ opacity: 0, x: -10 }}
                             whileInView={{ opacity: 1, x: 0 }}
                             viewport={{ once: true, margin: "-50px" }}
                             transition={{ duration: 0.3, delay: 0.4 + (pIdx * 0.1) }}
                             key={pIdx} 
                             className="flex items-start gap-3 group/point"
                           >
                             <div className="w-5 h-5 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/5 flex items-center justify-center shrink-0 mt-0.5 group-hover/point:border-blue-500/30 group-hover/point:bg-blue-50 dark:group-hover/point:bg-blue-500/10 transition-colors shadow-sm">
                               <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 group-hover/point:bg-blue-500 dark:group-hover/point:bg-blue-400 transition-colors" />
                             </div>
                             <span className="text-sm md:text-[15px] text-neutral-600 dark:text-neutral-400 group-hover/point:text-neutral-900 dark:group-hover/point:text-neutral-200 transition-colors block flex-1 leading-relaxed">
                               {point}
                             </span>
                           </motion.div>
                         ))}
                      </div>
                     )}
                 </motion.div>
               </div>
             );
            })}
          </div>
        </div>

        {/* === FEATURED PROJECTS (separate from bento grid for stable ordering) === */}
        <div id="projects" className="mt-10 w-full pt-5 scroll-mt-20">
          <div className="mb-6 px-1 md:px-2">
            <div className="flex items-center gap-3">
              <BookOpen className="text-blue-500" size={24} />
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Featured Projects</h2>
            </div>
            <p className="text-neutral-600 dark:text-neutral-500 text-sm mt-1">
              Showcasing my most ambitious full-stack and AI applications.
            </p>
          </div>
          <div className="relative">
            <motion.div 
              initial={false}
              animate={{ height: showAllProjects ? "auto" : 340 }}
              transition={{ type: "spring", stiffness: 100, damping: 22 }}
              className="overflow-hidden relative"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PORTFOLIO_CONTENT.projects.map((project, index) => (
                  <BentoCard key={project.title} delay={0.7 + index * 0.05}>
                    <ProjectCard project={project} />
                  </BentoCard>
                ))}
              </div>
            </motion.div>

            {/* Fold Gradient Overlay & Show More Button */}
            <AnimatePresence>
              {!showAllProjects && (
                <motion.div 
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute bottom-0 left-0 right-0 flex items-end justify-center pb-4 bg-gradient-to-t from-neutral-50 via-neutral-50/95 to-transparent dark:from-neutral-950 dark:via-neutral-950/95 z-20 h-32"
                >
                  <button
                    onClick={() => setShowAllProjects(true)}
                    className="group/btn flex items-center gap-2 px-6 py-3 rounded-full bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 font-semibold text-sm shadow-md hover:shadow-lg hover:bg-white/90 dark:hover:bg-neutral-900/90 hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:scale-105 transition-all duration-300 cursor-pointer"
                  >
                    <span>Show More Projects</span>
                    <ChevronDown size={16} className="text-neutral-500 group-hover/btn:text-blue-500 dark:group-hover/btn:text-blue-400 group-hover/btn:translate-y-0.5 transition-all duration-300" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Show Less Button (only visible when expanded) */}
          <AnimatePresence>
            {showAllProjects && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex justify-center mt-6"
              >
                <button
                  onClick={() => {
                    setShowAllProjects(false);
                    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="group/btn flex items-center gap-2 px-6 py-3 rounded-full bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 font-semibold text-sm shadow-md hover:shadow-lg hover:bg-white/90 dark:hover:bg-neutral-900/90 hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  <span>Show Less</span>
                  <ChevronDown size={16} className="rotate-180 text-neutral-500 group-hover/btn:text-blue-500 dark:group-hover/btn:text-blue-400 group-hover/btn:-translate-y-0.5 transition-all duration-300" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* === GITHUB CALENDAR SECTION === */}
        <div className="cv-auto">
          <GitHubCalendarComponent />
        </div>

        {/* === OPEN SOURCE SECTION === */}
        <OpenSourceSection />

        {/* === BLOG SECTION === */}
        <div className="mt-20 w-full mb-20 cv-auto">
          <div className="mb-8 px-4 md:px-6">
            <div className="flex items-center gap-3">
              <BookOpen className="text-emerald-500" size={24} />
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Blogs</h2>
            </div>
            <p className="text-neutral-600 dark:text-neutral-500 text-sm mt-1">Thought-provoking articles on technology and development.</p>
          </div>

          {loadingBlogs ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : blogs.length > 0 ? (
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <motion.div
                  initial={false}
                  animate={{ height: showAllBlogs ? "auto" : 340 }}
                  transition={{ type: "spring", stiffness: 100, damping: 22 }}
                  className="overflow-hidden relative"
                >
                  <div className="flex flex-col border-t border-neutral-200 dark:border-white/5">
                    {blogs.map((post, idx) => (
                      <motion.div
                        key={post.guid}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * idx }}
                      >
                        <BlogCard post={post} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Fold Gradient Overlay & Show More Button */}
                <AnimatePresence>
                  {!showAllBlogs && (
                    <motion.div
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute bottom-0 left-0 right-0 flex items-end justify-center pb-4 bg-gradient-to-t from-neutral-50 via-neutral-50/95 to-transparent dark:from-neutral-950 dark:via-neutral-950/95 z-20 h-32 pointer-events-none"
                    >
                      <button
                        onClick={() => setShowAllBlogs(true)}
                        className="group/btn flex items-center gap-2 px-6 py-3 rounded-full bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 font-semibold text-sm shadow-md hover:shadow-lg hover:bg-white/90 dark:hover:bg-neutral-900/90 hover:border-emerald-500/50 dark:hover:border-emerald-400/50 hover:scale-105 transition-all duration-300 cursor-pointer pointer-events-auto"
                      >
                        <span>Show More Articles</span>
                        <ChevronDown size={16} className="text-neutral-500 group-hover/btn:text-emerald-500 dark:group-hover/btn:text-emerald-400 group-hover/btn:translate-y-0.5 transition-all duration-300" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Show Less Button */}
              <AnimatePresence>
                {showAllBlogs && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="flex justify-center mt-6"
                  >
                    <button
                      onClick={() => setShowAllBlogs(false)}
                      className="group/btn flex items-center gap-2 px-6 py-3 rounded-full bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 font-semibold text-sm shadow-md hover:shadow-lg hover:bg-white/90 dark:hover:bg-neutral-900/90 hover:border-emerald-500/50 dark:hover:border-emerald-400/50 hover:scale-105 transition-all duration-300 cursor-pointer"
                    >
                      <span>Show Less</span>
                      <ChevronDown size={16} className="rotate-180 text-neutral-500 group-hover/btn:text-emerald-500 dark:group-hover/btn:text-emerald-400 group-hover/btn:-translate-y-0.5 transition-all duration-300" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="mx-4 md:mx-6 rounded-2xl border border-neutral-200 dark:border-white/10 bg-white/70 dark:bg-neutral-900/50 p-5 flex flex-col gap-2">
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                Unable to load Medium posts right now.
              </p>
              <a
                href={PORTFOLIO_CONTENT.mediumUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline w-fit"
              >
                Read on Medium
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-20 border-t border-neutral-200 dark:border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-neutral-500 text-sm">
            © {new Date().getFullYear()} Paras. All Rights Reserved.
          </p>
          <div className="flex gap-6 text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {PORTFOLIO_CONTENT.socials
              .filter((s) => s.label !== "Email")
              .map((link) => (
                <a key={link.label} href={link.href} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  {link.label}
                </a>
              ))}
          </div>
        </div>
      </div>
      <Suspense fallback={null}>
        <Oneko />
      </Suspense>
    </div>
  );
}
