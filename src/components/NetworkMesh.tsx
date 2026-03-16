"use client";

import { useEffect, useRef, useCallback } from "react";

/* ---------- spring physics ---------- */
interface Spring {
  value: number;
  velocity: number;
  target: number;
}

function stepSpring(s: Spring, tension: number, friction: number, dt: number) {
  const force = (s.target - s.value) * tension;
  s.velocity = (s.velocity + force * dt) * friction;
  s.value += s.velocity * dt;
}

/* ---------- types ---------- */
interface Node {
  sx: Spring; // x position spring
  sy: Spring; // y position spring
  chaosOriginX: number;
  chaosOriginY: number;
  targetX: number;
  targetY: number;
  mass: number; // 0.6–1.4, heavier = slower spring
  radius: number;
  phase: number;
  delay: number; // stagger delay before settling
  pulsePhase: number;
  settled: boolean;
}

interface Edge {
  from: number;
  to: number;
  drawProgress: Spring; // 0→1, how much of the line is drawn
  pulseOffset: number;
  isClarityEdge: boolean;
}

/* ---------- layout ---------- */
const GRID = [
  // Left cluster — organic network
  { x: 0.08, y: 0.18 }, { x: 0.04, y: 0.48 }, { x: 0.16, y: 0.68 },
  { x: 0.22, y: 0.32 }, { x: 0.03, y: 0.78 }, { x: 0.2, y: 0.12 },
  { x: 0.14, y: 0.5 },
  // Middle — flowchart
  { x: 0.42, y: 0.22 }, { x: 0.56, y: 0.22 }, { x: 0.49, y: 0.48 },
  { x: 0.42, y: 0.72 }, { x: 0.56, y: 0.72 },
  // Right — structured card
  { x: 0.78, y: 0.22 }, { x: 0.78, y: 0.37 }, { x: 0.78, y: 0.52 },
  { x: 0.78, y: 0.67 }, { x: 0.9, y: 0.3 }, { x: 0.9, y: 0.6 },
];

const CLARITY_EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 0], [0, 3], [1, 6], [6, 3], [4, 2], [5, 0], [5, 3],
  [7, 8], [8, 9], [9, 10], [10, 11], [7, 9],
  [12, 13], [13, 14], [14, 15], [16, 17], [12, 16],
];

export default function NetworkMesh({
  progress,
  className,
}: {
  progress: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const frameRef = useRef(0);
  const timeRef = useRef(0);
  const prevProgressRef = useRef(0);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const initScene = useCallback((w: number, h: number) => {
    const nodes: Node[] = GRID.map((gp, i) => {
      const cx = Math.random() * w;
      const cy = Math.random() * h;
      const mass = 0.6 + Math.random() * 0.8;
      return {
        sx: { value: cx, velocity: 0, target: cx },
        sy: { value: cy, velocity: 0, target: cy },
        chaosOriginX: cx,
        chaosOriginY: cy,
        targetX: gp.x * w,
        targetY: gp.y * h,
        mass,
        radius: 2.5 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        // Stagger: center nodes settle first, outer later
        delay: 0.05 + (Math.abs(gp.x - 0.5) + Math.abs(gp.y - 0.5)) * 0.25,
        pulsePhase: Math.random() * Math.PI * 2,
        settled: false,
      };
    });

    // Build edges — chaos gets random connections, clarity gets specific ones
    const edgeSet = new Set<string>();
    const edges: Edge[] = [];
    const addEdge = (from: number, to: number, isClarity: boolean) => {
      const key = `${Math.min(from, to)}-${Math.max(from, to)}`;
      if (edgeSet.has(key)) return;
      edgeSet.add(key);
      edges.push({
        from,
        to,
        drawProgress: { value: isClarity ? 0 : 0.8, velocity: 0, target: 0 },
        pulseOffset: Math.random() * 100,
        isClarityEdge: isClarity,
      });
    };

    // Random chaos edges
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.random() < 0.15) addEdge(i, j, false);
      }
    }
    // Clarity-specific edges
    for (const [a, b] of CLARITY_EDGES) addEdge(a, b, true);

    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      if (nodesRef.current.length === 0) {
        initScene(w, h);
      } else {
        nodesRef.current.forEach((node, i) => {
          node.targetX = GRID[i].x * w;
          node.targetY = GRID[i].y * h;
        });
      }
    };

    resize();
    window.addEventListener("resize", resize);

    /* ---------- render loop ---------- */
    const animate = () => {
      const dt = 0.016;
      timeRef.current += dt;
      const t = timeRef.current;
      const p = progressRef.current;

      // Detect direction of morph for anticipation
      const pDelta = p - prevProgressRef.current;
      prevProgressRef.current = p;

      ctx.clearRect(0, 0, w, h);

      const nodes = nodesRef.current;
      const edges = edgesRef.current;

      /* --- update nodes --- */
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Chaos target: organic Lissajous orbit
        const a1 = 0.3 + (i % 3) * 0.15;
        const a2 = 0.2 + (i % 4) * 0.12;
        const chaosX =
          node.chaosOriginX +
          Math.sin(t * a1 + node.phase) * 70 +
          Math.sin(t * a1 * 0.7 + node.phase * 2.3) * 40;
        const chaosY =
          node.chaosOriginY +
          Math.cos(t * a2 + node.phase * 1.4) * 55 +
          Math.cos(t * a2 * 0.6 + node.phase * 0.8) * 35;

        // Clarity target: grid pos + very subtle breathing
        const breathAmp = 2;
        const clarityX = node.targetX + Math.sin(t * 0.5 + node.phase) * breathAmp;
        const clarityY = node.targetY + Math.cos(t * 0.4 + node.phase * 1.3) * breathAmp;

        // Staggered progress — each node has its own effective progress
        const effectiveP = Math.max(0, Math.min(1, (p - node.delay) / (1 - node.delay)));
        // Exponential ease out for snappy settle with overshoot
        const ease = effectiveP < 0.001 ? 0 : 1 - Math.pow(1 - effectiveP, 3);

        // Set spring targets
        node.sx.target = chaosX + (clarityX - chaosX) * ease;
        node.sy.target = chaosY + (clarityY - chaosY) * ease;

        // Spring step — heavier nodes = less tension = lag behind
        const tension = 4 / node.mass;
        const friction = 0.88;
        stepSpring(node.sx, tension, friction, dt);
        stepSpring(node.sy, tension, friction, dt);

        // Track if settled for pulse effects
        const dist = Math.abs(node.sx.value - node.sx.target) + Math.abs(node.sy.value - node.sy.target);
        node.settled = dist < 1 && effectiveP > 0.9;
      }

      /* --- draw edges --- */
      for (const edge of edges) {
        const a = nodes[edge.from];
        const b = nodes[edge.to];
        const ax = a.sx.value;
        const ay = a.sy.value;
        const bx = b.sx.value;
        const by = b.sy.value;
        const dist = Math.hypot(bx - ax, by - ay);

        // Visibility logic
        const maxDist = 180 + p * 280;
        if (dist > maxDist) {
          edge.drawProgress.target = 0;
          stepSpring(edge.drawProgress, 3, 0.85, dt);
          continue;
        }

        // In clarity, draw clarity edges fully; fade chaos-only edges
        if (edge.isClarityEdge) {
          edge.drawProgress.target = Math.min(1, p * 2.5);
        } else {
          edge.drawProgress.target = p < 0.6 ? 0.7 : Math.max(0, 1 - (p - 0.4) * 2);
        }
        stepSpring(edge.drawProgress, 2.5, 0.88, dt);

        const dp = edge.drawProgress.value;
        if (dp < 0.01) continue;

        const distAlpha = 1 - dist / maxDist;
        const alpha = distAlpha * (0.06 + p * 0.22) * dp;

        // Draw partial line based on drawProgress
        const mx = ax + (bx - ax) * dp;
        const my = ay + (by - ay) * dp;

        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(mx, my);

        // Dash pattern transitions: chaotic long dashes → clean short dashes → solid
        const dashLen = Math.max(1, 10 - p * 8);
        const gapLen = Math.max(0.5, 8 - p * 7);
        ctx.setLineDash([dashLen, gapLen]);
        edge.pulseOffset -= 0.4 + p * 0.3;
        ctx.lineDashOffset = edge.pulseOffset;

        ctx.strokeStyle = `rgba(194, 224, 58, ${alpha})`;
        ctx.lineWidth = 0.8 + p * 0.5;
        ctx.stroke();
        ctx.setLineDash([]);

        // Traveling pulse — a bright dot that moves along the edge
        if (dp > 0.3 && p > 0.15) {
          const pulseT = (t * (0.3 + (edge.from % 3) * 0.15) + edge.pulseOffset * 0.01) % 1;
          const px = ax + (mx - ax) * pulseT;
          const py = ay + (my - ay) * pulseT;
          const pulseAlpha = Math.sin(pulseT * Math.PI) * alpha * 2.5;
          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(194, 224, 58, ${Math.min(0.7, pulseAlpha)})`;
          ctx.fill();
        }
      }

      /* --- draw nodes --- */
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const x = node.sx.value;
        const y = node.sy.value;
        const effectiveP = Math.max(0, Math.min(1, (p - node.delay) / (1 - node.delay)));

        // Settle pulse: when a node snaps into place, emit a ring
        const ringProgress = Math.max(0, effectiveP - 0.85) / 0.15;
        if (ringProgress > 0 && ringProgress < 1) {
          const ringR = node.radius + 15 * ringProgress;
          const ringAlpha = 0.4 * (1 - ringProgress);
          ctx.beginPath();
          ctx.arc(x, y, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(194, 224, 58, ${ringAlpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Outer ring — breathes in clarity
        const breathScale = node.settled
          ? 1 + Math.sin(t * 1.5 + node.pulsePhase) * 0.15
          : 1;
        const outerR = (node.radius + 3 - effectiveP * 1) * breathScale;
        ctx.beginPath();
        ctx.arc(x, y, outerR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(194, 224, 58, ${0.25 + effectiveP * 0.45})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Inner fill — grows and brightens as node settles
        const fillR = node.radius * (0.2 + effectiveP * 0.8);
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, fillR);
        gradient.addColorStop(0, `rgba(194, 224, 58, ${0.3 + effectiveP * 0.5})`);
        gradient.addColorStop(1, `rgba(194, 224, 58, ${0.05 + effectiveP * 0.15})`);
        ctx.beginPath();
        ctx.arc(x, y, fillR, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      /* --- clarity shapes (emerge progressively) --- */
      if (p > 0.35) {
        const shapeP = Math.min(1, (p - 0.35) / 0.45);
        // Smooth ease-out for shape drawing
        const shapeEase = 1 - Math.pow(1 - shapeP, 2.5);

        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Flowchart boxes — draw on stroke-by-stroke
        const boxPairs: [number, number][] = [[7, 8], [10, 11]];
        for (let bi = 0; bi < boxPairs.length; bi++) {
          const boxProgress = Math.max(0, Math.min(1, (shapeEase - bi * 0.2) / 0.6));
          if (boxProgress <= 0) continue;

          const [ni, nj] = boxPairs[bi];
          const n1 = nodes[ni];
          const n2 = nodes[nj];
          const bx = Math.min(n1.sx.value, n2.sx.value) - 18;
          const by = Math.min(n1.sy.value, n2.sy.value) - 14;
          const bw = Math.abs(n2.sx.value - n1.sx.value) + 36;
          const bh = 28;

          // Draw box as a path that progressively reveals
          ctx.beginPath();
          const perimeter = 2 * (bw + bh);
          const drawLen = perimeter * boxProgress;
          // Trace the rect path manually for progressive draw
          const segments = [
            { dx: bw, dy: 0 },
            { dx: 0, dy: bh },
            { dx: -bw, dy: 0 },
            { dx: 0, dy: -bh },
          ];
          let cx = bx;
          let cy = by;
          ctx.moveTo(cx, cy);
          let remaining = drawLen;
          for (const seg of segments) {
            const segLen = Math.abs(seg.dx || seg.dy);
            if (remaining <= 0) break;
            const draw = Math.min(remaining, segLen);
            const frac = draw / segLen;
            cx += seg.dx * frac;
            cy += seg.dy * frac;
            ctx.lineTo(cx, cy);
            remaining -= draw;
          }
          ctx.strokeStyle = `rgba(194, 224, 58, ${boxProgress * 0.4})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Single middle box (node 9)
        const singleBoxP = Math.max(0, Math.min(1, (shapeEase - 0.1) / 0.5));
        if (singleBoxP > 0) {
          const n9 = nodes[9];
          const sbx = n9.sx.value - 22;
          const sby = n9.sy.value - 14;
          ctx.beginPath();
          ctx.roundRect(sbx, sby, 44, 28, 4);
          ctx.strokeStyle = `rgba(194, 224, 58, ${singleBoxP * 0.35})`;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([]);
          ctx.stroke();
        }

        // Card outline — draws on with a wipe
        const cardP = Math.max(0, Math.min(1, (shapeEase - 0.3) / 0.5));
        if (cardP > 0) {
          const left = Math.min(nodes[12].sx.value, nodes[16].sx.value) - 24;
          const top = nodes[12].sy.value - 24;
          const right = Math.max(nodes[16].sx.value, nodes[17].sx.value) + 24;
          const bottom = nodes[15].sy.value + 24;
          const cw = right - left;
          const ch = (bottom - top) * cardP; // wipe down

          ctx.beginPath();
          ctx.roundRect(left, top, cw, ch, 8);
          ctx.strokeStyle = `rgba(194, 224, 58, ${cardP * 0.25})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Horizontal bars inside card — stagger in
          const bars = [12, 13, 14, 15];
          for (let bi = 0; bi < bars.length; bi++) {
            const barP = Math.max(0, Math.min(1, (cardP - bi * 0.15) / 0.4));
            if (barP <= 0) continue;
            const n = nodes[bars[bi]];
            if (n.sy.value > top + ch) continue; // don't draw beyond wipe

            const barWidth = (40 - (bi === 3 ? 15 : 0)) * barP;
            ctx.beginPath();
            ctx.moveTo(n.sx.value - 12, n.sy.value);
            ctx.lineTo(n.sx.value - 12 + barWidth, n.sy.value);
            const isAccent = bi === 3;
            ctx.strokeStyle = isAccent
              ? `rgba(194, 224, 58, ${barP * 0.85})`
              : `rgba(154, 171, 178, ${barP * 0.3})`;
            ctx.lineWidth = isAccent ? 6 : 4;
            ctx.stroke();
          }
        }

        // Connection arrows between flowchart boxes — draw last
        if (shapeEase > 0.5) {
          const arrowP = Math.min(1, (shapeEase - 0.5) / 0.4);
          const arrowAlpha = arrowP * 0.35;
          // Vertical connector from top boxes to middle
          const midTop = nodes[8];
          const midMid = nodes[9];
          ctx.beginPath();
          ctx.moveTo(midTop.sx.value, midTop.sy.value + 14);
          const connEndY = midTop.sy.value + 14 + (midMid.sy.value - midTop.sy.value - 28) * arrowP;
          ctx.lineTo(midTop.sx.value, connEndY);
          ctx.strokeStyle = `rgba(194, 224, 58, ${arrowAlpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Arrowhead
          if (arrowP > 0.8) {
            const ah = 5;
            ctx.beginPath();
            ctx.moveTo(midTop.sx.value - ah, connEndY - ah);
            ctx.lineTo(midTop.sx.value, connEndY);
            ctx.lineTo(midTop.sx.value + ah, connEndY - ah);
            ctx.stroke();
          }
        }
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [initScene]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
