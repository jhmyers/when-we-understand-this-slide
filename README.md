# When We Understand This Slide

The infamous 2009 PA Consulting **"Afghanistan Stability / COIN Dynamics"**
spaghetti diagram, rebuilt as an interactive causal map of **AI in higher
education and distributed IT** — a scroll-driven story site that constructs
the system one subsystem at a time, then hands you the full explorable mess.

- **107 nodes**, each mapped to its counterpart on the 2009 original
- **235 causal edges**, with the original's "significant delay" (‖) marks
- **5 guided feedback-loop tours** (the Shadow Spiral, the Policy Lag Loop,
  the Talent Drain, the Vendor Squeeze, and the one hopeful loop — the Trust
  Flywheel)
- Zero dependencies, no build step: plain HTML/CSS/ES modules

## Run it

Any static file server from the repo root, e.g.:

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
| `css/main.css` | Paper (2009 briefing) + dark (situation room) themes |
| `docs/superpowers/specs/` | Design spec |

**Phase 2 — the path forward — is deliberately unfinished.** That's the point,
and the next piece of work.
