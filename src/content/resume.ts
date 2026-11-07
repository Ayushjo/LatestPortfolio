import github from '../data/github.json';
import { experience, type Role } from './experience';
import { profile } from './profile';
import { projects, type Project } from './projects';

/**
 * Everything a résumé says, gathered in one place. The recruiter page, the generated PDF,
 * /resume.json and /llms.txt all read from here, so they can never disagree.
 */

const merged = github.prs.merged;
const freecadMerged = merged.filter((p) => p.repo === 'FreeCAD/FreeCAD').length;
const fmt = (n: number) => n.toLocaleString('en-US');

/** A role's small mark: the first image of its particle shape, if it has one. */
const logoOf = (r: Role) => (r.shape.startsWith('image:') ? r.shape.slice(6).split('|')[0] : undefined);

export interface ResumeRole extends Role {
  logo?: string;
}

export const resume = {
  name: profile.name,
  headline: 'Backend & systems engineer',
  stack: ['TypeScript', 'Node.js', 'Rust', 'Python'],
  // The status line already says I'm open to work, so the summary doesn't repeat it.
  summary: profile.bio.recruiter.replace(/\s*Open to opportunities\.?$/, ''),
  location: profile.location,
  timezone: { id: profile.timezone, label: 'IST', offset: 'UTC+5:30' },
  graduating: 'May 2028',

  availability: {
    open: true,
    roles: 'SDE internships & full-time roles',
    where: 'Remote',
    start: 'Available now',
  },

  contact: {
    email: profile.email,
    site: 'https://www.iayush.com',
    github: profile.links.github,
    linkedin: profile.links.linkedin,
    x: profile.links.twitter,
  },

  /** Served by the build (see scripts/resume-pdf.mjs). */
  pdf: '/ayush-singh-resume.pdf',

  /** The four numbers a skim should catch. */
  glance: [
    { value: '36k+', label: 'users on a platform I built and run' },
    { value: '~70k', label: 'req/s from my Rust proxy, ~1% off nginx' },
    { value: String(merged.length), label: `merged open-source PRs, ${freecadMerged} into FreeCAD` },
    { value: fmt(github.calendar.total), label: 'GitHub contributions this year' },
  ],

  work: experience.filter((r) => r.kind === 'work').map((r): ResumeRole => ({ ...r, logo: logoOf(r) })),
  education: experience.filter((r) => r.kind === 'education').map((r): ResumeRole => ({ ...r, logo: logoOf(r) })),

  /** Featured first, in the site's order. */
  projects: [...projects].sort((a, b) => Number(b.tier === 'featured') - Number(a.tier === 'featured')) as Project[],

  openSource: {
    merged,
    openCount: github.prs.open.length,
    contributions: github.calendar.total,
    snapshotAt: github.generatedAt,
  },

  skills: profile.skills,
};

export type Resume = typeof resume;
