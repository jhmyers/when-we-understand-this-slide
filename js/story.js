// ============================================================================
// Story engine: theme turn (Act 0→1), pinned progressive build (Act 2),
// and the top progress bar. Built on rAF-throttled scroll math rather than
// IntersectionObserver so behavior is identical in every environment.
// ============================================================================
import { steps, categories, catById } from './data.js';

export function initStory(storyGraph) {
  buildStepCards();

  const turnPoint = document.getElementById('turnPoint');
  const fill = document.getElementById('progressFill');
  const cards = [...document.querySelectorAll('.step-card')];

  // Cumulative category reveal per step
  const cumulative = [];
  let acc = [];
  for (const s of steps) {
    acc = [...new Set([...acc, ...s.cats])];
    cumulative.push(s.cats.length ? acc : categories.map((c) => c.id));
  }

  let active = -2; // sentinel below -1 so the initial empty reveal applies
  let revealed = false;

  const activate = (i) => {
    if (i === active) return;
    active = i;
    cards.forEach((c, j) => c.classList.toggle('active', j === i));
    if (i < 0) {
      if (revealed) { storyGraph.revealCats([]); revealed = false; }
      return;
    }
    revealed = true;
    storyGraph.revealCats(cumulative[i]);
    const s = steps[i];
    if (!s.cats.length) storyGraph.focusAll(1300);
    else storyGraph.focusCats(s.cats, 1100);
  };

  const update = () => {
    const vh = window.innerHeight;

    // 1. Theme turn: flip once the turn point crosses the viewport middle
    document.body.classList.toggle('dark',
      turnPoint.getBoundingClientRect().top < vh * 0.5);

    // 2. Progress bar
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    fill.style.width = `${max > 0 ? (h.scrollTop / max) * 100 : 0}%`;

    // 3. Active build step: the last card whose top has crossed 65% of the
    //    viewport (i.e. the card currently occupying the reading line).
    let idx = -1;
    for (let i = 0; i < cards.length; i++) {
      if (cards[i].getBoundingClientRect().top < vh * 0.65) idx = i;
      else break;
    }
    // Past the whole build? Keep the final state.
    activate(idx);
  };

  // Direct execution: the work is a handful of getBoundingClientRect calls,
  // and rAF throttling starves in throttled or non-painting tabs.
  window.addEventListener('scroll', update, { passive: true });
  // Capture-phase document listener: catches scroll regardless of which
  // element actually scrolls (embedded contexts, odd scrolling roots).
  document.addEventListener('scroll', update, { passive: true, capture: true });
  window.addEventListener('resize', update, { passive: true });
  update();
  // Fonts settling can shift layout after the first measure
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);
}

function buildStepCards() {
  const wrap = document.getElementById('buildSteps');
  steps.forEach((s, i) => {
    const art = document.createElement('article');
    art.className = 'step-card';
    art.dataset.step = i;
    art.id = `step-${s.id}`;
    const catChips = s.cats.map((c) =>
      `<span class="cat-chip" style="--chip:${catById[c].color}">${catById[c].label.toUpperCase()}</span>`).join(' ');
    art.innerHTML = `
      <p class="step-kicker mono">${s.kicker}</p>
      <h3>${s.title}</h3>
      ${catChips ? `<p class="step-chips">${catChips}</p>` : ''}
      <p class="step-body">${s.body}</p>
      <p class="step-count mono">${String(i + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')}</p>`;
    wrap.appendChild(art);
  });
}
