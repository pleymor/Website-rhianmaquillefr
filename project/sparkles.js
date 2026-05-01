(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99;';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;

  /**
   * Resize the canvas to fit the viewport while accounting for DPR.
   */
  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  /**
   * Read a CSS variable from :root.
   * @param {string} name CSS variable name (with leading --).
   * @param {string} fallback Default if unset.
   * @returns {string}
   */
  function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  const COLORS = [
    cssVar('--gold', '#C9A26A'),
    cssVar('--gold-soft', '#E5CFA8'),
    cssVar('--accent-soft', '#F5C5BD'),
  ];

  /**
   * Random float in [min, max).
   */
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  /**
   * Build a fresh particle, optionally placed at the bottom for re-spawn.
   * @param {boolean} fromBottom
   */
  function makeParticle(fromBottom) {
    return {
      x: rand(0, w),
      y: fromBottom ? h + rand(0, 30) : rand(0, h),
      r: rand(0.6, 2.2),
      vx: rand(-0.12, 0.12),
      vy: rand(-0.35, -0.08),
      phase: rand(0, Math.PI * 2),
      twinkleSpeed: rand(0.012, 0.035),
      baseAlpha: rand(0.35, 0.85),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  }

  const density = Math.min(80, Math.max(30, Math.floor((w * h) / 22000)));
  const particles = Array.from({ length: density }, () => makeParticle(false));

  let lastScrollY = window.scrollY;
  let scrollImpulse = 0;
  let scrollGlow = 0;

  window.addEventListener(
    'scroll',
    () => {
      const dy = window.scrollY - lastScrollY;
      scrollImpulse += dy * 0.04;
      scrollGlow = Math.min(scrollGlow + Math.abs(dy) * 0.02, 1.2);
      lastScrollY = window.scrollY;
    },
    { passive: true }
  );

  /**
   * Animation loop: integrates motion, twinkle and scroll-driven drift.
   */
  function tick() {
    ctx.clearRect(0, 0, w, h);

    scrollImpulse *= 0.9;
    scrollGlow *= 0.94;

    for (const p of particles) {
      p.x += p.vx + Math.sin(p.phase * 0.7) * 0.15;
      p.y += p.vy + scrollImpulse;
      p.phase += p.twinkleSpeed;

      if (p.y < -10) Object.assign(p, makeParticle(true));
      else if (p.y > h + 30) Object.assign(p, makeParticle(false), { y: -10 });
      if (p.x < -10) p.x = w + 10;
      else if (p.x > w + 10) p.x = -10;

      const twinkle = (Math.sin(p.phase) + 1) * 0.5;
      const alpha = Math.min(
        p.baseAlpha * (0.45 + twinkle * 0.55) * (1 + scrollGlow * 0.4),
        1
      );
      const radius = p.r * (1 + scrollGlow * 0.15);

      ctx.globalAlpha = alpha * 0.18;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
