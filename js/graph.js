// ============================================================================
// CoinGraph — bespoke SVG causal-map renderer.
// Hand-authored layout, curved edges with computed arrowheads and the
// original diagram's "significant delay" hash marks. Two themes:
// 'paper' (the 2009 briefing slide) and 'dark' (the situation room).
// ============================================================================
import { nodes, edges, regions, catById, nodeById } from './data.js';

const NS = 'http://www.w3.org/2000/svg';
const VIEW = { x: 0, y: 0, w: 2000, h: 1150 };

function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function wrap(text, max = 16) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if (cur && (cur + ' ' + w).length > max) { lines.push(cur); cur = w; }
    else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) lines.push(cur);
  return lines;
}

// Quadratic bezier helpers ----------------------------------------------------
const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
function qPoint(p0, p1, p2, t) {
  const a = lerp(p0, p1, t), b = lerp(p1, p2, t);
  return lerp(a, b, t);
}
function qBlossom(p0, p1, p2, u, v) {
  return {
    x: (1 - u) * (1 - v) * p0.x + ((1 - u) * v + u * (1 - v)) * p1.x + u * v * p2.x,
    y: (1 - u) * (1 - v) * p0.y + ((1 - u) * v + u * (1 - v)) * p1.y + u * v * p2.y,
  };
}
function qSub(p0, p1, p2, t0, t1) {
  return [qBlossom(p0, p1, p2, t0, t0), qBlossom(p0, p1, p2, t0, t1), qBlossom(p0, p1, p2, t1, t1)];
}

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class CoinGraph {
  /**
   * @param {SVGSVGElement} svg
   * @param {object} opts { theme:'dark'|'paper', interactive:bool, showRegions:bool,
   *                        onNodeClick(node), onBackgroundClick() }
   */
  constructor(svg, opts = {}) {
    this.svg = svg;
    this.opts = Object.assign({ theme: 'dark', interactive: false, showRegions: true }, opts);
    this.cam = { ...VIEW };
    this.camTarget = null;
    this.nodeEls = new Map();
    this.edgeEls = [];
    this.adj = new Map(); // id -> { out:[edgeIdx], in:[edgeIdx], nbrs:Set }
    this.visibleCats = null; // null = all
    this.mode = 'normal';    // normal | loop | filter | search | select
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.build();
    if (this.opts.interactive) this.bindInteraction();
  }

  build() {
    const { svg } = this;
    svg.setAttribute('viewBox', `${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`);
    svg.classList.add('coin-graph', `theme-${this.opts.theme}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label',
      'Causal map of AI dynamics in higher education, styled after the 2009 Afghanistan COIN diagram');

    this.gRegions = el('g', { class: 'g-regions' }, svg);
    this.gEdges = el('g', { class: 'g-edges' }, svg);
    this.gNodes = el('g', { class: 'g-nodes' }, svg);

    // Region captions
    if (this.opts.showRegions) {
      for (const r of regions) {
        const t = el('text', {
          x: r.x, y: r.y, class: `region cat-${r.cat}`,
          'font-size': r.size, 'text-anchor': 'middle',
        }, this.gRegions);
        t.textContent = r.label;
      }
    }

    // Adjacency
    for (const n of nodes) this.adj.set(n.id, { out: [], in: [], nbrs: new Set() });
    edges.forEach((e, i) => {
      if (!this.adj.has(e.from) || !this.adj.has(e.to)) return;
      this.adj.get(e.from).out.push(i);
      this.adj.get(e.to).in.push(i);
      this.adj.get(e.from).nbrs.add(e.to);
      this.adj.get(e.to).nbrs.add(e.from);
    });

    // Edges
    edges.forEach((e, i) => {
      const a = nodeById[e.from], b = nodeById[e.to];
      if (!a || !b) return;
      const g = el('g', { class: `edge cat-${b.cat}`, 'data-i': i }, this.gEdges);
      const p0 = { x: a.x, y: a.y }, p2 = { x: b.x, y: b.y };
      const dx = p2.x - p0.x, dy = p2.y - p0.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const dir = (hash(e.from + e.to) % 2 === 0 ? 1 : -1);
      const bend = Math.min(len * 0.16, 90) * dir;
      const p1 = { x: (p0.x + p2.x) / 2 + nx * bend, y: (p0.y + p2.y) / 2 + ny * bend };

      const r0 = (a.box ? 46 : 12) / len, r1 = (b.box ? 52 : 20) / len;
      const t0 = Math.min(r0, 0.35), t1 = Math.max(1 - r1, 0.65);
      const [q0, q1, q2] = qSub(p0, p1, p2, t0, t1);

      el('path', {
        d: `M ${q0.x.toFixed(1)} ${q0.y.toFixed(1)} Q ${q1.x.toFixed(1)} ${q1.y.toFixed(1)} ${q2.x.toFixed(1)} ${q2.y.toFixed(1)}`,
        class: 'edge-line', fill: 'none',
      }, g);

      // Arrowhead
      const tan = { x: q2.x - q1.x, y: q2.y - q1.y };
      const tl = Math.hypot(tan.x, tan.y) || 1;
      const ux = tan.x / tl, uy = tan.y / tl;
      const px = -uy, py = ux;
      const size = 9, half = 4;
      const bx = q2.x - ux * size, by = q2.y - uy * size;
      el('path', {
        d: `M ${q2.x.toFixed(1)} ${q2.y.toFixed(1)} L ${(bx + px * half).toFixed(1)} ${(by + py * half).toFixed(1)} L ${(bx - px * half).toFixed(1)} ${(by - py * half).toFixed(1)} Z`,
        class: 'edge-arrow',
      }, g);

      // Significant-delay hash marks (the ‖ of the original)
      if (e.delay) {
        const m = qPoint(q0, q1, q2, 0.5);
        const mt = lerp(lerp(q0, q1, 0.5), lerp(q1, q2, 0.5), 0.5); // = m
        const d1 = lerp(q0, q1, 0.5), d2 = lerp(q1, q2, 0.5);
        let tx = d2.x - d1.x, ty = d2.y - d1.y;
        const tll = Math.hypot(tx, ty) || 1; tx /= tll; ty /= tll;
        // hash direction: normal rotated ~25 degrees
        const ang = Math.atan2(ty, tx) + Math.PI / 2 + 0.44;
        const hx = Math.cos(ang), hy = Math.sin(ang);
        for (const off of [-5, 5]) {
          const cx = mt.x + tx * off, cy = mt.y + ty * off;
          el('line', {
            x1: (cx - hx * 9).toFixed(1), y1: (cy - hy * 9).toFixed(1),
            x2: (cx + hx * 9).toFixed(1), y2: (cy + hy * 9).toFixed(1),
            class: 'edge-delay',
          }, g);
        }
      }
      this.edgeEls.push({ g, e });
    });

    // Nodes
    for (const n of nodes) {
      const g = el('g', { class: `node cat-${n.cat}${n.box ? ' is-box' : ''}`, 'data-id': n.id }, this.gNodes);
      if (n.box) {
        const w = 118, h = 62;
        el('rect', { x: n.x - w / 2, y: n.y - h / 2, width: w, height: h, rx: 3, class: 'node-box' }, g);
        const lines = wrap(n.label, 15);
        const t = el('text', {
          x: n.x, y: n.y - ((lines.length - 1) * 11) / 2 + 3,
          'text-anchor': 'middle', class: 'node-box-label',
        }, g);
        lines.forEach((ln, i) => {
          const ts = el('tspan', { x: n.x, dy: i === 0 ? 0 : 11 }, t);
          ts.textContent = ln;
        });
      } else {
        el('circle', { cx: n.x, cy: n.y, r: 4, class: 'node-dot' }, g);
        el('circle', { cx: n.x, cy: n.y, r: 13, class: 'node-halo', fill: 'transparent' }, g);
        const lines = wrap(n.label, 17);
        const t = el('text', { x: n.x, y: n.y + 16, 'text-anchor': 'middle', class: 'node-label' }, g);
        lines.forEach((ln, i) => {
          const ts = el('tspan', { x: n.x, dy: i === 0 ? 0 : 12.5 }, t);
          ts.textContent = ln;
        });
      }
      if (this.opts.interactive) {
        g.setAttribute('tabindex', '0');
        g.setAttribute('role', 'button');
        g.setAttribute('aria-label', `${n.label}. Category: ${catById[n.cat].label}.`);
      }
      this.nodeEls.set(n.id, g);
    }
  }

  // ── Interaction (explorer) ────────────────────────────────────────────────
  bindInteraction() {
    const { svg } = this;
    svg.classList.add('interactive');
    const pointers = new Map();
    let lastPinch = 0, dragged = false;

    const toWorld = (cx, cy) => {
      const r = svg.getBoundingClientRect();
      return {
        x: this.cam.x + ((cx - r.left) / r.width) * this.cam.w,
        y: this.cam.y + ((cy - r.top) / r.height) * this.cam.h,
      };
    };

    svg.addEventListener('pointerdown', (ev) => {
      pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      dragged = false;
      svg.setPointerCapture(ev.pointerId);
    });
    svg.addEventListener('pointermove', (ev) => {
      if (!pointers.has(ev.pointerId)) return;
      const prev = pointers.get(ev.pointerId);
      pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (pointers.size === 1) {
        const r = svg.getBoundingClientRect();
        const dx = ((ev.clientX - prev.x) / r.width) * this.cam.w;
        const dy = ((ev.clientY - prev.y) / r.height) * this.cam.h;
        if (Math.abs(ev.clientX - prev.x) + Math.abs(ev.clientY - prev.y) > 2) dragged = true;
        this.cam.x -= dx; this.cam.y -= dy;
        this.applyCam();
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (lastPinch) {
          const scale = lastPinch / dist;
          this.zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, scale, toWorld);
        }
        lastPinch = dist;
        dragged = true;
      }
    });
    const up = (ev) => { pointers.delete(ev.pointerId); if (pointers.size < 2) lastPinch = 0; };
    svg.addEventListener('pointerup', up);
    svg.addEventListener('pointercancel', up);

    svg.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      const scale = Math.pow(1.0015, ev.deltaY);
      this.zoomAt(ev.clientX, ev.clientY, scale, toWorld);
    }, { passive: false });

    // Node hover + click
    for (const [id, g] of this.nodeEls) {
      g.addEventListener('mouseenter', () => { if (this.mode === 'normal') this.hoverNode(id); });
      g.addEventListener('mouseleave', () => { if (this.mode === 'normal') this.clearHover(); });
      g.addEventListener('focus', () => { if (this.mode === 'normal') this.hoverNode(id); });
      g.addEventListener('blur', () => { if (this.mode === 'normal') this.clearHover(); });
      const activate = (ev) => {
        ev.stopPropagation();
        if (dragged) return;
        this.opts.onNodeClick && this.opts.onNodeClick(nodeById[id]);
      };
      g.addEventListener('click', activate);
      g.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); activate(ev); }
      });
    }
    svg.addEventListener('click', (ev) => {
      if (dragged) return;
      if (ev.target === svg || ev.target.closest('.g-regions') || ev.target.closest('.g-edges')) {
        this.opts.onBackgroundClick && this.opts.onBackgroundClick();
      }
    });
  }

  zoomAt(cx, cy, scale, toWorld) {
    const w0 = this.cam.w;
    const nw = Math.max(260, Math.min(2600, w0 * scale));
    const k = nw / w0;
    const pivot = toWorld(cx, cy);
    this.cam.x = pivot.x - (pivot.x - this.cam.x) * k;
    this.cam.y = pivot.y - (pivot.y - this.cam.y) * k;
    this.cam.w *= k;
    this.cam.h *= k;
    this.applyCam();
  }

  applyCam() {
    this.svg.setAttribute('viewBox',
      `${this.cam.x.toFixed(1)} ${this.cam.y.toFixed(1)} ${this.cam.w.toFixed(1)} ${this.cam.h.toFixed(1)}`);
  }

  // Animated camera to a bounding box
  flyTo(box, ms = 900) {
    const aspect = VIEW.w / VIEW.h;
    let { x, y, w, h } = box;
    if (w / h > aspect) { const nh = w / aspect; y -= (nh - h) / 2; h = nh; }
    else { const nw = h * aspect; x -= (nw - w) / 2; w = nw; }
    if (this.reduced || ms === 0) {
      this.cam = { x, y, w, h }; this.applyCam(); return;
    }
    const from = { ...this.cam };
    const start = performance.now();
    cancelAnimationFrame(this._camRaf);
    clearTimeout(this._camGuard);
    const tick = (now) => {
      const t = Math.min(1, (now - start) / ms);
      const k = ease(t);
      this.cam = {
        x: from.x + (x - from.x) * k, y: from.y + (y - from.y) * k,
        w: from.w + (w - from.w) * k, h: from.h + (h - from.h) * k,
      };
      this.applyCam();
      if (t < 1) this._camRaf = requestAnimationFrame(tick);
      else clearTimeout(this._camGuard);
    };
    this._camRaf = requestAnimationFrame(tick);
    // If rAF starves (hidden/throttled tab), land on the target state anyway.
    this._camGuard = setTimeout(() => {
      cancelAnimationFrame(this._camRaf);
      this.cam = { x, y, w, h };
      this.applyCam();
    }, ms + 250);
  }

  catBox(catIds, pad = 90) {
    const pts = nodes.filter((n) => catIds.includes(n.cat));
    if (!pts.length) return { ...VIEW };
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of pts) {
      x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y);
      x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
    }
    return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 };
  }

  focusCats(catIds, ms) { this.flyTo(this.catBox(catIds), ms); }
  focusAll(ms) { this.flyTo({ ...VIEW }, ms); }

  // ── Story reveal ──────────────────────────────────────────────────────────
  revealCats(catIds) {
    this.visibleCats = new Set(catIds);
    for (const [id, g] of this.nodeEls) {
      g.classList.toggle('hidden-node', !this.visibleCats.has(nodeById[id].cat));
    }
    for (const { g, e } of this.edgeEls) {
      const vis = this.visibleCats.has(nodeById[e.from]?.cat) && this.visibleCats.has(nodeById[e.to]?.cat);
      g.classList.toggle('hidden-node', !vis);
    }
    this.gRegions.querySelectorAll('.region').forEach((t) => {
      const cat = [...t.classList].find((c) => c.startsWith('cat-'))?.slice(4);
      t.classList.toggle('hidden-node', !this.visibleCats.has(cat));
    });
  }

  revealAll() { this.revealCats(Object.keys(catById)); }

  // ── Hover / highlight ─────────────────────────────────────────────────────
  hoverNode(id) {
    const nbrs = this.adj.get(id)?.nbrs || new Set();
    for (const [nid, g] of this.nodeEls) {
      const on = nid === id || nbrs.has(nid);
      g.classList.toggle('dim', !on);
      g.classList.toggle('hl', on);
    }
    this.edgeEls.forEach(({ g, e }) => {
      const on = e.from === id || e.to === id;
      g.classList.toggle('dim', !on);
      g.classList.toggle('hl', on);
    });
    this.svg.classList.add('has-hover');
  }

  clearHover() {
    for (const g of this.nodeEls.values()) g.classList.remove('dim', 'hl');
    for (const { g } of this.edgeEls) g.classList.remove('dim', 'hl');
    this.svg.classList.remove('has-hover');
  }

  selectNode(id) {
    this.mode = 'select';
    this.clearHover();
    this.hoverNode(id);
    for (const [nid, g] of this.nodeEls) g.classList.toggle('selected', nid === id);
  }

  // ── Loop tour ─────────────────────────────────────────────────────────────
  showLoop(loop) {
    this.mode = 'loop';
    this.clearHover();
    const inLoop = new Set(loop.nodes);
    const loopPairs = new Set();
    for (let i = 0; i < loop.nodes.length - 1; i++) loopPairs.add(loop.nodes[i] + '>' + loop.nodes[i + 1]);
    for (const [nid, g] of this.nodeEls) {
      g.classList.toggle('dim', !inLoop.has(nid));
      g.classList.toggle('loop-node', inLoop.has(nid));
    }
    let seq = 0;
    this.edgeEls.forEach(({ g, e }) => {
      const key = e.from + '>' + e.to;
      const on = loopPairs.has(key);
      g.classList.toggle('dim', !on);
      g.classList.toggle('loop-edge', on);
      if (on) {
        const order = loop.nodes.findIndex((n, i) => i < loop.nodes.length - 1 && loop.nodes[i] + '>' + loop.nodes[i + 1] === key);
        g.style.setProperty('--loop-i', order >= 0 ? order : seq++);
      } else {
        g.style.removeProperty('--loop-i');
      }
    });
    // Fly to the loop's extent
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const nid of inLoop) {
      const n = nodeById[nid];
      x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y);
      x1 = Math.max(x1, n.x); y1 = Math.max(y1, n.y);
    }
    this.flyTo({ x: x0 - 130, y: y0 - 130, w: x1 - x0 + 260, h: y1 - y0 + 260 });
  }

  // ── Category filter & search ──────────────────────────────────────────────
  setFilter(catId) {
    this.mode = catId ? 'filter' : 'normal';
    for (const [nid, g] of this.nodeEls) {
      const on = !catId || nodeById[nid].cat === catId;
      g.classList.toggle('dim', !on);
      g.classList.remove('hl', 'loop-node');
    }
    this.edgeEls.forEach(({ g, e }) => {
      const on = !catId || nodeById[e.from].cat === catId || nodeById[e.to].cat === catId;
      g.classList.toggle('dim', !on);
      g.classList.remove('hl', 'loop-edge');
    });
  }

  setSearch(term) {
    const q = term.trim().toLowerCase();
    if (!q) { this.mode = 'normal'; this.clearAllModes(); return [] ; }
    this.mode = 'search';
    const hits = [];
    for (const [nid, g] of this.nodeEls) {
      const n = nodeById[nid];
      const on = n.label.toLowerCase().includes(q) || n.coin.toLowerCase().includes(q);
      if (on) hits.push(n);
      g.classList.toggle('dim', !on);
      g.classList.toggle('hl', on);
    }
    this.edgeEls.forEach(({ g }) => g.classList.add('dim'));
    return hits;
  }

  clearAllModes() {
    this.mode = 'normal';
    for (const g of this.nodeEls.values()) g.classList.remove('dim', 'hl', 'loop-node', 'selected');
    for (const { g } of this.edgeEls) { g.classList.remove('dim', 'hl', 'loop-edge'); g.style.removeProperty('--loop-i'); }
  }

  neighborsOf(id) {
    const a = this.adj.get(id);
    return {
      into: a.in.map((i) => edges[i]).map((e) => nodeById[e.from]),
      outof: a.out.map((i) => edges[i]).map((e) => nodeById[e.to]),
    };
  }
}
