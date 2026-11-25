'use client';

import React, { useRef, useState, ReactNode } from 'react';

interface Interactive3DCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number; // max tilt angle in degrees, default 10
  glareEffect?: boolean;
  onClick?: () => void;
}

export const Interactive3DCard: React.FC<Interactive3DCardProps> = ({
  children,
  className = '',
  maxTilt = 8,
  glareEffect = true,
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = -((y - centerY) / centerY) * maxTilt;
    const tiltY = ((x - centerX) / centerX) * maxTilt;

    setRotateX(tiltX);
    setRotateY(tiltY);

    if (glareEffect) {
      setGlarePos({
        x: (x / rect.width) * 100,
        y: (y / rect.height) * 100,
        opacity: 0.18,
      });
    }
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`perspective-container transition-transform duration-200 ease-out cursor-pointer ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transformStyle: 'preserve-3d',
      }}
    >
      <div className="relative w-full h-full preserve-3d">
        {children}

        {/* Dynamic Specular 3D Glare */}
        {glareEffect && (
          <div
            className="absolute inset-0 rounded-[inherit] pointer-events-none transition-opacity duration-300"
            style={{
              opacity: glarePos.opacity,
              background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 65%)`,
            }}
          />
        )}
      </div>
    </div>
  );
};

