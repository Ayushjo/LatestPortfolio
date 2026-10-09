# The Data Stream — Ayush Singh's portfolio

A WebGPU particle portfolio. ~262k particles stream across the screen as strands of light, pour into **AYUSH**, morph into **SYSTEMS ENGINEER**, and on scroll funnel into an orbiting disc. The disc then releases into one signature shape per project (an agent constellation, a git graph, a treemap, an LSM pyramid…), morphing chapter to chapter beside each project's story.

A three-stop slider switches between **Immersive**, **Casual** (lighter graphics, friendlier copy) and **Recruiter** (no WebGL, a clean printable résumé).

```bash
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # type-check + static build into dist/
```

Add `?debug` to the URL for a live tweak panel of every shader uniform. Add `?gl=webgl` to force the WebGL2 fallback.

## Layout

| Path | What lives there |
| --- | --- |
| `src/content/` | All copy and data: profile (with three tone variants per line), projects, experience |
| `src/components/` | Astro markup: hero, mode slider, recruiter view, `Tone` text swapper |
| `src/scripts/` | Mode state + persistence, slider interaction, Lenis/ScrollTrigger, boot logic |
| `src/gl/` | Framework-free WebGL: renderer, quality tiers, input, scenes, particles (TSL compute + material), text sampling, post (bloom → Bayer dither → grain/CA/vignette) |

## Demo videos

A project with a `demo` plays it *inside the particles*. On wide screens, once a chapter has been held for about 1.5 s (or the visitor presses **▶ Demo**), the shape morphs into a glowing frame and the clip fades in. It's silver by default, and full colour on hover. Phones get an inline video in the panel instead.

1. Drop the files in `public/demos/<slug>.mp4` and `public/demos/<slug>.jpg` (the poster frame).
2. Add the clip to the project in `src/content/projects.ts`:

   ```ts
   demo: { src: '/demos/<slug>.mp4', poster: '/demos/<slug>.jpg' }
   ```

**Recording spec:**
- An 8–15 s silent loop.
- 16:10 at 1600×1000.
- H.264 MP4, ideally ≤ 3 MB. To compress: `ffmpeg -i in.mov -vf scale=1600:-2 -c:v libx264 -crf 28 -an -movflags +faststart out.mp4`
- Start and end on similar frames so the loop is seamless.

Ideas: Sahaayak (a cut from the YouTube demo), Pullwright's live dashboard, DiskMap drilling down the treemap, Relay/Strata benchmark runs in a terminal (VHS or asciinema), BelieveMeGuys mirroring a fill.

## GitHub data

`pnpm data` refreshes `src/data/github.json` (PRs, contribution calendar, FreeCAD tree). It uses `GITHUB_TOKEN`, or your `gh` login. The snapshot is committed, so builds never need a token; run it before deploying.

**Adding a project:** add it to `src/content/projects.ts` (array order is display order), then add a drawer with the same slug to `SHAPES` in `src/gl/shapes/projectShapes.ts`. Anything drawn in white on that canvas becomes particles; sparser fill patterns (`tone()`) read as dimmer silver.
