import React, { useEffect, useState } from 'react';

export const CustomCursor: React.FC = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [ringPos, setRingPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    document.body.classList.add('has-custom-cursor');

    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      setPos({ x: targetX, y: targetY });

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.closest('.admin-dashboard') ||
          target.closest('.admin-modal') ||
          target.closest('input') ||
          target.closest('textarea') ||
          target.closest('select') ||
          document.body.classList.contains('admin-active'))
      ) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };

    let animFrame: number;
    const animateRing = () => {
      currentX += (targetX - currentX) * 0.15;
      currentY += (targetY - currentY) * 0.15;
      setRingPos({ x: currentX, y: currentY });
      animFrame = requestAnimationFrame(animateRing);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.closest('a') ||
          target.closest('button') ||
          target.closest('.det') ||
          target.closest('.fam-card') ||
          target.closest('.hobby') ||
          target.closest('.pref-card') ||
          target.closest('.badge'))
      ) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    animateRing();

    return () => {
      document.body.classList.remove('has-custom-cursor');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <div
        id="cursor-wrap"
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
        }}
      >
        <span id="cursor-heart">❤️</span>
      </div>
      <div
        id="cursor-ring"
        style={{
          left: `${ringPos.x}px`,
          top: `${ringPos.y}px`,
          width: isHovered ? '58px' : '38px',
          height: isHovered ? '58px' : '38px',
          borderColor: isHovered ? 'rgba(232,84,122,0.7)' : 'rgba(240,184,64,0.45)',
        }}
      />
    </>
  );
};
