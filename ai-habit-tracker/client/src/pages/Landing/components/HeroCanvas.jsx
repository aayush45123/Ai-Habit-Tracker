/**
 * HeroCanvas.jsx — Masterpiece 3D Productivity Ecosystem (Pure Three.js)
 *
 * Full-page interactive 3D WebGL experience matching the light Nihilism Monochrome design:
 * - Section 1: Grand Central Habit Core + 4 Floating 3D HUD Badges (Streak, XP, 100% Complete, AI Peak)
 * - Section 2: 3D Habit Calendar with cells that physically extrude, flip, and animate to completed states on scroll
 * - Section 3: 3D AI Neural Intelligence Core with orbital rings, connected decision nodes, and pattern plaques
 * - Section 4: 3D Layered Dashboard with floating glass plates at distinct Z-depths (Schedule, Habits, Nutrition)
 * - Section 5: 3D Streak & Consistency Monument with interlocking milestone toruses and prismatic core
 * - Section 6: Grand Ecosystem Pullback view for the final CTA
 *
 * Optimized for 60fps on modern laptops, clamped DPR, and smooth lerp camera navigation.
 */

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// ─── Helper to create crisp 2D canvas textures for 3D UI plaques ─────────────
function createCardTexture({
  title = "",
  subtitle = "",
  badge = "",
  iconType = "check",
  bg = "#ffffff",
  border = "#000000",
  textColor = "#000000",
  accentColor = "#000000",
  w = 512,
  h = 256,
}) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  // High-DPI crisp rendering
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Border
  ctx.lineWidth = 10;
  ctx.strokeStyle = border;
  ctx.strokeRect(5, 5, w - 10, h - 10);

  // Corner accent / Brutalist mark
  ctx.fillStyle = accentColor;
  ctx.fillRect(10, 10, 24, 24);

  // Top Badge
  if (badge) {
    ctx.font = "900 22px 'Sora', sans-serif";
    ctx.fillStyle = "#666666";
    ctx.fillText(badge.toUpperCase(), 44, 46);
  }

  // Title
  ctx.font = "900 42px 'Sora', sans-serif";
  ctx.fillStyle = textColor;
  ctx.fillText(title, 40, 120);

  // Subtitle
  if (subtitle) {
    ctx.font = "600 24px 'Sora', sans-serif";
    ctx.fillStyle = "#555555";
    ctx.fillText(subtitle, 40, 175);
  }

  // Bottom indicator bar
  ctx.fillStyle = accentColor;
  ctx.fillRect(40, 210, w - 80, 12);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

export default function HeroCanvas({ scrollRef, mouseRef }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ─── Scene & Camera ──────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = null;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.6, 12);

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

    // ─── Shared Materials (Light Nihilism Monochrome) ────────────────────────
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.05,
      roughness: 0.08,
      transmission: 0.90,
      thickness: 1.2,
      ior: 1.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 0.92,
    });

    const obsidianMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.92,
      roughness: 0.15,
    });

    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.98,
      roughness: 0.08,
    });

    const titaniumMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8d8dc,
      metalness: 0.85,
      roughness: 0.22,
    });

    const whiteEnamelMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      metalness: 0.08,
      roughness: 0.4,
    });

    const emeraldDoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      emissive: 0x059669,
      emissiveIntensity: 0.25,
      metalness: 0.8,
      roughness: 0.2,
    });

    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 1. SECTION 1: HERO HABIT CORE & 4 FLOATING 3D HUD BADGES
    // ═════════════════════════════════════════════════════════════════════════
    const heroGroup = new THREE.Group();
    scene.add(heroGroup);

    // Central Frosted Glass Sphere
    const heroGlass = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 4), glassMaterial);
    heroGlass.castShadow = true;
    heroGroup.add(heroGlass);

    // Inner Obsidian Core
    const heroCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.7, 1), obsidianMaterial);
    heroGroup.add(heroCore);

    // Dual Titanium Gyroscope Rings
    const gyro1 = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.024, 16, 120), chromeMaterial);
    gyro1.rotation.x = Math.PI / 3;
    heroGroup.add(gyro1);

    const gyro2 = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.018, 16, 120), obsidianMaterial);
    gyro2.rotation.y = Math.PI / 4;
    gyro2.rotation.z = Math.PI / 6;
    heroGroup.add(gyro2);

    const gyro3 = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.014, 16, 120), titaniumMaterial);
    gyro3.rotation.x = -Math.PI / 4;
    heroGroup.add(gyro3);

    // 4 Floating 3D HUD Badges
    const hudBadges = [];
    const badgeConfigs = [
      {
        pos: [-3.6, 1.8, 1.2],
        tex: createCardTexture({
          badge: "STREAK PROTOCOL",
          title: "🔥 24-Day Streak",
          subtitle: "Top 1% Global Consistency",
          accentColor: "#000000",
        }),
        rotY: 0.2,
      },
      {
        pos: [3.6, 2.0, 0.8],
        tex: createCardTexture({
          badge: "NEURAL TELEMETRY",
          title: "🧠 AI Peak: 09:30 AM",
          subtitle: "Morning Deep Focus Queued",
          accentColor: "#000000",
        }),
        rotY: -0.22,
      },
      {
        pos: [-3.4, -1.8, 1.0],
        tex: createCardTexture({
          badge: "DAILY ADHERENCE",
          title: "✓ 100% Completed",
          subtitle: "5 of 5 Non-Negotiables",
          accentColor: "#059669",
        }),
        rotY: 0.18,
      },
      {
        pos: [3.4, -1.6, 1.2],
        tex: createCardTexture({
          badge: "GAMIFICATION XP",
          title: "⚡ +150 XP Earned",
          subtitle: "Level 14 · Habit Master",
          accentColor: "#000000",
        }),
        rotY: -0.16,
      },
    ];

    badgeConfigs.forEach((cfg, i) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(...cfg.pos);
      bGroup.rotation.y = cfg.rotY;

      // Slab Geometry
      const slabGeo = new THREE.BoxGeometry(2.2, 1.1, 0.04);
      const faceMat = new THREE.MeshBasicMaterial({ map: cfg.tex });
      const edgeMat = obsidianMaterial;
      const materials = [
        edgeMat, edgeMat, edgeMat, edgeMat, faceMat, edgeMat
      ];
      const slabMesh = new THREE.Mesh(slabGeo, materials);
      slabMesh.castShadow = true;
      bGroup.add(slabMesh);

      // Black border outline
      const edges = new THREE.EdgesGeometry(slabGeo);
      const outline = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 }));
      bGroup.add(outline);

      heroGroup.add(bGroup);
      hudBadges.push({ group: bGroup, basePos: [...cfg.pos], phase: i * 1.3 });
    });

    // Orbiting Satellite Spheres around Hero
    const heroSatellites = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const sMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 20, 20),
        i % 2 === 0 ? obsidianMaterial : chromeMaterial
      );
      heroGroup.add(sMesh);
      heroSatellites.push({ mesh: sMesh, angle, radius: 3.5 + (i % 2) * 0.4, speed: 0.25 + i * 0.04 });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 2. SECTION 2: 3D HABIT CALENDAR (ANIMATED ON SCROLL)
    // ═════════════════════════════════════════════════════════════════════════
    const calendarSectionGroup = new THREE.Group();
    // Positioned to the right of the text in section 2
    calendarSectionGroup.position.set(3.4, 0.2, 0);
    calendarSectionGroup.rotation.set(-0.35, -0.4, 0.08);
    scene.add(calendarSectionGroup);

    // Baseplate for calendar
    const baseplateGeo = new THREE.BoxGeometry(4.4, 3.4, 0.16);
    const baseplate = new THREE.Mesh(baseplateGeo, whiteEnamelMaterial);
    baseplate.receiveShadow = true;
    calendarSectionGroup.add(baseplate);

    const baseplateBorder = new THREE.LineSegments(
      new THREE.EdgesGeometry(baseplateGeo),
      new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 })
    );
    calendarSectionGroup.add(baseplateBorder);

    // 5 Weeks x 7 Days = 35 3D Day Cubes
    const CAL_COLS = 7;
    const CAL_ROWS = 5;
    const C_SIZE = 0.38;
    const C_GAP = 0.50;
    const calendarCubes = [];

    for (let r = 0; r < CAL_ROWS; r++) {
      for (let c = 0; c < CAL_COLS; c++) {
        const index = r * CAL_COLS + c;
        const isDoneInitial = index < 24; // 24 days done streak

        const cubeGeo = new THREE.BoxGeometry(C_SIZE, C_SIZE, 0.22);
        const cubeMat = isDoneInitial ? obsidianMaterial : whiteEnamelMaterial;
        const cubeMesh = new THREE.Mesh(cubeGeo, cubeMat);

        const cx = (c - (CAL_COLS - 1) / 2) * C_GAP;
        const cy = ((CAL_ROWS - 1) / 2 - r) * C_GAP - 0.1;
        cubeMesh.position.set(cx, cy, 0.18);
        cubeMesh.castShadow = true;
        cubeMesh.receiveShadow = true;

        // Thin outline on each day block
        const cOutline = new THREE.LineSegments(
          new THREE.EdgesGeometry(cubeGeo),
          new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1.5 })
        );
        cubeMesh.add(cOutline);

        calendarSectionGroup.add(cubeMesh);
        calendarCubes.push({
          mesh: cubeMesh,
          index,
          isDone: isDoneInitial,
          origZ: 0.18,
          x: cx,
          y: cy,
        });
      }
    }

    // Floating 3D Progress Pill above Calendar
    const calProgressGroup = new THREE.Group();
    calProgressGroup.position.set(0, 1.85, 0.4);
    const calPillGeo = new THREE.BoxGeometry(3.6, 0.35, 0.08);
    const calPillMesh = new THREE.Mesh(calPillGeo, obsidianMaterial);
    calProgressGroup.add(calPillMesh);

    const calProgressFillGeo = new THREE.BoxGeometry(3.5, 0.25, 0.1);
    const calProgressFill = new THREE.Mesh(calProgressFillGeo, titaniumMaterial);
    calProgressGroup.add(calProgressFill);
    calendarSectionGroup.add(calProgressGroup);

    // ═════════════════════════════════════════════════════════════════════════
    // 3. SECTION 3: 3D AI NEURAL INTELLIGENCE CORE
    // ═════════════════════════════════════════════════════════════════════════
    const aiSectionGroup = new THREE.Group();
    // Positioned to the left of the AI text in section 3
    aiSectionGroup.position.set(-3.6, 0.3, 0);
    scene.add(aiSectionGroup);

    // Geodesic Neural Brain Core
    const aiGeoCore = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.3, 2),
      obsidianMaterial
    );
    aiGeoCore.castShadow = true;
    aiSectionGroup.add(aiGeoCore);

    // Outer Faceted Wireframe Cage
    const aiCage = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.8, 1),
      wireframeMaterial
    );
    aiSectionGroup.add(aiCage);

    // Neural Ring Arcs
    const aiArc1 = new THREE.Mesh(
      new THREE.TorusGeometry(2.2, 0.02, 16, 96, Math.PI * 1.6),
      chromeMaterial
    );
    aiArc1.rotation.x = Math.PI / 3;
    aiSectionGroup.add(aiArc1);

    const aiArc2 = new THREE.Mesh(
      new THREE.TorusGeometry(2.5, 0.016, 16, 96, Math.PI * 1.4),
      obsidianMaterial
    );
    aiArc2.rotation.y = Math.PI / 2.5;
    aiSectionGroup.add(aiArc2);

    // 3 Floating AI Pattern Chips (in 3D)
    const aiChips = [];
    const aiChipData = [
      { text: "Sleep > 7h → 94% Consistency", pos: [2.2, 1.5, 0.5], angle: 0 },
      { text: "Optimal Focus Window: 09:00 AM", pos: [-2.2, 1.2, 0.8], angle: 2.1 },
      { text: "Pearson r = +0.84 (Mood/Adherence)", pos: [0.2, -2.1, 0.6], angle: 4.2 },
    ];
    aiChipData.forEach((cd) => {
      const chipGroup = new THREE.Group();
      chipGroup.position.set(...cd.pos);

      const tex = createCardTexture({
        badge: "AI PATTERN INSIGHT",
        title: cd.text,
        subtitle: "Confidence: 94.8% · Groq Engine",
        accentColor: "#000000",
        w: 512,
        h: 220,
      });

      const slabGeo = new THREE.BoxGeometry(2.1, 0.9, 0.03);
      const cMesh = new THREE.Mesh(slabGeo, [
        obsidianMaterial, obsidianMaterial, obsidianMaterial, obsidianMaterial,
        new THREE.MeshBasicMaterial({ map: tex }), obsidianMaterial
      ]);
      chipGroup.add(cMesh);

      const cEdge = new THREE.LineSegments(
        new THREE.EdgesGeometry(slabGeo),
        new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 })
      );
      chipGroup.add(cEdge);

      // Dynamic connector line to core
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-cd.pos[0], -cd.pos[1], -cd.pos[2])
      ]);
      const lineMesh = new THREE.Line(
        lineGeo,
        new THREE.LineBasicMaterial({ color: 0x777777, transparent: true, opacity: 0.4 })
      );
      chipGroup.add(lineMesh);

      aiSectionGroup.add(chipGroup);
      aiChips.push({ group: chipGroup, ...cd });
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 4. SECTION 4: 3D LAYERED DASHBOARD ECOSYSTEM
    // ═════════════════════════════════════════════════════════════════════════
    const dashboardSectionGroup = new THREE.Group();
    dashboardSectionGroup.position.set(3.4, 0.1, 0);
    dashboardSectionGroup.rotation.set(0.15, -0.35, 0.05);
    scene.add(dashboardSectionGroup);

    // Plate 1 (Back Layer): Daily Timetable Grid
    const plate1Geo = new THREE.BoxGeometry(4.2, 2.6, 0.06);
    const plate1Tex = createCardTexture({
      badge: "SMART TIME-BLOCK SCHEDULE",
      title: "Today's Schedule & Routine",
      subtitle: "07:00 Run • 09:00 Deep Work • 17:00 Gym",
      accentColor: "#000000",
      w: 640,
      h: 360,
    });
    const plate1 = new THREE.Mesh(plate1Geo, [
      obsidianMaterial, obsidianMaterial, obsidianMaterial, obsidianMaterial,
      new THREE.MeshBasicMaterial({ map: plate1Tex }), obsidianMaterial
    ]);
    plate1.position.set(0, 0, -0.6);
    plate1.castShadow = true;
    dashboardSectionGroup.add(plate1);

    // Plate 2 (Middle Layer): Active Habit Checklist
    const plate2Geo = new THREE.BoxGeometry(3.6, 2.2, 0.08);
    const plate2Tex = createCardTexture({
      badge: "NON-NEGOTIABLE CHECKLIST",
      title: "Active Daily Habits",
      subtitle: "✓ Morning Water  ✓ Sprint 60m  ✓ Protein",
      accentColor: "#000000",
      w: 640,
      h: 360,
    });
    const plate2 = new THREE.Mesh(plate2Geo, [
      obsidianMaterial, obsidianMaterial, obsidianMaterial, obsidianMaterial,
      new THREE.MeshBasicMaterial({ map: plate2Tex }), obsidianMaterial
    ]);
    plate2.position.set(0.4, -0.2, 0.1);
    plate2.castShadow = true;
    dashboardSectionGroup.add(plate2);

    // Plate 3 (Front Layer): 3D Extruded Macro Cylinders
    const plate3Group = new THREE.Group();
    plate3Group.position.set(-1.2, -0.5, 0.7);
    const macroValues = [0.8, 1.4, 1.0, 1.6];
    macroValues.forEach((val, i) => {
      const cylGeo = new THREE.CylinderGeometry(0.16, 0.16, val, 24);
      const cyl = new THREE.Mesh(cylGeo, i === 3 ? obsidianMaterial : titaniumMaterial);
      cyl.position.set(i * 0.42, val / 2, 0);
      cyl.castShadow = true;
      plate3Group.add(cyl);
    });
    dashboardSectionGroup.add(plate3Group);

    // ═════════════════════════════════════════════════════════════════════════
    // 5. SECTION 5: 3D STREAK & CONSISTENCY MONUMENT
    // ═════════════════════════════════════════════════════════════════════════
    const monumentSectionGroup = new THREE.Group();
    // Positioned to the right of the Streak section text
    monumentSectionGroup.position.set(3.2, 0.2, 0);
    scene.add(monumentSectionGroup);

    // Stepped Milestone Pedestal
    const step1 = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.25, 32), whiteEnamelMaterial);
    step1.position.y = -1.8;
    step1.receiveShadow = true;
    monumentSectionGroup.add(step1);

    const step2 = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.9, 0.25, 32), obsidianMaterial);
    step2.position.y = -1.55;
    step2.receiveShadow = true;
    monumentSectionGroup.add(step2);

    // 3 Interlocking Monument Milestone Toruses (7d, 14d, 21d milestones)
    const monRing1 = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.08, 16, 80), chromeMaterial);
    monRing1.rotation.x = Math.PI / 2;
    monumentSectionGroup.add(monRing1);

    const monRing2 = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.07, 16, 80), titaniumMaterial);
    monRing2.rotation.y = Math.PI / 2.5;
    monumentSectionGroup.add(monRing2);

    const monRing3 = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.06, 16, 80), obsidianMaterial);
    monRing3.rotation.x = Math.PI / 3;
    monumentSectionGroup.add(monRing3);

    // Central Radiant Flame Prism
    const flamePrismGeo = new THREE.OctahedronGeometry(0.65, 0);
    const flamePrism = new THREE.Mesh(flamePrismGeo, obsidianMaterial);
    flamePrism.castShadow = true;
    monumentSectionGroup.add(flamePrism);

    // Outer Glass Shield
    const flameGlass = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 2), glassMaterial);
    monumentSectionGroup.add(flameGlass);

    // ═════════════════════════════════════════════════════════════════════════
    // 6. AMBIENT PARTICLES & LIGHTING
    // ═════════════════════════════════════════════════════════════════════════
    const PARTICLE_COUNT = 420;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pPos[i * 3 + 0] = (Math.random() - 0.5) * 28;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({
        color: 0x000000,
        size: 0.04,
        transparent: true,
        opacity: 0.28,
      })
    );
    scene.add(particles);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(8, 14, 9);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xf4f4f6, 1.0);
    rimLight.position.set(-8, 6, -5);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0xffffff, 1.4, 25);
    fillLight.position.set(0, -3, 6);
    scene.add(fillLight);

    // ═════════════════════════════════════════════════════════════════════════
    // 7. CINEMATIC CAMERA PATH (STORYTELLING ACROSS 6 SECTIONS)
    // ═════════════════════════════════════════════════════════════════════════
    // 0.00 -> Section 1: Hero Ecosystem
    // 0.20 -> Section 2: 3D Habit Calendar Focus
    // 0.40 -> Section 3: AI Neural Core Focus
    // 0.60 -> Section 4: 3D Layered Dashboard Focus
    // 0.80 -> Section 5: Streak Monument Focus
    // 1.00 -> Section 6: Grand Overview Pullback
    const WAYPOINTS = [
      { t: 0.00, pos: [0, 0.5, 11.0], target: [0, 0, 0] },
      { t: 0.20, pos: [2.8, 0.4, 7.8],  target: [3.4, 0.2, 0] },
      { t: 0.40, pos: [-2.8, 0.5, 7.5], target: [-3.6, 0.3, 0] },
      { t: 0.60, pos: [2.7, 0.3, 7.6],  target: [3.4, 0.1, 0] },
      { t: 0.80, pos: [2.5, 0.4, 7.4],  target: [3.2, 0.2, 0] },
      { t: 1.00, pos: [0, 1.6, 13.8], target: [0, 0, 0] },
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

    // ─── Animation Loop ──────────────────────────────────────────────────────
    let animationFrameId;
    const clock = new THREE.Clock();
    const currentCamPos = camera.position.clone();
    const currentLookAt = new THREE.Vector3(0, 0, 0);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      const scroll = scrollRef ? scrollRef.current || 0 : 0;
      const mouse = mouseRef ? mouseRef.current || { x: 0, y: 0 } : { x: 0, y: 0 };

      // Camera lerp
      const { camPos: targetCamPos, lookAt: targetLookAt } = getInterpolatedCamera(scroll);

      // Subtle mouse parallax
      targetCamPos.x += mouse.x * 0.4;
      targetCamPos.y += mouse.y * 0.3;

      currentCamPos.lerp(targetCamPos, 0.045);
      currentLookAt.lerp(targetLookAt, 0.045);

      camera.position.copy(currentCamPos);
      camera.lookAt(currentLookAt);

      // ─── Section 1: Hero Core Dynamics ───
      heroGlass.rotation.y = time * 0.12;
      heroGlass.rotation.x = Math.sin(time * 0.1) * 0.06;
      heroCore.rotation.y = -time * 0.24;
      heroCore.rotation.z = time * 0.16;
      gyro1.rotation.y = time * 0.16;
      gyro2.rotation.x = time * 0.14;
      gyro3.rotation.z = -time * 0.12;

      // Floating HUD Badges
      hudBadges.forEach((b) => {
        b.group.position.y = b.basePos[1] + Math.sin(time * 1.4 + b.phase) * 0.09;
        b.group.rotation.x = Math.sin(time * 0.8 + b.phase) * 0.04;
      });

      // Hero Satellites
      heroSatellites.forEach((sat) => {
        const theta = time * sat.speed + sat.angle;
        sat.mesh.position.set(
          Math.cos(theta) * sat.radius,
          Math.sin(time * 0.5 + sat.angle) * 0.4,
          Math.sin(theta) * sat.radius
        );
      });

      // ─── Section 2: 3D Calendar Extrusion on Scroll ───
      // When scroll is around 0.15 - 0.35, cubes actively flip and elevate
      const calScrollProgress = Math.max(0, Math.min(1, (scroll - 0.12) / 0.18));
      calendarCubes.forEach((c) => {
        // Staggered trigger based on index
        const threshold = c.index / 35;
        const activated = calScrollProgress >= threshold;
        const targetH = activated ? 0.34 : 0.06;
        const targetRotY = activated ? Math.PI : 0;

        c.mesh.scale.z = THREE.MathUtils.lerp(c.mesh.scale.z, activated ? 1.6 : 0.7, 0.08);
        c.mesh.rotation.y = THREE.MathUtils.lerp(c.mesh.rotation.y, targetRotY, 0.08);
        c.mesh.position.z = THREE.MathUtils.lerp(c.mesh.position.z, c.origZ + (activated ? 0.1 : 0), 0.08);

        if (activated && c.mesh.material !== emeraldDoneMaterial) {
          c.mesh.material = emeraldDoneMaterial;
        } else if (!activated && c.mesh.material !== whiteEnamelMaterial) {
          c.mesh.material = whiteEnamelMaterial;
        }
      });
      calProgressFill.scale.x = Math.max(0.01, THREE.MathUtils.lerp(calProgressFill.scale.x, calScrollProgress, 0.08));

      // ─── Section 3: AI Neural Core Pulse ───
      aiGeoCore.rotation.y = time * 0.18;
      aiGeoCore.rotation.x = time * 0.10;
      aiCage.rotation.y = -time * 0.14;
      aiCage.rotation.z = time * 0.08;
      aiArc1.rotation.z = time * 0.2;
      aiArc2.rotation.x = -time * 0.15;

      aiChips.forEach((chip) => {
        chip.group.position.y = chip.pos[1] + Math.sin(time * 1.5 + chip.angle) * 0.08;
        chip.group.rotation.y = Math.sin(time * 0.6 + chip.angle) * 0.05;
      });

      // ─── Section 4: Layered Dashboard Parallax ───
      plate1.position.y = Math.sin(time * 0.8) * 0.05;
      plate2.position.y = -0.2 + Math.sin(time * 0.8 + 1.2) * 0.07;
      plate3Group.position.y = -0.5 + Math.sin(time * 0.8 + 2.4) * 0.09;

      // ─── Section 5: Streak Monument Dynamics ───
      monRing1.rotation.z = time * 0.25;
      monRing2.rotation.x = time * 0.20;
      monRing3.rotation.y = -time * 0.30;
      flamePrism.rotation.y = time * 0.4;
      flamePrism.rotation.x = Math.sin(time * 0.6) * 0.15;
      flameGlass.rotation.y = -time * 0.15;

      // ─── Ambient Particles ───
      particles.rotation.y = time * 0.012;
      particles.rotation.x = Math.sin(time * 0.008) * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    // ─── Resize ──────────────────────────────────────────────────────────────
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

      scene.traverse((obj) => {
        if (obj.isMesh || obj.isPoints || obj.isLine) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => {
                if (m.map) m.map.dispose();
                m.dispose();
              });
            } else {
              if (obj.material.map) obj.material.map.dispose();
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
