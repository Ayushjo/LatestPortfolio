# The Data Stream — Ayush Singh's portfolio

A WebGPU particle portfolio. ~262k silver particles carry the whole page:

1. They stream across the hero as strands of light, form **AYUSH**, and morph into **SYSTEMS ENGINEER**.
2. On scroll they become one signature shape per stop, in this order:
   - each project
   - a fork
   - your experience
   - FreeCAD's real file tree
   - each open-source fix
   - your contribution calendar
   - your email

A three-stop slider switches between **Immersive**, **Casual** (lighter graphics, friendlier copy) and **Recruiter** (no WebGL; a clean, printable résumé).

```bash
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # type-check + static build into dist/
pnpm data         # refresh src/data/github.json from GitHub
swift scripts/og.swift   # re-render public/og.png
```

Add `?debug` to the URL for a live tweak panel of every shader uniform, or `?gl=webgl` to force the WebGL2 fallback.

## How it fits together

- **Beats.** Any element with `data-beat="<key>"` is a stop on the scroll path. `src/scripts/scroll.ts` turns scroll position into one fractional beat index. `src/gl/scenes/StreamScene.ts` morphs the particles from beat *k*'s shape to beat *k+1*'s.
- **Beat keys** (resolved in `src/gl/shapes/index.ts`):

  | Key | What the particles form |
  |---|---|
  | `<slug>` | a project shape |
  | `exp:<id>` | an experience shape |
  | `oss:<id>` | an open-source shape |
  | `calendar` | the contribution calendar |
  | `fork` | the Y-shaped fork |
  | `frame` | the demo-video frame |
  | `text:<line\|line>` | heavy display text |
  | `serif:<line\|line>` | Instrument Serif text |
  | `stream` | nothing; the particles flow free |

- **Shape side.** `data-side` (`left`, `right` or `center`) places the shape opposite its text. On tall screens shapes always sit above the text.

| Path | What lives there |
| --- | --- |
| `src/content/` | All copy and data: profile (three tone variants), projects, experience, open-source stories |
| `src/data/github.json` | Committed GitHub snapshot: PRs, contribution calendar, FreeCAD tree |
| `src/components/` | Sections: Hero, Work, Fork, MoreWork, Experience, OpenSource, Activity, Writing, Contact, Rail, RecruiterView |
| `src/scripts/` | Mode state, slider, scroll/beats, rail, demos, calendar readout, boot |
| `src/gl/` | Framework-free WebGL: renderer, quality tiers, particles (TSL compute + material), shapes, post (bloom → Bayer dither → grain/CA/vignette), demo video plane |
| `src/writing/` | Blog posts (Markdown) |

## Adding things

- **Project.** Add it to `src/content/projects.ts`; array order is display order, and `tier: 'featured' | 'more'` decides between a full chapter and the "More work" grid. Then draw its shape under the same slug in `src/gl/shapes/projects.ts`. Anything drawn in white becomes particles; sparser `tone()` fills read as dimmer silver.
- **Experience.** Add it to `src/content/experience.ts`, with an `exp:<id>` shape in `src/gl/shapes/experience.ts`.
- **Open-source PR.** Run `pnpm data`, then add its story to `src/content/oss.ts`.
- **Blog post.** Create `src/writing/<slug>.md` with `title`, `date`, `summary`, `tags` and `draft`. Drafts show only in `pnpm dev`. The home page's Writing section appears once a post is published.

## Demo videos

A project with a `demo` plays it *inside the particles*. On wide screens, once a chapter has been held for about 1.5 s (or the visitor presses **▶ Demo**), the shape morphs into a glowing frame and the clip fades in. It's silver by default, and full colour on hover. Phones get an inline video in the panel instead.

Drop `public/demos/<slug>.mp4` (and optionally `<slug>.jpg` as the poster frame) and rebuild; the site picks it up automatically. An explicit `demo` field in `src/content/projects.ts` overrides that.

To record clips, paste the prompt in [`docs/demo-video-prompt.md`](docs/demo-video-prompt.md) into Claude Code inside each project's folder.

**Recording spec:**
- An 8–15 s silent loop.
- 16:10 at 1600×1000.
- H.264 MP4, ideally ≤ 3 MB. To compress: `ffmpeg -i in.mov -vf scale=1600:-2 -c:v libx264 -crf 28 -an -movflags +faststart out.mp4`
- Start and end on similar frames so the loop is seamless.

Ideas: Sahaayak (a cut from the YouTube demo), Pullwright's live dashboard, DiskMap drilling down the treemap, Relay/Strata benchmark runs in a terminal (VHS or asciinema), BelieveMeGuys mirroring a fill.

## Deploy

The site is static, and `vercel.json` sets caching and security headers.

1. Run `pnpm data` so the GitHub snapshot is fresh.
2. Push to a repo connected to Vercel, or run `vercel --prod`.
3. Point iayush.com at it.
