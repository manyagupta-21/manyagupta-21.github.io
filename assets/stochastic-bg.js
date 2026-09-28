/* ============================================================
   Site-wide animated backdrop.
   A single full-page, fixed canvas shared by every page, so the
   background stays visible while scrolling instead of disappearing
   past the hero. Each page picks one classic stochastic process,
   set via data-process on #site-canvas:
     walk     -> Brownian motion / random walk        (Home)
     jump     -> Poisson jump-diffusion sample paths   (Projects)
     ou       -> Ornstein-Uhlenbeck mean reversion     (Resume)
     converge -> converging random walkers, networked  (Contact)
   All four are slow and calm by design. Respects prefers-reduced-motion.
   ============================================================ */
(function () {
  const canvas = document.getElementById("site-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const process = canvas.dataset.process || "walk";

  const GOLD = [201, 168, 118];
  const TEAL = [95, 184, 179];
  const BG = [10, 14, 23];

  function rgba(c, a) { return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpC(c1, c2, t) { return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)]; }
  function gauss() {
    // Box-Muller
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  let width, height, dpr;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ================= WALK: Brownian motion ================= */
  const walkers = [];
  function initWalk() {
    walkers.length = 0;
    const n = width < 640 ? 4 : 7;
    for (let i = 0; i < n; i++) {
      walkers.push({
        x: Math.random() * width,
        y: Math.random() * height,
        colorT: Math.random(),
        r: 1.6 + Math.random() * 1.2,
      });
    }
  }
  function drawWalk() {
    ctx.fillStyle = rgba(BG, 0.05);
    ctx.fillRect(0, 0, width, height);
    walkers.forEach((w) => {
      const px = w.x, py = w.y;
      w.x += gauss() * 0.5;
      w.y += gauss() * 0.5;
      if (w.x < -20) w.x = width + 20;
      if (w.x > width + 20) w.x = -20;
      if (w.y < -20) w.y = height + 20;
      if (w.y > height + 20) w.y = -20;
      const color = lerpC(TEAL, GOLD, w.colorT);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(w.x, w.y);
      ctx.strokeStyle = rgba(color, 0.55);
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
      ctx.fillStyle = rgba(color, 0.85);
      ctx.fill();
    });
  }

  /* ================= JUMP: Poisson jump-diffusion ================= */
  const jumpPaths = [];
  function initJump() {
    jumpPaths.length = 0;
    const n = width < 640 ? 3 : 5;
    for (let i = 0; i < n; i++) {
      const baseline = height * ((i + 0.5) / n);
      jumpPaths.push({
        baseline,
        y: baseline,
        pts: [{ x: 0, y: baseline }],
        colorT: i / Math.max(1, n - 1),
        lambda: 0.006 + Math.random() * 0.006, // jump probability per frame
      });
    }
  }
  function stepJump(p) {
    p.y += gauss() * 0.6;
    p.y += (p.baseline - p.y) * 0.004; // gentle pull so it stays on-screen
    if (Math.random() < p.lambda) {
      p.y += (Math.random() < 0.5 ? -1 : 1) * (18 + Math.random() * 26);
    }
    p.pts.push({ x: p.pts.length ? p.pts[p.pts.length - 1].x + 1.4 : 0, y: p.y, jump: false });
  }
  function drawJump() {
    ctx.fillStyle = rgba(BG, 1);
    ctx.fillRect(0, 0, width, height);
    jumpPaths.forEach((p) => {
      stepJump(p);
      while (p.pts.length && p.pts[0].x < p.pts[p.pts.length - 1].x - width - 40) p.pts.shift();
      const color = lerpC(TEAL, GOLD, p.colorT);
      const lastX = p.pts[p.pts.length - 1].x;
      ctx.beginPath();
      ctx.moveTo(width - (lastX - p.pts[0].x), p.pts[0].y);
      for (let i = 1; i < p.pts.length; i++) {
        ctx.lineTo(width - (lastX - p.pts[i].x), p.pts[i].y);
      }
      ctx.strokeStyle = rgba(color, 0.5);
      ctx.lineWidth = 1.3;
      ctx.stroke();
    });
  }

  /* ================= OU: Ornstein-Uhlenbeck mean reversion ================= */
  const ouPaths = [];
  function initOU() {
    ouPaths.length = 0;
    const n = width < 640 ? 3 : 5;
    for (let i = 0; i < n; i++) {
      const baseline = height * ((i + 0.5) / n);
      ouPaths.push({
        baseline,
        y: baseline,
        pts: [{ x: 0, y: baseline }],
        colorT: i / Math.max(1, n - 1),
        theta: 0.01 + Math.random() * 0.01,
        sigma: 0.5 + Math.random() * 0.4,
      });
    }
  }
  function stepOU(p) {
    p.y += p.theta * (p.baseline - p.y) + gauss() * p.sigma;
    p.pts.push({ x: p.pts.length ? p.pts[p.pts.length - 1].x + 1.4 : 0, y: p.y });
  }
  function drawOU() {
    ctx.fillStyle = rgba(BG, 1);
    ctx.fillRect(0, 0, width, height);
    ouPaths.forEach((p) => {
      stepOU(p);
      while (p.pts.length && p.pts[0].x < p.pts[p.pts.length - 1].x - width - 40) p.pts.shift();
      const color = lerpC(TEAL, GOLD, p.colorT);
      // faint mean line
      ctx.beginPath();
      ctx.moveTo(0, p.baseline);
      ctx.lineTo(width, p.baseline);
      ctx.strokeStyle = rgba(color, 0.08);
      ctx.lineWidth = 1;
      ctx.stroke();
      const lastX = p.pts[p.pts.length - 1].x;
      ctx.beginPath();
      ctx.moveTo(width - (lastX - p.pts[0].x), p.pts[0].y);
      for (let i = 1; i < p.pts.length; i++) {
        ctx.lineTo(width - (lastX - p.pts[i].x), p.pts[i].y);
      }
      ctx.strokeStyle = rgba(color, 0.5);
      ctx.lineWidth = 1.3;
      ctx.stroke();
    });
  }

  /* ================= CONVERGE: converging walkers, networked ================= */
  const nodes = [];
  function initConverge() {
    nodes.length = 0;
    const n = width < 640 ? 10 : 18;
    for (let i = 0; i < n; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        colorT: Math.random(),
      });
    }
  }
  function drawConverge(t) {
    ctx.fillStyle = rgba(BG, 0.08);
    ctx.fillRect(0, 0, width, height);
    const cx = width / 2, cy = height / 2;
    const pull = (Math.sin(t * 0.00012) + 1) / 2; // breathes between 0 and 1
    nodes.forEach((node) => {
      const dx = cx - node.x, dy = cy - node.y;
      const dist = Math.hypot(dx, dy) || 1;
      const attract = 0.0009 + pull * 0.0022;
      node.vx += (dx / dist) * attract + gauss() * 0.03;
      node.vy += (dy / dist) * attract + gauss() * 0.03;
      node.vx *= 0.96;
      node.vy *= 0.96;
      node.x += node.vx;
      node.y += node.vy;
    });
    // links between nearby nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const maxD = width < 640 ? 130 : 190;
        if (d < maxD) {
          const alpha = (1 - d / maxD) * 0.35;
          const color = lerpC(TEAL, GOLD, (a.colorT + b.colorT) / 2);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = rgba(color, alpha);
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }
      }
    }
    nodes.forEach((node) => {
      const color = lerpC(TEAL, GOLD, node.colorT);
      ctx.beginPath();
      ctx.arc(node.x, node.y, 2.1, 0, Math.PI * 2);
      ctx.fillStyle = rgba(color, 0.85);
      ctx.fill();
    });
  }

  const impls = {
    walk: { init: initWalk, draw: drawWalk },
    jump: { init: initJump, draw: drawJump },
    ou: { init: initOU, draw: drawOU },
    converge: { init: initConverge, draw: drawConverge },
  };
  const impl = impls[process] || impls.walk;

  function frame(t) {
    impl.draw(t);
    requestAnimationFrame(frame);
  }

  function boot() {
    resize();
    impl.init();
    if (reduceMotion) {
      impl.draw(performance.now());
    } else {
      requestAnimationFrame(frame);
    }
  }

  window.addEventListener("resize", () => {
    resize();
    impl.init();
  });
  boot();
})();
