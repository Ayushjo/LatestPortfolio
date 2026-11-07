import { resume } from '../content/resume';

/**
 * /llms.txt (https://llmstxt.org): a plain-text brief for AI assistants and recruiting agents,
 * so a question like "who is Ayush Singh and is he a fit?" gets the real facts.
 */
export function GET() {
  const r = resume;
  const lines = [
    `# ${r.name}`,
    '',
    `> ${r.headline} (${r.stack.join(', ')}). ${r.summary}`,
    '',
    `- Open to: ${r.availability.roles}, ${r.availability.where.toLowerCase()} (${r.timezone.label}, ${r.timezone.offset}). ${r.availability.start}.`,
    `- Based in ${r.location}; B.Tech ECE at ${r.education[0]?.company}, graduating ${r.graduating}.`,
    `- Contact: ${r.contact.email} · GitHub ${r.contact.github} · LinkedIn ${r.contact.linkedin}`,
    '',
    '## Résumé',
    '',
    `- [Résumé page](${r.contact.site}/resume): the full résumé, readable without JavaScript`,
    `- [Résumé PDF](${r.contact.site}${r.pdf}): two-page A4`,
    `- [resume.json](${r.contact.site}/resume.json): JSON Resume format`,
    '',
    '## At a glance',
    '',
    ...r.glance.map((g) => `- ${g.value} ${g.label}`),
    '',
    '## Experience',
    '',
    ...r.work.flatMap((w) => [
      `### ${w.company} — ${w.title} (${w.period})`,
      '',
      ...(w.product ? [w.product, ''] : []),
      ...w.points.map((p) => `- ${p}`),
      '',
    ]),
    '## Projects',
    '',
    ...r.projects.map(
      (p) =>
        `- **${p.name}**: ${p.tagline} ${p.metrics.join('; ')}.${p.links[0] ? ` ${p.links[0].href}` : ''}`,
    ),
    '',
    '## Open source',
    '',
    ...r.openSource.merged.map((p) => `- ${p.repo}#${p.number}: ${p.title} (+${p.additions} −${p.deletions}) ${p.url}`),
    `- ${r.openSource.openCount} more pull requests in review.`,
    '',
    '## Skills',
    '',
    ...Object.entries(r.skills).map(([group, list]) => `- ${group}: ${list.join(', ')}`),
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
