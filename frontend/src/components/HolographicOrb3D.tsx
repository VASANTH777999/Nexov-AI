'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface HolographicOrb3DProps {
  state?: 'idle' | 'listening' | 'thinking' | 'speaking';
  agentState?: 'idle' | 'listening' | 'thinking' | 'speaking';
  speaker?: 'caller' | 'agent' | 'idle';
  intensity?: number;
  className?: string;
}

export const HolographicOrb3D: React.FC<HolographicOrb3DProps> = ({
  state,
  agentState,
  speaker = 'idle',
  intensity = 1.0,
  className = 'w-full h-full',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Normalize state
  const effectiveState = state || agentState || 'idle';

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 19;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Multi-color Gemini Particle System (2,200 points)
    const particleCount = 2200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);

    const radius = 6.4;
    // Iconic Gemini palette: Cyan, Sky Blue, Electric Indigo, Neon Purple, Sunset Coral, Golden Amber
    const colorPalette = [
      new THREE.Color('#2dd4bf'), // teal
      new THREE.Color('#38bdf8'), // sky
      new THREE.Color('#818cf8'), // indigo
      new THREE.Color('#c084fc'), // purple
      new THREE.Color('#fb7185'), // rose
      new THREE.Color('#fbbf24'), // amber
    ];

    for (let i = 0; i < particleCount; i++) {
      // Golden ratio Fibonacci sphere
      const phi = Math.acos(1 - (2 * (i + 0.5)) / particleCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      // Color mapping with radial hue gradient
      const c = colorPalette[i % colorPalette.length];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle circular blur texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.25, 'rgba(56,189,248,0.9)');
      gradient.addColorStop(0.6, 'rgba(129,140,248,0.4)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.42,
      map: texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // 3. Inner Holographic Core Mesh
    const coreGeo = new THREE.IcosahedronGeometry(3.0, 2);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);

    // 4. Subtle Outer Equatorial Rings
    const ringGeo = new THREE.TorusGeometry(7.2, 0.05, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      transparent: true,
      opacity: 0.35,
    });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 3;
    scene.add(ring1);

    const ring2 = new THREE.Mesh(ringGeo, ringMat.clone());
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.y = Math.PI / 4;
    scene.add(ring2);

    // 5. Interactive Mouse Parallax
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 6. Animation Loop
    let clock = new THREE.Clock();
    let frameId: number;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // State-based dynamics
      let speedMult = 1.0;
      let waveAmpl = 0.25;

      if (effectiveState === 'speaking' || speaker === 'agent') {
        speedMult = 2.5;
        waveAmpl = 0.85 * Math.max(0.6, intensity);
      } else if (effectiveState === 'thinking') {
        speedMult = 1.9;
        waveAmpl = 0.5;
      } else if (effectiveState === 'listening' || speaker === 'caller') {
        speedMult = 1.6;
        waveAmpl = 0.65 * Math.max(0.6, intensity);
      }

      particles.rotation.y = elapsedTime * 0.18 * speedMult;
      particles.rotation.x = elapsedTime * 0.09 * speedMult;
      coreMesh.rotation.y = -elapsedTime * 0.3 * speedMult;
      coreMesh.rotation.z = elapsedTime * 0.15 * speedMult;
      ring1.rotation.z = elapsedTime * 0.25 * speedMult;
      ring2.rotation.z = -elapsedTime * 0.2 * speedMult;

      // Parallax smooth camera look
      camera.position.x += (mouseX * 2.8 - camera.position.x) * 0.05;
      camera.position.y += (mouseY * 2.8 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      // Vertex Harmonic Wave Displacement
      const posAttr = geometry.attributes.position;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const ox = originalPositions[i * 3];
        const oy = originalPositions[i * 3 + 1];
        const oz = originalPositions[i * 3 + 2];

        const harmonic =
          Math.sin(elapsedTime * 3.5 * speedMult + ox * 0.6 + oy * 0.6) *
          Math.cos(elapsedTime * 2.0 * speedMult + oz * 0.5);

        const displacement = 1 + harmonic * waveAmpl * 0.22;

        posArray[i * 3] = ox * displacement;
        posArray[i * 3 + 1] = oy * displacement;
        posArray[i * 3 + 2] = oz * displacement;
      }
      posAttr.needsUpdate = true;

      // Core pulse
      const coreScale = 1 + Math.sin(elapsedTime * 4.5 * speedMult) * 0.15 * waveAmpl;
      coreMesh.scale.set(coreScale, coreScale, coreScale);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      renderer.dispose();
    };
  }, [effectiveState, speaker, intensity]);

  return (
    <div
      ref={mountRef}
      className={`relative flex items-center justify-center overflow-hidden pointer-events-auto ${className}`}
    />
  );
};
