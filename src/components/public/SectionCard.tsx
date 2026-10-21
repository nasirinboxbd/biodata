import React, { useEffect, useRef } from 'react';

interface SectionCardProps {
  accent: 'gold' | 'rose' | 'teal' | 'lavender' | 'mint' | 'sky';
  pcol: string; // RGB values e.g. "255,184,64"
  icon: string | React.ReactNode;
  title: string;
  titleGradientClass?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  accent,
  pcol,
  icon,
  title,
  titleGradientClass = 'grad-text',
  children,
  className = '',
  id,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let cw = (canvas.width = canvas.offsetWidth || 300);
    let ch = (canvas.height = canvas.offsetHeight || 200);

    const [r, g, b] = pcol.split(',').map((val) => Number(val.trim()));
    const colors = [
      `rgba(${r},${g},${b},0.85)`,
      `rgba(${Math.min(255, r + 40)},${Math.min(255, g + 40)},${Math.min(255, b + 40)},0.9)`,
      `rgba(${Math.max(0, r - 30)},${Math.max(0, g - 30)},${Math.max(0, b - 30)},0.7)`,
      '#ffffff',
      '#f0b840',
    ];

    class Spark {
      x: number = 0;
      y: number = 0;
      vx: number = 0;
      vy: number = 0;
      r: number = 1;
      alpha: number = 0.5;
      life: number = 1;
      decay: number = 0.003;
      tw: number = 0;
      ts: number = 0.02;
      color: string;

      constructor() {
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.reset();
      }

      reset() {
        this.x = Math.random() * cw;
        this.y = Math.random() * ch;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = -(Math.random() * 0.45 + 0.1);
        this.r = Math.random() * 2 + 0.5;
        this.alpha = Math.random() * 0.45 + 0.15;
        this.life = Math.random();
        this.decay = Math.random() * 0.003 + 0.001;
        this.tw = Math.random() * Math.PI * 2;
        this.ts = Math.random() * 0.03 + 0.01;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.tw += this.ts;
        this.life -= this.decay;
        if (this.life <= 0 || this.y < -5 || this.x < -5 || this.x > cw + 5) {
          this.reset();
        }
      }

      draw(c: CanvasRenderingContext2D) {
        const a = this.alpha * this.life * (0.7 + 0.3 * Math.sin(this.tw));
        c.save();
        c.globalAlpha = Math.max(0, a);
        c.beginPath();
        c.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.shadowColor = this.color;
        c.shadowBlur = this.r * 3;
        c.fill();
        c.restore();
      }
    }

    const sparks = Array.from({ length: 24 }, () => new Spark());

    const render = () => {
      ctx.clearRect(0, 0, cw, ch);
      sparks.forEach((s) => {
        s.update();
        s.draw(ctx);
      });
      animFrame = requestAnimationFrame(render);
    };

    render();

    let resizeFrame: number;
    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        if (!canvas) return;
        cw = canvas.width = canvas.offsetWidth;
        ch = canvas.height = canvas.offsetHeight;
        sparks.forEach((s) => s.reset());
      });
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    return () => {
      cancelAnimationFrame(animFrame);
      cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
    };
  }, [pcol]);

  return (
    <section
      id={id}
      className={`section visible ${className}`}
      data-accent={accent}
      data-pcol={pcol}
    >
      <canvas ref={canvasRef} className="spc" />
      <div className="sc">
        <div className="sec-head">
          <div className={`sec-icon ${accent}`}>{icon}</div>
          <h2 className="sec-title">
            <span className={titleGradientClass}>{title}</span>
          </h2>
        </div>
        {children}
      </div>
    </section>
  );
};
