import { useEffect, useRef } from 'react';
import type { JSX } from 'react';
import * as THREE from 'three';

/**
 * Hero3D — a subtle 3D animated background for the hero: an electric-green
 * wireframe torus-knot + glowing core, over a drifting green particle field,
 * on a transparent canvas. (The AlphaQ emblem is overlaid in the hero markup.)
 */
export function Hero3D(): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const container = containerRef.current;
    if (!container) return;

    try {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl') || probe.getContext('experimental-webgl');
      if (!gl) return;
    } catch {
      return;
    }

    const GREEN = 0x1ee07a;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.pointerEvents = 'none';
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 6);

    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    const keyLight = new THREE.PointLight(GREEN, 1.6, 50);
    keyLight.position.set(4, 5, 5);
    const rimLight = new THREE.PointLight(0x0affc0, 0.8, 50);
    rimLight.position.set(-5, -3, 2);
    scene.add(ambient, keyLight, rimLight);

    // Wireframe torus-knot hero object.
    const knotGeo = new THREE.TorusKnotGeometry(1.35, 0.42, 140, 20, 2, 3);
    const knotMat = new THREE.MeshStandardMaterial({
      color: GREEN,
      emissive: GREEN,
      emissiveIntensity: 0.35,
      metalness: 0.6,
      roughness: 0.35,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    });
    const knot = new THREE.Mesh(knotGeo, knotMat);
    scene.add(knot);

    // Solid glowing inner icosahedron for depth.
    const coreGeo = new THREE.IcosahedronGeometry(0.55, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: GREEN,
      emissive: GREEN,
      emissiveIntensity: 0.9,
      metalness: 0.2,
      roughness: 0.5,
      flatShading: true,
      transparent: true,
      opacity: 0.85,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // Drifting particle field.
    const PARTICLE_COUNT = 320;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: GREEN,
      size: 0.05,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    const setSize = (): void => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    setSize();

    const resizeObserver = new ResizeObserver(() => {
      setSize();
      if (prefersReducedMotion) renderer.render(scene, camera);
    });
    resizeObserver.observe(container);

    let rafId = 0;
    const clock = new THREE.Clock();
    const renderFrame = (): void => {
      const t = clock.getElapsedTime();
      knot.rotation.x = t * 0.12;
      knot.rotation.y = t * 0.18;
      core.rotation.x = -t * 0.25;
      core.rotation.y = t * 0.3;
      particles.rotation.y = t * 0.03;
      camera.position.x = Math.sin(t * 0.15) * 0.35;
      camera.position.y = Math.cos(t * 0.12) * 0.25;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };

    if (prefersReducedMotion) {
      renderer.render(scene, camera);
    } else {
      const loop = (): void => {
        renderFrame();
        rafId = window.requestAnimationFrame(loop);
      };
      rafId = window.requestAnimationFrame(loop);
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      scene.clear();
      knotGeo.dispose();
      knotMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
      if (canvas.parentNode === container) container.removeChild(canvas);
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
}

export default Hero3D;
