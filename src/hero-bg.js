// Hero — Neural-network constellation background.
// Scattered nodes, edges between close neighbors, signal pulses traveling
// along edges; when a signal reaches a node, the node "fires" with a glow.
// Cursor proximity: edges brighten, more signals spawn from nearby nodes.
(function () {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const hero = document.querySelector('.hero');
  const ctx = canvas.getContext('2d', { alpha: true });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let w = 0, h = 0;
  const NODES = [];
  const EDGES = [];
  const SIGNALS = [];

  const NODE_SPACING = 95;        // base spacing for jittered grid
  const JITTER = 0.65;             // 0..1 fraction of spacing
  const MAX_EDGE_DIST = 165;
  const FIRE_MS = 900;
  const SIGNAL_LIMIT = 70;
  const EDGE_REVEAL = 280;        // cursor radius that brightens edges

  const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rebuild() {
    const rect = canvas.getBoundingClientRect();
    w = rect.width; h = rect.height;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    NODES.length = 0;
    EDGES.length = 0;
    SIGNALS.length = 0;

    const cols = Math.ceil(w / NODE_SPACING) + 1;
    const rows = Math.ceil(h / NODE_SPACING) + 1;
    const offX = (w - (cols - 1) * NODE_SPACING) / 2;
    const offY = (h - (rows - 1) * NODE_SPACING) / 2;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const jx = (Math.random() - 0.5) * NODE_SPACING * JITTER;
        const jy = (Math.random() - 0.5) * NODE_SPACING * JITTER;
        NODES.push({
          bx: offX + i * NODE_SPACING + jx,
          by: offY + j * NODE_SPACING + jy,
          x: 0, y: 0,
          phase: Math.random() * Math.PI * 2,
          amp: 1.5 + Math.random() * 3,
          size: 1 + Math.random() * 0.8,
          fireAt: -10000,
        });
      }
    }

    // Build edges — connect each node to its 2–3 nearest neighbors.
    const seen = new Set();
    for (let i = 0; i < NODES.length; i++) {
      const a = NODES[i];
      const cand = [];
      for (let j = 0; j < NODES.length; j++) {
        if (i === j) continue;
        const b = NODES[j];
        const dx = b.bx - a.bx, dy = b.by - a.by;
        const d2 = dx * dx + dy * dy;
        if (d2 < MAX_EDGE_DIST * MAX_EDGE_DIST) cand.push({ j, d2 });
      }
      cand.sort((u, v) => u.d2 - v.d2);
      const take = Math.min(3, cand.length);
      for (let k = 0; k < take; k++) {
        const j = cand[k].j;
        const key = i < j ? i * 100000 + j : j * 100000 + i;
        if (seen.has(key)) continue;
        seen.add(key);
        EDGES.push({ a: i, b: j });
      }
    }
  }

  hero.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.tx = e.clientX - r.left;
    mouse.ty = e.clientY - r.top;
    mouse.active = true;
  });
  hero.addEventListener('mouseleave', () => { mouse.active = false; });
  hero.addEventListener('touchmove', (e) => {
    const t = e.touches[0]; if (!t) return;
    const r = canvas.getBoundingClientRect();
    mouse.tx = t.clientX - r.left;
    mouse.ty = t.clientY - r.top;
    mouse.active = true;
  }, { passive: true });

  function getAccentRGB() {
    const c = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#B8FF3D';
    let hex = c.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }
  function getInkRGB() {
    return document.body.getAttribute('data-theme') === 'light' ? [10, 10, 10] : [230, 230, 220];
  }

  function spawnSignal(biasToCursor) {
    if (EDGES.length === 0) return;
    let idx;
    if (biasToCursor && mouse.active) {
      // sample a few edges, pick the one nearest to cursor
      let best = -1, bestD = Infinity;
      for (let k = 0; k < 16; k++) {
        const i = (Math.random() * EDGES.length) | 0;
        const e = EDGES[i];
        const mx = (NODES[e.a].bx + NODES[e.b].bx) * 0.5;
        const my = (NODES[e.a].by + NODES[e.b].by) * 0.5;
        const dx = mx - mouse.x, dy = my - mouse.y;
        const d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = i; }
      }
      idx = best;
    } else {
      idx = (Math.random() * EDGES.length) | 0;
    }
    if (idx < 0) return;
    SIGNALS.push({
      edge: idx,
      from: Math.random() < 0.5 ? 0 : 1,
      t: 0,
      speed: 0.55 + Math.random() * 0.65, // per second
    });
    if (SIGNALS.length > SIGNAL_LIMIT) SIGNALS.shift();
  }

  let lastNow = performance.now();
  let baseSpawnAccum = 0;
  let cursorSpawnAccum = 0;

  function tick(now) {
    const dt = Math.min(0.05, (now - lastNow) / 1000);
    lastNow = now;

    if (mouse.active) {
      mouse.x += (mouse.tx - mouse.x) * 0.12;
      mouse.y += (mouse.ty - mouse.y) * 0.12;
    }

    // node oscillation
    const tt = now * 0.001;
    for (const n of NODES) {
      n.x = n.bx + Math.cos(tt * 0.7 + n.phase) * n.amp;
      n.y = n.by + Math.sin(tt * 0.55 + n.phase) * n.amp;
    }

    // signal spawning rates (per second)
    baseSpawnAccum += dt * 7;       // ~7 signals/sec idle
    while (baseSpawnAccum >= 1) { spawnSignal(false); baseSpawnAccum -= 1; }
    if (mouse.active) {
      cursorSpawnAccum += dt * 14;  // +14/sec biased near cursor
      while (cursorSpawnAccum >= 1) { spawnSignal(true); cursorSpawnAccum -= 1; }
    }

    ctx.clearRect(0, 0, w, h);
    const [ar, ag, ab] = getAccentRGB();
    const [ir, ig, ib] = getInkRGB();

    // 1) edges
    ctx.lineWidth = 1;
    for (const e of EDGES) {
      const a = NODES[e.a], b = NODES[e.b];
      let alpha = 0.035;
      let useAccent = false;
      if (mouse.active) {
        const mx = (a.x + b.x) * 0.5, my = (a.y + b.y) * 0.5;
        const dx = mx - mouse.x, dy = my - mouse.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < EDGE_REVEAL) {
          const prox = 1 - d / EDGE_REVEAL;
          alpha = 0.035 + prox * 0.22;
          useAccent = prox > 0.2;
        }
      }
      ctx.strokeStyle = useAccent
        ? `rgba(${ar},${ag},${ab},${alpha})`
        : `rgba(${ir},${ig},${ib},${alpha})`;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // 2) signals (update + draw)
    for (let i = SIGNALS.length - 1; i >= 0; i--) {
      const s = SIGNALS[i];
      s.t += s.speed * dt;
      if (s.t >= 1) {
        const e = EDGES[s.edge];
        const dest = s.from === 0 ? e.b : e.a;
        NODES[dest].fireAt = now;
        SIGNALS.splice(i, 1);
        // occasionally chain — propagate to a random outgoing edge
        if (Math.random() < 0.35) {
          // find an edge containing dest
          const candidates = [];
          for (let k = 0; k < EDGES.length; k++) {
            const ek = EDGES[k];
            if (ek.a === dest || ek.b === dest) candidates.push(k);
          }
          if (candidates.length) {
            const next = candidates[(Math.random() * candidates.length) | 0];
            SIGNALS.push({
              edge: next,
              from: EDGES[next].a === dest ? 0 : 1,
              t: 0,
              speed: 0.55 + Math.random() * 0.65,
            });
          }
        }
        continue;
      }
      const e = EDGES[s.edge];
      const a = NODES[e.a], b = NODES[e.b];
      const start = s.from === 0 ? a : b;
      const end = s.from === 0 ? b : a;
      const x = start.x + (end.x - start.x) * s.t;
      const y = start.y + (end.y - start.y) * s.t;

      // glow
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 10);
      glow.addColorStop(0, `rgba(${ar},${ag},${ab},0.28)`);
      glow.addColorStop(1, `rgba(${ar},${ag},${ab},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      // core
      ctx.fillStyle = `rgba(${ar},${ag},${ab},0.75)`;
      ctx.beginPath();
      ctx.arc(x, y, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3) nodes
    for (const n of NODES) {
      const sinceFire = now - n.fireAt;
      const firing = sinceFire < FIRE_MS;
      let alpha = 0.18;
      let size = n.size;
      let glowR = 0, glowA = 0;

      if (firing) {
        const k = 1 - sinceFire / FIRE_MS; // 1 → 0
        alpha = 0.4 + k * 0.35;
        size = n.size + k * 1.8;
        glowR = 4 + k * 11;
        glowA = k * 0.22;
      } else if (mouse.active) {
        const dx = n.x - mouse.x, dy = n.y - mouse.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 220) {
          const prox = 1 - d / 220;
          alpha = 0.18 + prox * 0.35;
          size = n.size + prox * 1.0;
          glowR = prox * 7;
          glowA = prox * 0.09;
        }
      } else if (!reduceMotion) {
        // very subtle ambient pulse
        alpha = 0.12 + 0.05 * Math.sin(tt * 1.3 + n.phase);
      }

      if (glowR > 1) {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR);
        g.addColorStop(0, `rgba(${ar},${ag},${ab},${glowA})`);
        g.addColorStop(1, `rgba(${ar},${ag},${ab},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = `rgba(${ar},${ag},${ab},${alpha})`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // cursor halo
    if (mouse.active) {
      const halo = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 220);
      halo.addColorStop(0, `rgba(${ar},${ag},${ab},0.04)`);
      halo.addColorStop(0.6, `rgba(${ar},${ag},${ab},0.012)`);
      halo.addColorStop(1, `rgba(${ar},${ag},${ab},0)`);
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);
    }

    requestAnimationFrame(tick);
  }

  rebuild();
  window.addEventListener('resize', () => {
    clearTimeout(rebuild._t);
    rebuild._t = setTimeout(rebuild, 150);
  });
  mouse.x = w * 0.7;
  mouse.y = h * 0.45;
  requestAnimationFrame(tick);
})();
