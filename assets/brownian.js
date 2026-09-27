/* ============================================================
   Stochastic backdrop: multiple simulated Brownian-motion / random-walk
   paths continuously tracing themselves behind the hero section,
   plus a faint scatter of "data points" (Poisson-like) for texture.
   Pure canvas, no dependencies, respects prefers-reduced-motion.
   ============================================================ */
(function () {
  const canvas = document.getElementById("walkCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width, height, dpr;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const COLORS = ["#c9a876", "#5fb8b3", "#8c96b3"];

  class Walker {
    constructor(seedY, color, speed, vol) {
      this.color = color;
      this.speed = speed;
      this.vol = vol;
      this.points = [];
      this.x = -20;
      this.y = seedY;
      this.baseY = seedY;
      this.t = Math.random() * 1000;
    }
    step() {
      this.t += this.speed;
      // Geometric-ish random walk with mean reversion toward baseY
      const shock = (Math.random() - 0.5) * this.vol;
      const revert = (this.baseY - this.y) * 0.01;
      this.y += shock + revert + Math.sin(this.t * 0.01) * 0.4;
      this.x += this.speed * 6;
      this.points.push({ x: this.x, y: this.y });
      if (this.points.length > 260) this.points.shift();
      if (this.x > width + 40) {
        this.x = -20;
        this.points = [];
      }
    }
    draw() {
      if (this.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1.3;
      ctx.globalAlpha = 0.55;
      ctx.stroke();

      // leading point glow
      const last = this.points[this.points.length - 1];
      ctx.beginPath();
      ctx.arc(last.x, last.y, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = 0.9;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  let walkers = [];
  function initWalkers() {
    walkers = [];
    const count = width < 640 ? 3 : 5;
    for (let i = 0; i < count; i++) {
      const seedY = height * (0.2 + 0.6 * (i / (count - 1 || 1)));
      const color = COLORS[i % COLORS.length];
      const speed = 0.35 + Math.random() * 0.3;
      const vol = 8 + Math.random() * 10;
      walkers.push(new Walker(seedY, color, speed, vol));
    }
  }

  // faint scatter points (Poisson-process style texture)
  let scatter = [];
  function initScatter() {
    scatter = [];
    const n = Math.floor((width * height) / 26000);
    for (let i = 0; i < n; i++) {
      scatter.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.2 + 0.3,
        a: Math.random() * 0.25 + 0.05,
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

  function frame() {
    ctx.clearRect(0, 0, width, height);
    drawScatter();
    walkers.forEach((w) => {
      w.step();
      w.draw();
    });
    requestAnimationFrame(frame);
  }

  function drawStatic() {
    // single quiet frame for reduced-motion users
    ctx.clearRect(0, 0, width, height);
    drawScatter();
    walkers.forEach((w) => {
      for (let i = 0; i < 120; i++) w.step();
      w.draw();
    });
  }

  function boot() {
    resize();
    initWalkers();
    initScatter();
    if (reduceMotion) {
      drawStatic();
    } else {
      frame();
    }
  }

  window.addEventListener("resize", () => {
    resize();
    initWalkers();
    initScatter();
  });

  boot();
})();
