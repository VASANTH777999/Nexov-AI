'use client';

import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isActive: boolean;
  isMuted?: boolean;
  speaker?: 'caller' | 'agent' | 'idle';
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isActive,
  isMuted = false,
  speaker = 'idle',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;
      const barCount = 36;
      const barWidth = 3;
      const gap = (width - barCount * barWidth) / (barCount - 1);

      phase += 0.08;

      for (let i = 0; i < barCount; i++) {
        let barHeight = 6;

        if (isActive && !isMuted) {
          // Dynamic harmonic height based on phase and index
          const sinVal = Math.sin(phase + i * 0.35);
          const cosVal = Math.cos(phase * 1.5 + i * 0.2);
          const modulation = Math.abs(sinVal * cosVal);

          if (speaker === 'agent') {
            // Smooth, professional agent voice wave
            barHeight = 10 + modulation * (height * 0.72);
          } else if (speaker === 'caller') {
            // Dynamic caller voice wave
            barHeight = 8 + modulation * (height * 0.85);
          } else {
            // Ambient idle breathing wave
            barHeight = 8 + Math.abs(Math.sin(phase * 0.6 + i * 0.15)) * 14;
          }
        }

        const x = i * (barWidth + gap);
        const y = centerY - barHeight / 2;

        // Gradient based on speaker
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (speaker === 'agent') {
          gradient.addColorStop(0, '#2dd4bf'); // teal-400
          gradient.addColorStop(1, '#0284c7'); // sky-600
        } else if (speaker === 'caller') {
          gradient.addColorStop(0, '#38bdf8'); // sky-400
          gradient.addColorStop(1, '#818cf8'); // indigo-400
        } else {
          gradient.addColorStop(0, 'rgba(148, 163, 184, 0.4)');
          gradient.addColorStop(1, 'rgba(100, 116, 139, 0.2)');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, Math.max(barHeight, 4), [3]);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, isMuted, speaker]);

  return (
    <div className="w-full flex items-center justify-center py-2 px-3">
      <canvas
        ref={canvasRef}
        width={300}
        height={54}
        className="w-full max-w-[280px] h-[48px]"
      />
    </div>
  );
};

