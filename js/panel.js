// ============================================================================
// Explorer UI: node detail panel, category legend/filters, search, loop tours.
// ============================================================================
import { categories, catById, nodes, loops } from './data.js';

export function initExplorer(graph) {
  const panel = document.getElementById('detailPanel');
  const loopCard = document.getElementById('loopCard');
  const searchInput = document.getElementById('searchInput');
  const searchCount = document.getElementById('searchCount');
  let activeFilter = null;
  let activeLoop = null;

  // ── Detail panel ────────────────────────────────────────────────────────
  function openNode(n) {
    exitLoop(false);
    graph.selectNode(n.id);
    const cat = catById[n.cat];
    document.getElementById('panelCat').textContent = cat.label.toUpperCase();
    document.getElementById('panelCat').style.color = cat.color;
    document.getElementById('panelTitle').textContent = n.label;
    document.getElementById('panelCoin').textContent = `IN THE 2009 ORIGINAL: ${n.coin.toUpperCase()}`;
    document.getElementById('panelDesc').textContent = n.desc;

    const { into, outof } = graph.neighborsOf(n.id);
    fillFlow('panelIn', into);
    fillFlow('panelOut', outof);

    const inLoops = loops.filter((l) => l.nodes.includes(n.id));
    const pl = document.getElementById('panelLoops');
    pl.innerHTML = inLoops.length
      ? `<h4 class="mono">APPEARS IN</h4>` + inLoops.map((l) =>
          `<button class="loop-pill mono" data-loop="${l.id}">↻ ${l.title}</button>`).join('')
      : '';
    pl.querySelectorAll('[data-loop]').forEach((b) =>
      b.addEventListener('click', () => startLoop(b.dataset.loop)));

    panel.hidden = false;
  }

  function fillFlow(listId, arr) {
    const ul = document.getElementById(listId);
    ul.innerHTML = '';
    if (!arr.length) {
      ul.innerHTML = '<li class="flow-none mono">— none mapped —</li>';
      return;
    }
    for (const m of arr) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.className = 'flow-link';
      b.innerHTML = `<span class="flow-dot" style="--c:${catById[m.cat].color}"></span>${m.label}`;
      b.addEventListener('click', () => openNode(m));
      li.appendChild(b);
      ul.appendChild(li);
    }
  }

  function closePanel() {
    panel.hidden = true;
    if (!activeLoop) { graph.mode = 'normal'; graph.clearAllModes(); }
  }

  document.getElementById('panelClose').addEventListener('click', closePanel);

  // ── Loop tours ──────────────────────────────────────────────────────────
  const loopButtons = document.getElementById('loopButtons');
  for (const l of loops) {
    const b = document.createElement('button');
    b.className = `loop-btn mono kind-${l.kind}`;
    b.dataset.loop = l.id;
    b.innerHTML = `↻ ${l.title.toUpperCase()} <span class="loop-kind-tag">${l.kind === 'reinforcing' ? 'R' : 'B'}</span>`;
    b.addEventListener('click', () => startLoop(l.id));
    loopButtons.appendChild(b);
  }

  function startLoop(id) {
    const l = loops.find((x) => x.id === id);
    if (!l) return;
    panel.hidden = true;
    activeLoop = l;
    graph.showLoop(l);
    document.getElementById('loopKind').textContent =
      l.kind === 'reinforcing' ? '↻ REINFORCING LOOP — IT FEEDS ITSELF' : '⇄ BALANCING LOOP — THE ONE THAT HELPS';
    document.getElementById('loopTitle').textContent = l.title;
    document.getElementById('loopStory').textContent = l.story;
    loopCard.hidden = false;
    loopButtons.querySelectorAll('.loop-btn').forEach((b) =>
      b.classList.toggle('active', b.dataset.loop === id));
    loopCard.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function exitLoop(refocus = true) {
    if (!activeLoop) return;
    activeLoop = null;
    loopCard.hidden = true;
    graph.clearAllModes();
    loopButtons.querySelectorAll('.loop-btn').forEach((b) => b.classList.remove('active'));
    if (refocus) graph.focusAll();
  }

  document.getElementById('loopClose').addEventListener('click', () => exitLoop());

  // Inline loop links elsewhere on the page (Act 4)
  document.querySelectorAll('.inline-loop-link').forEach((b) =>
    b.addEventListener('click', () => {
      document.getElementById('explore').scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => startLoop(b.dataset.loop), 700);
    }));

  // ── Legend / category filters ───────────────────────────────────────────
  const legend = document.getElementById('exploreLegend');
  for (const c of categories) {
    const count = nodes.filter((n) => n.cat === c.id).length;
    const b = document.createElement('button');
    b.className = 'legend-chip mono';
    b.dataset.cat = c.id;
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = `<span class="legend-dot" style="--c:${c.color}"></span>${c.label}
      <span class="legend-coin">= ${c.coin}</span><span class="legend-count">${count}</span>`;
    b.addEventListener('click', () => {
      exitLoop(false);
      closeSearch();
      activeFilter = activeFilter === c.id ? null : c.id;
      graph.setFilter(activeFilter);
      legend.querySelectorAll('.legend-chip').forEach((x) => {
        const on = x.dataset.cat === activeFilter;
        x.classList.toggle('active', on);
        x.setAttribute('aria-pressed', String(on));
      });
      if (activeFilter) graph.focusCats([activeFilter]);
      else graph.focusAll();
    });
    legend.appendChild(b);
  }

  // ── Search ──────────────────────────────────────────────────────────────
  function closeSearch() {
    if (searchInput.value) { searchInput.value = ''; searchCount.textContent = ''; }
  }
  searchInput.addEventListener('input', () => {
    exitLoop(false);
    activeFilter = null;
    legend.querySelectorAll('.legend-chip').forEach((x) => x.classList.remove('active'));
    const hits = graph.setSearch(searchInput.value);
    searchCount.textContent = searchInput.value.trim()
      ? `${hits.length} node${hits.length === 1 ? '' : 's'}` : '';
    if (hits.length && hits.length <= 5) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const n of hits) {
        x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y);
        x1 = Math.max(x1, n.x); y1 = Math.max(y1, n.y);
      }
      graph.flyTo({ x: x0 - 220, y: y0 - 220, w: x1 - x0 + 440, h: y1 - y0 + 440 });
    }
  });

  // ── Reset + keyboard ────────────────────────────────────────────────────
  document.getElementById('resetView').addEventListener('click', () => {
    exitLoop(false);
    closeSearch();
    activeFilter = null;
    legend.querySelectorAll('.legend-chip').forEach((x) => x.classList.remove('active'));
    graph.clearAllModes();
    graph.focusAll();
    panel.hidden = true;
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      if (!loopCard.hidden) exitLoop();
      else if (!panel.hidden) closePanel();
    }
  });

  return { openNode, closePanel };
}
