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

**Adding a project:** add it to `src/content/projects.ts` (array order is display order), then add a drawer with the same slug to `SHAPES` in `src/gl/shapes/projectShapes.ts`. Anything drawn in white on that canvas becomes particles; sparser fill patterns (`tone()`) read as dimmer silver.
