import React, { useEffect, useRef } from 'react';

export const BackgroundCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    const resize = () => {
      if (!canvas) return;
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);

    let mX = W / 2;
    let mY = H / 2;
    const onMouseMove = (e: MouseEvent) => {
      mX = e.clientX;
      mY = e.clientY;
    };
    document.addEventListener('mousemove', onMouseMove);

    const PC = ['#f0b840', '#e8547a', '#b07fff', '#38d9c0', '#56e3a0', '#4fc3f7', '#ff7e5f'];

    class Particle {
      x: number = 0;
      y: number = 0;
      vx: number = 0;
      vy: number = 0;
      r: number = 1;
      col: string;
      life: number = 1;
      ml: number = 1;
      tw: number = 0;
      ts: number = 0.02;

      constructor(init = false) {
        this.col = PC[Math.floor(Math.random() * PC.length)];
        this.reset(init);
      }

      reset(init = false) {
        this.x = Math.random() * W;
        this.y = init ? Math.random() * H : H + 10;
        this.vy = -(Math.random() * 0.55 + 0.15);
        this.vx = (Math.random() - 0.5) * 0.3;
        this.r = Math.random() * 2.2 + 0.4;
        this.col = PC[Math.floor(Math.random() * PC.length)];
        this.life = Math.random() * 0.5 + 0.3;
        this.ml = this.life;
        this.tw = Math.random() * Math.PI * 2;
        this.ts = Math.random() * 0.04 + 0.01;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.tw += this.ts;
        const dx = this.x - mX;
        const dy = this.y - mY;
        const dist = Math.hypot(dx, dy);
        if (dist < 120 && dist > 0) {
          const f = (120 - dist) / 120;
          this.x += (dx / dist) * f * 2.5;
          this.y += (dy / dist) * f * 2.5;
        }
        this.life -= 0.003;
        if (this.life <= 0 || this.y < -10) {
          this.reset();
        }
      }

      draw() {
        if (!ctx) return;
        const a = Math.max(0, this.life / this.ml) * (0.6 + 0.4 * Math.sin(this.tw));
        ctx.save();
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r * (1 + 0.3 * Math.sin(this.tw)), 0, Math.PI * 2);
        ctx.fillStyle = this.col;
        ctx.shadowColor = this.col;
        ctx.shadowBlur = this.r * 5;
        ctx.fill();
        ctx.restore();
      }
    }

    class Star {
      x: number = Math.random() * W;
      y: number = Math.random() * H;
      r: number = Math.random() * 1.1 + 0.2;
      ph: number = Math.random() * Math.PI * 2;
      sp: number = Math.random() * 0.02 + 0.005;

      draw() {
        if (!ctx) return;
        this.ph += this.sp;
        ctx.save();
        ctx.globalAlpha = (0.3 + 0.7 * Math.abs(Math.sin(this.ph))) * 0.4;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.restore();
      }
    }

    const particles = Array.from({ length: 150 }, () => new Particle(true));
    const stars = Array.from({ length: 90 }, () => new Star());

    const render = () => {
      ctx.clearRect(0, 0, W, H);

      // Radial deep obsidian gradient
      const g = ctx.createRadialGradient(W * 0.3, H * 0.2, 0, W * 0.3, H * 0.2, W * 0.9);
      g.addColorStop(0, 'rgba(22, 8, 44, 0.97)');
      g.addColorStop(0.5, 'rgba(10, 6, 18, 0.99)');
      g.addColorStop(1, 'rgba(10, 6, 18, 1)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // Subtle mouse aura
      const mg = ctx.createRadialGradient(mX, mY, 0, mX, mY, 220);
      mg.addColorStop(0, 'rgba(176, 127, 255, 0.05)');
      mg.addColorStop(1, 'transparent');
      ctx.fillStyle = mg;
      ctx.fillRect(0, 0, W, H);

      stars.forEach((s) => s.draw());
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      // Constellation connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.hypot(dx, dy);
          if (d < 75) {
            ctx.save();
            ctx.globalAlpha = (1 - d / 75) * 0.06;
            ctx.strokeStyle = 'rgba(240, 184, 64, 1)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      animFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} id="bg-canvas" className="fixed inset-0 w-full h-full pointer-events-none z-0" />;
};
