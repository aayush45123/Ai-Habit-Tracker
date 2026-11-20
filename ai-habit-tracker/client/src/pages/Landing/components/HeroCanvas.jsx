/**
 * HeroCanvas.jsx — High-End 3D Interactive Product Showcase (Three.js)
 *
 * Designed with Apple / Linear hardware showcase aesthetics:
 * - Floating 3D beveled display tablet presenting the real Habit Tracker Dashboard
 * - Orbital habit rings with metallic sheen and smooth dual-axis rotation
 * - Refractive 3D streak crystal with glowing internal facet lighting
 * - Floating milestone nodes and ambient interactive particle field
 * - Soft studio lighting and realistic ground plane shadow
 * - Interactive mouse tilt damping and scroll-based camera choreography
 */

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import dashboardImg from "../../../assets/dashboard.png";

export default function HeroCanvas({ scrollRef, mouseRef }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ─── Scene Setup ──────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = null;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 7.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // ─── Studio Lighting ───────────────────────────────────────────────────────
    // Soft Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    // Warm Key Light (top right front)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(4, 5, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 15;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Subtle Indigo Rim Light (back left)
    const rimLight = new THREE.DirectionalLight(0x818cf8, 1.8);
    rimLight.position.set(-5, 3, -3);
    scene.add(rimLight);

    // Subtle Emerald Fill Light (bottom right)
    const fillLight = new THREE.PointLight(0x10b981, 1.2, 10);
    fillLight.position.set(3, -2, 2);
    scene.add(fillLight);

    // ─── Ground Shadow Receiver ────────────────────────────────────────────────
    const shadowPlaneGeo = new THREE.PlaneGeometry(16, 16);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.08 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.2;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // ─── Central Showcase Group ────────────────────────────────────────────────
    const showcaseGroup = new THREE.Group();
    scene.add(showcaseGroup);

    // ─── 1. The 3D Hardware Display Monolith ────────────────────────────────────
    const textureLoader = new THREE.TextureLoader();
    const dashboardTexture = textureLoader.load(dashboardImg);
    dashboardTexture.colorSpace = THREE.SRGBColorSpace;
    dashboardTexture.minFilter = THREE.LinearFilter;
    dashboardTexture.magFilter = THREE.LinearFilter;

    // Body of the tablet (sleek aluminum / dark titanium chassis)
    const tabletWidth = 4.4;
    const tabletHeight = 2.75;
    const tabletDepth = 0.12;

    const bodyGeo = new THREE.BoxGeometry(tabletWidth, tabletHeight, tabletDepth);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e222d,
      metalness: 0.85,
      roughness: 0.25,
    });
    const tabletBody = new THREE.Mesh(bodyGeo, bodyMat);
    tabletBody.castShadow = true;
    tabletBody.receiveShadow = true;
    showcaseGroup.add(tabletBody);

    // Glass Screen Front with Dashboard Texture
    const screenGeo = new THREE.PlaneGeometry(tabletWidth - 0.16, tabletHeight - 0.16);
    const screenMat = new THREE.MeshPhysicalMaterial({
      map: dashboardTexture,
      roughness: 0.18,
      metalness: 0.05,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
      reflectivity: 0.5,
    });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.z = tabletDepth / 2 + 0.005;
    tabletBody.add(screenMesh);

    // Beveled Outer Glass Border (Frosted highlight edge)
    const borderGeo = new THREE.BoxGeometry(tabletWidth + 0.06, tabletHeight + 0.06, tabletDepth * 0.9);
    const borderMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.85,
      roughness: 0.15,
      thickness: 0.4,
      transparent: true,
      opacity: 0.35,
    });
    const borderMesh = new THREE.Mesh(borderGeo, borderMat);
    borderMesh.position.z = 0;
    tabletBody.add(borderMesh);

    // ─── 2. Orbital Habit Rings (Consistency Orbits) ───────────────────────────
    const orbitGroup = new THREE.Group();
    showcaseGroup.add(orbitGroup);

    // Primary Indigo Orbit Ring
    const ring1Geo = new THREE.TorusGeometry(3.1, 0.022, 16, 100);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      emissive: 0x4f46e5,
      emissiveIntensity: 0.4,
      metalness: 0.9,
      roughness: 0.2,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    ring1.rotation.y = Math.PI / 6;
    orbitGroup.add(ring1);

    // Secondary Emerald Orbit Ring
    const ring2Geo = new THREE.TorusGeometry(3.5, 0.018, 16, 100);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.35,
      metalness: 0.95,
      roughness: 0.2,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.y = -Math.PI / 5;
    orbitGroup.add(ring2);

    // ─── 3. Floating 3D Streak Core (Refractive Gem Crystal) ────────────────────
    const gemGeo = new THREE.OctahedronGeometry(0.38, 0);
    const gemMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.6,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.75,
      thickness: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });
    const gemMesh = new THREE.Mesh(gemGeo, gemMat);
    gemMesh.position.set(2.4, 1.4, 0.8);
    gemMesh.castShadow = true;
    showcaseGroup.add(gemMesh);

    // Secondary AI Neural Node (Icosahedron)
    const aiNodeGeo = new THREE.IcosahedronGeometry(0.28, 0);
    const aiNodeMat = new THREE.MeshPhysicalMaterial({
      color: 0x8b5cf6,
      emissive: 0x7c3aed,
      emissiveIntensity: 0.5,
      roughness: 0.08,
      metalness: 0.2,
      transmission: 0.8,
      thickness: 0.8,
    });
    const aiNodeMesh = new THREE.Mesh(aiNodeGeo, aiNodeMat);
    aiNodeMesh.position.set(-2.5, -1.2, 0.6);
    aiNodeMesh.castShadow = true;
    showcaseGroup.add(aiNodeMesh);

    // ─── 4. Ambient Interactive Particle Field ─────────────────────────────────
    const particleCount = 120;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleScales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3 + 0] = (Math.random() - 0.5) * 12;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      particleScales[i] = Math.random() * 0.05 + 0.02;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x64748b,
      size: 0.05,
      transparent: true,
      opacity: 0.45,
      blending: THREE.NormalBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ─── Animation & Interaction Loop ──────────────────────────────────────────
    let animId;
    let clock = new THREE.Clock();

    // Target rotations for smooth lerping
    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Read mouse coordinates with smooth damping
      const mouse = mouseRef?.current || { x: 0, y: 0 };
      targetRotX = mouse.y * 0.18;
      targetRotY = mouse.x * 0.25;

      currentRotX += (targetRotX - currentRotX) * 0.05;
      currentRotY += (targetRotY - currentRotY) * 0.05;

      // Scroll progression influence
      const scrollProgress = scrollRef?.current || 0;

      // Subtle breathing float motion
      const floatY = Math.sin(elapsedTime * 1.2) * 0.06;
      tabletBody.position.y = floatY;
      tabletBody.rotation.x = currentRotX + Math.sin(elapsedTime * 0.8) * 0.02;
      tabletBody.rotation.y = currentRotY;

      // Rotate orbital rings
      ring1.rotation.z = elapsedTime * 0.15;
      ring2.rotation.z = -elapsedTime * 0.12;
      orbitGroup.rotation.y = elapsedTime * 0.05;

      // Floating crystal motions
      gemMesh.rotation.x = elapsedTime * 0.6;
      gemMesh.rotation.y = elapsedTime * 0.8;
      gemMesh.position.y = 1.4 + Math.sin(elapsedTime * 1.8) * 0.12;

      aiNodeMesh.rotation.x = -elapsedTime * 0.5;
      aiNodeMesh.rotation.z = elapsedTime * 0.7;
      aiNodeMesh.position.y = -1.2 + Math.cos(elapsedTime * 1.5) * 0.1;

      // Particle subtle drift
      particles.rotation.y = elapsedTime * 0.02;

      // Camera smooth zoom & depth as user scrolls
      camera.position.z = 7.5 + scrollProgress * 1.5;
      camera.position.y = 0.2 - scrollProgress * 0.8;

      renderer.render(scene, camera);
    };

    animate();

    // ─── Resize Handler ────────────────────────────────────────────────────────
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // ─── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      bodyGeo.dispose();
      bodyMat.dispose();
      screenGeo.dispose();
      screenMat.dispose();
      borderGeo.dispose();
      borderMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      gemGeo.dispose();
      gemMat.dispose();
      aiNodeGeo.dispose();
      aiNodeMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      dashboardTexture.dispose();
    };
  }, [scrollRef, mouseRef]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        cursor: "grab",
        userSelect: "none",
      }}
    />
  );
}
