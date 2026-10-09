#!/usr/bin/env node
// Snapshots the GitHub data the site needs into src/data/github.json, so builds never
// need a token. Run `pnpm data` before a deploy to refresh it.
// Auth: GITHUB_TOKEN, or the local `gh` CLI login.
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const USER = 'Ayushjo';
/** Collaborations that are really team projects, not open-source contributions. */
const NOT_OSS = new Set(['fahmmin/sahaayak-ai']);
const SPOTLIGHT = 'FreeCAD/FreeCAD';
const OUT = posix.join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'github.json');

const token = process.env.GITHUB_TOKEN || execSync('gh auth token', { encoding: 'utf8' }).trim();
const headers = { Authorization: `Bearer ${token}`, 'User-Agent': 'portfolio-data', Accept: 'application/vnd.github+json' };

async function rest(path) {
  const res = await fetch(`https://api.github.com/${path}`, { headers });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return { body: await res.json(), link: res.headers.get('link') };
}

async function graphql(query, variables = {}) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function calendar() {
  const data = await graphql(
    `query($login: String!) { user(login: $login) { contributionsCollection { contributionCalendar {
      totalContributions weeks { contributionDays { date contributionCount } } } } } }`,
    { login: USER },
  );
  const cal = data.user.contributionsCollection.contributionCalendar;
  const days = cal.weeks.flatMap((w) => w.contributionDays);
  let streak = 0;
  let best = 0;
  for (const d of days) {
    streak = d.contributionCount > 0 ? streak + 1 : 0;
    best = Math.max(best, streak);
  }
  return {
    total: cal.totalContributions,
    activeDays: days.filter((d) => d.contributionCount > 0).length,
    bestDay: Math.max(...days.map((d) => d.contributionCount)),
    longestStreak: best,
    start: days[0].date,
    weeks: cal.weeks.map((w) => w.contributionDays.map((d) => d.contributionCount)),
    firstWeekday: new Date(days[0].date + 'T00:00:00Z').getUTCDay(),
  };
}

async function pullRequests() {
  const search = async (q) =>
    (await rest(`search/issues?q=${encodeURIComponent(q)}&per_page=100`)).body.items.filter((i) => {
      const repo = i.repository_url.split('/repos/')[1];
      return !repo.startsWith(`${USER}/`) && !NOT_OSS.has(repo);
    });

  const merged = [];
  for (const item of await search(`author:${USER} type:pr is:merged`)) {
    const repo = item.repository_url.split('/repos/')[1];
    const { body: pr } = await rest(`repos/${repo}/pulls/${item.number}`);
    const { body: files } = await rest(`repos/${repo}/pulls/${item.number}/files`);
    merged.push({
      repo,
      number: pr.number,
      title: pr.title,
      url: pr.html_url,
      mergedAt: pr.merged_at,
      mergedBy: pr.merged_by?.login ?? null,
      additions: pr.additions,
      deletions: pr.deletions,
      files: files.map((f) => f.filename),
      reviewComments: pr.comments + pr.review_comments,
    });
  }
  merged.sort((a, b) => a.mergedAt.localeCompare(b.mergedAt));

  const open = (await search(`author:${USER} type:pr is:open`)).map((i) => ({
    repo: i.repository_url.split('/repos/')[1],
    number: i.number,
    title: i.title,
    url: i.html_url,
    createdAt: i.created_at,
  }));
  return { merged, open };
}

/** The spotlight repo's file tree, aggregated to file counts per directory. */
async function spotlight(changedPaths) {
  const { body: repo } = await rest(`repos/${SPOTLIGHT}`);
  const { body: tree } = await rest(`repos/${SPOTLIGHT}/git/trees/${repo.default_branch}?recursive=1`);
  const { link } = await rest(`repos/${SPOTLIGHT}/contributors?per_page=1&anon=1`);
  const contributors = Number(/page=(\d+)>; rel="last"/.exec(link ?? '')?.[1] ?? 0);
  const counts = new Map();
  let files = 0;
  for (const e of tree.tree) {
    if (e.type !== 'blob') continue;
    files++;
    const dir = posix.dirname(e.path);
    counts.set(dir, (counts.get(dir) ?? 0) + 1);
  }
  return {
    repo: SPOTLIGHT,
    files,
    stars: repo.stargazers_count,
    contributors,
    truncated: tree.truncated,
    dirs: [...counts].sort((a, b) => a[0].localeCompare(b[0])),
    changed: changedPaths,
  };
}

const prs = await pullRequests();
const data = {
  generatedAt: new Date().toISOString(),
  user: USER,
  calendar: await calendar(),
  prs,
  spotlight: await spotlight(prs.merged.filter((p) => p.repo === SPOTLIGHT).flatMap((p) => p.files)),
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(data));
console.log(
  `github.json: ${data.calendar.total} contributions, ${prs.merged.length} merged / ${prs.open.length} open PRs, ` +
    `${data.spotlight.files} ${SPOTLIGHT} files in ${data.spotlight.dirs.length} dirs`,
);
