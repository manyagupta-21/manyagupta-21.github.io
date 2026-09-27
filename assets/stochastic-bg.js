/* ============================================================
   Hero-band animated backdrop , one visual system, four related
   but distinct stochastic processes, one per page:

     Home     "walk"      Brownian motion / random walk    (exploration)
     Projects "jump"      Compound Poisson jump-diffusion  (discrete milestones)
     Resume   "ou"        Ornstein-Uhlenbeck mean reversion (steady track record)
     Contact  "converge"  Converging random walkers + links (getting in touch)

   Same palette, same line weight, same faint Poisson-scatter texture
   on every page , only the underlying process differs, chosen by the
   canvas's data-process attribute. The canvas is sized to (and clipped
   by) its own hero container, not the full viewport, so it paints in
   place with the rest of the page rather than as a separate layer.
   Respects prefers-reduced-motion.
   ============================================================ */
(function () {
  const canvas = document.querySelector("canvas.hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const process = canvas.dataset.process || "walk";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const COLORS = ["#c9a876", "#5fb8b3", "#8c96b3"];

  let width, height, dpr;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ---------- shared faint scatter texture (Poisson field) ---------- */
  let scatter = [];
  function initScatter() {
    scatter = [];
    const n = Math.floor((width * height) / 30000);
    for (let i = 0; i < n; i++) {
      scatter.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.1 + 0.3,
        a: Math.random() * 0.18 + 0.04,
      });
    }
  }
  function drawScatter() {
    ctx.fillStyle = "#5fb8b3";
    scatter.forEach((p) => {
      ctx.globalAlpha = p.a;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  /* ---------- 1. Brownian / random walk (Home) ---------- */
  class Walker {
    constructor(seedY, color, speed, vol) {
      this.color = color; this.speed = speed; this.vol = vol;
      this.points = []; this.x = -20; this.y = seedY; this.baseY = seedY;
      this.t = Math.random() * 1000;
    }
    step() {
      this.t += this.speed;
      const shock = (Math.random() - 0.5) * this.vol;
      const revert = (this.baseY - this.y) * 0.01;
      this.y += shock + revert + Math.sin(this.t * 0.01) * 0.4;
      this.x += this.speed * 6;
      this.points.push({ x: this.x, y: this.y });
      if (this.points.length > 260) this.points.shift();
      if (this.x > width + 40) { this.x = -20; this.points = []; }
    }
    draw() {
      if (this.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) ctx.lineTo(this.points[i].x, this.points[i].y);
      ctx.strokeStyle = this.color; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.4; ctx.stroke();
      const last = this.points[this.points.length - 1];
      ctx.beginPath(); ctx.arc(last.x, last.y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = this.color; ctx.globalAlpha = 0.75; ctx.fill(); ctx.globalAlpha = 1;
    }
  }

  /* ---------- 2. Compound Poisson jump-diffusion (Projects) ---------- */
  class Jumper {
    constructor(seedY, color, speed) {
      this.color = color; this.speed = speed;
      this.points = []; this.x = -20; this.y = seedY; this.baseY = seedY;
      this.jumpClock = 40 + Math.random() * 120;
    }
    step() {
      this.jumpClock -= 1;
      let dy = (Math.random() - 0.5) * 1.4 + (this.baseY - this.y) * 0.01;
      if (this.jumpClock <= 0) {
        dy += (Math.random() - 0.5) * 60; // Poisson jump event
        this.jumpClock = 60 + Math.random() * 160;
      }
      this.y += dy;
      this.x += this.speed * 6;
      this.points.push({ x: this.x, y: this.y, jump: this.jumpClock > 150 });
      if (this.points.length > 220) this.points.shift();
      if (this.x > width + 40) { this.x = -20; this.points = []; this.y = this.baseY; }
    }
    draw() {
      if (this.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) {
        const p = this.points[i], prev = this.points[i - 1];
        if (Math.abs(p.y - prev.y) > 20) { ctx.stroke(); ctx.beginPath(); ctx.moveTo(p.x, p.y); }
        else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = this.color; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.4; ctx.stroke();
      const last = this.points[this.points.length - 1];
      ctx.beginPath(); ctx.arc(last.x, last.y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = this.color; ctx.globalAlpha = 0.75; ctx.fill(); ctx.globalAlpha = 1;
    }
  }

  /* ---------- 3. Ornstein-Uhlenbeck mean reversion (Resume) ---------- */
  class OUPath {
    constructor(seedY, color, speed, theta, vol) {
      this.color = color; this.speed = speed; this.theta = theta; this.vol = vol;
      this.points = []; this.x = -20; this.y = seedY; this.baseY = seedY;
    }
    step() {
      const shock = (Math.random() - 0.5) * this.vol;
      this.y += this.theta * (this.baseY - this.y) + shock;
      this.x += this.speed * 6;
      this.points.push({ x: this.x, y: this.y });
      if (this.points.length > 240) this.points.shift();
      if (this.x > width + 40) { this.x = -20; this.points = []; }
    }
    draw() {
      if (this.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) ctx.lineTo(this.points[i].x, this.points[i].y);
      ctx.strokeStyle = this.color; ctx.lineWidth = 1.1; ctx.globalAlpha = 0.38; ctx.stroke();
      // faint baseline (the reversion level) , like a target rate
      ctx.beginPath();
      ctx.setLineDash([2, 6]);
      ctx.moveTo(0, this.baseY); ctx.lineTo(width, this.baseY);
      ctx.strokeStyle = this.color; ctx.globalAlpha = 0.08; ctx.lineWidth = 1; ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
  }

  /* ---------- 4. Converging walkers + links (Contact) ---------- */
  class Node {
    constructor(color) {
      this.reset(true);
      this.color = color;
    }
    reset(initial) {
      const edge = Math.floor(Math.random() * 4);
      if (initial) {
        this.x = Math.random() * width; this.y = Math.random() * height;
      } else if (edge === 0) { this.x = -10; this.y = Math.random() * height; }
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

  let walkers = [], jumpers = [], oupaths = [], nodes = [], target = { x: 0, y: 0 };

  function initProcess() {
    if (process === "walk") {
      walkers = [];
      const count = width < 640 ? 3 : 5;
      for (let i = 0; i < count; i++) {
        walkers.push(new Walker(height * (0.15 + 0.7 * (i / (count - 1 || 1))), COLORS[i % COLORS.length], 0.35 + Math.random() * 0.3, 8 + Math.random() * 10));
      }
    } else if (process === "jump") {
      jumpers = [];
      const count = width < 640 ? 3 : 5;
      for (let i = 0; i < count; i++) {
        jumpers.push(new Jumper(height * (0.15 + 0.7 * (i / (count - 1 || 1))), COLORS[i % COLORS.length], 0.3 + Math.random() * 0.25));
      }
    } else if (process === "ou") {
      oupaths = [];
      const count = width < 640 ? 3 : 5;
      for (let i = 0; i < count; i++) {
        oupaths.push(new OUPath(height * (0.15 + 0.7 * (i / (count - 1 || 1))), COLORS[i % COLORS.length], 0.28 + Math.random() * 0.2, 0.02 + Math.random() * 0.02, 3 + Math.random() * 3));
      }
    } else if (process === "converge") {
      nodes = [];
      target = { x: width * 0.5, y: height * 0.42 };
      const count = width < 640 ? 8 : 14;
      for (let i = 0; i < count; i++) nodes.push(new Node(COLORS[i % COLORS.length]));
    }
  }

  function drawConverge() {
    // faint links between nearby nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 160) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = "#5fb8b3";
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
    // faint target ring
    ctx.beginPath();
    ctx.arc(target.x, target.y, 5, 0, Math.PI * 2);
    ctx.strokeStyle = "#c9a876";
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function frame() {
    ctx.clearRect(0, 0, width, height);
    drawScatter();
    if (process === "walk") walkers.forEach((w) => { w.step(); w.draw(); });
    else if (process === "jump") jumpers.forEach((j) => { j.step(); j.draw(); });
    else if (process === "ou") oupaths.forEach((o) => { o.step(); o.draw(); });
    else if (process === "converge") drawConverge();
    requestAnimationFrame(frame);
  }

  function drawStatic() {
    ctx.clearRect(0, 0, width, height);
    drawScatter();
    if (process === "walk") walkers.forEach((w) => { for (let i = 0; i < 120; i++) w.step(); w.draw(); });
    else if (process === "jump") jumpers.forEach((j) => { for (let i = 0; i < 120; i++) j.step(); j.draw(); });
    else if (process === "ou") oupaths.forEach((o) => { for (let i = 0; i < 120; i++) o.step(); o.draw(); });
    else if (process === "converge") { for (let i = 0; i < 80; i++) drawConverge(); }
  }

  function boot() {
    resize();
    initScatter();
    initProcess();
    if (reduceMotion) drawStatic();
    else frame();
  }

  window.addEventListener("resize", () => {
    resize();
    initScatter();
    initProcess();
  });

  boot();
})();
