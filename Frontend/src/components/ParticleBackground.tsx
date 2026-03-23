import { useEffect, useRef } from 'react';

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    let mouseX = W / 2;
    let mouseY = H / 2;
    let animId: number;
    let time = 0;

    const onMouseMove = (e: MouseEvent) => { mouseX = e.clientX; mouseY = e.clientY; };
    window.addEventListener('mousemove', onMouseMove);
    const onResize = () => {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W; canvas.height = H;
    };
    window.addEventListener('resize', onResize);

    // STARS
    const stars = Array.from({ length: 250 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.8 + 0.3,
      alpha: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.02 + 0.005,
      offset: Math.random() * Math.PI * 2,
    }));

    // ORBS
    const ORB_COLORS = [
      { r: 108, g: 99, b: 255 },
      { r: 0,   g: 198, b: 255 },
      { r: 255, g: 101, b: 132 },
      { r: 67,  g: 233, b: 123 },
      { r: 247, g: 151, b: 30  },
      { r: 236, g: 72,  b: 153 },
      { r: 99,  g: 220, b: 200 },
    ];

    const orbs = Array.from({ length: 16 }, (_, i) => {
      const depth = Math.random() * 0.8 + 0.2;
      const col = ORB_COLORS[i % ORB_COLORS.length];
      return {
        baseX: Math.random() * W, baseY: Math.random() * H,
        x: 0, y: 0,
        radius: depth * 90 + 30,
        depth, col,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.15,
        floatAmp: Math.random() * 40 + 20,
        floatSpeed: Math.random() * 0.5 + 0.15,
        floatOff: Math.random() * Math.PI * 2,
        pulseOff: Math.random() * Math.PI * 2,
      };
    });

    // NODES (particle network)
    const nodes = Array.from({ length: 80 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: Math.random() * 2 + 1,
    }));

    // RINGS
    const rings = Array.from({ length: 8 }, (_, i) => ({
      cx: Math.random() * W,
      cy: Math.random() * H,
      rx: Math.random() * 140 + 50,
      tilt: Math.random() * Math.PI,
      rot: Math.random() * Math.PI,
      rotSpeed: (Math.random() - 0.5) * 0.006,
      tiltSpeed: (Math.random() - 0.5) * 0.004,
      col: ORB_COLORS[i % ORB_COLORS.length],
      alpha: 0.06 + Math.random() * 0.1,
      lw: Math.random() * 1.5 + 0.5,
    }));

    // SHOOTING STARS
    type ShootingStar = { x: number; y: number; len: number; speed: number; alpha: number; active: boolean };
    const shooters: ShootingStar[] = [];
    const spawnShooter = () => {
      shooters.push({
        x: Math.random() * W * 0.8, y: Math.random() * H * 0.4,
        len: Math.random() * 120 + 60,
        speed: Math.random() * 7 + 5,
        alpha: 1, active: true,
      });
    };

    // DRAW
    const draw = () => {
      time += 0.016;

      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, W * 0.5, H);
      bg.addColorStop(0, '#050010');
      bg.addColorStop(0.4, '#080020');
      bg.addColorStop(0.7, '#060015');
      bg.addColorStop(1, '#020008');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // PERSPECTIVE GRID at bottom
      ctx.save();
      ctx.globalAlpha = 0.18;
      const horizon = H * 0.74;
      const gc = 22, gr = 12;
      for (let c = 0; c <= gc; c++) {
        const x = (c / gc) * W;
        const alpha = 0.7 - Math.abs(c / gc - 0.5) * 1.2;
        ctx.strokeStyle = `rgba(108,99,255,${Math.max(0, alpha)})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(W / 2 + (x - W / 2) * 0.04, horizon);
        ctx.lineTo(x, H + 60);
        ctx.stroke();
      }
      for (let r = 0; r <= gr; r++) {
        const t = r / gr;
        const y = horizon + (H - horizon + 60) * (t * t);
        ctx.strokeStyle = `rgba(108,99,255,${0.55 - t * 0.45})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      ctx.restore();

      // TWINKLING STARS
      stars.forEach(s => {
        const a = s.alpha * (0.5 + 0.5 * Math.sin(time * s.speed * 60 + s.offset));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
      });

      // SHOOTING STARS
      if (Math.random() < 0.005) spawnShooter();
      for (let i = shooters.length - 1; i >= 0; i--) {
        const ss = shooters[i];
        if (!ss.active) { shooters.splice(i, 1); continue; }
        const g = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.len, ss.y + ss.len * 0.35);
        g.addColorStop(0, `rgba(255,255,255,${ss.alpha})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x - ss.len, ss.y + ss.len * 0.35);
        ctx.stroke();
        ss.x += ss.speed * 1.2; ss.y += ss.speed * 0.4;
        ss.alpha -= 0.013;
        if (ss.alpha <= 0 || ss.x > W + 150) ss.active = false;
      }

      // GLOWING ORBS
      orbs.forEach((orb, i) => {
        const px = (mouseX / W - 0.5) * 50 * orb.depth;
        const py = (mouseY / H - 0.5) * 35 * orb.depth;
        orb.x = orb.baseX + px + Math.sin(time * orb.floatSpeed + orb.floatOff) * orb.floatAmp;
        orb.y = orb.baseY + py + Math.cos(time * orb.floatSpeed * 0.7 + orb.floatOff) * orb.floatAmp * 0.6;
        orb.baseX += orb.vx; orb.baseY += orb.vy;
        if (orb.baseX < -250) orb.baseX = W + 250;
        if (orb.baseX > W + 250) orb.baseX = -250;
        if (orb.baseY < -250) orb.baseY = H + 250;
        if (orb.baseY > H + 250) orb.baseY = -250;

        const pulse = 0.5 + 0.5 * Math.sin(time * 0.9 + orb.pulseOff + i * 0.5);
        const alpha = (0.12 + 0.08 * orb.depth) * (0.7 + 0.3 * pulse);
        const glowR = orb.radius * (2.0 + 0.5 * pulse);
        const { r, g, b } = orb.col;

        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, glowR);
        grad.addColorStop(0, `rgba(${r},${g},${b},${alpha * 3.5})`);
        grad.addColorStop(0.25, `rgba(${r},${g},${b},${alpha * 2})`);
        grad.addColorStop(0.6, `rgba(${r},${g},${b},${alpha * 0.8})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        // bright core
        const core = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius * 0.35);
        core.addColorStop(0, `rgba(255,255,255,${0.25 * orb.depth * pulse})`);
        core.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3D RINGS
      rings.forEach(ring => {
        ring.rot += ring.rotSpeed;
        ring.tilt += ring.tiltSpeed;
        const ry = Math.abs(Math.sin(ring.tilt)) * ring.rx * 0.45;
        const { r, g, b } = ring.col;

        ctx.save();
        ctx.translate(ring.cx, ring.cy);
        ctx.rotate(ring.rot);
        ctx.scale(1, ry / ring.rx);

        ctx.beginPath();
        ctx.ellipse(0, 0, ring.rx, ring.rx, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r},${g},${b},${ring.alpha})`;
        ctx.lineWidth = ring.lw;
        ctx.shadowColor = `rgba(${r},${g},${b},0.5)`;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.restore();
      });

      // PARTICLE NETWORK
      const CDIST = 140;
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CDIST) {
            const a = (1 - dist / CDIST) * 0.3;
            ctx.strokeStyle = `rgba(108,99,255,${a})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach(n => {
        // glow
        const ng = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 5);
        ng.addColorStop(0, 'rgba(108,99,255,0.4)');
        ng.addColorStop(1, 'rgba(108,99,255,0)');
        ctx.fillStyle = ng;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 5, 0, Math.PI * 2);
        ctx.fill();
        // dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(180,170,255,0.9)';
        ctx.fill();
      });

      // MOUSE AURA
      const aura = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 220);
      aura.addColorStop(0, 'rgba(108,99,255,0.1)');
      aura.addColorStop(0.4, 'rgba(0,198,255,0.04)');
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 220, 0, Math.PI * 2);
      ctx.fill();

      // VIGNETTE
      const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.95);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,10,0.65)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        display: 'block',
        pointerEvents: 'none',
      }}
    />
  );
}
