/**
 * HeroCanvas.jsx — Spatial 3D Productivity Showcase (Pure Three.js)
 *
 * Key Architectural Fixes:
 * 1. Strict Chapter Isolation: At any given scroll position, ONLY the current
 *    chapter's 3D object is visible. Other chapter objects are scaled to 0 and hidden.
 * 2. Proper Lateral Offset: Objects are placed on the right (x ≈ 2.2) or left (x ≈ -2.2)
 *    to match the two-column HTML layout, preventing ANY overlap with text.
 * 3. Minimalist, Refined Aesthetics: Replaced cluttered overlapping cards with sleek,
 *    sophisticated 3D floating elements that have plenty of breathing room.
 */

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// ─── Crisp 2D Canvas Texture for Sleek 3D Badges ─────────────────────────────
function createPillTexture({ badge, title, subtitle, accent = "#000000", w = 480, h = 200 }) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  // Crisp white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  // Sharp brutalist border
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#000000";
  ctx.strokeRect(4, 4, w - 8, h - 8);

  // Accent mark
  ctx.fillStyle = accent;
  ctx.fillRect(10, 10, 16, 16);

  // Badge label
  if (badge) {
    ctx.font = "800 18px 'Sora', sans-serif";
    ctx.fillStyle = "#666666";
    ctx.fillText(badge.toUpperCase(), 36, 42);
  }

  // Title
  ctx.font = "900 36px 'Sora', sans-serif";
  ctx.fillStyle = "#000000";
  ctx.fillText(title, 32, 105);

  // Subtitle
  if (subtitle) {
    ctx.font = "600 20px 'Sora', sans-serif";
    ctx.fillStyle = "#555555";
    ctx.fillText(subtitle, 32, 150);
  }

  // Bottom progress line
  ctx.fillStyle = accent;
  ctx.fillRect(32, 172, w - 64, 8);

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

    // ─── Scene & Camera Setup ────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = null;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 11);

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
      color: 0x3a3a3e,
      metalness: 0.98,
      roughness: 0.08,
    });

    const titaniumMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      metalness: 0.85,
      roughness: 0.22,
    });

    const whiteEnamelMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4f4f5,
      metalness: 0.08,
      roughness: 0.4,
    });

    const emeraldDoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      emissive: 0x059669,
      emissiveIntensity: 0.3,
      metalness: 0.8,
      roughness: 0.2,
    });

    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
    });

    // ═════════════════════════════════════════════════════════════════════════
    // CHAPTER 1: HERO HABIT CORE (Right Offset: x = 2.4)
    // ═════════════════════════════════════════════════════════════════════════
    const heroGroup = new THREE.Group();
    heroGroup.position.set(2.4, 0, 0);
    scene.add(heroGroup);

    // Glass Outer Orb
    const heroGlass = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 4), glassMaterial);
    heroGlass.castShadow = true;
    heroGroup.add(heroGlass);

    // Obsidian Inner Core
    const heroCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.65, 1), obsidianMaterial);
    heroGroup.add(heroCore);

    // Concentric Gyroscope Rings
    const gyro1 = new THREE.Mesh(new THREE.TorusGeometry(1.95, 0.022, 16, 120), chromeMaterial);
    gyro1.rotation.x = Math.PI / 3;
    heroGroup.add(gyro1);

    const gyro2 = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.016, 16, 120), obsidianMaterial);
    gyro2.rotation.y = Math.PI / 4;
    gyro2.rotation.z = Math.PI / 6;
    heroGroup.add(gyro2);

    // ONLY 2 sleek floating badges with generous space (NO CLUTTER)
    const heroBadge1Group = new THREE.Group();
    heroBadge1Group.position.set(-2.0, 1.6, 0.8);
    heroBadge1Group.rotation.y = 0.15;
    const b1Tex = createPillTexture({
      badge: "STREAK PROTOCOL",
      title: "🔥 24-Day Streak",
      subtitle: "Top 1% Global Consistency",
      accent: "#000000",
    });
    const b1Mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.8, 0.03),
      [obsidianMaterial, obsidianMaterial, obsidianMaterial, obsidianMaterial, new THREE.MeshBasicMaterial({ map: b1Tex }), obsidianMaterial]
    );
    b1Mesh.castShadow = true;
    heroBadge1Group.add(b1Mesh);
    heroGroup.add(heroBadge1Group);

    const heroBadge2Group = new THREE.Group();
    heroBadge2Group.position.set(1.9, -1.5, 0.9);
    heroBadge2Group.rotation.y = -0.15;
    const b2Tex = createPillTexture({
      badge: "DAILY ADHERENCE",
      title: "✓ 100% Completed",
      subtitle: "5 of 5 Non-Negotiables",
      accent: "#059669",
    });
    const b2Mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.8, 0.03),
      [obsidianMaterial, obsidianMaterial, obsidianMaterial, obsidianMaterial, new THREE.MeshBasicMaterial({ map: b2Tex }), obsidianMaterial]
    );
    b2Mesh.castShadow = true;
    heroBadge2Group.add(b2Mesh);
    heroGroup.add(heroBadge2Group);

    // 4 Orbiting Minimal Satellites
    const heroSatellites = [];
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const sMesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), i % 2 === 0 ? obsidianMaterial : chromeMaterial);
      heroGroup.add(sMesh);
      heroSatellites.push({ mesh: sMesh, angle, radius: 2.8 + (i % 2) * 0.3, speed: 0.25 + i * 0.05 });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // CHAPTER 2: 3D HABIT CALENDAR (Right Offset: x = 2.4)
    // ═════════════════════════════════════════════════════════════════════════
    const calendarGroup = new THREE.Group();
    calendarGroup.position.set(2.4, 0, 0);
    calendarGroup.rotation.set(-0.35, -0.3, 0.05);
    calendarGroup.visible = false;
    scene.add(calendarGroup);

    const baseplateGeo = new THREE.BoxGeometry(4.2, 3.2, 0.14);
    const baseplate = new THREE.Mesh(baseplateGeo, whiteEnamelMaterial);
    baseplate.receiveShadow = true;
    calendarGroup.add(baseplate);

    const baseplateOutline = new THREE.LineSegments(
      new THREE.EdgesGeometry(baseplateGeo),
      new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 })
    );
    calendarGroup.add(baseplateOutline);

    const CAL_COLS = 7;
    const CAL_ROWS = 5;
    const C_SIZE = 0.36;
    const C_GAP = 0.48;
    const calendarCubes = [];

    for (let r = 0; r < CAL_ROWS; r++) {
      for (let c = 0; c < CAL_COLS; c++) {
        const index = r * CAL_COLS + c;
        const cubeGeo = new THREE.BoxGeometry(C_SIZE, C_SIZE, 0.2);
        const cubeMesh = new THREE.Mesh(cubeGeo, whiteEnamelMaterial);

        const cx = (c - (CAL_COLS - 1) / 2) * C_GAP;
        const cy = ((CAL_ROWS - 1) / 2 - r) * C_GAP - 0.1;
        cubeMesh.position.set(cx, cy, 0.15);
        cubeMesh.castShadow = true;

        const cOutline = new THREE.LineSegments(
          new THREE.EdgesGeometry(cubeGeo),
          new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1.5 })
        );
        cubeMesh.add(cOutline);

        calendarGroup.add(cubeMesh);
        calendarCubes.push({ mesh: cubeMesh, index, origZ: 0.15 });
      }
    }

    // Floating progress indicator on calendar
    const calPillGeo = new THREE.BoxGeometry(3.2, 0.28, 0.06);
    const calPill = new THREE.Mesh(calPillGeo, obsidianMaterial);
    calPill.position.set(0, 1.7, 0.3);
    calendarGroup.add(calPill);

    // ═════════════════════════════════════════════════════════════════════════
    // CHAPTER 3: 3D AI NEURAL CORE (Left Offset: x = -2.4)
    // ═════════════════════════════════════════════════════════════════════════
    const aiGroup = new THREE.Group();
    aiGroup.position.set(-2.4, 0, 0);
    aiGroup.visible = false;
    scene.add(aiGroup);

    const aiGeoCore = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 2), obsidianMaterial);
    aiGeoCore.castShadow = true;
    aiGroup.add(aiGeoCore);

    const aiCage = new THREE.Mesh(new THREE.DodecahedronGeometry(1.65, 1), wireframeMaterial);
    aiGroup.add(aiCage);

    const aiArc1 = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.018, 16, 96, Math.PI * 1.6), chromeMaterial);
    aiArc1.rotation.x = Math.PI / 3;
    aiGroup.add(aiArc1);

    const aiArc2 = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.014, 16, 96, Math.PI * 1.4), obsidianMaterial);
    aiArc2.rotation.y = Math.PI / 2.5;
    aiGroup.add(aiArc2);

    // 2 Clean Floating Pattern Badges
    const aiChip1Group = new THREE.Group();
    aiChip1Group.position.set(2.0, 1.4, 0.6);
    const chip1Tex = createPillTexture({
      badge: "AI TELEMETRY",
      title: "Sleep > 7h → +44%",
      subtitle: "Adherence Correlation",
      accent: "#000000",
    });
    const chip1Mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.75, 0.03),
      [obsidianMaterial, obsidianMaterial, obsidianMaterial, obsidianMaterial, new THREE.MeshBasicMaterial({ map: chip1Tex }), obsidianMaterial]
    );
    aiChip1Group.add(chip1Mesh);
    aiGroup.add(aiChip1Group);

    const aiChip2Group = new THREE.Group();
    aiChip2Group.position.set(-1.9, -1.3, 0.7);
    const chip2Tex = createPillTexture({
      badge: "CHRONOBIOLOGY",
      title: "Focus Peak: 09:30 AM",
      subtitle: "Morning Sprint Queued",
      accent: "#000000",
    });
    const chip2Mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.75, 0.03),
      [obsidianMaterial, obsidianMaterial, obsidianMaterial, obsidianMaterial, new THREE.MeshBasicMaterial({ map: chip2Tex }), obsidianMaterial]
    );
    aiChip2Group.add(chip2Mesh);
    aiGroup.add(aiChip2Group);

    // ═════════════════════════════════════════════════════════════════════════
    // CHAPTER 4: 3D LAYERED DASHBOARD SLABS (Right Offset: x = 2.4)
    // ═════════════════════════════════════════════════════════════════════════
    const dashboardGroup = new THREE.Group();
    dashboardGroup.position.set(2.4, 0, 0);
    dashboardGroup.rotation.set(0.12, -0.3, 0.04);
    dashboardGroup.visible = false;
    scene.add(dashboardGroup);

    // Plate 1: Timetable
    const dPlate1Tex = createPillTexture({
      badge: "SCHEDULE SYSTEM",
      title: "Time-Block Planner",
      subtitle: "07:00 Run • 09:00 Deep Work • 17:00 Gym",
      accent: "#000000",
      w: 512,
      h: 220,
    });
    const dPlate1 = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 1.8, 0.05),
      [obsidianMaterial, obsidianMaterial, obsidianMaterial, obsidianMaterial, new THREE.MeshBasicMaterial({ map: dPlate1Tex }), obsidianMaterial]
    );
    dPlate1.position.set(0, 0.4, -0.4);
    dPlate1.castShadow = true;
    dashboardGroup.add(dPlate1);

    // Plate 2: Active Checklist
    const dPlate2Tex = createPillTexture({
      badge: "HABIT TRACKER",
      title: "Active Non-Negotiables",
      subtitle: "✓ Water  ✓ Focus  ✓ Protein  ✓ Sleep",
      accent: "#059669",
      w: 512,
      h: 220,
    });
    const dPlate2 = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 1.6, 0.06),
      [obsidianMaterial, obsidianMaterial, obsidianMaterial, obsidianMaterial, new THREE.MeshBasicMaterial({ map: dPlate2Tex }), obsidianMaterial]
    );
    dPlate2.position.set(0.3, -0.3, 0.3);
    dPlate2.castShadow = true;
    dashboardGroup.add(dPlate2);

    // ═════════════════════════════════════════════════════════════════════════
    // CHAPTER 5: 3D STREAK & CONSISTENCY MONUMENT (Left Offset: x = -2.4)
    // ═════════════════════════════════════════════════════════════════════════
    const monumentGroup = new THREE.Group();
    monumentGroup.position.set(-2.4, 0, 0);
    monumentGroup.visible = false;
    scene.add(monumentGroup);

    const monStep = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.0, 0.22, 32), whiteEnamelMaterial);
    monStep.position.y = -1.6;
    monStep.receiveShadow = true;
    monumentGroup.add(monStep);

    const monRing1 = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.06, 16, 80), chromeMaterial);
    monRing1.rotation.x = Math.PI / 2;
    monumentGroup.add(monRing1);

    const monRing2 = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.05, 16, 80), titaniumMaterial);
    monRing2.rotation.y = Math.PI / 2.5;
    monumentGroup.add(monRing2);

    const monRing3 = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.04, 16, 80), obsidianMaterial);
    monRing3.rotation.x = Math.PI / 3;
    monumentGroup.add(monRing3);

    const flamePrism = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), obsidianMaterial);
    flamePrism.castShadow = true;
    monumentGroup.add(flamePrism);

    const flameGlass = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85, 2), glassMaterial);
    monumentGroup.add(flameGlass);

    // ═════════════════════════════════════════════════════════════════════════
    // LIGHTING & PARTICLES
    // ═════════════════════════════════════════════════════════════════════════
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(7, 12, 8);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf4f4f6, 0.9);
    fillLight.position.set(-7, 6, -4);
    scene.add(fillLight);

    // Subtle drifting background dust
    const PARTICLE_COUNT = 240;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pPos[i * 3 + 0] = (Math.random() - 0.5) * 24;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: 0x000000, size: 0.035, transparent: true, opacity: 0.22 })
    );
    scene.add(particles);

    // ═════════════════════════════════════════════════════════════════════════
    // ANIMATION LOOP & ACTIVE CHAPTER ISOLATION
    // ═════════════════════════════════════════════════════════════════════════
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      const scroll = scrollRef ? scrollRef.current || 0 : 0;
      const mouse = mouseRef ? mouseRef.current || { x: 0, y: 0 } : { x: 0, y: 0 };

      // Subtle camera parallax
      camera.position.x = mouse.x * 0.3;
      camera.position.y = mouse.y * 0.2;
      camera.lookAt(0, 0, 0);

      // ─── STRICT CHAPTER ISOLATION LOGIC ───────────────────────────────────
      // Chapter 1 (Hero): 0.00 -> 0.18
      // Chapter 2 (Calendar): 0.18 -> 0.38
      // Chapter 3 (AI Coach): 0.38 -> 0.58
      // Chapter 4 (Dashboard): 0.58 -> 0.78
      // Chapter 5 (Streak): 0.78 -> 0.94
      // Chapter 6 (Final CTA): 0.94 -> 1.00

      // Weights calculation with smooth hermite blending
      const wHero = Math.max(0, 1 - scroll / 0.18);
      const wCal = Math.max(0, 1 - Math.abs(scroll - 0.28) / 0.12);
      const wAI = Math.max(0, 1 - Math.abs(scroll - 0.48) / 0.12);
      const wDash = Math.max(0, 1 - Math.abs(scroll - 0.68) / 0.12);
      const wMon = Math.max(0, 1 - Math.abs(scroll - 0.86) / 0.10);
      const wFinal = Math.max(0, (scroll - 0.92) / 0.08);

      // Hero Group visibility & scale
      heroGroup.visible = wHero > 0.01 || wFinal > 0.01;
      const heroScale = wHero > 0.01 ? wHero : wFinal * 0.75;
      heroGroup.scale.setScalar(heroScale);
      if (wFinal > 0.01) {
        heroGroup.position.x = THREE.MathUtils.lerp(heroGroup.position.x, 0, 0.08);
      } else {
        heroGroup.position.x = 2.4;
      }

      // Calendar visibility & scale
      calendarGroup.visible = wCal > 0.01;
      calendarGroup.scale.setScalar(wCal);

      // AI Core visibility & scale
      aiGroup.visible = wAI > 0.01;
      aiGroup.scale.setScalar(wAI);

      // Dashboard visibility & scale
      dashboardGroup.visible = wDash > 0.01;
      dashboardGroup.scale.setScalar(wDash);

      // Monument visibility & scale
      monumentGroup.visible = wMon > 0.01;
      monumentGroup.scale.setScalar(wMon);

      // ─── Animations for Active Objects ───────────────────────────────────
      if (heroGroup.visible) {
        heroGlass.rotation.y = time * 0.12;
        heroCore.rotation.y = -time * 0.22;
        gyro1.rotation.y = time * 0.16;
        gyro2.rotation.x = time * 0.14;

        heroBadge1Group.position.y = 1.6 + Math.sin(time * 1.5) * 0.08;
        heroBadge2Group.position.y = -1.5 + Math.sin(time * 1.5 + 1.5) * 0.08;

        heroSatellites.forEach((sat) => {
          const theta = time * sat.speed + sat.angle;
          sat.mesh.position.set(Math.cos(theta) * sat.radius, Math.sin(time * 0.5 + sat.angle) * 0.35, Math.sin(theta) * sat.radius);
        });
      }

      if (calendarGroup.visible) {
        // Active calendar extrusion as you scroll within Chapter 2
        const calProgress = Math.max(0, Math.min(1, (scroll - 0.20) / 0.16));
        calendarCubes.forEach((c) => {
          const threshold = c.index / 35;
          const activated = calProgress >= threshold;
          c.mesh.scale.z = THREE.MathUtils.lerp(c.mesh.scale.z, activated ? 1.5 : 0.6, 0.08);
          c.mesh.rotation.y = THREE.MathUtils.lerp(c.mesh.rotation.y, activated ? Math.PI : 0, 0.08);
          if (activated && c.mesh.material !== emeraldDoneMaterial) {
            c.mesh.material = emeraldDoneMaterial;
          } else if (!activated && c.mesh.material !== whiteEnamelMaterial) {
            c.mesh.material = whiteEnamelMaterial;
          }
        });
      }

      if (aiGroup.visible) {
        aiGeoCore.rotation.y = time * 0.18;
        aiCage.rotation.y = -time * 0.12;
        aiArc1.rotation.z = time * 0.2;
        aiChip1Group.position.y = 1.4 + Math.sin(time * 1.4) * 0.07;
        aiChip2Group.position.y = -1.3 + Math.sin(time * 1.4 + 1.4) * 0.07;
      }

      if (dashboardGroup.visible) {
        dPlate1.position.y = 0.4 + Math.sin(time * 0.8) * 0.05;
        dPlate2.position.y = -0.3 + Math.sin(time * 0.8 + 1.2) * 0.06;
      }

      if (monumentGroup.visible) {
        monRing1.rotation.z = time * 0.22;
        monRing2.rotation.x = time * 0.18;
        monRing3.rotation.y = -time * 0.26;
        flamePrism.rotation.y = time * 0.4;
      }

      // Drift particles
      particles.rotation.y = time * 0.01;

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
