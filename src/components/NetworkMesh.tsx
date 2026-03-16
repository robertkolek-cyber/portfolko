"use client";

import { useEffect, useRef, useCallback } from "react";

interface Node {
  x: number;
  y: number;
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
}

interface Edge {
  from: number;
  to: number;
  dashOffset: number;
}

/**
 * Animated network mesh that morphs between chaos (complexity)
 * and order (clarity). The `progress` prop (0→1) drives the morph.
 */
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
  const frameRef = useRef<number>(0);
  const timeRef = useRef(0);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const initNodes = useCallback((w: number, h: number) => {
    const count = 18;
    const nodes: Node[] = [];

    // Clarity positions: a clean 3-column grid layout
    const gridPositions = [
      // Left cluster — scattered network feel in clarity
      { x: 0.12, y: 0.2 },
      { x: 0.08, y: 0.45 },
      { x: 0.18, y: 0.65 },
      { x: 0.25, y: 0.35 },
      { x: 0.05, y: 0.75 },
      { x: 0.22, y: 0.15 },
      // Middle — flowchart nodes
      { x: 0.42, y: 0.25 },
      { x: 0.55, y: 0.25 },
      { x: 0.48, y: 0.5 },
      { x: 0.42, y: 0.75 },
      { x: 0.55, y: 0.75 },
      { x: 0.48, y: 0.9 },
      // Right — structured card
      { x: 0.78, y: 0.25 },
      { x: 0.78, y: 0.4 },
      { x: 0.78, y: 0.55 },
      { x: 0.78, y: 0.7 },
      { x: 0.88, y: 0.32 },
      { x: 0.88, y: 0.62 },
    ];

    for (let i = 0; i < count; i++) {
      const gp = gridPositions[i];
      nodes.push({
        // Start scattered (complexity)
        x: Math.random() * w,
        y: Math.random() * h,
        originX: Math.random() * w,
        originY: Math.random() * h,
        // End organized (clarity)
        targetX: gp.x * w,
        targetY: gp.y * h,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: 3 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Build edges — in chaos, connect nearby nodes; in order, specific connections
    const edges: Edge[] = [];
    // Chaos edges (many random connections)
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        if (Math.random() < 0.25) {
          edges.push({ from: i, to: j, dashOffset: Math.random() * 100 });
        }
      }
    }
    // Ensure clarity-specific connections exist
    const clarityEdges: [number, number][] = [
      // left network
      [0, 1], [1, 2], [2, 3], [3, 0], [0, 3], [1, 3], [4, 2], [5, 0], [5, 3],
      // middle flowchart
      [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [6, 8],
      // right card
      [12, 13], [13, 14], [14, 15], [16, 17], [12, 16],
    ];
    for (const [from, to] of clarityEdges) {
      if (!edges.find((e) => (e.from === from && e.to === to) || (e.from === to && e.to === from))) {
        edges.push({ from, to, dashOffset: Math.random() * 100 });
      }
    }

    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      if (nodesRef.current.length === 0) {
        initNodes(rect.width, rect.height);
      } else {
        // Update target positions on resize
        const gridPositions = [
          { x: 0.12, y: 0.2 }, { x: 0.08, y: 0.45 }, { x: 0.18, y: 0.65 },
          { x: 0.25, y: 0.35 }, { x: 0.05, y: 0.75 }, { x: 0.22, y: 0.15 },
          { x: 0.42, y: 0.25 }, { x: 0.55, y: 0.25 }, { x: 0.48, y: 0.5 },
          { x: 0.42, y: 0.75 }, { x: 0.55, y: 0.75 }, { x: 0.48, y: 0.9 },
          { x: 0.78, y: 0.25 }, { x: 0.78, y: 0.4 }, { x: 0.78, y: 0.55 },
          { x: 0.78, y: 0.7 }, { x: 0.88, y: 0.32 }, { x: 0.88, y: 0.62 },
        ];
        nodesRef.current.forEach((node, i) => {
          node.targetX = gridPositions[i].x * rect.width;
          node.targetY = gridPositions[i].y * rect.height;
        });
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      timeRef.current += 0.016;
      const t = timeRef.current;
      const p = progressRef.current;

      ctx.clearRect(0, 0, w, h);

      const nodes = nodesRef.current;
      const edges = edgesRef.current;

      // Update node positions: lerp between chaos wandering and grid target
      for (const node of nodes) {
        // Chaos: wander around
        const chaosX =
          node.originX +
          Math.sin(t * 0.5 + node.phase) * 60 +
          Math.cos(t * 0.3 + node.phase * 1.5) * 40;
        const chaosY =
          node.originY +
          Math.cos(t * 0.4 + node.phase) * 50 +
          Math.sin(t * 0.6 + node.phase * 0.7) * 35;

        // Clarity: settled at grid with subtle float
        const clarityX = node.targetX + Math.sin(t * 0.8 + node.phase) * 3;
        const clarityY = node.targetY + Math.cos(t * 0.6 + node.phase) * 3;

        // Smooth ease
        const ease = p * p * (3 - 2 * p); // smoothstep
        node.x = chaosX + (clarityX - chaosX) * ease;
        node.y = chaosY + (clarityY - chaosY) * ease;
      }

      // Draw edges
      for (const edge of edges) {
        const a = nodes[edge.from];
        const b = nodes[edge.to];
        const dist = Math.hypot(b.x - a.x, b.y - a.y);

        // In chaos: only draw close edges with low opacity
        // In clarity: draw all with more structure
        const maxDist = 200 + p * 300;
        if (dist > maxDist) continue;

        const distAlpha = 1 - dist / maxDist;
        const baseAlpha = 0.08 + p * 0.15;
        const alpha = distAlpha * baseAlpha;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(194, 224, 58, ${alpha})`;
        ctx.lineWidth = 1;

        // Dashed lines that become more solid with progress
        const dashLen = 8 - p * 4;
        const gapLen = 6 - p * 3;
        ctx.setLineDash([dashLen, gapLen]);
        edge.dashOffset -= 0.3;
        ctx.lineDashOffset = edge.dashOffset;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw nodes
      for (const node of nodes) {
        // Outer ring (lime, hollow)
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 2 + (1 - p) * 2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(194, 224, 58, ${0.4 + p * 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Inner fill — grows with clarity
        const fillRadius = node.radius * (0.3 + p * 0.7);
        ctx.beginPath();
        ctx.arc(node.x, node.y, fillRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(194, 224, 58, ${0.15 + p * 0.35})`;
        ctx.fill();
      }

      // In clarity state, draw structured shapes over the right group
      if (p > 0.3) {
        const shapeAlpha = Math.max(0, (p - 0.3) / 0.7);

        // Flowchart boxes (middle group: nodes 6-11)
        const boxNodes = [
          [6, 7], // top two boxes
          [9, 10], // bottom two boxes
        ];
        ctx.strokeStyle = `rgba(194, 224, 58, ${shapeAlpha * 0.5})`;
        ctx.lineWidth = 1.5;
        for (const [i, j] of boxNodes) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const bx = Math.min(n1.x, n2.x) - 15;
          const by = Math.min(n1.y, n2.y) - 12;
          const bw = Math.abs(n2.x - n1.x) + 30;
          const bh = 24;
          ctx.beginPath();
          ctx.roundRect(bx, by, bw, bh, 4);
          ctx.stroke();
        }

        // Card outline (right group: nodes 12-17)
        const cardLeft = Math.min(nodes[12].x, nodes[16].x) - 20;
        const cardTop = nodes[12].y - 20;
        const cardRight = Math.max(nodes[16].x, nodes[17].x) + 20;
        const cardBottom = nodes[15].y + 20;
        ctx.beginPath();
        ctx.roundRect(
          cardLeft,
          cardTop,
          cardRight - cardLeft,
          cardBottom - cardTop,
          8
        );
        ctx.strokeStyle = `rgba(194, 224, 58, ${shapeAlpha * 0.3})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Horizontal bars inside card
        for (let i = 12; i <= 15; i++) {
          const n = nodes[i];
          ctx.beginPath();
          ctx.moveTo(n.x - 10, n.y);
          ctx.lineTo(n.x + 35 + (i === 15 ? -10 : 0), n.y);
          ctx.strokeStyle = `rgba(194, 224, 58, ${shapeAlpha * 0.4})`;
          ctx.lineWidth = i === 14 ? 6 : 4;
          ctx.lineCap = "round";
          ctx.stroke();
        }

        // Lime accent bar (like in the user's image)
        if (p > 0.6) {
          const accentAlpha = Math.max(0, (p - 0.6) / 0.4);
          const n15 = nodes[15];
          ctx.beginPath();
          ctx.moveTo(n15.x - 10, n15.y);
          ctx.lineTo(n15.x + 25, n15.y);
          ctx.strokeStyle = `rgba(194, 224, 58, ${accentAlpha * 0.9})`;
          ctx.lineWidth = 6;
          ctx.lineCap = "round";
          ctx.stroke();
        }
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [initNodes]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
