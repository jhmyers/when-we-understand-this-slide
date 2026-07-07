// ============================================================================
// Boot: inject per-category colors, build the three graph instances
// (slide homage, story build, explorer), wire story + explorer UI.
// ============================================================================
import { categories } from './data.js';
import { CoinGraph } from './graph.js';
import { initStory } from './story.js';
import { initExplorer } from './panel.js';
import { redlineUrl, notifyUrl, REPO_URL } from './config.js';

// Per-category color custom properties, generated from the single source
// of truth in data.js.
(function injectCatColors() {
  const style = document.createElement('style');
  style.textContent = categories.map((c) => `
    .cat-${c.id} { --cat: ${c.color}; --cat-ink: ${c.ink}; }
  `).join('\n');
  document.head.appendChild(style);
})();

// Act 0 — the slide homage (paper theme, static, fully revealed)
const mini = new CoinGraph(document.getElementById('miniGraph'), {
  theme: 'paper', interactive: false, showRegions: true,
});
mini.revealAll();

// Slide legend replicating the original's legend box
(function buildSlideLegend() {
  const ul = document.getElementById('slideLegend');
  for (const c of categories) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="sl-swatch" style="background:${c.ink}"></span>${c.label}`;
    ul.appendChild(li);
  }
})();

// Act 2 — the pinned story build
const story = new CoinGraph(document.getElementById('storyGraph'), {
  theme: 'dark', interactive: false, showRegions: true,
});
initStory(story);

// Act 3 — the explorer
let explorerApi;
const explorer = new CoinGraph(document.getElementById('exploreGraph'), {
  theme: 'dark', interactive: true, showRegions: true,
  onNodeClick: (n) => explorerApi.openNode(n),
  onBackgroundClick: () => explorerApi.closePanel(),
});
explorer.revealAll();
explorerApi = initExplorer(explorer);

// Act 4 — follow + redline calls to action
document.getElementById('notifyBtn').href = notifyUrl();
document.getElementById('redlineBtn').href = redlineUrl(null);
document.getElementById('ghIssueBtn').href = `${REPO_URL}/issues/new`;
