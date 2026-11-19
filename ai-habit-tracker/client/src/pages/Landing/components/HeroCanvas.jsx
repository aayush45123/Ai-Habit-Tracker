/**
 * HeroCanvas.jsx — High-Performance Pure Three.js 3D Productivity Ecosystem
 *
 * Designed exclusively for the AI Habit Tracker in Nihilism Monochrome:
 * - Pure Three.js (React 19 compatible, zero peer-dep lag)
 * - Realistic glass transmission, chrome metals, and obsidian materials
 * - Continuous scroll-based camera pathing across all 6 narrative stages
 * - Smooth cursor parallax and delta-time animation
 */

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function HeroCanvas({ scrollRef, mouseRef }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ─── Scene Setup ─────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = null; // Transparent, letting HTML grid show through

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.8, 12);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // ─── Materials ───────────────────────────────────────────────────────────
    // Glass Material for Hero Sphere
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.05,
      roughness: 0.08,
      transmission: 0.88,
      thickness: 1.2,
      ior: 1.48,
      reflectivity: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 0.92,
    });

    // Polished Chrome
    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.95,
      roughness: 0.12,
    });

    // Obsidian Black Material
    const obsidianMaterial = new THREE.MeshStandardMaterial({
      color: 0x050505,
      metalness: 0.85,
      roughness: 0.18,
    });

    // Matte Porcelain White
    const whiteEnamelMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      metalness: 0.1,
      roughness: 0.35,
    });

    // Fine Wireframe
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x777777,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });

    // ─── 1. Central Hero Glass Sphere & Gyro Rings ───────────────────────────
    const centerGroup = new THREE.Group();
    scene.add(centerGroup);

    // Outer Glass Icosahedron/Sphere
    const glassGeo = new THREE.IcosahedronGeometry(1.65, 4);
    const glassSphere = new THREE.Mesh(glassGeo, glassMaterial);
    glassSphere.castShadow = true;
    centerGroup.add(glassSphere);

    // Inner Dark Core (Rotating Octahedron)
    const coreGeo = new THREE.OctahedronGeometry(0.72, 1);
    const innerCore = new THREE.Mesh(coreGeo, obsidianMaterial);
    centerGroup.add(innerCore);

    // Concentric Gyroscope Rings
    const ring1Geo = new THREE.TorusGeometry(2.25, 0.022, 16, 120);
    const ring1 = new THREE.Mesh(ring1Geo, chromeMaterial);
    ring1.rotation.x = Math.PI / 3;
    centerGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(2.55, 0.016, 16, 120);
    const ring2 = new THREE.Mesh(ring2Geo, obsidianMaterial);
    ring2.rotation.y = Math.PI / 4;
    ring2.rotation.z = Math.PI / 6;
    centerGroup.add(ring2);

    const ring3Geo = new THREE.TorusGeometry(2.9, 0.012, 16, 120);
    const ring3 = new THREE.Mesh(ring3Geo, chromeMaterial);
    ring3.rotation.x = -Math.PI / 5;
    centerGroup.add(ring3);

    // ─── 2. Habit Orbiting Satellite Spheres ─────────────────────────────────
    const habitSatellitesGroup = new THREE.Group();
    scene.add(habitSatellitesGroup);

    const SATELLITE_COUNT = 6;
    const satellites = [];
    const satelliteConfig = [
      { r: 3.8, speed: 0.28, phase: 0.0, size: 0.28, mat: obsidianMaterial },
      { r: 4.1, speed: 0.22, phase: 1.05, size: 0.24, mat: chromeMaterial },
      { r: 3.6, speed: 0.34, phase: 2.1, size: 0.26, mat: whiteEnamelMaterial },
      { r: 4.4, speed: 0.18, phase: 3.15, size: 0.32, mat: obsidianMaterial },
      { r: 3.9, speed: 0.26, phase: 4.2, size: 0.22, mat: chromeMaterial },
      { r: 4.2, speed: 0.20, phase: 5.25, size: 0.25, mat: whiteEnamelMaterial },
    ];

    satelliteConfig.forEach((cfg, i) => {
      const satGroup = new THREE.Group();
      const satMesh = new THREE.Mesh(new THREE.SphereGeometry(cfg.size, 24, 24), cfg.mat);
      satMesh.castShadow = true;
      satGroup.add(satMesh);

      // Mini halo around each habit node
      const haloGeo = new THREE.TorusGeometry(cfg.size * 1.5, 0.008, 12, 48);
      const halo = new THREE.Mesh(haloGeo, wireframeMaterial);
      satGroup.add(halo);

      habitSatellitesGroup.add(satGroup);
      satellites.push({ group: satGroup, halo, ...cfg });
    });

    // ─── 3. AI Neural Core (Section 3 Visual) ────────────────────────────────
    const aiCoreGroup = new THREE.Group();
    aiCoreGroup.position.set(4.2, 1.2, -1.5);
    scene.add(aiCoreGroup);

    const dodecaGeo = new THREE.DodecahedronGeometry(0.9, 0);
    const aiCoreMesh = new THREE.Mesh(dodecaGeo, obsidianMaterial);
    aiCoreGroup.add(aiCoreMesh);

    const aiWireGeo = new THREE.DodecahedronGeometry(1.25, 0);
    const aiWireMesh = new THREE.Mesh(aiWireGeo, wireframeMaterial);
    aiCoreGroup.add(aiWireMesh);

    // Neural Connection nodes (small pulsing spheres)
    const neuralNodes = [];
    const NODE_COUNT = 8;
    for (let i = 0; i < NODE_COUNT; i++) {
      const angle = (i / NODE_COUNT) * Math.PI * 2;
      const radius = 1.6 + Math.sin(i * 1.5) * 0.4;
      const nx = Math.cos(angle) * radius;
      const ny = Math.sin(angle) * radius * 0.7;
      const nz = (Math.random() - 0.5) * 0.8;

      const nodeMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 16, 16),
        chromeMaterial
      );
      nodeMesh.position.set(nx, ny, nz);
      aiCoreGroup.add(nodeMesh);

      // Connecting line back to core
      const linePoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(nx, ny, nz)];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
      const lineMesh = new THREE.Line(
        lineGeo,
        new THREE.LineBasicMaterial({ color: 0x999999, transparent: true, opacity: 0.4 })
      );
      aiCoreGroup.add(lineMesh);

      neuralNodes.push({ mesh: nodeMesh, angle, radius, speed: 0.15 + (i % 3) * 0.05 });
    }

    // ─── 4. 3D Analytics & Progress Rings (Section 4 Visual) ─────────────────
    const analyticsGroup = new THREE.Group();
    analyticsGroup.position.set(-4.0, 0.4, 0.5);
    scene.add(analyticsGroup);

    // Concentric Progress Arcs (Consistency 88%, Streaks 75%, Focus 92%)
    const ringConfigs = [
      { r: 1.65, tube: 0.055, arc: Math.PI * 1.76, color: 0x0a0a0a, tilt: 0 },
      { r: 1.35, tube: 0.048, arc: Math.PI * 1.5, color: 0x333333, tilt: 0.15 },
      { r: 1.05, tube: 0.042, arc: Math.PI * 1.84, color: 0x666666, tilt: -0.1 },
    ];
    ringConfigs.forEach((rc) => {
      const rGeo = new THREE.TorusGeometry(rc.r, rc.tube, 16, 96, rc.arc);
      const rMesh = new THREE.Mesh(
        rGeo,
        new THREE.MeshStandardMaterial({ color: rc.color, metalness: 0.9, roughness: 0.12 })
      );
      rMesh.rotation.x = Math.PI / 2 + rc.tilt;
      analyticsGroup.add(rMesh);
    });

    // 3D Bar Chart Pillars
    const barPillars = [];
    const BAR_COUNT = 6;
    for (let i = 0; i < BAR_COUNT; i++) {
      const heightVal = 0.5 + i * 0.35 + (i % 2 === 0 ? 0.3 : 0);
      const bGeo = new THREE.BoxGeometry(0.2, heightVal, 0.2);
      const bMesh = new THREE.Mesh(bGeo, i === BAR_COUNT - 1 ? obsidianMaterial : chromeMaterial);
      bMesh.position.set(-0.75 + i * 0.32, -1.2 + heightVal / 2, 0);
      bMesh.castShadow = true;
      analyticsGroup.add(bMesh);
      barPillars.push(bMesh);
    }

    // ─── 5. 3D Calendar Grid (Section 5 Visual) ──────────────────────────────
    const calendarGroup = new THREE.Group();
    calendarGroup.position.set(0, -3.2, 1.2);
    calendarGroup.rotation.x = -Math.PI / 3.8;
    scene.add(calendarGroup);

    const COLS = 7;
    const ROWS = 5;
    const CELL_W = 0.32;
    const CELL_GAP = 0.42;
    const calendarCells = [];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const isDone = (r * COLS + c) % 3 !== 0;
        const cellH = isDone ? 0.18 + ((r + c) % 4) * 0.06 : 0.04;
        const cGeo = new THREE.BoxGeometry(CELL_W, CELL_W, cellH);
        const cMesh = new THREE.Mesh(
          cGeo,
          isDone ? obsidianMaterial : whiteEnamelMaterial
        );
        cMesh.position.set(
          (c - COLS / 2) * CELL_GAP,
          (ROWS / 2 - r) * CELL_GAP,
          cellH / 2
        );
        cMesh.castShadow = true;
        cMesh.receiveShadow = true;
        calendarGroup.add(cMesh);
        calendarCells.push({ mesh: cMesh, baseH: cellH, isDone, index: r * COLS + c });
      }
    }

    // ─── 6. 3D Floating Dashboard Slabs (Glass HUD Panels) ────────────────────
    const hudGroup = new THREE.Group();
    scene.add(hudGroup);

    const hudConfigs = [
      { pos: [-4.8, 2.2, -2.5], w: 2.2, h: 1.3, rotY: 0.25 },
      { pos: [4.8, -1.2, -2.0], w: 2.4, h: 1.4, rotY: -0.2 },
    ];
    hudConfigs.forEach((hc) => {
      const panel = new THREE.Group();
      panel.position.set(...hc.pos);
      panel.rotation.y = hc.rotY;

      // Glass slab
      const slabGeo = new THREE.BoxGeometry(hc.w, hc.h, 0.04);
      const slabMesh = new THREE.Mesh(
        slabGeo,
        new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          roughness: 0.1,
          transmission: 0.85,
          thickness: 0.4,
          transparent: true,
          opacity: 0.75,
        })
      );
      panel.add(slabMesh);

      // Border outline
      const edges = new THREE.EdgesGeometry(slabGeo);
      const borderLine = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 })
      );
      panel.add(borderLine);

      hudGroup.add(panel);
    });

    // ─── 7. Particle Ambient Field ───────────────────────────────────────────
    const PARTICLE_COUNT = 380;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pPos[i * 3 + 0] = (Math.random() - 0.5) * 26;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x000000,
      size: 0.038,
      transparent: true,
      opacity: 0.3,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // ─── 8. Lighting System ──────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.8);
    mainLight.position.set(7, 12, 8);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 30;
    mainLight.shadow.bias = -0.0005;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xf0f0f0, 0.7);
    fillLight.position.set(-8, 4, -4);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xffffff, 1.2, 20);
    rimLight.position.set(0, -4, 4);
    scene.add(rimLight);

    // ─── 9. Camera Cinematic Waypoints (6 Narrative Stages) ──────────────────
    const WAYPOINTS = [
      // 1. Hero Overview (Intro)
      { t: 0.00, pos: [0, 0.6, 11.2], target: [0, 0, 0] },
      // 2. Build Habits (Closer, slightly left, orbits active)
      { t: 0.18, pos: [-1.2, 0.2, 8.4], target: [0.3, 0, 0] },
      // 3. AI Coach (Pans to floating AI neural node at right)
      { t: 0.38, pos: [3.2, 1.4, 7.8], target: [4.0, 1.1, -1.0] },
      // 4. Analytics & Momentum (Pans to progress rings & pillars at left)
      { t: 0.58, pos: [-3.4, 0.6, 7.2], target: [-3.8, 0.2, 0.5] },
      // 5. Daily Routine & Calendar (Looks down onto 3D calendar grid)
      { t: 0.78, pos: [0.2, -1.4, 8.6], target: [0, -3.0, 1.2] },
      // 6. Complete Ecosystem Reveal (Grand pullback view)
      { t: 1.00, pos: [0, 1.2, 13.5], target: [0, 0, 0] },
    ];

    function getInterpolatedCamera(progress) {
      const p = Math.max(0, Math.min(1, progress));
      let lo = WAYPOINTS[0];
      let hi = WAYPOINTS[WAYPOINTS.length - 1];

      for (let i = 0; i < WAYPOINTS.length - 1; i++) {
        if (p >= WAYPOINTS[i].t && p <= WAYPOINTS[i + 1].t) {
          lo = WAYPOINTS[i];
          hi = WAYPOINTS[i + 1];
          break;
        }
      }

      const span = hi.t - lo.t;
      const frac = span < 0.0001 ? 0 : (p - lo.t) / span;
      // Smooth cubic hermite curve
      const smooth = frac * frac * (3 - 2 * frac);

      const px = lo.pos[0] + (hi.pos[0] - lo.pos[0]) * smooth;
      const py = lo.pos[1] + (hi.pos[1] - lo.pos[1]) * smooth;
      const pz = lo.pos[2] + (hi.pos[2] - lo.pos[2]) * smooth;

      const tx = lo.target[0] + (hi.target[0] - lo.target[0]) * smooth;
      const ty = lo.target[1] + (hi.target[1] - lo.target[1]) * smooth;
      const tz = lo.target[2] + (hi.target[2] - lo.target[2]) * smooth;

      return {
        camPos: new THREE.Vector3(px, py, pz),
        lookAt: new THREE.Vector3(tx, ty, tz),
      };
    }

    // ─── 10. Animation Loop ──────────────────────────────────────────────────
    let animationFrameId;
    const clock = new THREE.Clock();
    const currentCamPos = camera.position.clone();
    const currentLookAt = new THREE.Vector3(0, 0, 0);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Read current scroll progress and mouse coordinates
      const scroll = scrollRef ? scrollRef.current || 0 : 0;
      const mouse = mouseRef ? mouseRef.current || { x: 0, y: 0 } : { x: 0, y: 0 };

      // Interpolate camera waypoint
      const { camPos: targetCamPos, lookAt: targetLookAt } = getInterpolatedCamera(scroll);

      // Apply subtle mouse parallax
      const parallaxX = mouse.x * 0.45;
      const parallaxY = mouse.y * 0.35;
      targetCamPos.x += parallaxX;
      targetCamPos.y += parallaxY;

      // Smooth camera dampening
      currentCamPos.lerp(targetCamPos, 0.05);
      currentLookAt.lerp(targetLookAt, 0.05);

      camera.position.copy(currentCamPos);
      camera.lookAt(currentLookAt);

      // ─── Rotate Central Glass Sphere & Gyro Rings ───
      glassSphere.rotation.y = time * 0.12;
      glassSphere.rotation.x = Math.sin(time * 0.1) * 0.08;

      innerCore.rotation.y = -time * 0.22;
      innerCore.rotation.z = time * 0.14;

      ring1.rotation.y = time * 0.18;
      ring2.rotation.x = time * 0.14;
      ring3.rotation.z = -time * 0.12;

      // ─── Orbit Habit Satellites ───
      satellites.forEach((sat, i) => {
        const theta = time * sat.speed + sat.phase;
        const x = Math.cos(theta) * sat.r;
        const z = Math.sin(theta) * sat.r;
        const y = Math.sin(time * 0.4 + i) * 0.6;
        sat.group.position.set(x, y, z);
        sat.halo.rotation.x = time * 0.5 + i;
        sat.halo.rotation.y = time * 0.3;
      });

      // ─── Animate AI Neural Core ───
      aiCoreMesh.rotation.y = time * 0.2;
      aiCoreMesh.rotation.x = time * 0.12;
      aiWireMesh.rotation.y = -time * 0.15;
      aiWireMesh.rotation.z = time * 0.1;

      // Pulse neural nodes
      neuralNodes.forEach((node, i) => {
        const tVal = time * node.speed + node.angle;
        node.mesh.position.y += Math.sin(time * 1.5 + i) * 0.002;
      });

      // ─── Animate Analytics Rings & Pillars ───
      analyticsGroup.rotation.y = Math.sin(time * 0.2) * 0.08;
      barPillars.forEach((bar, i) => {
        const pulse = 1 + Math.sin(time * 2 + i * 0.8) * 0.06;
        bar.scale.y = pulse;
      });

      // ─── Animate Calendar Grid Wave ───
      calendarCells.forEach((c) => {
        const wave = Math.sin(time * 1.8 + c.index * 0.2) * 0.04;
        c.mesh.position.z = c.baseH / 2 + (c.isDone ? wave : 0);
      });

      // ─── Drift Ambient Particles ───
      particles.rotation.y = time * 0.015;
      particles.rotation.x = Math.sin(time * 0.01) * 0.02;

      // ─── Render Frame ───
      renderer.render(scene, camera);
    };

    animate();

    // ─── Resize Handler ──────────────────────────────────────────────────────
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || window.innerWidth;
      const newH = container.clientHeight || window.innerHeight;

      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();

      renderer.setSize(newW, newH);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    };

    window.addEventListener("resize", handleResize);

    // ─── Cleanup ─────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      // Dispose Geometries and Materials
      scene.traverse((obj) => {
        if (obj.isMesh || obj.isPoints || obj.isLine) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        }
      });

      renderer.dispose();
    };
  }, [scrollRef, mouseRef]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
      aria-hidden="true"
    />
  );
}
