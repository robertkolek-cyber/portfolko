"use client";

import { useEffect, useRef } from "react";

const N = 56;

// Rectangle target bounds (normalized 0–1)
const RX0 = 0.22, RY0 = 0.26;
const RX1 = 0.78, RY1 = 0.74;
const RW = RX1 - RX0;
const RH = RY1 - RY0;
const PERIM = 2 * (RW + RH);

// Returns [x, y, outward_nx, outward_ny] for position t ∈ [0,1) along the rectangle perimeter
function perimPoint(t: number): [number, number, number, number] {
  const d = (((t % 1) + 1) % 1) * PERIM;
  const rSide = RW + RH;
  const bSide = rSide + RW;
  if (d < RW)    return [RX0 + d,        RY0,           0,  -1];
  if (d < rSide) return [RX1,            RY0 + d - RW,  1,   0];
  if (d < bSide) return [RX1 - (d - rSide), RY1,        0,   1];
                 return [RX0, RY1 - (d - bSide),        -1,   0];
}

interface Dot {
  wx: number; wy: number; // chaotic wander position
  vx: number; vy: number; // velocity
  tx: number; ty: number; // target on rectangle
  nx: number; ny: number; // outward normal
  breathPhase: number;    // individual phase for wave-like breathing
}

export default function SwarmDots({ chaos, className }: { chaos: number; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const chaosRef = useRef(chaos);
  chaosRef.current = chaos;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 320, H = 200;
    canvas.width = W;
    canvas.height = H;

    const dots: Dot[] = Array.from({ length: N }, (_, i) => {
      const [tx, ty, nx, ny] = perimPoint(i / N);
      return {
        wx: 0.08 + Math.random() * 0.84,
        wy: 0.08 + Math.random() * 0.84,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        tx, ty, nx, ny,
        breathPhase: (i / N) * Math.PI * 2, // wave travels around rectangle
      };
    });

    let smoothChaos = chaosRef.current;
    let time = 0;
    const px = new Float32Array(N);
    const py = new Float32Array(N);

    const draw = () => {
      const dt = 0.016;
      time += dt;

      // Smooth the incoming chaos value to prevent jarring jumps
      smoothChaos += (chaosRef.current - smoothChaos) * 3.5 * dt;
      const c = smoothChaos;
      const clarity = 1 - c;
      // smoothstep — makes the snap-to-rectangle feel organic
      const eased = clarity * clarity * (3 - 2 * clarity);

      // Update wander physics — more aggressive at high chaos
      const kickStr  = 0.004 + c * 0.018;
      const maxSpeed = 0.05 + c * 0.25;
      const damping  = 0.93 - clarity * 0.06;

      for (const d of dots) {
        d.vx += (Math.random() - 0.5) * kickStr;
        d.vy += (Math.random() - 0.5) * kickStr;
        d.vx *= damping;
        d.vy *= damping;
        const spd = Math.hypot(d.vx, d.vy);
        if (spd > maxSpeed) { d.vx *= maxSpeed / spd; d.vy *= maxSpeed / spd; }
        d.wx += d.vx;
        d.wy += d.vy;
        // Bounce
        if (d.wx < 0.04) { d.wx = 0.04; d.vx =  Math.abs(d.vx) * 0.6; }
        if (d.wx > 0.96) { d.wx = 0.96; d.vx = -Math.abs(d.vx) * 0.6; }
        if (d.wy < 0.04) { d.wy = 0.04; d.vy =  Math.abs(d.vy) * 0.6; }
        if (d.wy > 0.96) { d.wy = 0.96; d.vy = -Math.abs(d.vy) * 0.6; }
      }

      // Precompute effective positions (wander ↔ synchronized rectangle target)
      const breathAmp   = 0.012 * eased * eased; // oscillation grows as chaos fades
      const breathSpeed = 1.15;                   // slow, meditative pulse
      for (let i = 0; i < N; i++) {
        const d = dots[i];
        // Breathing: perpendicular to the rectangle edge, phase staggered around perimeter
        const breath = Math.sin(time * breathSpeed + d.breathPhase) * breathAmp;
        const ex = d.tx + d.nx * breath;
        const ey = d.ty + d.ny * breath;
        px[i] = d.wx + (ex - d.wx) * eased;
        py[i] = d.wy + (ey - d.wy) * eased;
      }

      ctx.clearRect(0, 0, W, H);

      // Dashed rectangle guide — fades in as clarity grows
      if (clarity > 0.15) {
        const guideAlpha = Math.min(1, (clarity - 0.15) / 0.5) * 0.14;
        ctx.save();
        ctx.strokeStyle = `rgba(185, 220, 165, ${guideAlpha})`;
        ctx.lineWidth = 0.8;
        ctx.setLineDash([2, 5]);
        ctx.strokeRect(RX0 * W, RY0 * H, RW * W, RH * H);
        ctx.restore();
      }

      // Connecting lines between adjacent dots — appear with clarity
      if (eased > 0.2) {
        const lineAlpha = ((eased - 0.2) / 0.8) * 0.28;
        ctx.save();
        ctx.strokeStyle = `rgba(185, 220, 165, ${lineAlpha})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
          const j = (i + 1) % N;
          ctx.moveTo(px[i] * W, py[i] * H);
          ctx.lineTo(px[j] * W, py[j] * H);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Dots — lavender chaos → lime clarity
      for (let i = 0; i < N; i++) {
        const r = Math.round(168 + clarity * 22);
        const g = Math.round(172 + clarity * 53);
        const b = Math.round(218 - clarity * 58);
        const alpha = 0.32 + eased * 0.48;
        const radius = 1.7 + eased * 0.9;

        ctx.beginPath();
        ctx.arc(px[i] * W, py[i] * H, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", imageRendering: "auto" }}
    />
  );
}
