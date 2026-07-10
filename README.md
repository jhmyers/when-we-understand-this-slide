# When We Understand This Slide

**Live site: <https://jhmyers.github.io/when-we-understand-this-slide/>**

The infamous 2009 PA Consulting **"Afghanistan Stability / COIN Dynamics"**
spaghetti diagram, rebuilt as an interactive causal map of **AI in higher
education and distributed IT** — a scroll-driven story site that constructs
the system one subsystem at a time, then hands you the full explorable mess.

- **107 nodes**, each mapped to its counterpart on the 2009 original
- **233 causal edges**, with the original's "significant delay" (‖) marks
- **5 guided feedback-loop tours** (the Shadow Spiral, the Policy Lag Loop,
  the Talent Drain, the Vendor Squeeze, and the one hopeful loop — the Trust
  Flywheel)
- Zero dependencies, no build step: plain HTML/CSS/ES modules

## How this was built

Built with **Claude Fable 5** (Anthropic), starting from a single image of the
2009 slide and the prompt below — then iterated on, fact-checked, and redlined
by a human. An AI drew V3; humans write V4. On a project about shadow AI,
disclosing the AI seemed like the least we could do.

<details>
<summary><strong>Exhibit A — the originating prompt, verbatim</strong></summary>

> This is a clean build ideation. You will need help from me with content, but
> for a first pass I want you to go as far as you can: take this analogy and
> help me see the correlations, then present it as a dynamic, interactive
> website.
>
> Do not use any of your prebaked templates. Do research on design frameworks
> and look for unique ways to present this as a fully interactive website few
> have ever seen.
>
> Context: This is a graphic that has become iconic, as it signals the
> internal chaos that was the United States' efforts in the Afghanistan war.
> I see a significant similarity between this and the state of AI in higher
> education — and distributed IT specifically.
>
> What I want:
> 1. Map out every aspect of how AI relates to something similar to what that
>    graphic shows.
> 2. Recreate the graphic as a web UI with clickable nodes and interactivity.
> 3. Build it out as a story website. Don't cheap out — it should be fully
>    dynamic and polished.
>
> Phase 2: Then comes the hard part: we need to offer a path forward. I will
> help with this part.
>
> Process: Make the plan and run the plan. Let me know when you have something
> to look at. You can ask me a few questions before you build, but do your
> homework first.

</details>

Design decisions worth knowing: the layout is **hand-authored, not
force-directed** — the original's specific composed chaos is the icon being
quoted, and force layouts produce generic hairballs. And it's deliberately
**zero-dependency** (no framework, no build step) so it can be deployed to any
static host, including campus web space.

## Redline it

The site's whole ask is that people who live on this map correct it. Two ways in:

- **[Redline the map](https://docs.google.com/forms/d/e/1FAIpQLSfOybs33OG9eHM8bSLjvrsoBd3_mVWVs27Vu0be1-9NQT64RQ/viewform)** —
  which node is missing, which arrow points the wrong way, which loop you live
  in that isn't named. (Clicking any node on the site pre-fills the form.)
- **[Open an issue](../../issues/new)** or a PR — the map content is all in
  `js/data.js`; a node is ~5 lines.

The best redlines ship in V4, and
**[you can follow the draft](https://forms.gle/3bCtfcpXiJd2ahSV6)** to hear
when it does.

## Run it locally

Any static file server from the repo root (ES modules won't load from
`file://`):

```
npx serve .
```

## Structure

| Path | What |
|---|---|
| `index.html` | The five-act narrative |
| `js/data.js` | The map itself — nodes, edges, loops, story steps (edit content here) |
| `js/graph.js` | Bespoke SVG causal-map engine (two themes, pan/zoom, tours) |
| `js/story.js` | Scroll engine: theme turn + pinned progressive build |
| `js/panel.js` | Explorer UI: detail panel, filters, search, loop tours |
| `js/config.js` | Deployment config: form URLs, repo URL — the only file to touch to go live |
| `css/main.css` | Paper (2009 briefing) + dark (situation room) themes |
| `assets/og-card.png` | Social share card (2400×1260) |
| `docs/superpowers/specs/` | Design spec |

## Sources

The stats cited on the site, with the receipts:

- 56% of higher-ed employees use AI tools their institution doesn't provide —
  [EDUCAUSE, *The Impact of AI on Work in Higher Education*, 2026](https://www.educause.edu/research/2026/the-impact-of-ai-on-work-in-higher-education)
- 39% of institutions have an AI acceptable-use policy, up from 23% —
  [2025 EDUCAUSE AI Landscape Study](https://library.educause.edu/resources/2025/2/2025-educause-ai-landscape-study)
- "Every area of the institution is already using AI products" —
  [EDUCAUSE QuickPoll: AI-Related Procurement, May 2025](https://er.educause.edu/articles/2025/5/educause-quickpoll-results-ai-related-procurement)
- The original slide and the McChrystal quote —
  [Bumiller, "We Have Met the Enemy and He Is PowerPoint," *The New York Times*, Apr 26, 2010](https://www.nytimes.com/2010/04/27/world/27powerpoint.html)

## Status

**Phase 2 — the path forward — is deliberately unfinished.** That's the point,
and the next piece of work: not another diagram of the problem, but an honest
sequence of moves, drafted with people who live on this map.

---

Drawn by [Jake Myers](https://www.linkedin.com/in/jake-myers/) · with Claude
Fable 5 · a working draft, like everything else on this page.
