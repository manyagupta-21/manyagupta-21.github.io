/* ============================================================
   Hero-band animated backdrop, v2.
   One visual system, four distinct animations that speak directly
   to the things that pull Manya in: numbers, markets, and the ML
   models that got her hooked (neural nets, decision trees).

     Home      "neural"    A feed-forward neural network with signal
                           pulses firing through it, layer to layer.
     Projects  "market"    A live-building candlestick chart with a
                           moving average, like a trading terminal.
     Resume    "tree"      A decision tree that grows branch by
                           branch, then regrows differently, forever.
     Contact   "converge"  Random walkers converging on a point with
                           a faint connecting network, "getting in touch."

   All four share the same palette, line weight, and a common layer
   of drifting statistical symbols (σ, β, R², ...) for texture. The
   canvas is sized to (and clipped by) its own hero container, not
   the full viewport, so it paints in place with the rest of the page.
   Respects prefers-reduced-motion.
   ============================================================ */
(function () {
  const canvas = document.querySelector("canvas.hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const process = canvas.dataset.process || "neural";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const GOLD = "#c9a876";
  const TEAL = "#5fb8b3";
  const MUTED = "#8c96b3";
  const COLORS = [GOLD, TEAL, MUTED];

  let width, height, dpr;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ---------- shared: drifting statistical symbols ---------- */
  const SYMBOLS = ["σ", "μ", "β", "λ", "Δ", "R²", "ε", "Σ", "π", "0.71", "γ", "∂", "P(X)", "χ²"];
  let tokens = [];
  let tokenClock = 0;
  function spawnToken() {
    tokens.push({
      x: Math.random() * width,
      y: height + 16,
      vy: 0.18 + Math.random() * 0.18,
      text: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      color: Math.random() < 0.5 ? GOLD : TEAL,
      size: 12 + Math.random() * 6,
      life: 0,
      maxLife: 420 + Math.random() * 240,
    });
  }
  function stepTokens() {
    tokenClock -= 1;
    if (tokenClock <= 0 && tokens.length < 7) {
      spawnToken();
      tokenClock = 70 + Math.random() * 90;
    }
    tokens.forEach((t) => {
      t.y -= t.vy;
      t.life += 1;
    });
    tokens = tokens.filter((t) => t.life < t.maxLife);
  }
  function drawTokens() {
    ctx.font = "italic 14px 'Source Serif 4', Georgia, serif";
    ctx.textBaseline = "middle";
    tokens.forEach((t) => {
      const fadeIn = Math.min(1, t.life / 40);
      const fadeOut = Math.min(1, (t.maxLife - t.life) / 60);
      const a = 0.22 * fadeIn * fadeOut;
      ctx.font = `italic ${t.size}px 'Source Serif 4', Georgia, serif`;
      ctx.fillStyle = t.color;
      ctx.globalAlpha = a;
      ctx.fillText(t.text, t.x, t.y);
    });
    ctx.globalAlpha = 1;
  }

  /* ---------- faint Poisson scatter (kept for base texture) ---------- */
  let scatter = [];
  function initScatter() {
    scatter = [];
    const n = Math.floor((width * height) / 34000);
    for (let i = 0; i < n; i++) {
      scatter.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.0 + 0.3, a: Math.random() * 0.12 + 0.03 });
    }
  }
  function drawScatter() {
    ctx.fillStyle = TEAL;
    scatter.forEach((p) => {
      ctx.globalAlpha = p.a;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  /* ============================================================
     1. NEURAL NETWORK (Home) , feed-forward layers with firing pulses
     ============================================================ */
  let netLayers = [], netEdges = [], netPulses = [], netClock = 0;
  function initNeural() {
    const counts = width < 640 ? [3, 5, 5, 3] : [4, 7, 7, 4];
    const marginX = 50, marginY = 26;
    netLayers = counts.map((n, li) => {
      const x = marginX + (li * (width - 2 * marginX)) / (counts.length - 1);
      const nodes = [];
      for (let i = 0; i < n; i++) {
        const y = n === 1 ? height / 2 : marginY + (i * (height - 2 * marginY)) / (n - 1);
        nodes.push({ x, y: y + (Math.random() - 0.5) * 10, phase: Math.random() * Math.PI * 2 });
      }
      return nodes;
    });
    netEdges = [];
    for (let li = 0; li < netLayers.length - 1; li++) {
      netLayers[li].forEach((a, ai) => {
        netLayers[li + 1].forEach((b, bi) => {
          if (Math.random() < 0.55) netEdges.push({ li, ai, bi, a, b });
        });
      });
    }
    netPulses = [];
    netClock = 0;
  }
  function stepNeural(t) {
    netClock -= 1;
    if (netClock <= 0 && netEdges.length) {
      const e = netEdges[Math.floor(Math.random() * netEdges.length)];
      netPulses.push({ edge: e, p: 0, speed: 0.012 + Math.random() * 0.014 });
      netClock = 6 + Math.random() * 10;
    }
    netPulses.forEach((pu) => (pu.p += pu.speed));
    netPulses = netPulses.filter((pu) => pu.p < 1);
  }
  function drawNeural(t) {
    // edges
    ctx.lineWidth = 1;
    netEdges.forEach((e) => {
      ctx.beginPath();
      ctx.moveTo(e.a.x, e.a.y);
      ctx.lineTo(e.b.x, e.b.y);
      ctx.strokeStyle = TEAL;
      ctx.globalAlpha = 0.18;
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    // pulses traveling along edges, with a soft glow trail
    netPulses.forEach((pu) => {
      const { a, b } = pu.edge;
      const x = a.x + (b.x - a.x) * pu.p;
      const y = a.y + (b.y - a.y) * pu.p;
      const fade = Math.sin(Math.PI * pu.p);
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = GOLD;
      ctx.globalAlpha = 0.18 * fade;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = GOLD;
      ctx.globalAlpha = 0.9 * fade;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // nodes, gently pulsing, with a faint halo
    netLayers.forEach((layer, li) => {
      layer.forEach((n) => {
        const r = 3.4 + Math.sin(t * 0.0022 + n.phase) * 1.3;
        const color = li % 2 === 0 ? GOLD : TEAL;
        ctx.beginPath();
        ctx.arc(n.x, n.y, Math.max(1.8, r) + 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.08;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(n.x, n.y, Math.max(1.8, r), 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    });
  }

  /* ============================================================
     2. MARKET CANDLESTICKS (Projects) , live-building price chart
     ============================================================ */
  let candles = [], building = null, ma = [], candleW = 7, gap = 4;
  function resetMarket() {
    candles = [];
    let price = 100;
    const count = Math.ceil(width / (candleW + gap)) + 2;
    for (let i = 0; i < count - 1; i++) {
      const o = price;
      const drift = (Math.random() - 0.48) * 3;
      const c = Math.max(20, o + drift);
      const h = Math.max(o, c) + Math.random() * 1.5;
      const l = Math.min(o, c) - Math.random() * 1.5;
      candles.push({ o, h, l, c });
      price = c;
    }
    building = { o: price, h: price, l: price, c: price, tick: 0 };
  }
  function stepMarket() {
    building.tick += 1;
    const drift = (Math.random() - 0.49) * 2.2;
    building.c = Math.max(15, building.c + drift);
    building.h = Math.max(building.h, building.c);
    building.l = Math.min(building.l, building.c);
    if (building.tick > 46) {
      candles.push(building);
      const maxCandles = Math.ceil(width / (candleW + gap)) + 2;
      if (candles.length > maxCandles) candles.shift();
      building = { o: building.c, h: building.c, l: building.c, c: building.c, tick: 0 };
    }
  }
  function drawMarket() {
    const all = candles.concat([building]);
    const highs = all.map((c) => c.h), lows = all.map((c) => c.l);
    const max = Math.max(...highs), min = Math.min(...lows);
    const pad = (max - min) * 0.18 || 1;
    const top = 14, bottom = height - 10;
    const scaleY = (v) => bottom - ((v - (min - pad)) / (max - min + pad * 2)) * (bottom - top);

    // moving average (window 8)
    const win = 8;
    const points = [];
    for (let i = 0; i < all.length; i++) {
      const from = Math.max(0, i - win + 1);
      const slice = all.slice(from, i + 1);
      const avg = slice.reduce((s, c) => s + c.c, 0) / slice.length;
      points.push(avg);
    }

    all.forEach((c, i) => {
      const x = width - (all.length - i) * (candleW + gap);
      if (x < -candleW) return;
      const up = c.c >= c.o;
      ctx.strokeStyle = up ? TEAL : MUTED;
      ctx.fillStyle = up ? TEAL : MUTED;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + candleW / 2, scaleY(c.h));
      ctx.lineTo(x + candleW / 2, scaleY(c.l));
      ctx.stroke();
      const bodyTop = scaleY(Math.max(c.o, c.c));
      const bodyH = Math.max(1.4, Math.abs(scaleY(c.o) - scaleY(c.c)));
      ctx.globalAlpha = 0.4;
      ctx.fillRect(x, bodyTop, candleW, bodyH);
      ctx.globalAlpha = 1;
    });

    // moving average line
    ctx.beginPath();
    all.forEach((c, i) => {
      const x = width - (all.length - i) * (candleW + gap) + candleW / 2;
      const y = scaleY(points[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = GOLD;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /* ============================================================
     3. DECISION TREE (Resume) , grows branch by branch, then regrows
     ============================================================ */
  let treeSegments = [], treeStart = 0, treeDuration = 3200, treeHold = 1400;
  function buildTree() {
    treeSegments = [];
    const maxDepth = width < 640 ? 5 : 6;
    const rootX = width / 2, rootY = 8;
    const totalDrop = height - 24;
    function branch(x, y, angle, len, depth, order) {
      const x2 = x + Math.sin(angle) * len;
      const y2 = y + Math.cos(angle) * len;
      const seg = { x1: x, y1: y, x2, y2, depth, order };
      treeSegments.push(seg);
      if (depth >= maxDepth) return;
      const spread = 0.42 + Math.random() * 0.25;
      const shrink = 0.68 + Math.random() * 0.1;
      branch(x2, y2, angle - spread, len * shrink, depth + 1, order + 1);
      branch(x2, y2, angle + spread, len * shrink, depth + 1, order + 1);
    }
    branch(rootX, rootY, 0, totalDrop / (maxDepth * 0.85), 0, 0);
    treeStart = performance.now();
  }
  function drawTree(now) {
    const elapsed = now - treeStart;
    const cycle = treeDuration + treeHold;
    const local = elapsed % cycle;
    const maxDepth = treeSegments.reduce((m, s) => Math.max(m, s.depth), 0) || 1;
    const growFrac = Math.min(1, local / treeDuration);
    const perDepth = 1 / (maxDepth + 1);

    treeSegments.forEach((seg) => {
      const depthStart = seg.depth * perDepth * 0.85;
      const localProgress = Math.max(0, Math.min(1, (growFrac - depthStart) / (perDepth * 1.4)));
      if (localProgress <= 0) return;
      const ex = seg.x1 + (seg.x2 - seg.x1) * localProgress;
      const ey = seg.y1 + (seg.y2 - seg.y1) * localProgress;
      ctx.beginPath();
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = seg.depth % 2 === 0 ? TEAL : GOLD;
      ctx.globalAlpha = 0.5 - seg.depth * 0.035;
      ctx.lineWidth = Math.max(0.8, 2.6 - seg.depth * 0.35);
      ctx.stroke();
      if (localProgress >= 1) {
        ctx.beginPath();
        ctx.arc(seg.x2, seg.y2, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = GOLD;
        ctx.globalAlpha = 0.5;
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;

    if (local > cycle - 30) {
      // regrow with a fresh random shape just before the cycle resets
      buildTree(); // buildTree() also resets treeStart to `now`
    }
  }

  /* ============================================================
     4. CONVERGING WALKERS (Contact) , reaching out, getting in touch
     ============================================================ */
  class Node {
    constructor(color) { this.reset(true); this.color = color; }
    reset(initial) {
      const edge = Math.floor(Math.random() * 4);
      if (initial) { this.x = Math.random() * width; this.y = Math.random() * height; }
      else if (edge === 0) { this.x = -10; this.y = Math.random() * height; }
      else if (edge === 1) { this.x = width + 10; this.y = Math.random() * height; }
      else if (edge === 2) { this.x = Math.random() * width; this.y = -10; }
      else { this.x = Math.random() * width; this.y = height + 10; }
      this.speed = 0.25 + Math.random() * 0.35;
    }
    step(target) {
      const dx = target.x - this.x, dy = target.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      this.x += (dx / dist) * this.speed + (Math.random() - 0.5) * 0.6;
      this.y += (dy / dist) * this.speed + (Math.random() - 0.5) * 0.6;
      if (dist < 40) this.reset(false);
    }
  }
  let nodes = [], target = { x: 0, y: 0 }, pulseRings = [], pulseClock = 0;
  function initConverge() {
    nodes = [];
    target = { x: width * 0.5, y: height * 0.45 };
    const count = width < 640 ? 8 : 14;
    for (let i = 0; i < count; i++) nodes.push(new Node(COLORS[i % COLORS.length]));
    pulseRings = [];
    pulseClock = 60;
  }
  function stepConverge() {
    pulseClock -= 1;
    if (pulseClock <= 0) { pulseRings.push({ r: 0, a: 0.35 }); pulseClock = 90; }
    pulseRings.forEach((p) => { p.r += 0.6; p.a *= 0.985; });
    pulseRings = pulseRings.filter((p) => p.a > 0.02);
  }
  function drawConverge() {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 160) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = TEAL;
          ctx.globalAlpha = 0.12 * (1 - d / 160);
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    nodes.forEach((n) => {
      n.step(target);
      ctx.beginPath();
      ctx.arc(n.x, n.y, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = n.color;
      ctx.globalAlpha = 0.7;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    pulseRings.forEach((p) => {
      ctx.beginPath();
      ctx.arc(target.x, target.y, p.r, 0, Math.PI * 2);
      ctx.strokeStyle = GOLD;
      ctx.globalAlpha = p.a;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.arc(target.x, target.y, 5, 0, Math.PI * 2);
    ctx.strokeStyle = GOLD;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /* ---------- boot / loop ---------- */
  function initProcess() {
    if (process === "neural") initNeural();
    else if (process === "market") resetMarket();
    else if (process === "tree") buildTree();
    else if (process === "converge") initConverge();
  }

  function frame(t) {
    ctx.clearRect(0, 0, width, height);
    drawScatter();
    if (process === "neural") { stepNeural(t); drawNeural(t); }
    else if (process === "market") { stepMarket(); drawMarket(); }
    else if (process === "tree") { drawTree(t); }
    else if (process === "converge") { stepConverge(); drawConverge(); }
    stepTokens();
    drawTokens();
    requestAnimationFrame(frame);
  }

  function drawStatic() {
    ctx.clearRect(0, 0, width, height);
    drawScatter();
    const t0 = performance.now();
    if (process === "neural") { for (let i = 0; i < 80; i++) stepNeural(t0); drawNeural(t0); }
    else if (process === "market") { for (let i = 0; i < 80; i++) stepMarket(); drawMarket(); }
    else if (process === "tree") { drawTree(t0 + 1600); }
    else if (process === "converge") { for (let i = 0; i < 60; i++) stepConverge(); drawConverge(); }
  }

  function boot() {
    resize();
    initScatter();
    initProcess();
    if (reduceMotion) drawStatic();
    else requestAnimationFrame(frame);
  }

  window.addEventListener("resize", () => {
    resize();
    initScatter();
    initProcess();
  });

  boot();
})();
