import React, { useEffect, useRef } from "react";

/**
 * High-performance 3D Canvas Background
 * Renders an interactive 3D rotating geometric polyhedron wireframe
 * surrounded by a field of 3D floating constellation particles that
 * dynamically respond to mouse parallax and inertia.
 */
export default function Scene3DBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse tracking with smooth spring interpolation
    let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const handleMouseMove = (e) => {
      // Normalize between -1 and 1
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("resize", handleResize);

    // ─── 3D Math & Projection Utilities ───
    const fov = 450;

    // 3D Particles
    const PARTICLE_COUNT = Math.min(65, Math.floor(window.innerWidth / 22));
    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 1400,
        y: (Math.random() - 0.5) * 1000,
        z: Math.random() * 800 - 200,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        vz: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    // 3D Icosahedron Vertices
    const phi = (1 + Math.sqrt(5)) / 2;
    const rawVertices = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ];
    // Scale up
    const polyScale = 140;
    const polyVertices = rawVertices.map(([x, y, z]) => ({
      x: x * polyScale,
      y: y * polyScale,
      z: z * polyScale,
    }));

    // Icosahedron Edges
    const edges = [
      [0, 11], [0, 5], [0, 1], [0, 7], [0, 10],
      [1, 5], [5, 11], [11, 10], [10, 7], [7, 1],
      [3, 9], [3, 4], [3, 2], [3, 6], [3, 8],
      [4, 9], [2, 4], [6, 2], [8, 6], [9, 8],
      [4, 5], [5, 9], [9, 1], [1, 8], [8, 7],
      [7, 6], [6, 10], [10, 2], [2, 11], [11, 4]
    ];

    let rotX = 0.2;
    let rotY = 0.3;
    let rotZ = 0.1;

    // Rotation matrix helper
    const rotate3D = (point, rx, ry, rz) => {
      // Rotate around X
      let y1 = point.y * Math.cos(rx) - point.z * Math.sin(rx);
      let z1 = point.y * Math.sin(rx) + point.z * Math.cos(rx);

      // Rotate around Y
      let x2 = point.x * Math.cos(ry) + z1 * Math.sin(ry);
      let z2 = -point.x * Math.sin(ry) + z1 * Math.cos(ry);

      // Rotate around Z
      let x3 = x2 * Math.cos(rz) - y1 * Math.sin(rz);
      let y3 = x2 * Math.sin(rz) + y1 * Math.cos(rz);

      return { x: x3, y: y3, z: z2 };
    };

    // Animation Loop
    let lastTime = performance.now();

    const render = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Mouse smooth spring
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      rotX += 0.25 * dt + mouse.y * 0.005;
      rotY += 0.35 * dt + mouse.x * 0.005;
      rotZ += 0.1 * dt;

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2 + mouse.x * 35;
      const centerY = height * 0.38 + mouse.y * 25;

      // ─── 1. Draw 3D Particles & Connections ───
      const projectedParticles = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        // Wrap around boundaries
        if (p.x < -700) p.x = 700;
        if (p.x > 700) p.x = -700;
        if (p.y < -500) p.y = 500;
        if (p.y > 500) p.y = -500;
        if (p.z < -200) p.z = 600;
        if (p.z > 600) p.z = -200;

        const depth = p.z + 500;
        if (depth > 10) {
          const scale = fov / depth;
          const px = centerX + p.x * scale;
          const py = centerY + p.y * scale;

          projectedParticles.push({ px, py, scale, alpha: p.alpha, z: p.z });

          // Render particle
          const radius = Math.max(0.6, p.radius * scale);
          ctx.beginPath();
          ctx.arc(px, py, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.45, p.alpha * (scale * 0.8))})`;
          ctx.fill();
        }
      }

      // Draw faint connections between nearby 3D particles
      const maxDistance = 90;
      ctx.lineWidth = 0.5;
      for (let i = 0; i < projectedParticles.length; i++) {
        for (let j = i + 1; j < projectedParticles.length; j++) {
          const p1 = projectedParticles[i];
          const p2 = projectedParticles[j];
          const dx = p1.px - p2.px;
          const dy = p1.py - p2.py;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.12;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.stroke();
          }
        }
      }

      // ─── 2. Draw 3D Geometric Polyhedron ───
      // Center position offset for aesthetic placement behind hero
      const transformedVerts = polyVertices.map((v) => {
        const rotated = rotate3D(v, rotX, rotY, rotZ);
        const zDepth = rotated.z + 480;
        const scale = fov / zDepth;
        return {
          x: centerX + rotated.x * scale,
          y: centerY + rotated.y * scale,
          z: rotated.z,
          scale,
        };
      });

      // Draw 3D Edges
      edges.forEach(([i1, i2]) => {
        const v1 = transformedVerts[i1];
        const v2 = transformedVerts[i2];
        const avgZ = (v1.z + v2.z) / 2;
        // Depth-based opacity & thickness
        const edgeAlpha = Math.max(0.08, Math.min(0.35, (avgZ + 150) / 300));

        ctx.beginPath();
        ctx.strokeStyle = `rgba(0, 0, 0, ${edgeAlpha})`;
        ctx.lineWidth = Math.max(0.7, (avgZ + 200) / 200);
        ctx.moveTo(v1.x, v1.y);
        ctx.lineTo(v2.x, v2.y);
        ctx.stroke();
      });

      // Draw 3D Nodes (Vertices)
      transformedVerts.forEach((v) => {
        const nodeAlpha = Math.max(0.15, Math.min(0.65, (v.z + 150) / 280));
        ctx.beginPath();
        ctx.arc(v.x, v.y, Math.max(2, 3.5 * v.scale), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 0, 0, ${nodeAlpha})`;
        ctx.fill();

        // White inner core
        ctx.beginPath();
        ctx.arc(v.x, v.y, Math.max(1, 1.8 * v.scale), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, 0.9)`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.85,
      }}
      aria-hidden="true"
    />
  );
}
