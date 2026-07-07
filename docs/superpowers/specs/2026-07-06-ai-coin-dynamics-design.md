# When We Understand This Slide — AI / Higher-Ed Dynamics

**Design spec — 2026-07-06**

## Concept

An interactive story website that recreates the infamous 2009 PA Consulting
"Afghanistan Stability / COIN Dynamics" causal-loop diagram as an analogy for
the state of AI adoption in higher education and distributed IT. The central
argument: the slide became a punchline, but it was *accurate* — and if you drew
the honest diagram of AI on a university campus today, it would look exactly
like it. Understanding the system is the precondition for fixing it.

- **Audience:** university leadership / CIOs and the broader higher-ed IT
  community (EDUCAUSE-type). Persuasion piece, shareable.
- **Tone:** wry but constructive. Everyone in the diagram is a rational actor
  in a bad system. Safe to share with leadership.
- **Specificity:** generic "the university" — archetypal roles any institution
  recognizes. A few real stats cited in narrative prose for credibility
  (56% shadow-AI usage, 39% AUP adoption, EDUCAUSE visibility findings).
- **Visual identity:** military-briefing editorial. Opens looking like the
  2009 PowerPoint (beige slide, Arial, "Page 22", "WORKING DRAFT — V3"),
  then transforms into a dark modern editorial interactive. The
  transformation is itself the narrative turn.

## Site structure (single page, five acts)

1. **Act 0 — Kabul, 2009 (cold open).** Faithful beige-slide homage with a
   miniature abstracted rendering of the original diagram. The McChrystal
   quote ("When we understand that slide, we'll have won the war") lands as
   the hero moment.
2. **Act 1 — The turn.** The slide was mocked as the worst PowerPoint ever
   made. The uncomfortable part: it was correct. Pivot line: "Now look at
   your university." Visual theme transforms beige → dark editorial.
3. **Act 2 — The build.** Scroll-driven pinned graph that constructs the
   higher-ed AI diagram subsystem by subsystem (mirroring how the original
   was actually presented as an hour-long build). Each step card introduces
   one category, names its COIN counterpart, and fades in its nodes and
   intra-cluster edges; cross-cluster edges accumulate as chaos accretes.
4. **Act 3 — The full map.** Full-viewport interactive explorer: pan/zoom,
   hover highlights a node's neighborhood, click opens a detail panel
   (description, COIN counterpart, influences in/out, loops it belongs to),
   category legend filters, search, and guided "feedback loop tours" that
   animate famous loops.
5. **Act 4 — The path forward (Phase 2 teaser).** "When we understand this
   slide…" closing beat. Placeholder section for the Phase 2 path-forward
   content the user will co-author.

## The mapping (8 categories, matching the original legend)

| Original (color) | Higher-ed AI equivalent |
|---|---|
| Population / Popular Support (dark green) | **Campus community** — faculty, students, staff: trust & adoption. Includes the iconic 5-box center spine: Champions → Sympathetic → On the Fence → Shadow-leaning → Fully Outside. |
| Infrastructure, Economy & Services (light green) | **Academic core** — teaching, research, student services, LMS, research computing. |
| Government (light blue) | **Governance** — central admin/senate policy AND the "Tribal Governance" region → **distributed/college IT** and local unit norms. |
| Afghanistan Security Forces (dark blue) | **Central IT** — tactical (service desk, security ops, vetting) and institutional (architecture, staffing, funding). |
| Insurgents (red) | **Shadow AI** — unsanctioned tools, personal accounts, dept SaaS. |
| Crime & Narcotics (orange) | **Vendor sprawl** — edtech gold rush, free-pilot seeding, procurement bypass. |
| Coalition Forces & Actions (black) | **Institutional AI initiatives** — task forces, strategy, budgets, leadership attention, consultants; board/legislature support as "domestic support." |
| Physical Environment (brown) | **Technology substrate** — pace of model change, compute costs, consumer-tool ubiquity: terrain nobody controls. |

### Featured feedback loops (tourable)

1. **The Shadow Spiral** (reinforcing): slow vetting → weak sanctioned tools →
   shadow adoption → incidents → tighter controls → slower vetting.
2. **The Policy Lag Loop**: tech pace → policy obsolete on arrival → uneven
   enforcement → perceived unfairness → noncompliance → stricter policy →
   longer committee cycles (heavy delay marks).
3. **The Talent Drain**: industry salaries → IT attrition → less capacity →
   worse offerings → more shadow use → more incidents → burnout → attrition.
4. **The Vendor Squeeze**: FOMO buying → duplicated spend → fragmented budget
   → underfunded central platforms → weak central offering → more unit buying.
5. **The Trust Flywheel** (balancing/hopeful): visible wins → trust →
   disclosure → visibility → better support → more wins. Seeds Phase 2.

## Data model

`js/data.js` exports:

- `categories`: 8 entries `{ id, label, coinLabel, color }`.
- `nodes` (~90): `{ id, label, cat, x, y, size?, desc, coin }` — coordinates
  hand-authored in a 2000×1150 layout space that echoes the original
  diagram's spatial arrangement (Central IT top-left, initiatives far-left,
  community center-right, shadow AI top-right, vendors right, academic core
  bottom-right, governance center-left, substrate at edges). The adoption
  spectrum is a distinct 5-node spine rendered as boxes.
- `edges` (~180): `{ from, to, delay? }` — delay renders the original's ‖
  hash marks.
- `loops`: named loops with node/edge sequences, type
  (reinforcing/balancing), and one-line story.
- `steps`: Act 2 scroll steps `{ id, title, coinChip, body, reveal }`.

## Technical approach

Zero-dependency static site — plain HTML/CSS/ES modules, no build step, no
framework. Deployable anywhere (GitHub Pages, S3, campus web space).

- `index.html` — all narrative markup.
- `css/main.css` — both themes (beige briefing + dark editorial), typography,
  panel/legend components, responsive rules.
- `js/graph.js` — SVG graph engine: curved bezier edges with arrowheads and
  delay hashes, category-colored labels, pan/zoom (pointer events + wheel),
  hover neighborhood highlighting, click → event, per-cluster reveal API.
  Two instances: pinned Act-2 canvas and Act-3 explorer (same engine).
- `js/story.js` — IntersectionObserver scroll engine driving Act 2 reveals
  and the Act 0→1 theme transformation.
- `js/panel.js` — node detail panel + search + filters + loop tours.
- `js/main.js` — boot.

Rationale for hand-authored layout over force-direction: the original's
*specific* composed chaos is the icon being quoted; force layouts produce
generic hairballs and destroy the deliberate regional geography.

Alternatives considered: (a) D3 + Svelte/React + Vite — richer tooling but
adds toolchain weight for no capability we need at ~90 SVG nodes; (b) canvas
rendering — needed only above ~1k nodes, loses crisp text and DOM
accessibility. Chosen: vanilla SVG.

## Error handling / accessibility / performance

- Graph nodes are focusable (`tabindex`), Enter opens the panel; panel is
  `aria-live`. Reduced-motion media query disables build animations (steps
  snap instead).
- Mobile: explorer remains pan/zoomable; step cards stack full-width; a
  "best on a larger screen" note is acceptable for v1.
- ~90 nodes / ~180 SVG paths is trivial render load; no perf work needed.

## Testing

Manual browser verification via preview server: each act renders, scroll
build fires in order, hover/click/search/filters/loop tours work, no console
errors, mobile viewport degrades gracefully. (No JS test framework for v1 —
this is a content artifact; logic worth unit-testing later is confined to
graph.js geometry helpers.)

## Phase 2 (explicitly out of scope for this build)

The "path forward" content — co-authored with the user. The site ships with
a designed teaser section that frames it.
