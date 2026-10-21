import React, { useEffect } from 'react';

export const FloatingFX: React.FC = () => {
  useEffect(() => {
    const MEMOJIS = ['💍', '💒', '👰', '🤵', '💑', '💏', '💕', '💖', '🌹', '🎊', '🎉', '✨', '🌸', '💐', '🕌', '🤲', '💫', '🎀', '🫀', '🌷'];
    const PET = ['🌸', '🌹', '✿', '🌺', '❀', '💮'];
    const PC = ['#f0b840', '#e8547a', '#b07fff', '#38d9c0', '#56e3a0', '#4fc3f7', '#ff7e5f'];
    const CHE = ['❤️', '💖', '💕', '💗', '💓', '🌸', '✨', '💫', '🌹', '💒'];

    const spawnFlyEmoji = () => {
      const el = document.createElement('div');
      el.className = 'fly-emoji';
      el.textContent = MEMOJIS[Math.floor(Math.random() * MEMOJIS.length)];

      const mode = Math.floor(Math.random() * 4);
      let fx0 = '0vw', fy0 = '0vh', fx1 = '100vw', fy1 = '100vh', fr0 = '0deg', fr1 = '360deg';

      if (mode === 0) {
        fx0 = '-10vw';
        fy0 = `${Math.random() * 90}vh`;
        fx1 = '110vw';
        fy1 = `${(Math.random() - 0.5) * 30 + parseFloat(fy0)}vh`;
        fr0 = '-20deg';
        fr1 = '20deg';
      } else if (mode === 1) {
        fx0 = '110vw';
        fy0 = `${Math.random() * 90}vh`;
        fx1 = '-10vw';
        fy1 = `${(Math.random() - 0.5) * 30 + parseFloat(fy0)}vh`;
        fr0 = '20deg';
        fr1 = '-20deg';
      } else if (mode === 2) {
        fx0 = `${Math.random() * 90}vw`;
        fy0 = '-10vh';
        fx1 = `${(Math.random() - 0.5) * 20 + parseFloat(fx0)}vw`;
        fy1 = '110vh';
        fr0 = '0deg';
        fr1 = '360deg';
      } else {
        fx0 = `${Math.random() * 90}vw`;
        fy0 = '110vh';
        fx1 = `${(Math.random() - 0.5) * 20 + parseFloat(fx0)}vw`;
        fy1 = '-10vh';
        fr0 = '0deg';
        fr1 = '-360deg';
      }

      const dur = 10 + Math.random() * 14;
      const delay = Math.random() * 4;

      el.style.cssText = `--fx0:${fx0};--fy0:${fy0};--fx1:${fx1};--fy1:${fy1};--fr0:${fr0};--fr1:${fr1};--fdur:${dur}s;--fdelay:${delay}s;font-size:${
        1.1 + Math.random() * 0.7
      }rem;`;

      document.body.appendChild(el);
      setTimeout(() => el.remove(), (dur + delay) * 1000 + 400);
    };

    const spawnPetal = () => {
      const p = document.createElement('div');
      p.className = 'petal';
      p.textContent = PET[Math.floor(Math.random() * PET.length)];
      p.style.left = `${Math.random() * 100}vw`;
      const dur = 9 + Math.random() * 10;
      const delay = Math.random() * 3;
      p.style.animationDuration = `${dur}s`;
      p.style.animationDelay = `${delay}s`;
      p.style.fontSize = `${0.7 + Math.random() * 0.7}rem`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), (dur + delay) * 1000 + 400);
    };

    const handleClick = (e: MouseEvent) => {
      // Ignore click FX inside form inputs, buttons in admin, or dialogs
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('.admin-drawer'))) {
        return;
      }

      const burst = document.createElement('div');
      burst.className = 'click-burst';
      burst.style.left = `${e.clientX}px`;
      burst.style.top = `${e.clientY}px`;
      document.body.appendChild(burst);

      for (let i = 0; i < 18; i++) {
        const p = document.createElement('div');
        p.className = 'click-particle';
        const ang = (i / 18) * Math.PI * 2;
        const dist = 40 + Math.random() * 70;
        const dur = 0.5 + Math.random() * 0.4;
        const col = PC[Math.floor(Math.random() * PC.length)];
        const sz = 5 + Math.random() * 6;
        p.style.cssText = `width:${sz}px;height:${sz}px;background:${col};box-shadow:0 0 ${
          sz * 2
        }px ${col};left:0;top:0;--tx:${Math.cos(ang) * dist}px;--ty:${Math.sin(ang) * dist}px;--dur:${dur}s;`;
        burst.appendChild(p);
      }
      setTimeout(() => burst.remove(), 1000);

      const h = document.createElement('div');
      h.className = 'click-heart-float';
      h.textContent = CHE[Math.floor(Math.random() * CHE.length)];
      h.style.left = `${e.clientX}px`;
      h.style.top = `${e.clientY}px`;
      document.body.appendChild(h);
      setTimeout(() => h.remove(), 1000);
    };

    // Initial batch
    for (let i = 0; i < 16; i++) spawnFlyEmoji();
    for (let i = 0; i < 10; i++) spawnPetal();

    const emojiTimer = setInterval(spawnFlyEmoji, 2200);
    const petalTimer = setInterval(spawnPetal, 3200);
    document.addEventListener('click', handleClick);

    return () => {
      clearInterval(emojiTimer);
      clearInterval(petalTimer);
      document.removeEventListener('click', handleClick);
      document.querySelectorAll('.fly-emoji, .petal, .click-burst, .click-heart-float').forEach((el) => el.remove());
    };
  }, []);

  return null;
};
