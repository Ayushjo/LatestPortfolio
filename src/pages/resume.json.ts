import { resume } from '../content/resume';

/**
 * The résumé in the JSON Resume format (https://jsonresume.org/schema), so recruiting tools and
 * importers can read it without scraping the page.
 */

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** "Jul 2026 — Present" → { startDate: "2026-07" } ; "Jun 2026 — Jul 2026" → both ends. */
function dates(period: string): { startDate?: string; endDate?: string } {
  const [start, end] = period.split(/\s*[—–-]\s*/);
  const iso = (s?: string) => {
    const m = s?.trim().match(/^([A-Za-z]{3})[a-z]*\s+(\d{4})$/);
    if (!m) return undefined;
    const month = MONTHS.indexOf(m[1]!.toLowerCase()) + 1;
    return month ? `${m[2]}-${String(month).padStart(2, '0')}` : undefined;
  };
  return { startDate: iso(start), endDate: iso(end) };
}

export function GET() {
  const body = {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
    basics: {
      name: resume.name,
      label: `${resume.headline} — ${resume.stack.join(', ')}`,
      email: resume.contact.email,
      url: resume.contact.site,
      summary: resume.summary,
      location: { city: 'Naya Raipur', region: 'Chhattisgarh', countryCode: 'IN' },
      profiles: [
        { network: 'GitHub', username: 'Ayushjo', url: resume.contact.github },
        { network: 'LinkedIn', url: resume.contact.linkedin },
        { network: 'X', url: resume.contact.x },
      ],
    },
    work: resume.work.map((r) => ({
      name: r.company,
      position: r.title,
      description: r.product,
      summary: r.summary,
      highlights: r.points,
      url: r.links?.[0]?.href,
      ...dates(r.period),
    })),
    education: resume.education.map((r) => {
      const [studyType, area] = r.title.split(/,\s*/);
      return { institution: r.company, studyType, area, ...dates(r.period) };
    }),
    projects: resume.projects.map((p) => ({
      name: p.name,
      description: p.tagline,
      highlights: p.metrics,
      keywords: p.tags,
      url: p.links[0]?.href,
      roles: p.role ? [p.role] : undefined,
    })),
    skills: Object.entries(resume.skills).map(([name, keywords]) => ({ name, keywords })),
    meta: {
      canonical: `${resume.contact.site}/resume.json`,
      lastModified: resume.openSource.snapshotAt,
      availability: resume.availability,
      leadership: resume.education.flatMap((r) => (r.product ? [`${r.product}, ${r.company}`] : [])),
      openSource: resume.openSource.merged.map((p) => ({
        repository: p.repo,
        title: p.title,
        url: p.url,
        mergedAt: p.mergedAt,
        additions: p.additions,
        deletions: p.deletions,
      })),
    },
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
