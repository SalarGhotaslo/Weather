"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number; y: number;
  size: number;
  speed: number;
  opacity: number;
  driftX: number;
}

// Subtle floating-particle field — tiny dots drifting upward slowly with
// gentle horizontal sway.  Pure canvas (no DOM nodes), so it's performant
// even on low-end devices.
export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Seed particles
    const count = 60;
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 1.5 + Math.random() * 2.5,
      speed: 0.15 + Math.random() * 0.35,
      opacity: 0.2 + Math.random() * 0.4,
      driftX: (Math.random() - 0.5) * 0.3,
    }));

    let start = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - start) / 16, 3);
      start = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particlesRef.current) {
        p.y -= p.speed * dt;
        p.x += p.driftX * dt;

        // Wrap around bottom when they drift off top
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        // Wrap horizontally
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(160, 200, 240, ${p.opacity})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    />
  );
}
